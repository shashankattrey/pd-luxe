"use client";

import { useState, useMemo } from "react";
import {
  Search,
  X,
  TrendingUp,
  Filter,
  ChevronRight,
  ArrowUpRight,
  Star,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { mutualFunds } from "@/lib/mutual-funds-data";
import { cn } from "@/lib/utils";

type Category =
  | "all"
  | "large-cap"
  | "mid-cap"
  | "small-cap"
  | "flexi-cap"
  | "elss"
  | "debt"
  | "index";
type SortKey = "cagr3y" | "cagr1y" | "minSip" | "name";

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: "all", label: "All Funds", emoji: "📊" },
  { id: "large-cap", label: "Large Cap", emoji: "🏛️" },
  { id: "flexi-cap", label: "Flexi Cap", emoji: "🔄" },
  { id: "mid-cap", label: "Mid Cap", emoji: "📈" },
  { id: "small-cap", label: "Small Cap", emoji: "🚀" },
  { id: "elss", label: "ELSS / Tax", emoji: "🛡️" },
  { id: "debt", label: "Debt", emoji: "🏦" },
  { id: "index", label: "Index", emoji: "📉" },
];

export default function FundsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [sortBy, setSortBy] = useState<SortKey>("cagr3y");
  const [selected, setSelected] = useState<number | null>(null);

  const funds = useMemo(() => {
    let f = [...mutualFunds] as any[];

    if (query) {
      const q = query.toLowerCase();
      f = f.filter(
        (x) =>
          (x.fund_name || x.name || "").toLowerCase().includes(q) ||
          (x.category || "").toLowerCase().includes(q),
      );
    }

    if (category !== "all") {
      f = f.filter((x) =>
        (x.category || "").toLowerCase().includes(category.replace("-", " ")),
      );
    }

    if (sortBy === "cagr3y")
      f.sort(
        (a, b) =>
          parseFloat(b.three_year_return || "0") -
          parseFloat(a.three_year_return || "0"),
      );
    if (sortBy === "cagr1y")
      f.sort(
        (a, b) =>
          parseFloat(b.one_year_return || "0") -
          parseFloat(a.one_year_return || "0"),
      );
    if (sortBy === "minSip")
      f.sort((a, b) => (a.min_sip || 0) - (b.min_sip || 0));
    if (sortBy === "name")
      f.sort((a, b) =>
        (a.fund_name || a.name || "").localeCompare(
          b.fund_name || b.name || "",
        ),
      );

    return f;
  }, [query, category, sortBy]);

  const getRiskColor = (cat: string) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("small")) return "text-red-400";
    if (c.includes("mid")) return "text-orange-400";
    if (c.includes("large") || c.includes("index")) return "text-blue-400";
    if (c.includes("debt")) return "text-green-400";
    if (c.includes("elss")) return "text-purple-400";
    return "text-amber-400";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Fund Explorer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {funds.length} direct funds · zero commission · updated daily
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search funds by name or category…"
          className="w-full pl-9 pr-9 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-emerald-400/50 transition-all"
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

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
              category === c.id
                ? "bg-emerald-400/20 border-emerald-400/40 text-emerald-400"
                : "border-white/10 text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{c.emoji}</span> {c.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{funds.length} results</p>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="text-xs bg-transparent text-muted-foreground focus:outline-none"
          >
            <option value="cagr3y">3Y Returns</option>
            <option value="cagr1y">1Y Returns</option>
            <option value="minSip">Min SIP</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Fund list */}
      <div className="space-y-2">
        {funds.map((fund: any, i: number) => {
          const name = fund.fund_name ?? fund.name ?? "—";
          const cat = fund.category ?? "—";
          const cagr3y = fund.three_year_return ?? fund.cagr_3y ?? "—";
          const cagr1y = fund.one_year_return ?? "—";
          const cagr5y = fund.five_year_return ?? "—";
          const minSip = fund.min_sip ?? "—";
          const isExp = selected === i;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.25) }}
              className={cn(
                "rounded-2xl border cursor-pointer transition-all overflow-hidden",
                isExp
                  ? "border-emerald-400/30 bg-emerald-400/5"
                  : "border-white/8 bg-white/3 hover:border-white/15",
              )}
              onClick={() => setSelected(isExp ? null : i)}
            >
              <div className="flex items-center gap-3 p-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {name}
                  </p>
                  <p className={cn("text-xs mt-0.5", getRiskColor(cat))}>
                    {cat}
                  </p>
                </div>
                <div className="text-right shrink-0 mr-1">
                  <p className="text-sm font-bold text-emerald-400">
                    {cagr3y}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">3Y CAGR</p>
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
                    className="border-t border-white/8 p-4 space-y-4"
                  >
                    {/* Returns grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { l: "1Y", v: `${cagr1y}%`, c: "text-emerald-400" },
                        { l: "3Y", v: `${cagr3y}%`, c: "text-emerald-400" },
                        { l: "5Y", v: `${cagr5y}%`, c: "text-emerald-400" },
                        {
                          l: "Min SIP",
                          v:
                            typeof minSip === "number"
                              ? `₹${minSip.toLocaleString()}`
                              : `₹${minSip}`,
                          c: "text-foreground",
                        },
                      ].map(({ l, v, c }) => (
                        <div
                          key={l}
                          className="text-center p-2.5 rounded-xl bg-white/3"
                        >
                          <p className="text-[10px] text-muted-foreground">
                            {l}
                          </p>
                          <p className={cn("text-sm font-bold mt-0.5", c)}>
                            {v}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Risk tag + CTA */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs px-3 py-1 rounded-full font-medium",
                          cat.toLowerCase().includes("small")
                            ? "bg-red-500/15 text-red-400"
                            : cat.toLowerCase().includes("mid")
                              ? "bg-orange-500/15 text-orange-400"
                              : "bg-emerald-500/15 text-emerald-400",
                        )}
                      >
                        {cat.toLowerCase().includes("small")
                          ? "High Risk"
                          : cat.toLowerCase().includes("mid")
                            ? "Moderate Risk"
                            : "Lower Risk"}
                      </span>
                      <button className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                        Invest via Groww <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {funds.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>No funds match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
