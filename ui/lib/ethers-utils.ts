import { ethers } from "ethers";
import contractABI from "./contract-abi.json";
import contractABIV2 from "./contract-abi-v2.json";
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

// Helper function to detect contract version by trying V2-specific function
async function detectContractVersion(
  provider: ethers.Provider,
  address: string
): Promise<"v1" | "v2"> {
  try {
    // Try to call a V2-specific function (isTriangleArbEnabled only exists in V2)
    const v2Interface = new ethers.Interface(contractABIV2);
    const data = v2Interface.encodeFunctionData("isTriangleArbEnabled", []);
    try {
      const result = await provider.call({ to: address, data });
      // If call succeeds (doesn't revert), it's V2
      if (result && result !== "0x") {
        return "v2";
      }
      return "v1";
    } catch (error: unknown) {
      // If call reverts with "Function not found" or similar, it's V1
      const err = error as { message?: string; data?: string };
      if (err.message?.includes("not found") || err.message?.includes("revert") || err.data) {
        return "v1";
      }
      // Other errors, try V1
      return "v1";
    }
  } catch {
    // Fallback to V1 if detection fails
    return "v1";
  }
}

export async function getContract(
  signerOrProvider: ethers.Signer | ethers.Provider,
  contractAddress?: string
): Promise<ethers.Contract> {
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
  
  // Get provider from signer or use the one passed
  const provider = "provider" in signerOrProvider 
    ? signerOrProvider.provider 
    : (signerOrProvider as ethers.Provider);
  
  if (!provider) {
    throw new Error("Provider required to detect contract version");
  }
  
  // Try to get version from saved sources first
  const contractVersion = typeof window !== "undefined"
    ? (window as { __CONTRACT_VERSION__?: string }).__CONTRACT_VERSION__
    : undefined;
  const envVersion = process.env.NEXT_PUBLIC_CONTRACT_VERSION;
  let version = contractVersion || envVersion;
  
  // If no version saved, detect it automatically
  if (!version) {
    version = await detectContractVersion(provider, address);
    // Save detected version for future use
    if (typeof window !== "undefined") {
      (window as { __CONTRACT_VERSION__?: string }).__CONTRACT_VERSION__ = version;
    }
  }
  
  // Use V2 ABI if version is v2, otherwise use V1
  const abi = version === "v2" ? contractABIV2 : contractABI;
  
  return new ethers.Contract(address, abi, signerOrProvider);
}

export async function connectWallet() {
  if (typeof window === "undefined") {
    throw new Error("MetaMask not available");
  }
  const ethereum = (window as { ethereum?: unknown }).ethereum;
  if (!ethereum) {
    const error = new Error("MetaMask not installed");
    (error as { code?: string; suggestion?: string }).code = "METAMASK_NOT_INSTALLED";
    (error as { code?: string; suggestion?: string }).suggestion = 
      "Please install MetaMask browser extension to connect your wallet. " +
      "Visit https://metamask.io to download it.";
    throw error;
  }

  const provider = new ethers.BrowserProvider(ethereum as ethers.Eip1193Provider);
  
  try {
    // Request account access
    await provider.send("eth_requestAccounts", []);
  } catch (error) {
    const err = error as { code?: number; message?: string };
    if (err.code === 4001) {
      const userRejected = new Error("User rejected the connection request");
      (userRejected as { code?: string; suggestion?: string }).code = "USER_REJECTED";
      (userRejected as { code?: string; suggestion?: string }).suggestion = 
        "Please approve the connection request in MetaMask to continue.";
      throw userRejected;
    }
    throw error;
  }
  
  // Check if we're on the correct network
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) {
    // First, try to add the network (in case it doesn't exist)
    // Then switch to it
    try {
      // Try to add the network first (this is idempotent - won't error if it exists)
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
    } catch (addError) {
      const addErr = addError as { code?: number; message?: string };
      // If user rejected, throw error
      if (addErr.code === 4001) {
        const userRejected = new Error("User rejected adding the network");
        (userRejected as { code?: string; suggestion?: string }).code = "USER_REJECTED_NETWORK";
        (userRejected as { code?: string; suggestion?: string }).suggestion = 
          "Please approve adding the Hardhat Local network in MetaMask to continue.";
        throw userRejected;
      }
      // If network already exists (code -32602 or other), that's fine, continue to switch
      if (addErr.code !== -32602 && !addErr.message?.includes("already exists")) {
        // Only throw if it's not a "network already exists" error
        console.warn("Error adding network (may already exist):", addErr);
      }
    }
    
    // Now try to switch to the network
    try {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: `0x${CHAIN_ID.toString(16)}` },
      ]);
    } catch (switchError) {
      const err = switchError as { code?: number; message?: string };
      if (err.code === 4001) {
        const userRejected = new Error("User rejected switching networks");
        (userRejected as { code?: string; suggestion?: string }).code = "USER_REJECTED_NETWORK";
        (userRejected as { code?: string; suggestion?: string }).suggestion = 
          "Please approve switching to Hardhat Local network in MetaMask to continue.";
        throw userRejected;
      }
      // If network doesn't exist (4902), we already tried to add it, so this is unexpected
      if (err.code === 4902) {
        const networkError = new Error("Hardhat Local network not found. Please add it manually in MetaMask.");
        (networkError as { code?: string; suggestion?: string }).code = "NETWORK_NOT_FOUND";
        (networkError as { code?: string; suggestion?: string }).suggestion = 
          `Add network manually: Name: "Hardhat Local", RPC: "${LOCALHOST_RPC}", Chain ID: ${CHAIN_ID}`;
        throw networkError;
      }
      throw switchError;
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

