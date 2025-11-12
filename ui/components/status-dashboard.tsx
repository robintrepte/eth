"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/hooks/use-wallet";
import { formatEther } from "@/lib/ethers-utils";
import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface ContractStatus {
  contractTotalTrades: bigint;
  contractTotalVolume: bigint;
  contractTotalProfit: bigint;
  userFlashLoansToday: bigint;
  userRemainingCooldown: bigint;
  userDailyLimit: bigint;
  canTrade: boolean;
  contractWETHBalance: bigint;
}

export function StatusDashboard() {
  const { contract, isConnected } = useWallet();
  const [status, setStatus] = useState<ContractStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!contract || !isConnected) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await contract.GetStatus();
      setStatus({
        contractTotalTrades: result.contractTotalTrades,
        contractTotalVolume: result.contractTotalVolume,
        contractTotalProfit: result.contractTotalProfit,
        userFlashLoansToday: result.userFlashLoansToday,
        userRemainingCooldown: result.userRemainingCooldown,
        userDailyLimit: result.userDailyLimit,
        canTrade: result.canTrade,
        contractWETHBalance: result.contractWETHBalance,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch status";
      setError(message);
      console.error("Error fetching status:", err);
    } finally {
      setLoading(false);
    }
  }, [contract, isConnected]);

  useEffect(() => {
    if (!contract || !isConnected) return;
    
    fetchStatus();
    
    // Get refresh interval from settings
    const getRefreshInterval = () => {
      const saved = localStorage.getItem("arbitrage-settings");
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          if (settings.autoRefresh !== false) {
            return (settings.refreshInterval || 10) * 1000;
          }
        } catch (e) {
          console.error("Error loading settings:", e);
        }
      }
      return 10000; // Default 10 seconds
    };

    let interval = setInterval(fetchStatus, getRefreshInterval());
    
    // Listen for settings changes
    const handleSettingsChange = () => {
      clearInterval(interval);
      interval = setInterval(fetchStatus, getRefreshInterval());
    };
    
    window.addEventListener("settings-changed", handleSettingsChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("settings-changed", handleSettingsChange);
    };
  }, [contract, isConnected, fetchStatus]);

  if (!isConnected) {
    return (
      <Alert>
        <AlertDescription>
          Please connect your wallet to view contract status.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading && !status) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!status) return null;

  const cooldownMinutes = Math.floor(Number(status.userRemainingCooldown) / 60);
  const cooldownSeconds = Number(status.userRemainingCooldown) % 60;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contract Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {formatEther(status.contractWETHBalance)} WETH
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Available for trading</p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{status.contractTotalTrades.toString()}</div>
          <p className="mt-1 text-xs text-muted-foreground">All-time trades executed</p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {formatEther(status.contractTotalVolume)} ETH
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Total trading volume</p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
            {formatEther(status.contractTotalProfit)} ETH
          </div>
          <p className="mt-1 text-xs text-muted-foreground">All-time profit</p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Flash Loans Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {status.userFlashLoansToday.toString()} / {status.userDailyLimit.toString()}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Daily limit usage</p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cooldown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {cooldownMinutes}m {cooldownSeconds}s
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Time until next flash loan</p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md sm:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle>Trading Status</CardTitle>
          <CardDescription>Current contract and user status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Can Trade</span>
            <Badge variant={status.canTrade ? "default" : "secondary"}>
              {status.canTrade ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Flash Loan Cooldown</span>
            <Badge variant={Number(status.userRemainingCooldown) === 0 ? "default" : "secondary"}>
              {Number(status.userRemainingCooldown) === 0 ? "Ready" : "Active"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

