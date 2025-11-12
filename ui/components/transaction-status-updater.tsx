"use client";

import { useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { addTransaction } from "./transaction-history";

/**
 * Component that polls transaction status and updates history
 * Should be included in the layout to run in background
 */
export function TransactionStatusUpdater() {
  const { provider } = useWallet();

  useEffect(() => {
    if (!provider) return;

    const updatePendingTransactions = async () => {
      const saved = localStorage.getItem("arbitrage-transactions");
      if (!saved) return;

      try {
        const txs = JSON.parse(saved);
        const pendingTxs = txs.filter((tx: any) => tx.status === "pending");

        for (const tx of pendingTxs) {
          try {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            if (receipt) {
              // Transaction confirmed
              addTransaction({
                ...tx,
                status: receipt.status === 1 ? "confirmed" : "failed",
                gasUsed: receipt.gasUsed?.toString(),
              });
            }
          } catch (error) {
            // Transaction might still be pending, ignore
          }
        }
      } catch (error) {
        console.error("Error updating transaction status:", error);
      }
    };

    // Update every 5 seconds
    const interval = setInterval(updatePendingTransactions, 5000);
    updatePendingTransactions(); // Run immediately

    return () => clearInterval(interval);
  }, [provider]);

  return null; // This component doesn't render anything
}

