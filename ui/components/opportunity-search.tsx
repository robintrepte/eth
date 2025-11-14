"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/use-wallet";
import { parseEther, formatEther } from "@/lib/ethers-utils";
import { parseError } from "@/lib/error-handler";
import { DEX_NAMES, TOKEN_NAMES, TOKENS } from "@/lib/contract-config";
import { addTransaction } from "@/components/transaction-history";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OpportunitySearch() {
  const { contract, isConnected, isOperator } = useWallet();
  const [searchAmount, setSearchAmount] = useState("1.0");
  const [searching, setSearching] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [isV2Contract, setIsV2Contract] = useState(false);
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
    uniV3FeeIn?: number;
    uniV3FeeOut?: number;
    uniV3FeeIntermediate?: number;
  } | null>(null);

  const handleSearch = async () => {
    if (!contract || !isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!searchAmount || searchAmount.trim() === "") {
      toast.error("Please enter a valid amount");
      return;
    }

    // Declare variables outside try block for use in catch
    let parsedAmount = 0;
    
    try {
      setSearching(true);
      setOpportunity(null);
      
      // Normalize decimal separator (comma to dot)
      const normalizedAmount = searchAmount.replace(",", ".");
      parsedAmount = parseFloat(normalizedAmount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error("Please enter a valid amount (use dot or comma as decimal separator)");
        return;
      }
      
      const amountWei = parseEther(normalizedAmount);
      
      // Validate amount before calling
      if (amountWei === BigInt(0)) {
        toast.error("Amount must be greater than 0");
        return;
      }
      
      // Check contract version to validate max amount
      let detectedV2 = false;
      try {
        // Try to detect if it's V2 by checking for V2-specific function
        await contract.isTriangleArbEnabled();
        detectedV2 = true;
        setIsV2Contract(true);
      } catch {
        // It's V1 or function doesn't exist
        detectedV2 = false;
        setIsV2Contract(false);
      }
      
      const maxAmount = detectedV2 ? parseEther("500") : parseEther("300");
      if (amountWei > maxAmount) {
        toast.error(`Amount exceeds maximum (${detectedV2 ? "500" : "300"} ETH)`);
        return;
      }
      
      // Call StartNative - it's a view function
      // Note: This function makes many external calls and may run out of gas
      let result;
      try {
        // Try calling with a higher gas limit for view functions
        // View functions still need gas estimation, but Hardhat has a default limit
        result = await contract.StartNative(amountWei);
      } catch (callError: unknown) {
        const err = callError as { 
          message?: string; 
          code?: string; 
          reason?: string; 
          data?: string;
          shortMessage?: string;
        };
        
        // Check for out of gas error first
        if (err.message?.includes("out of gas") || 
            err.message?.includes("Transaction ran out of gas") ||
            err.shortMessage?.includes("out of gas")) {
          throw new Error(
            "Search function ran out of gas\n\n" +
            "WHAT THIS MEANS:\n" +
            "Every Ethereum operation costs 'gas' (like fuel). The StartNative function needs over 6 BILLION gas, which is impossible.\n\n" +
            "WHY EVEN 0.1 ETH FAILS:\n" +
            "The amount doesn't matter! The function tests EVERY possible combination:\n" +
            "• 7 tokens × 5 amounts × 3 fee tiers × 3 fee tiers × 4 DEXes × 4 DEXes = 5,040+ combinations\n" +
            "• Plus triangle arbitrage = 362,880+ more combinations\n" +
            "• Each combination makes external calls to DEX routers (~121,000 gas each)\n" +
            "• Total: ~6.3 BILLION gas needed (current limit: 50M)\n\n" +
            "SOLUTION: Disable triangle arbitrage in contract settings to reduce gas by ~99%.\n" +
            "Or accept that this exhaustive search can't run locally - it's designed for off-chain bots."
          );
        }
        
        // Try to get more details from the error
        if (err.shortMessage || err.reason) {
          throw new Error(err.shortMessage || err.reason || "Contract call failed");
        }
        
        // If it's a revert without reason, provide helpful context
        if (err.code === "CALL_EXCEPTION" || err.message?.includes("missing revert data")) {
          // This usually happens when DEX contracts aren't available or revert
          // The StartNative function makes many external calls that can fail
          const helpfulMsg = 
            "The search function reverted without a reason. This typically happens when:\n\n" +
            "• The Hardhat node is not forked from mainnet (DEX contracts unavailable)\n" +
            "• DEX router contracts are reverting on queries\n" +
            "• The contract is making too many external calls\n\n" +
            "Try:\n" +
            "• Ensure Hardhat is forked from mainnet with a valid Alchemy API key\n" +
            "• Use a smaller search amount\n" +
            "• Check Hardhat node logs for more details";
          throw new Error(helpfulMsg);
        }
        
        throw callError;
      }
      
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
        uniV3FeeIn: result.bestOpportunity.uniV3FeeIn !== undefined ? Number(result.bestOpportunity.uniV3FeeIn) : undefined,
        uniV3FeeOut: result.bestOpportunity.uniV3FeeOut !== undefined ? Number(result.bestOpportunity.uniV3FeeOut) : undefined,
        uniV3FeeIntermediate: isV2 && result.bestOpportunity.uniV3FeeIntermediate !== undefined 
          ? Number(result.bestOpportunity.uniV3FeeIntermediate) 
          : undefined,
      };

      setOpportunity(opp);
      
      if (opp.isValid) {
        toast.success("Opportunity found!");
      } else {
        toast.info("No profitable opportunity found");
      }
    } catch (error) {
      console.error("Search error:", error);
      const err = error as { message?: string; code?: string; reason?: string; data?: string };
      
      // Check if error message contains our custom helpful message
      if (err.message && err.message.includes("The search function reverted")) {
        // Show the detailed error message we created
        const errorMsg = err.message;
        toast.error(errorMsg.split("\n")[0], {
          description: errorMsg.split("\n").slice(1).join("\n"),
          duration: 10000, // Show for 10 seconds
        });
      } 
      // Handle specific revert reasons from contract
      else if (err.reason) {
        // Check if it's actually an invalid amount error from the contract
        if (err.reason.includes("Invalid amount") && parsedAmount > 0 && parsedAmount <= (isV2Contract ? 500 : 300)) {
          // Amount is valid, so this is likely a different issue
          toast.error("Contract reverted with 'Invalid amount'", {
            description: "This might indicate the contract state is invalid or DEX calls are failing. Try a different amount or check the Hardhat node.",
            duration: 8000,
          });
        } else {
          toast.error(`Search failed: ${err.reason}`);
        }
      } 
      // Handle out of gas errors
      else if (err.message?.includes("out of gas") || err.message?.includes("ran out of gas")) {
        const errorMsg = err.message || "Search function ran out of gas";
        toast.error(errorMsg.split("\n")[0], {
          description: errorMsg.split("\n").slice(1).join("\n"),
          duration: 12000,
        });
      }
      // Handle missing revert data (most common case)
      else if (err.code === "CALL_EXCEPTION" || err.message?.includes("missing revert data")) {
        toast.error("Search function reverted without reason", {
          description: "This usually means DEX contracts aren't available on the forked network. Ensure Hardhat is forked from mainnet with a valid Alchemy API key.",
          duration: 10000,
        });
      } 
      // Handle generic revert errors
      else if (err.message?.includes("Invalid amount")) {
        // Only show this if we haven't already validated the amount
        if (parsedAmount <= 0 || parsedAmount > (isV2Contract ? 500 : 300)) {
          toast.error("Invalid amount. Please ensure the amount is between 0 and the maximum trade amount (500 ETH for V2, 300 ETH for V1).");
        } else {
          toast.error("Contract reverted", {
            description: "The contract rejected the request. This might be due to DEX contract issues or invalid state.",
            duration: 8000,
          });
        }
      } 
      else {
        const parsed = parseError(error);
        toast.error(parsed.message, {
          description: parsed.suggestion,
        });
      }
    } finally {
      setSearching(false);
    }
  };

  const handleExecute = async () => {
    if (!contract || !isConnected || !isOperator || !opportunity || !opportunity.isValid) {
      toast.error("Cannot execute: Missing requirements");
      return;
    }

    if (!isV2Contract) {
      toast.error("ExecuteArbitrage is only available for V2 contracts. Use AutoArbitrage in the Execute tab for V1.");
      return;
    }

    try {
      setExecuting(true);

      // Get current gas price
      const provider = contract.runner?.provider;
      if (!provider) {
        throw new Error("Provider not available");
      }
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);

      // Build ArbitrageParams from opportunity
      const params = {
        tokenIn: opportunity.tokenA,
        tokenOut: opportunity.tokenB,
        tokenIntermediate: opportunity.tokenIntermediate || "0x0000000000000000000000000000000000000000",
        amountIn: opportunity.amount,
        minOutLeg1: opportunity.minOutLeg1,
        minOutLeg2: opportunity.minOutLeg2,
        minOutLeg3: opportunity.minOutLeg3 || BigInt(0),
        dexIn: opportunity.dexIn,
        dexOut: opportunity.dexOut,
        dexIntermediate: opportunity.dexIntermediate || 0,
        uniV3FeeIn: opportunity.uniV3FeeIn || 0,
        uniV3FeeOut: opportunity.uniV3FeeOut || 0,
        uniV3FeeIntermediate: opportunity.uniV3FeeIntermediate || 0,
        balancerPoolId: "0x0000000000000000000000000000000000000000000000000000000000000000",
        deadline: Math.floor(Date.now() / 1000) + 60,
        recipient: await contract.runner?.getAddress() || "0x0000000000000000000000000000000000000000",
        minNetProfitWei: BigInt("500000000000000"), // 0.0005 ETH
        gasPriceWei: gasPrice,
        gasLimitEstimate: opportunity.gasEstimate,
        useOwnLiquidity: true,
        isTriangleArb: opportunity.isTriangleArb || false,
      };

      // Call ExecuteArbitrage
      const tx = await contract.ExecuteArbitrage(params, opportunity.expectedProfit);

      // Add to transaction history
      addTransaction({
        hash: tx.hash,
        type: "arbitrage",
        status: "pending",
        timestamp: Date.now(),
        amount: opportunity.amount.toString(),
      });

      toast.info("Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();

      // Update transaction status
      addTransaction({
        hash: tx.hash,
        type: "arbitrage",
        status: receipt.status === 1 ? "confirmed" : "failed",
        timestamp: Date.now(),
        amount: opportunity.amount.toString(),
        gasUsed: receipt.gasUsed?.toString(),
      });

      toast.success("Arbitrage executed successfully!");
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
                {isOperator && isV2Contract && (
                  <Button
                    onClick={handleExecute}
                    disabled={executing}
                    className="w-full mt-4"
                    size="lg"
                  >
                    {executing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Execute Arbitrage (V2)
                      </>
                    )}
                  </Button>
                )}
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

