"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCcw,
  Zap,
  TrendingUp,
  Repeat,
  Target,
  Database,
} from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  PROFILE_QUESTIONS,
  TOTAL_STEPS,
  DEFAULT_PROFILE,
  generatePreciseRecommendations,
  generatePlanSummary,
  type FinancialProfile,
  type RecommendationPriority,
  type PlanSummary,
} from "@/lib/smart-engine";
import InvestmentReport from "../../../components/InvestmentReport";
import {
  LiveRates,
  useFundData,
  type FundData,
  type LiveRates as HookLiveRates,
} from "@/hooks/useFundData";
import { cn } from "@/lib/utils";

// ─── Design tokens ────────────────────────────────────────────────────────────

const PRIORITY: Record<
  RecommendationPriority,
  { color: string; label: string; lc: string; glow: string }
> = {
  critical: {
    color: "#ef4444",
    label: "Do First",
    lc: "text-red-400",
    glow: "rgba(239,68,68,0.10)",
  },
  high: {
    color: "#f59e0b",
    label: "High",
    lc: "text-amber-400",
    glow: "rgba(245,158,11,0.08)",
  },
  medium: {
    color: "#3b82f6",
    label: "Medium",
    lc: "text-blue-400",
    glow: "rgba(59,130,246,0.06)",
  },
  optional: {
    color: "#ffffff",
    label: "Optional",
    lc: "text-muted-foreground",
    glow: "transparent",
  },
};

const INV_TYPE: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  sip: {
    label: "SIP",
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    icon: Repeat,
  },
  "lump-sum": {
    label: "Lump Sum",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    icon: Zap,
  },
  both: {
    label: "SIP + Lump",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    icon: TrendingUp,
  },
  "one-time-then-sip": {
    label: "Lump→SIP",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    icon: ArrowRight,
  },
};

const CAT_LABELS: Record<string, string> = {
  protection: "🛡️ Protection",
  emergency: "💵 Emergency",
  debt: "🔴 Debt",
  tax: "💰 Tax",
  goal: "🎯 Goal",
  wealth: "📈 Wealth",
  parallel: "⚡ Parallel",
  rebalance: "🔄 Rebalance",
};

