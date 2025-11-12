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
  const [opportunity, setOpportunity] = useState<any>(null);

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
      
      const opp = {
        isValid: result.bestOpportunity.isValid,
        tokenA: result.tokenA,
        tokenB: result.tokenB,
        amount: result.amount,
        expectedProfit: result.bestOpportunity.expectedProfit,
        dexIn: result.bestOpportunity.dexIn,
        dexOut: result.bestOpportunity.dexOut,
        minOutLeg1: result.bestOpportunity.minOutLeg1,
        minOutLeg2: result.bestOpportunity.minOutLeg2,
        gasEstimate: result.bestOpportunity.gasEstimate,
      };

      setOpportunity(opp);
      
      if (opp.isValid) {
        toast.success("Opportunity found!");
      } else {
        toast.info("No profitable opportunity found");
      }
    } catch (error: any) {
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
          Search for profitable arbitrage opportunities across DEXes
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
                <div className="grid gap-3 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">Token Pair:</span>
                    <span className="font-mono font-medium text-foreground">
                      {TOKEN_NAMES[opportunity.tokenA] || "Unknown"} → {TOKEN_NAMES[opportunity.tokenB] || "Unknown"}
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
                      {DEX_NAMES[opportunity.dexIn] || `DEX ${opportunity.dexIn}`} → {DEX_NAMES[opportunity.dexOut] || `DEX ${opportunity.dexOut}`}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">Gas Estimate:</span>
                    <span className="font-mono text-foreground">{parseInt(opportunity.gasEstimate.toString()).toLocaleString()}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                No profitable arbitrage opportunity found at this time. This is normal as opportunities are rare and competitive.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

