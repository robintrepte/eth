"use client";

import { WalletConnect } from "@/components/wallet-connect";
import { StatusDashboard } from "@/components/status-dashboard";
import { DepositWithdraw } from "@/components/deposit-withdraw";
import { OpportunitySearch } from "@/components/opportunity-search";
import { ArbitrageExecute } from "@/components/arbitrage-execute";
import { DeployContract } from "@/components/deploy-contract";
import { TransactionHistory } from "@/components/transaction-history";
import { TransactionStatusUpdater } from "@/components/transaction-status-updater";
import { SettingsPanel } from "@/components/settings-panel";
import { HelpDialog } from "@/components/help-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, Wallet, Zap, Rocket, Settings, HelpCircle, History } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <TransactionStatusUpdater />
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <h1 className="text-lg font-bold sm:text-xl">Trustless Arbitrage Bot</h1>
              <Badge variant="outline" className="hidden text-xs sm:inline-flex">
                Localhost
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <HelpDialog />
            <SettingsPanel />
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h2>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Manage your arbitrage bot contract on the local Hardhat fork
          </p>
        </div>

        {/* Deployment Section */}
        <div className="mb-8">
          <DeployContract />
        </div>

        {/* Status Dashboard */}
        <div className="mb-8">
          <StatusDashboard />
        </div>

        {/* Main Actions */}
        <Tabs defaultValue="manage" className="space-y-4 sm:space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-5 gap-1 p-1 sm:gap-2">
            <TabsTrigger 
              value="deploy" 
              className="flex flex-col items-center gap-1.5 px-2 py-2.5 text-xs sm:flex-row sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Rocket className="h-4 w-4 shrink-0" />
              <span>Deploy</span>
            </TabsTrigger>
            <TabsTrigger 
              value="manage" 
              className="flex flex-col items-center gap-1.5 px-2 py-2.5 text-xs sm:flex-row sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Wallet className="h-4 w-4 shrink-0" />
              <span>Manage</span>
            </TabsTrigger>
            <TabsTrigger 
              value="search" 
              className="flex flex-col items-center gap-1.5 px-2 py-2.5 text-xs sm:flex-row sm:gap-2 sm:px-4 sm:text-sm"
            >
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span>Search</span>
            </TabsTrigger>
            <TabsTrigger 
              value="execute" 
              className="flex flex-col items-center gap-1.5 px-2 py-2.5 text-xs sm:flex-row sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Zap className="h-4 w-4 shrink-0" />
              <span>Execute</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex flex-col items-center gap-1.5 px-2 py-2.5 text-xs sm:flex-row sm:gap-2 sm:px-4 sm:text-sm"
            >
              <History className="h-4 w-4 shrink-0" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deploy" className="space-y-4">
            <DeployContract />
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <DepositWithdraw />
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <OpportunitySearch />
          </TabsContent>

          <TabsContent value="execute" className="space-y-4">
            <ArbitrageExecute />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <TransactionHistory />
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-6 border-dashed sm:mt-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">About This Dashboard</CardTitle>
            <CardDescription className="text-sm">
              Information about using the Trustless Arbitrage Bot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="mt-1 text-primary">•</span>
              <p>
                <strong className="text-foreground">Network:</strong> Hardhat Localhost (Chain ID: 31337)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 text-primary">•</span>
              <p>
                <strong className="text-foreground">Contract Address:</strong> Auto-configured on deployment
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 text-primary">•</span>
              <p>
                <strong className="text-foreground">Operator Only:</strong> Only the contract deployer can execute trades and manage funds
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 text-primary">•</span>
              <p>
                <strong className="text-foreground">Opportunities:</strong> Arbitrage opportunities are rare and competitive. It's normal to find none.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 text-primary">•</span>
              <p>
                <strong className="text-foreground">Safe Testing:</strong> All operations use fake ETH on a local fork - no real funds at risk.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
