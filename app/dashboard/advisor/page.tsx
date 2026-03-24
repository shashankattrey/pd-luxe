"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  X,
  Plane,
  Globe,
  Zap,
  ShoppingCart,
  Utensils,
  Fuel,
  TrendingUp,
  FileText,
  ClipboardList,
  AlertCircle,
  Wallet,
  Star,
  Lock,
  Receipt,
  Info,
  ArrowUpRight,
  CircleCheck,
  TriangleAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  creditCards,
  calculateInDepthSavings,
  recommendFromStatement,
  getMerchantRate,
  rankCards,
  deriveMaxFee,
  type CreditCard as CardType,
  type SpendProfile,
  type StatementAnalysis,
  type CardAudit,
  type ParsedTransaction,
  type MerchantCategory,
  analyseStatement,
  type CreditCard,
} from "@/lib/credit-cards-data";
import MoneySlider from "@/components/ui/moneyslider";
import StatementUpload from "@/components/StatementUpload";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
  | "landing"
  | "income"
  | "spending"
  | "travel"
  | "priorities"
  | "results";
type InputMode = "statement" | "questionnaire" | null;

interface UserProfile {
  income: number;
  monthlySpend: number;
  categories: string[];
  priorities: string[];
  travelFrequency: "rare" | "domestic" | "international";
  maxAnnualFee: number;
}

const defaultProfile: UserProfile = {
  income: 0,
  monthlySpend: 0,
  categories: [],
  priorities: [],
  travelFrequency: "rare",
  maxAnnualFee: 50000,
};

// Each wizard step has a distinct accent color
const STEP_COLORS: Record<string, string> = {
  income: "#f59e0b",
  spending: "#10b981",
  travel: "#38bdf8",
  priorities: "#a78bfa",
};

const MERCHANT_META: Record<
  string,
  { icon: any; label: string; color: string; bg: string }
