"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/use-wallet";
import { parseEther, formatEther } from "@/lib/ethers-utils";
import { parseError } from "@/lib/error-handler";
import { DEX_NAMES, TOKEN_NAMES } from "@/lib/contract-config";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OpportunitySearch() {
  const { contract, isConnected } = useWallet();
  const [searchAmount, setSearchAmount] = useState("1.0");
  const [searching, setSearching] = useState(false);
  const [opportunity, setOpportunity] = useState<{
    isValid: boolean;
    tokenA: string;
    tokenB: string;
    tokenIntermediate?: string;
    amount: bigint;
    expectedProfit: bigint;
    dexIn: number;
    dexOut: number;
    dexIntermediate?: number;
    minOutLeg1: bigint;
    minOutLeg2: bigint;
    minOutLeg3?: bigint;
    gasEstimate: bigint;
    isTriangleArb?: boolean;
  } | null>(null);

  const handleSearch = async () => {
    if (!contract || !isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!searchAmount || parseFloat(searchAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setSearching(true);
      setOpportunity(null);
      const result = await contract.StartNative(parseEther(searchAmount));
      
      // Check if V2 (has tokenIntermediate)
      const isV2 = result.tokenIntermediate && result.tokenIntermediate !== "0x0000000000000000000000000000000000000000";
      
      const opp = {
        isValid: result.bestOpportunity.isValid,
        tokenA: result.tokenA,
        tokenB: result.tokenB,
        tokenIntermediate: isV2 ? result.tokenIntermediate : undefined,
        amount: result.amount,
        expectedProfit: result.bestOpportunity.expectedProfit,
        dexIn: result.bestOpportunity.dexIn,
        dexOut: result.bestOpportunity.dexOut,
        dexIntermediate: isV2 && result.bestOpportunity.dexIntermediate !== undefined 
          ? result.bestOpportunity.dexIntermediate 
          : undefined,
        minOutLeg1: result.bestOpportunity.minOutLeg1,
        minOutLeg2: result.bestOpportunity.minOutLeg2,
        minOutLeg3: isV2 && result.bestOpportunity.minOutLeg3 !== undefined 
          ? result.bestOpportunity.minOutLeg3 
          : undefined,
        gasEstimate: result.bestOpportunity.gasEstimate,
        isTriangleArb: isV2 && result.bestOpportunity.isTriangleArb,
      };

      setOpportunity(opp);
      
      if (opp.isValid) {
        toast.success("Opportunity found!");
      } else {
        toast.info("No profitable opportunity found");
      }
    } catch (error) {
      console.error("Search error:", error);
      const parsed = parseError(error);
      toast.error(parsed.message, {
        description: parsed.suggestion,
      });
    } finally {
      setSearching(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Search Opportunities</CardTitle>
          <CardDescription>Connect your wallet to search for arbitrage opportunities</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <TrendingUp className="h-5 w-5 text-primary" />
          Search Opportunities
        </CardTitle>
        <CardDescription>
          Search for profitable arbitrage opportunities across DEXes. 
          V2 contracts can find both 2-leg and 3-leg (triangle) arbitrage routes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search-amount">Max Amount (ETH)</Label>
          <Input
            id="search-amount"
            type="number"
            step="0.1"
            placeholder="1.0"
            value={searchAmount}
            onChange={(e) => setSearchAmount(e.target.value)}
            disabled={searching}
          />
          <p className="text-xs text-muted-foreground">
            Maximum amount to search with. The bot will test multiple amounts to find the best opportunity.
          </p>
        </div>
        <Button
          onClick={handleSearch}
          disabled={searching || !searchAmount}
          className="w-full"
        >
          {searching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            "Search Opportunities"
          )}
        </Button>

        {opportunity && (
          <div className="mt-6 animate-fade-in space-y-4 rounded-lg border bg-muted/30 p-4 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base">Opportunity Found</span>
              <Badge variant={opportunity.isValid ? "default" : "secondary"} className="shrink-0">
                {opportunity.isValid ? "Valid" : "None"}
              </Badge>
            </div>

            {opportunity.isValid ? (
              <>
                {opportunity.isTriangleArb && (
                  <div className="mb-3 rounded-md bg-blue-500/10 p-2">
                    <Badge variant="secondary" className="mb-1">Triangle Arbitrage</Badge>
                    <p className="text-xs text-muted-foreground">
                      3-leg route: {TOKEN_NAMES[opportunity.tokenA] || "Unknown"} → {TOKEN_NAMES[opportunity.tokenIntermediate || ""] || "Unknown"} → {TOKEN_NAMES[opportunity.tokenB] || "Unknown"} → {TOKEN_NAMES[opportunity.tokenA] || "Unknown"}
                    </p>
                  </div>
                )}
                <div className="grid gap-3 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">Token Pair:</span>
                    <span className="font-mono font-medium text-foreground">
                      {TOKEN_NAMES[opportunity.tokenA] || "Unknown"} → {TOKEN_NAMES[opportunity.tokenB] || "Unknown"}
                      {opportunity.tokenIntermediate && ` (via ${TOKEN_NAMES[opportunity.tokenIntermediate] || "Unknown"})`}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-mono font-medium text-foreground">{formatEther(opportunity.amount)} ETH</span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-md bg-green-500/10 p-2 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">Expected Profit:</span>
                    <span className="font-mono font-bold text-green-600 dark:text-green-400">
                      +{formatEther(opportunity.expectedProfit)} ETH
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">DEX Route:</span>
                    <span className="font-mono text-foreground">
                      {DEX_NAMES[opportunity.dexIn] || `DEX ${opportunity.dexIn}`} 
                      {opportunity.dexIntermediate !== undefined && ` → ${DEX_NAMES[opportunity.dexIntermediate] || `DEX ${opportunity.dexIntermediate}`}`}
                      {` → ${DEX_NAMES[opportunity.dexOut] || `DEX ${opportunity.dexOut}`}`}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">Gas Estimate:</span>
                    <span className="font-mono text-foreground">{parseInt(opportunity.gasEstimate.toString()).toLocaleString()}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No profitable arbitrage opportunity found at this time.
                </p>
                <div className="rounded-md bg-yellow-500/10 p-3 space-y-1">
                  <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                    Why no opportunities?
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5 ml-1">
                    <li>Arbitrage opportunities are rare and highly competitive</li>
                    <li>MEV bots often capture opportunities before they appear</li>
                    <li>Gas costs may exceed potential profits</li>
                    <li>On a fork, prices may not reflect real-time market conditions</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    This is normal behavior. Try different amounts or wait for market conditions to change.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

