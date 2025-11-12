"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useWallet } from "@/hooks/use-wallet";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Settings2 } from "lucide-react";
import { parseEther, formatEther } from "@/lib/ethers-utils";
import { parseError } from "@/lib/error-handler";

export function ContractSettings() {
  const { contract, isConnected, isOperator } = useWallet();
  const [loading, setLoading] = useState(false);
  const [triangleArbEnabled, setTriangleArbEnabled] = useState<boolean | null>(null);
  const [gasPriceHint, setGasPriceHint] = useState("");
  const [flashPremiumBps, setFlashPremiumBps] = useState("");

  // Check if contract is V2 by trying to call V2-specific function
  const [isV2, setIsV2] = useState<boolean | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      if (!contract || !isConnected) {
        setIsV2(null);
        return;
      }

      try {
        // Try to call V2-specific function
        await contract.isTriangleArbEnabled();
        setIsV2(true);
        
        // Load V2 settings
        try {
          const enabled = await contract.isTriangleArbEnabled();
          setTriangleArbEnabled(enabled);
        } catch {
          // Not V2 or function doesn't exist
        }
      } catch {
        setIsV2(false);
      }
    };

    checkVersion();
  }, [contract, isConnected]);

  const handleToggleTriangleArb = async () => {
    if (!contract || !isOperator) {
      toast.error("Only operator can change settings");
      return;
    }

    setLoading(true);
    try {
      const tx = await contract.setTriangleArbEnabled(!triangleArbEnabled);
      await tx.wait();
      setTriangleArbEnabled(!triangleArbEnabled);
      toast.success(`Triangle arbitrage ${!triangleArbEnabled ? "enabled" : "disabled"}`);
    } catch (error) {
      const parsed = parseError(error);
      toast.error(parsed.message, {
        description: parsed.suggestion,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetGasPriceHint = async () => {
    if (!contract || !isOperator) {
      toast.error("Only operator can change settings");
      return;
    }

    if (!gasPriceHint || parseFloat(gasPriceHint) <= 0) {
      toast.error("Please enter a valid gas price");
      return;
    }

    setLoading(true);
    try {
      const gasPriceWei = parseEther(gasPriceHint);
      const tx = await contract.setGasPriceHint(gasPriceWei);
      await tx.wait();
      toast.success("Gas price hint updated");
      setGasPriceHint("");
    } catch (error) {
      const parsed = parseError(error);
      toast.error(parsed.message, {
        description: parsed.suggestion,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetFlashPremium = async () => {
    if (!contract || !isOperator) {
      toast.error("Only operator can change settings");
      return;
    }

    if (!flashPremiumBps || parseFloat(flashPremiumBps) < 0 || parseFloat(flashPremiumBps) >= 100) {
      toast.error("Please enter a valid BPS (0-99)");
      return;
    }

    setLoading(true);
    try {
      const bps = BigInt(Math.floor(parseFloat(flashPremiumBps) * 100)); // Convert to basis points
      const tx = await contract.setFlashPremiumBps(bps);
      await tx.wait();
      toast.success("Flash premium BPS updated");
      setFlashPremiumBps("");
    } catch (error) {
      const parsed = parseError(error);
      toast.error(parsed.message, {
        description: parsed.suggestion,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5 text-primary" />
            Contract Settings
          </CardTitle>
          <CardDescription>Connect your wallet to configure contract settings</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isV2 === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5 text-primary" />
            Contract Settings
          </CardTitle>
          <CardDescription>V2 contract features are not available for V1 contracts</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Settings2 className="h-5 w-5 text-primary" />
          Contract Settings (V2)
        </CardTitle>
        <CardDescription>
          Configure advanced V2 contract settings. These settings affect how the bot searches for and executes trades.
          All changes require operator permissions and a transaction.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Triangle Arbitrage Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="triangle-arb">Triangle Arbitrage</Label>
              <p className="text-xs text-muted-foreground">
                Enable 3-leg arbitrage routes (A → B → C → A). When enabled, the bot searches for triangle arbitrage
                opportunities which can find profits that 2-leg routes miss. Example: WETH → USDC → DAI → WETH.
              </p>
            </div>
            {triangleArbEnabled !== null && (
              <Switch
                id="triangle-arb"
                checked={triangleArbEnabled}
                onCheckedChange={handleToggleTriangleArb}
                disabled={loading || !isOperator}
                className="ml-4"
              />
            )}
          </div>
          {triangleArbEnabled === null && (
            <p className="text-xs text-muted-foreground">Loading...</p>
          )}
        </div>

        {/* Gas Price Hint */}
        <div className="space-y-2">
          <Label htmlFor="gas-price-hint">Gas Price Hint (ETH)</Label>
          <div className="flex gap-2">
            <Input
              id="gas-price-hint"
              type="number"
              step="0.000001"
              placeholder="0.00005"
              value={gasPriceHint}
              onChange={(e) => setGasPriceHint(e.target.value)}
              disabled={loading || !isOperator}
            />
            <Button
              onClick={handleSetGasPriceHint}
              disabled={loading || !isOperator || !gasPriceHint}
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Set"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Set a fixed gas price (in ETH) for profit calculations. If left empty, the bot uses the current
            transaction gas price. Useful for consistent profit calculations regardless of network conditions.
          </p>
        </div>

        {/* Flash Premium BPS */}
        <div className="space-y-2">
          <Label htmlFor="flash-premium">Flash Premium (BPS)</Label>
          <div className="flex gap-2">
            <Input
              id="flash-premium"
              type="number"
              step="0.01"
              placeholder="0.05"
              value={flashPremiumBps}
              onChange={(e) => setFlashPremiumBps(e.target.value)}
              disabled={loading || !isOperator}
            />
            <Button
              onClick={handleSetFlashPremium}
              disabled={loading || !isOperator || !flashPremiumBps}
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Set"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Flash loan premium in basis points. 0.05 = 5 BPS = 0.05%. This is the fee charged by Aave for flash loans.
            Lower values allow more opportunities to be profitable, but must match Aave&apos;s actual premium.
          </p>
        </div>

        {!isOperator && (
          <p className="text-xs text-muted-foreground text-center">
            Only the contract operator can change these settings
          </p>
        )}
      </CardContent>
    </Card>
  );
}

