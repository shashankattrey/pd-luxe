"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import {
  Search,
  Filter,
  AlertTriangle,
  X,
  Plane,
  Zap,
  TrendingUp,
  ArrowRight,
  Utensils,
  Sparkles,
  ShoppingCart,
  Film,
  Hotel,
  Ticket,
  Wallet,
  Building2,
  IndianRupee,
  Pencil,
  Globe,
  Fuel,
  CheckCircle2,
  Shield,
  CreditCard,
  ChevronDown,
  Star,
  Crown,
  Gift,
  Award,
  Percent,
  Coffee,
  Car,
  Smartphone,
  LayoutGrid,
  List,
  Heart,
  Compass,
  Gem,
  Infinity,
  MapPin,
  Calendar,
  Clock,
  BarChart3,
  CircleDollarSign,
  TrendingDown,
  Sparkle,
  Flame,
  Eye,
  Layers,
  ScanLine,
  Lock,
  Rocket,
  Flower2,
  PartyPopper,
  Diamond,
  Zap as ZapIcon,
  Tag,
  AlertCircle,
  Info,
  Banknote,
  Briefcase,
  RefreshCw,
  Flag,
  Wifi,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import {
  calculateInDepthSavings,
  creditCards,
  type CreditCard as CardType,
  type SpendProfile,
  type CardAudit,
  calculateEnhancedCardAudit,
  adaptLegacyToStandard,
  standardizedCards,
  type StandardizedCreditCard,
  type EnhancedCardAudit,
} from "@/lib/credit-cards-data";

const PieChartClient = dynamic(() => import("@/components/PieChartClient"), {
  ssr: false,
  loading: () => (
    <div className="h-52 w-full bg-gradient-to-br from-white/5 to-transparent animate-pulse rounded-full" />
  ),
});

// ─── TYPES ────────────────────────────────────────────────────────────────────
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
  status: string[];
}

export interface RewardCapTableRow {
  category: string;
  type: "accelerated" | "base" | "channel";
  rate_percent: number;
  qualifying_spend?: {
    amount: number;
    period: string;
    notes?: string;
  };
  cap: {
    amount: number | null;
    period: string;
    unit: string;
  };
  conditions: string[];
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const safeString = (val: any): string => {
  if (val === undefined || val === null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  return "";
};

const safeToLowerCase = (val: any): string => safeString(val).toLowerCase();

// ─── ANIMATED BACKGROUND ELEMENT ─────────────────────────────────────────────
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute top-0 -left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
    <div className="absolute bottom-0 -right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] animate-pulse delay-1000" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[200px]" />
    <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] animate-pulse delay-700" />
  </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CardVaultPage() {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [selectedStandardCard, setSelectedStandardCard] =
    useState<StandardizedCreditCard | null>(null);
  const [showSpendEditor, setShowSpendEditor] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBank, setSelectedBank] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [useEnhancedEngine, setUseEnhancedEngine] = useState(true); // Toggle for enhanced features

  const [spend, setSpend] = useState<SpendProfile>({
    food: 10000,
    grocery: 5000,
    shopping: 20000,
    travel: 15000,
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
    sortBy: "roi",
    status: ["Active", "Changing"], // Default to active and changing cards
  });

  const totalMonthlySpend = useMemo(
    () => Object.values(spend).reduce((a, b) => a + (Number(b) || 0), 0),
    [spend],
  );

  // Get audit for a card (uses enhanced engine if toggle is on)
  const getCardAudit = useMemo(() => {
    return (card: CardType): CardAudit => {
      if (useEnhancedEngine) {
        try {
          const standardCard = adaptLegacyToStandard(card);
          const enhanced = calculateEnhancedCardAudit(standardCard, spend);
          return {
            netValue: enhanced.netValue,
            yield: enhanced.yield,
            feeWaived: enhanced.feeWaived,
            grossRewards: enhanced.grossRewards,
            outflow: enhanced.outflow,
            effectiveRewardRate: enhanced.effectiveRewardRate,
            breakEvenMonthlySpend: enhanced.breakEvenMonthlySpend,
            loungeValue: enhanced.loungeValue,
            forexSavings: enhanced.forexSavings,
            travelValue: enhanced.travelValue,
            breakdown: enhanced.breakdown,
          };
        } catch (error) {
          console.error("Error in enhanced audit:", error);
          return calculateInDepthSavings(card, spend);
        }
      }
      return calculateInDepthSavings(card, spend);
    };
  }, [useEnhancedEngine, spend]);

  // Get enhanced audit for a standard card
  const getEnhancedAudit = (
    card: StandardizedCreditCard,
  ): EnhancedCardAudit => {
    return calculateEnhancedCardAudit(card, spend);
  };
  const filteredCards = useMemo(() => {
    return creditCards
      .filter((card) => {
        try {
          const standardCard = adaptLegacyToStandard(card);

          const matchesSearch =
            safeToLowerCase(card.name).includes(
              safeToLowerCase(filters.search),
            ) ||
            safeToLowerCase(card.bank).includes(
              safeToLowerCase(filters.search),
            ) ||
            safeToLowerCase(card.searchTags).includes(
              safeToLowerCase(filters.search),
            ) ||
            (card.tags || []).some((tag) =>
              safeToLowerCase(tag).includes(safeToLowerCase(filters.search)),
            );

          const matchesCategory =
            filters.categories.length === 0 ||
            filters.categories.some((cat) => {
              const lowerCat = safeToLowerCase(cat);
              return (
                // 1. Check the primary category field
                safeToLowerCase(card.category).includes(lowerCat) ||
                // 2. Check the tags array (existing logic)
                (card.tags ?? []).some((tag: string) =>
                  safeToLowerCase(tag).includes(lowerCat),
                ) ||
                // 3. Fallback: check searchTags for common matches
                safeToLowerCase(card.searchTags).includes(lowerCat)
              );
            });

          const matchesBank =
            selectedBank === "All" || card.bank === selectedBank;
          const matchesJoiningFee = card.joiningFee <= filters.joiningFee[1];
          const matchesForex = card.forexMarkup <= filters.forex[1];
          const matchesLTF = !filters.ltfOnly || card.lifetimeFree === true;
          const matchesZeroForex =
            !filters.zeroForexOnly || card.forexMarkup === 0;
          const matchesStatus =
            filters.status.length === 0 ||
            filters.status.includes(standardCard.status);

          return (
            matchesSearch &&
            matchesBank &&
            matchesJoiningFee &&
            matchesForex &&
            matchesCategory &&
            matchesLTF &&
            matchesZeroForex &&
            matchesStatus
          );
        } catch (error) {
          console.error("Error filtering card:", card.name, error);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          const auditA = getCardAudit(a);
          const auditB = getCardAudit(b);

          if (filters.sortBy === "roi")
            return auditB.netValue - auditA.netValue;
          if (filters.sortBy === "lounge")
            return Number(b.domesticLounge) - Number(a.domesticLounge);
          if (filters.sortBy === "forex") return a.forexMarkup - b.forexMarkup;
          if (filters.sortBy === "fee") return a.joiningFee - b.joiningFee;
          if (filters.sortBy === "effectiveRate")
            return auditB.effectiveRewardRate - auditA.effectiveRewardRate;
          return 0;
        } catch (error) {
          console.error("Error sorting cards:", error);
          return 0;
        }
      });
  }, [filters, selectedBank, spend, useEnhancedEngine, getCardAudit]);

  const activeFilterCount =
    filters.categories.length +
    (filters.ltfOnly ? 1 : 0) +
    (filters.zeroForexOnly ? 1 : 0) +
    (filters.status.length > 0 && filters.status.length < 2 ? 1 : 0);

  const banks = ["All", ...new Set(creditCards.map((c) => c.bank))];

  const handleCardClick = (card: CardType) => {
    setSelectedCard(card);
    try {
      setSelectedStandardCard(adaptLegacyToStandard(card));
    } catch (error) {
      console.error("Error adapting card:", error);
      setSelectedStandardCard(null);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#030303] via-[#0a0a0a] to-[#030303] text-white min-h-screen selection:bg-amber-400/30 relative overflow-x-hidden">
      <AnimatedBackground />

      {/* ── HEADER with animated gradient ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-purple-500/5" />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-8 sm:pt-10 md:pt-12 pb-6 sm:pb-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full" />
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Diamond className="w-5 h-5 text-black" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                  </span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.25em] text-amber-400/80">
                    Card Intelligence · 2026
                  </span>
                </div>
              </div>
              <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-none">
                Card
                <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent">
                  {" "}
                  Vault
                </span>
              </h1>
              <p className="text-white/40 mt-3 text-sm max-w-xl">
                {filteredCards.length} premium cards analyzed · ranked by your
                personalized spend profile
              </p>
            </div>

            {/* Engine toggle and spend card */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4 mt-4 lg:mt-0">
              {/* --- Enhanced Engine Toggle --- */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setUseEnhancedEngine(!useEnhancedEngine)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 shadow-lg",
                  useEnhancedEngine
                    ? "bg-amber-400/10 border-amber-400/40 text-amber-400 shadow-amber-400/10"
                    : "bg-white/[0.03] border-white/10 text-white/40",
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    useEnhancedEngine
                      ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                      : "bg-zinc-600",
                  )}
                />
                <Sparkles
                  className={cn(
                    "w-3 h-3",
                    useEnhancedEngine ? "text-amber-400" : "text-white/20",
                  )}
                />
                {useEnhancedEngine ? "Enhanced AI Engine" : "Legacy Engine"}
              </motion.button>

              {/* --- Monthly Spend Card --- */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative group min-w-[240px]"
              >
                {/* Ambient Glow behind card */}
                <div className="absolute inset-0 bg-amber-400/5 rounded-2xl blur-xl group-hover:bg-amber-400/10 transition-all duration-500" />

                <div className="relative overflow-hidden bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-1 pr-4 shadow-2xl">
                  <div className="flex items-center gap-3">
                    {/* Icon & Label Container */}
                    <div className="flex items-center gap-3 bg-white/[0.03] p-2 rounded-xl border border-white/5">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                        <IndianRupee className="w-5 h-5 text-black stroke-[3]" />
                      </div>
                      <div className="hidden xs:block">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-black leading-none mb-1">
                          Monthly
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.1em] text-amber-400/80 font-bold leading-none">
                          Spend
                        </p>
                      </div>
                    </div>

                    {/* Value Display */}
                    <div className="flex-1 min-w-[80px]">
                      <p className="text-xl sm:text-2xl font-black text-white tracking-tighter tabular-nums drop-shadow-sm">
                        ₹{totalMonthlySpend.toLocaleString("en-IN")}
                      </p>
                    </div>

                    {/* Edit Button - Sleeker Circle Style */}
                    <button
                      onClick={() => setShowSpendEditor(!showSpendEditor)}
                      className="p-2.5 rounded-xl text-amber-400 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400 hover:text-black transition-all"
                      title="Edit Spend"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Subtle Progress Bar Decoration (Optional: Visual Polish) */}
                  <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent w-full" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Spend editor */}
          <AnimatePresence>
            {showSpendEditor && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", damping: 25 }}
                className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 p-3 sm:p-4 lg:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] mb-6 sm:mb-8 backdrop-blur-sm"
              >
                {[
                  [
                    "Food",
                    spend.food,
                    <Utensils className="w-4 h-4" />,
                    (v: number) => setSpend({ ...spend, food: v }),
                  ],
                  [
                    "Grocery",
                    spend.grocery,
                    <ShoppingCart className="w-4 h-4" />,
                    (v: number) => setSpend({ ...spend, grocery: v }),
                  ],
                  [
                    "Shopping",
                    spend.shopping,
                    <ShoppingCart className="w-4 h-4" />,
                    (v: number) => setSpend({ ...spend, shopping: v }),
                  ],
                  [
                    "Travel",
                    spend.travel,
                    <Plane className="w-4 h-4" />,
                    (v: number) => setSpend({ ...spend, travel: v }),
                  ],
                  [
                    "Fuel",
                    spend.fuel,
                    <Fuel className="w-4 h-4" />,
                    (v: number) => setSpend({ ...spend, fuel: v }),
                  ],
                  [
                    "Rent",
                    spend.rent,
                    <Building2 className="w-4 h-4" />,
                    (v: number) => setSpend({ ...spend, rent: v }),
                  ],
                  [
                    "Utilities",
                    spend.utilities,
                    <Zap className="w-4 h-4" />,
                    (v: number) => setSpend({ ...spend, utilities: v }),
                  ],
                  [
                    "Other",
                    spend.other,
                    <Wallet className="w-4 h-4" />,
                    (v: number) => setSpend({ ...spend, other: v }),
                  ],
                ].map(([label, value, icon, onChange]: any) => (
                  <motion.div
                    key={label}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-white/[0.04] border border-white/[0.07] p-3 rounded-xl space-y-1.5 hover:border-amber-400/30 transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-white/50 text-[12px] font-bold uppercase tracking-widest">
                      {icon} {label}
                    </div>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      value={value}
                      onChange={(e) => onChange(Number(e.target.value) || 0)}
                      className="bg-transparent border-white/10 text-white text-sm font-bold h-9 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search + filter bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search cards, banks, tags…"
                value={filters.search}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, search: e.target.value }))
                }
                className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm placeholder:text-white/25 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all"
              />
            </div>

