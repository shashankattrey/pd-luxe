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
  IndianRupee,
  Pencil,
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

interface Filters {
  search: string;
  tags: string[];
  categories: string[];
  joiningFee: number[];
  forex: number[];
  lounge: number[];
  ltfOnly: boolean;
  zeroForexOnly: boolean;
  sortBy: string;
}

export default function CardVaultPage() {
  const [selectedBank, setSelectedBank] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [showSpendEditor, setShowSpendEditor] = useState(false);

  // ALIGNED: Using the keys expected by calculateInDepthSavings
  const [spend, setSpend] = useState<SpendProfile>({
    food: 10000,
    grocery: 5000,
    shopping: 20000, // Mapping for Amazon/Flipkart
    travel: 15000, // Mapping for Flights/Hotels
    utilities: 5000,
    fuel: 4000,
    rent: 20000,
    other: 10000,
  });
  const [filters, setFilters] = useState<Filters>({
    search: "",
    tags: [],
    categories: [],
    joiningFee: [0, 50000],
    forex: [0, 5],
    lounge: [0, 12],
    ltfOnly: false,
    zeroForexOnly: false,
    sortBy: "rewards",
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
        const matchesCategory =
          filters.categories.length === 0 ||
          filters.categories.some((cat) =>
            (card.tags ?? []).some((tag: string) =>
              tag.toLowerCase().includes(cat.toLowerCase()),
            ),
          );
        // SEARCH
        const matchesSearch =
          card.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          card.bank.toLowerCase().includes(filters.search.toLowerCase()) ||
          card.searchTags
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          (card.tags || []).some((tag) =>
            tag.toLowerCase().includes(filters.search.toLowerCase()),
          );

        // BANK
        const matchesBank =
          selectedBank === "All" || card.bank === selectedBank;

        // JOINING FEE
        const matchesJoiningFee = card.joiningFee <= filters.joiningFee[1];

        // FOREX
        const matchesForex = card.forexMarkup <= filters.forex[1];

        // LOUNGE
        const matchesLounge = Number(card.domesticLounge) <= filters.lounge[1];
        const matchesLTF = !filters.ltfOnly || card.lifetimeFree === true;

        const matchesZeroForex =
          !filters.zeroForexOnly || card.forexMarkup === 0;

        return (
          matchesSearch &&
          matchesBank &&
          matchesJoiningFee &&
          matchesForex &&
          matchesLounge &&
          matchesCategory &&
          matchesLTF &&
          matchesZeroForex
        );
      })
      .sort((a, b) => {
        if (filters.sortBy === "roi") {
          const yieldA = calculateInDepthSavings(a, spend).netValue;
          const yieldB = calculateInDepthSavings(b, spend).netValue;
          return yieldB - yieldA;
        }

        if (filters.sortBy === "lounge") {
          return Number(b.domesticLounge) - Number(a.domesticLounge);
        }

        if (filters.sortBy === "forex") {
          return a.forexMarkup - b.forexMarkup;
        }

        if (filters.sortBy === "fee") {
          return a.joiningFee - b.joiningFee;
        }

        return 0;
      });
  }, [filters, selectedBank, spend]);
  const activeFilterCount =
    filters.categories.length +
    (filters.ltfOnly ? 1 : 0) +
    (filters.zeroForexOnly ? 1 : 0);

  return (
    <div className="bg-zinc-950 text-white min-h-screen selection:bg-yellow-400/30">
      <div className="space-y-10 max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* --- HEADER --- */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-white/5 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <Compass className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h1 className="font- text-4xl md:text-6xl font-bold tracking-tight">
                  Card Vault
                </h1>
                <p className="text-zinc-500 font- text-xs uppercase tracking-[0.3em] mt-1">
                  Revision 2026.4.10
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl px-8 py-5 rounded-[2rem] flex items-center gap-6 border border-white/10 shadow-2xl relative">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-400 font-black mb-1">
                Audit Benchmark
              </p>
              <p className="text-3xl font-bold text-white tracking-tighter">
                ₹{((totalMonthlySpend * 12) / 100000).toFixed(1)}L{" "}
                <span className="text-zinc-500 text-sm font-light uppercase">
                  PA
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-12 w-px bg-white/10" />

              <button
                onClick={() => setShowSpendEditor(!showSpendEditor)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg 
    text-xs font-semibold text-yellow-400 
    bg-yellow-400/10 border border-yellow-400/20
    hover:bg-yellow-400/20 transition"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* --- SPEND CONTROLS --- */}
        <AnimatePresence>
          {showSpendEditor && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 bg-zinc-900/40 p-5 rounded-2xl border border-white/10"
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- SEARCH --- */}
        {/* <div className="flex flex-col md:flex-row gap-4 sticky top-6 z-40">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-yellow-400" />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-16 px-8 border-white/10 bg-zinc-900/80 hover:bg-white/5 rounded-2xl font-semibold"
          >
            <Filter className="w-5 h-5 mr-3" />
            {selectedBank}
          </Button>
        </div> */}

        {/* FILTER SECTION */}

        {/* FILTER SECTION */}

        <div className="flex items-center gap-3 mb-10 max-w-xl">
          <SearchBar filters={filters} setFilters={setFilters} />

          <button
            onClick={() => setShowFilters(true)}
            className="
      flex items-center justify-center
      h-10 w-10
      rounded-xl
      border border-white/10
      bg-zinc-900/60
      hover:bg-zinc-800
      transition
      relative
    "
          >
            <Filter className="w-4 h-4 text-zinc-300" />

            {activeFilterCount > 0 && (
              <span
                className="
        absolute -top-2 -right-2
        bg-yellow-400 text-black
        text-[10px] font-bold
        px-1.5 py-0.5
        rounded-full
      "
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* --- GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
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
      <FilterSheet
        show={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
      />
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
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={onClick}
      className="group cursor-pointer w-full h-[200px]"
    >
      <div className="relative w-full h-full flex flex-col bg-zinc-900/40 border border-white/10 rounded-[1.2rem] overflow-hidden transition-all duration-300 shadow-2xl group-hover:border-b-neutral-900 border-0.5 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]">
        {/* CARD FACE */}
        <div
          className={`relative flex-1 p-5 flex flex-col justify-between bg-gradient-to-br ${card.imageGradient}`}
        >
          {/* CHIP */}
          <div className="flex justify-between items-start">
            <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-inner border border-yellow-400/50" />
          </div>

          {/* BANK + CARD NAME */}
          <div className="my-2">
            <p className="text-white/60 text-[9px] uppercase tracking-[0.25em] font-black">
              {card.bank} Bank
            </p>

            <h3 className="text-white  font-bold text-[15px] leading-tight ">
              {card.name}
            </h3>
          </div>

          {/* TAGS INSIDE GRADIENT */}
          <div className="flex gap-2 flex-wrap">
            {card.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[8px] px-3 py-1 rounded-md bg-black/25 backdrop-blur border border-white/10 text-white/80 uppercase font-bold tracking-wide"
              >
                {tag}
              </span>
            ))}

            <p className="text-xs  uppercase absolute right-2 tracking-[0.2em] opacity-50">
              {card.network}
            </p>
          </div>
        </div>
        {index === 0 && (
          <div className="absolute top-3 right-0 bg-green-800 text-white text-[10px] px-2 py-1 rounded-l-xl font-bold">
            TOP PICK
          </div>
        )}

        {/* CARD FOOTER */}
        <div className="px-5 py-3 flex justify-between justify-items-start bg-black/40 backdrop-blur">
          {/* SAVINGS */}
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
              Savings
            </p>

            <p
              className={`text-base font-bold ${
                audit.netValue > 0
                  ? "text-green-400"
                  : audit.netValue < 0
                    ? "text-red-400"
                    : "text-zinc-500"
              }`}
            >
              {audit.netValue < 0 ? "-" : ""}₹
              {Math.abs(Math.round(audit.netValue)).toLocaleString()}
            </p>
          </div>

          {/* FEES */}
          <div className="flex flex-col text-center text-[10px]">
            <span className="text-zinc-500">Fees</span>
            <span className="font text-white text-[12px]">
              {card.joiningFee} + GST
            </span>
          </div>

          {/* ACTION */}
          <div className="text-xs text-yellow-400 font-semibold">
            View Details →
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
  console.log("Card:", card.name, "Fee Waiver Limit:", card.renewalWaiverLimit);

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
        className="
        fixed inset-0 
        lg:inset-6
        2xl:inset-10
        z-[110]
        bg-zinc-950
        border border-white/10
        rounded-none lg:rounded-3xl
        overflow-y-auto
        flex flex-col lg:flex-row
        "
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
      >
        {/* --- LEFT SIDEBAR: Branding & Key Identity --- */}
        <div
          className={`w-full
lg:w-[460px] shrink-0 bg-zinc-950
  p-8 md:p-14 flex flex-col justify-between text-white relative 
  min-h-[300px] md:min-h-[420px]`}
        >
          <div className="space-y-10">
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

              <h2 className="text-xl md:text-5xl lg:text-5xl font- font-bold leading-[1.1] tracking-tighter">
                {card.name}
              </h2>
              <CardPreview card={card} />

              <div className="space-y-1">
                {/* <p className="text-2xl font-light opacity-80">{card.bank}</p>
                <p className="text-sm font- uppercase tracking-[0.2em] opacity-50">
                  {card.network} Network
                </p> */}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-8 rounded-[2.5rem] bg-black/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
              <p className="text-[10px] uppercase font-black tracking-widest opacity-50 mb-3 text-yellow-400">
                Welcome Benefit
              </p>
              <p className="text-lg font-medium italic leading-relaxed text-zinc-100">
                "{card.joiningBenefit}"
              </p>
            </div>
          </div>
          <div className="space-y-4 mt-10">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
              Aviation & Transfer Hub
            </h4>
            <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">
                    Travel Redemption
                  </p>
                  <p className="text-3xl font-bold font- text-emerald-400">
                    ₹{card.pointsRedemptionValueTravel || card.pointValue}
                  </p>
                  <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">
                    Value per Point on Flights
                  </p>
                </div>
                <div className="text-right">
                  <Plane className="w-8 h-8 text-zinc-800 mb-2 ml-auto" />
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                    Top Partner Ratio
                  </span>
                </div>
              </div>

              <div className="h-px bg-white/5 w-full" />

              <div className="space-y-4">
                {Object.entries(card.airlineTransferJson)
                  .slice(0, 3)
                  .map(([partner, ratio]) => (
                    <div
                      key={partner}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-zinc-400">{partner}</span>
                      <span className="font- font-bold text-zinc-100">
                        {ratio}
                      </span>
                    </div>
                  ))}
                {Object.keys(card.airlineTransferJson).length === 0 && (
                  <p className="text-xs text-zinc-600 italic">
                    No direct airline transfer partners detected.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 3. Detailed Logistics (NEW SECTION) */}
          <section className="space-y-8 border-t border-white/5 pt-16">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
              Financial & Access Logistics
            </h4>

            <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2rem] flex flex-col lg:flex-row justify-between items-center">
              <p className="text-[14px] uppercase font-black text-yellow-400 mb-4 lg:mb-0 tracking-widest">
                Fee Structure
              </p>
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">Joining</span>
                  <span className="font- font-bold">₹{card.joiningFee}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base text-zinc-500">Annual</span>
                  <span className="font- font-bold">₹{card.annualFee}</span>
                </div>
              </div>
            </div>
            <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2rem] flex flex-col lg:flex-row justify-between items-start lg:items-center">
              <p className="text-[14px] uppercase font-black text-yellow-400 mb-4 lg:mb-0 tracking-widest">
                Perks Audit
              </p>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex flex-col">
                  <span className="text-[12px] text-zinc-500 uppercase font-bold">
                    Joining Benefit
                  </span>
                  <span className="text-base font-medium text-zinc-200 mt-1">
                    {card.joiningBenefit || "N/A"}
                  </span>
                </div>
                {card.milestoneBenefit && (
                  <div className="flex flex-col">
                    <span className="text-[12px] text-zinc-500 uppercase font-bold">
                      Milestones
                    </span>
                    <span className="text-base font-medium text-yellow-400 mt-1">
                      {card.milestoneBenefit}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 mt-6 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <IndianRupee className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                      Exchange Rate
                    </p>
                    <p className="text-xs text-zinc-400">
                      1 {card.rewardUnit} = ₹{card.pointValue}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold font- text-emerald-400">
                    ₹{(card.pointValue * 1000).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[9px] text-zinc-600 font-black uppercase">
                    Value per 1,000 Pts
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* --- RIGHT CONTENT: The Deep Audit --- */}

        <div className="flex-1 p-6 md:p-10 xl:p-12 bg-zinc-950">
          <div className="max-w-4xl mx-auto space-y-12">
            <button
              onClick={onClose}
              className="p-4 bg-black/20 hover:bg-black/40 rounded-lg transition-all border border-white/10 absolute right-3 top-3"
            >
              <X className="w-6 h-6" />
            </button>
            {/* 1. Platform Performance Grid */}
            <section className="space-y-8">
              <h4 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Platform Accelerators
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 border-t border-white/5 pt-16">
              {/* Left Column: Net Economic Value */}
              <div className="space-y-8">
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
                  Economic Audit
                </h4>

                {/* NEW: Audit Trace Component replaces the old list */}
                <RewardChart audit={audit} />

                <div className="p-10 bg-gradient-to-br from-zinc-900 to-black rounded-[3rem] border border-white/10 shadow-2xl">
                  <p
                    className={`text-4xl md:text-6xl lg:text-7xl font- font-bold tracking-tighter ${audit.netValue >= 0 ? "text-yellow-400" : "text-red-500"}`}
                  >
                    ₹{Math.round(audit.netValue).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-zinc-500" />
                    <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">
                      Projected Annual Net Profit
                    </p>
                  </div>

                  {/* --- Quick Audit Status --- */}
                </div>
                <div className="flex items-center gap-4 mt-6">
                  {card.renewalWaiverLimit && (
                    <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full font-bold text-sm border border-green-400/30">
                      ✓ Fee Waiver Unlocked
                    </div>
                  )}
                  {audit.netValue > 0 && (
                    <div className="flex items-center gap-2 bg-yellow-400/20 text-yellow-400 px-3 py-1.5 rounded-full font-bold text-sm border border-yellow-400/30">
                      ✓ Positive ROI
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Reward Calculation Breakdown */}
              <div className="space-y-8">
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
                  Points Accrual Trace
                </h4>
                <PlatformBreakdown card={card} spend={spend} audit={audit} />
                {audit.travelValue > 0 && (
                  <div className="flex justify-between items-center border-b border-white/[0.03] pb-3">
                    <div className="flex flex-col">
                      <span className="text-sm text-zinc-300 font-medium">
                        Travel Perks & Forex
                      </span>
                      <span className="text-[9px] text-emerald-500 font-bold uppercase">
                        Zero Markup Savings
                      </span>
                    </div>
                    <span className="text-emerald-400 font- font-bold text-lg">
                      + ₹{audit.travelValue.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="space-y-6 pt-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
                    Logistics & Limits
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                    {/* Domestic Lounge */}
                    <div className="bg-zinc-900 p-8 rounded-[2rem] border border-white/5 flex-col grid grid-cols-4">
                      <p className="text-[10px] text-zinc-500 uppercase font-black mb-2">
                        Domestic Lounge
                      </p>
                      <p className="text-2xl font-bold text-center">
                        {card.domesticLounge}
                      </p>
                      <p className="text-[10px] text-zinc-500 uppercase font-black mb-2  ">
                        International Lounge
                      </p>
                      <p className="text-2xl font-bold text-center">
                        {card.internationalLounge}
                      </p>
                    </div>

                    {/* Forex Markup */}
                    <div className="bg-zinc-900 p-8 rounded-[2rem] border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-black mb-2">
                        Forex Markup
                      </p>
                      <p className="text-xl font-bold font- text-yellow-400">
                        {card.forexMarkup}%
                      </p>
                    </div>

                    {/* Fuel Surcharge Waiver - UI ONLY */}
                  </div>

                  <div className="bg-zinc-900 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                    {/* Icon with subtle glow */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                      <Fuel className="w-10 h-10 text-orange-500" />
                    </div>

                    <p className="text-[10px] text-zinc-500 uppercase font-black mb-3 tracking-widest">
                      Fuel Benefits
                    </p>

                    <div className="space-y-4">
                      {/* Part A: The Waiver (Savings) */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[8px] font-black text-orange-500 uppercase">
                            FUEL REWARDS
                          </span>
                        </div>
                        <p className="text-2xl font-bold font- text-zinc-200">
                          {card.fuelRewardRate || "0"}
                          {"% "}
                          <span className="text-xs text-zinc-500 font-sans uppercase">
                            Rewards
                          </span>
                        </p>
                        {/* <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">
                          Effective: ₹{card.rewardValue || "0.50"} per point
                        </p> */}
                      </div>

                      <div className="h-px bg-white/5 w-full" />
                      <div>
                        <p className="text-3xl font-bold font- text-emerald-400">
                          {card.surchargeWaiver || "1%"}{" "}
                          <span className="text-xs text-emerald-600 font-sans uppercase">
                            Waiver
                          </span>
                        </p>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">
                          Cap: ₹{card.fuelCap || "250"}/mo
                        </p>
                      </div>

                      {/* Part B: The Rewards (Earnings) */}
                    </div>
                  </div>
                </div>
                {/* Add this inside your Trace mapping logic */}
              </div>
            </section>

            {/* 3. Policy & Exclusion Alerts */}
            <section className="p-10 rounded-[3rem] bg-red-950/10 border border-red-500/20 mx-auto w-full max-w-3xl mt-16">
              <div className="flex items-center gap-4 text-red-500 mb-6 justify-center">
                <AlertTriangle className="w-6 h-6" />
                <h5 className="text-xs font-black uppercase tracking-[0.2em]">
                  2026 Exclusion & Policy Audit
                </h5>
              </div>
              <p className="text-zinc-400 text-base leading-relaxed italic text-center">
                "
                {card.notesTnc ||
                  "No critical devaluations or high-risk policy changes detected for this instrument in the current 2026 cycle."}
                "
              </p>
            </section>
          </div>
        </div>
      </motion.div>

      {/* --- Grid Section --- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 border-t border-white/5 pt-16">
        {/* Left and Right Columns */}
      </section>

      {/* --- Notes Section (Horizontally Centered) --- */}
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
              <p className="text-[10px] text-zinc-500 font- uppercase tracking-tighter">
                ₹{(cat.monthly * 12).toLocaleString()} @ {cat.rate}% Yield
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-bold ${isCapped ? "text-yellow-400" : "text-white"}`}
              >
                ₹{Math.round(realizedValue).toLocaleString()}
                {isCapped && (
                  <span className="text-[8px] ml-1 font-black opacity-80 underline decoration-yellow-400/30">
                    CAPPED
                  </span>
                )}
              </p>
              <p className="text-[9px] text-zinc-600 font-">Realized Value</p>
            </div>
          </div>
        );
      })}

      {/* 5. Logic: Only show cap alert if the card actually has limits */}
      {card.monthlyRewardCap !== "No Cap" && (
        <div className="mt-4 p-4 bg-yellow-400/5 border border-yellow-400/10 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-yellow-200/60 leading-normal font-medium">
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
      className={`p-4 rounded-xl border transition-all ${active ? "bg-yellow-400/10 border-yellow-400/30 shadow-xl" : isRisk ? "bg-red-500/5 border-red-500/10 opacity-60" : "bg-zinc-900/50 border-white/5"}`}
    >
      <div
        className={`mb-4 ${active ? "text-yellow-400 scale-110" : isRisk ? "text-red-400" : "text-zinc-500"}`}
      >
        {icon}
      </div>
      <p className="text-[9px] uppercase font-black text-zinc-500 mb-1 tracking-widest">
        {label}
      </p>
      <p
        className={`text-base font-bold font- ${active ? "text-yellow-400" : isRisk ? "text-red-400" : "text-white"}`}
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
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="bg-transparent border-white/10 text-white font-"
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
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-[9px] text-zinc-600 font- uppercase font-bold">
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
                  ? "text-emerald-400 font- font-bold"
                  : "text-rose-400 font- font-bold"
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
          <div className="py-1.5 px-3 bg-yellow-400/10 text-yellow-400 text-[9px] font-black rounded-xl border border-yellow-400/20 uppercase tracking-tight">
            ✓ Positive ROI
          </div>
        )}
      </div>
    </div>
  );
}
function RewardChart({ audit }: { audit: any }) {
  const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];
  // Define a color palette to sync the chart and the labels

  const data = audit.breakdown
    .filter((i: any) => i.plus)
    .map((i: any) => ({
      name: i.label,
      value: i.value,
    }));

  return (
    <div className="flex flex-col items-center">
      {/* Chart Container */}
      <div className="h-52 md:h-64 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              outerRadius={80}
              innerRadius={50}
              paddingAngle={5}
            >
              {data.map((_: unknown, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend/Labels below */}
      <div className="mt-4 grid grid-cols-2 gap-4 w-full px-4">
        {data.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" />
              <span className="text-gray-600">{item.name}</span>
            </div>
            <span className="font-bold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function SearchBar({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />

      <input
        type="text"
        placeholder="Search cards, banks..."
        value={filters.search}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, search: e.target.value }))
        }
        className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900/50 border border-white/10 text-sm"
      />
    </div>
  );
}
function CategoryFilters({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  const categories = [
    "Dining",
    "Fuel",
    "Shopping",
    "Travel",
    "Movies",
    "Forex",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              categories: prev.categories.includes(cat)
                ? prev.categories.filter((c) => c !== cat)
                : [...prev.categories, cat],
            }))
          }
          className={`px-3 py-1.5 text-xs rounded-lg border transition
            ${
              filters.categories.includes(cat)
                ? "bg-yellow-400/20 border-yellow-400 text-yellow-400"
                : "bg-white/5 border-white/10"
            }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
function AdvancedFilters({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {/* Joining Fee */}
      <div>
        <label className="text-xs text-zinc-400">Joining Fee</label>

        <input
          type="range"
          min={0}
          max={15000}
          step={100}
          className="w-full accent-yellow-400 cursor-pointer"
          value={filters.joiningFee[1]}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              joiningFee: [0, Number(e.target.value)],
            }))
          }
        />
        <label className="text-xs text-zinc-400">
          Joining Fee ≤ ₹{filters.joiningFee[1]}
        </label>
      </div>

      {/* Forex */}
      <div>
        <label className="text-xs text-zinc-400">Forex Markup</label>

        <input
          type="range"
          min={0}
          max={5}
          step={0.1}
          value={filters.forex[1]}
          className="w-full accent-yellow-400 cursor-pointer"
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              forex: [0, Number(e.target.value)],
            }))
          }
        />
        <label className="text-xs text-zinc-400">
          Forex Markup ≤ {filters.forex[1]}%
        </label>
      </div>

      {/* Lounge */}
      <div>
        <label className="text-xs text-zinc-400">Lounge Visits</label>

        <input
          type="range"
          min={0}
          max={20}
          value={filters.lounge[1]}
          className="w-full accent-yellow-400 cursor-pointer"
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              lounge: [0, Number(e.target.value)],
            }))
          }
        />
      </div>
    </div>
  );
}

function FilterSheet({
  show,
  onClose,
  filters,
  setFilters,
}: {
  show: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Sheet */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 120) onClose();
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="
              fixed bottom-0 left-0 right-0
              bg-zinc-950
              border-t border-white/10
              rounded-t-3xl
              p-6
              z-50
              max-h-[85vh]
              overflow-y-auto
            "
          >
            {/* Drag Handle */}
            <div className="w-10 h-1 bg-zinc-700 rounded mx-auto mb-6" />

            <h2 className="text-lg font-bold mb-6">Filters</h2>

            <div className="mt-6 flex flex-col gap-6">
              <CategoryFilters filters={filters} setFilters={setFilters} />
              <AdvancedFilters filters={filters} setFilters={setFilters} />
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8 mb-[80px]">
              <button
                onClick={() =>
                  setFilters({
                    search: "",
                    tags: [],
                    categories: [],
                    joiningFee: [0, 15000],
                    forex: [0, 5],
                    lounge: [0, 20],
                    ltfOnly: false,
                    zeroForexOnly: false,
                    sortBy: "roi",
                  })
                }
                className="flex-1 py-3 rounded-xl bg-zinc-800"
              >
                Reset
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-yellow-400 text-black font-bold"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
