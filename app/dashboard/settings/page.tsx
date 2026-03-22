"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Bell,
  Info,
  CheckCircle2,
  X,
  Loader2, // For loading states
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { creditCards } from "@/lib/credit-cards-data";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext"; // Path to your context
import { Button } from "@/components/ui/button";

// ═══════════════════════════════════════════════════════════════════
// ALERTS PAGE — /dashboard/alerts
// ═══════════════════════════════════════════════════════════════════

type AlertSeverity = "critical" | "warning" | "info";
interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  date: string;
  cardName?: string;
}

const SEVERITY_CONFIG: Record<AlertSeverity, any> = {
  critical: {
    icon: AlertTriangle,
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    label: "Critical",
    labelColor: "text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-orange-500/10",
    border: "border-orange-500/25",
    label: "Warning",
    labelColor: "text-orange-400",
  },
  info: {
    icon: Info,
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    label: "Info",
    labelColor: "text-blue-400",
  },
};

export function AlertsPage() {
  const { isLoading } = useUser();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");

  // Generate alerts dynamically
  const allAlerts = useMemo(() => {
    const alerts: Alert[] = [];

    // 1. Dynamic Devaluation Alerts from Global Data
    creditCards
      .filter((c) => c.devaluation2026)
      .forEach((c) => {
        alerts.push({
          id: `dev-${c.id}`,
          severity: "critical",
          title: `${c.name} — 2026 Devaluation`,
          body: "Significant reward structure changes detected for this card. Tap to review new terms.",
          date: "Mar 2026",
          cardName: c.name,
        });
      });

    // 2. Market Alerts
    alerts.push(
      {
        id: "m-1",
        severity: "info",
        title: "HDFC SmartBuy Revision",
        body: "Multipliers for Infinia adjusted for 2026.",
        date: "Jan 2026",
      },
      {
        id: "m-2",
        severity: "warning",
        title: "Lounge Access Update",
        body: "Several entry-level cards now require ₹50k spend for lounge access.",
        date: "Feb 2026",
      },
    );

    return alerts;
  }, []);

  const visible = allAlerts.filter(
    (a) => !dismissed.has(a.id) && (filter === "all" || a.severity === filter),
  );

  if (isLoading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-amber-400" />
      </div>
    );

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {visible.filter((a) => a.severity === "critical").length > 0 ? (
              <span className="text-red-400 font-medium">
                Critical updates detected
              </span>
            ) : (
              "Stay on top of card policy changes"
            )}
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-400/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-amber-400" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {["all", "critical", "warning", "info"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold border transition-all capitalize",
              filter === f
                ? "bg-amber-400 border-amber-400 text-black"
                : "border-white/10 text-muted-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visible.length === 0 ? (
            <div className="py-20 text-center opacity-40">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
              <p>Everything is up to date</p>
            </div>
          ) : (
            visible.map((alert) => (
              <motion.div
                layout
                key={alert.id}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "rounded-2xl border p-4 relative bg-white/[0.03]",
                  SEVERITY_CONFIG[alert.severity].border,
                )}
              >
                <button
                  onClick={() =>
                    setDismissed((prev) => new Set([...prev, alert.id]))
                  }
                  className="absolute top-4 right-4 text-muted-foreground hover:text-white"
                >
                  <X size={14} />
                </button>
                <div className="flex gap-3">
                  <div
                    className={cn(
                      "mt-1",
                      SEVERITY_CONFIG[alert.severity].labelColor,
                    )}
                  >
                    {/* Icon logic here */}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-[10px] font-black uppercase mb-1",
                        SEVERITY_CONFIG[alert.severity].labelColor,
                      )}
                    >
                      {alert.severity}
                    </p>
                    <p className="text-sm font-bold text-white">
                      {alert.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS PAGE — /dashboard/settings
// ═══════════════════════════════════════════════════════════════════

export default function SettingsPage() {
  const { user, isLoading } = useUser(); // 👈 Live user data
  const [income, setIncome] = useState(1200000); // Default to a middle tier
  const [saved, setSaved] = useState(false);

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-amber-400" />
      </div>
    );

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-20">
      <header>
        <h1 className="font-serif text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your PaisaDekho AI profile
        </p>
      </header>

      {/* Profile Section - Live Data */}
      <section className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl font-black text-black">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <p className="font-bold text-white text-lg">
              {user?.name || "User"}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-2">
              Display Name
            </label>
            <input
              disabled
              value={user?.name || ""}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/50 cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* Income - Affects Card Recommendations */}
      <section className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10">
        <div className="flex justify-between items-end mb-4">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">
            Annual Income
          </label>
          <p className="text-xl font-serif font-bold text-amber-400">
            ₹{(income / 100000).toFixed(1)}L
          </p>
        </div>
        <input
          type="range"
          min={200000}
          max={5000000}
          step={100000}
          value={income}
          onChange={(e) => setIncome(Number(e.target.value))}
          className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
        />
        <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
          Determines your eligibility for premium cards like Infinia or Magnus.
        </p>
      </section>

      <Button
        onClick={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        className={cn(
          "w-full py-6 rounded-2xl font-bold transition-all",
          saved ? "bg-green-500" : "bg-amber-400 hover:bg-amber-300 text-black",
        )}
      >
        {saved ? "Profile Updated!" : "Save Preferences"}
      </Button>
    </div>
  );
}
