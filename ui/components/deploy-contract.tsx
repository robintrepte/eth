"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/use-wallet";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Rocket, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { addTransaction } from "@/components/transaction-history";

export function DeployContract() {
  const { } = useWallet();
  const [deploying, setDeploying] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<{
    running: boolean;
    error?: string;
  } | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const checkNodeStatus = async () => {
    try {
      const response = await fetch("/api/node/status");
      const data = await response.json();
      setNodeStatus(data);
    } catch {
      setNodeStatus({ running: false, error: "Failed to check node status" });
    }
  };

  const checkDeployment = async () => {
    try {
      const response = await fetch("/api/contract-address");
      const data = await response.json();
      if (data.configured && data.contractAddress) {
        setContractAddress(data.contractAddress);
        // Set in window for immediate use
        if (typeof window !== "undefined") {
          (window as unknown as Record<string, unknown>).__CONTRACT_ADDRESS__ = data.contractAddress;
        }
      }
    } catch {
      // Silently handle error
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkNodeStatus();
    checkDeployment();
    const interval = setInterval(checkNodeStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const [contractVersion, setContractVersion] = useState<"v1" | "v2">("v2");

  const handleDeploy = async () => {
    if (!nodeStatus?.running) {
      toast.error("Hardhat node is not running. Please start it first.");
      return;
    }

    setDeploying(true);
    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ version: contractVersion }),
      });

      const data = await response.json();

      if (data.success && data.contractAddress) {
        toast.success(`Contract ${contractVersion.toUpperCase()} deployed: ${data.contractAddress}`);
        setContractAddress(data.contractAddress);
        
        // Add deployment to transaction history
        addTransaction({
          hash: `deploy-${Date.now()}`,
          type: "deploy",
          status: "confirmed",
          timestamp: Date.now(),
        });
        
        // Set contract address in window for immediate use
        if (typeof window !== "undefined") {
          (window as unknown as Record<string, unknown>).__CONTRACT_ADDRESS__ = data.contractAddress;
          (window as unknown as Record<string, unknown>).__CONTRACT_VERSION__ = contractVersion;
        }
        
        // Reload to pick up new env variable
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }, 2000);
      } else {
        toast.error(data.error || "Deployment failed");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Deployment failed";
      toast.error(message);
    } finally {
      setDeploying(false);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-md border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Rocket className="h-5 w-5 text-primary" />
          Contract Deployment
        </CardTitle>
        <CardDescription>
          Deploy the TrustlessArbitrageBot contract to the local Hardhat node
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version Selection */}
        <div className="space-y-2">
          <Label htmlFor="contract-version" className="text-sm font-medium">Contract Version</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={contractVersion === "v1" ? "default" : "outline"}
              onClick={() => setContractVersion("v1")}
              disabled={deploying || !!contractAddress}
              className="flex-1"
            >
              V1 (Original)
            </Button>
            <Button
              type="button"
              variant={contractVersion === "v2" ? "default" : "outline"}
              onClick={() => setContractVersion("v2")}
              disabled={deploying || !!contractAddress}
              className="flex-1"
            >
              V2 (Enhanced)
            </Button>
          </div>
          {contractVersion === "v2" && (
            <div className="rounded-md bg-blue-500/10 p-3 space-y-1">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                V2 Enhanced Features:
              </p>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5 ml-1">
                <li>Triangle arbitrage (3-leg routes)</li>
                <li>More tokens: LINK, UNI, AAVE</li>
                <li>Gas optimization (~10% better)</li>
                <li>Higher limits (500 ETH max, 150 daily flash loans)</li>
                <li>Lower profit threshold (0.0005 ETH)</li>
              </ul>
            </div>
          )}
        </div>

        {/* Node Status */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            {nodeStatus?.running ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">Hardhat Node</span>
          </div>
          <Badge variant={nodeStatus?.running ? "default" : "destructive"}>
            {nodeStatus?.running ? "Running" : "Not Running"}
          </Badge>
        </div>

        {/* Contract Status */}
        {contractAddress && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Contract Deployed</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs flex-1">{contractAddress}</code>
                  <CopyButton text={contractAddress} size="sm" variant="outline" />
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!nodeStatus?.running && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Hardhat node is not running. Please start it using:
              <code className="block mt-2 p-2 bg-muted rounded text-xs">
                npm run start
              </code>
              Or run it manually:
              <code className="block mt-2 p-2 bg-muted rounded text-xs">
                npm run node
              </code>
            </AlertDescription>
          </Alert>
        )}

        {/* Deploy Button */}
        <Button
          onClick={handleDeploy}
          disabled={deploying || !nodeStatus?.running || !!contractAddress}
          className="w-full"
          size="lg"
        >
          {deploying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : contractAddress ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Already Deployed
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              Deploy Contract
            </>
          )}
        </Button>

        {contractAddress && (
          <p className="text-xs text-muted-foreground text-center">
            Contract is ready to use. You can now interact with it using the other tabs.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

