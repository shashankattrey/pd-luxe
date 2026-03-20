"use client";

import { useState, useMemo } from "react";
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
  Wifi,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PROFILE_QUESTIONS,
  TOTAL_STEPS,
  generatePreciseRecommendations,
  generatePlanSummary,
  type FinancialProfile,
  type Recommendation,
  type RecommendationPriority,
  type PlanSummary,
} from "@/lib/smart-engine";
import InvestmentReport from "../../../components/InvestmentReport";
import { useMarketData } from "@/hooks/useMarketData";
import { cn } from "@/lib/utils";

// ─── CONFIG MAPS ─────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  RecommendationPriority,
  { bg: string; border: string; label: string; labelColor: string }
> = {
  critical: {
    bg: "bg-red-500/8",
    border: "border-red-500/30",
    label: "Do First",
    labelColor: "text-red-400",
  },
  high: {
    bg: "bg-amber-500/8",
    border: "border-amber-400/25",
    label: "High",
    labelColor: "text-amber-400",
  },
  medium: {
    bg: "bg-blue-500/8",
    border: "border-blue-500/25",
    label: "Medium",
    labelColor: "text-blue-400",
  },
  optional: {
    bg: "bg-white/3",
    border: "border-white/10",
    label: "Optional",
    labelColor: "text-muted-foreground",
  },
};

const INV_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  sip: {
    label: "SIP / Monthly",
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
    label: "SIP + Lump Sum",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    icon: TrendingUp,
  },
  "one-time-then-sip": {
    label: "Lump Sum → then SIP",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    icon: ArrowRight,
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  protection: "🛡️ Protection",
  emergency: "💵 Emergency",
  debt: "🔴 Debt",
  tax: "💰 Tax Saving",
  goal: "🎯 Goal",
  wealth: "📈 Wealth",
  rebalance: "🔄 Rebalance",
};

// ─── DEFAULT PROFILE ─────────────────────────────────────────────────────────

