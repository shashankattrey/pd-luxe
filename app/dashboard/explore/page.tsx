"use client";

import { useState, useMemo } from "react";
import {
  Search,
  X,
  CreditCard,
  ChevronRight,
  ArrowLeft,
  SlidersHorizontal,
  Plane,
  ShoppingBag,
  Gift,
  AlertTriangle,
  Globe,
  BadgePercent,
  IndianRupee,
  Info,
  Zap,
  Utensils,
  ShoppingCart,
  Fuel,
  Building,
  Star,
  CheckCircle,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  creditCards,
  type CreditCard as CCType,
} from "@/lib/credit-cards-data";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type CategoryFilter =
  | "all"
  | "ltf"
  | "cashback"
  | "travel"
  | "premium"
  | "entry"
  | "lounge"
  | "fuel"
  | "dining"
  | "grocery";
type NetworkFilter =
  | "all"
  | "Visa"
  | "Mastercard"
  | "Amex"
  | "RuPay"
  | "Diners";
type SortBy = "reward" | "fee_asc" | "fee_desc" | "base_rate" | "lounge";

interface Filters {
  category: CategoryFilter;
  network: NetworkFilter;
  bank: string;
  maxFee: number;
  minIncome: number;
  sortBy: SortBy;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const BANKS = [
  "all",
  ...Array.from(new Set(creditCards.map((c) => c.bank))).sort(),
];

const CATS: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: "all", label: "All Cards", icon: "💳" },
  { id: "ltf", label: "Free", icon: "🆓" },
  { id: "cashback", label: "Cashback", icon: "💵" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "lounge", label: "Lounge", icon: "🛋️" },
  { id: "dining", label: "Dining", icon: "🍽️" },
  { id: "grocery", label: "Grocery", icon: "🛒" },
  { id: "fuel", label: "Fuel", icon: "⛽" },
  { id: "premium", label: "Premium", icon: "👑" },
  { id: "entry", label: "Entry Level", icon: "🔰" },
];

const FEE_OPTS = [
  { label: "Any", value: 999_999 },
  { label: "Free", value: 0 },
  { label: "≤₹500", value: 500 },
  { label: "≤₹1,500", value: 1_500 },
  { label: "≤₹5,000", value: 5_000 },
  { label: "≤₹10k", value: 10_000 },
];

const INCOME_OPTS = [
  { label: "Any", value: 0 },
  { label: "3L+", value: 3 },
  { label: "6L+", value: 6 },
  { label: "12L+", value: 12 },
  { label: "25L+", value: 25 },
];

