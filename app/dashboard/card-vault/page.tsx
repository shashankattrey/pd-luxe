"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  CreditCard,
  AlertTriangle,
  X,
  Plane,
  Percent,
  IndianRupee,
  Globe,
  Fuel,
  Zap,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Calendar,
  Star,
  History,
  Sparkles,
  ArrowRight,
  Utensils,
  Gift,
  Info,
  Clock,
  Compass,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  calculateInDepthSavings,
  creditCards,
  type CreditCard as CardType,
} from "@/lib/credit-cards-data";

export default function CardVaultPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [annualSpend, setAnnualSpend] = useState(600000);

  const banks = useMemo(() => {
    return ["All", ...Array.from(new Set(creditCards.map((c) => c.bank)))];
  }, []);

  const filteredCards = useMemo(() => {
    return creditCards.filter((card) => {
      const matchesSearch =
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.searchTags.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBank = selectedBank === "All" || card.bank === selectedBank;
      return matchesSearch && matchesBank;
    });
  }, [searchQuery, selectedBank]);

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-10 md:py-16 min-h-screen">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 md:gap-8">
        <div className="space-y-3 md:space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
              <Compass className="w-7 h-7 md:w-8 md:h-8 text-gold" />
            </div>
            <h1 className="font-serif text-2xl xs:text-3xl sm:text-4xl md:text-6xl font-bold break-anywhere">
              Card Vault
            </h1>
          </motion.div>
          <p className="text-zinc-400 text-base sm:text-lg md:text-xl max-w-2xl font-light">
            Real-time audit of{" "}
            <span className="text-gold font-semibold underline decoration-gold/30 underline-offset-8">
              {creditCards.length}
            </span>{" "}
            instruments against 2026 policies.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-gold p-[1px] rounded-[2.5rem] bg-gradient-to-b from-gold/20 to-transparent"
        >
          <div className="bg-black/60 backdrop-blur-3xl px-8 py-6 rounded-[2.5rem] flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-black mb-1">
                Analysis Baseline
              </p>
              <p className="text-3xl font-serif font-bold text-white">
                ₹{(annualSpend / 100000).toFixed(1)}L{" "}
                <span className="text-sm text-zinc-500 font-sans">/ yr</span>
              </p>
            </div>
            <div className="h-12 w-[1px] bg-white/10" />
            <div className="p-3 bg-green-500/10 rounded-2xl border border-green-500/20">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search & Bank Filter */}
      <div className="flex flex-col gap-4 md:gap-6 sticky top-4 md:top-6 z-30">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-gold transition-colors" />
            <Input
              placeholder="Search by bank, card or benefit"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 md:pl-14 h-10 sm:h-11 md:h-14 text-sm sm:text-base"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 md:h-14 px-6 md:px-8 rounded-2xl md:rounded-[2rem] border text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
              showFilters
                ? "bg-gold text-black border-gold shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                : "bg-white/5 text-white border-white/10 hover:border-gold/40"
            }`}
          >
            <Filter className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
            {selectedBank === "All" ? "Filter Bank" : selectedBank}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex flex-wrap gap-2 p-4 md:p-6 bg-zinc-900/90 backdrop-blur-xl rounded-3xl md:rounded-[2.5rem] border border-white/10"
            >
              {banks.map((bank) => (
                <button
                  key={bank}
                  onClick={() => {
                    setSelectedBank(bank);
                    setShowFilters(false);
                  }}
                  className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all ${
                    selectedBank === bank
                      ? "bg-gold text-black"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {bank}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 md:gap-8 lg:gap-10">
        {filteredCards.map((card, idx) => (
          <CardTile
            key={card.id}
            card={card}
            index={idx}
            annualSpend={annualSpend}
            onClick={() => setSelectedCard(card)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedCard && (
          <CardDetailModal
            card={selectedCard}
            annualSpend={annualSpend}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CardTile({ card, index, annualSpend, onClick }: any) {
  const audit = calculateInDepthSavings(card, annualSpend);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="cursor-pointer group relative h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-[2.7rem]"
    >
      <div className="absolute inset-0 bg-gold/10 blur-[55px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative h-full glass-gold rounded-[2.5rem] overflow-hidden border border-white/5 group-hover:border-gold/40 transition-all duration-300 shadow-xl bg-zinc-900/50 flex flex-col">
        <div
          className={`h-44 md:h-48 bg-gradient-to-br ${card.imageGradient} p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shrink-0`}
        >
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700">
            <CreditCard className="w-28 h-28 md:w-32 md:h-32 text-white" />
          </div>

          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
                {card.bank}
              </p>
              <h3 className="text-white font-serif font-bold text-lg md:text-xl leading-tight max-w-[160px]">
                {card.name}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[9px] text-white font-black uppercase tracking-widest border border-white/10">
                {card.network}
              </span>
              {card.devaluation2026 && (
                <div className="p-1.5 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-white/80">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-gold" /> {card.baseRewardRate}%
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-gold" /> {card.forexMarkup}%
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6 flex-1 flex flex-col justify-between">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gold/60 uppercase tracking-widest">
                Audited Yield
              </p>
              <p className="text-3xl font-serif font-bold text-green-400">
                +{audit.yield}%
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Net Profit
              </p>
              <p className="text-xl font-bold text-white">
                ₹{audit.netValue.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-zinc-500 group-hover:text-gold transition-colors">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              View Full Audit
            </span>
            <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-2 transition-transform" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function CardDetailModal({ card, annualSpend, onClose }: any) {
  const audit = calculateInDepthSavings(card, annualSpend);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 20 }}
        className="fixed inset-0 z-[70] md:inset-4 lg:inset-10 flex flex-col lg:flex-row bg-zinc-950 md:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl"
      >
        {/* MOBILE HEADER - STICKY FOR ACCESSIBILITY */}
        <div className="lg:hidden sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Audit 2026
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-white active:scale-90 transition-transform"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* LEFT PANE: BRANDING (Header on Mobile, Sidebar on Desktop) */}
        <div
          className={`shrink-0 w-full lg:w-[380px] xl:w-[420px] p-8 md:p-12 bg-gradient-to-br ${card.imageGradient} text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10`}
        >
          <div className="space-y-6 md:space-y-12">
            <button
              onClick={onClose}
              className="hidden lg:flex items-center gap-2 text-white/60 hover:text-white transition-colors font-black text-[10px] uppercase tracking-[0.3em]"
            >
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to Vault
            </button>

            <div className="space-y-3 md:space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-black/30 text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] border border-white/10">
                {card.tier} Tier
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold leading-[1.1] tracking-tight">
                {card.name}
              </h2>
              <p className="text-white/60 font-medium tracking-widest uppercase text-[10px] md:text-xs">
                {card.bank}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="p-4 md:p-5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
                <p className="text-[9px] text-white/50 font-black uppercase mb-1 tracking-widest">
                  Joining Privilege
                </p>
                <p className="text-base md:text-lg font-bold text-gold leading-tight">
                  {card.joiningBenefit || "Institutional Welcome"}
                </p>
              </div>
              <div className="p-4 md:p-5 rounded-2xl bg-black/30 border border-white/5">
                <p className="text-[9px] text-white/50 font-black uppercase mb-1 tracking-widest">
                  Annual Milestone
                </p>
                <p className="text-base md:text-lg font-bold text-white/90 leading-tight">
                  {card.milestoneBenefit}
                </p>
              </div>
            </div>
          </div>
          <p className="hidden lg:block text-[9px] font-black text-white/20 uppercase tracking-[0.5em] pt-8">
            Reference: 2026.X.ALPHA
          </p>
        </div>

        {/* RIGHT PANE: SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950">
          <div className="p-6 md:p-10 lg:p-16 space-y-10 md:space-y-16 max-w-5xl mx-auto">
            {/* 1. PRIMARY ECONOMICS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <section className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-zinc-900/50 border border-white/5">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
                    Profitability Audit
                  </h4>
                </div>
                <div className="space-y-4">
                  {audit.breakdown.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs md:text-sm"
                    >
                      <span className="text-zinc-500">{item.label}</span>
                      <span
                        className={
                          item.plus
                            ? "text-green-400 font-bold"
                            : "text-red-400 font-bold"
                        }
                      >
                        {item.plus ? "+" : "-"} ₹
                        {Math.abs(item.value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="pt-6 mt-4 border-t border-white/10 flex justify-between items-baseline">
                    <span className="text-[10px] font-black uppercase text-gold">
                      Net Yield
                    </span>
                    <span className="text-3xl md:text-5xl font-serif font-bold text-white">
                      ₹{audit.netValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </section>

              <section className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-gold/5 border border-gold/10">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                  <Zap className="w-5 h-5 text-gold" />
                  <h4 className="text-gold text-[10px] font-black uppercase tracking-[0.3em]">
                    Yield Multipliers
                  </h4>
                </div>
                <div className="space-y-3">
                  <RewardRow
                    label="Dining & Food"
                    value={card.diningRate}
                    icon={<Utensils className="w-4 h-4" />}
                  />
                  <RewardRow
                    label="Travel Booking"
                    value={card.directBookingRate}
                    icon={<Plane className="w-4 h-4" />}
                  />
                  <RewardRow
                    label="Preferred Channel"
                    value={card.multiplierChannel}
                    icon={<Sparkles className="w-4 h-4" />}
                    highlight
                  />
                </div>
              </section>
            </div>

            {/* 2. FINANCIALS & FUEL LOGISTICS */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 px-2">
                Logistics & Compliance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fee Grid */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-zinc-900 border border-white/5">
                    <p className="text-[9px] text-zinc-500 font-black uppercase mb-1">
                      Joining
                    </p>
                    <p className="text-lg md:text-xl font-bold">
                      ₹{card.joiningFee?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-zinc-900 border border-white/5">
                    <p className="text-[9px] text-zinc-500 font-black uppercase mb-1">
                      Annual
                    </p>
                    <p className="text-lg md:text-xl font-bold">
                      ₹{card.annualFee.toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2 p-5 md:p-6 rounded-2xl md:rounded-3xl bg-zinc-900 border border-white/5 flex justify-between items-center">
                    <p className="text-[9px] text-zinc-500 font-black uppercase">
                      Waiver Spend
                    </p>
                    <p className="text-lg md:text-xl font-bold text-gold">
                      ₹{card.retentionSpendReq.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Fuel Group */}
                <div className="p-6 md:p-8 rounded-[2rem] bg-orange-500/5 border border-orange-500/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-orange-400">
                      <Fuel className="w-5 h-5" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">
                        Fuel Logistics
                      </h4>
                    </div>
                    <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-[8px] font-black uppercase border border-orange-500/20">
                      {card.surchargeWaiver || "1%"} Waiver
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase mb-1">
                        Monthly Cap
                      </p>
                      <p className="text-lg font-bold text-white">
                        {card.fuelCap || "No Cap"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase mb-1">
                        Eligible Range
                      </p>
                      <p className="text-sm font-bold text-white">
                        {card.transactionRange || "₹400-4K"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. TRAVEL & PARTNERS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-blue-500/5 to-transparent border border-white/5 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg leading-tight">
                      Travel Intelligence
                    </h4>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                      Forex Markup: {card.forexMarkup}%
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 md:gap-8">
                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                    <p className="text-[9px] text-zinc-500 font-black uppercase mb-1">
                      Domestic Lounge
                    </p>
                    <p className="text-2xl font-serif font-bold text-white">
                      {card.domesticLounge || "0"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                    <p className="text-[9px] text-zinc-500 font-black uppercase mb-1">
                      International
                    </p>
                    <p className="text-2xl font-serif font-bold text-white">
                      {card.internationalLounge || "0"}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-[10px] md:text-[11px] text-zinc-400 italic">
                  <span className="text-blue-400 font-black uppercase not-italic mr-2">
                    Condition:
                  </span>{" "}
                  {card.loungeSpendReq || "Complimentary via Tier Status."}
                </div>
              </div>

              <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-zinc-900/30 border border-white/5">
                <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                  Partner Transfer
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  {Object.entries(card.airlineTransferJson || {}).map(
                    ([partner, ratio]: any) => (
                      <div
                        key={partner}
                        className="flex justify-between items-center p-3 rounded-xl bg-zinc-900 border border-white/5"
                      >
                        <span className="text-[11px] font-medium text-zinc-400">
                          {partner}
                        </span>
                        <span className="text-[10px] font-black text-blue-400">
                          {ratio}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* 4. RISK AUDIT & NOTES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="p-6 md:p-8 rounded-[2rem] bg-red-950/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-6">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">
                    Earning Exclusions
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 overflow-x-auto pb-2">
                  {Object.entries(card.detailedRewardsJson || {})
                    .filter(([_, v]) => v === "Excluded")
                    .map(([k]) => (
                      <span
                        key={k}
                        className="px-3 py-1.5 rounded-xl bg-red-500/5 text-red-400 text-[9px] font-black uppercase border border-red-500/10"
                      >
                        {k}
                      </span>
                    ))}
                </div>
              </section>

              <section className="p-6 md:p-8 rounded-[2rem] bg-zinc-900 border border-white/5 flex flex-col justify-center">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em] mb-4">
                  Strategic Narrative
                </p>
                <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-light italic">
                  "
                  {card.notesTnc ||
                    "Instrument performance is stable. No high-priority risk factors identified for the 2026 cycle."}
                  "
                </p>
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function RewardRow({ label, value, icon, highlight }: any) {
  return (
    <div
      className={`flex justify-between items-center p-4 rounded-2xl transition-all ${highlight ? "bg-gold/10 border border-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]" : "bg-white/5 border border-transparent"}`}
    >
      <div className="flex items-center gap-4">
        <span className={highlight ? "text-gold" : "text-zinc-500"}>
          {icon}
        </span>
        <span className="text-sm font-medium text-zinc-300">{label}</span>
      </div>
      <span
        className={`text-sm font-black ${highlight ? "text-white" : "text-zinc-400"}`}
      >
        {value}
      </span>
    </div>
  );
}
