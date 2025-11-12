// Contract configuration
// Try to get from environment variable, fallback to empty string
export const CONTRACT_ADDRESS = 
  (typeof window !== "undefined" 
    ? (window as { __CONTRACT_ADDRESS__?: string }).__CONTRACT_ADDRESS__ 
    : null) || 
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 
  "";
export const LOCALHOST_RPC = "http://127.0.0.1:8545";
export const CHAIN_ID = 31337; // Hardhat localhost

// Token addresses (mainnet)
export const TOKENS = {
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
} as const;

export const TOKEN_NAMES: Record<string, string> = {
  [TOKENS.WETH]: "WETH",
  [TOKENS.USDC]: "USDC",
  [TOKENS.USDT]: "USDT",
  [TOKENS.DAI]: "DAI",
  [TOKENS.WBTC]: "WBTC",
};

export const DEX_NAMES: Record<number, string> = {
  0: "Uniswap V2",
  1: "Sushiswap",
  2: "Uniswap V3",
  3: "Balancer",
};

