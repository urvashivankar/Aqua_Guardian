// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AquaGuardianNFT
 * @dev ERC721 contract for Aqua Guardian Proof of Contribution NFTs
 */
contract AquaGuardianNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    event ProofMinted(address indexed recipient, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("Aqua Guardian Proof of Contribution", "AQUA-PROOF") {}

    /**
     * @dev Mints a new Proof of Contribution NFT.
     * @param recipient The address that will receive the NFT.
     * @param tokenURI The URI for the NFT metadata (IPFS or API).
     * @return The ID of the newly minted token.
     */
    function mintProof(address recipient, string memory tokenURI)
        public
        onlyOwner
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        emit ProofMinted(recipient, newItemId, tokenURI);

        return newItemId;
    }

    /**
     * @dev Returns the total number of tokens minted.
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
}
