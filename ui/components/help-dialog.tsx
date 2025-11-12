"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Help & Guide</DialogTitle>
          <DialogDescription>
            Learn how to use the Trustless Arbitrage Bot dashboard
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="getting-started" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-4 mt-4">
            <div className="space-y-3 text-sm">
              <h3 className="font-semibold text-base">Quick Start</h3>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Run <code className="bg-muted px-1 rounded">npm start</code> to start everything</li>
                <li>Wait for Hardhat node to start and contract to deploy</li>
                <li>Open the dashboard at http://localhost:3010</li>
                <li>Connect your MetaMask wallet (configured for localhost)</li>
                <li>Start managing your arbitrage bot!</li>
              </ol>

              <h3 className="font-semibold text-base mt-4">Setting Up MetaMask</h3>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Open MetaMask and click the network dropdown</li>
                <li>Select &quot;Add Network&quot; or &quot;Add a network manually&quot;</li>
                <li>Enter these details:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Network Name: <code className="bg-muted px-1 rounded">Hardhat Local</code></li>
                    <li>RPC URL: <code className="bg-muted px-1 rounded">http://127.0.0.1:8545</code></li>
                    <li>Chain ID: <code className="bg-muted px-1 rounded">31337</code></li>
                    <li>Currency Symbol: <code className="bg-muted px-1 rounded">ETH</code></li>
                  </ul>
                </li>
                <li>Import a test account from Hardhat (private keys shown when node starts)</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4 mt-4">
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-semibold text-base">Deploy Tab</h3>
                <p className="text-muted-foreground mt-1">
                  Deploy the contract to the local Hardhat node. Shows node status and deployment progress.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">Manage Funds Tab</h3>
                <p className="text-muted-foreground mt-1">
                  Deposit ETH (converts to WETH) or withdraw WETH (converts to ETH) from the contract.
                  Includes gas estimation and confirmation dialogs.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">Find Opportunities Tab</h3>
                <p className="text-muted-foreground mt-1">
                  Search for profitable arbitrage opportunities across multiple DEXes.
                  Shows detailed information about any opportunities found.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">Execute Trade Tab</h3>
                <p className="text-muted-foreground mt-1">
                  Execute arbitrage trades automatically. Operator only - requires deployer account.
                  Includes gas estimation and confirmation.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">History Tab</h3>
                <p className="text-muted-foreground mt-1">
                  View your recent transactions with status, amounts, and transaction hashes.
                  Copy transaction hashes to clipboard.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faq" className="space-y-4 mt-4">
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-base">Why can&apos;t I find opportunities?</h3>
                <p className="text-muted-foreground mt-1">
                  Arbitrage opportunities are rare and highly competitive. It&apos;s normal to find none,
                  especially on a mainnet fork where prices may not have real-time updates.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">Why can&apos;t I execute trades?</h3>
                <p className="text-muted-foreground mt-1">
                  Only the contract deployer (operator) can execute trades. Make sure you&apos;re using
                  the same account that deployed the contract.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">What if the Hardhat node isn&apos;t running?</h3>
                <p className="text-muted-foreground mt-1">
                  The deploy tab will show the node status. If it&apos;s not running, restart with
                  <code className="bg-muted px-1 rounded ml-1">npm start</code> or manually with
                  <code className="bg-muted px-1 rounded ml-1">npm run node</code>.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">Is this safe?</h3>
                <p className="text-muted-foreground mt-1">
                  Yes! Everything runs on a local fork with fake ETH. No real funds are at risk.
                  This is a testing environment.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">How do I change settings?</h3>
                <p className="text-muted-foreground mt-1">
                  Click the settings icon in the header to configure refresh intervals, theme,
                  and other preferences.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

