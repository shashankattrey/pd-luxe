"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Target,
  ShieldCheck,
  Activity,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Fingerprint,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- THE NEURAL ENGINE DATA ---
const PILLARS = [
  { id: "capacity", label: "Financial Capacity", icon: ShieldCheck },
  { id: "tolerance", label: "Psychological Tolerance", icon: BrainCircuit },
  { id: "horizon", label: "Time Horizon", icon: Target },
  { id: "aversion", label: "Loss Aversion", icon: Activity },
  { id: "experience", label: "Market Experience", icon: Fingerprint },
];

const QUESTIONS = [
  {
    pillar: "capacity",
    question:
      "If your primary income source stopped tomorrow, how many months could you sustain your current lifestyle?",
    options: [
      { label: "Less than 3 months", score: 20 },
      { label: "3 to 12 months", score: 60 },
      { label: "Over 12 months", score: 100 },
    ],
  },
  {
    pillar: "tolerance",
    question:
      "Your portfolio drops 15% in a week due to global events. What is your internal reaction?",
    options: [
      {
        label: "Extreme Anxiety",
        desc: "I want to exit immediately.",
        score: 20,
      },
      { label: "Concerned", desc: "I'll wait but won't add more.", score: 60 },
      {
        label: "Opportunistic",
        desc: "I'm looking for cash to buy the dip.",
        score: 100,
      },
    ],
  },
  {
    pillar: "horizon",
    question:
      "When do you realistically need to withdraw more than 30% of this portfolio?",
    options: [
      { label: "Within 2 years", score: 20 },
      { label: "3 to 7 years", score: 60 },
      { label: "10+ years", score: 100 },
    ],
  },
  {
    pillar: "aversion",
    question: "Choose a bonus structure for your investment:",
    options: [
      { label: "Guaranteed ₹20k", desc: "100% certainty.", score: 20 },
      {
        label: "The Alpha Flip",
        desc: "50% chance at ₹60k, 50% chance at ₹0.",
        score: 80,
      },
    ],
  },
  {
    pillar: "experience",
    question:
      "How did you behave during the last major market correction (e.g., 2020 or 2022)?",
    options: [
      { label: "Didn't invest then", desc: "I am a new entrant.", score: 40 },
      {
        label: "Stayed Invested",
        desc: "I held through the volatility.",
        score: 80,
      },
      {
        label: "Added aggressively",
        desc: "I capitalized on the fear.",
        score: 100,
      },
    ],
  },
];

export default function AdvancedRiskProfiler() {
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isComplete, setIsComplete] = useState(false);

  const handleSelect = (pillar: string, score: number) => {
    const newScores = { ...scores, [pillar]: score };
    setScores(newScores);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  // --- ANALYTICS ENGINE ---
  const analysis = useMemo(() => {
    if (!isComplete) return null;

    const values = Object.values(scores);
    const avgScore = values.reduce((a, b) => a + b, 0) / values.length;

    const radarData = PILLARS.map((p) => ({
      subject: p.label,
      value: scores[p.id] || 0,
      fullMark: 100,
    }));

    // Detect Irrationality: High Goal vs Low Capacity
    const isInconsistent = scores.tolerance > 80 && scores.capacity < 40;

    let profile = {
      label: "Balanced Architect",
      color: "text-amber-400",
      desc: "Stable growth with moderate protection.",
    };
    if (avgScore > 75)
      profile = {
        label: "Aggressive Alpha",
        color: "text-emerald-400",
        desc: "High-octane growth for veteran appetites.",
      };
    if (avgScore < 40)
      profile = {
        label: "Capital Guardian",
        color: "text-blue-400",
        desc: "Preservation-first wealth management.",
      };

    return { radarData, profile, isInconsistent, avgScore };
  }, [isComplete, scores]);

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-gold p-8 md:p-16 rounded-[3rem] border border-white/5 relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <BrainCircuit className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                  Neural Analysis In Progress
                </span>
              </div>
              <span className="font-mono text-amber-400 text-sm">
                {currentStep + 1} / {QUESTIONS.length}
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-12 leading-tight">
              {QUESTIONS[currentStep].question}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {QUESTIONS[currentStep].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    handleSelect(QUESTIONS[currentStep].pillar, opt.score)
                  }
                  className="group p-6 rounded-2xl bg-white/5 border border-white/5 text-left hover:border-gold/40 hover:bg-gold/[0.02] transition-all flex justify-between items-center"
                >
                  <div>
                    <p className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {opt.label}
                    </p>
                    {"desc" in opt && (
                      <p className="text-sm text-white/30">{opt.desc}</p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/10 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* LEFT: RESULTS CARD */}
            <div className="lg:col-span-7 glass-gold p-10 rounded-[3rem] border border-white/10 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">
                  Neural DNA Result
                </p>
                <h2
                  className={cn(
                    "text-6xl font-serif font-bold mb-4",
                    analysis?.profile.color,
                  )}
                >
                  {analysis?.profile.label}
                </h2>
                <p className="text-white/60 mb-10 max-w-md">
                  {analysis?.profile.desc}
                </p>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      data={analysis?.radarData}
                    >
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                      />
                      <Radar
                        name="Investor DNA"
                        dataKey="value"
                        stroke="#D4AF37"
                        fill="#D4AF37"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* RIGHT: INSIGHTS & ACTIONS */}
            <div className="lg:col-span-5 space-y-6">
              {analysis?.isInconsistent && (
                <div className="p-6 rounded-[2rem] bg-orange-500/10 border border-orange-500/20 flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-orange-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-orange-400 uppercase mb-1">
                      Behavioral Mismatch
                    </p>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Your psychological tolerance is high, but your actual
                      financial capacity is limited. We recommend a more
                      conservative buffer.
                    </p>
                  </div>
                </div>
              )}

              <div className="glass-gold p-8 rounded-[2rem] border border-white/5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" /> 2026 Strategy
                </h3>
                <div className="space-y-4">
                  <StrategyRow
                    label="Equity Allocation"
                    value={analysis?.avgScore! > 60 ? "High" : "Moderate"}
                  />
                  <StrategyRow
                    label="Volatility Buffer"
                    value={analysis?.avgScore! < 40 ? "Mandatory" : "Optional"}
                  />
                  <StrategyRow
                    label="Diversification"
                    value="Institutional Grade"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setIsComplete(false);
                    setCurrentStep(0);
                  }}
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl border-white/10 hover:bg-white/5"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset
                </Button>
                <Button className="flex-[2] h-14 rounded-2xl bg-gold hover:bg-white text-black font-black">
                  Deploy Capital
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StrategyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="text-[10px] uppercase font-bold text-white/30">
        {label}
      </span>
      <span className="text-sm font-mono text-white">{value}</span>
    </div>
  );
}
