"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  AlertTriangle,
  X,
  Plane,
  Globe,
  Fuel,
  Zap,
  TrendingUp,
  Compass,
  ArrowRight,
  Utensils,
  Sparkles,
  ShoppingCart,
  Film,
  Hotel,
  Ticket,
  Wallet,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CardPreview from "@/components/ui/card-preview";

import {
  calculateInDepthSavings,
  creditCards,
  type CreditCard as CardType,
  type SpendProfile,
} from "@/lib/credit-cards-data";

export default function CardVaultPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);

  // ALIGNED: Using the keys expected by calculateInDepthSavings
  const [spend, setSpend] = useState<SpendProfile>({
    food: 10000,
    shopping: 20000, // Mapping for Amazon/Flipkart
    travel: 15000, // Mapping for Flights/Hotels
    utilities: 5000,
    fuel: 4000,
    rent: 20000,
    other: 10000,
  });

  const totalMonthlySpend = useMemo(() => {
    return Object.values(spend).reduce((a, b) => a + (Number(b) || 0), 0);
  }, [spend]);

  const banks = useMemo(() => {
    return ["All", ...Array.from(new Set(creditCards.map((c) => c.bank)))];
  }, []);

  const filteredCards = useMemo(() => {
    return creditCards
      .filter((card) => {
        const matchesSearch =
          card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.searchTags.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBank =
          selectedBank === "All" || card.bank === selectedBank;
        return matchesSearch && matchesBank;
      })
      .sort((a, b) => {
        // High-level sort by yield to keep the "best" cards on top
        const yieldA = calculateInDepthSavings(a, spend).netValue;
        const yieldB = calculateInDepthSavings(b, spend).netValue;
        return yieldB - yieldA;
      });
  }, [searchQuery, selectedBank, spend]);

  return (
    <div className="bg-zinc-950 text-white min-h-screen selection:bg-amber-500/30">
      <div className="space-y-10 max-w-[1600px] mx-auto px-4 md:px-8 py-12">
        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/5 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <Compass className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight">
                  Card Vault
                </h1>
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.3em] mt-1">
                  Revision 2026.4.10
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl px-8 py-5 rounded-[2rem] flex items-center gap-6 border border-white/10 shadow-2xl">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-black mb-1">
                Audit Benchmark
              </p>
              <p className="text-3xl font-mono font-bold text-white tracking-tighter">
                ₹{((totalMonthlySpend * 12) / 100000).toFixed(1)}L{" "}
                <span className="text-zinc-500 text-sm font-light uppercase">
                  PA
                </span>
              </p>
            </div>
            <div className="h-12 w-px bg-white/10 mx-2" />
            <TrendingUp className="w-8 h-8 text-green-400 opacity-80" />
          </div>
        </div>

        {/* --- SPEND CONTROLS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 bg-white/5 p-6 rounded-3xl border border-white/10">
          <SpendInput
            label="Food"
            icon={<Utensils />}
            value={spend.food}
            onChange={(v) => setSpend({ ...spend, food: v })}
          />
          <SpendInput
            label="Shopping"
            icon={<ShoppingCart />}
            value={spend.shopping}
            onChange={(v) => setSpend({ ...spend, shopping: v })}
          />
          <SpendInput
            label="Travel"
            icon={<Plane />}
            value={spend.travel}
            onChange={(v) => setSpend({ ...spend, travel: v })}
          />
          <SpendInput
            label="Fuel"
            icon={<Fuel />}
            value={spend.fuel}
            onChange={(v) => setSpend({ ...spend, fuel: v })}
          />
          <SpendInput
            label="Rent"
            icon={<Building2 />}
            value={spend.rent}
            onChange={(v) => setSpend({ ...spend, rent: v })}
          />
          <SpendInput
            label="Utilities"
            icon={<Zap />}
            value={spend.utilities}
            onChange={(v) => setSpend({ ...spend, utilities: v })}
          />
          <SpendInput
            label="Other"
            icon={<Wallet />}
            value={spend.other}
            onChange={(v) => setSpend({ ...spend, other: v })}
          />
        </div>

        {/* --- SEARCH --- */}
        <div className="flex flex-col md:flex-row gap-4 sticky top-6 z-40">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-amber-500" />
            <Input
              placeholder="Search Amazon, Zomato, Air India, or 'LTF'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-16 bg-zinc-900/80 backdrop-blur-md border-white/10 focus:border-amber-500/50 rounded-2xl text-lg shadow-2xl"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-16 px-8 border-white/10 bg-zinc-900/80 hover:bg-white/5 rounded-2xl font-semibold"
          >
            <Filter className="w-5 h-5 mr-3" />
            {selectedBank}
          </Button>
        </div>

        {/* --- GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {filteredCards.map((card, idx) => (
            <CardTile
              key={card.id}
              card={card}
              index={idx}
              spend={spend}
              onClick={() => setSelectedCard(card)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedCard && (
          <CardDetailModal
            card={selectedCard}
            spend={spend}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CardTile({
  card,
  index,
  spend,
  onClick,
}: {
  card: CardType;
  index: number;
  spend: SpendProfile;
  onClick: () => void;
}) {
  const audit = calculateInDepthSavings(card, spend);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      whileHover={{ y: -8 }}
      onClick={onClick}
      className="group cursor-pointer h-full"
    >
      <div className="relative h-full flex flex-col bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden group-hover:border-amber-500/30 transition-all shadow-2xl">
        <div
          className={`h-40 p-7 bg-gradient-to-br ${card.imageGradient} relative`}
        >
          <div className="absolute top-0 right-0 p-6">
            <div
              className={`p-2 rounded-xl border shadow-lg ${card.devaluation2026 ? "bg-red-500/20 border-red-500/30" : "bg-green-500/20 border-green-500/30"}`}
            >
              {card.devaluation2026 ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              )}
            </div>
          </div>
          <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
            {card.bank}
          </p>
          <h3 className="text-white font-serif font-bold text-xl leading-tight pr-10">
            {card.name}
          </h3>
        </div>

        <div className="p-7 flex-1 flex flex-col justify-between">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                Audit Yield (Annual)
              </p>
              <p
                className={`text-3xl font-mono font-bold ${audit.netValue > 0 ? "text-green-400" : audit.netValue < 0 ? "text-red-400" : "text-zinc-500"}`}
              >
                {audit.netValue < 0 ? "-" : ""}₹
                {Math.abs(Math.round(audit.netValue)).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-all">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5 mt-6">
            {card.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 border border-white/5 uppercase font-black tracking-tighter"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CardDetailModal({
  card,
  spend,
  onClose,
}: {
  card: CardType;
  spend: SpendProfile;
  onClose: () => void;
}) {
  const audit = calculateInDepthSavings(card, spend);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        className="fixed inset-0 md:inset-6 lg:inset-16 z-[110] bg-zinc-950 border border-white/10 rounded-none md:rounded-[3rem] overflow-y-auto flex flex-col lg:flex-row shadow-[0_0_100px_rgba(0,0,0,1)]"
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
      >
        {/* --- LEFT SIDEBAR: Branding & Key Identity --- */}
        <div
          className={`lg:w-[450px] shrink-0 bg-gradient-to-br ${card.imageGradient} 
  p-8 md:p-14 flex flex-col justify-between text-white relative 
  min-h-[300px] md:min-h-[420px]`}
        >
          <div className="space-y-10">
            <button
              onClick={onClose}
              className="p-4 bg-black/20 hover:bg-black/40 rounded-full transition-all border border-white/10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black tracking-[0.3em] uppercase">
                  {card.tier} Tier
                </span>
                {card.isLtf && (
                  <span className="px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-[10px] font-black tracking-[0.3em] uppercase text-green-400">
                    Life Time Free
                  </span>
                )}
              </div>

              <h2 className="text-3xl md:text-5xl lg:text-7xl font-serif font-bold leading-[1.1] tracking-tighter">
                {card.name}
              </h2>
              <CardPreview card={card} />

              <div className="space-y-1">
                <p className="text-2xl font-light opacity-80">{card.bank}</p>
                <p className="text-sm font-mono uppercase tracking-[0.2em] opacity-50">
                  {card.network} Network
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-8 rounded-[2.5rem] bg-black/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
              <p className="text-[10px] uppercase font-black tracking-widest opacity-50 mb-3 text-amber-500">
                Welcome Benefit
              </p>
              <p className="text-lg font-medium italic leading-relaxed text-zinc-100">
                "{card.joiningBenefit}"
              </p>
            </div>
          </div>
        </div>

        {/* --- RIGHT CONTENT: The Deep Audit --- */}
        <div className="flex-1 p-6 md:p-14 lg:p-20 bg-zinc-950">
          <div className="max-w-5xl mx-auto space-y-20">
            {/* 1. Platform Performance Grid */}
            <section className="space-y-8">
              <h4 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Platform Accelerators
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AcceleratorBox
                  icon={<ShoppingCart />}
                  label="Amazon/FK"
                  val={`${card.amazonRate}%`}
                  active={card.amazonRate > card.baseRewardRate}
                />
                <AcceleratorBox
                  icon={<Utensils />}
                  label="Swiggy/Zom"
                  val={`${card.swiggyRate}%`}
                  active={card.swiggyRate > card.baseRewardRate}
                />
                <AcceleratorBox
                  icon={<Plane />}
                  label="Flights"
                  val={`${card.flightRate}%`}
                  active={card.flightRate > card.baseRewardRate}
                />
                <AcceleratorBox
                  icon={<Hotel />}
                  label="Hotels"
                  val={`${card.hotelRate}%`}
                  active={card.hotelRate > card.baseRewardRate}
                />
                <AcceleratorBox
                  icon={<Film />}
                  label="Movies"
                  val={card.movieDealType}
                  active={card.movieEffectiveRate > 0}
                />
                <AcceleratorBox
                  icon={<Zap />}
                  label="Utilities"
                  val={`${card.utilityRate}%`}
                  active={card.utilityRate > 0}
                />
                <AcceleratorBox
                  icon={<Building2 />}
                  label="Rent/Govt"
                  val={`${card.rentRate}%`}
                  active={false}
                  isRisk={card.rentRate === 0}
                />
                <AcceleratorBox
                  icon={<Ticket />}
                  label="Base Rate"
                  val={`${card.baseRewardRate}%`}
                  active={false}
                />
              </div>
            </section>

            {/* 2. Economic Audit & Accrual Trace */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-16 border-t border-white/5 pt-16">
              {/* Left Column: Net Economic Value */}
              <div className="space-y-8">
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
                  Economic Audit
                </h4>

                {/* NEW: Audit Trace Component replaces the old list */}
                <RewardChart audit={audit} />

                <div className="p-10 bg-gradient-to-br from-zinc-900 to-black rounded-[3rem] border border-white/10 shadow-2xl">
                  <p
                    className={`text-4xl md:text-6xl lg:text-7xl font-mono font-bold tracking-tighter ${audit.netValue >= 0 ? "text-amber-500" : "text-red-500"}`}
                  >
                    ₹{Math.round(audit.netValue).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-zinc-500" />
                    <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">
                      Projected Annual Net Profit
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Reward Calculation Breakdown */}
              <div className="space-y-8">
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
                  Points Accrual Trace
                </h4>
                <PlatformBreakdown card={card} spend={spend} audit={audit} />

                <div className="space-y-6 pt-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
                    Logistics & Limits
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-zinc-900 p-8 rounded-[2rem] border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-black mb-2">
                        Domestic Lounge
                      </p>
                      <p className="text-3xl font-bold font-mono">
                        {card.domesticLounge}
                      </p>
                    </div>
                    <div className="bg-zinc-900 p-8 rounded-[2rem] border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-black mb-2">
                        Forex Markup
                      </p>
                      <p className="text-3xl font-bold font-mono text-amber-500">
                        {card.forexMarkup}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Policy & Exclusion Alerts */}
            <section className="p-10 rounded-[3rem] bg-red-950/10 border border-red-500/20">
              <div className="flex items-center gap-4 text-red-500 mb-6">
                <AlertTriangle className="w-6 h-6" />
                <h5 className="text-xs font-black uppercase tracking-[0.2em]">
                  2026 Exclusion & Policy Audit
                </h5>
              </div>
              <p className="text-zinc-400 text-base leading-relaxed italic">
                "
                {card.notesTnc ||
                  "No critical devaluations or high-risk policy changes detected for this instrument in the current 2026 cycle."}
                "
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/**
 * Detailed Trace of Category Rewards
 */
