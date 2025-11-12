"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/hooks/use-wallet";
import { formatEther } from "@/lib/ethers-utils";
import { useState, useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Loader2, Zap } from "lucide-react";

interface GasEstimateProps {
  gasLimit: string;
  showCard?: boolean;
}

export function GasEstimate({ gasLimit, showCard = false }: GasEstimateProps) {
  const { provider } = useWallet();
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(true);
  const [estimatedCost, setEstimatedCost] = useState<string | null>(null);

  useEffect(() => {
    const fetchGasPrice = async () => {
      if (!provider) {
        setLoading(false);
        return;
      }

      try {
        const feeData = await provider.getFeeData();
        if (feeData.gasPrice) {
          setGasPrice(feeData.gasPrice);
          const cost = feeData.gasPrice * BigInt(gasLimit || "0");
          setEstimatedCost(formatEther(cost));
        }
      } catch (error) {
        console.error("Error fetching gas price:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [provider, gasLimit]);

  if (loading) {
    return showCard ? (
      <Card>
        <CardContent className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    ) : (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Calculating gas...</span>
      </div>
    );
  }

  if (!estimatedCost) {
    return null;
  }

  const content = (
    <div className="space-y-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
        <span className="text-muted-foreground">Estimated Gas Cost:</span>
        <span className="font-semibold text-foreground">{estimatedCost} ETH</span>
      </div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
        <span>Gas Limit: {parseInt(gasLimit).toLocaleString()}</span>
        <span>Gas Price: {gasPrice ? formatEther(gasPrice) : "N/A"} ETH</span>
      </div>
    </div>
  );

  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Gas Estimation
          </CardTitle>
          <CardDescription>Estimated transaction cost</CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return <Alert>{content}</Alert>;
}