> = {
  swiggy: {
    icon: Utensils,
    label: "Swiggy",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  zomato: {
    icon: Utensils,
    label: "Zomato",
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
  dining: {
    icon: Utensils,
    label: "Dining",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  grocery: {
    icon: ShoppingBag,
    label: "Grocery",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  amazon: {
    icon: ShoppingCart,
    label: "Amazon",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  flipkart: {
    icon: ShoppingCart,
    label: "Flipkart",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  shopping_online: {
    icon: ShoppingCart,
    label: "Shopping",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  utility: {
    icon: Zap,
    label: "Bills & OTT",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  fuel: {
    icon: Fuel,
    label: "Fuel",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  flight: {
    icon: Plane,
    label: "Flights",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
  hotel: {
    icon: Globe,
    label: "Hotels",
    color: "text-teal-400",
    bg: "bg-teal-400/10",
  },
  rent: {
    icon: Wallet,
    label: "Rent",
    color: "text-slate-400",
    bg: "bg-slate-400/10",
  },
  other: {
    icon: Sparkles,
    label: "Other",
    color: "text-zinc-400",
    bg: "bg-zinc-400/10",
  },
};

// Rank visual system: #1=gold, #2=silver, #3=bronze, rest=neutral
const RANK_STYLES = [
  {
    badge: "bg-amber-400 text-black",
    border: "border-amber-400/35",
    bg: "from-amber-400/8 to-transparent",
    label: "★ Best Match",
  },
  {
    badge: "bg-slate-600 text-slate-100",
    border: "border-slate-500/30",
    bg: "from-slate-500/6 to-transparent",
    label: "#2 Runner-up",
  },
  {
    badge: "bg-amber-900/70 text-amber-200",
    border: "border-amber-700/25",
    bg: "from-amber-900/8 to-transparent",
    label: "#3",
  },
  {
    badge: "bg-white/10 text-white/50",
    border: "border-white/8",
    bg: "from-white/[0.02] to-transparent",
    label: "#4",
  },
  {
    badge: "bg-white/8 text-white/40",
    border: "border-white/6",
    bg: "",
    label: "#5",
  },
];

// Rate → color: high=green, mid=amber, low=red
function rateColor(rate: number): string {
  if (rate >= 10) return "#10b981";
  if (rate >= 5) return "#f59e0b";
  if (rate >= 2) return "#fb923c";
  return "#ef4444";
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function AIAdvisorPage() {
  const [step, setStep] = useState<Step>("landing");
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [recommendations, setRecommendations] = useState<CardType[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [statementResult, setStatementResult] = useState<{
    analysis: StatementAnalysis;
    topCards: Array<{ card: CreditCard; audit: CardAudit; score: number }>;
    maxFee: number;
    categoryKeyword: string;
  } | null>(null);
  const [activeSpend, setActiveSpend] = useState<SpendProfile | null>(null);

  const handleStatementParsed = (parsedData: any) => {
    const txns = (parsedData.transactions ?? []).map((t: any) => ({
      date: t.date ?? "",
      description: t.description ?? t.narration ?? "",
      amount: t.amount ?? 0,
      type: t.type ?? "debit",
      category: t.category ?? "other",
      balance: t.balance ?? null,
    }));
    setSheetOpen(false);
    setIsAnalyzing(true);
    setStep("results");
    setTimeout(() => {
      const result = recommendFromStatement(txns, undefined, null);
      setStatementResult(result);
      setActiveSpend(result.analysis.spendProfile);
      const cats: string[] = [];
      if (result.analysis.spendProfile.food > 0) cats.push("dining");
      if (result.analysis.spendProfile.shopping > 0) cats.push("shopping");
      if (result.analysis.spendProfile.travel > 0) cats.push("travel");
      if (result.analysis.spendProfile.fuel > 0) cats.push("fuel");
      setProfile({
        ...defaultProfile,
        monthlySpend: Math.round(parsedData.summary?.total_debits ?? 0),
        categories: cats,
        travelFrequency: cats.includes("travel") ? "domestic" : "rare",
        income: parsedData.metadata?.income ?? parsedData.meta?.income ?? 0,
        maxAnnualFee: result.maxFee,
      });
      setRecommendations(result.topCards.map((r) => r.card));
      setIsAnalyzing(false);
    }, 1400);
  };

  const handleIncomeSubmit = (income: number) => {
    setProfile((p) => ({ ...p, income }));
    setStep("spending");
  };
  const handleSpendingSubmit = (monthlySpend: number, categories: string[]) => {
    setProfile((p) => ({ ...p, monthlySpend, categories }));
    setStep("travel");
  };
  const handleTravelSubmit = (
    travelFrequency: "rare" | "domestic" | "international",
  ) => {
    setProfile((p) => ({ ...p, travelFrequency }));
    setStep("priorities");
  };

  const handlePrioritiesSubmit = (priorities: string[]) => {
    const updated = { ...profile, priorities };
    setProfile(updated);
    setIsAnalyzing(true);
    setStep("results");
    setTimeout(() => {
      const monthly = updated.monthlySpend;
      const sp: SpendProfile = {
        food: updated.categories.includes("dining") ? monthly * 0.2 : 0,
        shopping: updated.categories.includes("shopping") ? monthly * 0.2 : 0,
        travel: updated.categories.includes("travel") ? monthly * 0.2 : 0,
        fuel: updated.categories.includes("fuel") ? monthly * 0.1 : 0,
        utilities: monthly * 0.1,
        rent: monthly * 0.15,
        other: monthly * 0.05,
        grocery: updated.categories.includes("grocery") ? monthly * 0.15 : 0,
      };
      setActiveSpend(sp);
      const maxFee = deriveMaxFee(monthly);
      const catKeyword = updated.categories.includes("dining")
        ? "food"
        : updated.categories.includes("shopping")
          ? "shopping"
          : updated.categories.includes("travel")
            ? "travel"
            : updated.categories.includes("fuel")
              ? "fuel"
              : "general";
      const eligible = creditCards.filter(
        (c) =>
          (updated.income === 0 ||
            updated.income / 100_000 >= (c.minIncomeLakhs || 0)) &&
          c.annualFee <= maxFee,
      );
      const finalEligible =
        eligible.length >= 3
          ? eligible
          : creditCards.filter((c) => c.annualFee <= maxFee * 2);
      setRecommendations(
        rankCards(sp, catKeyword, finalEligible)
          .slice(0, 5)
          .map((r) => r.card),
      );
      setIsAnalyzing(false);
    }, 1500);
  };

  const resetAdvisor = () => {
    setStep("landing");
    setProfile(defaultProfile);
    setRecommendations([]);
    setInputMode(null);
    setStatementResult(null);
    setActiveSpend(null);
  };

  if (step === "results")
    return (
      <ResultsPage
        recommendations={recommendations}
        profile={profile}
        isAnalyzing={isAnalyzing}
        activeSpend={activeSpend}
        statementResult={statementResult}
        onReset={resetAdvisor}
        onCardClick={setSelectedCard}
        selectedCard={selectedCard}
        onCloseCard={() => setSelectedCard(null)}
      />
    );

  return (
    <div className="w-full max-w-md mx-auto px-4 py-10 min-h-screen relative">
      {/* Ambient glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl"
          style={{ background: "rgba(245,158,11,0.05)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl"
          style={{ background: "rgba(16,185,129,0.04)" }}
        />
      </div>

      {/* Header */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Bot icon with pulsing live ring */}
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-[1.5rem] border border-amber-400/20 animate-ping opacity-25" />
          <div className="w-16 h-16 rounded-[1.5rem] bg-amber-400/10 border border-amber-400/20 flex items-center justify-center relative">
            <Bot className="w-8 h-8 text-amber-400" />
          </div>
        </div>
        <h1 className="font-serif text-3xl font-bold mb-2 tracking-tight">
          AI Card Advisor
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          The PaisaDekho engine audits rewards, GST, caps and card policies to
          maximise your wallet.
        </p>
      </motion.div>

      {inputMode === "questionnaire" && step !== "landing" && (
        <StepBar step={step} />
      )}

      <AnimatePresence mode="wait">
        {(step === "landing" || step === "income") && !inputMode && (
          <LandingStep
            key="landing"
            onUpload={() => setSheetOpen(true)}
            onQuestionnaire={() => {
              setInputMode("questionnaire");
              setStep("income");
            }}
          />
        )}
        {step === "income" && inputMode === "questionnaire" && (
          <IncomeStep key="income" onSubmit={handleIncomeSubmit} />
        )}
        {step === "spending" && (
          <SpendingStep
            key="spending"
            onSubmit={handleSpendingSubmit}
            onBack={() => setStep("income")}
          />
        )}
        {step === "travel" && (
          <TravelStep
            key="travel"
            onSubmit={handleTravelSubmit}
            onBack={() => setStep("spending")}
          />
        )}
        {step === "priorities" && (
          <PrioritiesStep
            key="priorities"
            onSubmit={handlePrioritiesSubmit}
            onBack={() => setStep("travel")}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSheetOpen(false);
                setInputMode(null);
              }}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/10 rounded-t-3xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div
                className="px-5 pt-4 pb-10 max-w-lg mx-auto"
                style={{
                  paddingBottom: "max(2.5rem,env(safe-area-inset-bottom))",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold">Upload Bank Statement</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      SBI · HDFC · ICICI · Kotak · BOB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSheetOpen(false);
                      setInputMode(null);
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <StatementUpload onDataParsed={handleStatementParsed} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── STEP BAR — circular with per-step colors ─────────────────────────────────

const STEP_LIST: Step[] = [
  "income",
  "spending",
  "travel",
  "priorities",
  "results",
];
const STEP_LABELS = ["Income", "Spending", "Travel", "Priorities"];

function StepBar({ step }: { step: Step }) {
  const idx = STEP_LIST.indexOf(step);
  return (
    <div className="flex items-start justify-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const done = idx > i;
        const active = idx === i;
        const color = Object.values(STEP_COLORS)[i];
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={
                  active
                    ? {
                        background: color,
                        color: "#000",
                        boxShadow: `0 0 12px ${color}50`,
                      }
                    : done
                      ? { background: `${color}20`, color }
                      : {
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.3)",
                        }
                }
              >
                {done ? <CircleCheck className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className="text-[9px] font-medium"
                style={{ color: active ? color : "rgba(255,255,255,0.3)" }}
              >
                {label}
              </span>
            </div>
            {i < 3 && (
              <div
                className="w-8 h-px mt-[-12px] mx-1 rounded-full"
                style={{
                  background: done ? `${color}50` : "rgba(255,255,255,0.08)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── WIZARD CARD — per-step color identity ────────────────────────────────────

function WizardCard({
  step,
  children,
}: {
  step: Step;
  children: React.ReactNode;
}) {
  const color = STEP_COLORS[step] ?? "#f59e0b";
  return (
    <div
      className="rounded-3xl border border-white/10 overflow-hidden relative"
      style={{ background: "rgba(0,0,0,0.3)" }}
    >
      <div
        className="h-0.5"
        style={{
          background: `linear-gradient(90deg,${color},${color}44,transparent)`,
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%,${color}10,transparent)`,
        }}
      />
      <div className="relative p-6">{children}</div>
    </div>
  );
}

function StepLabel({ step, number }: { step: Step; number: number }) {
  const color = STEP_COLORS[step] ?? "#f59e0b";
  return (
    <p
      className="text-xs font-bold mb-2 uppercase tracking-[0.18em]"
      style={{ color }}
    >
      Step {number} of 4
    </p>
  );
}

// ─── LANDING ──────────────────────────────────────────────────────────────────

function LandingStep({
  onUpload,
  onQuestionnaire,
}: {
  onUpload: () => void;
  onQuestionnaire: () => void;
}) {
  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="space-y-4"
    >
      <button
        onClick={onUpload}
        className="w-full group relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-400/12 to-amber-600/6 p-5 text-left hover:border-amber-400/70 transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/6 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-white">Upload Bank Statement</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/25 text-amber-400 font-bold">
                RECOMMENDED
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The engine reads every transaction, detects P2P transfers, maps
              merchants, applies caps and finds the card that earns most on your
              real spend.
            </p>
            <div className="mt-3 flex gap-2 flex-wrap">
              {["SBI", "HDFC", "ICICI", "Kotak", "BOB"].map((b) => (
                <span
                  key={b}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
        <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-xs text-white/30 font-medium">
          or answer 4 questions
        </span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      <button
        onClick={onQuestionnaire}
        className="w-full p-4 rounded-2xl border border-white/10 bg-white/4 hover:bg-white/8 transition-all text-left flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
          <ClipboardList className="w-6 h-6 text-white/60" />
        </div>
        <div>
          <p className="font-bold text-sm">Fill Questionnaire</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Income · spend · categories · priorities · 2 min
          </p>
        </div>
        <ArrowRight className="ml-auto w-4 h-4 text-white/30" />
      </button>

      {/* Engine metric counters — not plain chips */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[
          { num: "93", label: "Cards", sub: "2026 dataset", color: "#f59e0b" },
          {
            num: "P2P",
            label: "Filtered",
            sub: "real spend only",
            color: "#10b981",
          },
          {
            num: "Cap",
            label: "Aware",
            sub: "monthly limits",
            color: "#a78bfa",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-white/8 p-3 text-center relative overflow-hidden"
            style={{ background: `${c.color}08` }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{
                background: `linear-gradient(90deg,${c.color},transparent)`,
              }}
            />
            <p className="text-base font-bold" style={{ color: c.color }}>
              {c.num}
            </p>
            <p className="text-[10px] font-semibold text-white/70 mt-0.5">
              {c.label}
            </p>
            <p className="text-[9px] text-white/30">{c.sub}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── INCOME STEP ──────────────────────────────────────────────────────────────

function IncomeStep({ onSubmit }: { onSubmit: (v: number) => void }) {
  const [income, setIncome] = useState(1200000);
  return (
    <motion.div
      key="income"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <WizardCard step="income">
        <StepLabel step="income" number={1} />
        <h2 className="text-2xl font-bold mb-2">Annual Income</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Used only to filter cards you're eligible for — not stored anywhere.
        </p>
        <MoneySlider value={income} onChange={setIncome} />
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {[300000, 500000, 1000000, 2000000, 3000000, 5000000].map((p) => (
            <button
              key={p}
              onClick={() => setIncome(p)}
              className={`px-3 py-1.5 rounded-full border text-xs transition-all ${income === p ? "border-amber-400 bg-amber-400/10 text-amber-400" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
            >
              ₹{p >= 100000 ? `${p / 100000}L` : `${p / 1000}k`}
            </button>
          ))}
        </div>
        <Button
          onClick={() => onSubmit(income)}
          className="w-full h-13 text-base bg-amber-400 text-black hover:bg-amber-300"
        >
          Continue <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </WizardCard>
    </motion.div>
  );
}

// ─── SPENDING STEP ────────────────────────────────────────────────────────────

function SpendingStep({ onSubmit, onBack }: any) {
  const [spend, setSpend] = useState(50000);
  const [categories, setCategories] = useState<string[]>([]);
  const color = STEP_COLORS.spending;
  const cats = [
    {
      id: "dining",
      label: "Dining & Food",
      icon: Utensils,
      desc: "Swiggy, Zomato, restaurants",
    },
    {
      id: "travel",
      label: "Travel",
      icon: Plane,
      desc: "Flights, hotels, cabs",
    },
    {
      id: "shopping",
      label: "Shopping",
      icon: ShoppingBag,
      desc: "Amazon, Flipkart, online",
    },
    { id: "fuel", label: "Fuel", icon: Fuel, desc: "Petrol, diesel" },
  ];
  return (
    <motion.div
      key="spending"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="mb-12"
    >
      <WizardCard step="spending">
        <StepLabel step="spending" number={2} />
        <h2 className="text-2xl font-bold mb-2">Monthly Spend</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Total card-eligible spend including online shopping, groceries,
          dining.
        </p>
        <div className="mb-8">
          <MoneySlider
            value={spend}
            onChange={setSpend}
            min={5000}
            max={300000}
            step={1000}
          />
        </div>
        <p className="text-xs text-muted-foreground mb-3 font-medium">
          Where do you spend most? (select all)
        </p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {cats.map((c) => {
            const sel = categories.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() =>
                  setCategories((p) =>
                    p.includes(c.id)
                      ? p.filter((x) => x !== c.id)
                      : [...p, c.id],
                  )
                }
                className="p-4 border rounded-xl transition-all text-left relative overflow-hidden"
                style={
                  sel
                    ? {
                        borderColor: `${color}50`,
                        background: `${color}10`,
                        boxShadow: `0 0 12px ${color}18`,
                      }
                    : {
                        border: "1px solid rgba(255,255,255,0.09)",
                        background: "rgba(255,255,255,0.03)",
                      }
                }
              >
                {sel && (
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: color }}
                  />
                )}
                {sel && (
                  <CircleCheck
                    className="absolute top-2.5 right-2.5 w-3.5 h-3.5"
                    style={{ color }}
                  />
                )}
                <c.icon
                  className="mb-2 w-5 h-5"
                  style={sel ? { color } : { color: "rgba(255,255,255,0.4)" }}
                />
                <p className="text-sm font-bold" style={sel ? { color } : {}}>
                  {c.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {c.desc}
                </p>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex-1 h-12 border border-white/10"
          >
            Back
          </Button>
          <Button
            onClick={() => onSubmit(spend, categories)}
            className="flex-[2] h-12 text-black font-bold"
            style={{ background: color }}
          >
            Continue
          </Button>
        </div>
      </WizardCard>
    </motion.div>
  );
}

// ─── TRAVEL STEP ─────────────────────────────────────────────────────────────

function TravelStep({ onSubmit, onBack }: any) {
  const [travel, setTravel] = useState<"rare" | "domestic" | "international">(
    "rare",
  );
  const color = STEP_COLORS.travel;
  const opts = [
    {
      id: "rare",
      label: "Rarely travel",
      sub: "1–2 trips/year. Lounge not a priority.",
      icon: "🏠",
    },
    {
      id: "domestic",
      label: "Frequent domestic",
      sub: "Monthly flights. Lounge & fuel matter.",
      icon: "✈️",
    },
    {
      id: "international",
      label: "International",
      sub: "Overseas trips. Zero-forex & miles critical.",
      icon: "🌏",
    },
  ];
  return (
    <motion.div
      key="travel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="mb-12"
    >
      <WizardCard step="travel">
        <StepLabel step="travel" number={3} />
        <h2 className="text-2xl font-bold mb-2">Travel Habits</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Affects lounge, forex and airline miles weighting.
        </p>
        <div className="grid gap-3 mb-8">
          {opts.map((o) => {
            const sel = travel === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setTravel(o.id as any)}
                className="p-4 border rounded-xl text-left flex items-center gap-4 transition-all relative overflow-hidden"
                style={
                  sel
                    ? {
                        borderColor: `${color}50`,
                        background: `${color}10`,
                        boxShadow: `0 0 16px ${color}15`,
                      }
                    : {
                        border: "1px solid rgba(255,255,255,0.09)",
                        background: "rgba(255,255,255,0.03)",
                      }
                }
              >
                {sel && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5"
                    style={{ background: color }}
                  />
                )}
                <span className="text-2xl">{o.icon}</span>
                <div className="flex-1">
                  <p className="font-bold" style={sel ? { color } : {}}>
                    {o.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {o.sub}
                  </p>
                </div>
                {sel && (
                  <CircleCheck className="w-4 h-4 shrink-0" style={{ color }} />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex-1 h-12 border border-white/10"
          >
            Back
          </Button>
          <Button
            onClick={() => onSubmit(travel)}
            className="flex-[2] h-12 text-black font-bold"
            style={{ background: color }}
          >
            Continue
          </Button>
        </div>
      </WizardCard>
    </motion.div>
  );
}

// ─── PRIORITIES STEP ──────────────────────────────────────────────────────────

function PrioritiesStep({ onSubmit, onBack }: any) {
  const [priorities, setPriorities] = useState<string[]>([]);
  const color = STEP_COLORS.priorities;
  const opts = [
    {
      id: "rewards",
      label: "Max Rewards",
      sub: "Highest cashback / points yield",
      icon: Zap,
    },
    {
      id: "lounge",
      label: "Lounge Access",
      sub: "Domestic & international airports",
      icon: Plane,
    },
    {
      id: "forex",
      label: "Low Forex",
      sub: "No markup on international spends",
      icon: Globe,
    },
    {
      id: "no-fee",
      label: "Zero Annual Fee",
      sub: "Lifetime free only",
      icon: ShieldCheck,
    },
  ];
  return (
    <motion.div
      key="priorities"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="mb-12"
    >
      <WizardCard step="priorities">
        <StepLabel step="priorities" number={4} />
        <h2 className="text-2xl font-bold mb-2">Priorities</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Select all that matter. The engine weights scoring accordingly.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {opts.map((p) => {
            const sel = priorities.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() =>
                  setPriorities((prev) =>
                    prev.includes(p.id)
                      ? prev.filter((x) => x !== p.id)
                      : [...prev, p.id],
                  )
                }
                className="p-4 border rounded-xl text-left transition-all relative overflow-hidden"
                style={
                  sel
                    ? {
                        borderColor: `${color}50`,
                        background: `${color}10`,
                        boxShadow: `0 0 12px ${color}18`,
                      }
                    : {
                        border: "1px solid rgba(255,255,255,0.09)",
                        background: "rgba(255,255,255,0.03)",
                      }
                }
              >
                {sel && (
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: color }}
                  />
                )}
                {sel && (
                  <CircleCheck
                    className="absolute top-2.5 right-2.5 w-3.5 h-3.5"
                    style={{ color }}
                  />
                )}
                <p.icon
                  className="w-5 h-5 mb-2"
                  style={sel ? { color } : { color: "rgba(255,255,255,0.4)" }}
                />
                <p className="text-sm font-bold" style={sel ? { color } : {}}>
                  {p.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {p.sub}
                </p>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex-1 h-14 border border-white/10"
          >
            Back
          </Button>
          <Button
            onClick={() => onSubmit(priorities)}
            className="flex-[2] h-14 text-black font-bold"
            style={{ background: color }}
          >
            <Sparkles className="mr-2 w-4 h-4" /> Run Engine
          </Button>
        </div>
      </WizardCard>
    </motion.div>
  );
}

// ─── RESULTS PAGE ─────────────────────────────────────────────────────────────

function ResultsPage({
  recommendations,
  profile,
  isAnalyzing,
  activeSpend,
  statementResult,
  onReset,
  onCardClick,
  selectedCard,
  onCloseCard,
}: any) {
  const sp: SpendProfile = activeSpend ?? {
    food: 0,
    shopping: 0,
    travel: 0,
    utilities: 0,
    fuel: 0,
    rent: 0,
    other: profile.monthlySpend * 0.5,
    grocery: 0,
  };
  const analysis = statementResult?.analysis;
  const monthlyIncome = profile.income > 0 ? profile.income / 12 : null;
  const topNetVal =
    !isAnalyzing && recommendations.length
      ? calculateInDepthSavings(recommendations[0], sp).netValue
      : null;

  return (
    <div className="min-h-screen bg-[#080808] relative">
      {/* Ambient glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl"
          style={{ background: "rgba(245,158,11,0.04)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl"
          style={{ background: "rgba(16,185,129,0.03)" }}
        />
      </div>

      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 border-b border-white/8 px-4 py-3 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(180deg,rgba(8,8,8,0.98),rgba(8,8,8,0.92))",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold">Engine Results</p>
            <p className="text-[10px] text-muted-foreground">
              {statementResult
                ? `${recommendations.length} cards · statement analysis`
                : `${recommendations.length} cards · questionnaire`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {topNetVal !== null && (
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${topNetVal >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}
            >
              Best: ₹{topNetVal.toLocaleString("en-IN")}/yr
            </span>
          )}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
          >
            <RotateCcw className="w-3 h-3" /> Restart
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6 pb-24 relative">
        {/* Analyzing */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="font-bold text-white">Engine running…</p>
              <p className="text-xs text-muted-foreground mt-1">
                Auditing 93 cards · applying monthly caps · checking income
                eligibility
              </p>
            </div>
          </div>
        )}

        {!isAnalyzing && (
          <>
            {/* Statement summary — asymmetric: max-earn is hero */}
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-2"
              >
                {/* Total — neutral */}
                <div className="rounded-xl bg-white/4 border border-white/8 p-3">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">
                    Total
                  </p>
                  <p className="text-sm font-bold">
                    ₹{analysis.totalSpend.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[9px] text-white/25 mt-0.5">this month</p>
                </div>
                {/* Rewardable — amber accent */}
                <div
                  className="rounded-xl border p-3 relative overflow-hidden"
                  style={{
                    borderColor: "rgba(245,158,11,0.25)",
                    background: "rgba(245,158,11,0.06)",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                      background: "linear-gradient(90deg,#f59e0b,transparent)",
                    }}
                  />
                  <p className="text-[9px] text-amber-400/70 uppercase tracking-widest mb-1">
                    Rewardable
                  </p>
                  <p className="text-sm font-bold text-amber-400">
                    ₹{analysis.rewardableSpend.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[9px] text-white/25 mt-0.5">excl. P2P</p>
                </div>
                {/* Max earn — green hero, larger number */}
                <div
                  className="rounded-xl border p-3 relative overflow-hidden"
                  style={{
                    borderColor: "rgba(16,185,129,0.30)",
                    background: "rgba(16,185,129,0.08)",
                    boxShadow: "0 0 16px rgba(16,185,129,0.08)",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                      background: "linear-gradient(90deg,#10b981,transparent)",
                    }}
                  />
                  <p className="text-[9px] text-emerald-400/70 uppercase tracking-widest mb-1">
                    Max earn
                  </p>
                  <p className="text-xl font-bold text-emerald-400 leading-tight">
                    ₹
                    {Math.round(analysis.totalPotentialRewards).toLocaleString(
                      "en-IN",
                    )}
                  </p>
                  <p className="text-[9px] text-white/25 mt-0.5">
                    best card/txn
                  </p>
                </div>
              </motion.div>
            )}

            {/* Income eligibility */}
            {monthlyIncome !== null && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-xl border border-blue-500/20 bg-blue-500/6 p-4 flex items-start gap-3"
              >
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-300 mb-1">
                    Income Eligibility Filter
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    ₹{(profile.income / 100000).toFixed(1)}L/yr → ₹
                    {Math.round(monthlyIncome).toLocaleString("en-IN")}/mo.
                    Cards requiring higher income are hidden.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Category breakdown */}
            {analysis && analysis.categoryBreakdown.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/8 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/8">
                  <p className="text-xs font-bold text-white/45 uppercase tracking-widest">
                    Spend by category · best card per merchant
                  </p>
                </div>
                <div className="divide-y divide-white/5">
                  {analysis.categoryBreakdown.slice(0, 6).map((cat: any) => {
                    const meta =
                      MERCHANT_META[cat.merchant] ?? MERCHANT_META.other;
                    const Icon = meta.icon;
                    const maxSpend = Math.max(
                      ...analysis.categoryBreakdown.map(
                        (c: any) => c.totalSpend,
                      ),
                    );
                    const barPct = Math.min(
                      100,
                      (cat.totalSpend / maxSpend) * 100,
                    );
                    return (
                      <div key={cat.merchant} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}
                          >
                            <Icon className={`w-4 h-4 ${meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-xs font-bold">{meta.label}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-400 font-bold">
                                  {cat.bestCard?.name
                                    ?.split(" ")
                                    .slice(0, 2)
                                    .join(" ")}{" "}
                                  {cat.bestRate.toFixed(1)}%
                                </span>
                                <p className="text-xs font-bold text-emerald-400">
                                  +₹{Math.round(cat.bestReward)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-white/25"
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground shrink-0">
                                ₹{cat.totalSpend.toLocaleString("en-IN")} ·{" "}
                                {cat.txnCount} txn
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 bg-white/2 border-t border-white/5">
                  <p className="text-[10px] text-white/25 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    P2P transfers & bank charges excluded — credit cards earn ₹0
                    on these
                  </p>
                </div>
              </motion.div>
            )}

            {/* Card recommendations */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/8" />
                <p className="text-xs font-bold text-white/35 uppercase tracking-widest">
                  Top card matches
                </p>
                <div className="flex-1 h-px bg-white/8" />
              </div>
              <div className="space-y-5">
                {recommendations.map((card: CardType, i: number) => {
                  const audit = calculateInDepthSavings(card, sp);
                  const incomeInLakhs =
                    profile.income > 0 ? profile.income / 100_000 : null;
                  const incomeGap =
                    incomeInLakhs !== null &&
                    card.minIncomeLakhs > 0 &&
                    incomeInLakhs < card.minIncomeLakhs
                      ? card.minIncomeLakhs - incomeInLakhs
                      : 0;
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * i }}
                      className="relative cursor-pointer group"
                      onClick={() => onCardClick(card)}
                    >
                      {i < 3 && (
                        <div className="absolute -top-2.5 left-4 z-10">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${RANK_STYLES[i].badge}`}
                          >
                            {RANK_STYLES[i].label}
                          </span>
                        </div>
                      )}
                      <CardChip
                        card={card}
                        audit={audit}
                        incomeGap={incomeGap}
                        rank={i + 1}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedCard && (
          <CardDetailModal
            card={selectedCard}
            profile={profile}
            activeSpend={activeSpend}
            statementResult={statementResult}
            onClose={onCloseCard}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CARD CHIP ────────────────────────────────────────────────────────────────

function CardChip({
  card,
  audit,
  incomeGap,
  rank,
}: {
  card: CardType;
  audit: ReturnType<typeof calculateInDepthSavings>;
  incomeGap: number;
  rank: number;
}) {
  const rs = RANK_STYLES[Math.min(rank - 1, RANK_STYLES.length - 1)];
  const bestFor = (() => {
    const rates: [string, number][] = [
      [
        "Dining",
        Math.max(
          card.diningRate ?? 0,
          card.swiggyRate ?? 0,
          card.zomatoRate ?? 0,
        ),
      ],
      ["Shopping", Math.max(card.amazonRate ?? 0, card.flipkartRate ?? 0)],
      ["Travel", Math.max(card.flightRate ?? 0, card.hotelRate ?? 0)],
      ["Fuel", card.fuelRewardRate ?? 0],
      ["Utility", card.utilityRate ?? 0],
    ];
    const best = rates.reduce((a, b) => (b[1] > a[1] ? b : a));
    return best[1] > (card.baseRewardRate ?? 0) ? best[0] : "General";
  })();

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all group-hover:border-white/25 bg-gradient-to-br ${rs.bg} ${rs.border}`}
      style={{
        boxShadow: rank === 1 ? "0 0 28px rgba(245,158,11,0.10)" : undefined,
      }}
    >
      {/* Card gradient header */}
      <div
        className={`bg-gradient-to-r ${card.imageGradient} px-4 py-3.5 flex items-center justify-between`}
      >
        <div>
          <p className="text-[10px] opacity-65">{card.bank}</p>
          <p className="font-bold text-sm">{card.name}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] opacity-60">Net/yr</p>
          <p
            className={`font-bold text-xl ${audit.netValue >= 0 ? "text-white" : "text-red-300"}`}
          >
            ₹{audit.netValue.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* 3-col stats — simplified and readable */}
      <div className="px-4 py-3 grid grid-cols-3 gap-3 text-center border-b border-white/6">
        {[
          {
            label: "Annual fee",
            val:
              card.annualFee === 0
                ? "Free"
                : `₹${card.annualFee.toLocaleString()}`,
            color: card.annualFee === 0 ? "text-emerald-400" : "text-white/80",
          },
          {
            label: "Eff. yield",
            val: `${audit.effectiveRewardRate}%`,
            color: "text-amber-400",
          },
          { label: "Best for", val: bestFor, color: "text-white/75" },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-[9px] text-white/35 mb-1">{s.label}</p>
            <p className={`text-xs font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Status pill row */}
      <div className="px-4 py-2.5 flex items-center justify-between flex-wrap gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {audit.feeWaived && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400 flex items-center gap-1">
              <CircleCheck className="w-2.5 h-2.5" /> Fee waived
            </span>
          )}
          {incomeGap > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 flex items-center gap-1">
              <TriangleAlert className="w-2.5 h-2.5" /> Need ₹
              {incomeGap.toFixed(1)}L more
            </span>
          )}
          {card.rewardCap !== "No Cap" && card.rewardCap && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/40 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Cap: {card.rewardCap}
            </span>
          )}
        </div>
        <span className="text-[10px] text-white/25 group-hover:text-amber-400 transition-colors">
          Details →
        </span>
      </div>
    </div>
  );
}

// ─── CARD DETAIL MODAL ────────────────────────────────────────────────────────

function CardDetailModal({
  card,
  onClose,
  profile,
  activeSpend,
  statementResult,
}: any) {
  const [showAllTxn, setShowAllTxn] = useState(false);
  const sp: SpendProfile = activeSpend ?? {
    food: profile.categories?.includes("dining")
      ? profile.monthlySpend * 0.2
      : 0,
    shopping: profile.categories?.includes("shopping")
      ? profile.monthlySpend * 0.2
      : 0,
    travel: profile.categories?.includes("travel")
      ? profile.monthlySpend * 0.2
      : 0,
    utilities: profile.monthlySpend * 0.1,
    fuel: profile.categories?.includes("fuel") ? profile.monthlySpend * 0.1 : 0,
    rent: profile.monthlySpend * 0.15,
    other: profile.monthlySpend * 0.05,
  };
  const audit = calculateInDepthSavings(card, sp);
  const incomeInLakhs = profile.income > 0 ? profile.income / 100_000 : null;
  const monthlyIncome = profile.income > 0 ? profile.income / 12 : null;
  const incomeGap =
    incomeInLakhs !== null &&
    card.minIncomeLakhs > 0 &&
    incomeInLakhs < card.minIncomeLakhs
      ? card.minIncomeLakhs - incomeInLakhs
      : 0;
  const requiredMonthly =
    card.minIncomeLakhs > 0 ? (card.minIncomeLakhs * 100000) / 12 : 0;

  const txnInsights: any[] = statementResult
    ? statementResult.analysis.insights
        .filter((ins: any) => ins.isRewardable && ins.transaction.amount > 0)
        .map((ins: any) => ({
          ...ins,
          thisCardRate: getMerchantRate(card, ins.merchant),
          thisCardReward:
            (ins.transaction.amount * getMerchantRate(card, ins.merchant)) /
            100,
        }))
        .filter((ins: any) => ins.thisCardReward > 0)
        .sort((a: any, b: any) => b.thisCardReward - a.thisCardReward)
    : [];
  const totalMonthlyFromCard = txnInsights.reduce(
    (s: number, i: any) => s + i.thisCardReward,
    0,
  );

  const hasCap =
    card.rewardCap !== "No Cap" &&
    card.rewardCap !== "" &&
    card.rewardCap !== undefined;
  const capMonthly = (() => {
    if (!hasCap) return null;
    const s = card.rewardCap.toLowerCase();
    const mult = s.includes("l") ? 100000 : s.includes("k") ? 1000 : 1;
    const n = parseFloat(s.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n * mult;
  })();

  const rateRows = [
    { merchant: "swiggy" as const, label: "Swiggy / Zomato", monthly: sp.food },
    {
      merchant: "utility" as const,
      label: "Bills & OTT",
      monthly: sp.utilities,
    },
    {
      merchant: "amazon" as const,
      label: "Amazon / Flipkart",
      monthly: sp.shopping,
    },
    { merchant: "flight" as const, label: "Flights", monthly: sp.travel },
    { merchant: "fuel" as const, label: "Fuel", monthly: sp.fuel },
    { merchant: "dining" as const, label: "Dining", monthly: sp.food },
  ]
    .filter((r) => r.monthly > 0)
    .map((r) => ({
      ...r,
      rate: getMerchantRate(card, r.merchant),
      reward: (r.monthly * getMerchantRate(card, r.merchant)) / 100,
    }))
    .sort((a, b) => b.reward - a.reward)
    .slice(0, 5);

  const visibleTxn = showAllTxn ? txnInsights : txnInsights.slice(0, 5);

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#0d0d0d] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero gradient header */}
        <div className={`bg-gradient-to-br ${card.imageGradient} p-6 relative`}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-xl bg-black/40 hover:bg-black/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="pr-10">
            <p className="text-xs opacity-60 mb-1 tracking-widest">
              {card.bank}
            </p>
            <h2 className="text-2xl font-bold mb-3">{card.name}</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {card.tags?.map((tag: string) => (
              <span
                key={tag}
                className="text-[10px] bg-black/30 px-2 py-1 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur px-3 py-1.5 rounded-xl text-center">
            <p className="text-[9px] text-white/50 uppercase">Net/yr</p>
            <p
              className={`text-lg font-bold ${audit.netValue >= 0 ? "text-white" : "text-red-300"}`}
            >
              ₹{audit.netValue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Income eligibility */}
          {incomeGap > 0 ? (
            <div className="rounded-xl bg-amber-400/8 border border-amber-400/25 p-4 flex items-start gap-3">
              <TriangleAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-400 mb-1">
                  Income requirement not met
                </p>
                <p className="text-xs text-white/60 leading-relaxed">
                  Requires ₹{card.minIncomeLakhs}L/yr (₹
                  {Math.round(requiredMonthly).toLocaleString("en-IN")}/mo).
                  Gap: ₹{incomeGap.toFixed(1)}L — you may still apply if income
                  has grown recently.
                </p>
              </div>
            </div>
          ) : (
            incomeInLakhs !== null &&
            card.minIncomeLakhs > 0 && (
              <div className="rounded-xl bg-emerald-400/6 border border-emerald-400/20 p-3 flex items-center gap-3">
                <CircleCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-white/60">
                  Income eligible — requires ₹{card.minIncomeLakhs}L/yr, you
                  qualify.
                </p>
              </div>
            )
          )}

          {/* P&L — color-coded by type */}
          <ModalSection
            icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
            title="Annual P&L"
            color="#10b981"
          >
            <div className="grid grid-cols-3 gap-2 mb-3">
              {audit.breakdown.map((b) => (
                <div
                  key={b.label}
                  className="p-3 rounded-xl border text-center"
                  style={
                    b.plus
                      ? {
                          borderColor: "rgba(16,185,129,0.25)",
                          background: "rgba(16,185,129,0.07)",
                        }
                      : {
                          borderColor: "rgba(239,68,68,0.25)",
                          background: "rgba(239,68,68,0.07)",
                        }
                  }
                >
                  <p className="text-[9px] text-white/40 mb-1">{b.label}</p>
                  <p
                    className={`text-sm font-bold ${b.plus ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {b.plus ? "+" : "−"}₹{b.value.toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-3.5 rounded-xl border border-amber-400/25 bg-amber-400/8 flex justify-between items-center">
              <span className="text-sm font-bold">Net Annual Value</span>
              <span
                className={`text-xl font-bold ${audit.netValue >= 0 ? "text-amber-400" : "text-red-400"}`}
              >
                ₹{audit.netValue.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-white/35">
              <span>Yield: {audit.effectiveRewardRate}% on spend</span>
              <span>
                Break-even: ₹
                {audit.breakEvenMonthlySpend.toLocaleString("en-IN")}/mo
              </span>
            </div>
            {audit.feeWaived && (
              <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1.5">
                <CircleCheck className="w-3.5 h-3.5" />
                Fee waived — spend exceeds ₹
                {(card.retentionSpendReq / 100000).toFixed(1)}L/yr threshold
              </p>
            )}
          </ModalSection>

          {/* Reward cap */}
          {hasCap && (
            <ModalSection
              icon={<Lock className="w-4 h-4 text-amber-400" />}
              title="Reward Cap"
              color="#f59e0b"
            >
              <div className="rounded-xl bg-white/4 border border-white/8 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Monthly cap</span>
                  <span className="font-bold text-amber-400">
                    ₹{capMonthly?.toLocaleString("en-IN") ?? card.rewardCap}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Annual cap (×12)</span>
                  <span className="font-bold">
                    ₹
                    {capMonthly
                      ? (capMonthly * 12).toLocaleString("en-IN")
                      : "—"}
                  </span>
                </div>
                {capMonthly && audit.grossRewards > capMonthly * 12 && (
                  <div className="pt-2 border-t border-white/8 text-xs text-amber-400 flex items-center gap-2">
                    <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
                    Projected rewards exceed cap. Actual: ₹
                    {(capMonthly * 12).toLocaleString("en-IN")}.
                  </div>
                )}
                {capMonthly && audit.grossRewards <= capMonthly * 12 && (
                  <div className="pt-2 border-t border-white/8 text-xs text-emerald-400 flex items-center gap-2">
                    <CircleCheck className="w-3.5 h-3.5 shrink-0" />
                    Spend stays within cap — full rewards earned.
                  </div>
                )}
              </div>
            </ModalSection>
          )}

          {/* Rates on your spend — color interpolated bars */}
          {rateRows.length > 0 && (
            <ModalSection
              icon={<Sparkles className="w-4 h-4 text-amber-400" />}
              title="Rates on Your Spend"
              color="#f59e0b"
            >
              <div className="space-y-2">
                {rateRows.map((r) => {
                  const meta = MERCHANT_META[r.merchant] ?? MERCHANT_META.other;
                  const Icon = meta.icon;
                  const color = rateColor(r.rate);
                  const barPct = Math.min(100, (r.rate / 20) * 100);
                  return (
                    <div
                      key={r.merchant}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/4"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium">{r.label}</span>
                          <span className="text-xs font-bold" style={{ color }}>
                            +₹{Math.round(r.reward)}/mo
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${barPct}%`, background: color }}
                            />
                          </div>
                          <span
                            className="text-[10px] font-bold shrink-0"
                            style={{ color }}
                          >
                            {r.rate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ModalSection>
          )}

          {/* Per-transaction — no nested scroll, show/hide toggle */}
          {txnInsights.length > 0 && (
            <ModalSection
              icon={<Receipt className="w-4 h-4 text-blue-400" />}
              title={`Your Transactions · +₹${Math.round(totalMonthlyFromCard)}/mo`}
              color="#3b82f6"
            >
              <div className="space-y-1.5">
                {visibleTxn.map((ins: any, idx: number) => {
                  const meta =
                    MERCHANT_META[ins.merchant] ?? MERCHANT_META.other;
                  const Icon = meta.icon;
                  const isBest = ins.bestCard?.id === card.id;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl"
                      style={
                        isBest
                          ? {
                              background: "rgba(16,185,129,0.07)",
                              border: "1px solid rgba(16,185,129,0.15)",
                            }
                          : { background: "rgba(255,255,255,0.03)" }
                      }
                    >
                      <Icon className={`w-3.5 h-3.5 ${meta.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">
                          {ins.transaction.description.slice(0, 32)}
                        </p>
                        <p className="text-[10px] text-white/30">
                          ₹{ins.transaction.amount.toLocaleString("en-IN")} ·{" "}
                          {ins.thisCardRate.toFixed(1)}%
                          {isBest
                            ? " · ✓ best card"
                            : ins.bestCard
                              ? ` · ${ins.bestCard.name.split(" ").slice(-1)[0]} earns more`
                              : ""}
                        </p>
                      </div>
                      <p className="text-[11px] font-bold text-emerald-400 shrink-0">
                        +₹{Math.round(ins.thisCardReward)}
                      </p>
                    </div>
                  );
                })}
              </div>
              {txnInsights.length > 5 && (
                <button
                  onClick={() => setShowAllTxn((v) => !v)}
                  className="w-full mt-2 py-2 text-xs text-white/40 hover:text-white transition-colors flex items-center justify-center gap-1"
                >
                  {showAllTxn ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show fewer
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show {txnInsights.length - 5} more
                    </>
                  )}
                </button>
              )}
              <div className="mt-2.5 p-3 rounded-xl border border-amber-400/20 bg-amber-400/8 flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">
                  Total monthly with this card
                </span>
                <span className="text-sm font-bold text-amber-400">
                  ₹{Math.round(totalMonthlyFromCard)}
                </span>
              </div>
            </ModalSection>
          )}

          {/* Travel perks — semantic color: good=green, neutral=default */}
          <ModalSection
            icon={<Plane className="w-4 h-4 text-sky-400" />}
            title="Travel Benefits"
            color="#38bdf8"
          >
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Dom. Lounge",
                  val: String(card.domesticLounge),
                  good:
                    parseInt(String(card.domesticLounge)) > 0 ||
                    String(card.domesticLounge)
                      .toLowerCase()
                      .includes("unlimit"),
                },
                {
                  label: "Intl Lounge",
                  val: String(card.internationalLounge),
                  good:
                    parseInt(String(card.internationalLounge)) > 0 ||
                    String(card.internationalLounge)
                      .toLowerCase()
                      .includes("unlimit"),
                },
                {
                  label: "Forex markup",
                  val: `${card.forexMarkup}%`,
                  good: card.forexMarkup === 0,
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="p-3 rounded-xl border text-center"
                  style={
                    m.good
                      ? {
                          borderColor: "rgba(16,185,129,0.25)",
                          background: "rgba(16,185,129,0.06)",
                        }
                      : {
                          borderColor: "rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                        }
                  }
                >
                  <p className="text-[9px] text-white/35 mb-1">{m.label}</p>
                  <p
                    className={`text-sm font-bold ${m.good ? "text-emerald-400" : "text-white/75"}`}
                  >
                    {m.val}
                  </p>
                </div>
              ))}
            </div>
          </ModalSection>

          {/* Fee waiver */}
          {card.retentionSpendReq > 0 && (
            <div className="rounded-xl bg-white/4 border border-white/8 p-4 text-xs space-y-1.5">
              <p className="font-bold text-white/65 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Annual Fee Waiver
              </p>
              <p className="text-white/50 leading-relaxed">
                Fee of ₹{card.annualFee.toLocaleString()} waived at ₹
                {(card.retentionSpendReq / 100000).toFixed(1)}L/yr (₹
                {Math.round(card.retentionSpendReq / 12).toLocaleString(
                  "en-IN",
                )}
                /mo).
                {audit.feeWaived
                  ? " ✓ Your spend qualifies."
                  : " Your spend does not qualify."}
              </p>
            </div>
          )}

          {/* Welcome / milestone */}
          {(card.joiningBenefit !== "N/A" ||
            card.milestoneBenefit !== "None") && (
            <div className="space-y-2">
              {card.joiningBenefit !== "N/A" && (
                <div className="p-3 rounded-xl bg-white/4 border border-white/8 text-xs">
                  <span className="text-amber-400 font-bold">Welcome: </span>
                  <span className="text-white/60">{card.joiningBenefit}</span>
                </div>
              )}
              {card.milestoneBenefit !== "None" && (
                <div className="p-3 rounded-xl bg-white/4 border border-white/8 text-xs">
                  <span className="text-blue-400 font-bold">Milestone: </span>
                  <span className="text-white/60">{card.milestoneBenefit}</span>
                </div>
              )}
            </div>
          )}

          {card.notesTnc && (
            <p className="text-[11px] text-white/30 leading-relaxed flex items-start gap-1.5">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              {card.notesTnc}
            </p>
          )}

          {/* Apply CTA with context reminder */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">{card.bank}</p>
                <p className="text-sm font-bold">{card.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Net/yr</p>
                <p
                  className={`text-lg font-bold ${audit.netValue >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  ₹{audit.netValue.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <button className="w-full bg-amber-400 text-black py-3.5 rounded-xl font-bold hover:bg-amber-300 active:scale-[0.98] transition-all text-sm">
              Apply for {card.name} →
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── MODAL SECTION HEADER ─────────────────────────────────────────────────────

function ModalSection({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-sm font-bold">{title}</p>
      </div>
      <div
        className="mb-4 h-px"
        style={{ background: `linear-gradient(90deg,${color}40,transparent)` }}
      />
      {children}
    </section>
  );
}