function PlatformBreakdown({
  card,
  spend,
  audit,
}: {
  card: CardType;
  spend: SpendProfile;
  audit: any;
}) {
  // 1. Safety Guard: If audit is missing or still loading, show a placeholder
  if (!audit || !audit.breakdown) {
    return (
      <div className="p-8 text-zinc-500 animate-pulse text-center">
        Finalizing Audit Trace...
      </div>
    );
  }

  const categories = [
    {
      label: "Dining & Food",
      monthly: spend.food,
      rate: Math.max(card.swiggyRate, card.baseRewardRate),
      icon: <Utensils className="w-3 h-3" />,
      searchKey: "Dining", // Internal key used by your engine
    },
    {
      label: "Online Shopping",
      monthly: spend.shopping,
      rate: Math.max(card.amazonRate, card.baseRewardRate),
      icon: <ShoppingCart className="w-3 h-3" />,
      searchKey: "Shopping",
    },
    {
      label: "Travel & Stays",
      monthly: spend.travel,
      rate: Math.max(card.flightRate, card.hotelRate, card.baseRewardRate),
      icon: <Plane className="w-3 h-3" />,
      searchKey: "Travel",
    },
    {
      label: "Other Spends",
      monthly: spend.utilities + spend.fuel + spend.other,
      rate: card.baseRewardRate,
      icon: <Wallet className="w-3 h-3" />,
      searchKey: "Other",
    },
  ];

  return (
    <div className="space-y-4 bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5">
      {categories.map((cat, i) => {
        // 2. Logic: Look for the value in audit.breakdown using a partial match
        const auditItem = audit.breakdown.find(
          (b: any) =>
            // Ensure the label matches but EXCLUDE the line that contains "Perks"
            (b.label.includes(cat.searchKey) || cat.label.includes(b.label)) &&
            !b.label.toLowerCase().includes("perks"),
        );

        // 3. Fallback: If the engine hasn't calculated this line, calculate gross yield
        const annualGross = (cat.monthly * 12 * cat.rate) / 100;
        const realizedValue = auditItem ? auditItem.value : annualGross;

        // 4. Cap Detection: If the realized value is less than gross, it's capped
        const isCapped =
          Math.round(realizedValue) < Math.round(annualGross) &&
          realizedValue !== 0;

        return (
          <div
            key={i}
            className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">{cat.icon}</span>
                <p className="text-sm font-semibold text-zinc-200">
                  {cat.label}
                </p>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">
                ₹{(cat.monthly * 12).toLocaleString()} @ {cat.rate}% Yield
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-bold ${isCapped ? "text-amber-500" : "text-white"}`}
              >
                ₹{Math.round(realizedValue).toLocaleString()}
                {isCapped && (
                  <span className="text-[8px] ml-1 font-black opacity-80 underline decoration-amber-500/30">
                    CAPPED
                  </span>
                )}
              </p>
              <p className="text-[9px] text-zinc-600 font-mono">
                Realized Value
              </p>
            </div>
          </div>
        );
      })}

      {/* 5. Logic: Only show cap alert if the card actually has limits */}
      {card.monthlyRewardCap !== "No Cap" && (
        <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-200/60 leading-normal font-medium">
            Cap Alert: This card limits monthly rewards. The audit trace above
            has been adjusted for these limits.
          </p>
        </div>
      )}
    </div>
  );
}

function AcceleratorBox({
  icon,
  label,
  val,
  active,
  isRisk,
}: {
  icon: any;
  label: string;
  val: string;
  active: boolean;
  isRisk?: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-3xl border transition-all ${active ? "bg-amber-500/10 border-amber-500/30 shadow-xl" : isRisk ? "bg-red-500/5 border-red-500/10 opacity-60" : "bg-zinc-900/50 border-white/5"}`}
    >
      <div
        className={`mb-4 ${active ? "text-amber-500 scale-110" : isRisk ? "text-red-400" : "text-zinc-500"}`}
      >
        {icon}
      </div>
      <p className="text-[9px] uppercase font-black text-zinc-500 mb-1 tracking-widest">
        {label}
      </p>
      <p
        className={`text-base font-bold font-mono ${active ? "text-amber-500" : isRisk ? "text-red-400" : "text-white"}`}
      >
        {val || "N/A"}
      </p>
    </div>
  );
}

function SpendInput({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: any;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-zinc-900/60 border border-white/5 p-4 rounded-2xl space-y-2">
      <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
        {icon}
        {label}
      </div>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="bg-transparent border-white/10 text-white font-mono"
      />
    </div>
  );
}
// Place this at the end of your file with other sub-components
function CardAuditTrace({ audit }: { audit: any }) {
  if (!audit) return null;

  return (
    <div className="space-y-4 p-8 bg-zinc-900/60 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-black">
          2026 Audit Trace
        </h4>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[9px] text-zinc-600 font-mono uppercase font-bold">
            Standardized Yield
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {audit.breakdown.map((item: any, idx: number) => (
          <div
            key={idx}
            className="flex justify-between items-center border-b border-white/[0.03] pb-3 last:border-0"
          >
            <span className="text-sm text-zinc-400 font-medium">
              {item.label}
            </span>
            <span
              className={
                item.plus
                  ? "text-emerald-400 font-mono font-bold"
                  : "text-rose-400 font-mono font-bold"
              }
            >
              {item.plus ? "+" : "-"} ₹{Math.abs(item.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {audit.feeWaived && (
          <div className="py-1.5 px-3 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded-xl border border-emerald-500/20 uppercase tracking-tight">
            ✓ Fee Waiver Unlocked
          </div>
        )}
        {audit.netValue > 0 && (
          <div className="py-1.5 px-3 bg-amber-500/10 text-amber-500 text-[9px] font-black rounded-xl border border-amber-500/20 uppercase tracking-tight">
            ✓ Positive ROI
          </div>
        )}
      </div>
    </div>
  );
}
function RewardChart({ audit }: { audit: any }) {
  const data = audit.breakdown
    .filter((i: any) => i.plus)
    .map((i: any) => ({
      name: i.label,
      value: i.value,
    }));

  return (
    <div className="h-64">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={100} innerRadius={50}>
            {data.map((_: any, i: number) => (
              <Cell key={i} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
