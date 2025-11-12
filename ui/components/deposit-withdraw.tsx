"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/use-wallet";
import { parseEther, formatEther } from "@/lib/ethers-utils";
import { parseError, formatError } from "@/lib/error-handler";
import { addTransaction } from "@/components/transaction-history";
import { GasEstimate } from "@/components/gas-estimate";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

export function DepositWithdraw() {
  const { contract, isConnected, provider } = useWallet();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showDepositConfirm, setShowDepositConfirm] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  const handleDeposit = async () => {
    if (!contract || !isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setDepositing(true);
      const tx = await contract.depositETH({
        value: parseEther(depositAmount),
      });
      
      // Add to transaction history
      addTransaction({
        hash: tx.hash,
        type: "deposit",
        status: "pending",
        timestamp: Date.now(),
        amount: parseEther(depositAmount).toString(),
      });

      toast.info("Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      
      // Update transaction status
      addTransaction({
        hash: tx.hash,
        type: "deposit",
        status: receipt.status === 1 ? "confirmed" : "failed",
        timestamp: Date.now(),
        amount: parseEther(depositAmount).toString(),
        gasUsed: receipt.gasUsed?.toString(),
      });

      toast.success(`Successfully deposited ${depositAmount} ETH`);
      setDepositAmount("");
      setShowDepositConfirm(false);
    } catch (error: any) {
      console.error("Deposit error:", error);
      const parsed = parseError(error);
      toast.error(parsed.message, {
        description: parsed.suggestion,
      });
    } finally {
      setDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setWithdrawing(true);
      const tx = await contract.withdrawETH(parseEther(withdrawAmount));
      
      // Add to transaction history
      addTransaction({
        hash: tx.hash,
        type: "withdraw",
        status: "pending",
        timestamp: Date.now(),
        amount: parseEther(withdrawAmount).toString(),
      });

      toast.info("Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      
      // Update transaction status
      addTransaction({
        hash: tx.hash,
        type: "withdraw",
        status: receipt.status === 1 ? "confirmed" : "failed",
        timestamp: Date.now(),
        amount: parseEther(withdrawAmount).toString(),
        gasUsed: receipt.gasUsed?.toString(),
      });

      toast.success(`Successfully withdrew ${withdrawAmount} ETH`);
      setWithdrawAmount("");
      setShowWithdrawConfirm(false);
    } catch (error: any) {
      console.error("Withdraw error:", error);
      const parsed = parseError(error);
      toast.error(parsed.message, {
        description: parsed.suggestion,
      });
    } finally {
      setWithdrawing(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deposit & Withdraw</CardTitle>
          <CardDescription>Connect your wallet to manage funds</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle>Deposit ETH</CardTitle>
          <CardDescription>Deposit ETH to the contract (converts to WETH)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Amount (ETH)</Label>
            <Input
              id="deposit-amount"
              type="number"
              step="0.001"
              placeholder="0.0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={depositing}
            />
          </div>
          {depositAmount && parseFloat(depositAmount) > 0 && (
            <GasEstimate gasLimit="100000" />
          )}
          <Button
            onClick={() => setShowDepositConfirm(true)}
            disabled={depositing || !depositAmount}
            className="w-full"
          >
            {depositing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Depositing...
              </>
            ) : (
              "Deposit"
            )}
          </Button>
          <AlertDialog open={showDepositConfirm} onOpenChange={setShowDepositConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deposit</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to deposit {depositAmount} ETH to the contract.
                  This will convert your ETH to WETH. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeposit}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle>Withdraw ETH</CardTitle>
          <CardDescription>Withdraw WETH from the contract (converts to ETH)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Amount (ETH)</Label>
            <Input
              id="withdraw-amount"
              type="number"
              step="0.001"
              placeholder="0.0"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={withdrawing}
            />
          </div>
          {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
            <GasEstimate gasLimit="100000" />
          )}
          <Button
            onClick={() => setShowWithdrawConfirm(true)}
            disabled={withdrawing || !withdrawAmount}
            variant="outline"
            className="w-full"
          >
            {withdrawing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Withdrawing...
              </>
            ) : (
              "Withdraw"
            )}
          </Button>
          <AlertDialog open={showWithdrawConfirm} onOpenChange={setShowWithdrawConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Withdraw</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to withdraw {withdrawAmount} ETH from the contract.
                  This will convert WETH back to ETH. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleWithdraw}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

