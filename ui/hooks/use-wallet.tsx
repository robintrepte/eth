"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers } from "ethers";
import { connectWallet, getLocalhostProvider, getContract } from "@/lib/ethers-utils";

interface WalletContextType {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  isConnected: boolean;
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

  const connect = async () => {
    try {
      const { provider: newProvider, signer: newSigner, address: newAddress } = await connectWallet();
      setProvider(newProvider);
      setSigner(newSigner);
      setAddress(newAddress);
      
      // Get contract address from environment or window
      const contractAddress = 
        (typeof window !== "undefined" && (window as any).__CONTRACT_ADDRESS__) ||
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
        "";
      
      if (contractAddress) {
        const contractInstance = getContract(newSigner, contractAddress);
        setContract(contractInstance);
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  };

  const disconnect = () => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
  };

  useEffect(() => {
    // Check if already connected
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const checkConnection = async () => {
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            setProvider(provider);
            setSigner(signer);
            setAddress(await signer.getAddress());
            
            // Get contract address
            const contractAddress = 
              (window as any).__CONTRACT_ADDRESS__ ||
              process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
              "";
            
            if (contractAddress) {
              setContract(getContract(signer, contractAddress));
            }
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      };
      checkConnection();

      // Listen for account changes
      (window as any).ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          checkConnection();
        }
      });
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        provider,
        signer,
        isConnected: !!address,
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

