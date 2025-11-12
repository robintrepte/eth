import { ethers } from "ethers";
import contractABI from "./contract-abi.json";
import { LOCALHOST_RPC, CHAIN_ID } from "./contract-config";

export function getProvider() {
  if (typeof window === "undefined") return null;
  const ethereum = (window as { ethereum?: unknown }).ethereum;
  if (!ethereum) return null;
  return new ethers.BrowserProvider(ethereum as ethers.Eip1193Provider);
}

export function getLocalhostProvider() {
  return new ethers.JsonRpcProvider(LOCALHOST_RPC);
}

export function getContract(signerOrProvider: ethers.Signer | ethers.Provider, contractAddress?: string) {
  // Get contract address from parameter, environment, or window
  const windowContract = typeof window !== "undefined" 
    ? (window as { __CONTRACT_ADDRESS__?: string }).__CONTRACT_ADDRESS__
    : undefined;
  const address = 
    contractAddress ||
    windowContract ||
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "";
    
  if (!address) {
    throw new Error("Contract address not configured. Please deploy the contract first.");
  }
  return new ethers.Contract(address, contractABI, signerOrProvider);
}

export async function connectWallet() {
  if (typeof window === "undefined") {
    throw new Error("MetaMask not available");
  }
  const ethereum = (window as { ethereum?: unknown }).ethereum;
  if (!ethereum) {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider(ethereum as ethers.Eip1193Provider);
  
  // Request account access
  await provider.send("eth_requestAccounts", []);
  
  // Check if we're on the correct network
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) {
    // Try to switch to localhost
    try {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: `0x${CHAIN_ID.toString(16)}` },
      ]);
    } catch (switchError) {
      const err = switchError as { code?: number };
      // If the network doesn't exist, add it
      if (err.code === 4902) {
        await provider.send("wallet_addEthereumChain", [
          {
            chainId: `0x${CHAIN_ID.toString(16)}`,
            chainName: "Hardhat Local",
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [LOCALHOST_RPC],
          },
        ]);
      } else {
        throw switchError;
      }
    }
  }

  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}

export function formatEther(value: bigint | string): string {
  return ethers.formatEther(value);
}

export function parseEther(value: string): bigint {
  return ethers.parseEther(value);
}

export function formatUnits(value: bigint | string, decimals: number = 18): string {
  return ethers.formatUnits(value, decimals);
}

export function parseUnits(value: string, decimals: number = 18): bigint {
  return ethers.parseUnits(value, decimals);
}

