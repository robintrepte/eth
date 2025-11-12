"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/use-wallet";
import { parseEther } from "@/lib/ethers-utils";
import { parseError } from "@/lib/error-handler";
import { addTransaction } from "@/components/transaction-history";
import { GasEstimate } from "@/components/gas-estimate";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ArbitrageExecute() {
  const { contract, isConnected, isOperator } = useWallet();
  const [maxAmount, setMaxAmount] = useState("1.0");
  const [gasLimit, setGasLimit] = useState("500000");
  const [executing, setExecuting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleExecute = async () => {
    if (!contract || !isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!maxAmount || parseFloat(maxAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!gasLimit || parseInt(gasLimit) <= 0) {
      toast.error("Please enter a valid gas limit");
      return;
    }

    try {
      setExecuting(true);
      const tx = await contract.AutoArbitrage(
        parseEther(maxAmount),
        gasLimit
      );
      
      // Add to transaction history
      addTransaction({
        hash: tx.hash,
        type: "arbitrage",
        status: "pending",
        timestamp: Date.now(),
        amount: parseEther(maxAmount).toString(),
      });

      toast.info("Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      
      // Update transaction status
      addTransaction({
        hash: tx.hash,
        type: "arbitrage",
        status: receipt.status === 1 ? "confirmed" : "failed",
        timestamp: Date.now(),
        amount: parseEther(maxAmount).toString(),
        gasUsed: receipt.gasUsed?.toString(),
      });

      toast.success("Arbitrage executed successfully!");
      setShowConfirm(false);
      console.log("Transaction receipt:", receipt);
    } catch (error) {
      console.error("Execute error:", error);
      const parsed = parseError(error);
      toast.error(parsed.message, {
        description: parsed.suggestion,
      });
    } finally {
      setExecuting(false);
    }
  };

  const { isOperator } = useWallet();

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execute Arbitrage</CardTitle>
          <CardDescription>Connect your wallet to execute arbitrage trades</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isOperator) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execute Arbitrage</CardTitle>
          <CardDescription>Operator access required</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Only the contract operator (deployer) can execute arbitrage trades.
              Please connect with the account that deployed the contract.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Zap className="h-5 w-5 text-primary" />
          Execute Arbitrage
        </CardTitle>
        <CardDescription>
          Automatically find and execute profitable arbitrage opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>Operator Only:</strong> Only the contract deployer (operator) can execute arbitrage trades.
              </p>
              <p className="text-xs">
                This function will automatically search for the best opportunity and execute it if profitable.
                It considers gas costs, flash loan premiums, and minimum profit thresholds.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="max-amount">Max Amount (ETH)</Label>
          <Input
            id="max-amount"
            type="number"
            step="0.1"
            placeholder="1.0"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            disabled={executing}
          />
          <p className="text-xs text-muted-foreground">
            Maximum amount to trade. The bot will find the optimal amount within this limit.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gas-limit">Estimated Gas Limit</Label>
          <Input
            id="gas-limit"
            type="number"
            placeholder="500000"
            value={gasLimit}
            onChange={(e) => setGasLimit(e.target.value)}
            disabled={executing}
          />
          <p className="text-xs text-muted-foreground">
            Recommended: 500000-800000
          </p>
        </div>

        {gasLimit && parseInt(gasLimit) > 0 && (
          <GasEstimate gasLimit={gasLimit} />
        )}

        <Button
          onClick={() => setShowConfirm(true)}
          disabled={executing || !maxAmount || !gasLimit}
          className="w-full"
          size="lg"
        >
          {executing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            "Execute Arbitrage"
          )}
        </Button>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Arbitrage Execution</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  You are about to execute an arbitrage trade with a maximum amount of <strong>{maxAmount} ETH</strong>.
                </p>
                <p>
                  This will automatically:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                  <li>Search for profitable opportunities across all DEXes</li>
                  <li>Calculate optimal trade amount and route</li>
                  <li>Execute the trade if profit exceeds gas costs</li>
                  <li>Use flash loans if needed (or own liquidity if available)</li>
                </ul>
                <p className="mt-2">
                  Estimated gas limit: <strong>{parseInt(gasLimit).toLocaleString()}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Only proceeds if a profitable opportunity is found.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleExecute}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

