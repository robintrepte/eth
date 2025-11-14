"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers } from "ethers";
import { connectWallet, getContract } from "@/lib/ethers-utils";

interface WalletContextType {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  isConnected: boolean;
  isOperator: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  contract: ethers.Contract | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isOperator, setIsOperator] = useState(false);

  const connect = async () => {
    try {
      const { provider: newProvider, signer: newSigner, address: newAddress } = await connectWallet();
      setProvider(newProvider);
      setSigner(newSigner);
      setAddress(newAddress);
      
      // Get contract address from environment or window
      const windowContract = typeof window !== "undefined"
        ? (window as { __CONTRACT_ADDRESS__?: string }).__CONTRACT_ADDRESS__
        : undefined;
      const contractAddress = 
        windowContract ||
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
        "";
      
      if (contractAddress) {
        // getContract now auto-detects version, but we can set it from env if available
        const windowVersion = typeof window !== "undefined"
          ? (window as { __CONTRACT_VERSION__?: string }).__CONTRACT_VERSION__
          : undefined;
        const envVersion = process.env.NEXT_PUBLIC_CONTRACT_VERSION;
        if (windowVersion || envVersion) {
          if (typeof window !== "undefined") {
            (window as { __CONTRACT_VERSION__?: string }).__CONTRACT_VERSION__ = windowVersion || envVersion || "v1";
          }
        }
        
        const contractInstance = await getContract(newSigner, contractAddress);
        setContract(contractInstance);
        
        // Check if user is operator
        try {
          const operator = await contractInstance.operator();
          setIsOperator(operator.toLowerCase() === newAddress.toLowerCase());
        } catch {
          setIsOperator(false);
        }
      } else {
        setIsOperator(false);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      // Re-throw with better error message for UI
      const err = error as { message?: string; code?: string; suggestion?: string };
      if (err.code === "METAMASK_NOT_INSTALLED") {
        throw new Error(
          "MetaMask is not installed. Please install the MetaMask browser extension to connect your wallet.\n\n" +
          "Visit https://metamask.io to download it."
        );
      }
      if (err.code === "USER_REJECTED" || err.code === "USER_REJECTED_NETWORK") {
        throw new Error(err.message || "Connection was rejected. Please try again and approve the request.");
      }
      throw error;
    }
  };

  const disconnect = () => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setIsOperator(false);
  };

  useEffect(() => {
    // Check if already connected
    if (typeof window !== "undefined") {
      const ethereum = (window as { ethereum?: { on?: (event: string, handler: (accounts: string[]) => void) => void; request?: unknown } }).ethereum;
      if (ethereum) {
        const checkConnection = async () => {
          try {
            const provider = new ethers.BrowserProvider(ethereum as ethers.Eip1193Provider);
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
              const signer = await provider.getSigner();
              setProvider(provider);
              setSigner(signer);
              setAddress(await signer.getAddress());
              
              // Get contract address
              const windowContract = (window as { __CONTRACT_ADDRESS__?: string }).__CONTRACT_ADDRESS__;
              const contractAddress = 
                windowContract ||
                process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
                "";
              
              if (contractAddress) {
                // Set version from env if available (getContract will auto-detect if not)
                const windowVersion = (window as { __CONTRACT_VERSION__?: string }).__CONTRACT_VERSION__;
                const envVersion = process.env.NEXT_PUBLIC_CONTRACT_VERSION;
                if (windowVersion || envVersion) {
                  (window as { __CONTRACT_VERSION__?: string }).__CONTRACT_VERSION__ = windowVersion || envVersion || "v1";
                }
                
                const contractInstance = await getContract(signer, contractAddress);
                setContract(contractInstance);
                
                // Check if user is operator
                try {
                  const operator = await contractInstance.operator();
                  const userAddress = await signer.getAddress();
                  setIsOperator(operator.toLowerCase() === userAddress.toLowerCase());
                } catch {
                  setIsOperator(false);
                }
              } else {
                setIsOperator(false);
              }
            }
          } catch (error) {
            console.error("Error checking connection:", error);
          }
        };
        checkConnection();

        // Listen for account changes
        if (ethereum.on) {
          ethereum.on("accountsChanged", (accounts: string[]) => {
            if (accounts.length === 0) {
              disconnect();
            } else {
              checkConnection();
            }
          });
        }
      }
    }
  }, []);

  // Update operator status when contract or address changes
  useEffect(() => {
    const checkOperator = async () => {
      if (contract && address) {
        try {
          const operator = await contract.operator();
          setIsOperator(operator.toLowerCase() === address.toLowerCase());
        } catch {
          setIsOperator(false);
        }
      } else {
        setIsOperator(false);
      }
    };
    
    checkOperator();
  }, [contract, address]);

  return (
    <WalletContext.Provider
      value={{
        address,
        provider,
        signer,
        isConnected: !!address,
        isOperator,
        connect,
        disconnect,
        contract,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

