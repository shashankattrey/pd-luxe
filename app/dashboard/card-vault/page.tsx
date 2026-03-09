"use client";

import { useState, useMemo } from "react";
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
  const [annualSpend] = useState(600000);

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
    <div className="space-y-10 max-w-[1500px] mx-auto px-4 md:px-6 py-12 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold/10 border border-gold/20">
              <Compass className="w-6 h-6 text-gold" />
            </div>

            <h1 className="font-serif text-3xl md:text-5xl font-bold">
              Card Vault
            </h1>
          </div>

          <p className="text-zinc-400 text-base max-w-2xl font-light">
            Real-time audit of{" "}
            <span className="text-gold font-semibold">
              {creditCards.length}
            </span>{" "}
            instruments against 2026 policies.
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl px-6 py-5 rounded-2xl flex items-center gap-6 border border-white/10">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-gold font-bold">
              Analysis Baseline
            </p>

            <p className="text-2xl font-serif font-bold text-white">
              ₹{(annualSpend / 100000).toFixed(1)}L
            </p>
          </div>

          <TrendingUp className="w-6 h-6 text-green-400" />
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />

          <Input
            placeholder="Search bank, card or benefit"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        <Button
          onClick={() => setShowFilters(!showFilters)}
          className="h-11 px-6"
        >
          <Filter className="w-4 h-4 mr-2" />
          {selectedBank}
        </Button>
      </div>

      {/* Bank Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-2 p-4 bg-zinc-900 rounded-xl border border-white/10"
          >
            {banks.map((bank) => (
              <button
                key={bank}
                onClick={() => {
                  setSelectedBank(bank);
                  setShowFilters(false);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  selectedBank === bank
                    ? "bg-gold text-black"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {bank}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards Grid */}
      <div
        className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        2xl:grid-cols-5
        gap-4 sm:gap-5 lg:gap-6
        "
      >
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

/* CARD TILE */

function CardTile({ card, index, annualSpend, onClick }: any) {
  const audit = calculateInDepthSavings(card, annualSpend);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer group relative text-left rounded-xl focus:outline-none"
    >
      <div className="absolute inset-0 bg-gold/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative rounded-2xl overflow-hidden border border-white/5 group-hover:border-gold/40 transition bg-zinc-900/60">
        {/* Card Header */}
        <div
          className={`h-32 md:h-36 bg-gradient-to-br ${card.imageGradient} p-4 md:p-5 flex flex-col justify-between`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                {card.bank}
              </p>

              <h3 className="text-white font-serif font-semibold text-base md:text-lg leading-tight max-w-[160px]">
                {card.name}
              </h3>
            </div>

            {card.devaluation2026 && (
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            )}
          </div>
          {/* <div className="flex flex-wrap gap-2 mt-2">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-full bg-white/10 text-white border border-white/20 backdrop-blur"
              >
                {tag}
              </span>
            ))}
          </div> */}

          <div className="flex items-center gap-4 text-white/80 text-xs">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-gold" />
              {card.baseRewardRate}%
            </div>

            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-gold" />
              {card.forexMarkup}%
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 md:p-5 space-y-4">
          <div className="flex justify-between items-center">
            {/* <div>
              <p className="text-[10px] text-zinc-500 uppercase">
                Audited Yield
              </p>

              <p className="text-2xl font-serif font-bold text-green-400">
                +{audit.yield}%
              </p>
            </div> */}
            {card.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white border border-white/20 backdrop-blur whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ lineHeight: "1.2rem", height: "2rem" }}
              >
                {tag}
              </span>
            ))}

            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase">Net Profit</p>

              <p className="text-sm font-semibold text-white">
                ₹{audit.netValue.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-between text-xs text-zinc-400 group-hover:text-gold">
            View Details
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* KEEP YOUR ORIGINAL MODAL EXACTLY AS IT WAS */

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
