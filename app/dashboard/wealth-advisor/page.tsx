"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  PieChart,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Home,
  Landmark,
  Coins,
  Scale,
  Bitcoin,
  Globe,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// --- Advanced Financial Data Models ---

type Step = "setup" | "assets" | "risk" | "results";

interface Asset {
  id: string;
  label: string;
  icon: any;
  desc: string;
  color: string;
  annualReturn: number; // 2026 Expected CAGR
  volatility: number; // Standard Deviation (Risk)
}

const ASSETS: Asset[] = [
  {
    id: "equity",
    label: "Equity SIP",
    icon: TrendingUp,
    desc: "Growth Funds",
    color: "text-emerald-500",
    annualReturn: 0.15,
    volatility: 0.18,
  },
  {
    id: "crypto",
    label: "Digital Assets",
    icon: Bitcoin,
    desc: "BTC/ETH Mix",
    color: "text-orange-500",
    annualReturn: 0.4,
    volatility: 0.75,
  },
  {
    id: "gold",
    label: "Sovereign Gold",
    icon: ShieldCheck,
    desc: "RBI SGB Bonds",
    color: "text-yellow-500",
    annualReturn: 0.09,
    volatility: 0.1,
  },
  {
    id: "bonds",
    label: "Corporate Debt",
    icon: Landmark,
    desc: "AA+ Rated Paper",
    color: "text-blue-500",
    annualReturn: 0.08,
    volatility: 0.05,
  },
  {
    id: "reit",
    label: "Real Estate",
    icon: Home,
    desc: "Commercial REIT",
    color: "text-purple-500",
    annualReturn: 0.11,
    volatility: 0.14,
  },
  {
    id: "etf",
    label: "Index ETFs",
    icon: Globe,
    desc: "Nifty 50 / Next 50",
    color: "text-cyan-500",
    annualReturn: 0.13,
    volatility: 0.16,
  },
];

