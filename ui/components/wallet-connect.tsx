"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { formatEther, getLocalhostProvider } from "@/lib/ethers-utils";
import { CopyButton } from "@/components/copy-button";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { parseError } from "@/lib/error-handler";

export function WalletConnect() {
  const { address, isConnected, connect, disconnect, provider, isOperator } = useWallet();
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    if (isConnected && provider && address) {
      const updateBalance = async () => {
        try {
          // Check which network we're on
          const network = await provider.getNetwork();
          console.log("Current network:", network.chainId.toString());
          
          const bal = await provider.getBalance(address);
          const balanceStr = formatEther(bal);
          setBalance(balanceStr);
          
          // Log for debugging
          if (parseFloat(balanceStr) === 0) {
            console.warn("Balance is 0. Make sure you're on Hardhat Local network (Chain ID: 31337)");
            console.log("Current Chain ID:", network.chainId.toString());
            console.log("Expected Chain ID: 31337");
          }
        } catch (error) {
          console.error("Error fetching balance:", error);
          // Try to get balance from localhost directly as fallback
          try {
            const localProvider = getLocalhostProvider();
            const bal = await localProvider.getBalance(address);
            setBalance(formatEther(bal));
            console.log("Fetched balance from localhost directly:", formatEther(bal));
          } catch (fallbackError) {
            console.error("Fallback balance fetch also failed:", fallbackError);
          }
        }
      };
      updateBalance();
      const interval = setInterval(updateBalance, 5000);
      return () => clearInterval(interval);
    } else {
      setBalance("0");
    }
  }, [isConnected, provider, address]);

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden flex-col items-end gap-1 sm:flex">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Badge>
            {isOperator && (
              <Badge variant="default" className="text-xs">
                Operator
              </Badge>
            )}
            <CopyButton text={address || ""} size="icon" variant="ghost" />
          </div>
          <span className="text-xs text-muted-foreground">
            {parseFloat(balance).toFixed(4)} ETH
          </span>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <Badge variant="outline" className="font-mono text-xs">
            {address?.slice(0, 4)}...{address?.slice(-3)}
          </Badge>
          {isOperator && (
            <Badge variant="default" className="text-xs">
              OP
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={disconnect} className="text-xs sm:text-sm">
          <span className="hidden sm:inline">Disconnect</span>
          <span className="sm:hidden">DC</span>
        </Button>
      </div>
    );
  }

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Connect error:", error);
      const parsed = parseError(error);
      toast.error(parsed.message, {
        description: parsed.suggestion,
        duration: 5000,
      });
    }
  };

  return (
    <Button onClick={handleConnect} size="sm" className="text-xs sm:text-sm">
      <span className="hidden sm:inline">Connect Wallet</span>
      <span className="sm:hidden">Connect</span>
    </Button>
  );
}

