"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { formatEther } from "@/lib/ethers-utils";
import { CopyButton } from "@/components/copy-button";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export function WalletConnect() {
  const { address, isConnected, connect, disconnect, provider, isOperator } = useWallet();
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    if (isConnected && provider) {
      const updateBalance = async () => {
        try {
          const bal = await provider.getBalance(address!);
          setBalance(formatEther(bal));
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      };
      updateBalance();
      const interval = setInterval(updateBalance, 5000);
      return () => clearInterval(interval);
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

  return (
    <Button onClick={connect} size="sm" className="text-xs sm:text-sm">
      <span className="hidden sm:inline">Connect Wallet</span>
      <span className="sm:hidden">Connect</span>
    </Button>
  );
}