export default function WealthAdvisorPage() {
  const [step, setStep] = useState<Step>("setup");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profile, setProfile] = useState({
    monthlySip: 10000,
    horizon: 5,
    selectedAssets: ["equity", "gold"],
    riskAppetite: "balanced",
  });

  const [portfolio, setPortfolio] = useState<any[]>([]);

  const runSmartAllocation = async (risk: string) => {
    setIsAnalyzing(true);
    setStep("results");
    await new Promise((r) => setTimeout(r, 2000));

    const selected = ASSETS.filter((a) =>
      profile.selectedAssets.includes(a.id),
    );

    // 1. Calculate Inverse Volatility Weights (The "Smart" part)
    let rawWeights = selected.map((asset) => {
      // Logic: Risk Parity - assets with lower volatility get higher base weight
      let weight = 1 / asset.volatility;

      // 2. Apply Strategic Tilts based on Risk Appetite
      if (risk === "aggressive") {
        if (asset.id === "crypto") weight *= 2.5;
        if (asset.id === "equity") weight *= 1.5;
      } else if (risk === "conservative") {
        if (asset.id === "bonds" || asset.id === "gold") weight *= 2.0;
        if (asset.id === "crypto") weight *= 0.1; // Maximum de-risking
      }
      return { ...asset, weight };
    });

    // 3. Normalize to 100%
    const totalRawWeight = rawWeights.reduce(
      (acc, curr) => acc + curr.weight,
      0,
    );
    const finalPortfolio = rawWeights.map((w) => ({
      ...w,
      finalWeight: w.weight / totalRawWeight,
      monthlyAmount: Math.round(
        (w.weight / totalRawWeight) * profile.monthlySip,
      ),
    }));

    setPortfolio(finalPortfolio);
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <AnimatePresence mode="wait">
        {step === "setup" && (
          <SetupStep
            onNext={(sip: number, h: number) => {
              setProfile({ ...profile, monthlySip: sip, horizon: h });
              setStep("assets");
            }}
          />
        )}

        {step === "assets" && (
          <AssetPicker
            selected={profile.selectedAssets}
            onToggle={(id: string) => {
              const current = profile.selectedAssets;
              setProfile({
                ...profile,
                selectedAssets: current.includes(id)
                  ? current.filter((x) => x !== id)
                  : [...current, id],
              });
            }}
            onNext={() => setStep("risk")}
          />
        )}

        {step === "risk" && (
          <RiskSelector onSelect={(r: any) => runSmartAllocation(r)} />
        )}

        {step === "results" && (
          <WealthDashboard
            portfolio={portfolio}
            profile={profile}
            isAnalyzing={isAnalyzing}
            onReset={() => setStep("setup")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Component Fragments ---

function SetupStep({ onNext }: any) {
  const [sip, setSip] = useState(10000);
  const [horizon, setHorizon] = useState(5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-xl mx-auto glass-gold p-10 rounded-[2rem] border border-gold/20"
    >
      <h2 className="text-3xl font-serif font-bold mb-8 text-center">
        Investment Foundation
      </h2>
      <div className="space-y-8">
        <div className="space-y-4">
          <label className="text-sm uppercase tracking-widest text-muted-foreground">
            Monthly Commitment
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-bold">
              ₹
            </span>
            <Input
              type="number"
              value={sip}
              onChange={(e) => setSip(Number(e.target.value))}
              className="pl-10 h-16 text-2xl bg-black/20 border-gold/10"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between">
            <label className="text-sm uppercase tracking-widest text-muted-foreground">
              Time Horizon
            </label>
            <span className="text-gold font-bold">{horizon} Years</span>
          </div>
          <Slider
            defaultValue={[5]}
            max={30}
            min={1}
            onValueChange={(v) => setHorizon(v[0])}
          />
        </div>
        <Button
          onClick={() => onNext(sip, horizon)}
          className="w-full h-16 bg-gold text-black font-bold text-lg rounded-2xl hover:scale-[1.02] transition-transform"
        >
          Continue to Asset Selection
        </Button>
      </div>
    </motion.div>
  );
}

function AssetPicker({ selected, onToggle, onNext }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif font-bold">The Luxe Universe</h2>
        <p className="text-muted-foreground">
          Select the instruments for your dynamic portfolio
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {ASSETS.map((asset) => (
          <button
            key={asset.id}
            onClick={() => onToggle(asset.id)}
            className={cn(
              "p-8 rounded-3xl border transition-all text-left relative overflow-hidden group",
              selected.includes(asset.id)
                ? "glass-gold border-gold/50 bg-gold/5 shadow-2xl"
                : "bg-white/5 border-white/10 opacity-50",
            )}
          >
            <asset.icon className={cn("w-8 h-8 mb-4", asset.color)} />
            <h4 className="font-bold text-xl">{asset.label}</h4>
            <p className="text-sm text-muted-foreground">{asset.desc}</p>
            {selected.includes(asset.id) && (
              <CheckCircle2 className="absolute top-6 right-6 text-gold w-6 h-6" />
            )}
          </button>
        ))}
      </div>
      <Button
        disabled={selected.length === 0}
        onClick={onNext}
        className="w-full h-16 bg-gold text-black font-bold text-lg rounded-2xl"
      >
        Analyze Strategy Performance
      </Button>
    </motion.div>
  );
}

function RiskSelector({ onSelect }: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center space-y-12"
    >
      <Scale className="w-20 h-20 text-gold mx-auto" />
      <h2 className="text-4xl font-serif font-bold">
        Determine Your Risk Appetite
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {["conservative", "balanced", "aggressive"].map((risk) => (
          <Button
            key={risk}
            onClick={() => onSelect(risk)}
            variant="outline"
            className="h-32 rounded-3xl border-gold/10 hover:bg-gold/5 capitalize text-xl font-serif"
          >
            {risk}
          </Button>
        ))}
      </div>
    </motion.div>
  );
}

function WealthDashboard({ portfolio, profile, isAnalyzing, onReset }: any) {
  if (isAnalyzing)
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <div className="w-20 h-20 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
        <p className="text-xl font-serif italic text-gold">
          Running Monte Carlo Simulations...
        </p>
      </div>
    );

  const totalInvested = profile.monthlySip * 12 * profile.horizon;
  const projectedValue = portfolio.reduce((acc, a) => {
    const r = a.annualReturn / 12;
    const n = profile.horizon * 12;
    return acc + a.monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Breakdown */}
        <div className="lg:col-span-2 glass-gold p-10 rounded-[2.5rem] border border-gold/10">
          <h3 className="text-2xl font-serif font-bold mb-8">
            Strategic Allocation
          </h3>
          <div className="space-y-6">
            {portfolio.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-6">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center bg-black/40",
                      item.color,
                    )}
                  >
                    <item.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{item.label}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                      {Math.round(item.finalWeight * 100)}% Weight
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono font-bold text-gold">
                    ₹{item.monthlyAmount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">per month</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wealth Card */}
        <div className="space-y-6">
          <div className="glass-gold p-10 rounded-[2.5rem] border border-gold/10 bg-emerald-500/5 relative overflow-hidden">
            <h3 className="text-xl font-serif font-bold mb-2">
              Projected Corpus
            </h3>
            <p className="text-5xl font-bold font-mono text-emerald-400 mb-8">
              ₹{Math.round(projectedValue).toLocaleString()}
            </p>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Invested</span>
                <span className="font-bold">
                  ₹{totalInvested.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Wealth Gain</span>
                <span className="text-emerald-500 font-bold">
                  +₹
                  {Math.round(projectedValue - totalInvested).toLocaleString()}
                </span>
              </div>
            </div>
            {portfolio.some((p) => p.id === "crypto") && (
              <div className="mt-8 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-200 leading-relaxed">
                  High-volatility assets (Crypto) are included. Projections are
                  subject to extreme variance.
                </p>
              </div>
            )}
          </div>
          <Button
            onClick={onReset}
            variant="ghost"
            className="w-full h-16 border border-gold/10 text-gold rounded-2xl hover:bg-gold/5"
          >
            <RotateCcw className="mr-3 w-5 h-5" /> Re-construct Portfolio
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