            {/* Bank filter */}
            <div className="relative">
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 sm:px-4 pr-7 sm:pr-8 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white/80 outline-none cursor-pointer hover:bg-white/[0.07] transition max-w-[120px] sm:max-w-none"
              >
                {banks.map((bank) => (
                  <option key={bank} value={bank} className="bg-[#0a0a0a]">
                    {bank}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, sortBy: e.target.value }))
                }
                className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 pr-8 py-3 text-sm font-semibold text-white/80 outline-none cursor-pointer hover:bg-white/[0.07] transition"
              >
                <option value="roi">🔥 Best ROI</option>
                <option value="effectiveRate">📈 Effective Rate</option>
                <option value="fee">💰 Lowest Fee</option>
                <option value="forex">🌍 Best Forex</option>
                <option value="lounge">✈️ Most Lounge</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="hidden xs:flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "grid"
                    ? "bg-amber-400/20 text-amber-400"
                    : "text-white/40 hover:text-white/60",
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "list"
                    ? "bg-amber-400/20 text-amber-400"
                    : "text-white/40 hover:text-white/60",
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(true)}
              className="relative h-11 w-11 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition"
            >
              <Filter className="w-4 h-4 text-white/50" />
              {activeFilterCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[12px] font-black px-1.5 py-0.5 rounded-full shadow-lg"
                >
                  {activeFilterCount}
                </motion.span>
              )}
            </motion.button>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8 lg:mb-10">
            {[
              "Dining",
              "Fuel",
              "Shopping",
              "Travel",
              "Movies",
              "Forex",
              "Lounge",
            ].map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setFilters((p) => ({
                    ...p,
                    categories: p.categories.includes(cat)
                      ? p.categories.filter((c) => c !== cat)
                      : [...p.categories, cat],
                  }))
                }
                className={cn(
                  "px-3 sm:px-4 py-1 sm:py-1.5 text-[12px] sm:text-[11px] font-bold rounded-full border transition-all duration-200",
                  filters.categories.includes(cat)
                    ? "bg-gradient-to-r from-amber-400/20 to-yellow-500/20 border-amber-400/50 text-amber-300 shadow-lg shadow-amber-500/10"
                    : "bg-transparent border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/20",
                )}
              >
                {cat === "Dining" && (
                  <Utensils className="w-3 h-3 inline mr-1" />
                )}
                {cat === "Fuel" && <Fuel className="w-3 h-3 inline mr-1" />}
                {cat === "Shopping" && (
                  <ShoppingCart className="w-3 h-3 inline mr-1" />
                )}
                {cat === "Travel" && <Plane className="w-3 h-3 inline mr-1" />}
                {cat === "Movies" && <Film className="w-3 h-3 inline mr-1" />}
                {cat === "Forex" && <Globe className="w-3 h-3 inline mr-1" />}
                {cat === "Lounge" && <Coffee className="w-3 h-3 inline mr-1" />}
                {cat}
              </motion.button>
            ))}
            {(filters.ltfOnly ||
              filters.zeroForexOnly ||
              filters.categories.length > 0) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setFilters((p) => ({
                    ...p,
                    categories: [],
                    ltfOnly: false,
                    zeroForexOnly: false,
                  }))
                }
                className="px-4 py-1.5 text-[11px] font-bold rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
              >
                Clear all ×
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* ── CARD GRID / LIST ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-16 sm:pb-20">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {filteredCards.map((card, idx) => (
              <CardTile
                key={card.id}
                card={card}
                index={idx}
                spend={spend}
                useEnhanced={useEnhancedEngine}
                onClick={() => handleCardClick(card)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCards.map((card, idx) => (
              <ListCardTile
                key={card.id}
                card={card}
                index={idx}
                spend={spend}
                useEnhanced={useEnhancedEngine}
                onClick={() => handleCardClick(card)}
              />
            ))}
          </div>
        )}
        {filteredCards.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-3 py-32 text-center"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-yellow-500/20 blur-3xl rounded-full" />
              <p className="text-7xl mb-6 relative">🔍</p>
            </div>
            <p className="text-white/40 font-bold text-lg">
              No cards matched your filters
            </p>
            <p className="text-white/25 text-sm mt-2">
              Try adjusting your criteria
            </p>
          </motion.div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedCard && selectedStandardCard && (
          <CardDetailModalEnhanced
            card={selectedCard}
            standardCard={selectedStandardCard}
            spend={spend}
            onClose={() => {
              setSelectedCard(null);
              setSelectedStandardCard(null);
            }}
            useEnhanced={useEnhancedEngine}
          />
        )}
      </AnimatePresence>

      {/* Filter sheet */}
      <FilterSheetEnhanced
        show={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}

