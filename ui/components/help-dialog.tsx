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
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mt-2">Step 1: Import Hardhat Test Account</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                    <li>Open MetaMask extension (unlock it with your password)</li>
                    <li>Click the <strong>account circle/icon</strong> at the top right (next to the network name)</li>
                    <li>Click <strong>&quot;Import Account&quot;</strong> at the bottom of the menu</li>
                    <li>Paste your Hardhat private key (starts with <code className="bg-muted px-1 rounded">0x</code>)</li>
                    <li>Click <strong>&quot;Import&quot;</strong></li>
                    <li>The account should now appear in your account list</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2 ml-2">
                    💡 <strong>Tip:</strong> Use Account #0 from Hardhat if you want to be the operator (contract deployer)
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mt-2">Step 2: Add Hardhat Local Network</h4>
                  <p className="text-sm text-muted-foreground ml-2 mb-2">
                    The UI will automatically add this network when you connect, OR you can add it manually:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                    <li>Click the network dropdown (top center, shows &quot;Ethereum Mainnet&quot; or similar)</li>
                    <li>Click <strong>&quot;Add Network&quot;</strong> or <strong>&quot;Add a network manually&quot;</strong></li>
                    <li>Enter these details:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>Network Name: <code className="bg-muted px-1 rounded">Hardhat Local</code></li>
                        <li>RPC URL: <code className="bg-muted px-1 rounded">http://127.0.0.1:8545</code></li>
                        <li>Chain ID: <code className="bg-muted px-1 rounded">31337</code></li>
                        <li>Currency Symbol: <code className="bg-muted px-1 rounded">ETH</code></li>
                      </ul>
                    </li>
                    <li>Click <strong>&quot;Save&quot;</strong></li>
                  </ol>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4 mt-4">
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-semibold text-base">Deploy Tab</h3>
                <p className="text-muted-foreground mt-1">
                  Deploy V1 (original) or V2 (enhanced) contract to the local Hardhat node. 
                  V2 includes triangle arbitrage, more tokens (LINK, UNI, AAVE), gas optimization, and enhanced limits.
                  Shows node status and deployment progress.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">Manage Funds Tab</h3>
                <p className="text-muted-foreground mt-1">
                  Deposit ETH (converts to WETH) or withdraw WETH (converts to ETH) from the contract.
                  Operator only. Includes gas estimation and confirmation dialogs for safety.
                </p>
                <div className="mt-2">
                  <h4 className="font-semibold text-sm">Contract Settings (V2 Only)</h4>
                  <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-muted-foreground">
                    <li>Toggle triangle arbitrage on/off</li>
                    <li>Set gas price hint for profit calculations</li>
                    <li>Configure flash loan premium (BPS)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-base">Find Opportunities Tab</h3>
                <p className="text-muted-foreground mt-1">
                  Search for profitable arbitrage opportunities across multiple DEXes.
                  V2 can find both 2-leg and 3-leg (triangle) arbitrage routes.
                  Shows detailed information including expected profit, DEX routes, and gas estimates.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">Execute Trade Tab</h3>
                <p className="text-muted-foreground mt-1">
                  Execute arbitrage trades automatically. Operator only - requires deployer account.
                  Automatically finds the best opportunity and executes if profitable.
                  Includes gas estimation and confirmation dialog.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">History Tab</h3>
                <p className="text-muted-foreground mt-1">
                  View your recent transactions with status, amounts, and transaction hashes.
                  Copy transaction hashes to clipboard. Auto-updates with transaction status.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">Status Dashboard</h3>
                <p className="text-muted-foreground mt-1">
                  Real-time contract statistics including total trades, volume, profit, and balance.
                  V2 shows additional triangle arbitrage count. Auto-refreshes based on settings.
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
                  and other preferences. Contract settings (V2) are in the Manage tab.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">What&apos;s the difference between V1 and V2?</h3>
                <p className="text-muted-foreground mt-1">
                  V2 is an enhanced version with triangle arbitrage (3-leg routes), more supported tokens,
                  optimized gas costs, lower profit thresholds, and higher limits. V1 is the original stable version.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">What is triangle arbitrage?</h3>
                <p className="text-muted-foreground mt-1">
                  Triangle arbitrage uses 3 trades instead of 2: A → B → C → A. This can find opportunities
                  that 2-leg arbitrage misses. Example: WETH → USDC → DAI → WETH.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