const DEFAULT_PROFILE: FinancialProfile = {
  age: 30,
  isMarried: false,
  hasGirlChild: false,
  girlChildAge: undefined,
  isGovtEmployee: false,
  dependents: 0,
  monthlyIncome: 80000,
  incomeType: "salaried",
  taxBracket: 20,
  employerPfMonthly: 0,
  monthlyExpenses: 30000,
  monthlyEmi: 0,
  monthlyRent: 0,
  hasTermInsurance: false,
  termCoverAmount: 0,
  hasHealthInsurance: false,
  healthCoverAmount: 0,
  emergencyFund: 0,
  existing80cInvested: 0,
  highInterestDebt: 0,
  existingInvestments: [],
  existingCorpus: 0,
  availableLumpSum: 0,
  lumpSumSource: "none" as const,
  primaryGoal: "wealth",
  goalAmountTarget: 5000000,
  goalYears: 10,
  retirementAge: 60,
  riskAppetite: "moderate",
  prefersSip: true,
  prefersOldRegime: false,
  includeStepUp: true,
  inflationRate: 6,
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function WealthAdvisorPage() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<FinancialProfile>(DEFAULT_PROFILE);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "report">("cards");

  // ── Live market data ───────────────────────────────────────────────────────
  const {
    data: marketData,
    loading: marketLoading,
    refreshing,
    error: marketError,
    refetch,
  } = useMarketData();

  // ── Engine — pass live marketData so rates are real, not hardcoded ─────────
  const recommendations = useMemo(
    () =>
      step > TOTAL_STEPS
        ? generatePreciseRecommendations(profile, marketData ?? undefined)
        : [],
    [step, profile, marketData],
  );

  const summary = useMemo(
    () =>
      recommendations.length > 0
        ? generatePlanSummary(profile, recommendations)
        : null,
    [recommendations, profile],
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  const surplus = Math.max(
    0,
    profile.monthlyIncome -
      profile.monthlyExpenses -
      profile.monthlyEmi -
      profile.monthlyRent,
  );
  const updateField = (id: string, value: unknown) =>
    setProfile((p) => ({ ...p, [id]: value }));
  const questionsForStep = PROFILE_QUESTIONS.filter((q) => q.step === step);
  const fmtC = (v: number) =>
    v >= 10000000
      ? `₹${(v / 10000000).toFixed(1)}Cr`
      : v >= 100000
        ? `₹${(v / 100000).toFixed(0)}L`
        : v >= 1000
          ? `₹${(v / 1000).toFixed(0)}k`
          : `₹${v}`;

  // ── Market ticker bar — shown at top of every step ─────────────────────────
  const MarketTicker = () => {
    if (marketLoading && !marketData) {
      return (
        <div className="w-full h-8 mb-4 rounded-lg bg-white/3 border border-white/8 animate-pulse flex items-center px-3">
          <span className="text-[10px] text-muted-foreground">
            Loading live rates…
          </span>
        </div>
      );
    }
    if (marketError && !marketData) {
      return (
        <div className="w-full mb-4 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/20 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] text-red-400">
            <WifiOff className="w-3 h-3" /> Live rates unavailable — using
            latest cached values
          </span>
          <button
            onClick={refetch}
            className="text-[10px] text-red-400 hover:text-red-300 underline"
          >
            Retry
          </button>
        </div>
      );
    }
    if (!marketData) return null;

    const { equity, gold, govtSchemes, macro, crypto } = marketData;
    const niftyUp = equity.nifty50.changePct >= 0;

    return (
      <div className="w-full mb-4 flex items-center gap-0 overflow-x-auto scrollbar-hide rounded-lg bg-white/3 border border-white/8 text-[10px]">
        <span className="flex items-center gap-1 shrink-0 px-3 py-2 border-r border-white/8">
          <Wifi
            className={cn(
              "w-2.5 h-2.5",
              refreshing ? "text-amber-400 animate-pulse" : "text-emerald-400",
            )}
          />
          <span className="text-muted-foreground">
            {refreshing ? "updating…" : "live"}
          </span>
        </span>
        <span className="flex items-center gap-1 shrink-0 px-3 py-2 border-r border-white/8">
          <span className="text-muted-foreground">NIFTY</span>
          <span className="font-semibold">
            {equity.nifty50.value.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
          </span>
          <span className={niftyUp ? "text-emerald-400" : "text-red-400"}>
            {niftyUp ? "+" : ""}
            {equity.nifty50.changePct.toFixed(2)}%
          </span>
        </span>
        <span className="flex items-center gap-1 shrink-0 px-3 py-2 border-r border-white/8">
          <span className="text-muted-foreground">Gold</span>
          <span className="font-semibold">
            ₹
            {gold.price24k.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
            /g
          </span>
        </span>
        <span className="flex items-center gap-1 shrink-0 px-3 py-2 border-r border-white/8">
          <span className="text-muted-foreground">PPF</span>
          <span className="font-semibold text-amber-400">
            {govtSchemes.ppf.rate}%
          </span>
        </span>
        <span className="flex items-center gap-1 shrink-0 px-3 py-2 border-r border-white/8">
          <span className="text-muted-foreground">SSY</span>
          <span className="font-semibold text-amber-400">
            {govtSchemes.ssy.rate}%
          </span>
        </span>
        <span className="flex items-center gap-1 shrink-0 px-3 py-2 border-r border-white/8">
          <span className="text-muted-foreground">USD/₹</span>
          <span className="font-semibold">{macro.usdInr.toFixed(2)}</span>
        </span>
        <span className="flex items-center gap-1 shrink-0 px-3 py-2">
          <span className="text-muted-foreground">BTC</span>
          <span className="font-semibold">
            ₹{(crypto.bitcoin.priceINR / 100000).toFixed(1)}L
          </span>
          <span
            className={
              crypto.bitcoin.changePct1d >= 0
                ? "text-emerald-400"
                : "text-red-400"
            }
          >
            {crypto.bitcoin.changePct1d >= 0 ? "+" : ""}
            {crypto.bitcoin.changePct1d.toFixed(1)}%
          </span>
        </span>
      </div>
    );
  };

  // ── Live rates pill — shown above GoalProgressCard on results screen ────────
  const LiveRatesPill = () => {
    if (!marketData) return null;
    const { equity, gold, govtSchemes } = marketData;
    return (
      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
          NIFTY{" "}
          {equity.nifty50.value.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}
          <span
            className={
              equity.nifty50.changePct >= 0
                ? " text-emerald-400"
                : " text-red-400"
            }
          >
            {" "}
            {equity.nifty50.changePct >= 0 ? "+" : ""}
            {equity.nifty50.changePct.toFixed(2)}%
          </span>
        </span>
        <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
          Gold ₹
          {gold.price24k.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          /g
        </span>
        <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
          PPF {govtSchemes.ppf.rate}% · SSY {govtSchemes.ssy.rate}%
        </span>
        {refreshing && (
          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1 text-muted-foreground">
            <RefreshCcw className="w-2.5 h-2.5 animate-spin" /> updating…
          </span>
        )}
      </div>
    );
  };

  // ── LANDING ───────────────────────────────────────────────────────────────
  if (step === 0)
    return (
      <div className="max-w-lg mx-auto space-y-6">
        {/* Live market ticker */}
        <MarketTicker />

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            AI-Powered · Precise
          </p>
          <h1 className="font-serif text-3xl font-bold leading-tight">
            Exact SIP & Lump Sum
            <br />
            <span className="text-amber-400">Plan for You</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Not vague advice. Exact instruments, amounts, platforms — and honest
            assessment of whether your goal is actually achievable.
          </p>
          {/* Live rates inline teaser */}
          {marketData && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Wifi className="w-3 h-3 text-emerald-400" />
              Rates updated live: NIFTY{" "}
              {marketData.equity.nifty50.value.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
              {" · "}PPF {marketData.govtSchemes.ppf.rate}%{" · "}Gold ₹
              {marketData.gold.price24k.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
              /g
            </div>
          )}
        </div>

        <div className="space-y-3">
          {[
            {
              icon: "🎯",
              t: "Goal feasibility check",
              d: "We tell you if your goal is achievable — and 3 alternatives if it's not",
            },
            {
              icon: "📅",
              t: "Exact SIP + lump sum split",
              d: '"₹6,250/mo ELSS + ₹1.5L PPF lump sum on April 5" — not just categories',
            },
            {
              icon: "🔒",
              t: "Lock-in aware",
              d: "PPF/NPS never suggested for short goals — lock-in is always checked",
            },
            {
              icon: "📈",
              t: "10% step-up projection",
              d: "Shows how annual SIP increase multiplies your corpus vs flat SIP",
            },
          ].map((i) => (
            <div
              key={i.t}
              className="flex gap-3 p-4 rounded-xl bg-white/3 border border-white/8"
            >
              <span className="text-xl shrink-0">{i.icon}</span>
              <div>
                <p className="text-sm font-semibold">{i.t}</p>
                <p className="text-xs text-muted-foreground mt-0.5 italic">
                  {i.d}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setStep(1)}
            className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center justify-center gap-2 text-base transition-all"
          >
            <Sparkles className="w-5 h-5" /> Build My Precise Plan — 6 Steps
          </button>
          <p className="text-center text-xs text-muted-foreground">
            ~3 minutes · data stays on device only
          </p>
        </div>
      </div>
    );

  // ── PROFILING STEPS ───────────────────────────────────────────────────────
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
    return (
      <div className="max-w-lg mx-auto space-y-5">
        {/* Live ticker on profiling steps too */}
        <MarketTicker />

        <div className="space-y-2">
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">
              Step {step}/{TOTAL_STEPS} —{" "}
              <span className="text-foreground font-medium">
                {stepLabels[step]}
              </span>
            </p>
            <button
              onClick={() => setStep(0)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 h-1 rounded-full transition-all",
                  i < step ? "bg-amber-400" : "bg-white/10",
                )}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {questionsForStep.map((q) => {
              const value = profile[q.id as keyof FinancialProfile] as any;
              if (q.id === "lumpSumSource" && profile.availableLumpSum === 0)
                return null;

              if (q.type === "boolean")
                return (
                  <div key={q.id} className="space-y-3">
                    <div>
                      <p className="text-base font-semibold">{q.question}</p>
                      {q.subtext && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {q.subtext}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {q.options!.map((opt) => (
                        <button
                          key={String(opt.value)}
                          onClick={() => updateField(q.id, opt.value)}
                          className={cn(
                            "p-4 rounded-xl border text-sm font-medium transition-all",
                            value === opt.value
                              ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                              : "border-white/10 bg-white/3 hover:border-white/20",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );

              if (q.type === "select")
                return (
                  <div key={q.id} className="space-y-3">
                    <div>
                      <p className="text-base font-semibold">{q.question}</p>
                      {q.subtext && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {q.subtext}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      {q.options!.map((opt) => (
                        <button
                          key={String(opt.value)}
                          onClick={() => updateField(q.id, opt.value)}
                          className={cn(
                            "w-full p-3.5 rounded-xl border text-left text-sm flex items-center justify-between transition-all",
                            value === opt.value
                              ? "border-amber-400/50 bg-amber-400/10"
                              : "border-white/10 bg-white/3 hover:border-white/20",
                          )}
                        >
                          <span
                            className={
                              value === opt.value
                                ? "text-amber-400"
                                : "text-foreground"
                            }
                          >
                            {opt.label}
                          </span>
                          {value === opt.value && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
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
                  <div key={q.id} className="space-y-3">
                    <div>
                      <p className="text-base font-semibold">{q.question}</p>
                      {q.subtext && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {q.subtext}
                        </p>
                      )}
                    </div>
                    <div
                      className={cn(
                        "p-4 rounded-xl border space-y-3",
                        q.id === "availableLumpSum" && value > 0
                          ? "bg-amber-500/8 border-amber-400/30"
                          : "bg-white/3 border-white/8",
                      )}
                    >
                      <p className="text-3xl font-bold text-amber-400 text-center">
                        {disp}
                      </p>
                      <input
                        type="range"
                        min={q.min}
                        max={q.max}
                        step={q.step_size}
                        value={value}
                        onChange={(e) =>
                          updateField(q.id, Number(e.target.value))
                        }
                        className="w-full accent-amber-400"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground/50">
                        <span>
                          {q.format === "currency" ? fmtC(q.min!) : q.min}
                        </span>
                        <span>
                          {q.format === "currency" ? fmtC(q.max!) : q.max}
                        </span>
                      </div>
                    </div>
                    {q.id === "availableLumpSum" && value > 0 && (
                      <div className="flex gap-2 p-3 rounded-xl bg-amber-400/8 border border-amber-400/20 text-xs text-amber-300">
                        <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        We'll deploy this {fmtC(value)} precisely — FD, PPF lump
                        sum, debt payoff, or equity.
                      </div>
                    )}
                    {q.id === "emergencyFund" && value > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Covers{" "}
                        <span
                          className={cn(
                            "font-medium",
                            value /
                              (profile.monthlyExpenses + profile.monthlyEmi ||
                                1) >=
                              6
                              ? "text-green-400"
                              : "text-orange-400",
                          )}
                        >
                          {(
                            value /
                            (profile.monthlyExpenses + profile.monthlyEmi || 1)
                          ).toFixed(1)}{" "}
                          months
                        </span>
                        {" · "}target 6 months
                      </p>
                    )}
                    {q.id === "existing80cInvested" && (
                      <p className="text-xs text-muted-foreground">
                        80C remaining:{" "}
                        <span className="text-amber-400 font-medium">
                          {fmtC(
                            Math.max(
                              0,
                              150000 - value - profile.employerPfMonthly * 24,
                            ),
                          )}
                        </span>
                      </p>
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
            <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-3">
              <p className="text-3xl font-bold text-amber-400 text-center">
                {profile.girlChildAge ?? 5} years
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
                className="w-full accent-amber-400"
              />
              {(profile.girlChildAge ?? 5) < 10 ? (
                <p className="text-xs text-green-400">
                  ✓ SSY eligible —{" "}
                  {marketData ? `${marketData.govtSchemes.ssy.rate}%` : "8.2%"}{" "}
                  guaranteed + fully tax-free
                </p>
              ) : (
                <p className="text-xs text-orange-400">
                  SSY requires opening before age 10
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center justify-center gap-2 text-sm transition-all"
          >
            {step === TOTAL_STEPS ? (
              <>
                <Sparkles className="w-4 h-4" /> Generate Precise Plan
              </>
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  const criticalCount = recommendations.filter(
    (r) => r.priority === "critical",
  ).length;
  const visibleRecs = showAll ? recommendations : recommendations.slice(0, 5);
  const hasLumpSum = profile.availableLumpSum > 0;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Precise · Personalised
          </p>
          <h1 className="font-serif text-2xl font-bold">Your Financial Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fmtC(profile.monthlyIncome)}/mo · {profile.age}yr ·{" "}
            {profile.taxBracket}% tax
            {hasLumpSum ? ` · ${fmtC(profile.availableLumpSum)} lump sum` : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setStep(1);
            setExpanded(null);
          }}
          className="text-muted-foreground hover:text-amber-400"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Live rates ticker on results too */}
      <MarketTicker />

      {/* View mode toggle */}
      <div className="flex bg-white/5 rounded-xl p-1 print:hidden">
        <button
          onClick={() => setViewMode("cards")}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
            viewMode === "cards"
              ? "bg-amber-500 text-black"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          📋 Action Cards
        </button>
        <button
          onClick={() => setViewMode("report")}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
            viewMode === "report"
              ? "bg-amber-500 text-black"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          📊 Full Report + Charts
        </button>
      </div>

      {/* Full visual report */}
      {viewMode === "report" && (
        <InvestmentReport profile={profile} userName="You" />
      )}

      {/* Goal feasibility card — live rates pill above it */}
      {viewMode === "cards" && summary && (
        <>
          <LiveRatesPill />
          <GoalProgressCard summary={summary} fmtC={fmtC} />
        </>
      )}

      {/* Summary stat boxes */}
      {viewMode === "cards" && summary && (
        <div className="grid grid-cols-3 gap-3">
          <StatBox
            label="SIPs/month"
            value={
              summary.totalMonthlySip > 0 ? fmtC(summary.totalMonthlySip) : "—"
            }
            sub="recurring"
            color="text-violet-400"
          />
          <StatBox
            label="Lump sum"
            value={summary.totalLumpSum > 0 ? fmtC(summary.totalLumpSum) : "—"}
            sub="one-time"
            color="text-amber-400"
          />
          <StatBox
            label="Tax saved"
            value={
              summary.totalTaxSaving > 0 ? fmtC(summary.totalTaxSaving) : "—"
            }
            sub="/yr"
            color="text-green-400"
          />
        </div>
      )}

      {/* Surplus usage */}
      {viewMode === "cards" && summary && summary.surplusRemaining > 0 && (
        <div className="flex gap-2 p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 text-xs text-blue-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {fmtC(summary.surplusRemaining)}/mo unallocated — keep as liquid
            buffer in IDFC FIRST savings (7%).
          </span>
        </div>
      )}

      {viewMode === "cards" && summary && summary.remainingLumpSum > 0 && (
        <div className="flex gap-2 p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 text-xs text-blue-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {fmtC(summary.remainingLumpSum)} lump sum undeployed — keep in HDFC
            Liquid Fund (6.8%) as buffer.
          </span>
        </div>
      )}

      {viewMode === "cards" && criticalCount > 0 && (
        <div className="flex gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          Complete {criticalCount} critical action{criticalCount > 1 ? "s" : ""}{" "}
          before investing in markets.
        </div>
      )}

      {/* Recommendation cards */}
      {viewMode === "cards" && (
        <div className="space-y-3">
          {visibleRecs.map((rec, i) => {
            const cfg = PRIORITY_CONFIG[rec.priority];
            const invCfg = INV_TYPE_CONFIG[rec.investmentType];
            const InvIcon = invCfg.icon;
            const isExp = expanded === rec.id;
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "rounded-2xl border overflow-hidden cursor-pointer",
                  cfg.bg,
                  cfg.border,
                )}
                onClick={() => setExpanded(isExp ? null : rec.id)}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{rec.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border",
                            cfg.labelColor,
                            rec.priority === "critical"
                              ? "border-red-500/30"
                              : rec.priority === "high"
                                ? "border-amber-400/30"
                                : "border-blue-500/30",
                          )}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-[9px] text-muted-foreground/50">
                          {CATEGORY_LABELS[rec.category]}
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
                      </div>
                      <p className="text-sm font-bold leading-snug">
                        {rec.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rec.subtitle}
                      </p>
                      <div className="flex gap-3 mt-2 flex-wrap">
                        {rec.monthlyAmount > 0 && (
                          <span className="text-[10px] text-violet-400 font-medium">
                            ₹{rec.monthlyAmount.toLocaleString()}/mo
                          </span>
                        )}
                        {rec.lumpSum && rec.lumpSum > 0 && (
                          <span className="text-[10px] text-amber-400 font-medium">
                            ₹{rec.lumpSum.toLocaleString()} lump sum
                          </span>
                        )}
                        {rec.taxSaving && (
                          <span className="text-[10px] text-green-400 font-medium">
                            saves ₹{rec.taxSaving.toLocaleString()}/yr tax
                          </span>
                        )}
                      </div>
                    </div>
                    {isExp ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/8 p-4 space-y-4"
                    >
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span className="text-xs font-medium text-amber-400">
                          {rec.urgency}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                          Why this is right for you
                        </p>
                        <p className="text-sm leading-relaxed">
                          {rec.reasoning}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-400/8 border border-amber-400/20">
                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1.5">
                          Exactly what to do
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-line">
                          {rec.action}
                        </p>
                      </div>
                      <div
                        className="grid gap-3"
                        style={{
                          gridTemplateColumns: `repeat(${[rec.monthlyAmount > 0, rec.lumpSum && rec.lumpSum > 0, rec.taxSaving].filter(Boolean).length}, 1fr)`,
                        }}
                      >
                        {rec.monthlyAmount > 0 && (
                          <div className="p-3 rounded-xl bg-violet-500/8 border border-violet-500/20 text-center">
                            <p className="text-[10px] text-violet-400">
                              SIP / Month
                            </p>
                            <p className="text-lg font-bold">
                              ₹{rec.monthlyAmount.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {rec.lumpSum && rec.lumpSum > 0 && (
                          <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-400/20 text-center">
                            <p className="text-[10px] text-amber-400">
                              Lump Sum
                            </p>
                            <p className="text-lg font-bold text-amber-400">
                              ₹{rec.lumpSum.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {rec.taxSaving && (
                          <div className="p-3 rounded-xl bg-green-500/8 border border-green-500/20 text-center">
                            <p className="text-[10px] text-green-400">
                              Tax saved/yr
                            </p>
                            <p className="text-lg font-bold text-green-400">
                              ₹{rec.taxSaving.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">
                          Expected outcome
                        </p>
                        <p className="text-sm">{rec.expectedOutcome}</p>
                      </div>
                      <div className="flex gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs leading-relaxed">
                          <span className="text-red-400 font-bold">
                            Avoid:{" "}
                          </span>
                          {rec.avoidMistake}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                          Where to do this
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {rec.platform.map((pl) => (
                            <span
                              key={pl}
                              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 font-medium"
                            >
                              {pl}
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
        </div>
      )}

      {viewMode === "cards" && recommendations.length > 5 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="w-full py-3 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-all"
        >
          {showAll
            ? "Show less"
            : `Show ${recommendations.length - 5} more recommendations`}
        </button>
      )}

      <p className="text-[10px] text-muted-foreground/40 text-center leading-relaxed pb-4">
        AI-generated from your inputs. Consult a SEBI-registered fee-only
        advisor for large decisions.
      </p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="text-center p-3 rounded-xl bg-white/3 border border-white/8">
      <p className={cn("text-xl font-bold", color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground/50">{sub}</p>}
    </div>
  );
}

function GoalProgressCard({
  summary,
  fmtC,
}: {
  summary: PlanSummary;
  fmtC: (v: number) => string;
}) {
  const [showAlts, setShowAlts] = useState(false);
  const f = summary.feasibility;
  const pct = Math.min(100, f.achievablePct);

  const STATUS = {
    achievable: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/8",
      border: "border-emerald-500/25",
      icon: "✅",
      label: "On Track",
    },
    close: {
      color: "text-blue-400",
      bg: "bg-blue-500/8",
      border: "border-blue-500/25",
      icon: "🔵",
      label: "Nearly There",
    },
    stretch: {
      color: "text-amber-400",
      bg: "bg-amber-500/8",
      border: "border-amber-400/25",
      icon: "⚠️",
      label: "Stretch Goal",
    },
    impossible: {
      color: "text-red-400",
      bg: "bg-red-500/8",
      border: "border-red-500/25",
      icon: "🔴",
      label: "Needs Revision",
    },
  } as const;
  const s = STATUS[f.status];

  return (
    <div className={cn("rounded-2xl border p-5 space-y-4", s.bg, s.border)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">
              Goal Projection
            </span>
            <span
              className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full border",
                s.color,
                f.status === "achievable"
                  ? "border-emerald-500/30"
                  : f.status === "close"
                    ? "border-blue-500/30"
                    : f.status === "stretch"
                      ? "border-amber-400/30"
                      : "border-red-500/30",
              )}
            >
              {s.icon} {s.label}
            </span>
          </div>
          <p className="font-serif text-lg font-bold">{summary.goalName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Target {fmtC(summary.goalTarget)} by {summary.targetYear} (
            {summary.goalYears} yr{summary.goalYears > 1 ? "s" : ""})
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn("text-3xl font-bold", s.color)}>{pct}%</p>
          <p className="text-[10px] text-muted-foreground">of target</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              f.status === "achievable"
                ? "bg-emerald-400"
                : f.status === "close"
                  ? "bg-blue-400"
                  : f.status === "stretch"
                    ? "bg-amber-400"
                    : "bg-red-400",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>₹0</span>
          <span className={cn("font-medium", s.color)}>
            Projected: {fmtC(summary.projectedCorpus)}
          </span>
          <span>Target: {fmtC(summary.goalTarget)}</span>
        </div>
      </div>

      {/* SIP vs lump sum split */}
      {(summary.projectedFromSip > 0 || summary.projectedFromLump > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {summary.projectedFromSip > 0 && (
            <div className="p-2.5 rounded-xl bg-white/5 text-center">
              <p className="text-[10px] text-violet-400">From SIPs</p>
              <p className="text-sm font-bold">
                {fmtC(summary.projectedFromSip)}
              </p>
            </div>
          )}
          {summary.projectedFromLump > 0 && (
            <div className="p-2.5 rounded-xl bg-white/5 text-center">
              <p className="text-[10px] text-amber-400">From Lump Sum</p>
              <p className="text-sm font-bold">
                {fmtC(summary.projectedFromLump)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 10% step-up bonus */}
      {summary.goalYears >= 3 &&
        summary.sipStepupCorpus > summary.projectedCorpus * 1.08 && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
            <span className="text-violet-300">
              <strong>10% annual SIP step-up:</strong> corpus grows to{" "}
              {fmtC(summary.sipStepupCorpus)} —{" "}
              {fmtC(summary.sipStepupCorpus - summary.projectedCorpus)} more
              than flat SIP
            </span>
          </div>
        )}

      {/* Verdict */}
      <div
        className={cn(
          "p-3 rounded-xl text-xs leading-relaxed",
          s.bg,
          "border",
          s.border,
        )}
      >
        <p className={cn("font-bold mb-1", s.color)}>
          {s.icon}{" "}
          {f.status === "achievable"
            ? "You're on track"
            : f.status === "close"
              ? "Almost there"
              : f.status === "stretch"
                ? "Achievable with adjustments"
                : "Goal needs revision"}
        </p>
        <p className="text-muted-foreground leading-relaxed">
          {f.status === "achievable"
            ? `Your plan projects ${fmtC(summary.projectedCorpus)} by ${summary.targetYear} — ${fmtC(summary.projectedCorpus - summary.goalTarget)} above target. Keep going.`
            : f.status === "close"
              ? `You'll reach ${fmtC(summary.projectedCorpus)} — ${fmtC(f.shortfall)} short. Increase SIP by ${fmtC(Math.round(f.shortfall / (summary.goalYears * 12)))}/mo or extend 1–2 years.`
              : f.status === "stretch"
                ? `Current plan reaches ${fmtC(summary.projectedCorpus)} (${pct}% of target). To hit ${fmtC(summary.goalTarget)}, you need ${fmtC(f.requiredSipMonthly)}/mo or ${Math.ceil(f.yearsAtCurrentSip)} years.`
                : `${fmtC(summary.goalTarget)} in ${summary.goalYears} years needs ${fmtC(f.requiredSipMonthly)}/mo — your surplus is ${fmtC(summary.totalMonthlySip)}. See the alternatives below.`}
        </p>
      </div>

      {/* Risk warning */}
      {f.riskWarning && (
        <div className="flex gap-2 p-3 rounded-xl bg-orange-500/8 border border-orange-500/20 text-xs text-orange-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {f.riskWarning}
        </div>
      )}

      {/* Alternative scenarios */}
      {f.altScenarios.length > 0 && (
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAlts((v) => !v);
            }}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full text-left"
          >
            <span>{showAlts ? "▲" : "▼"}</span>
            {showAlts ? "Hide" : "Show"} {f.altScenarios.length} alternative
            {f.altScenarios.length > 1 ? "s" : ""} to reach your goal
          </button>
          {showAlts && (
            <div className="mt-3 space-y-2">
              {f.altScenarios.map((alt, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/3 border border-white/8"
                >
                  <p className="text-xs font-semibold text-foreground">
                    {i + 1}. {alt.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {alt.description}
                  </p>
                  <p className="text-[10px] text-amber-400 mt-1 font-medium">
                    → {alt.action}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
