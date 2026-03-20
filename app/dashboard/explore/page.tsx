"use client";

import { useState, useMemo } from "react";
import {
  Search,
  X,
  CreditCard,
  TrendingUp,
  ChevronRight,
  Info,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { creditCards } from "@/lib/credit-cards-data";
import {
  ASSET_CLASSES,
  INVESTMENT_OPTIONS,
  type AssetClass,
  type RiskLevel,
} from "@/lib/investment-universe";
import { cn } from "@/lib/utils";

type Domain = "cards" | "invest";
type CardFilter = "all" | "ltf" | "travel" | "cashback" | "premium";

const RISK_COLOR: Record<RiskLevel, string> = {
  "very-low": "text-emerald-400",
  low: "text-blue-400",
  medium: "text-amber-400",
  high: "text-orange-400",
  "very-high": "text-red-400",
};
const RISK_BG: Record<RiskLevel, string> = {
  "very-low": "bg-emerald-500/15",
  low: "bg-blue-500/15",
  medium: "bg-amber-500/15",
  high: "bg-orange-500/15",
  "very-high": "bg-red-500/15",
};

export default function ExplorePage() {
  const [domain, setDomain] = useState<Domain>("cards");
  const [query, setQuery] = useState("");
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");
  const [assetFilter, setAssetFilter] = useState<AssetClass | "all">("all");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [selectedInvest, setSelectedInvest] = useState<string | null>(null);

  // ── Filtered cards ──────────────────────────────────────────────
  const filteredCards = useMemo(() => {
    let c = [...creditCards] as any[];
    if (query) {
      const q = query.toLowerCase();
      c = c.filter(
        (x) =>
          x.name?.toLowerCase().includes(q) ||
          x.bank?.toLowerCase().includes(q) ||
          x.searchTags?.toLowerCase().includes(q),
      );
    }
    if (cardFilter === "ltf") c = c.filter((x) => x.isLtf || x.annualFee === 0);
    if (cardFilter === "cashback")
      c = c.filter(
        (x) =>
          x.searchTags?.includes("cashback") || x.rewardUnit === "Cashback",
      );
    if (cardFilter === "travel")
      c = c.filter((x) => x.tags?.includes("Travel"));
    if (cardFilter === "premium") c = c.filter((x) => x.annualFee >= 5000);
    c.sort(
      (a, b) =>
        b.baseRewardRate * b.pointValue - a.baseRewardRate * a.pointValue,
    );
    return c;
  }, [query, cardFilter]);

  // ── Filtered investments ─────────────────────────────────────────
  const filteredInvest = useMemo(() => {
    let opts = [...INVESTMENT_OPTIONS];
    if (query) {
      const q = query.toLowerCase();
      opts = opts.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.shortName.toLowerCase().includes(q) ||
          o.subcategory.toLowerCase().includes(q) ||
          o.tags.some((t) => t.includes(q)) ||
          o.platform.some((p) => p.toLowerCase().includes(q)),
      );
    }
    if (assetFilter !== "all")
      opts = opts.filter((o) => o.assetClass === assetFilter);
    if (riskFilter !== "all")
      opts = opts.filter((o) => o.riskLevel === riskFilter);
    return opts;
  }, [query, assetFilter, riskFilter]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold">Explore</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {domain === "cards"
            ? `${filteredCards.length} credit cards`
            : `${filteredInvest.length} investment options across 7 asset classes`}
        </p>
      </div>

      {/* Domain toggle */}
      <div className="flex bg-white/5 rounded-xl p-1">
        <button
          onClick={() => {
            setDomain("cards");
            setQuery("");
          }}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
            domain === "cards"
              ? "bg-amber-500 text-black"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <CreditCard className="w-4 h-4" /> Credit Cards
        </button>
        <button
          onClick={() => {
            setDomain("invest");
            setQuery("");
          }}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
            domain === "invest"
              ? "bg-amber-500 text-black"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <TrendingUp className="w-4 h-4" /> Investments
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            domain === "cards"
              ? "Search cards, banks, cashback…"
              : "Search investments, PPF, SGB, ELSS…"
          }
          className="w-full pl-9 pr-9 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-amber-400/50 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── CARD FILTERS ── */}
      {domain === "cards" && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {(
            [
              { id: "all", l: "All" },
              { id: "ltf", l: "Free Cards" },
              { id: "cashback", l: "Cashback" },
              { id: "travel", l: "Travel" },
              { id: "premium", l: "Premium" },
            ] as { id: CardFilter; l: string }[]
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setCardFilter(f.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                cardFilter === f.id
                  ? "bg-amber-400/20 border-amber-400/40 text-amber-400"
                  : "border-white/10 text-muted-foreground hover:text-foreground",
              )}
            >
              {f.l}
            </button>
          ))}
        </div>
      )}

      {/* ── INVESTMENT FILTERS ── */}
      {domain === "invest" && (
        <div className="space-y-3">
          {/* Asset class filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setAssetFilter("all")}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                assetFilter === "all"
                  ? "bg-amber-400/20 border-amber-400/40 text-amber-400"
                  : "border-white/10 text-muted-foreground",
              )}
            >
              All Classes
            </button>
            {ASSET_CLASSES.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setAssetFilter(cls.id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  assetFilter === cls.id
                    ? `border-current ${cls.textClass} bg-white/5`
                    : "border-white/10 text-muted-foreground",
                )}
              >
                <span>{cls.emoji}</span> {cls.label}
              </button>
            ))}
          </div>
          {/* Risk filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Risk:
            </span>
            {(
              ["all", "very-low", "low", "medium", "high", "very-high"] as const
            ).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all",
                  riskFilter === r
                    ? r === "all"
                      ? "bg-amber-400/20 border-amber-400/40 text-amber-400"
                      : `${RISK_BG[r as RiskLevel] || ""} border-current ${RISK_COLOR[r as RiskLevel] || ""}`
                    : "border-white/10 text-muted-foreground",
                )}
              >
                {r === "all" ? "Any" : r.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {domain === "cards"
          ? `${filteredCards.length} results`
          : `${filteredInvest.length} options`}
      </p>

      {/* ── CARD LIST ── */}
      {domain === "cards" && (
        <div className="space-y-2">
          {filteredCards.map((card: any, i: number) => {
            const isExp = selectedCard?.id === card.id;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.25) }}
                onClick={() => setSelectedCard(isExp ? null : card)}
                className={cn(
                  "rounded-2xl border cursor-pointer transition-all overflow-hidden",
                  isExp
                    ? "border-amber-400/30 bg-amber-400/5"
                    : "border-white/8 bg-white/3 hover:border-white/15",
                )}
              >
                <div className="flex items-center gap-3 p-3.5">
                  <div
                    className={cn(
                      "w-10 h-7 rounded-md shrink-0 bg-gradient-to-br",
                      card.imageGradient || "from-zinc-700 to-zinc-900",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {card.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {card.bank}
                      </p>
                      {card.isLtf && (
                        <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                          FREE
                        </span>
                      )}
                      {card.devaluation2026 && (
                        <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">
                          ⚠️
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-amber-400">
                      {(card.baseRewardRate * card.pointValue).toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {card.annualFee === 0
                        ? "Free"
                        : `₹${card.annualFee.toLocaleString()}`}
                    </p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 text-muted-foreground/30 transition-transform shrink-0",
                      isExp && "rotate-90",
                    )}
                  />
                </div>
                <AnimatePresence>
                  {isExp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/8 p-4 space-y-3"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            l: "Food/Dining",
                            v: `${Math.max(card.swiggyRate || 0, card.zomatoRate || 0, card.diningRate || 0)}%`,
                          },
                          { l: "Amazon", v: `${card.amazonRate || 0}%` },
                          { l: "Flights", v: `${card.flightRate || 0}%` },
                          {
                            l: "Dom. Lounge",
                            v: String(card.domesticLounge || 0),
                          },
                          { l: "Forex", v: `${card.forexMarkup}%` },
                          { l: "Reward Unit", v: card.rewardUnit },
                        ].map(({ l, v }) => (
                          <div
                            key={l}
                            className="text-center p-2 rounded-lg bg-white/3"
                          >
                            <p className="text-[9px] text-muted-foreground">
                              {l}
                            </p>
                            <p className="text-xs font-bold mt-0.5">{v}</p>
                          </div>
                        ))}
                      </div>
                      {card.notesTnc && (
                        <p className="text-[10px] text-muted-foreground bg-white/3 rounded-lg p-2 leading-relaxed">
                          ℹ️ {card.notesTnc.slice(0, 160)}
                          {card.notesTnc.length > 160 ? "…" : ""}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          {filteredCards.length === 0 && <EmptySearch query={query} />}
        </div>
      )}

      {/* ── INVESTMENT LIST ── */}
      {domain === "invest" && (
        <div className="space-y-2">
          {filteredInvest.map((opt, i) => {
            const meta = ASSET_CLASSES.find((c) => c.id === opt.assetClass)!;
            const isExp = selectedInvest === opt.id;
            return (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.25) }}
                onClick={() => setSelectedInvest(isExp ? null : opt.id)}
                className={cn(
                  "rounded-2xl border cursor-pointer transition-all overflow-hidden",
                  isExp
                    ? `${meta.borderClass} ${meta.bgClass}`
                    : "border-white/8 bg-white/3 hover:border-white/15",
                )}
              >
                <div className="flex items-center gap-3 p-3.5">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl",
                      meta.bgClass,
                    )}
                  >
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{opt.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className={cn("text-[10px] font-bold", meta.textClass)}
                      >
                        {meta.label}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded-full capitalize font-medium",
                          RISK_BG[opt.riskLevel],
                          RISK_COLOR[opt.riskLevel],
                        )}
                      >
                        {opt.riskLevel.replace("-", " ")} risk
                      </span>
                      {opt.taxBenefit !== "None" && (
                        <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                          {opt.taxBenefit.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-bold", meta.textClass)}>
                      {opt.returnMin}–{opt.returnMax}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">p.a.</p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 text-muted-foreground/30 transition-transform shrink-0",
                      isExp && "rotate-90",
                    )}
                  />
                </div>

                <AnimatePresence>
                  {isExp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/8 p-4 space-y-3"
                    >
                      {/* Metrics */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { l: "Min", v: `₹${opt.minInvest.toLocaleString()}` },
                          {
                            l: "Liquidity",
                            v:
                              opt.liquidityDays === 0
                                ? "Instant"
                                : opt.liquidityDays <= 3
                                  ? `T+${opt.liquidityDays}`
                                  : `${opt.liquidityDays}d`,
                          },
                          {
                            l: "Lock-in",
                            v:
                              opt.lockInYears === 0
                                ? "None"
                                : `${opt.lockInYears} yrs`,
                          },
                          { l: "SIP", v: opt.sipAvailable ? "Yes" : "No" },
                        ].map(({ l, v }) => (
                          <div
                            key={l}
                            className="text-center p-2 rounded-lg bg-white/3"
                          >
                            <p className="text-[9px] text-muted-foreground">
                              {l}
                            </p>
                            <p className="text-xs font-bold mt-0.5">{v}</p>
                          </div>
                        ))}
                      </div>
                      {/* Tax benefit */}
                      {opt.taxBenefit !== "None" && (
                        <div className="flex gap-2 p-2.5 rounded-lg bg-green-500/8 border border-green-500/20 text-xs text-green-300">
                          <span>💰</span>
                          <span>
                            Tax benefit: <strong>{opt.taxBenefit}</strong>
                          </span>
                        </div>
                      )}
                      {/* Pro tip */}
                      <div className="flex gap-2 p-3 rounded-xl bg-amber-400/8 border border-amber-400/15">
                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {opt.proTip}
                        </p>
                      </div>
                      {/* Platforms */}
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-2">
                          Where to invest:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {opt.platform.map((p) => (
                            <span
                              key={p}
                              className="text-[10px] px-2 py-1 rounded-lg bg-white/5 border border-white/10"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          {filteredInvest.length === 0 && <EmptySearch query={query} />}
        </div>
      )}
    </div>
  );
}

function EmptySearch({ query }: { query: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
      <p className="text-sm">No results{query ? ` for "${query}"` : ""}</p>
    </div>
  );
}
