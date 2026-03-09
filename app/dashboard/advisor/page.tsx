"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Sparkles,
  ArrowRight,
  CreditCard,
  Plane,
  ShoppingBag,
  Utensils,
  Fuel,
  CheckCircle2,
  RotateCcw,
  Zap,
  ShieldCheck,
  Globe,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  creditCards,
  calculateInDepthSavings,
  type CreditCard as CardType,
} from "@/lib/credit-cards-data";

type Step = "income" | "spending" | "priorities" | "results";

interface UserProfile {
  income: number;
  monthlySpend: number;
  categories: string[];
  priorities: string[];
}

const spendCategories = [
  { id: "dining", label: "Dining", icon: Utensils },
  { id: "travel", label: "Travel", icon: Plane },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "fuel", label: "Fuel", icon: Fuel },
];

const priorityOptions = [
  { id: "rewards", label: "Maximum Rewards", icon: Zap },
  { id: "lounge", label: "Lounge Access", icon: Plane },
  { id: "forex", label: "Low Forex Markup", icon: Globe },
  { id: "no-fee", label: "No Annual Fee", icon: ShieldCheck },
];

export default function AIAdvisorPage() {
  const [step, setStep] = useState<Step>("income");
  const [profile, setProfile] = useState<UserProfile>({
    income: 0,
    monthlySpend: 0,
    categories: [],
    priorities: [],
  });
  const [recommendations, setRecommendations] = useState<CardType[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleIncomeSubmit = (income: number) => {
    setProfile((prev) => ({ ...prev, income }));
    setStep("spending");
  };

  const handleSpendingSubmit = (monthlySpend: number, categories: string[]) => {
    setProfile((prev) => ({ ...prev, monthlySpend, categories }));
    setStep("priorities");
  };

  const handlePrioritiesSubmit = async (priorities: string[]) => {
    setProfile((prev) => ({ ...prev, priorities }));
    setIsAnalyzing(true);

    // Simulate Deep Market Scan for 2026 variables
    await new Promise((resolve) => setTimeout(resolve, 2200));

    const annualSpend = profile.monthlySpend * 12;

    const scoredCards = creditCards.map((card) => {
      let score = 0;
      const isTravelHeavy = profile.categories.includes("travel");

      // Use the deep auditor engine
      const audit = calculateInDepthSavings(card, annualSpend);

      // 1. Profitability (Primary Weight)
      // 1 point per ₹500 of net profit after GST/Redemption fees
      score += audit.netValue / 500;

      // 2. Priority Alignment
      if (priorities.includes("rewards")) score += audit.yield * 10;
      if (priorities.includes("lounge")) {
        score += card.loungeCap === -1 ? 80 : card.loungeCap * 8;
      }
      if (priorities.includes("forex")) {
        // High score boost for low markup cards (e.g., 0% or 1%)
        score += (4 - card.forexMarkup) * 25;
      }
      if (priorities.includes("no-fee")) {
        if (card.isLtf) score += 100;
        else if (annualSpend >= card.retentionSpendReq) score += 60;
      }

      // 3. Category & Tier Optimization
      if (isTravelHeavy && card.category === "Travel") score += 50;
      if (profile.income >= 3000000 && card.cardTier === "Ultra") score += 60;
      if (profile.income < 1000000 && card.cardTier === "Ultra") score -= 200; // Income eligibility filter

      // 4. 2026 Policy Shield (The "PaisaDekho" Logic)
      // Heavily penalize cards with confirmed 2026 devaluations
      if (card.devaluation2026) score -= 50;

      return { card, score };
    });

    const topCards = scoredCards
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ card }) => card);

    setRecommendations(topCards);
    setIsAnalyzing(false);
    setStep("results");
  };

  const resetAdvisor = () => {
    setStep("income");
    setProfile({ income: 0, monthlySpend: 0, categories: [], priorities: [] });
    setRecommendations([]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-[2rem] bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(212,175,55,0.1)]"
        >
          <Bot className="w-10 h-10 text-gold" />
        </motion.div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">
          AI Card Advisor
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
          The engine audits fee structures, GST, and 2026 policy shifts to
          optimize your wallet.
        </p>
      </div>

      {/* Stepper UI */}
      <div className="flex items-center justify-center gap-3 mb-16">
        {(["income", "spending", "priorities", "results"] as Step[]).map(
          (s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  step === s
                    ? "bg-gold text-black scale-110 shadow-lg shadow-gold/20"
                    : ["income", "spending", "priorities", "results"].indexOf(
                          step,
                        ) > i
                      ? "bg-gold/20 text-gold"
                      : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {["income", "spending", "priorities", "results"].indexOf(step) >
                i ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div
                  className={`w-12 h-[2px] rounded-full ${["income", "spending", "priorities", "results"].indexOf(step) > i ? "bg-gold/40" : "bg-muted"}`}
                />
              )}
            </div>
          ),
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === "income" && <IncomeStep onSubmit={handleIncomeSubmit} />}
        {step === "spending" && (
          <SpendingStep
            onSubmit={handleSpendingSubmit}
            onBack={() => setStep("income")}
          />
        )}
        {step === "priorities" && (
          <PrioritiesStep
            onSubmit={handlePrioritiesSubmit}
            onBack={() => setStep("spending")}
          />
        )}
        {step === "results" && (
          <ResultsStep
            recommendations={recommendations}
            profile={profile}
            isAnalyzing={isAnalyzing}
            onReset={resetAdvisor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Result View with Deep Analytics
function ResultsStep({ recommendations, profile, isAnalyzing, onReset }: any) {
  const annualSpend = profile.monthlySpend * 12;

  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-gold rounded-[2.5rem] p-20 text-center border-gold/10"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 rounded-full border-[3px] border-gold/5 border-t-gold mx-auto mb-10"
        />
        <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
          Analyzing 2026 Market Data
        </h2>
        <p className="text-muted-foreground max-w-xs mx-auto text-sm italic">
          Simulating net profit after 18% GST and redemption leakage...
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-foreground">
          Top Card Pairings
        </h2>
        <p className="text-muted-foreground mt-2">
          Recommended Strategy for your Profile
        </p>
      </div>

      {recommendations.map((card: CardType, index: number) => {
        const audit = calculateInDepthSavings(card, annualSpend);
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className="glass-gold rounded-[2rem] overflow-hidden border-gold/10 hover:border-gold/30 transition-all duration-500"
          >
            <div className="flex flex-col lg:flex-row">
              <div
                className={`relative lg:w-80 h-56 bg-gradient-to-br ${card.imageGradient} p-10 flex flex-col justify-between`}
              >
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 text-white font-serif text-3xl font-bold">
                    #{index + 1}
                  </div>
                  {card.devaluation2026 && (
                    <div className="px-3 py-1 bg-orange-500/20 border border-orange-500/40 rounded-full text-[10px] font-bold text-orange-400 uppercase">
                      Risk Alert
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                    {card.bank}
                  </p>
                  <p className="text-white font-serif text-2xl font-bold leading-tight">
                    {card.name}
                  </p>
                </div>
              </div>

              <div className="flex-1 p-10 flex flex-col justify-between bg-black/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                  <div className="max-w-sm">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-gold mb-2">
                      Market Verdict
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Yielding {audit.yield}% net profit on your spend.
                      Optimized for {card.multiplierChannel} channels.
                    </p>
                  </div>
                  <div className="glass-gold px-8 py-5 rounded-3xl border-gold/20 text-center">
                    <p className="text-[10px] uppercase font-bold text-gold/60 mb-1">
                      Net Annual Profit
                    </p>
                    <p
                      className={`text-3xl font-serif font-bold ${audit.netValue >= 0 ? "text-green-400" : "text-orange-500"}`}
                    >
                      ₹{audit.netValue.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/5">
                  <MiniMetric
                    icon={<Zap className="w-4 h-4" />}
                    label="Rewards"
                    value={`₹${audit.grossRewards.toLocaleString()}`}
                  />
                  <MiniMetric
                    icon={<IndianRupee className="w-4 h-4" />}
                    label="Total Cost"
                    value={`₹${(audit.effectiveFee + audit.redemptionCosts).toLocaleString()}`}
                  />
                  <MiniMetric
                    icon={<Plane className="w-4 h-4" />}
                    label="Lounge"
                    value={
                      card.loungeCap === -1
                        ? "Unlimited"
                        : `${card.loungeCap}/yr`
                    }
                  />
                  <MiniMetric
                    icon={<Globe className="w-4 h-4" />}
                    label="FX Markup"
                    value={`${card.forexMarkup}%`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      <div className="flex flex-col items-center gap-4 pt-10">
        <Button
          onClick={onReset}
          variant="outline"
          className="rounded-full px-10 py-7 border-gold/20 text-gold hover:bg-gold/10 text-lg"
        >
          <RotateCcw className="w-5 h-5 mr-3" /> Start New Audit
        </Button>
      </div>
    </motion.div>
  );
}

// Logic components for previous steps remain as drafted in your snippet
function MiniMetric({ icon, label, value }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-gold/50">
        {icon}
        <span className="text-[10px] uppercase font-black tracking-widest">
          {label}
        </span>
      </div>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function IncomeStep({ onSubmit }: any) {
  const [val, setVal] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-gold p-12 rounded-[2.5rem] border-gold/10"
    >
      <h2 className="text-2xl font-serif font-bold mb-8">
        What is your annual income?
      </h2>
      <Input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="h-16 text-2xl bg-black/40 border-gold/20 mb-6"
        placeholder="e.g. 2500000"
      />
      <Button
        disabled={!val}
        onClick={() => onSubmit(Number(val))}
        className="w-full h-16 bg-gold text-black font-bold text-lg rounded-2xl"
      >
        Evaluate Eligibility <ArrowRight className="ml-2" />
      </Button>
    </motion.div>
  );
}

function SpendingStep({ onSubmit, onBack }: any) {
  const [val, setVal] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-gold p-12 rounded-[2.5rem] border-gold/10"
    >
      <h2 className="text-2xl font-serif font-bold mb-6">
        Monthly Card Spending
      </h2>
      <Input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="h-14 bg-black/20 border-gold/20 mb-8"
        placeholder="e.g. 75000"
      />
      <h3 className="text-sm font-bold uppercase tracking-widest text-gold mb-4">
        Spend Focus
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {spendCategories.map((c) => (
          <button
            key={c.id}
            onClick={() =>
              setCats((p) =>
                p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id],
              )
            }
            className={`p-6 rounded-2xl flex flex-col items-center gap-3 border-2 transition-all ${cats.includes(c.id) ? "bg-gold/20 border-gold text-gold" : "bg-muted/30 border-transparent text-muted-foreground"}`}
          >
            <c.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold">{c.label}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-4">
        <Button variant="ghost" onClick={onBack} className="flex-1 h-14">
          Back
        </Button>
        <Button
          disabled={!val}
          onClick={() => onSubmit(Number(val), cats)}
          className="flex-[2] h-14 bg-gold text-black font-bold"
        >
          Next
        </Button>
      </div>
    </motion.div>
  );
}

function PrioritiesStep({ onSubmit, onBack }: any) {
  const [pri, setPri] = useState<string[]>([]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-gold p-12 rounded-[2.5rem] border-gold/10"
    >
      <h2 className="text-2xl font-serif font-bold mb-8 text-center">
        Your Rewards Priority
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {priorityOptions.map((p) => (
          <button
            key={p.id}
            onClick={() =>
              setPri((x) =>
                x.includes(p.id) ? x.filter((y) => y !== p.id) : [...x, p.id],
              )
            }
            className={`p-6 rounded-2xl flex items-center justify-between border-2 transition-all ${pri.includes(p.id) ? "bg-gold/20 border-gold text-gold" : "bg-muted/30 border-transparent text-muted-foreground"}`}
          >
            <div className="flex items-center gap-4">
              <p.icon className="w-5 h-5" />
              <span className="font-bold text-sm">{p.label}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-4">
        <Button variant="ghost" onClick={onBack} className="flex-1 h-14">
          Back
        </Button>
        <Button
          onClick={() => onSubmit(pri)}
          className="flex-[2] h-14 bg-gold text-black font-bold"
        >
          Run Simulation <Sparkles className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
