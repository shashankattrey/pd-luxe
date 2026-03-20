"use client";

import { useState } from "react";
import {
  CreditCard,
  TrendingUp,
  Wallet,
  Bell,
  ArrowRight,
  Plus,
  ChevronRight,
  Sparkles,
  Trophy,
  RefreshCcw,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { creditCards, calculateInDepthSavings } from "@/lib/credit-cards-data";
import { cn } from "@/lib/utils";

// ─── Mock user-owned cards & investments (would come from UserContext/API) ────
// In production these come from user's saved profile.
const MY_CARD_IDS = ["1", "5", "12"]; // HDFC Infinia, Axis Magnus, HDFC Regalia Gold
const MY_CARDS = (creditCards as any[]).filter((c) =>
  MY_CARD_IDS.includes(c.id),
);

const MY_SIPS = [
  {
    name: "Mirae Asset Large Cap",
    sip: 5000,
    cagr: 16.2,
    value: 67400,
    category: "Large Cap",
  },
  {
    name: "Parag Parikh Flexi Cap",
    sip: 3000,
    cagr: 18.4,
    value: 39200,
    category: "Flexi Cap",
  },
  {
    name: "Axis Small Cap",
    sip: 2000,
    cagr: 22.1,
    value: 28600,
    category: "Small Cap",
  },
];

const SAMPLE_SPEND = {
  food: 8000,
  shopping: 12000,
  travel: 5000,
  utilities: 3000,
  fuel: 2000,
  rent: 0,
  other: 4000,
};

export default function MyMoneyPage() {
  const [activeTab, setActiveTab] = useState<"cards" | "wealth">("cards");

  const totalSip = MY_SIPS.reduce((s, f) => s + f.sip, 0);
  const totalPortfolio = MY_SIPS.reduce((s, f) => s + f.value, 0);
  const totalMonthlyRewards = MY_CARDS.reduce((s: number, c: any) => {
    const audit = calculateInDepthSavings(c, SAMPLE_SPEND);
    return s + Math.round(audit.grossRewards / 12);
  }, 0);

  const upcomingRenewals = MY_CARDS.filter((c: any) => c.annualFee > 0).map(
    (c: any) => ({ name: c.name, fee: c.annualFee, month: "March 2026" }),
  );

  const devalCards = MY_CARDS.filter((c: any) =>
    c.notesTnc?.toLowerCase().includes("devaluation"),
  );

  const hasNoCards = MY_CARDS.length === 0;
  const hasNoSips = MY_SIPS.length === 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          My Money
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your personal financial snapshot
        </p>
      </div>

      {/* ── TOP STATS ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={CreditCard}
          label="My Cards"
          value={String(MY_CARDS.length)}
          sub="in wallet"
          color="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Portfolio"
          value={`₹${(totalPortfolio / 1000).toFixed(0)}k`}
          sub="invested"
          color="emerald"
        />
        <StatCard
          icon={Wallet}
          label="Rewards"
          value={`₹${totalMonthlyRewards.toLocaleString()}`}
          sub="est./month"
          color="blue"
        />
      </div>

      {/* ── ALERTS ── */}
      {(devalCards.length > 0 || upcomingRenewals.length > 0) && (
        <div className="space-y-2">
          {devalCards.map((c: any) => (
            <div
              key={c.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20"
            >
              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
              <p className="text-xs text-orange-300 flex-1">
                <strong>{c.name}</strong> — policy change in 2026
              </p>
              <Link href="/dashboard/alerts">
                <ChevronRight className="w-4 h-4 text-orange-400" />
              </Link>
            </div>
          ))}
          {upcomingRenewals.slice(0, 1).map((r) => (
            <div
              key={r.name}
              className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"
            >
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-xs text-blue-300 flex-1">
                <strong>{r.name}</strong> renewal ₹{r.fee.toLocaleString()} due{" "}
                {r.month}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── TABS ── */}
      <div className="flex bg-white/5 rounded-xl p-1">
        {(["cards", "wealth"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-amber-500 text-black"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "cards" ? "💳 My Cards" : "📈 My SIPs"}
          </button>
        ))}
      </div>

      {/* ── CARDS TAB ── */}
      {activeTab === "cards" && (
        <div className="space-y-3">
          {hasNoCards ? (
            <EmptyState
              icon={CreditCard}
              title="No cards added yet"
              desc="Get personalised card recommendations from the AI Advisor"
              cta="Find My Cards"
              href="/dashboard/advisor"
            />
          ) : (
            <>
              {MY_CARDS.map((card: any) => {
                const audit = calculateInDepthSavings(card, SAMPLE_SPEND);
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl overflow-hidden border border-white/8"
                  >
                    {/* Card visual header */}
                    <div
                      className={cn(
                        "p-4 bg-gradient-to-br",
                        card.imageGradient || "from-zinc-800 to-zinc-950",
                      )}
                    >
                      <p className="text-[10px] text-white/50 uppercase tracking-widest">
                        {card.bank}
                      </p>
                      <p className="font-serif font-bold text-white text-base mt-0.5">
                        {card.name}
                      </p>
                      <div className="flex gap-2 mt-3">
                        {card.tags?.slice(0, 3).map((t: string) => (
                          <span
                            key={t}
                            className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-white/60"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Metrics */}
                    <div className="p-4 bg-black/20 grid grid-cols-4 gap-2">
                      <MiniStat
                        label="Net/yr"
                        value={`₹${audit.netValue.toLocaleString()}`}
                        color="text-green-400"
                      />
                      <MiniStat
                        label="Rewards"
                        value={`${audit.effectiveRewardRate}%`}
                        color="text-amber-400"
                      />
                      <MiniStat
                        label="Lounge"
                        value={String(card.domesticLounge)}
                        color="text-blue-400"
                      />
                      <MiniStat
                        label="Forex"
                        value={`${card.forexMarkup}%`}
                        color="text-purple-400"
                      />
                    </div>
                    {/* How to maximise */}
                    <div className="px-4 pb-4">
                      <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                        <p className="text-[10px] text-amber-400 font-bold uppercase mb-1">
                          💡 Maximise Rewards
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {card.amazonRate > card.baseRewardRate
                            ? `Use for Amazon (${card.amazonRate}%) & ${card.swiggyRate > card.baseRewardRate ? `Swiggy (${card.swiggyRate}%)` : "general spend"}.`
                            : `Best for general spend at ${card.baseRewardRate}% base rate.`}
                          {card.multiplierChannel !== "Direct Spends" &&
                            ` Book via ${card.multiplierChannel} for ${card.flightRate}% on flights.`}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Add card CTA */}
              <Link href="/dashboard/advisor">
                <button className="w-full py-3 rounded-xl border border-dashed border-white/15 text-sm text-muted-foreground hover:border-amber-400/30 hover:text-amber-400 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add another card
                </button>
              </Link>
            </>
          )}
        </div>
      )}

      {/* ── WEALTH TAB ── */}
      {activeTab === "wealth" && (
        <div className="space-y-4">
          {hasNoSips ? (
            <EmptyState
              icon={TrendingUp}
              title="No SIPs set up"
              desc="Build a personalised SIP plan with the Wealth Advisor"
              cta="Build Wealth Plan"
              href="/dashboard/wealth-advisor"
            />
          ) : (
            <>
              {/* Portfolio summary */}
              <div className="p-5 rounded-2xl bg-emerald-500/8 border border-emerald-500/20">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                      Total Portfolio
                    </p>
                    <p className="font-serif text-3xl font-bold text-foreground mt-1">
                      ₹{totalPortfolio.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Monthly SIP</p>
                    <p className="text-xl font-bold text-emerald-400">
                      ₹{totalSip.toLocaleString()}
                    </p>
                  </div>
                </div>
                {/* Allocation bar */}
                <div className="flex h-2 rounded-full overflow-hidden mt-4 gap-0.5">
                  {MY_SIPS.map((f, i) => (
                    <div
                      key={i}
                      className="rounded-sm"
                      style={{
                        flex: f.sip / totalSip,
                        background: ["#10b981", "#3b82f6", "#8b5cf6"][i],
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-3 mt-2">
                  {MY_SIPS.map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-muted-foreground flex items-center gap-1"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: ["#10b981", "#3b82f6", "#8b5cf6"][i],
                        }}
                      />
                      {f.category}
                    </span>
                  ))}
                </div>
              </div>

              {/* SIP list */}
              {MY_SIPS.map((fund, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/3 border border-white/8"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {fund.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fund.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">
                      {fund.cagr}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ₹{fund.sip.toLocaleString()}/mo
                    </p>
                  </div>
                </div>
              ))}

              <Link href="/dashboard/wealth-advisor">
                <button className="w-full py-3 rounded-xl border border-dashed border-white/15 text-sm text-muted-foreground hover:border-emerald-400/30 hover:text-emerald-400 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Rebalance portfolio
                </button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: "amber" | "emerald" | "blue";
}) {
  const bg = {
    amber: "bg-amber-400/10 text-amber-400",
    emerald: "bg-emerald-400/10 text-emerald-400",
    blue: "bg-blue-400/10 text-blue-400",
  }[color];
  const val = {
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    blue: "text-blue-400",
  }[color];
  return (
    <div className="p-4 rounded-2xl bg-white/3 border border-white/8 text-center">
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2",
          bg,
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <p className={cn("font-bold text-lg", val)}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      <p className="text-[9px] text-muted-foreground/60">{sub}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className={cn("text-sm font-bold", color)}>{value}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  desc,
  cta,
  href,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="text-center py-12 space-y-3">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
        <Icon className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">{desc}</p>
      <Link href={href}>
        <button className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all">
          <Sparkles className="w-4 h-4" /> {cta}
        </button>
      </Link>
    </div>
  );
}
