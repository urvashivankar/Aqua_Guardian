import json
import os
from pathlib import Path
from dotenv import load_dotenv
from web3 import Web3
from .web3_client import w3, account, BLOCKCHAIN_AVAILABLE

load_dotenv()

# Initialize contracts if blockchain is available
if BLOCKCHAIN_AVAILABLE:
    try:
        # Load compiled contract ABIs
        REGISTRY_ABI_PATH = Path(__file__).parent / "PollutionRegistry_abi.json"
        NFT_ABI_PATH = Path(__file__).parent / "AquaGuardianNFT_abi.json"
        
        # 1. Initialize PollutionRegistry
        if REGISTRY_ABI_PATH.is_file():
            with open(REGISTRY_ABI_PATH) as f:
                registry_abi = json.load(f)
            REGISTRY_ADDRESS = os.getenv('CONTRACT_ADDRESS')
            if REGISTRY_ADDRESS:
                registry_contract = w3.eth.contract(address=Web3.toChecksumAddress(REGISTRY_ADDRESS), abi=registry_abi)
            else:
                print("WARNING: CONTRACT_ADDRESS not set.")
                registry_contract = None
        else:
            registry_contract = None

        # 2. Initialize AquaGuardianNFT
        if NFT_ABI_PATH.is_file():
            with open(NFT_ABI_PATH) as f:
                nft_abi = json.load(f)
            NFT_ADDRESS = os.getenv('NFT_CONTRACT_ADDRESS')
            if NFT_ADDRESS:
                nft_contract = w3.eth.contract(address=Web3.toChecksumAddress(NFT_ADDRESS), abi=nft_abi)
            else:
                print("WARNING: NFT_CONTRACT_ADDRESS not set.")
                nft_contract = None
        else:
            nft_contract = None

        if not registry_contract and not nft_contract:
            BLOCKCHAIN_AVAILABLE = False

    except Exception as e:
        print(f"WARNING: Failed to initialize contracts: {e}")
        BLOCKCHAIN_AVAILABLE = False

def log_report(report_hash: str, report_id: str, ai_decision: str, reviewer_decision: str, location_hash: str) -> tuple:
    """Send a transaction to log a new pollution report with metadata."""
    if not BLOCKCHAIN_AVAILABLE or not registry_contract:
        print(f"MOCK: Blockchain unavailable for logging.")
        return 0, "0x_mock_tx_hash"

    try:
        txn = registry_contract.functions.logReport(
            Web3.toBytes(hexstr=report_hash),
            report_id,
            ai_decision,
            reviewer_decision,
            Web3.toBytes(hexstr=location_hash)
        ).buildTransaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address),
            'gas': 500000,
            'gasPrice': w3.toWei('5', 'gwei')
        })
        signed_txn = account.sign_transaction(txn)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        logs = registry_contract.events.ReportLogged().processReceipt(receipt)
        return logs[0]['args']['id'], tx_hash.hex()
    except Exception as e:
        print(f"ERROR: log_report failed: {e}")
        raise e

def mint_contribution_proof(recipient_address: str, metadata_uri: str) -> tuple:
    """Mint a Proof of Contribution NFT for a user."""
    if not BLOCKCHAIN_AVAILABLE or not nft_contract:
        print(f"MOCK: Blockchain unavailable for NFT minting.")
        return 0, "0x_mock_nft_tx_hash"

    try:
        txn = nft_contract.functions.mintProof(
            Web3.toChecksumAddress(recipient_address),
            metadata_uri
        ).buildTransaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address),
            'gas': 300000,
            'gasPrice': w3.toWei('5', 'gwei')
        })
        signed_txn = account.sign_transaction(txn)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        logs = nft_contract.events.ProofMinted().processReceipt(receipt)
        if not logs:
            raise RuntimeError('No ProofMinted event found')
        return logs[0]['args']['tokenId'], tx_hash.hex()
    except Exception as e:
        print(f"ERROR: mint_contribution_proof failed: {e}")
        raise e

def verify_report(report_id: int) -> None:
    """Verify a report by its ID."""
    if not BLOCKCHAIN_AVAILABLE or not registry_contract:
        return

    txn = registry_contract.functions.verifyReport(report_id).buildTransaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 150000,
        'gasPrice': w3.toWei('5', 'gwei')
    })
    signed_txn = account.sign_transaction(txn)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)

def get_report(report_id: int):
    if not BLOCKCHAIN_AVAILABLE or not registry_contract:
        return {"id": report_id, "mock": True}
    return registry_contract.functions.getReport(report_id).call()

def report_exists(report_hash: str):
    if not BLOCKCHAIN_AVAILABLE or not registry_contract:
        return False, 0
    return registry_contract.functions.reportHashExists(Web3.toBytes(hexstr=report_hash)).call()