const BUCKETS: Record<string, { bucket: string; purpose: string }[]> = {
  wealth: [
    { bucket: "largeCap", purpose: "Core" },
    { bucket: "flexiCap", purpose: "Growth" },
    { bucket: "midCap", purpose: "Satellite" },
  ],
  goal: [
    { bucket: "flexiCap", purpose: "Primary" },
    { bucket: "largeCap", purpose: "Anchor" },
  ],
  parallel: [
    { bucket: "elss", purpose: "ELSS/80C" },
    { bucket: "index", purpose: "Index" },
  ],
  rebalance: [
    { bucket: "index", purpose: "Index" },
    { bucket: "debtShort", purpose: "Debt" },
  ],
  emergency: [
    { bucket: "liquid", purpose: "Liquid" },
    { bucket: "debtShort", purpose: "Short-Dur" },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtC = (v: number) =>
  v >= 10_000_000
    ? `₹${(v / 10_000_000).toFixed(1)}Cr`
    : v >= 100_000
      ? `₹${(v / 100_000).toFixed(0)}L`
      : v >= 1_000
        ? `₹${(v / 1_000).toFixed(0)}k`
        : `₹${v}`;
const fmtN = (v: number, dec = 0) =>
  v.toLocaleString("en-IN", { maximumFractionDigits: dec });

function cleanName(s: string) {
  return s
    .replace(/ - (Growth|Direct|Regular|Plan|Option).*$/i, "")
    .replace(/\s*(Direct Growth|Direct Plan|Direct)\s*$/i, "")
    .trim();
}
function bestRet(f: FundData): { v: number | null; label: string } {
  if (f.returns.threeYear != null)
    return { v: f.returns.threeYear, label: "3Y" };
  if (f.returns.oneYear != null) return { v: f.returns.oneYear, label: "1Y" };
  return { v: null, label: "—" };
}

// ─── Rate Ticker — dual-mode ──────────────────────────────────────────────────

function RateTicker({
  rates,
  funds,
  loading,
}: {
  rates: HookLiveRates | null;
  funds: Record<string, FundData[]>;
  loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf: number,
      pos = 0;
    const speed = 0.35;
    const go = () => {
      pos += speed;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      raf = requestAnimationFrame(go);
    };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => {
      if (el.scrollWidth > el.clientWidth + 10) {
        raf = requestAnimationFrame(go);
      }
    };
    el.addEventListener("mouseenter", stop);
    el.addEventListener("mouseleave", start);
    start();
    return () => {
      stop();
      el.removeEventListener("mouseenter", stop);
      el.removeEventListener("mouseleave", start);
    };
  }, [rates]);

  const totalFunds = Object.values(funds).flat().length;

  if (loading && !rates)
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 mb-1">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/40 animate-pulse" />
          <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
            Loading live rates…
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="hidden sm:block h-5 rounded-lg bg-white/5 animate-pulse" />
      </div>
    );
  if (!rates) return null;

  const { govtSchemes, fixedIncome, gold, equity, alternativeInvestments } =
    rates;
  const bestFD = [...fixedIncome.fds].sort(
    (a, b) => b.rates.days365 - a.rates.days365,
  )[0];
  const niftyUp = equity.nifty50.changePct >= 0;

  const pills = [
    {
      label: "PPF",
      value: `${govtSchemes.ppf.rate}%`,
      color: "#f59e0b",
      group: "govt",
    },
    {
      label: "SSY",
      value: `${govtSchemes.ssy.rate}%`,
      color: "#10b981",
      group: "govt",
    },
    {
      label: "SCSS",
      value: `${govtSchemes.scss.rate}%`,
      color: "#3b82f6",
      group: "govt",
    },
    {
      label: "NSC",
      value: `${govtSchemes.nsc.rate}%`,
      color: "#f59e0b",
      group: "govt",
    },
    {
      label: "Best FD",
      value: `${(bestFD?.rates.days365 ?? 0).toFixed(1)}%`,
      color: "#06b6d4",
      group: "fi",
    },
    {
      label: "RBI Bonds",
      value: `${govtSchemes.rbiBonds.rate}%`,
      color: "#60a5fa",
      group: "fi",
    },
    {
      label: "Gold/g",
      value: `₹${fmtN(gold.price24k)}`,
      color: "#fbbf24",
      group: "alt",
    },
    {
      label: "SGB",
      value: `₹${fmtN(gold.sgb.lastIssuePrice)}`,
      color: "#fde68a",
      group: "alt",
    },
    {
      label: "NIFTY",
      value: `${fmtN(equity.nifty50.value, 0)} ${niftyUp ? "↑" : "↓"}${Math.abs(equity.nifty50.changePct).toFixed(1)}%`,
      color: niftyUp ? "#10b981" : "#ef4444",
      group: "eq",
    },
    {
      label: "VIX",
      value: `${equity.indiaVix ?? 14}`,
      color: "#a78bfa",
      group: "eq",
    },
    {
      label: "P2P",
      value: `${alternativeInvestments.p2p[0]?.expectedReturn ?? 10}%+`,
      color: "#f472b6",
      group: "alt",
    },
    {
      label: "POMIS",
      value: `${govtSchemes.pomis?.rate ?? 7.4}%`,
      color: "#c4b5fd",
      group: "govt",
    },
  ];

  const StatusPill = () => (
    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      {totalFunds > 0 ? `${totalFunds} funds` : "DB"} · live
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden mb-1">
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">
          <Database className="w-2.5 h-2.5" />
          Live Rates
        </span>
        <StatusPill />
      </div>
      {/* Mobile: 2-col pill grid */}
      <div className="sm:hidden px-2 pb-2.5 grid grid-cols-2 gap-1.5">
        {pills.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/[0.07]"
            style={{ background: `${p.color}08` }}
          >
            <span className="text-[10px] text-white/40 font-medium">
              {p.label}
            </span>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: p.color }}
            >
              {p.value}
            </span>
          </div>
        ))}
      </div>
      {/* Desktop: auto-scroll marquee */}
      <div className="hidden sm:block relative pb-2.5">
        <div
          className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right,var(--background,#0a0a0a),transparent)",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to left,var(--background,#0a0a0a),transparent)",
          }}
        />
        <div ref={scrollRef} className="flex overflow-x-hidden select-none">
          {[...pills, ...pills].map((p, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 shrink-0 px-4 py-1.5 border-r border-white/[0.05] last:border-0 whitespace-nowrap"
            >
              <span className="text-[10px] text-white/30">{p.label}</span>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ color: p.color }}
              >
                {p.value}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Goal Progress Card ───────────────────────────────────────────────────────

function GoalProgressCard({ summary }: { summary: PlanSummary }) {
  const [showAlts, setShowAlts] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const inView = useInView(barRef, { once: true });
  const f = summary.feasibility;
  const pct = Math.min(100, f.achievablePct);

  const STATUS = {
    achievable: {
      color: "#10b981",
      tw: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      glow: "rgba(16,185,129,0.12)",
      icon: "✅",
      label: "On Track",
    },
    close: {
      color: "#3b82f6",
      tw: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/25",
      glow: "rgba(59,130,246,0.10)",
      icon: "🔵",
      label: "Nearly There",
    },
    stretch: {
      color: "#f59e0b",
      tw: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-400/25",
      glow: "rgba(245,158,11,0.12)",
      icon: "⚠️",
      label: "Stretch Goal",
    },
    impossible: {
      color: "#ef4444",
      tw: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/25",
      glow: "rgba(239,68,68,0.12)",
      icon: "🔴",
      label: "Needs Revision",
    },
  } as const;
  const s = STATUS[f.status];

  const realCorpus =
    (summary as any).realProjectedCorpus ??
    Math.round(summary.projectedCorpus * 0.65);
  const blendedCagr = (summary as any).blendedCagr ?? "12";

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: `${s.color}30`,
        boxShadow: `0 0 32px ${s.glow}, inset 0 0 0 1px ${s.color}15`,
      }}
    >
      {/* Colored top strip */}
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg,${s.color},${s.color}44,transparent)`,
        }}
      />

      <div
        className="p-5"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%,${s.glow},transparent 70%)`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Target className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.18em]">
                Goal Projection
              </span>
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  color: s.color,
                  borderColor: `${s.color}40`,
                  background: `${s.color}15`,
                }}
              >
                {s.icon} {s.label}
              </span>
            </div>
            <p className="font-serif text-lg font-bold text-foreground tracking-tight">
              {summary.goalName}
            </p>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">
              {fmtC(summary.goalTarget)} by {summary.targetYear} ·{" "}
              {summary.goalYears}yr · {blendedCagr}% CAGR
            </p>
          </div>
          {/* Big % */}
          <div className="text-right shrink-0">
            <p
              className="text-4xl font-bold tabular-nums tracking-tight"
              style={{ color: s.color }}
            >
              {pct}%
            </p>
            <p className="text-[9px] text-muted-foreground/40 mt-0.5">
              of target
            </p>
          </div>
        </div>

        {/* Animated gradient progress bar */}
        <div ref={barRef} className="space-y-1.5 mb-4">
          <div className="h-2.5 rounded-full bg-white/[0.07] overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: inView ? `${pct}%` : 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full relative"
              style={{
                background: `linear-gradient(90deg,${s.color}88,${s.color})`,
              }}
            >
              {/* Trailing glow */}
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full blur-sm"
                style={{ background: s.color, opacity: 0.8 }}
              />
            </motion.div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground/40">
            <span>₹0</span>
            <span className="font-medium" style={{ color: s.color }}>
              Projected: {fmtC(summary.projectedCorpus)}
            </span>
            <span>Target: {fmtC(summary.goalTarget)}</span>
          </div>
        </div>

        {/* Corpus — single clean row, not a cramped grid */}
        <div className="flex items-stretch gap-0 mb-4 rounded-xl overflow-hidden border border-white/[0.07]">
          <div className="flex-1 p-3 bg-white/[0.025]">
            <p className="text-[9px] text-muted-foreground/40 mb-1">Nominal</p>
            <p className="text-base font-bold tabular-nums">
              {fmtC(summary.projectedCorpus)}
            </p>
          </div>
          <div className="w-px bg-white/[0.06]" />
          <div
            className="flex-1 p-3"
            style={{ background: "rgba(245,158,11,0.06)" }}
          >
            <p className="text-[9px] text-amber-400/60 mb-1">Real ₹ today</p>
            <p className="text-base font-bold text-amber-400 tabular-nums">
              {fmtC(realCorpus)}
            </p>
          </div>
          {summary.projectedFromSip > 0 && (
            <>
              <div className="w-px bg-white/[0.06]" />
              <div
                className="flex-1 p-3"
                style={{ background: "rgba(139,92,246,0.06)" }}
              >
                <p className="text-[9px] text-violet-400/60 mb-1">From SIPs</p>
                <p className="text-base font-bold text-violet-400 tabular-nums">
                  {fmtC(summary.projectedFromSip)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Step-up bonus */}
        {summary.goalYears >= 3 &&
          summary.sipStepupCorpus > summary.projectedCorpus * 1.08 && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl mb-4 border border-violet-500/20"
              style={{ background: "rgba(139,92,246,0.08)" }}
            >
              <TrendingUp className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <p className="text-xs text-violet-300 leading-relaxed">
                <strong>10% annual step-up</strong> grows to{" "}
                <strong>{fmtC(summary.sipStepupCorpus)}</strong> —{" "}
                {fmtC(summary.sipStepupCorpus - summary.projectedCorpus)} extra
              </p>
            </div>
          )}

        {/* Verdict */}
        <div
          className="p-3 rounded-xl border text-xs leading-relaxed mb-3"
          style={{ borderColor: `${s.color}25`, background: `${s.color}08` }}
        >
          <p className="font-bold mb-1" style={{ color: s.color }}>
            {s.icon}{" "}
            {f.status === "achievable"
              ? "You're on track"
              : f.status === "close"
                ? "Almost there"
                : f.status === "stretch"
                  ? "Achievable with adjustments"
                  : "Goal needs revision"}
          </p>
          <p className="text-muted-foreground/70 leading-relaxed">
            {f.status === "achievable"
              ? `Projects ${fmtC(f.projectedCorpus)} by ${summary.targetYear} — ${fmtC(f.projectedCorpus - summary.goalTarget)} above target.`
              : f.status === "close"
                ? `Reaches ${fmtC(f.projectedCorpus)} — ${fmtC(f.shortfall)} short. Increase SIP by ${fmtC(Math.round(f.shortfall / (summary.goalYears * 12)))}/mo.`
                : f.status === "stretch"
                  ? `Current: ${fmtC(f.projectedCorpus)} (${pct}%). Need ${fmtC(f.requiredSipMonthly)}/mo or ${Math.ceil(f.yearsAtCurrentSip)}yr.`
                  : `${fmtC(summary.goalTarget)} needs ${fmtC(f.requiredSipMonthly)}/mo — surplus covers ${fmtC(summary.totalMonthlySip)}.`}
          </p>
        </div>

        {f.riskWarning && (
          <div className="flex gap-2 p-3 rounded-xl mb-3 border border-orange-500/20 bg-orange-500/8 text-xs text-orange-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {f.riskWarning}
          </div>
        )}

        {f.altScenarios.length > 0 && (
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAlts((v) => !v);
              }}
              className="flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-foreground w-full py-1 transition-colors"
            >
              <span className="text-[10px]">{showAlts ? "▲" : "▼"}</span>
              {showAlts ? "Hide" : "Show"} {f.altScenarios.length} path
              {f.altScenarios.length > 1 ? "s" : ""} to reach your goal
            </button>
            <AnimatePresence>
              {showAlts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-2">
                    {f.altScenarios.map((alt: any, i: number) => (
                      <div
                        key={i}
                        className="flex gap-3 p-3 rounded-xl border border-white/[0.07]"
                        style={{ background: "rgba(255,255,255,0.025)" }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                          style={{
                            background: "rgba(245,158,11,0.15)",
                            color: "#f59e0b",
                            border: "1px solid rgba(245,158,11,0.25)",
                          }}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground/90">
                            {alt.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {alt.description}
                          </p>
                          <p className="text-[10px] text-amber-400 mt-1 font-semibold">
                            → {alt.action}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  color,
  sub,
  icon,
  hero,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
  icon?: string;
  hero?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/[0.07] overflow-hidden",
        hero ? "p-5" : "p-3.5 text-center",
      )}
      style={{ background: `linear-gradient(135deg,${color}10,${color}03)` }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
        style={{ background: color }}
      />
      {icon && (
        <div
          className={cn(
            "absolute text-4xl opacity-[0.07] select-none",
            hero ? "right-4 top-4" : "right-2 top-1/2 -translate-y-1/2",
          )}
        >
          {icon}
        </div>
      )}
      {hero ? (
        <>
          <p className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.15em] mb-2">
            {label}
          </p>
          <p
            className="text-3xl font-bold tabular-nums tracking-tight"
            style={{ color }}
          >
            {value}
          </p>
          {sub && (
            <p className="text-[10px] text-muted-foreground/40 mt-1">{sub}</p>
          )}
        </>
      ) : (
        <>
          <p className="text-xl font-bold tabular-nums" style={{ color }}>
            {value}
          </p>
          <p className="text-[9px] text-muted-foreground/50 mt-0.5">{label}</p>
          {sub && <p className="text-[9px] text-muted-foreground/30">{sub}</p>}
        </>
      )}
    </div>
  );
}

// ─── Live Fund Panel ──────────────────────────────────────────────────────────

function LiveFundPanel({
  recCategory,
  funds,
  loading,
}: {
  recCategory: string;
  funds: Record<string, FundData[]>;
  loading: boolean;
}) {
  const slots = BUCKETS[recCategory] ?? [];
  if (!slots.length) return null;
  const matched = slots
    .map((slot) => {
      const bucket = funds[slot.bucket] ?? [];
      const sorted = [...bucket].sort(
        (a, b) =>
          (b.returns.threeYear ?? b.returns.oneYear ?? -999) -
          (a.returns.threeYear ?? a.returns.oneYear ?? -999),
      );
      return sorted[0] ? { fund: sorted[0], purpose: slot.purpose } : null;
    })
    .filter(Boolean) as { fund: FundData; purpose: string }[];
  if (loading)
    return (
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-400 flex items-center gap-1.5 mb-2">
          <Database className="w-3 h-3" /> Live fund picks · loading…
        </p>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-11 rounded-xl bg-white/5 animate-pulse mb-1.5"
          />
        ))}
      </div>
    );
  if (!matched.length) return null;
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-400 flex items-center gap-1.5 mb-2">
        <Database className="w-3 h-3" /> Live fund picks · by 3Y CAGR
      </p>
      <div className="space-y-1.5">
        {matched.map(({ fund, purpose }, idx) => {
          const ret = bestRet(fund);
          const up = (ret.v ?? 0) >= 0;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-white/[0.07]"
              style={{
                background:
                  "linear-gradient(135deg,rgba(16,185,129,0.06),transparent)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                style={{
                  background: "rgba(16,185,129,0.15)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.25)",
                }}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground/90 truncate leading-tight">
                  {cleanName(fund.schemeName)}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {fund.amcName && (
                    <span className="text-[9px] text-white/25">
                      {fund.amcName}
                    </span>
                  )}
                  <span className="text-[9px] px-1.5 py-px rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {purpose}
                  </span>
                  {fund.nav > 0 && (
                    <span className="text-[9px] text-white/20">
                      NAV ₹{fund.nav}
                    </span>
                  )}
                </div>
              </div>
              {ret.v != null && (
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      up ? "text-emerald-400" : "text-red-400",
                    )}
                  >
                    <span className="text-[10px]">{up ? "▲" : "▼"}</span>
                    {Math.abs(ret.v).toFixed(1)}%
                  </p>
                  <p className="text-[9px] text-white/25">{ret.label}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WealthAdvisorPage() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<FinancialProfile>(DEFAULT_PROFILE);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "report">("cards");

  const { funds, allFunds, rates, loading, ratesLoading } = useFundData();

  const engineRates = useMemo(() => {
    if (!rates) return undefined;
    return {
      govtSchemes: {
        ppf: { rate: rates.govtSchemes.ppf.rate },
        ssy: { rate: rates.govtSchemes.ssy.rate },
        scss: { rate: rates.govtSchemes.scss.rate },
        nsc: { rate: rates.govtSchemes.nsc.rate },
        pomis: { rate: rates.govtSchemes.pomis?.rate ?? 7.4 },
        rbiBonds: { rate: rates.govtSchemes.rbiBonds.rate },
      },
      fixedIncome: {
        fds: rates.fixedIncome.fds.map((fd) => ({
          rates: {
            days365: fd.rates.days365,
            days730: fd.rates.days730,
            days1095: fd.rates.days1095,
          },
        })),
      },
      gold: {
        price24k: rates.gold.price24k,
        sgb: { lastIssuePrice: rates.gold.sgb.lastIssuePrice },
      },
    };
  }, [rates]);

  const recommendations = useMemo(() => {
    if (step <= TOTAL_STEPS || !engineRates) return [];

    // Sanitize engineRates to match the LiveRates interface exactly
    const sanitizedRates = {
      ...engineRates,
      fixedIncome: {
        ...engineRates.fixedIncome,
        fds: engineRates.fixedIncome.fds.map((fd: any) => ({
          ...fd,
          // Map 'name' to the required 'bank' property for the engine
          bank: fd.bank || fd.name || "Standard Bank",
        })),
      },
    } as LiveRates; // Cast to the expected interface

    return generatePreciseRecommendations(profile, sanitizedRates);
  }, [step, profile, engineRates]);
  const summary = useMemo(
    () =>
      recommendations.length > 0
        ? generatePlanSummary(profile, recommendations)
        : null,
    [recommendations, profile],
  );
  const updateField = useCallback(
    (id: string, value: unknown) => setProfile((p) => ({ ...p, [id]: value })),
    [],
  );
  const questionsForStep = PROFILE_QUESTIONS.filter((q) => q.step === step);
  const surplus = Math.max(
    0,
    profile.monthlyIncome -
      profile.monthlyExpenses -
      profile.monthlyEmi -
      profile.monthlyRent,
  );
  const liquidFund = useMemo(() => {
    const liq = allFunds
      .filter((f) =>
        /(liquid|overnight|ultra.short|low.duration|money.market)/i.test(
          f.schemeName,
        ),
      )
      .sort((a, b) => (b.returns.oneYear ?? 0) - (a.returns.oneYear ?? 0));
    return liq[0] ?? null;
  }, [allFunds]);

  // ─── LANDING ────────────────────────────────────────────────────────────────
  if (step === 0)
    return (
      <div className="w-full max-w-lg mx-auto space-y-5 relative">
        {/* Ambient glows */}
        <div
          className="pointer-events-none fixed inset-0 overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute -top-48 -right-48 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "rgba(245,158,11,0.04)" }}
          />
          <div
            className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "rgba(16,185,129,0.03)" }}
          />
        </div>

        <RateTicker rates={rates} funds={funds} loading={ratesLoading} />

        {/* Hero headline */}
        <div className="relative">
          {/* Abstract background decoration */}
          <svg
            className="absolute -right-4 -top-8 w-48 h-48 opacity-[0.04] pointer-events-none"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 160 L60 100 L100 130 L140 60 L180 80"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M20 180 L60 130 L100 150 L140 90 L180 100"
              fill="none"
              stroke="#10b981"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.5"
            />
            {[60, 100, 140].map((x) => (
              <circle
                key={x}
                cx={x}
                cy={x === 60 ? 100 : x === 100 ? 130 : 60}
                r="4"
                fill="#f59e0b"
                opacity="0.6"
              />
            ))}
          </svg>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
              style={{ boxShadow: "0 0 6px #f59e0b" }}
            />
            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.2em]">
              AI · Precise · Live Rates
            </p>
            {rates && (
              <span className="flex items-center gap-1 text-[9px] text-emerald-400/70 border border-emerald-500/20 px-2 py-0.5 rounded-full bg-emerald-500/5">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                live
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight">
            Exact SIP &amp; Lump Sum
            <br />
            <span style={{ color: "#f59e0b" }}>Plan for You</span>
          </h1>
          <p className="text-sm text-muted-foreground/55 mt-3 leading-relaxed max-w-xs">
            Exact instruments, live rates, honest goal feasibility — not generic
            advice.
          </p>
        </div>

        {/* 2 hero features + 3 compact pills */}
        <div className="space-y-3">
          {/* Hero pair */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                icon: "🎯",
                t: "Goal feasibility + inflation",
                d: "Nominal AND real corpus. 4 concrete alternatives if unreachable.",
                accent: "#f59e0b",
              },
              {
                icon: "📅",
                t: "Strict waterfall allocation",
                d: "Protection → Emergency → Debt → Tax → Goal.",
                accent: "#10b981",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-4 rounded-2xl border border-white/[0.07] relative overflow-hidden"
                style={{
                  background: `linear-gradient(145deg,${item.accent}10,${item.accent}03)`,
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{
                    background: `linear-gradient(90deg,${item.accent},transparent)`,
                  }}
                />
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <p className="text-xs font-bold text-foreground leading-tight">
                  {item.t}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-1 leading-relaxed">
                  {item.d}
                </p>
              </motion.div>
            ))}
          </div>
          {/* 3 compact feature pills */}
          <div className="flex gap-2 flex-wrap">
            {[
              { icon: "🔒", t: "Lock-in aware", color: "#3b82f6" },
              {
                icon: "🗄️",
                t: `${allFunds.length > 0 ? allFunds.length + "-fund " : ""}Live DB`,
                color: "#8b5cf6",
              },
              { icon: "🏦", t: "7 asset classes", color: "#06b6d4" },
            ].map((item, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.07] text-xs font-medium"
                style={{ background: `${item.color}08`, color: item.color }}
              >
                <span>{item.icon}</span>
                {item.t}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Premium CTA */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setStep(1)}
          className="w-full py-4 rounded-2xl text-black font-bold flex items-center justify-center gap-2 text-sm transition-all relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#f59e0b,#d97706)",
            boxShadow:
              "0 4px 24px rgba(245,158,11,0.3),0 1px 0 rgba(255,255,255,0.15) inset",
          }}
        >
          <Sparkles className="w-5 h-5" />
          &nbsp;Build My Precise Plan — 6 Steps
        </motion.button>
        <p className="text-center text-[10px] text-muted-foreground/40">
          ~3 minutes · data stays on device only
        </p>
      </div>
    );

  // ─── PROFILER ───────────────────────────────────────────────────────────────
  if (step >= 1 && step <= TOTAL_STEPS) {
    const stepLabels = [
      "",
      "Identity",
      "Income",
      "Obligations",
      "Current State",
      "Goals",
      "Risk",
    ];
    const stepColors = [
      "",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#06b6d4",
      "#ef4444",
    ];
    const stepColor = stepColors[step];
    return (
      <div className="w-full max-w-lg mx-auto space-y-6">
        <RateTicker rates={rates} funds={funds} loading={ratesLoading} />

        {/* Step header */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: stepColor,
                  boxShadow: `0 0 6px ${stepColor}`,
                }}
              />
              <p className="text-xs text-muted-foreground/60">
                Step {step}/{TOTAL_STEPS} —{" "}
                <span className="font-semibold" style={{ color: stepColor }}>
                  {stepLabels[step]}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {surplus > 0 && (
                <p className="text-[10px] text-muted-foreground/40 hidden sm:block">
                  Surplus: {fmtC(surplus)}/mo
                </p>
              )}
              <button
                onClick={() => setStep(0)}
                className="text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
          {/* Segmented progress bar */}
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full transition-all duration-500 overflow-hidden"
                style={{
                  background: i < step ? stepColor : "rgba(255,255,255,0.08)",
                }}
              >
                {i === step - 1 && (
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.4 }}
                    style={{ background: stepColor }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {questionsForStep.map((q) => {
              const value = profile[q.id as keyof FinancialProfile] as any;
              if (q.id === "lumpSumSource" && profile.availableLumpSum === 0)
                return null;

              if (q.type === "boolean")
                return (
                  <div key={q.id} className="space-y-4">
                    <div>
                      <p className="text-base font-semibold text-foreground leading-snug">
                        {q.question}
                      </p>
                      {q.subtext && (
                        <p className="text-xs text-muted-foreground/50 mt-1.5">
                          {q.subtext}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {q.options!.map((opt) => (
                        <button
                          key={String(opt.value)}
                          onClick={() => updateField(q.id, opt.value)}
                          className="p-4 rounded-2xl border text-sm font-medium transition-all relative overflow-hidden"
                          style={
                            value === opt.value
                              ? {
                                  borderColor: `${stepColor}50`,
                                  background: `${stepColor}12`,
                                  color: stepColor,
                                }
                              : {
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  background: "rgba(255,255,255,0.03)",
                                }
                          }
                        >
                          {value === opt.value && (
                            <div
                              className="absolute left-0 top-0 bottom-0 w-0.5"
                              style={{ background: stepColor }}
                            />
                          )}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );

              if (q.type === "select")
                return (
                  <div key={q.id} className="space-y-4">
                    <div>
                      <p className="text-base font-semibold text-foreground leading-snug">
                        {q.question}
                      </p>
                      {q.subtext && (
                        <p className="text-xs text-muted-foreground/50 mt-1.5">
                          {q.subtext}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      {q.options!.map((opt) => (
                        <button
                          key={String(opt.value)}
                          onClick={() => updateField(q.id, opt.value)}
                          className="w-full p-4 rounded-2xl border text-left text-sm flex items-center justify-between transition-all relative overflow-hidden"
                          style={
                            value === opt.value
                              ? {
                                  borderColor: `${stepColor}50`,
                                  background: `${stepColor}10`,
                                }
                              : {
                                  border: "1px solid rgba(255,255,255,0.07)",
                                  background: "rgba(255,255,255,0.025)",
                                }
                          }
                        >
                          {value === opt.value && (
                            <div
                              className="absolute left-0 top-0 bottom-0 w-0.5"
                              style={{ background: stepColor }}
                            />
                          )}
                          <span
                            style={
                              value === opt.value ? { color: stepColor } : {}
                            }
                          >
                            {opt.label}
                          </span>
                          {value === opt.value && (
                            <CheckCircle2
                              className="w-4 h-4 shrink-0"
                              style={{ color: stepColor }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );

              if (q.type === "slider") {
                const disp =
                  q.format === "currency"
                    ? fmtC(value)
                    : q.format === "years"
                      ? `${value} yrs`
                      : q.format === "percent"
                        ? `${value}%`
                        : String(value);
                return (
                  <div key={q.id} className="space-y-4">
                    <p className="text-base font-semibold text-foreground leading-snug">
                      {q.question}
                    </p>
                    {q.subtext && (
                      <p className="text-xs text-muted-foreground/50 -mt-2">
                        {q.subtext}
                      </p>
                    )}
                    {/* Value floats freely — no box wrapper */}
                    <div className="text-center py-2">
                      <p
                        className="text-5xl font-bold tabular-nums tracking-tight"
                        style={{ color: stepColor }}
                      >
                        {disp}
                      </p>
                    </div>
                    <div className="px-1">
                      <input
                        type="range"
                        min={q.min}
                        max={q.max}
                        step={q.step_size}
                        value={value as number}
                        onChange={(e) =>
                          updateField(q.id, Number(e.target.value))
                        }
                        className="w-full"
                        style={{ accentColor: stepColor }}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground/30 mt-1.5">
                        <span>
                          {q.format === "currency" ? fmtC(q.min!) : q.min}
                        </span>
                        <span>
                          {q.format === "currency" ? fmtC(q.max!) : q.max}
                        </span>
                      </div>
                    </div>
                    {/* Contextual insight pills */}
                    {q.id === "availableLumpSum" && (value as number) > 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-2xl border border-amber-400/20 bg-amber-500/8 text-xs text-amber-300">
                        <Zap className="w-3.5 h-3.5 shrink-0" />
                        Deploying {fmtC(value as number)} via waterfall:
                        insurance → emergency → debt → tax → goal.
                      </div>
                    )}
                    {q.id === "emergencyFund" &&
                      (value as number) > 0 &&
                      (() => {
                        const months =
                          (value as number) /
                          (profile.monthlyExpenses + profile.monthlyEmi || 1);
                        const ok = months >= 6;
                        return (
                          <div
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-2xl border text-xs",
                              ok
                                ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-300"
                                : "border-orange-400/20 bg-orange-500/8 text-orange-300",
                            )}
                          >
                            <span>{ok ? "✅" : "⚠️"}</span>
                            Covers <strong>
                              {months.toFixed(1)} months
                            </strong>{" "}
                            of expenses · target 6 months
                          </div>
                        );
                      })()}
                    {q.id === "existing80cInvested" && (
                      <div className="flex items-center gap-2 p-3 rounded-2xl border border-blue-500/20 bg-blue-500/8 text-xs text-blue-300">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        80C remaining:{" "}
                        <strong>
                          {fmtC(
                            Math.max(
                              0,
                              150000 -
                                (value as number) -
                                profile.employerPfMonthly * 12,
                            ),
                          )}
                        </strong>{" "}
                        (EPF included)
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </motion.div>
        </AnimatePresence>

        {step === 1 && profile.hasGirlChild && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Your daughter's age</p>
            <div className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.025]">
              <p
                className="text-4xl font-bold text-center tabular-nums mb-4 tracking-tight"
                style={{ color: stepColor }}
              >
                {profile.girlChildAge ?? 5} yrs
              </p>
              <input
                type="range"
                min={0}
                max={18}
                step={1}
                value={profile.girlChildAge ?? 5}
                onChange={(e) =>
                  updateField("girlChildAge", Number(e.target.value))
                }
                className="w-full"
                style={{ accentColor: stepColor }}
              />
            </div>
            {(profile.girlChildAge ?? 5) < 10 ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8 text-xs text-emerald-300">
                <span>✅</span> SSY eligible —{" "}
                {rates?.govtSchemes.ssy.rate ?? 8.2}% guaranteed + EEE tax-free
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-orange-400/20 bg-orange-500/8 text-xs text-orange-300">
                <span>⚠️</span> SSY requires opening before age 10
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2.5">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-white/[0.08] text-sm text-muted-foreground/60 hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 py-3.5 rounded-2xl text-black font-bold flex items-center justify-center gap-2 text-sm transition-all"
            style={{
              background: `linear-gradient(135deg,${stepColor},${stepColor}cc)`,
              boxShadow: `0 4px 16px ${stepColor}30`,
            }}
          >
            {step === TOTAL_STEPS ? (
              <>
                <Sparkles className="w-4 h-4" />
                Generate My Plan
              </>
            ) : (
              <>
                Next: {stepLabels[step + 1] ?? ""}{" "}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // ─── RESULTS ────────────────────────────────────────────────────────────────
  const criticalCount = recommendations.filter(
    (r) => r.priority === "critical",
  ).length;
  const visibleRecs = showAll ? recommendations : recommendations.slice(0, 5);
  const bestFDName = rates
    ? ([...rates.fixedIncome.fds].sort(
        (a, b) => b.rates.days365 - a.rates.days365,
      )[0]?.bank ?? "Bajaj Finance FD")
    : "a liquid fund";

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 relative">
      {/* Ambient glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute -top-48 -right-48 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "rgba(6,182,212,0.03)" }}
        />
        <div
          className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "rgba(245,158,11,0.03)" }}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: "0 0 6px #10b981" }}
            />
            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.2em]">
              Precise · Personalised
            </p>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            Your Financial Plan
          </h1>
          <p className="text-xs text-muted-foreground/50 mt-1">
            {fmtC(profile.monthlyIncome)}/mo · {profile.age}yr ·{" "}
            {profile.taxBracket}% tax
            {profile.availableLumpSum > 0
              ? ` · ${fmtC(profile.availableLumpSum)} lump sum`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {allFunds.length > 0 && (
            <span className="text-[9px] text-emerald-400/70 border border-emerald-500/20 px-2 py-0.5 rounded-full bg-emerald-500/5">
              {allFunds.length} funds
            </span>
          )}
          <button
            onClick={() => {
              setStep(1);
              setExpanded(null);
            }}
            className="p-1.5 rounded-xl border border-white/[0.07] text-muted-foreground/50 hover:text-amber-400 hover:border-amber-400/30 transition-all"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <RateTicker rates={rates} funds={funds} loading={ratesLoading} />

      {/* View toggle — premium design */}
      <div
        className="flex p-1 rounded-2xl border border-white/[0.07]"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        {(["cards", "report"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={
              viewMode === mode
                ? {
                    background: "linear-gradient(135deg,#f59e0b,#d97706)",
                    color: "#000",
                    boxShadow: "0 2px 8px rgba(245,158,11,0.3)",
                  }
                : { color: "rgba(255,255,255,0.4)" }
            }
          >
            {mode === "cards" ? "📋 Action Cards" : "📊 Full Report"}
          </button>
        ))}
      </div>

      {viewMode === "report" && (
        <InvestmentReport profile={profile} userName="You" />
      )}

      {viewMode === "cards" && (
        <>
          {/* Goal card */}
          {summary && <GoalProgressCard summary={summary} />}

          {/* Stats — asymmetric: hero SIP card, smaller lump + tax */}
          {summary && (
            <div className="grid grid-cols-3 gap-2 items-stretch">
              <div className="relative p-3.5 h-full flex flex-col justify-center">
                <StatBox
                  label="Monthly SIPs"
                  value={
                    summary.totalMonthlySip > 0
                      ? fmtC(summary.totalMonthlySip)
                      : "—"
                  }
                  color="#8b5cf6"
                  sub="recurring investments"
                  icon="📅"
                  hero
                />
              </div>
              <div className="col-span-1 flex flex-col gap-2">
                <StatBox
                  label="Lump sum"
                  value={
                    summary.totalLumpSum > 0 ? fmtC(summary.totalLumpSum) : "—"
                  }
                  color="#f59e0b"
                  sub="one-time"
                  icon="⚡"
                />
                <StatBox
                  label="Tax/yr"
                  value={
                    summary.totalTaxSaving > 0
                      ? fmtC(summary.totalTaxSaving)
                      : "—"
                  }
                  color="#10b981"
                  sub="saved"
                  icon="💰"
                />
              </div>
              {/* Mini surplus card */}
              <div className="col-span-1">
                <div
                  className="h-full rounded-2xl border border-white/[0.06] overflow-hidden relative"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  {/* Subtle grid lines decoration */}
                  <svg
                    className="absolute inset-0 w-full h-full opacity-[0.04]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id="sg"
                        width="12"
                        height="12"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 12 0 L 0 0 0 12"
                          fill="none"
                          stroke="white"
                          strokeWidth="0.5"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#sg)" />
                  </svg>
                  <div className="relative p-3.5 h-full flex flex-col justify-center">
                    <p className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.12em] mb-1">
                      Surplus left
                    </p>
                    <p className="text-xl font-bold text-blue-400 tabular-nums">
                      {fmtC(
                        Math.max(0, (summary as any).surplusRemaining ?? 0),
                      )}{" "}
                      ,000
                    </p>
                    <p className="text-[9px] text-muted-foreground/30 mt-0.5">
                      unallocated
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info banners */}
          {summary && summary.surplusRemaining > 0 && (
            <div className="flex gap-2.5 p-3.5 rounded-2xl border border-blue-500/20 bg-blue-500/6 text-xs text-blue-200">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
              <span>
                {fmtC(summary.surplusRemaining)}K/mo unallocated —{" "}
                {liquidFund ? (
                  <>
                    <strong className="text-white/70">
                      {cleanName(liquidFund.schemeName).slice(0, 30)}
                    </strong>
                    {liquidFund.returns.oneYear
                      ? ` (${liquidFund.returns.oneYear.toFixed(1)}% 1Y)`
                      : ""}
                  </>
                ) : (
                  <>keep in a liquid fund</>
                )}
              </span>
            </div>
          )}
          {summary && summary.remainingLumpSum > 0 && (
            <div className="flex gap-2.5 p-3.5 rounded-2xl border border-blue-500/20 bg-blue-500/6 text-xs text-blue-200">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
              <span>
                {fmtC(summary.remainingLumpSum)} undeployed — best FD:{" "}
                <strong className="text-white/70">{bestFDName}</strong>
              </span>
            </div>
          )}

          {/* Critical banner — more alarming */}
          {criticalCount > 0 && (
            <div
              className="flex gap-2.5 p-4 rounded-2xl border border-red-500/40 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.06))",
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5"
                style={{ background: "#ef4444" }}
              />
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <p className="text-xs text-red-200 font-medium">
                Complete {criticalCount} critical action
                {criticalCount > 1 ? "s" : ""} before investing in markets.
              </p>
            </div>
          )}

          {/* Rec cards */}
          <div className="space-y-3">
            {visibleRecs.map((rec, i) => {
              const cfg = PRIORITY[rec.priority];
              const invCfg = INV_TYPE[rec.investmentType] ?? INV_TYPE.sip;
              const InvIcon = invCfg.icon;
              const isExp = expanded === rec.id;
              const amtCount = [
                rec.monthlyAmount > 0,
                rec.lumpSum && rec.lumpSum > 0,
                rec.taxSaving,
              ].filter(Boolean).length;

              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    border: `1px solid ${cfg.color}25`,
                    boxShadow: `0 0 20px ${cfg.glow}`,
                  }}
                  onClick={() => setExpanded(isExp ? null : rec.id)}
                >
                  {/* Colored top strip — thicker for critical */}
                  <div
                    style={{
                      height: rec.priority === "critical" ? "3px" : "1.5px",
                      background: `linear-gradient(90deg,${cfg.color},${cfg.color}44,transparent)`,
                    }}
                  />

                  {/* Collapsed body — clean and minimal */}
                  <div className="p-4" style={{ background: `${cfg.color}06` }}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0 mt-0.5">
                        {rec.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        {/* ONE badge row — priority + inv type only */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                            style={{
                              color: cfg.color,
                              borderColor: `${cfg.color}35`,
                              background: `${cfg.color}12`,
                            }}
                          >
                            {cfg.label}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                              invCfg.color,
                              invCfg.bg,
                            )}
                          >
                            <InvIcon className="w-2.5 h-2.5" />
                            {invCfg.label}
                          </span>
                          {(rec as any).isParallelGoal && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25 font-bold">
                              Parallel
                            </span>
                          )}
                        </div>
                        {/* Title — full line, no subtitle until expanded */}
                        <p className="text-sm font-bold leading-snug">
                          {rec.title}
                        </p>
                        {/* Amounts inline — primary info when collapsed */}
                        <div className="flex gap-2.5 mt-2 flex-wrap">
                          {rec.monthlyAmount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                              ₹{rec.monthlyAmount.toLocaleString()}/mo
                            </span>
                          )}
                          {rec.lumpSum && rec.lumpSum > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                              ₹{rec.lumpSum.toLocaleString()} lump
                            </span>
                          )}
                          {rec.taxSaving && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                              ₹{rec.taxSaving.toLocaleString()}/yr tax
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 mt-1">
                        <div className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center">
                          {isExp ? (
                            <ChevronUp className="w-2.5 h-2.5 text-muted-foreground/50" />
                          ) : (
                            <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/40" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded — numbered sections, not thin dividers */}
                  <AnimatePresence>
                    {isExp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/[0.06]"
                      >
                        <div className="p-4 space-y-5">
                          {/* Subtitle shown when expanded */}
                          <p className="text-xs text-muted-foreground/70 leading-relaxed">
                            {rec.subtitle}
                          </p>

                          {/* Urgency pill */}
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-400/20 bg-amber-500/8">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-xs font-semibold text-amber-300">
                              {rec.urgency}
                            </span>
                          </div>

                          {/* §1 Why */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] font-black text-muted-foreground/25 font-mono">
                                §1
                              </span>
                              <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">
                                Why this for you
                              </p>
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed">
                              {rec.reasoning}
                            </p>
                          </div>

                          {/* §2 Action — hero */}
                          <div
                            className="p-4 rounded-2xl border border-amber-400/20 relative overflow-hidden"
                            style={{
                              background:
                                "linear-gradient(135deg,rgba(245,158,11,0.09),rgba(245,158,11,0.03))",
                            }}
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                              style={{ background: "#f59e0b" }}
                            />
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] font-black text-amber-400/40 font-mono">
                                §2
                              </span>
                              <p className="text-[9px] font-bold text-amber-400 uppercase tracking-[0.15em]">
                                Exactly what to do
                              </p>
                            </div>
                            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line break-words">
                              {rec.action}
                            </p>
                          </div>

                          {/* Amount tiles */}
                          {amtCount > 0 && (
                            <div
                              className={cn(
                                "grid gap-2",
                                amtCount === 1
                                  ? "grid-cols-1"
                                  : amtCount === 2
                                    ? "grid-cols-2"
                                    : "grid-cols-2 sm:grid-cols-3",
                              )}
                            >
                              {rec.monthlyAmount > 0 && (
                                <div className="p-3 rounded-xl border border-violet-500/20 bg-violet-500/8 text-center">
                                  <p className="text-[9px] text-violet-400/60 mb-0.5">
                                    SIP / Month
                                  </p>
                                  <p className="text-lg font-bold text-violet-400 tabular-nums">
                                    ₹{rec.monthlyAmount.toLocaleString()}
                                  </p>
                                </div>
                              )}
                              {rec.lumpSum && rec.lumpSum > 0 && (
                                <div className="p-3 rounded-xl border border-amber-400/20 bg-amber-500/8 text-center">
                                  <p className="text-[9px] text-amber-400/60 mb-0.5">
                                    Lump Sum
                                  </p>
                                  <p className="text-lg font-bold text-amber-400 tabular-nums">
                                    ₹{rec.lumpSum.toLocaleString()}
                                  </p>
                                </div>
                              )}
                              {rec.taxSaving && (
                                <div
                                  className={cn(
                                    "p-3 rounded-xl border border-green-500/20 bg-green-500/8 text-center",
                                    amtCount === 3
                                      ? "col-span-2 sm:col-span-1"
                                      : "",
                                  )}
                                >
                                  <p className="text-[9px] text-green-400/60 mb-0.5">
                                    Tax Saved/yr
                                  </p>
                                  <p className="text-lg font-bold text-green-400 tabular-nums">
                                    ₹{rec.taxSaving.toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Live funds */}
                          <LiveFundPanel
                            recCategory={rec.category}
                            funds={funds}
                            loading={loading}
                          />

                          {/* §3 Outcome */}
                          <div
                            className="p-4 rounded-2xl border border-emerald-500/20 relative overflow-hidden"
                            style={{
                              background:
                                "linear-gradient(135deg,rgba(16,185,129,0.07),rgba(16,185,129,0.02))",
                            }}
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                              style={{ background: "#10b981" }}
                            />
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] font-black text-emerald-400/40 font-mono">
                                §3
                              </span>
                              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.15em]">
                                Expected outcome
                              </p>
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed">
                              {rec.expectedOutcome}
                            </p>
                          </div>

                          {/* Avoid */}
                          <div
                            className="p-3.5 rounded-2xl border border-red-500/20 relative overflow-hidden"
                            style={{ background: "rgba(239,68,68,0.05)" }}
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                              style={{ background: "#ef4444" }}
                            />
                            <p className="text-xs text-foreground/80 leading-relaxed">
                              <span className="font-bold text-red-400">
                                ⚠ Avoid:{" "}
                              </span>
                              {rec.avoidMistake}
                            </p>
                          </div>

                          {/* Platforms */}
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground/35 uppercase tracking-[0.15em] mb-2">
                              Where to do this
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {rec.platform.map((pl) => (
                                <span
                                  key={pl}
                                  className="text-[10px] font-medium px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-foreground/65"
                                >
                                  {pl}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {recommendations.length > 5 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="w-full py-3 rounded-2xl border border-white/[0.07] text-xs text-muted-foreground/50 hover:text-foreground transition-all"
            >
              {showAll
                ? `Show less`
                : `Show ${recommendations.length - 5} more recommendations`}
            </button>
          )}

          <p className="text-[10px] text-muted-foreground/30 text-center leading-relaxed pb-4">
            AI-generated from your inputs · Rates from AMFI + DB · Consult a
            SEBI fee-only advisor for large decisions.
          </p>
        </>
      )}
    </div>
  );
}
