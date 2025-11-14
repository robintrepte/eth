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
  contractTriangleArbs?: bigint; // V2 only
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
      
      // Check if contract has code (is deployed)
      const code = await contract.runner?.provider?.getCode(contract.target);
      if (!code || code === "0x") {
        setError("Contract not deployed. Please deploy the contract first in the Deploy tab.");
        setLoading(false);
        return;
      }
      
      const result = await contract.GetStatus();
      
      // With correct ABI, we can access by name directly
      // V2 returns 9 values, V1 returns 8 values
      const contractTotalTrades = result.contractTotalTrades || BigInt(0);
      const contractTotalVolume = result.contractTotalVolume || BigInt(0);
      const contractTotalProfit = result.contractTotalProfit || BigInt(0);
      const contractTriangleArbs = result.contractTriangleArbs !== undefined ? result.contractTriangleArbs : undefined; // V2 only, may be undefined
      const userFlashLoansToday = result.userFlashLoansToday || BigInt(0);
      const userRemainingCooldown = result.userRemainingCooldown || BigInt(0);
      const userDailyLimit = result.userDailyLimit || BigInt(0);
      const canTrade = result.canTrade !== undefined ? result.canTrade : false;
      const contractWETHBalance = result.contractWETHBalance || BigInt(0);
      
      console.log("GetStatus parsed:", {
        contractTotalTrades: contractTotalTrades.toString(),
        contractTotalVolume: contractTotalVolume.toString(),
        contractTotalProfit: contractTotalProfit.toString(),
        contractTriangleArbs: contractTriangleArbs !== undefined ? contractTriangleArbs.toString() : "N/A (V1)",
        userFlashLoansToday: userFlashLoansToday.toString(),
        userRemainingCooldown: userRemainingCooldown.toString(),
        userDailyLimit: userDailyLimit.toString(),
        canTrade,
        contractWETHBalance: contractWETHBalance.toString(),
        contractWETHBalanceFormatted: formatEther(contractWETHBalance),
      });
      
      setStatus({
        contractTotalTrades,
        contractTotalVolume,
        contractTotalProfit,
        contractTriangleArbs: contractTriangleArbs !== undefined && contractTriangleArbs > BigInt(0) ? contractTriangleArbs : undefined, // Only set if > 0 (V2)
        userFlashLoansToday,
        userRemainingCooldown,
        userDailyLimit,
        canTrade,
        contractWETHBalance,
      });
    } catch (err) {
      const error = err as { code?: string; message?: string; data?: string };
      // Check if it's a "no code" error
      if (error.code === "BAD_DATA" || error.data === "0x" || error.message?.includes("0x")) {
        setError("Contract not deployed. Please deploy the contract first in the Deploy tab.");
      } else {
        const message = err instanceof Error ? err.message : "Failed to fetch status";
        setError(message);
      }
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
    
    // Also listen for deposit/withdraw events to refresh immediately
    const handleDepositWithdraw = () => {
      // Refresh immediately
      fetchStatus();
    };
    window.addEventListener("deposit-complete", handleDepositWithdraw);
    window.addEventListener("withdraw-complete", handleDepositWithdraw);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("settings-changed", handleSettingsChange);
      window.removeEventListener("deposit-complete", handleDepositWithdraw);
      window.removeEventListener("withdraw-complete", handleDepositWithdraw);
    };
  }, [contract, isConnected, fetchStatus]);

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-2">
          <Alert>
            <AlertDescription className="text-center">
              Please connect your wallet to view contract status and statistics.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
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

      {status.contractTriangleArbs !== undefined && (
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Triangle Arbs</CardTitle>
            <Badge variant="secondary" className="text-xs">V2</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {status.contractTriangleArbs?.toString() || "0"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">3-leg arbitrage trades</p>
          </CardContent>
        </Card>
      )}

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