const SORT_OPTS: { id: SortBy; label: string }[] = [
  { id: "reward", label: "Best Reward" },
  { id: "base_rate", label: "Base Rate" },
  { id: "fee_asc", label: "Lowest Fee" },
  { id: "fee_desc", label: "Highest Fee" },
  { id: "lounge", label: "Most Lounge" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const effRate = (c: CCType) => c.baseRewardRate * c.pointValue;
const loungeCnt = (c: CCType) =>
  c.domesticLounge === "Unlimited"
    ? 999
    : parseInt(String(c.domesticLounge)) || 0;
const fmtFee = (c: CCType) =>
  c.isLtf || c.annualFee === 0
    ? "Lifetime Free"
    : `₹${c.annualFee.toLocaleString("en-IN")}`;
const fmtRate = (n: number) => (n > 0 ? `${n}%` : "—");
const DEFAULT_FILTERS: Filters = {
  category: "all",
  network: "all",
  bank: "all",
  maxFee: 999_999,
  minIncome: 0,
  sortBy: "reward",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CardVaultPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [detailCard, setDetailCard] = useState<CCType | null>(null);
  const setF = (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p }));

  const filtered = useMemo(() => {
    let c = [...creditCards] as CCType[];
    const q = query.toLowerCase().trim();
    if (q)
      c = c.filter(
        (x) =>
          x.name?.toLowerCase().includes(q) ||
          x.bank?.toLowerCase().includes(q) ||
          x.searchTags?.toLowerCase().includes(q),
      );
    switch (filters.category) {
      case "ltf":
        c = c.filter((x) => x.isLtf || x.annualFee === 0);
        break;
      case "cashback":
        c = c.filter(
          (x) =>
            x.searchTags?.includes("cashback") || x.rewardUnit === "Cashback",
        );
        break;
      case "travel":
        c = c.filter((x) => x.tags?.includes("Travel"));
        break;
      case "lounge":
        c = c.filter((x) => loungeCnt(x) > 0);
        break;
      case "dining":
        c = c.filter((x) => x.diningRate > x.baseRewardRate);
        break;
      case "grocery":
        c = c.filter((x) => x.groceryRate > x.baseRewardRate);
        break;
      case "fuel":
        c = c.filter((x) => x.fuelRewardRate > 0);
        break;
      case "premium":
        c = c.filter((x) => x.annualFee >= 5_000);
        break;
      case "entry":
        c = c.filter((x) => x.annualFee <= 1_000);
        break;
    }
    if (filters.network !== "all")
      c = c.filter((x) => x.network === filters.network);
    if (filters.bank !== "all") c = c.filter((x) => x.bank === filters.bank);
    if (filters.maxFee < 999_999)
      c = c.filter((x) => x.annualFee <= filters.maxFee);
    if (filters.minIncome > 0)
      c = c.filter((x) => (x.minIncomeLakhs || 0) <= filters.minIncome);
    switch (filters.sortBy) {
      case "reward":
        c.sort((a, b) => effRate(b) - effRate(a));
        break;
      case "base_rate":
        c.sort((a, b) => b.baseRewardRate - a.baseRewardRate);
        break;
      case "fee_asc":
        c.sort((a, b) => a.annualFee - b.annualFee);
        break;
      case "fee_desc":
        c.sort((a, b) => b.annualFee - a.annualFee);
        break;
      case "lounge":
        c.sort((a, b) => loungeCnt(b) - loungeCnt(a));
        break;
    }
    return c;
  }, [query, filters]);

  const hasActive = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  if (detailCard)
    return <CardDetail card={detailCard} onBack={() => setDetailCard(null)} />;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Card Vault</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="text-amber-400 font-medium">{filtered.length}</span>{" "}
          cards · tap to explore full details
        </p>
      </div>

      {/* ── Search + Filter button ───────────────────────────────────────── */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, bank, tag…"
            className="w-full h-11 pl-10 pr-10 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-amber-400/40 focus:border-amber-400/30 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "h-11 px-4 flex items-center gap-2 rounded-xl border text-sm font-medium transition-all shrink-0",
            showFilters || hasActive
              ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
              : "bg-white/[0.04] border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-white/15",
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      {/* ── Category pills ──────────────────────────────────────────────── */}
      {/* ── Category pills (Desktop: Horizontal Scroll | Mobile: Hidden) ──────────────── */}
      <div className="hidden sm:flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {CATS.map((f) => (
          <button
            key={f.id}
            onClick={() => setF({ category: f.id })}
            className={cn(
              "shrink-0 flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-medium border transition-all",
              filters.category === f.id
                ? "bg-amber-400/15 border-amber-400/35 text-amber-300"
                : "bg-white/[0.03] border-white/[0.07] text-muted-foreground hover:text-foreground hover:border-white/15",
            )}
          >
            <span className="text-sm leading-none">{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* ── Advanced filters ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* ── Mobile Backdrop ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"
            />

            {/* ── Filter Container ── */}
            <motion.div
              initial={{ opacity: 0, y: "100%" }} // Slide up from bottom on mobile
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                // Mobile: Bottom Sheet Styles
                "fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] bg-zinc-900 border-t border-white/10 px-4 pb-8 pt-2",
                // Desktop: Inline Dropdown Styles
                "sm:relative sm:inset-auto sm:z-0 sm:rounded-2xl sm:bg-white/[0.02] sm:border sm:border-white/[0.08] sm:mt-4 sm:p-0 sm:pb-0 sm:pt-0",
              )}
            >
              {/* ── Mobile Handle Bar ── */}
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-4 sm:hidden" />

              <div
                className={cn(
                  "flex flex-col divide-y divide-white/[0.05]",
                  "max-h-[80vh] overflow-y-auto sm:max-h-none sm:overflow-visible custom-scrollbar",
                )}
              >
                {/* ── Categories (Mobile Only) ── */}
                <div className="sm:hidden py-2">
                  <FilterRow label="Category">
                    <div className="flex flex-wrap gap-2">
                      {CATS.map((f) => (
                        <Pill
                          key={f.id}
                          active={filters.category === f.id}
                          onClick={() => setF({ category: f.id })}
                          className={cn(
                            "h-9 px-4", // Slightly larger for mobile touch
                            filters.category === f.id &&
                              "bg-amber-400/15 border-amber-400/35 text-amber-300",
                          )}
                        >
                          <span className="text-base mr-2">{f.icon}</span>
                          {f.label}
                        </Pill>
                      ))}
                    </div>
                  </FilterRow>
                </div>

                {/* ── Network ── */}
                <FilterRow label="Network">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "all",
                        "Visa",
                        "Mastercard",
                        "Amex",
                        "RuPay",
                        "Diners",
                      ] as NetworkFilter[]
                    ).map((n) => (
                      <Pill
                        key={n}
                        active={filters.network === n}
                        onClick={() => setF({ network: n })}
                        className="h-9 px-4 sm:h-7 sm:px-3"
                      >
                        {n === "all" ? "All" : n}
                      </Pill>
                    ))}
                  </div>
                </FilterRow>

                {/* ── Issuer ── */}
                <FilterRow label="Issuer">
                  <div className="flex flex-wrap gap-2">
                    {BANKS.slice(0, 13).map((b) => (
                      <Pill
                        key={b}
                        active={filters.bank === b}
                        onClick={() => setF({ bank: b })}
                        className="h-9 px-4 sm:h-7 sm:px-3"
                      >
                        {b === "all" ? "All Banks" : b}
                      </Pill>
                    ))}
                  </div>
                </FilterRow>

                {/* ── Annual Fee ── */}
                <FilterRow label="Annual Fee">
                  <div className="flex flex-wrap gap-2">
                    {FEE_OPTS.map((o) => (
                      <Pill
                        key={o.value}
                        active={filters.maxFee === o.value}
                        onClick={() => setF({ maxFee: o.value })}
                        className="h-9 px-4 sm:h-7 sm:px-3"
                      >
                        {o.label}
                      </Pill>
                    ))}
                  </div>
                </FilterRow>

                {/* ── Eligibility ── */}
                <FilterRow label="Eligibility">
                  <div className="flex flex-wrap gap-2">
                    {INCOME_OPTS.map((o) => (
                      <Pill
                        key={o.value}
                        active={filters.minIncome === o.value}
                        onClick={() => setF({ minIncome: o.value })}
                        className="h-9 px-4 sm:h-7 sm:px-3"
                      >
                        {o.label}
                      </Pill>
                    ))}
                  </div>
                </FilterRow>

                {/* ── Sort By ── */}
                <FilterRow label="Sort By">
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTS.map((o) => (
                      <Pill
                        key={o.id}
                        active={filters.sortBy === o.id}
                        onClick={() => setF({ sortBy: o.id })}
                        className="h-9 px-4 sm:h-7 sm:px-3"
                      >
                        {o.label}
                      </Pill>
                    ))}
                  </div>
                </FilterRow>

                {/* ── Footer Actions ── */}
                <div className="sticky bottom-0 mt-auto pt-4 pb-2 bg-zinc-900 sm:bg-transparent sm:px-4 sm:py-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFilters(false)}
                      className="flex-1 sm:hidden h-12 bg-white/10 rounded-xl font-semibold text-sm"
                    >
                      Close
                    </button>
                    {hasActive && (
                      <button
                        onClick={() => {
                          setFilters(DEFAULT_FILTERS);
                          if (window.innerWidth < 640) setShowFilters(false);
                        }}
                        className="flex-1 sm:flex-none h-12 sm:h-auto px-4 text-sm text-red-400 sm:text-muted-foreground/60 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4 sm:w-3 sm:h-3" /> Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Results count ───────────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground/60">
        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* ── Card list ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.map((card, i) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.015, 0.25), duration: 0.2 }}
            onClick={() => setDetailCard(card)}
            className="w-full text-left rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] active:scale-[0.99] cursor-pointer transition-all duration-150 overflow-hidden group"
          >
            {/* Top row */}
            <div className="flex items-center gap-4 p-4">
              {/* Card art */}
              <div
                className={cn(
                  "w-14 h-9 rounded-xl shrink-0 bg-gradient-to-br shadow-sm relative overflow-hidden",
                  `${card.imageGradient}` || "from-zinc-700 to-zinc-900",
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <div className="absolute bottom-1 right-1.5 w-4 h-3 rounded-sm bg-white/10" />
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug truncate">
                  {card.name}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground/70">
                    {card.bank}
                  </span>
                  {card.isLtf && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-1.5 py-px rounded-full">
                      FREE
                    </span>
                  )}
                  {card.devaluation2026 && (
                    <span className="inline-flex items-center text-[10px] text-orange-400 bg-orange-400/10 border border-orange-400/20 px-1.5 py-px rounded-full">
                      ⚠ 2026
                    </span>
                  )}
                  {card.tags?.includes("Travel") && (
                    <span className="text-[10px] text-sky-400/80 bg-sky-400/8 border border-sky-400/15 px-1.5 py-px rounded-full">
                      Travel
                    </span>
                  )}
                </div>
              </div>

              {/* Rate + fee */}
              <div className="text-right shrink-0">
                <p className="text-base font-bold text-amber-400 leading-tight">
                  {effRate(card).toFixed(1)}%
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {fmtFee(card)}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground/25 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-4 border-t border-white/[0.04]">
              {(
                [
                  {
                    e: "🍽️",
                    v: fmtRate(
                      Math.max(
                        card.swiggyRate,
                        card.zomatoRate,
                        card.diningRate,
                      ),
                    ),
                    l: "Dining",
                  },
                  { e: "✈️", v: fmtRate(card.flightRate), l: "Flights" },
                  {
                    e: "🛒",
                    v: fmtRate(Math.max(card.amazonRate, card.flipkartRate)),
                    l: "Online",
                  },
                  {
                    e: "🛋️",
                    v:
                      card.domesticLounge === "Unlimited"
                        ? "∞"
                        : loungeCnt(card) > 0
                          ? `${loungeCnt(card)}`
                          : "—",
                    l: "Lounge",
                  },
                ] as const
              ).map(({ e, v, l }) => (
                <div
                  key={l}
                  className="flex flex-col items-center justify-center py-2.5 gap-0.5"
                >
                  <span className="text-[11px] leading-none">{e}</span>
                  <span className="text-[11px] font-semibold text-foreground/80">
                    {v}
                  </span>
                  <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wide">
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </motion.button>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 gap-3">
            <WifiOff className="w-8 h-8" />
            <p className="text-sm">No cards match your filters</p>
            <button
              onClick={() => {
                setQuery("");
                setFilters(DEFAULT_FILTERS);
              }}
              className="text-xs text-amber-400/80 hover:text-amber-400 transition-colors underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Filter sub-components ────────────────────────────────────────────────────

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex items-start gap-4 px-4 py-3.5">
      <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest w-20 shrink-0 pt-1">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string; // <--- Add this
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-7 px-3 rounded-full text-xs font-medium border transition-all",
        active
          ? "bg-amber-400/15 border-amber-400/35 text-amber-300"
          : "bg-transparent border-white/[0.08] text-muted-foreground/70 hover:text-foreground hover:border-white/15",
      )}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD DETAIL
// ─────────────────────────────────────────────────────────────────────────────

function CardDetail({ card, onBack }: { card: CCType; onBack: () => void }) {
  const lounge = loungeCnt(card);
  const bestAll = Math.max(
    card.swiggyRate,
    card.zomatoRate,
    card.diningRate,
    card.groceryRate,
    card.amazonRate,
    card.flipkartRate,
    card.flightRate,
    card.hotelRate,
    card.movieEffectiveRate,
    card.fuelRewardRate,
    card.baseRewardRate,
  );

  const airlinePartners = Object.entries(card.airlineTransferJson || {}).filter(
    ([k]) => k !== "General" && k !== "N/A",
  );
  const hotelPartners = Object.entries(card.hotelTransferJson || {}).filter(
    ([k]) => k !== "General" && k !== "N/A",
  );
  const detailedRules = Object.entries(card.detailedRewardsJson || {});
  const hasTransfers = airlinePartners.length > 0 || hotelPartners.length > 0;

  // Build reward rows — only show rates that differ from base or are notable
  const rewardRows = [
    {
      label: "Base Rate",
      value: `${card.baseRewardRate}%`,
      note: "all spend",
      accent: true,
    },
    ...[
      { label: "Swiggy", val: card.swiggyRate },
      { label: "Zomato", val: card.zomatoRate },
      { label: "Dining", val: card.diningRate },
      { label: "Grocery", val: card.groceryRate },
      { label: "Amazon", val: card.amazonRate },
      { label: "Flipkart", val: card.flipkartRate },
      { label: "Meesho", val: card.meeshoRate },
      { label: "Ajio", val: card.ajioRate },
      { label: "Croma", val: card.cromaRate },
      { label: "Reliance Digital", val: card.relianceRate },
      { label: "Utilities", val: card.utilityRate },
      { label: "Flights", val: card.flightRate },
      { label: "Hotels", val: card.hotelRate },
      { label: "Movies", val: card.movieEffectiveRate },
      { label: "Fuel", val: card.fuelRewardRate },
      { label: "Rent", val: card.rentRate },
    ].map((r) => ({
      label: r.label,
      value: r.val > 0 ? `${r.val}%` : "—",
      note: undefined as string | undefined,
      accent: r.val > card.baseRewardRate,
      dim: r.val === 0,
    })),
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 pb-16 space-y-6">
      {/* ── Back ── */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-foreground transition-colors pt-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>All cards</span>
      </button>

      {/* ── Hero card ── */}
      <div
        className={cn(
          "relative rounded-3xl overflow-hidden bg-gradient-to-br",
          card.imageGradient || "from-zinc-800 to-zinc-950",
        )}
        style={{ minHeight: 200 }}
      >
        {/* Light polish top-right */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_0%,rgba(255,255,255,0.12),transparent)]" />
        {/* Subtle bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
        {/* EMV chip graphic */}
        <div className="absolute top-6 right-6 w-10 h-7 rounded-md border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <div className="w-6 h-4 rounded-sm border border-white/20 bg-gradient-to-br from-amber-300/30 to-amber-500/20" />
        </div>
        {/* Contactless waves */}
        <div className="absolute top-7 right-20 opacity-20">
          <div className="w-3 h-3 rounded-full border border-white" />
          <div className="w-5 h-5 rounded-full border border-white absolute -top-1 -left-1" />
          <div className="w-7 h-7 rounded-full border border-white absolute -top-2 -left-2" />
        </div>

        <div className="relative p-6 sm:p-8">
          {/* Bank + tier */}
          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-[0.15em]">
            {card.bank} · {card.tier} · {card.network}
          </p>

          {/* Card name */}
          <h1 className="text-white font-bold text-2xl sm:text-3xl mt-2 leading-tight">
            {card.name}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {card.isLtf && (
              <span className="text-[10px] font-semibold text-green-300 bg-green-400/15 border border-green-400/25 px-2.5 py-1 rounded-full">
                ✓ Lifetime Free
              </span>
            )}
            {card.devaluation2026 && (
              <span className="text-[10px] text-orange-300 bg-orange-400/15 border border-orange-400/25 px-2.5 py-1 rounded-full">
                ⚠ 2026 Changes
              </span>
            )}
            {card.tags
              ?.filter((t) => t !== "Standard")
              .map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-white/50 bg-white/8 border border-white/15 px-2.5 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
          </div>

          {/* Bottom row */}
          <div className="flex items-end justify-between mt-8 sm:mt-10">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
                Base Reward
              </p>
              <p className="text-white font-bold text-4xl leading-none mt-1">
                {effRate(card).toFixed(1)}%
              </p>
              <p className="text-white/35 text-[11px] mt-1.5">
                {card.rewardUnit} · ₹{card.pointValue}/pt
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
                Annual Fee
              </p>
              <p className="text-white font-bold text-xl mt-1 leading-tight">
                {fmtFee(card)}
              </p>
              {card.retentionSpendReq > 0 && (
                <p className="text-white/30 text-[10px] mt-1">
                  waived at ₹{(card.retentionSpendReq / 100_000).toFixed(0)}L/yr
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 hero stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Best Rate",
            value: `${bestAll.toFixed(1)}%`,
            note: "any category",
            color: "text-amber-400",
            bg: "bg-amber-400/5   border-amber-400/15",
          },
          {
            label: "Dom. Lounge",
            value: lounge === 999 ? "∞" : lounge > 0 ? `${lounge}` : "—",
            note: "visits/yr",
            color: lounge > 0 ? "text-sky-400" : "text-muted-foreground",
            bg:
              lounge > 0
                ? "bg-sky-400/5 border-sky-400/15"
                : "bg-white/3 border-white/8",
          },
          {
            label: "Intl. Lounge",
            value:
              card.internationalLounge > 0
                ? card.internationalLounge === 999
                  ? "∞"
                  : `${card.internationalLounge}`
                : "—",
            note: "visits/yr",
            color:
              card.internationalLounge > 0
                ? "text-violet-400"
                : "text-muted-foreground",
            bg:
              card.internationalLounge > 0
                ? "bg-violet-400/5 border-violet-400/15"
                : "bg-white/3 border-white/8",
          },
          {
            label: "Forex",
            value: card.forexMarkup === 0 ? "0%" : `${card.forexMarkup}%`,
            note: "markup",
            color:
              card.forexMarkup === 0
                ? "text-green-400"
                : "text-muted-foreground",
            bg:
              card.forexMarkup === 0
                ? "bg-green-400/5 border-green-400/15"
                : "bg-white/3 border-white/8",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={cn("rounded-2xl border p-4 text-center space-y-1", s.bg)}
          >
            <p className={cn("text-2xl font-bold leading-none", s.color)}>
              {s.value}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              {s.label}
            </p>
            {s.note && (
              <p className="text-[9px] text-muted-foreground/40">{s.note}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Fees & Eligibility ── */}
      <InfoCard
        title="Fees & Eligibility"
        icon={<IndianRupee className="w-4 h-4" />}
      >
        <InfoGrid>
          <InfoItem
            label="Joining Fee"
            value={
              card.joiningFee > 0
                ? `₹${card.joiningFee.toLocaleString()}`
                : "Nil"
            }
          />
          <InfoItem
            label="Annual Fee"
            value={fmtFee(card)}
            highlight={card.isLtf || card.annualFee === 0}
          />
          <InfoItem
            label="Fee Waiver"
            value={
              card.retentionSpendReq > 0
                ? `₹${(card.retentionSpendReq / 100_000).toFixed(0)}L/yr spend`
                : "N/A"
            }
          />
          <InfoItem
            label="Min. Income"
            value={
              card.minIncomeLakhs > 0
                ? `₹${card.minIncomeLakhs}L/yr`
                : "Not specified"
            }
          />
          <InfoItem label="Reward Unit" value={card.rewardUnit} />
          <InfoItem
            label="Point Value"
            value={`₹${card.pointValue} per point`}
          />
          <InfoItem
            label="Monthly Cap"
            value={String(card.rewardCap || "No Cap")}
          />
          <InfoItem label="Earn Channel" value={card.multiplierChannel} />
        </InfoGrid>
      </InfoCard>

      {/* ── Reward Rates ── */}
      <InfoCard
        title="Reward Rates"
        icon={<BadgePercent className="w-4 h-4" />}
        subtitle="Highlighted rows beat the base rate"
      >
        <div className="divide-y divide-white/[0.04]">
          {rewardRows.map((r) => (
            <div
              key={r.label}
              className={cn(
                "flex items-center justify-between px-5 py-3 gap-6",
                r.accent && "bg-amber-400/[0.04]",
              )}
            >
              <span
                className={cn(
                  "text-sm",
                  "dim" in r && r.dim
                    ? "text-muted-foreground/40"
                    : "text-muted-foreground",
                )}
              >
                {r.label}
                {r.note && (
                  <span className="text-[10px] text-muted-foreground/40 ml-1.5">
                    · {r.note}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums shrink-0",
                  r.accent
                    ? "text-amber-400"
                    : ("dim" in r ? r.dim : false)
                      ? "text-muted-foreground/30"
                      : "text-foreground",
                )}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </InfoCard>

      {/* ── How to maximise ── */}
      {[
        { label: "Amazon", method: card.amazonMethod, rate: card.amazonRate },
        {
          label: "Flipkart",
          method: card.flipkartMethod,
          rate: card.flipkartRate,
        },
        {
          label: "Reliance Digital",
          method: card.relianceMethod,
          rate: card.relianceRate,
        },
        { label: "SmartBuy Flights", method: "", rate: card.smartbuyFlightPct },
        { label: "Direct Flights", method: "", rate: card.atlasFlightPct },
      ].filter(
        (x) =>
          x.rate > 0 ||
          (x.method &&
            ![
              "Direct Purchase",
              "Direct Offline Swiped",
              "Direct Website",
            ].includes(x.method)),
      ).length > 0 && (
        <InfoCard
          title="How to Maximise"
          icon={<ShoppingBag className="w-4 h-4" />}
        >
          <div className="divide-y divide-white/[0.04]">
            {[
              {
                label: "Amazon",
                method: card.amazonMethod,
                rate: card.amazonRate,
              },
              {
                label: "Flipkart",
                method: card.flipkartMethod,
                rate: card.flipkartRate,
              },
              {
                label: "Reliance Digital",
                method: card.relianceMethod,
                rate: card.relianceRate,
              },
              {
                label: "SmartBuy Flights",
                method: "",
                rate: card.smartbuyFlightPct,
              },
              {
                label: "Direct Flights",
                method: "",
                rate: card.atlasFlightPct,
              },
              {
                label: "SBI Cashback",
                method: "",
                rate: card.sbiCashbackFlightPct,
              },
            ]
              .filter(
                (x) =>
                  x.rate > 0 ||
                  (x.method &&
                    ![
                      "Direct Purchase",
                      "Direct Offline Swiped",
                      "Direct Website",
                    ].includes(x.method)),
              )
              .map(({ label, method, rate }) => (
                <div
                  key={label}
                  className="flex items-start justify-between px-5 py-3.5 gap-6"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    {method &&
                      ![
                        "Direct Purchase",
                        "Direct Offline Swiped",
                        "Direct Website",
                      ].includes(method) && (
                        <p className="text-[11px] text-muted-foreground/50 mt-0.5 leading-relaxed">
                          {method}
                        </p>
                      )}
                  </div>
                  {rate > 0 && (
                    <span className="text-sm font-semibold text-amber-400 shrink-0">
                      {rate}%
                    </span>
                  )}
                </div>
              ))}
          </div>
          {card.instantDiscountEligible && (
            <div className="flex items-center gap-2.5 px-5 py-3 border-t border-white/[0.04] text-sm">
              <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span className="text-muted-foreground">
                Eligible for instant discounts
              </span>
            </div>
          )}
        </InfoCard>
      )}

      {/* ── Travel Perks ── */}
      <InfoCard title="Travel Perks" icon={<Plane className="w-4 h-4" />}>
        <InfoGrid>
          <InfoItem
            label="Domestic Lounge"
            value={
              card.domesticLounge === "Unlimited"
                ? "Unlimited"
                : lounge > 0
                  ? `${lounge} visits/yr`
                  : "Not included"
            }
            highlight={lounge > 0}
          />
          <InfoItem
            label="Intl. Lounge"
            value={
              card.internationalLounge > 0
                ? card.internationalLounge === 999
                  ? "Unlimited"
                  : `${card.internationalLounge} visits/yr`
                : "Not included"
            }
            highlight={card.internationalLounge > 0}
          />
          <InfoItem
            label="Forex Markup"
            value={card.forexMarkup === 0 ? "Zero" : `${card.forexMarkup}%`}
            highlight={card.forexMarkup === 0}
          />
          {card.forexEffective && card.forexEffective !== "N/A" && (
            <InfoItem label="Effective Forex" value={card.forexEffective} />
          )}
          <InfoItem
            label="Travel Multiplier"
            value={
              card.travelMultiplier > 1 ? `${card.travelMultiplier}×` : "None"
            }
          />
          {card.pointsRedemptionValueTravel > 0 && (
            <InfoItem
              label="Redemption Value"
              value={`₹${card.pointsRedemptionValueTravel}/pt`}
            />
          )}
          {card.emiratesSuitability > 0 && (
            <InfoItem
              label="Emirates Score"
              value={`${card.emiratesSuitability}/10`}
            />
          )}
          <InfoItem label="Fuel Waiver" value={card.surchargeWaiver || "—"} />
          {card.fuelCap && card.fuelCap !== "0" && (
            <InfoItem label="Fuel Cap" value={`₹${card.fuelCap}`} />
          )}
        </InfoGrid>
        {card.loungeCapDetails && (
          <div className="mx-5 mb-4 mt-1 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
              {card.loungeCapDetails}
            </p>
          </div>
        )}
      </InfoCard>

      {/* ── Transfer Partners ── */}
      {hasTransfers && (
        <InfoCard
          title="Transfer Partners"
          icon={<Globe className="w-4 h-4" />}
        >
          <div className="px-5 space-y-5 py-4">
            {airlinePartners.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
                  Airlines
                </p>
                <div className="flex flex-wrap gap-2">
                  {airlinePartners.map(([airline, ratio]) => (
                    <div
                      key={airline}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-sky-400/6 border border-sky-400/15"
                    >
                      <div>
                        <p className="text-xs font-semibold text-sky-300 leading-tight">
                          {airline}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                          {ratio}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hotelPartners.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
                  Hotels
                </p>
                <div className="flex flex-wrap gap-2">
                  {hotelPartners.map(([hotel, ratio]) => (
                    <div
                      key={hotel}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-400/6 border border-amber-400/15"
                    >
                      <div>
                        <p className="text-xs font-semibold text-amber-300 leading-tight">
                          {hotel}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                          {ratio}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {card.airIndiaTransferRatio > 0 && (
              <div className="pt-1 border-t border-white/[0.04]">
                <InfoItem
                  label="Air India Ratio"
                  value={`${card.airIndiaTransferRatio} pts → 1 mile`}
                />
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* ── Category Rules ── */}
      {detailedRules.length > 0 && (
        <InfoCard
          title="Category-Specific Rules"
          icon={<Info className="w-4 h-4" />}
          subtitle="From card T&C"
        >
          <InfoGrid>
            {detailedRules.map(([cat, rule]) => (
              <InfoItem key={cat} label={cat} value={rule} />
            ))}
          </InfoGrid>
        </InfoCard>
      )}

      {/* ── Benefits ── */}
      {(card.joiningBenefit &&
        !["N/A", "None", ""].includes(card.joiningBenefit)) ||
      (card.milestoneBenefit && card.milestoneBenefit !== "None") ? (
        <InfoCard
          title="Benefits & Milestones"
          icon={<Gift className="w-4 h-4" />}
        >
          <div className="px-5 py-4 space-y-4">
            {card.joiningBenefit &&
              !["N/A", "None", ""].includes(card.joiningBenefit) && (
                <div className="p-4 rounded-xl bg-green-400/[0.05] border border-green-400/15">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-green-400/70 mb-1.5">
                    Joining Benefit
                  </p>
                  <p className="text-sm text-green-300/90 leading-relaxed">
                    {card.joiningBenefit}
                  </p>
                </div>
              )}
            {card.milestoneBenefit && card.milestoneBenefit !== "None" && (
              <div className="p-4 rounded-xl bg-amber-400/[0.05] border border-amber-400/15">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/70 mb-1.5">
                  Milestone Benefit
                </p>
                <p className="text-sm text-amber-300/90 leading-relaxed">
                  {card.milestoneBenefit}
                </p>
              </div>
            )}
          </div>
        </InfoCard>
      ) : null}

      {/* ── Notes / Warnings ── */}
      {card.notesTnc && (
        <div
          className={cn(
            "rounded-2xl border p-5 space-y-3",
            card.devaluation2026
              ? "border-orange-500/20 bg-orange-500/[0.04]"
              : "border-white/[0.07] bg-white/[0.02]",
          )}
        >
          <div className="flex items-center gap-2.5">
            {card.devaluation2026 ? (
              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            )}
            <p className="text-sm font-semibold">
              {card.devaluation2026
                ? "2026 Changes & Warnings"
                : "Notes & Terms"}
            </p>
          </div>
          <p className="text-sm text-muted-foreground/70 leading-relaxed">
            {card.notesTnc}
          </p>
        </div>
      )}

      {/* ── Tags ── */}
      {card.searchTags && (
        <div className="flex flex-wrap gap-1.5 pb-4">
          {card.searchTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.07] text-muted-foreground/40"
              >
                {tag}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail sub-components ────────────────────────────────────────────────────

function InfoCard({
  title,
  icon,
  subtitle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
        <span className="text-muted-foreground/60">{icon}</span>
        <div>
          <h3 className="text-sm font-semibold leading-none">{title}</h3>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-white/[0.04]">{children}</div>;
}

function InfoItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 py-3 gap-6",
        highlight && "bg-amber-400/[0.04]",
      )}
    >
      <span className="text-sm text-muted-foreground/70 min-w-0">{label}</span>
      <span
        className={cn(
          "text-sm font-medium shrink-0 text-right",
          highlight ? "text-amber-400" : "text-foreground/90",
        )}
      >
        {value}
      </span>
    </div>
  );
}
