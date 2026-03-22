// ═══════════════════════════════════════════════════════════════════
// COMPARE PAGE — /dashboard/compare
// ═══════════════════════════════════════════════════════════════════
"use client";

import { useState } from "react";
import { Search, X, Plus, ChevronDown, BarChart3 } from "lucide-react";
import { creditCards, calculateInDepthSavings } from "@/lib/credit-cards-data";
import { cn } from "@/lib/utils";

const SAMPLE_SPEND = {
  food: 8000,
  shopping: 12000,
  travel: 5000,
  utilities: 3000,
  fuel: 2000,
  rent: 0,
  other: 4000,
  grocery: 4000,
};

const COMPARE_ROWS = [
  {
    label: "Annual Fee",
    key: "annualFee",
    format: (v: any) => (v === 0 ? "Free" : `₹${Number(v).toLocaleString()}`),
  },
  {
    label: "Base Reward Rate",
    key: "baseRewardRate",
    format: (v: any) => `${v}%`,
  },
  { label: "Effective Rate", key: "_eff", format: (v: any) => `${v}%` },
  {
    label: "Net Value/yr",
    key: "_net",
    format: (v: any) => `₹${Number(v).toLocaleString()}`,
  },
  {
    label: "Domestic Lounge",
    key: "domesticLounge",
    format: (v: any) => String(v),
  },
  {
    label: "Intl Lounge",
    key: "internationalLounge",
    format: (v: any) => String(v),
  },
  { label: "Forex Markup", key: "forexMarkup", format: (v: any) => `${v}%` },
  { label: "Food/Dining Rate", key: "_food", format: (v: any) => `${v}%` },
  { label: "Amazon Rate", key: "amazonRate", format: (v: any) => `${v}%` },
  { label: "Flight Rate", key: "flightRate", format: (v: any) => `${v}%` },
  { label: "Fuel Rate", key: "fuelRewardRate", format: (v: any) => `${v}%` },
  { label: "Reward Unit", key: "rewardUnit", format: (v: any) => String(v) },
  { label: "Point Value", key: "pointValue", format: (v: any) => `₹${v}` },
  {
    label: "Fee Waiver",
    key: "retentionSpendDisplay",
    format: (v: any) => String(v) || "—",
  },
];

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(["1", "5"]);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const allCards = creditCards as any[];
  const selected = selectedIds
    .map((id) => allCards.find((c) => c.id === id))
    .filter(Boolean);

  const getVal = (card: any, key: string) => {
    if (key === "_eff") {
      const audit = calculateInDepthSavings(card, SAMPLE_SPEND);
      return audit.effectiveRewardRate;
    }
    if (key === "_net") {
      const audit = calculateInDepthSavings(card, SAMPLE_SPEND);
      return audit.netValue;
    }
    if (key === "_food") {
      return Math.max(
        card.swiggyRate || 0,
        card.zomatoRate || 0,
        card.diningRate || 0,
        card.baseRewardRate || 0,
      );
    }
    return card[key];
  };

  const isBest = (row: (typeof COMPARE_ROWS)[0], cardIdx: number) => {
    if (selected.length < 2) return false;
    const vals = selected.map(
      (c) => parseFloat(String(getVal(c, row.key))) || 0,
    );
    const best =
      row.key === "annualFee" || row.key === "forexMarkup"
        ? Math.min(...vals)
        : Math.max(...vals);
    return vals[cardIdx] === best && best > 0;
  };

  const searchResults = allCards
    .filter(
      (c) =>
        !selectedIds.includes(c.id) &&
        (c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.bank.toLowerCase().includes(search.toLowerCase())),
    )
    .slice(0, 8);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Compare Cards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select up to 3 cards to compare
          </p>
        </div>
        {selected.length < 3 && (
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/25 transition-all"
          >
            <Plus className="w-4 h-4" /> Add card
          </button>
        )}
      </div>

      {/* Card picker */}
      {showPicker && (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search to add a card…"
              className="w-full pl-9 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-amber-400/50"
            />
          </div>
          {searchResults.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedIds((p) => [...p, c.id]);
                setSearch("");
                setShowPicker(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left transition-all"
            >
              <div
                className={cn(
                  "w-8 h-6 rounded shrink-0 bg-gradient-to-br",
                  c.imageGradient || "from-zinc-700 to-zinc-900",
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.bank}</p>
              </div>
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {/* Selected card headers */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `180px repeat(${selected.length}, 1fr)` }}
      >
        <div />
        {selected.map((card) => (
          <div
            key={card.id}
            className={cn(
              "rounded-xl p-3 text-center relative bg-gradient-to-br",
              card.imageGradient || "from-zinc-800 to-zinc-950",
            )}
          >
            <button
              onClick={() =>
                setSelectedIds((p) => p.filter((id) => id !== card.id))
              }
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-all"
            >
              <X className="w-3 h-3 text-white" />
            </button>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">
              {card.bank}
            </p>
            <p className="text-xs font-bold text-white mt-0.5 leading-snug">
              {card.name}
            </p>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="rounded-2xl border border-white/8 overflow-hidden">
        {COMPARE_ROWS.map((row, ri) => (
          <div
            key={row.label}
            className={cn(
              "grid items-center",
              ri % 2 === 0 ? "bg-white/2" : "bg-transparent",
            )}
            style={{
              gridTemplateColumns: `180px repeat(${selected.length}, 1fr)`,
            }}
          >
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground">{row.label}</p>
            </div>
            {selected.map((card, ci) => {
              const raw = getVal(card, row.key);
              const formatted = row.format(raw);
              const best = isBest(row, ci);
              return (
                <div key={card.id} className="px-3 py-3 text-center">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      best ? "text-amber-400" : "text-foreground",
                    )}
                  >
                    {formatted}
                    {best && (
                      <span className="ml-1 text-[9px] text-amber-400">★</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selected.length >= 2 && (
        <p className="text-xs text-muted-foreground text-center">
          ★ = best value for this metric · Spend profile: ₹
          {Object.values(SAMPLE_SPEND)
            .reduce((a, b) => a + b, 0)
            .toLocaleString()}
          /mo
        </p>
      )}

      {selected.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Select at least 2 cards to compare</p>
        </div>
      )}
    </div>
  );
}
