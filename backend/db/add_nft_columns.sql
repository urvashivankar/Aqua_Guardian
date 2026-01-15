-- Add NFT metadata columns to track minted proofs
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS nft_token_id bigint,
ADD COLUMN IF NOT EXISTS nft_tx_hash text;

ALTER TABLE public.cleanup_actions 
ADD COLUMN IF NOT EXISTS nft_token_id bigint,
ADD COLUMN IF NOT EXISTS nft_tx_hash text;

-- Add wallet address to users to enable NFT rewards
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS wallet_address text;
