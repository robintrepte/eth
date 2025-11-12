"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { formatEther } from "@/lib/ethers-utils";
import { useState, useEffect } from "react";
import { Copy, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  hash: string;
  type: "deposit" | "withdraw" | "arbitrage" | "deploy";
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
  amount?: string;
  gasUsed?: string;
}

export function TransactionHistory() {
  const { provider, isConnected } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadTransactions = () => {
    const saved = localStorage.getItem("arbitrage-transactions");
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading transactions:", e);
      }
    }
  };

  useEffect(() => {
    loadTransactions();
    
    // Listen for new transactions
    const handleStorageChange = () => {
      loadTransactions();
    };
    
    // Listen for custom event when transactions are added
    window.addEventListener("transaction-added", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("transaction-added", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const copyToClipboard = (text: string, hash: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(hash);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      confirmed: "default",
      pending: "secondary",
      failed: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Connect your wallet to view transaction history</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent transactions will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No transactions yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Transaction History</CardTitle>
            <CardDescription className="text-sm">Recent contract interactions</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadTransactions}
            title="Refresh"
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {transactions.slice(0, 10).map((tx) => (
            <div
              key={tx.hash}
              className="flex flex-col gap-2 rounded-lg border p-3 transition-all hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-0"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {getStatusIcon(tx.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium capitalize text-sm">{tx.type}</span>
                    {getStatusBadge(tx.status)}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <code className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-[200px] font-mono">
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => copyToClipboard(tx.hash, tx.hash)}
                    >
                      {copiedHash === tx.hash ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  {tx.amount && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Amount: <span className="font-medium text-foreground">{formatEther(tx.amount)} ETH</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground shrink-0 sm:text-right">
                {new Date(tx.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to add transaction (call this from other components)
export function addTransaction(tx: Transaction) {
  const saved = localStorage.getItem("arbitrage-transactions");
  let txs: Transaction[] = saved ? JSON.parse(saved) : [];
  
  // Update existing transaction if hash matches, otherwise add new
  const existingIndex = txs.findIndex(t => t.hash === tx.hash);
  if (existingIndex >= 0) {
    txs[existingIndex] = tx; // Update existing
  } else {
    txs.unshift(tx); // Add new
  }
  
  txs = txs.slice(0, 50); // Keep last 50
  localStorage.setItem("arbitrage-transactions", JSON.stringify(txs));
  
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent("transaction-added"));
}