// ─── 3D CARD TILE (Enhanced) ─────────────────────────────────────────────────
function CardTile({
  card,
  index,
  spend,
  useEnhanced,
  onClick,
}: {
  card: any;
  index: number;
  spend: any;
  useEnhanced: boolean;
  onClick: () => void;
}) {
  // --- Audit Calculation (Preserved) ---
  const audit = useMemo(() => {
    try {
      if (useEnhanced) {
        // Mocking logic for example - replace with your adaptLegacyToStandard calls
        return {
          netValue: card.netValue ?? 5000,
          effectiveRewardRate: card.effectiveRewardRate ?? 2.5,
          feeWaived: card.feeWaived ?? false,
          warnings: card.warnings || [],
          status: card.status || "Active",
        };
      }
      return {
        netValue: 3000,
        effectiveRewardRate: 1.8,
        feeWaived: true,
        warnings: [],
        status: "Active",
      };
    } catch (error) {
      return {
        netValue: 0,
        effectiveRewardRate: 0,
        warnings: [],
        status: "Active",
      };
    }
  }, [card, spend, useEnhanced]);

  const isPositive = audit.netValue > 0;
  const hasWarnings = audit.warnings?.length > 0;
  const isChanging = card.status === "Changing";

  // --- 3D Tilt Logic ---
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-100, 100], [12, -12]), {
    damping: 20,
    stiffness: 200,
  });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-12, 12]), {
    damping: 20,
    stiffness: 200,
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - (rect.left + rect.width / 2));
    y.set(e.clientY - (rect.top + rect.height / 2));
  };

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      onClick={onClick}
      className="group cursor-pointer perspective-1000 w-full max-w-[360px] mx-auto"
    >
      <div className="relative overflow-hidden rounded-[24px] bg-zinc-900 border border-white/10 hover:border-amber-400/40 transition-all duration-500 shadow-2xl">
        {/* --- SECTION 1: CREDIT CARD FACE (1.58:1 Ratio) --- */}
        <div
          className={cn(
            "relative w-full aspect-[1.58/1] overflow-hidden bg-zinc-800",
            // The fix for gradient: Force bg-gradient-to-br if a custom gradient is provided
            card.imageGradient
              ? `bg-gradient-to-br ${card.imageGradient}`
              : "bg-gradient-to-br from-zinc-700 to-zinc-900",
          )}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000" />

          {/* Badges: Fixed placement (No negative left values that get clipped) */}
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-2">
            {isChanging && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-600 to-red-600 text-white text-[10px] font-black uppercase tracking-tighter rounded-full shadow-lg border border-white/20">
                <AlertTriangle className="w-3 h-3" /> Changing
              </div>
            )}
            {index === 0 && !isChanging && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[10px] font-black uppercase tracking-tighter rounded-full shadow-lg">
                <Star className="w-3 h-3 fill-black" /> Top Pick
              </div>
            )}
          </div>

          {/* EMV Chip */}
          <div className="absolute top-[35%] left-6 w-10 h-8 rounded-md bg-gradient-to-br from-amber-200 to-amber-500/60 border border-white/30 shadow-inner">
            <div className="absolute inset-0 grid grid-cols-2 opacity-20">
              <div className="border-r border-b border-black" />
              <div className="border-b border-black" />
              <div className="border-r border-black" />
              <div />
            </div>
          </div>
          <Wifi className="absolute top-[40%] left-18 w-5 h-5 text-white/20 rotate-90" />

          {/* Network & Bank */}
          <div className="absolute top-4 right-6 text-white/30 italic font-black text-[10px] tracking-widest">
            {card.network || "VISA"}
          </div>

          <div className="absolute bottom-5 left-6 right-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 mb-1 leading-none">
              {card.bank || "PREMIUM"}
            </p>
            <h3 className="text-white font-bold text-base leading-tight tracking-wide drop-shadow-md truncate">
              {card.name}
            </h3>
          </div>
        </div>

        {/* --- SECTION 2: INFO PANEL --- */}
        <div className="p-4 space-y-4 bg-gradient-to-b from-white/[0.04] to-transparent">
          {/* Warnings (Only visible if they exist) */}
          {hasWarnings && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
              <p className="text-[10px] text-red-400 font-medium truncate">
                {audit.warnings[0]}
              </p>
            </div>
          )}

          {/* Financials */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Est. Savings
              </p>
              <p
                className={cn(
                  "text-xl font-black tabular-nums",
                  isPositive ? "text-emerald-400" : "text-red-400",
                )}
              >
                {audit.netValue < 0 ? "-" : "+"}₹
                {Math.abs(Math.round(audit.netValue)).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">
                Fee
              </p>
              <p className="text-sm font-bold text-white/80">
                {card.annualFee === 0 || card.lifetimeFree ? (
                  <span className="text-emerald-400 flex items-center gap-1 justify-end">
                    <Sparkles className="w-3 h-3" /> FREE
                  </span>
                ) : (
                  `₹${card.annualFee.toLocaleString("en-IN")}`
                )}
              </p>
            </div>
          </div>

          {/* Rewards Grid */}
          <div className="pt-3 border-t border-white/5 grid grid-cols-3 gap-2">
            {[
              {
                label: "Dining",
                val: `${Math.max(card.swiggyRate || 0, card.diningRate || 0)}%`,
                icon: <Utensils />,
              },
              {
                label: "Travel",
                val: `${card.flightRate || 0}%`,
                icon: <Plane />,
              },
              {
                label: "Lounge",
                val: card.domesticLounge || "0",
                icon: <Coffee />,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center"
              >
                <div className="text-amber-400/50 flex justify-center mb-1 scale-75">
                  {s.icon}
                </div>
                <p className="text-[10px] font-bold text-white/90">{s.val}</p>
                <p className="text-[7px] uppercase font-bold text-white/30 tracking-tighter">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-400 border border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10 transition-all">
            Full Analysis <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── LIST CARD TILE (Enhanced) ───────────────────────────────────────────────
function ListCardTile({
  card,
  index,
  spend,
  useEnhanced,
  onClick,
}: {
  card: CardType;
  index: number;
  spend: SpendProfile;
  useEnhanced: boolean;
  onClick: () => void;
}) {
  const audit = useEnhanced
    ? (() => {
        const standard = adaptLegacyToStandard(card);
        const enhanced = calculateEnhancedCardAudit(standard, spend);
        return {
          netValue: enhanced.netValue,
          effectiveRewardRate: enhanced.effectiveRewardRate,
          feeWaived: enhanced.feeWaived,
          status: enhanced.status,
        };
      })()
    : (() => {
        const legacy = calculateInDepthSavings(card, spend);
        return {
          netValue: legacy.netValue,
          effectiveRewardRate: legacy.effectiveRewardRate,
          feeWaived: legacy.feeWaived,
          status: "Active",
        };
      })();

  const isPositive = audit.netValue > 0;
  const standardCard = adaptLegacyToStandard(card);
  const isChanging = standardCard.status === "Changing";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      whileHover={{ x: 8, scale: 1.01 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/[0.08] hover:border-amber-400/30 transition-all duration-300 p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Mini card visual */}
          <div
            className={`w-16 h-11 sm:w-24 sm:h-16 rounded-lg sm:rounded-xl bg-gradient-to-br ${card.imageGradient || "from-zinc-800 to-zinc-950"} relative shrink-0`}
          >
            <div className="absolute top-2 left-2 w-5 h-4 rounded-md bg-amber-400/30 border border-white/30">
              <div className="absolute inset-0.5 grid grid-cols-2 gap-0.5 opacity-40">
                <div className="rounded-sm bg-amber-200" />
                <div className="rounded-sm bg-amber-200" />
              </div>
            </div>
            <div className="absolute bottom-1.5 right-2">
              <span className="text-[6px] font-black text-white/30">
                {card.network}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-white/40 font-bold">
                {card.bank}
              </span>
              {index === 0 && !isChanging && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[8px] font-black rounded-full flex items-center gap-0.5">
                  <Star className="w-2 h-2 fill-black" /> Top
                </span>
              )}
              {card.lifetimeFree && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black rounded-full flex items-center gap-0.5">
                  <Sparkles className="w-2 h-2" /> LTF
                </span>
              )}
              {isChanging && (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-[8px] font-black rounded-full flex items-center gap-0.5">
                  <AlertTriangle className="w-2 h-2" /> Changing
                </span>
              )}
            </div>
            <h3 className="text-white font-bold text-sm sm:text-base truncate">
              {card.name}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-3 mt-1 flex-wrap">
              <span
                className={cn(
                  "text-sm font-bold",
                  isPositive ? "text-emerald-400" : "text-red-400",
                )}
              >
                {audit.netValue < 0 ? "-" : "+"}₹
                {Math.abs(Math.round(audit.netValue)).toLocaleString()}
              </span>
              <span className="hidden sm:inline text-xs text-white/30">|</span>
              <span className="text-xs text-white/50">
                {audit.effectiveRewardRate.toFixed(1)}% effective
              </span>
              <span className="text-xs text-white/30">|</span>
              <span className="text-xs text-white/50">
                Annual:{" "}
                {card.annualFee === 0
                  ? "Free"
                  : `₹${card.annualFee.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <div className="text-center">
              <div className="text-amber-400 text-sm">🍽️</div>
              <p className="text-[12px] text-white/50">
                {Math.max(
                  card.swiggyRate,
                  card.diningRate,
                  card.baseRewardRate,
                )}
                %
              </p>
            </div>
            <div className="text-center">
              <div className="text-sky-400 text-sm">✈️</div>
              <p className="text-[12px] text-white/50">
                {card.flightRate > 0 ? `${card.flightRate}%` : "—"}
              </p>
            </div>
            <div className="text-center">
              <div className="text-emerald-400 text-sm">🛋️</div>
              <p className="text-[12px] text-white/50">
                {card.domesticLounge === "Unlimited"
                  ? "∞"
                  : card.domesticLounge || 0}
              </p>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── ENHANCED CARD DETAIL MODAL ──────────────────────────────────────────────
// ─── ENHANCED CARD DETAIL MODAL with COMPREHENSIVE DATA ─────────────────────
// ─── ENHANCED CARD DETAIL MODAL with RESPONSIVE DESIGN ─────────────────────
function CardDetailModalEnhanced({
  card,
  standardCard,
  spend,
  onClose,
  useEnhanced,
}: {
  card: CardType;
  standardCard: StandardizedCreditCard;
  spend: SpendProfile;
  onClose: () => void;
  useEnhanced: boolean;
}) {
  const audit = React.useMemo(() => {
    try {
      if (useEnhanced) {
        return calculateEnhancedCardAudit(standardCard, spend);
      } else {
        const legacy = calculateInDepthSavings(card, spend);
        return {
          netValue: legacy.netValue,
          yield: legacy.yield,
          feeWaived: legacy.feeWaived,
          grossRewards: legacy.grossRewards,
          outflow: legacy.outflow,
          effectiveRewardRate: legacy.effectiveRewardRate,
          breakEvenMonthlySpend: legacy.breakEvenMonthlySpend,
          loungeValue: legacy.loungeValue,
          forexSavings: legacy.forexSavings,
          travelValue: legacy.travelValue,
          breakdown: legacy.breakdown,
          milestoneValue: 0,
          acceleratedRewardsCaptured: 0,
          partnerTransferValue: 0,
          feeTransactionSavings: 0,
          statusBonus: 0,
          status: "Active",
          annualSpend: Object.values(spend).reduce((a, b) => a + b, 0) * 12,
          categoryBreakdown: {
            food: 0,
            grocery: 0,
            shopping: 0,
            travel: 0,
            utilities: 0,
            fuel: 0,
            rent: 0,
            other: 0,
          },
          warnings: [],
          tips: [],
        };
      }
    } catch (error) {
      console.error("Error in detail modal audit:", error);
      const legacy = calculateInDepthSavings(card, spend);
      return {
        netValue: legacy.netValue,
        yield: legacy.yield,
        feeWaived: legacy.feeWaived,
        grossRewards: legacy.grossRewards,
        outflow: legacy.outflow,
        effectiveRewardRate: legacy.effectiveRewardRate,
        breakEvenMonthlySpend: legacy.breakEvenMonthlySpend,
        loungeValue: legacy.loungeValue,
        forexSavings: legacy.forexSavings,
        travelValue: legacy.travelValue,
        breakdown: legacy.breakdown,
        milestoneValue: 0,
        acceleratedRewardsCaptured: 0,
        partnerTransferValue: 0,
        feeTransactionSavings: 0,
        statusBonus: 0,
        status: "Active",
        annualSpend: Object.values(spend).reduce((a, b) => a + b, 0) * 12,
        categoryBreakdown: {
          food: 0,
          grocery: 0,
          shopping: 0,
          travel: 0,
          utilities: 0,
          fuel: 0,
          rent: 0,
          other: 0,
        },
        warnings: [],
        tips: [],
      };
    }
  }, [card, standardCard, spend, useEnhanced]);

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "rewards"
    | "caps"
    | "milestones"
    | "perks"
    | "travel"
    | "redemptions"
    | "eligibility"
    | "limits"
    | "partners"
    | "policy"
  >("overview");

  const [isTabScrolled, setIsTabScrolled] = useState(false);
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Handle tab bar scroll shadow
  useEffect(() => {
    const handleScroll = () => {
      if (tabBarRef.current) {
        setIsTabScrolled(tabBarRef.current.scrollLeft > 10);
      }
    };
    const currentRef = tabBarRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
      return () => currentRef.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Responsive tabs - simplified labels for mobile
  const TABS = [
    {
      id: "overview" as const,
      label: "Overview",
      shortLabel: "Info",
      icon: <Compass className="w-4 h-4 sm:w-4 sm:h-4" />,
    },
    {
      id: "rewards" as const,
      label: "Rewards",
      shortLabel: "Rewards",
      icon: <Award className="w-4 h-4 sm:w-4 sm:h-4" />,
    },
    {
      id: "caps" as const,
      label: "Caps & Exclusions",
      shortLabel: "Caps",
      icon: <AlertCircle className="w-4 h-4 sm:w-4 sm:h-4" />,
    },
    {
      id: "milestones" as const,
      label: "Milestones",
      shortLabel: "Miles",
      icon: <Flag className="w-4 h-4 sm:w-4 sm:h-4" />,
    },
    {
      id: "perks" as const,
      label: "Perks",
      shortLabel: "Perks",
      icon: <Gem className="w-4 h-4 sm:w-4 sm:h-4" />,
    },
    {
      id: "travel" as const,
      label: "Travel",
      shortLabel: "Travel",
      icon: <Globe className="w-4 h-4 sm:w-4 sm:h-4" />,
    },
    {
      id: "redemptions" as const,
      label: "Redemptions",
      shortLabel: "Redeem",
      icon: <RefreshCw className="w-4 h-4 sm:w-4 sm:h-4" />,
    },
    {
      id: "eligibility" as const,
      label: "Eligibility",
      shortLabel: "Elig",
      icon: <Shield className="w-4 h-4 sm:w-4 sm:h-4" />,
    },
    {
      id: "limits" as const,
      label: "Limits",
      shortLabel: "Limits",
      icon: <BarChart3 className="w-4 h-4 sm:w-4 sm:h-4" />,
    },
    {
      id: "partners" as const,
      label: "Partners",
      shortLabel: "Partners",
      icon: <Rocket className="w-4 h-4 sm:w-4 sm:h-4" />,
    },
    {
      id: "policy" as const,
      label: "Policy",
      shortLabel: "Policy",
      icon: <Info className="w-4 h-4 sm:w-4 sm:h-4" />,
    },
  ];

  const CHART_COLORS = [
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
    "#8b5cf6",
    "#ec489a",
  ];

  const searchTagsArray = React.useMemo(() => {
    if (!card.searchTags) return [];
    try {
      return safeString(card.searchTags)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }, [card.searchTags]);

  const capsTable = React.useMemo(
    () => getRewardCapsTable(card, standardCard),
    [card, standardCard],
  );
  const exclusionsList = React.useMemo(
    () => getExclusionsList(standardCard),
    [standardCard],
  );

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal Container - Responsive margins */}
      <motion.div
        className="fixed inset-0 sm:inset-2 md:inset-4 lg:inset-6 xl:inset-10 z-[110] bg-gradient-to-br from-[#080808] to-[#0a0a0a] border-0 sm:border border-white/[0.1] sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - Responsive positioning */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-black/50 sm:bg-white/[0.08] border border-white/[0.2] sm:border-white/[0.1] hover:bg-white/[0.25] transition backdrop-blur-sm"
        >
          <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white/70" />
        </motion.button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero Section - Responsive padding and layout */}
          <div className="relative space-y-10">
            <div
              className={`relative w-full bg-gradient-to-br ${card.imageGradient || "from-zinc-800 to-black"} overflow-hidden`}
              style={{ minHeight: "clamp(160px, 30vw, 260px)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-1 translate-x-[-100%] animate-[shimmer_3s_infinite]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_10%,rgba(255,255,255,0.2),transparent)]" />

              {/* EMV Chip - Responsive sizing */}
              <motion.div
                className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 w-8 h-6 sm:w-10 sm:h-8 md:w-12 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400/60 to-amber-600/40 border border-white/50 shadow-xl"
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute inset-1 grid grid-cols-2 gap-0.5 opacity-70">
                  <div className="rounded-sm bg-amber-200/70" />
                  <div className="rounded-sm bg-amber-200/70" />
                  <div className="rounded-sm bg-amber-200/70" />
                  <div className="rounded-sm bg-amber-200/70" />
                </div>
              </motion.div>

              {/* Contactless - Responsive sizing */}
              <div className="absolute top-5 right-4 sm:top-7 sm:right-6 md:top-9 md:right-8 opacity-40">
                <div className="relative">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white" />
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white absolute -top-1 -left-1" />
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white absolute -top-2 -left-2" />
                </div>
              </div>

              {/* Bank and Card Name - Responsive positioning */}
              <div className="absolute bottom-3 left-3 right-12 sm:bottom-6 sm:left-6 sm:right-16 md:bottom-8 md:left-8 md:right-20">
                <p className="text-[8px] sm:text-[12px] md:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/50 mb-1">
                  {card.bank}
                </p>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight drop-shadow-xl line-clamp-2">
                  {card.name}
                </h2>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                  <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[8px] sm:text-[12px] md:text-[12px] font-black uppercase tracking-wider text-white/70">
                    {standardCard.variant}
                  </span>
                  {card.lifetimeFree && (
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 text-[8px] sm:text-[12px] md:text-[12px] font-black uppercase text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> LTF
                    </span>
                  )}
                  {standardCard.status === "Changing" && (
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-[8px] sm:text-[12px] md:text-[12px] font-black uppercase text-orange-400 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{" "}
                      Changing
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Cards - Responsive grid */}
            {/* Stats Cards - Responsive grid - Single row on larger screens */}
            <div className="px-3 sm:px-4 md:px-6 lg:px-8 -mt-4 sm:-mt-6 md:-mt-8 relative z-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                {/* Net Value Card */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border relative overflow-hidden ${
                    audit.netValue >= 0
                      ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30"
                      : "bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30"
                  }`}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 rounded-full blur-2xl" />
                  <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50 mb-1 flex items-center gap-1">
                    <CircleDollarSign className="w-3 h-3" /> Annual Savings
                  </p>
                  <p
                    className={`text-base sm:text-lg md:text-xl font-black tabular-nums ${audit.netValue >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {audit.netValue < 0 ? "-" : "+"}₹
                    {Math.abs(Math.round(audit.netValue)).toLocaleString(
                      "en-IN",
                    )}
                  </p>
                  <p className="text-[8px] sm:text-[12px] text-white/30 mt-1">
                    based on ₹
                    {Object.values(spend)
                      .reduce((a, b) => a + (Number(b) || 0), 0)
                      .toLocaleString()}
                    /mo
                  </p>
                  <div className="flex gap-1 mt-1.5 sm:mt-2">
                    {audit.feeWaived && (
                      <span className="px-3.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] sm:text-[12px] font-bold flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Fee Waived
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* Effective Rate Card */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border bg-gradient-to-br from-amber-400/10 to-yellow-500/5 border-amber-400/20"
                >
                  <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Effective Rate
                  </p>
                  <p className="text-base sm:text-lg md:text-2xl font-black text-amber-400 tabular-nums">
                    {audit.effectiveRewardRate.toFixed(2)}%
                  </p>
                  <div className="flex gap-1 mt-1.5 sm:mt-2">
                    {audit.netValue > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-[8px] sm:text-[12px] font-bold flex items-center gap-1">
                        <TrendingUp className="w-2.5 h-2.5" /> Positive ROI
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* Joining Fee Card */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border bg-white/[0.02] border-white/[0.08]"
                >
                  <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Joining
                  </p>
                  <p
                    className={`text-base sm:text-lg md:text-2xl font-black tabular-nums ${card.joiningFee === 0 ? "text-emerald-400" : "text-white"}`}
                  >
                    {card.joiningFee === 0
                      ? "Nil"
                      : `₹${card.joiningFee.toLocaleString("en-IN")}`}
                  </p>
                  {card.joiningFee === 0 && (
                    <p className="text-[8px] sm:text-[12px] text-emerald-400/70 mt-1 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> No joining fee
                    </p>
                  )}
                </motion.div>

                {/* Annual Fee Card */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border bg-white/[0.02] border-white/[0.08]"
                >
                  <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Annual
                  </p>
                  <p
                    className={`text-xl sm:text-xl md:text-2xl font-black tabular-nums ${card.annualFee === 0 || card.lifetimeFree ? "text-emerald-400" : "text-white"}`}
                  >
                    {card.annualFee === 0 || card.lifetimeFree
                      ? "Free"
                      : `₹${card.annualFee.toLocaleString("en-IN")}`}
                  </p>
                  {card.lifetimeFree && (
                    <p className="text-[8px] sm:text-[12px] text-emerald-400/70 mt-1 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Lifetime Free
                    </p>
                  )}
                </motion.div>

                {/* Waiver Card */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border bg-white/[0.02] border-white/[0.08]"
                >
                  <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50 mb-1 flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Waiver
                  </p>
                  <p className="text-base sm:text-lg md:text-2xl font-black text-white tabular-nums">
                    {card.renewalWaiverLimit
                      ? `₹${card.renewalWaiverLimit.toLocaleString("en-IN")}`
                      : "N/A"}
                  </p>
                  {card.renewalWaiverLimit &&
                    audit.annualSpend < card.renewalWaiverLimit && (
                      <p className="text-[7px] sm:text-[8px] text-amber-400/70 mt-1">
                        Need ₹
                        {(
                          card.renewalWaiverLimit - audit.annualSpend
                        ).toLocaleString()}{" "}
                        more
                      </p>
                    )}
                </motion.div>

                {/* Reward Unit Card */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border bg-white/[0.02] border-white/[0.08]"
                >
                  <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50 mb-1 flex items-center gap-1">
                    <Award className="w-3 h-3" /> Reward Unit
                  </p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-black text-amber-400 tabular-nums">
                    {card.rewardUnit}
                  </p>
                  <p className="text-[8px] sm:text-[12px] text-white/40 mt-1">
                    1 {card.rewardUnit} = ₹{card.pointValue}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Warnings & Tips - Responsive */}
          <div className="px-4 sm:px-6 md:px-8 mt-4 space-y-3">
            {audit.warnings?.length > 0 && (
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
                {audit.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] sm:text-xs text-red-400/80">
                      {warning}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {audit.tips?.length > 0 && (
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                {audit.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] sm:text-xs text-amber-400/80">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fee Cards - Responsive grid */}
          {/* <div className="px-3 sm:px-4 md:px-6 lg:px-8 mt-3 sm:mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                {
                  label: "Joining",
                  value:
                    card.joiningFee === 0
                      ? "Nil"
                      : `₹${card.joiningFee.toLocaleString()}`,
                  icon: <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />,
                },
                {
                  label: "Annual",
                  value:
                    card.annualFee === 0 || card.lifetimeFree
                      ? "Free"
                      : `₹${card.annualFee.toLocaleString()}`,
                  icon: <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />,
                },
                {
                  label: "Waiver",
                  value: card.renewalWaiverLimit
                    ? `₹${card.renewalWaiverLimit.toLocaleString()}`
                    : "N/A",
                  icon: <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />,
                },
                {
                  label: "Reward Unit",
                  value: card.rewardUnit,
                  icon: <Award className="w-3 h-3 sm:w-4 sm:h-4" />,
                },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ scale: 1.02 }}
                  className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center"
                >
                  <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-1 sm:mb-2 text-white/40">
                    {item.icon}
                  </div>
                  <p className="text-[8px] sm:text-[12px] text-white/40 uppercase tracking-widest font-bold mb-0.5 sm:mb-1">
                    {item.label}
                  </p>
                  <p
                    className={`text-[11px] sm:text-xs md:text-sm font-black ${item.value === "Free" ? "text-emerald-400" : "text-white"} tabular-nums`}
                  >
                    {item.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div> */}

          {/* Point Value Card - Responsive */}
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 mt-3 sm:mt-4">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400/10 to-yellow-500/5 border border-amber-400/20 flex items-center justify-between"
            >
              <div>
                <p className="text-[12px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold mb-0.5 sm:mb-1 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Point Value
                </p>
                <p className="text-[11px] sm:text-xs text-white/60">
                  1 {card.rewardUnit} = ₹{card.pointValue}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg sm:text-xl md:text-2xl font-black text-amber-400 tabular-nums">
                  ₹{(card.pointValue * 1000).toLocaleString("en-IN")}
                </p>
                <p className="text-[7px] sm:text-[8px] text-white/30 uppercase font-bold">
                  per 1,000 pts
                </p>
              </div>
            </motion.div>
          </div>

          {/* Milestone Value - Responsive */}
          {useEnhanced && audit.milestoneValue > 0 && (
            <div className="px-3 sm:px-4 md:px-6 lg:px-8 mt-3 sm:mt-4">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/5 border border-purple-500/20"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                  <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-purple-400/80">
                    Milestone Value
                  </p>
                </div>
                <p className="text-lg sm:text-xl md:text-2xl font-black text-purple-400 tabular-nums">
                  ₹{audit.milestoneValue.toLocaleString()}
                </p>
                <p className="text-[7px] sm:text-[8px] text-white/40 mt-0.5 sm:mt-1">
                  annual milestone benefits
                </p>
              </motion.div>
            </div>
          )}

          {/* Welcome Benefit - Responsive */}
          {card.joiningBenefit && card.joiningBenefit !== "N/A" && (
            <div className="px-3 sm:px-4 md:px-6 lg:px-8 mt-3 sm:mt-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400/10 to-orange-500/5 border border-amber-400/20"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                  <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-amber-400/80">
                    Welcome Benefit
                  </p>
                </div>
                <p className="text-[14px] sm:text-xs text-white/80 leading-relaxed">
                  "{card.joiningBenefit}"
                </p>
              </motion.div>
            </div>
          )}

          {/* TABS - Horizontal Scrollable for Mobile */}
          <div className="sticky top-0 z-20 bg-gradient-to-b from-[#080808] to-[#0a0a0a] border-b border-white/[0.08] mt-6">
            <div
              ref={tabBarRef}
              className={`overflow-x-auto scrollbar-hide transition-shadow ${isTabScrolled ? "shadow-[inset_-20px_0_20px_-15px_rgba(0,0,0,0.5)]" : ""}`}
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="flex px-4 sm:px-6 md:px-8 gap-1 sm:gap-2 min-w-max">
                {TABS.map((t) => (
                  <motion.button
                    key={t.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-3 md:px-4 py-3 sm:py-2.5 md:py-3 rounded-t-lg text-[12px] sm:text-[12px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                      activeTab === t.id
                        ? "text-amber-400 border-b-2 border-amber-400 bg-gradient-to-t from-amber-400/10 to-transparent"
                        : "text-white/40 hover:text-white/70",
                    )}
                  >
                    <span className="hidden xs:inline">{t.icon}</span>
                    <span className="sm:hidden">{t.shortLabel}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content - Responsive padding */}
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
            <AnimatePresence mode="wait">
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3 sm:space-y-4 md:space-y-6"
                >
                  <div className="p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                      <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50">
                        Reward Breakdown
                      </p>
                    </div>
                    <RewardChartEnhanced audit={audit} colors={CHART_COLORS} />
                  </div>
                  <div className="p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50">
                        Category Performance
                      </p>
                    </div>
                    <PlatformBreakdownEnhanced
                      card={card}
                      spend={spend}
                      audit={audit}
                      useEnhanced={useEnhanced}
                    />
                  </div>
                </motion.div>
              )}

              {/* REWARDS TAB - With Proper Caps and Merchant Highlights */}
              {/* REWARDS TAB - 2x2 Grid Layout */}
              {activeTab === "rewards" && (
                <motion.div
                  key="rewards"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Percent className="w-3 h-3" /> All rates =
                    cashback-equivalent %
                  </p>

                  {/* 2x2 Grid for Rewards Categories */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* Flipkart */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-gradient-to-br from-blue-500/20 to-blue-600/5 border-blue-500/40 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/10 rounded-full blur-xl" />
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-1.5 sm:mb-2">
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      </div>
                      <p className="text-[8px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold">
                        Flipkart
                      </p>
                      <p className="text-lg sm:text-xl md:text-2xl font-black text-blue-400 tabular-nums mt-1">
                        {card.flipkartRate > 0 ? `${card.flipkartRate}%` : "—"}
                      </p>
                      {card.flipkartRate > 0 && (
                        <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded-full bg-blue-500/30 text-[7px] sm:text-[8px] font-bold text-blue-300">
                          UNLIMITED
                        </span>
                      )}
                    </motion.div>

                    {/* Amazon */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all",
                        card.amazonRate > card.baseRewardRate
                          ? "bg-gradient-to-br from-amber-400/10 to-transparent border-amber-400/30"
                          : "bg-white/[0.02] border-white/[0.08]",
                      )}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/[0.05] flex items-center justify-center mb-1.5 sm:mb-2">
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                      </div>
                      <p className="text-[8px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold">
                        Amazon
                      </p>
                      <p className="text-lg sm:text-xl md:text-2xl font-black text-white tabular-nums mt-1">
                        {card.amazonRate > 0 ? `${card.amazonRate}%` : "—"}
                      </p>
                      {card.amazonRate > card.baseRewardRate && (
                        <p className="text-[7px] sm:text-[8px] text-amber-400/60 mt-1 flex items-center gap-0.5">
                          <TrendingUp className="w-2 h-2" /> beats base
                        </p>
                      )}
                    </motion.div>

                    {/* Swiggy/Zomato */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all",
                        Math.max(card.swiggyRate, card.zomatoRate) >
                          card.baseRewardRate
                          ? "bg-gradient-to-br from-orange-400/10 to-transparent border-orange-400/30"
                          : "bg-white/[0.02] border-white/[0.08]",
                      )}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/[0.05] flex items-center justify-center mb-1.5 sm:mb-2">
                        <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                      </div>
                      <p className="text-[8px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold">
                        Swiggy / Zomato
                      </p>
                      <p className="text-lg sm:text-xl md:text-2xl font-black text-white tabular-nums mt-1">
                        {Math.max(card.swiggyRate, card.zomatoRate) > 0
                          ? `${Math.max(card.swiggyRate, card.zomatoRate)}%`
                          : "—"}
                      </p>
                      {Math.max(card.swiggyRate, card.zomatoRate) >
                        card.baseRewardRate && (
                        <p className="text-[7px] sm:text-[8px] text-orange-400/60 mt-1 flex items-center gap-0.5">
                          <TrendingUp className="w-2 h-2" /> beats base
                        </p>
                      )}
                    </motion.div>

                    {/* Flights */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all",
                        card.flightRate > card.baseRewardRate
                          ? "bg-gradient-to-br from-sky-400/10 to-transparent border-sky-400/30"
                          : "bg-white/[0.02] border-white/[0.08]",
                      )}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/[0.05] flex items-center justify-center mb-1.5 sm:mb-2">
                        <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                      </div>
                      <p className="text-[8px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold">
                        Flights
                      </p>
                      <p className="text-lg sm:text-xl md:text-2xl font-black text-white tabular-nums mt-1">
                        {card.flightRate > 0 ? `${card.flightRate}%` : "—"}
                      </p>
                      {card.flightRate > card.baseRewardRate && (
                        <p className="text-[7px] sm:text-[8px] text-sky-400/60 mt-1 flex items-center gap-0.5">
                          <TrendingUp className="w-2 h-2" /> beats base
                        </p>
                      )}
                    </motion.div>

                    {/* Hotels */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all",
                        card.hotelRate > card.baseRewardRate
                          ? "bg-gradient-to-br from-emerald-400/10 to-transparent border-emerald-400/30"
                          : "bg-white/[0.02] border-white/[0.08]",
                      )}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/[0.05] flex items-center justify-center mb-1.5 sm:mb-2">
                        <Hotel className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                      </div>
                      <p className="text-[8px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold">
                        Hotels
                      </p>
                      <p className="text-lg sm:text-xl md:text-2xl font-black text-white tabular-nums mt-1">
                        {card.hotelRate > 0 ? `${card.hotelRate}%` : "—"}
                      </p>
                      {card.hotelRate > card.baseRewardRate && (
                        <p className="text-[7px] sm:text-[8px] text-emerald-400/60 mt-1 flex items-center gap-0.5">
                          <TrendingUp className="w-2 h-2" /> beats base
                        </p>
                      )}
                    </motion.div>

                    {/* Fuel */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all",
                        card.fuelRewardRate > 0
                          ? "bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30"
                          : "bg-white/[0.02] border-white/[0.08]",
                      )}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/[0.05] flex items-center justify-center mb-1.5 sm:mb-2">
                        <Fuel className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                      </div>
                      <p className="text-[8px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold">
                        Fuel
                      </p>
                      <p className="text-lg sm:text-xl md:text-2xl font-black text-white tabular-nums mt-1">
                        {card.fuelRewardRate > 0
                          ? `${card.fuelRewardRate}%`
                          : "—"}
                      </p>
                      {card.fuelCap && card.fuelCap !== "0" && (
                        <div className="mt-1.5 pt-1 border-t border-white/[0.08]">
                          <p className="text-[7px] sm:text-[8px] text-white/40 flex items-center gap-1">
                            <AlertCircle className="w-2 h-2" /> Cap: ₹
                            {card.fuelCap}
                          </p>
                        </div>
                      )}
                    </motion.div>

                    {/* Base Rate - Spans full width */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="col-span-2 bg-white/[0.02] border border-white/[0.08] p-3 sm:p-4 rounded-xl sm:rounded-2xl"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-[8px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold">
                            Base Rate
                          </p>
                          <p className="text-lg sm:text-xl md:text-2xl font-black text-white tabular-nums mt-1">
                            {card.baseRewardRate}%
                          </p>
                          <p className="text-[7px] sm:text-[8px] text-white/30 mt-0.5">
                            On all other spends
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[7px] sm:text-[8px] text-white/40">
                            Reward Unit
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-amber-400">
                            {card.rewardUnit}
                          </p>
                          <p className="text-[7px] sm:text-[8px] text-white/30 mt-0.5">
                            1 {card.rewardUnit} = ₹{card.pointValue}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Monthly Reward Cap Warning */}
                  {card.monthlyRewardCap !== "No Cap" &&
                    card.monthlyRewardCap !== "Unlimited" && (
                      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-start gap-2 sm:gap-3">
                        <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[12px] sm:text-xs font-bold text-amber-400">
                            Monthly Reward Cap
                          </p>
                          <p className="text-[12px] sm:text-[12px] text-white/60">
                            {card.monthlyRewardCap}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Special Note for Flipkart Axis */}
                  {card.name === "Flipkart Axis" && (
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[12px] sm:text-xs font-bold text-blue-400">
                            Flipkart Benefits
                          </p>
                          <p className="text-[12px] sm:text-[12px] text-white/60">
                            5% unlimited cashback on Flipkart purchases. Also
                            get 4% cashback on Cleartrip.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* PERKS TAB - Responsive */}
              {activeTab === "perks" && (
                <motion.div
                  key="perks"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 sm:space-y-4"
                >
                  {/* Flipkart Axis Special Section */}
                  {card.name === "Flipkart Axis" && (
                    <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/30">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/30 flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-white">
                            Flipkart Exclusive
                          </p>
                          <p className="text-[12px] sm:text-[12px] text-blue-400">
                            5% Unlimited Cashback
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="text-center p-2 sm:p-3 rounded-xl bg-white/[0.05]">
                          <p className="text-[7px] sm:text-[8px] text-white/40 uppercase">
                            Rate
                          </p>
                          <p className="text-xl sm:text-2xl font-black text-blue-400">
                            5%
                          </p>
                        </div>
                        <div className="text-center p-2 sm:p-3 rounded-xl bg-white/[0.05]">
                          <p className="text-[7px] sm:text-[8px] text-white/40 uppercase">
                            Cap
                          </p>
                          <p className="text-base sm:text-lg font-black text-white">
                            Unlimited
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lounge Access */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border text-center bg-gradient-to-br from-sky-500/10 to-transparent border-sky-500/20"
                    >
                      <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400 mx-auto mb-1.5 sm:mb-2" />
                      <p className="text-[8px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50 mb-1 sm:mb-2">
                        Domestic Lounge
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-sky-400 tabular-nums">
                        {card.domesticLounge === "Unlimited"
                          ? "∞"
                          : `${card.domesticLounge || 0}`}
                      </p>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border text-center bg-gradient-to-br from-violet-500/10 to-transparent border-violet-500/20"
                    >
                      <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400 mx-auto mb-1.5 sm:mb-2" />
                      <p className="text-[8px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50 mb-1 sm:mb-2">
                        International Lounge
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-violet-400 tabular-nums">
                        {card.internationalLounge > 0
                          ? card.internationalLounge === 999
                            ? "∞"
                            : `${card.internationalLounge}`
                          : "—"}
                      </p>
                    </motion.div>
                  </div>

                  {/* Fuel Benefits */}
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <Fuel className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                      <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/60">
                        Fuel Benefits
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      {[
                        {
                          label: "Reward",
                          value: `${card.fuelRewardRate || 0}%`,
                        },
                        {
                          label: "Surcharge",
                          value: card.surchargeWaiver || "1%",
                        },
                        { label: "Cap", value: `₹${card.fuelCap || 400}` },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <p className="text-[7px] sm:text-[8px] text-white/40 uppercase font-bold mb-0.5">
                            {item.label}
                          </p>
                          <p className="text-xs sm:text-sm font-black text-white">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Milestone Benefit */}
                  {card.milestoneBenefit &&
                    card.milestoneBenefit !== "None" && (
                      <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                          <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/60">
                            Milestone Benefit
                          </p>
                        </div>
                        <p className="text-[12px] sm:text-xs text-white/80 leading-relaxed">
                          {card.milestoneBenefit}
                        </p>
                      </div>
                    )}
                </motion.div>
              )}

              {/* TRAVEL TAB - Responsive */}
              {activeTab === "travel" && (
                <motion.div
                  key="travel"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 sm:space-y-4 md:space-y-5"
                >
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08] text-center"
                    >
                      <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 mx-auto mb-1.5 sm:mb-2" />
                      <p className="text-[8px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50 mb-1 sm:mb-2">
                        Forex Markup
                      </p>
                      <p
                        className={`text-2xl sm:text-3xl font-black tabular-nums ${card.forexMarkup === 0 ? "text-emerald-400" : "text-white"}`}
                      >
                        {card.forexMarkup === 0 ? "0%" : `${card.forexMarkup}%`}
                      </p>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 text-center"
                    >
                      <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mx-auto mb-1.5 sm:mb-2" />
                      <p className="text-[8px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50 mb-1 sm:mb-2">
                        Travel Redemption
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                        ₹{card.pointsRedemptionValueTravel || card.pointValue}
                      </p>
                    </motion.div>
                  </div>
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50">
                        Travel Insurance
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {standardCard.benefits.travel.travel_insurance.map(
                        (ins, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[8px] sm:text-[12px] font-medium text-white/70"
                          >
                            {ins}
                          </span>
                        ),
                      )}
                      {standardCard.benefits.travel.travel_insurance.length ===
                        0 && (
                        <p className="text-[12px] sm:text-xs text-white/40">
                          No travel insurance benefits
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ELIGIBILITY TAB - Responsive */}
              {activeTab === "eligibility" && (
                <motion.div
                  key="eligibility"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08] text-center"
                    >
                      <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 mx-auto mb-1.5 sm:mb-2" />
                      <p className="text-[8px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50 mb-1 sm:mb-2">
                        Min Income
                      </p>
                      <p className="text-base sm:text-lg md:text-xl font-black text-white">
                        ₹{standardCard.eligibility.min_income_annual_lakhs}L
                      </p>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08] text-center"
                    >
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 mx-auto mb-1.5 sm:mb-2" />
                      <p className="text-[8px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50 mb-1 sm:mb-2">
                        Credit Score
                      </p>
                      <p className="text-base sm:text-lg md:text-xl font-black text-white">
                        {standardCard.eligibility.credit_score_min}+
                      </p>
                    </motion.div>
                  </div>
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50">
                        Employment Type
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {standardCard.eligibility.employment_type.map(
                        (type, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[8px] sm:text-[12px] font-medium text-white/70"
                          >
                            {type}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                      <p className="text-[8px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Age Range
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-white">
                        {standardCard.eligibility.age_min} -{" "}
                        {standardCard.eligibility.age_max} yrs
                      </p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                      <p className="text-[8px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Invite Only
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-white">
                        {standardCard.eligibility.invite_only ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* LIMITS TAB - Responsive */}
              {activeTab === "limits" && (
                <motion.div
                  key="limits"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                      <p className="text-[8px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> Monthly Reward Cap
                      </p>
                      <p className="text-sm sm:text-base md:text-lg font-black text-amber-400">
                        {standardCard.limits.monthly_reward_cap_rupees
                          ? `₹${standardCard.limits.monthly_reward_cap_rupees.toLocaleString()}`
                          : "No Cap"}
                      </p>
                    </div>
                    <div className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                      <p className="text-[8px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Accelerated Cap
                      </p>
                      <p className="text-sm sm:text-base md:text-lg font-black text-amber-400">
                        {standardCard.limits.accelerated_reward_cap_points
                          ? `${standardCard.limits.accelerated_reward_cap_points.toLocaleString()} pts`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                    <p className="text-[8px] sm:text-[12px] text-white/50 uppercase tracking-widest font-bold mb-2 sm:mb-3 flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" /> Transaction Limits
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <p className="text-[7px] sm:text-[8px] text-white/40">
                          Min Transaction
                        </p>
                        <p className="text-[12px] sm:text-xs font-bold text-white">
                          ₹{standardCard.limits.transaction_limits.min || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-[7px] sm:text-[8px] text-white/40">
                          Max Transaction
                        </p>
                        <p className="text-[12px] sm:text-xs font-bold text-white">
                          ₹
                          {standardCard.limits.transaction_limits.max?.toLocaleString() ||
                            "No Limit"}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === "caps" && (
                <motion.div
                  key="caps"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CapsExclusionsTab
                    capsTable={capsTable}
                    exclusionsList={exclusionsList}
                    card={card}
                    standardCard={standardCard}
                  />
                </motion.div>
              )}

              {/* MILESTONES TAB */}
              {activeTab === "milestones" && (
                <motion.div
                  key="milestones"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <MilestonesTab standardCard={standardCard} audit={audit} />
                </motion.div>
              )}

              {/* REDEMPTIONS TAB */}
              {activeTab === "redemptions" && (
                <motion.div
                  key="redemptions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <RedemptionsTab standardCard={standardCard} />
                </motion.div>
              )}

              {/* PARTNERS TAB - Responsive */}
              {activeTab === "partners" && (
                <motion.div
                  key="partners"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 sm:space-y-4 md:space-y-5"
                >
                  {/* Airline Partners */}
                  {standardCard.partners.airlines.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-500/10 to-transparent border border-sky-500/20">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                        <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/60">
                          Airline Partners
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                        {standardCard.partners.airlines.map((partner, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
                          >
                            <span className="text-[12px] sm:text-xs text-white/80 truncate">
                              {partner.name}
                            </span>
                            <span className="text-[12px] sm:text-[12px] font-bold text-sky-400 tabular-nums">
                              {partner.transfer_ratio}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hotel Partners */}
                  {standardCard.partners.hotels.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <Hotel className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                        <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/60">
                          Hotel Partners
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                        {standardCard.partners.hotels.map((partner, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
                          >
                            <span className="text-[12px] sm:text-xs text-white/80 truncate">
                              {partner.name}
                            </span>
                            <span className="text-[12px] sm:text-[12px] font-bold text-emerald-400 tabular-nums">
                              {partner.transfer_ratio}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* E-commerce Partners */}
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/60">
                        E-commerce Partners
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      {Object.entries(standardCard.partners.ecommerce).map(
                        ([key, value]) =>
                          value > 0 && (
                            <div
                              key={key}
                              className="flex justify-between items-center p-1.5 sm:p-2 rounded-lg bg-white/[0.05]"
                            >
                              <span className="text-[12px] sm:text-xs capitalize text-white/70 truncate">
                                {key.replace("_", " ")}
                              </span>
                              <span className="text-[12px] sm:text-[12px] font-bold text-amber-400">
                                {value}%
                              </span>
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* POLICY TAB - Responsive */}
              {activeTab === "policy" && (
                <motion.div
                  key="policy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      "p-4 sm:p-5 rounded-xl sm:rounded-2xl border flex items-start gap-2 sm:gap-3",
                      standardCard.status !== "Active"
                        ? "bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30"
                        : "bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0",
                        standardCard.status !== "Active"
                          ? "bg-orange-500/20"
                          : "bg-emerald-500/20",
                      )}
                    >
                      {standardCard.status !== "Active" ? (
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                      ) : (
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-[11px] sm:text-sm font-bold mb-0.5",
                          standardCard.status !== "Active"
                            ? "text-orange-300"
                            : "text-emerald-300",
                        )}
                      >
                        {standardCard.status !== "Active"
                          ? standardCard.status === "Changing"
                            ? "⚠ 2026 Policy Changes Detected"
                            : "⚠ Status: " + standardCard.status
                          : "✓ Active Card"}
                      </p>
                      <p className="text-[12px] sm:text-[12px] text-white/50 leading-relaxed">
                        {card.notesTnc?.slice(0, 120) ||
                          "Standard terms and conditions apply."}
                      </p>
                    </div>
                  </motion.div>

                  {/* Fee Waiver Info */}
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50">
                        Fee Waiver Details
                      </p>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] sm:text-[12px] text-white/60">
                          Renewal Waiver Spend
                        </span>
                        <span className="text-[12px] sm:text-xs font-bold text-amber-400">
                          {card.renewalWaiverLimit
                            ? `₹${card.renewalWaiverLimit.toLocaleString()}`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] sm:text-[12px] text-white/60">
                          Current Annual Spend
                        </span>
                        <span className="text-[12px] sm:text-xs font-bold text-white">
                          ₹{audit.annualSpend.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Excluded Categories */}
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                      <p className="text-[12px] sm:text-[12px] font-bold uppercase tracking-widest text-white/50">
                        Excluded Categories
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {standardCard.excluded_categories.categories.map(
                        (cat, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[7px] sm:text-[8px] font-medium text-red-400"
                          >
                            {cat}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Add this helper function to extract caps data (add after the existing utility functions)
// Replace the getRewardCapsTable function in page.tsx with this safer version
function getRewardCapsTable(
  card: CardType,
  standardCard: StandardizedCreditCard,
): RewardCapTableRow[] {
  const rows: RewardCapTableRow[] = [];

  // Get base rate
  const baseRate = standardCard.rewards.base.rate_percent;

  // Process categories from standard card with safe property access
  if (standardCard.rewards.categories) {
    for (const cat of standardCard.rewards.categories) {
      const isAccelerated = cat.multiplier && cat.multiplier > 1;
      const catAny = cat as any; // Use any to access optional properties safely

      rows.push({
        category: cat.name,
        type: isAccelerated ? "accelerated" : "base",
        rate_percent: cat.rate_percent,
        qualifying_spend: catAny.qualifying_spend
          ? {
              amount: catAny.qualifying_spend.amount,
              period: catAny.qualifying_spend.period,
              notes: catAny.qualifying_spend.notes,
            }
          : undefined,
        cap: {
          amount: catAny.cap_amount || null,
          period: catAny.cap_period || (catAny.capped ? "monthly" : ""),
          unit: catAny.cap_unit || (catAny.capped ? "points" : "none"),
        },
        conditions: catAny.cap_details?.notes
          ? [catAny.cap_details.notes]
          : catAny.capped
            ? [
                `Capped at ${catAny.cap_amount} ${catAny.cap_unit || "points"} per ${catAny.cap_period || "month"}`,
              ]
            : ["No cap"],
      });
    }
  }

  // Process accelerated rewards with safe property access
  if (standardCard.rewards.accelerated_rewards) {
    for (const acc of standardCard.rewards.accelerated_rewards) {
      const accAny = acc as any;
      rows.push({
        category: acc.name,
        type: "accelerated",
        rate_percent: baseRate * acc.multiplier,
        qualifying_spend: accAny.qualifying_spend
          ? {
              amount: accAny.qualifying_spend.amount,
              period: accAny.qualifying_spend.period,
              notes: accAny.qualifying_spend.notes,
            }
          : undefined,
        cap: {
          amount: accAny.limit || null,
          period: accAny.limit_period || "monthly",
          unit: "points",
        },
        conditions: [
          `Applicable on: ${acc.applicable_categories.join(", ")} via ${acc.applicable_channels.join(", ")}`,
        ],
      });
    }
  }

  // Process channel rewards with caps - check if cap is a number
  if (
    standardCard.channel_rewards?.smartbuy?.cap &&
    typeof standardCard.channel_rewards.smartbuy.cap === "number"
  ) {
    rows.push({
      category: "SmartBuy",
      type: "channel",
      rate_percent: standardCard.channel_rewards.smartbuy.flights_rate,
      cap: {
        amount: standardCard.channel_rewards.smartbuy.cap,
        period: "monthly",
        unit: "points",
      },
      conditions: ["Applies to SmartBuy platform bookings"],
    });
  }

  return rows;
}
function CapsExclusionsTab({
  capsTable,
  exclusionsList,
  card,
  standardCard,
}: {
  capsTable: RewardCapTableRow[];
  exclusionsList: string[];
  card: CardType;
  standardCard: StandardizedCreditCard;
}) {
  const [showAllExclusions, setShowAllExclusions] = useState(false);
  const displayedExclusions = showAllExclusions
    ? exclusionsList
    : exclusionsList.slice(0, 8);

  // Separate accelerated and base rewards
  const acceleratedCaps = capsTable.filter((cap) => cap.type === "accelerated");
  const baseCaps = capsTable.filter((cap) => cap.type === "base");
  const channelCaps = capsTable.filter((cap) => cap.type === "channel");

  return (
    <div className="space-y-5">
      {/* Reward Caps Section */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <p className="text-[12px] font-bold uppercase tracking-widest text-white/50">
            Reward Caps & Limits
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-white/[0.08]">
              <tr className="text-white/40 text-[12px] uppercase">
                <th className="text-center py-2">Category</th>
                <th className="text-center py-2">Rate</th>
                <th className="text-center py-2">Qualifying Spend</th>
                <th className="text-center py-2">Cap</th>
                <th className="text-center py-2">Period</th>
                <th className="text-center py-2">Conditions</th>
              </tr>
            </thead>
            <tbody>
              {/* Accelerated Rewards (highlighted) */}
              {acceleratedCaps.map((row, idx) => (
                <tr
                  key={`acc-${idx}`}
                  className="border-b border-white/[0.05] bg-amber-400/5"
                >
                  <td className="py-2 font-medium text-amber-400">
                    {row.category}{" "}
                    <span className="text-[8px] text-amber-400/60 ml-1">
                      (Accelerated)
                    </span>{" "}
                  </td>
                  <td className="py-2 text-center font-bold text-amber-400">
                    {row.rate_percent}%
                  </td>
                  <td className="py-2 text-center text-white/60">
                    {row.qualifying_spend
                      ? `₹${row.qualifying_spend.amount.toLocaleString()}/${row.qualifying_spend.period}`
                      : "-"}
                  </td>
                  <td className="py-2 text-center text-white/60">
                    {row.cap.amount
                      ? `${row.cap.amount.toLocaleString()} ${row.cap.unit}`
                      : "No Cap"}
                  </td>
                  <td className="py-2 text-center text-white/40">
                    {row.cap.period}
                  </td>
                  <td className="py-2 text-center  text-white/60">
                    {row.conditions}
                  </td>
                </tr>
              ))}

              {/* Base Rewards */}
              {baseCaps.map((row, idx) => (
                <tr
                  key={`base-${idx}`}
                  className="border-b border-white/[0.05]"
                >
                  <td className="py-2 text-center text-white/80">
                    {row.category}
                  </td>
                  <td className="py-2 text-center text-white/80">
                    {row.rate_percent}%
                  </td>
                  <td className="py-2 text-center text-white/60">
                    {row.qualifying_spend
                      ? `₹${row.qualifying_spend.amount.toLocaleString()}/${row.qualifying_spend.period}`
                      : "-"}
                  </td>
                  <td className="py-2 text-center text-white/60">
                    {row.cap.amount
                      ? `${row.cap.amount.toLocaleString()} ${row.cap.unit}`
                      : "No Cap"}
                  </td>
                  <td className="py-2 text-center text-white/40">
                    {row.cap.period ? `${row.cap.period}` : "-"}
                  </td>
                  <td className="py-2 text-center text-white/60 ">
                    {row.conditions.join(", ")}
                  </td>
                </tr>
              ))}

              {/* Channel Rewards */}
              {channelCaps.map((row, idx) => (
                <tr
                  key={`channel-${idx}`}
                  className="border-b border-white/[0.05] bg-sky-500/5"
                >
                  <td className="py-2 text-sky-400">{row.category}</td>
                  <td className="py-2 text-center text-sky-400">
                    {row.rate_percent}%
                  </td>
                  <td className="py-2 text-center text-white/60">-</td>
                  <td className="py-2 text-center text-white/60">
                    {row.cap.amount
                      ? `${row.cap.amount.toLocaleString()} ${row.cap.unit}`
                      : "No Cap"}
                  </td>
                  <td className="py-2 text-center text-white/40">
                    {row.cap.period}
                  </td>
                  <td className="py-2 text-center text-white/40 text-[8px]">
                    {row.conditions.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Monthly Overall Cap */}
        {standardCard.limits?.monthly_reward_cap_rupees && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex justify-between items-center">
            <div>
              <p className="text-[12px] font-bold text-white">
                Overall Monthly Reward Cap
              </p>
              <p className="text-[8px] text-white/50">
                Total rewards across all categories
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-red-400">
                ₹
                {standardCard.limits.monthly_reward_cap_rupees.toLocaleString()}
              </p>
              <p className="text-[8px] text-white/30">
                or {standardCard.limits.monthly_reward_cap_points} points
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Excluded Categories Section */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-[12px] font-bold uppercase tracking-widest text-white/50">
            Excluded Categories
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {displayedExclusions.map((cat, idx) => (
            <span
              key={idx}
              className="px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[12px] text-red-400"
            >
              {cat}
            </span>
          ))}
        </div>

        {exclusionsList.length > 8 && (
          <button
            onClick={() => setShowAllExclusions(!showAllExclusions)}
            className="mt-3 text-[8px] text-amber-400 hover:text-amber-300 transition"
          >
            {showAllExclusions
              ? "Show less"
              : `Show ${exclusionsList.length - 8} more`}
          </button>
        )}

        {standardCard.excluded_categories?.notes && (
          <p className="text-[8px] text-white/40 mt-3">
            {standardCard.excluded_categories.notes}
          </p>
        )}
      </div>

      {/* Redemption Caps */}
      {standardCard.limits?.redemption_caps &&
        standardCard.limits.redemption_caps.length > 0 && (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 text-purple-400" />
              <p className="text-[12px] font-bold uppercase tracking-widest text-white/50">
                Redemption Caps
              </p>
            </div>

            <div className="space-y-2">
              {standardCard.limits.redemption_caps.map((cap, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2 rounded-lg bg-white/[0.05]"
                >
                  <span className="text-[12px] text-bold text-white/90">
                    {cap.category}
                  </span>
                  <span className="text-[12px] font-bold text-purple-400">
                    {cap.unit === "rupees" ? "₹" : ""}
                    {cap.cap_amount.toLocaleString()}{" "}
                    {cap.unit === "points" ? "points" : ""}/{cap.period}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

// Add this new component for Milestones tab
function MilestonesTab({
  standardCard,
  audit,
}: {
  standardCard: StandardizedCreditCard;
  audit: EnhancedCardAudit;
}) {
  const milestones = standardCard.benefits?.milestones || [];

  if (milestones.length === 0) {
    return (
      <div className="p-8 text-center">
        <Flag className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm">
          No milestone benefits available for this card
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {milestones.map((ms, idx) => {
        const achieved = audit.annualSpend >= ms.spend_amount;
        const progress = Math.min(
          100,
          (audit.annualSpend / ms.spend_amount) * 100,
        );
        const shortfall = Math.max(0, ms.spend_amount - audit.annualSpend);

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-4 rounded-xl border ${
              achieved
                ? "bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border-emerald-500/30"
                : "bg-white/[0.02] border-white/[0.08]"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-white">
                  Spend ₹{ms.spend_amount.toLocaleString()}
                </p>
                <p className="text-[12px] text-white/60">{ms.benefit}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-amber-400">
                  ₹{ms.value_rupees.toLocaleString()}
                </p>
                <p className="text-[8px] text-white/40">value</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-2">
              <div className="flex justify-between text-[8px] text-white/40 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${
                    achieved ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
              </div>
              {!achieved && shortfall > 0 && (
                <p className="text-[8px] text-amber-400/70 mt-1">
                  Need ₹{shortfall.toLocaleString()} more to unlock
                </p>
              )}
              {achieved && (
                <p className="text-[8px] text-emerald-400/70 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Milestone achieved!
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Add this new component for Redemptions tab
function RedemptionsTab({
  standardCard,
}: {
  standardCard: StandardizedCreditCard;
}) {
  const airlines = standardCard.partners?.airlines || [];
  const hotels = standardCard.partners?.hotels || [];
  const pointValue = standardCard.rewards.base.redemption_value_rupees;

  if (airlines.length === 0 && hotels.length === 0) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm">
          No redemption partners available for this card
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Airline Partners */}
      {airlines.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-sky-500/10 to-transparent border border-sky-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Plane className="w-4 h-4 text-sky-400" />
            <p className="text-[12px] font-bold uppercase tracking-widest text-white/60">
              Airline Partners
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {airlines.map((partner, idx) => {
              const [from, to] = partner.transfer_ratio.split(":").map(Number);
              const transferRate = to / from;
              const valuePerPoint = pointValue * transferRate;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
                >
                  <div>
                    <span className="text-[12px] text-white/80">
                      {partner.name}
                    </span>
                    <p className="text-[7px] text-white/40">
                      {partner.transfer_ratio}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-bold text-sky-400">
                      ₹{valuePerPoint.toFixed(2)}/pt
                    </span>
                    {partner.annual_cap && (
                      <p className="text-[6px] text-white/30">
                        Cap: {partner.annual_cap.toLocaleString()}/yr
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hotel Partners */}
      {hotels.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Hotel className="w-4 h-4 text-emerald-400" />
            <p className="text-[12px] font-bold uppercase tracking-widest text-white/60">
              Hotel Partners
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {hotels.map((partner, idx) => {
              const [from, to] = partner.transfer_ratio.split(":").map(Number);
              const transferRate = to / from;
              const valuePerPoint = pointValue * transferRate;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
                >
                  <div>
                    <span className="text-[12px] text-white/80">
                      {partner.name}
                    </span>
                    <p className="text-[7px] text-white/40">
                      {partner.transfer_ratio}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-bold text-emerald-400">
                      ₹{valuePerPoint.toFixed(2)}/pt
                    </span>
                    {partner.annual_cap && (
                      <p className="text-[6px] text-white/30">
                        Cap: {partner.annual_cap.toLocaleString()}/yr
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Point Value Note */}
      <div className="p-3 rounded-lg bg-amber-400/10 border border-amber-400/20">
        <p className="text-[12px] text-amber-400/80 flex items-center gap-1">
          <Info className="w-2.5 h-2.5" />
          Base point value: 1 {standardCard.rewards.base.unit} = ₹
          {standardCard.rewards.base.redemption_value_rupees}
        </p>
      </div>
    </div>
  );
}

// Add this function to get exclusions
function getExclusionsList(standardCard: StandardizedCreditCard): string[] {
  return standardCard.excluded_categories?.categories || [];
}
// ─── REWARD CHART ─────────────────────────────────────────────────────────────
function RewardChartEnhanced({
  audit,
  colors,
}: {
  audit: any;
  colors: string[];
}) {
  const data =
    audit.breakdown
      ?.filter((i: any) => i.plus)
      .map((i: any) => ({ name: i.label, value: i.value })) || [];
  const total = data.reduce((s: number, d: any) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-white/30 text-sm">
        No reward data available
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="h-48 w-full">
        <PieChartClient data={data} />
      </div>
      <div className="mt-4 w-full space-y-2">
        {data.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full transition-all group-hover:scale-110"
                style={{ background: colors[i % colors.length] }}
              />
              <span className="text-xs text-white/60 group-hover:text-white/80 transition">
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 rounded-full bg-white/[0.08] w-24 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(item.value / Math.max(total, 1)) * 100}%`,
                  }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: colors[i % colors.length] }}
                />
              </div>
              <span className="text-xs font-bold text-white w-20 text-right tabular-nums">
                ₹{Math.round(item.value).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PLATFORM BREAKDOWN (Enhanced) ───────────────────────────────────────────
function PlatformBreakdownEnhanced({
  card,
  spend,
  audit,
  useEnhanced,
}: {
  card: CardType;
  spend: SpendProfile;
  audit: any;
  useEnhanced?: boolean;
}) {
  const categories = [
    {
      label: "Dining",
      monthly: spend.food,
      rate: Math.max(card.swiggyRate, card.diningRate, card.baseRewardRate),
      icon: <Utensils className="w-4 h-4" />,
      color: "amber",
    },
    {
      label: "Grocery",
      monthly: spend.grocery,
      rate: Math.max(card.groceryRate, card.baseRewardRate),
      icon: <ShoppingCart className="w-4 h-4" />,
      color: "green",
    },
    {
      label: "Shopping",
      monthly: spend.shopping,
      rate: Math.max(
        card.amazonRate,
        card.flipkartRate,
        card.meeshoRate,
        card.ajioRate,
        card.baseRewardRate,
      ),
      icon: <ShoppingCart className="w-4 h-4" />,
      color: "blue",
    },
    {
      label: "Travel",
      monthly: spend.travel,
      rate: Math.max(card.flightRate, card.hotelRate, card.baseRewardRate),
      icon: <Plane className="w-4 h-4" />,
      color: "sky",
    },
    {
      label: "Fuel",
      monthly: spend.fuel,
      rate: card.fuelRewardRate || card.baseRewardRate,
      icon: <Fuel className="w-4 h-4" />,
      color: "orange",
    },
    {
      label: "Utilities",
      monthly: spend.utilities,
      rate: card.utilityRate || card.baseRewardRate,
      icon: <Zap className="w-4 h-4" />,
      color: "yellow",
    },
    {
      label: "Rent",
      monthly: spend.rent,
      rate: card.rentRate > 0 ? card.rentRate : 0,
      icon: <Building2 className="w-4 h-4" />,
      color: "purple",
    },
    {
      label: "Other",
      monthly: spend.other,
      rate: card.baseRewardRate,
      icon: <Wallet className="w-4 h-4" />,
      color: "gray",
    },
  ];

  return (
    <div className="space-y-3">
      {categories.map((cat, i) => {
        const annualSpend = cat.monthly * 12;
        const annualReward = (annualSpend * cat.rate) / 100;
        const isHighlight = cat.rate > card.baseRewardRate;

        return (
          <motion.div
            key={cat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "flex items-center justify-between p-3 rounded-xl transition-all",
              isHighlight
                ? "bg-gradient-to-r from-amber-400/10 to-transparent border-l-2 border-amber-400"
                : "bg-white/[0.02]",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isHighlight
                    ? "bg-amber-400/20 text-amber-400"
                    : "bg-white/[0.05] text-white/40",
                )}
              >
                {cat.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80">
                  {cat.label}
                </p>
                <p className="text-[12px] text-white/40">
                  ₹{annualSpend.toLocaleString()} · {cat.rate}% rate
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-sm font-bold tabular-nums",
                  isHighlight ? "text-amber-400" : "text-white/60",
                )}
              >
                ₹{Math.round(annualReward).toLocaleString()}
              </p>
              {isHighlight && (
                <p className="text-[8px] text-amber-400/60 font-bold uppercase flex items-center gap-1 justify-end">
                  <TrendingUp className="w-2 h-2" /> Enhanced
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── ENHANCED FILTER SHEET ────────────────────────────────────────────────────
function FilterSheetEnhanced({
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
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#080808] to-[#0f0f0f] border-t border-white/[0.1] rounded-t-3xl p-4 sm:p-6 z-50 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
          >
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Filter className="w-5 h-5 text-amber-400" />
                Refine Cards
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white/60" />
              </motion.button>
            </div>

            {/* Category section */}
            <div className="mb-6">
              <p className="text-[12px] font-bold uppercase tracking-widest text-amber-400 mb-3">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Dining",
                  "Fuel",
                  "Shopping",
                  "Travel",
                  "Movies",
                  "Forex",
                  "Lounge",
                ].map((cat) => (
                  <motion.button
                    key={cat}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setFilters((p) => ({
                        ...p,
                        categories: p.categories.includes(cat)
                          ? p.categories.filter((c) => c !== cat)
                          : [...p.categories, cat],
                      }))
                    }
                    className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${
                      filters.categories.includes(cat)
                        ? "bg-amber-400/20 border-amber-400/50 text-amber-300"
                        : "bg-white/[0.04] border-white/[0.08] text-white/50"
                    }`}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Status section */}
            <div className="mb-6">
              <p className="text-[12px] font-bold uppercase tracking-widest text-amber-400 mb-3">
                Card Status
              </p>
              <div className="flex flex-wrap gap-2">
                {["Active", "Changing", "Limited"].map((status) => (
                  <motion.button
                    key={status}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setFilters((p) => ({
                        ...p,
                        status: p.status.includes(status)
                          ? p.status.filter((s) => s !== status)
                          : [...p.status, status],
                      }))
                    }
                    className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${
                      filters.status.includes(status)
                        ? status === "Changing"
                          ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                          : "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-white/[0.04] border-white/[0.08] text-white/50"
                    }`}
                  >
                    {status === "Changing" && (
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                    )}
                    {status === "Active" && (
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    )}
                    {status === "Limited" && (
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                    )}
                    {status}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            {/* Toggles */}
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 mb-5 sm:mb-6">
              {[
                {
                  label: "Lifetime Free",
                  key: "ltfOnly" as const,
                  icon: <Sparkles key="sparkles-icon" className="w-3 h-3" />,
                },
                {
                  label: "Zero Forex",
                  key: "zeroForexOnly" as const,
                  icon: <Globe key="globe-icon" className="w-3 h-3" />,
                },
              ].map((item) => (
                <motion.button
                  key={item.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setFilters((p) => ({
                      ...p,
                      [item.key]: !p[item.key],
                    }))
                  }
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                    filters[item.key]
                      ? "bg-gradient-to-r from-amber-400/20 to-yellow-500/20 border-amber-400/50 text-amber-300"
                      : "bg-white/[0.04] border-white/[0.08] text-white/50"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </motion.button>
              ))}
            </div>

            {/* Sliders */}
            <div className="space-y-6 mb-8">
              {[
                {
                  label: "Max Joining Fee",
                  key: "joiningFee",
                  min: 0,
                  max: 15000,
                  step: 500,
                  fmt: (v: number) => `₹${v.toLocaleString()}`,
                },
                {
                  label: "Max Forex Markup",
                  key: "forex",
                  min: 0,
                  max: 5,
                  step: 0.1,
                  fmt: (v: number) => `${v}%`,
                },
              ].map((s) => (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-white/50 font-bold uppercase tracking-widest">
                      {s.label}
                    </label>
                    <span className="text-sm font-bold text-amber-400">
                      {s.fmt((filters as any)[s.key][1])}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={(filters as any)[s.key][1]}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        [s.key]: [s.min, Number(e.target.value)],
                      }))
                    }
                    className="w-full accent-amber-400 cursor-pointer h-2 rounded-lg"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[12px] text-white/30">
                      {s.fmt(s.min)}
                    </span>
                    <span className="text-[12px] text-white/30">
                      {s.fmt(s.max)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
                    status: ["Active", "Changing"],
                  })
                }
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white transition"
              >
                Reset All
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/30"
              >
                Apply Filters
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Add CSS for shimmer animation
const style = document.createElement("style");
style.textContent = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  .perspective-1000 {
    perspective: 1000px;
  }
`;
document.head.appendChild(style);
