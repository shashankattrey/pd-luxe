"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Sparkles,
  ArrowRight,
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

  /* -----------------------------
     STEP 1
  ------------------------------ */

  const handleIncomeSubmit = (income: number) => {
    setProfile((prev) => ({ ...prev, income }));
    setStep("spending");
  };

  /* -----------------------------
     STEP 2
  ------------------------------ */

  const handleSpendingSubmit = (monthlySpend: number, categories: string[]) => {
    setProfile((prev) => ({ ...prev, monthlySpend, categories }));
    setStep("priorities");
  };

  /* -----------------------------
     STEP 3 (AI ENGINE)
  ------------------------------ */

  const handlePrioritiesSubmit = async (priorities: string[]) => {
    const updatedProfile = { ...profile, priorities };
    setProfile(updatedProfile);
    setIsAnalyzing(true);

    try {
      const response = await fetch("https://advisor.paisadekho.com/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      // READ ONCE ONLY
      const data = await response.json();
      const aiCards = data?.reply?.cards || [];

      // Improved matching: Check if AI name is inside local card name
      const matchedCards = creditCards.filter((localCard) =>
        aiCards.some(
          (ai: any) =>
            localCard.name.toLowerCase().includes(ai.name.toLowerCase()) ||
            ai.name.toLowerCase().includes(localCard.name.toLowerCase()),
        ),
      );

      setRecommendations(matchedCards);
    } catch (err) {
      console.error("AI advisor error:", err);
      setRecommendations([]); // Fallback to empty
    } finally {
      setIsAnalyzing(false);
      setStep("results");
    }
  };

  const resetAdvisor = () => {
    setStep("income");
    setProfile({
      income: 0,
      monthlySpend: 0,
      categories: [],
      priorities: [],
    });
    setRecommendations([]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      {/* HEADER */}

      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-[2rem] bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6"
        >
          <Bot className="w-10 h-10 text-gold" />
        </motion.div>

        <h1 className="font-serif text-4xl font-bold mb-3">AI Card Advisor</h1>

        <p className="text-muted-foreground">
          The PaisaDekho engine audits rewards, GST and card policies to
          optimize your wallet.
        </p>
      </div>

      {/* STEPPER */}

      <div className="flex items-center justify-center gap-3 mb-16">
        {(["income", "spending", "priorities", "results"] as Step[]).map(
          (s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold
                ${
                  step === s
                    ? "bg-gold text-black"
                    : ["income", "spending", "priorities", "results"].indexOf(
                          step,
                        ) > i
                      ? "bg-gold/20 text-gold"
                      : "bg-muted/50"
                }`}
              >
                {["income", "spending", "priorities", "results"].indexOf(step) >
                i ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  i + 1
                )}
              </div>

              {i < 3 && <div className="w-12 h-[2px] bg-muted rounded-full" />}
            </div>
          ),
        )}
      </div>

      {/* STEP CONTENT */}

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
            profile={profile}
            recommendations={recommendations}
            isAnalyzing={isAnalyzing}
            onReset={resetAdvisor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* -----------------------------
   RESULTS STEP
------------------------------ */

function ResultsStep({ recommendations, profile, isAnalyzing, onReset }: any) {
  const annualSpend = profile.monthlySpend * 12;

  if (isAnalyzing) {
    return (
      <div className="text-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full mx-auto mb-6"
        />

        <h2 className="text-2xl font-bold">Running Deep Market Simulation</h2>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Your Optimized Wallet Strategy</h2>
      </div>

      {recommendations.map((card: CardType, index: number) => {
        const annualSpend = profile.monthlySpend * 12;

        const spendProfile = {
          dining: profile.categories.includes("dining")
            ? annualSpend * 0.25
            : 0,
          travel: profile.categories.includes("travel")
            ? annualSpend * 0.25
            : 0,
          shopping: profile.categories.includes("shopping")
            ? annualSpend * 0.25
            : 0,
          fuel: profile.categories.includes("fuel") ? annualSpend * 0.15 : 0,
          other: annualSpend * 0.1,
        };

        const audit = calculateInDepthSavings(card, spendProfile as any);

        return (
          <div key={card.id} className="border rounded-3xl p-8 bg-black/40">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-muted-foreground">{card.bank}</p>

                <h3 className="text-2xl font-bold">{card.name}</h3>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Net Annual Profit
                </p>

                <p className="text-2xl font-bold text-green-400">
                  ₹{audit.netValue.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <MiniMetric
                icon={<Zap size={16} />}
                label="Rewards"
                value={`₹${audit.grossRewards.toLocaleString()}`}
              />

              <MiniMetric
                icon={<IndianRupee size={16} />}
                label="Fee Cost"
                value={`₹${audit.outflow.toLocaleString()}`}
              />

              <MiniMetric
                icon={<Plane size={16} />}
                label="Lounge"
                value={
                  card.loungeCap === -1 ? "Unlimited" : `${card.loungeCap}/yr`
                }
              />

              <MiniMetric
                icon={<Globe size={16} />}
                label="Forex"
                value={`${card.forexMarkup}%`}
              />
            </div>
          </div>
        );
      })}

      <div className="text-center pt-10">
        <Button onClick={onReset} variant="outline">
          <RotateCcw className="mr-2 w-4 h-4" />
          Start New Audit
        </Button>
      </div>
    </div>
  );
}

/* -----------------------------
   MINI METRIC
------------------------------ */

function MiniMetric({ icon, label, value }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>

      <p className="font-bold">{value}</p>
    </div>
  );
}

/* -----------------------------
   INCOME STEP
------------------------------ */

function IncomeStep({ onSubmit }: any) {
  const [value, setValue] = useState("");

  return (
    <div className="p-10 border rounded-3xl">
      <h2 className="text-2xl font-bold mb-6">What is your annual income?</h2>

      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="2500000"
        className="mb-6"
      />

      <Button disabled={!value} onClick={() => onSubmit(Number(value))}>
        Continue <ArrowRight className="ml-2" />
      </Button>
    </div>
  );
}

/* -----------------------------
   SPENDING STEP
------------------------------ */

function SpendingStep({ onSubmit, onBack }: any) {
  const [value, setValue] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  return (
    <div className="p-10 border rounded-3xl">
      <h2 className="text-2xl font-bold mb-6">Monthly Spending</h2>

      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="75000"
        className="mb-8"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {spendCategories.map((c) => (
          <button
            key={c.id}
            onClick={() =>
              setCategories((prev) =>
                prev.includes(c.id)
                  ? prev.filter((x) => x !== c.id)
                  : [...prev, c.id],
              )
            }
            className={`p-4 border rounded-xl ${
              categories.includes(c.id) ? "border-gold bg-gold/10" : ""
            }`}
          >
            <c.icon className="mx-auto mb-2" size={20} />
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>

        <Button
          disabled={!value}
          onClick={() => onSubmit(Number(value), categories)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

/* -----------------------------
   PRIORITIES STEP
------------------------------ */

function PrioritiesStep({ onSubmit, onBack }: any) {
  const [priorities, setPriorities] = useState<string[]>([]);

  return (
    <div className="p-10 border rounded-3xl">
      <h2 className="text-2xl font-bold mb-8">Select your priorities</h2>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {priorityOptions.map((p) => (
          <button
            key={p.id}
            onClick={() =>
              setPriorities((prev) =>
                prev.includes(p.id)
                  ? prev.filter((x) => x !== p.id)
                  : [...prev, p.id],
              )
            }
            className={`p-5 border rounded-xl flex items-center gap-3 ${
              priorities.includes(p.id) ? "border-gold bg-gold/10" : ""
            }`}
          >
            <p.icon size={18} />
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>

        <Button onClick={() => onSubmit(priorities)}>
          Run Simulation <Sparkles className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
