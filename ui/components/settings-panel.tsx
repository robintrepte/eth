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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem("arbitrage-settings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        // Use setTimeout to avoid setState in effect
        setTimeout(() => {
          if (settings.refreshInterval) {
            setRefreshInterval(settings.refreshInterval);
          }
          if (settings.autoRefresh !== undefined) {
            setAutoRefresh(settings.autoRefresh);
          }
        }, 0);
      } catch (e) {
        console.error("Error loading settings:", e);
      }
    }
  }, []);

  useEffect(() => {
    const settings = {
      refreshInterval,
      autoRefresh,
    };
    localStorage.setItem("arbitrage-settings", JSON.stringify(settings));
    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent("settings-changed", { detail: settings }));
  }, [refreshInterval, autoRefresh]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your dashboard preferences
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme">Theme</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                >
                  System
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-refresh">Auto Refresh</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically refresh contract status
                </p>
              </div>
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
          </div>

          {autoRefresh && (
            <div className="space-y-2">
              <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
              <Input
                id="refresh-interval"
                type="number"
                min="5"
                max="60"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 10)}
              />
              <p className="text-xs text-muted-foreground">
                How often to refresh contract status (5-60 seconds)
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

