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
  IndianRupee,
  X,
  CreditCard,
  Banknote,
  Plane,
  Globe,
  Gift,
  Zap,
  Percent,
  ShoppingCart,
  Utensils,
  Hotel,
  Fuel,
  Home,
  Ticket,
  TrendingUp,
  Sliders,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  creditCards,
  calculateInDepthSavings,
  type CreditCard as CardType,
} from "@/lib/credit-cards-data";
import { rankCards } from "@/lib/credit-cards-data";
import MoneySlider from "@/components/ui/moneyslider";

type Step = "income" | "spending" | "travel" | "priorities" | "results";

interface UserProfile {
  income: number;
  monthlySpend: number;
  categories: string[];
  priorities: string[];
  travelFrequency: "rare" | "domestic" | "international";
  rewardPreference: "cashback" | "points" | "miles";
  maxAnnualFee: number;
  existingCards: string[];
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
  const [expanded, setExpanded] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    income: 0,
    monthlySpend: 0,
    categories: [],
    priorities: [],
    travelFrequency: "rare",
    rewardPreference: "cashback",
    maxAnnualFee: 50000,
    existingCards: [],
  });
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);

  const [recommendations, setRecommendations] = useState<CardType[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /* -----------------------------
     STEP HANDLERS
  ------------------------------ */

  const handleIncomeSubmit = (income: number) => {
    setProfile((prev) => ({ ...prev, income }));
    setStep("spending");
  };

  const handleSpendingSubmit = (monthlySpend: number, categories: string[]) => {
    setProfile((prev) => ({ ...prev, monthlySpend, categories }));
    setStep("travel");
  };

  const handleTravelSubmit = (
    travelFrequency: "rare" | "domestic" | "international",
  ) => {
    setProfile((prev) => ({ ...prev, travelFrequency }));
    setStep("priorities");
  };

  const handlePrioritiesSubmit = (priorities: string[]) => {
    const updatedProfile = { ...profile, priorities };
    setProfile(updatedProfile);
    setIsAnalyzing(true);

    setTimeout(() => {
      const annualSpend = updatedProfile.monthlySpend * 12;

      const spendProfile = {
        food: updatedProfile.categories.includes("dining")
          ? annualSpend * 0.25 * 0.6
          : 0,
        shopping: updatedProfile.categories.includes("shopping")
          ? annualSpend * 0.25 * 0.7
          : 0,
        travel: updatedProfile.categories.includes("travel")
          ? annualSpend * 0.25
          : 0,
        utilities: annualSpend * 0.1,
        fuel: updatedProfile.categories.includes("fuel")
          ? annualSpend * 0.1
          : 0,
        rent: annualSpend * 0.2,
        other: annualSpend * 0.05,
      };

      const userIncomeInLakhs = updatedProfile.income / 100000;

      const eligibleCards = creditCards.filter((card) => {
        const incomeOk = userIncomeInLakhs >= (card.minIncomeLakhs || 0);
        const feeOk = card.annualFee <= updatedProfile.maxAnnualFee;
        return incomeOk && feeOk;
      });

      const ranked = rankCards(
        spendProfile,
        updatedProfile.priorities.join(",") || "general",
        eligibleCards,
      );

      const bestCards = ranked.slice(0, 5).map((r) => r.card);

      setRecommendations(bestCards);
      setIsAnalyzing(false);
      setStep("results");
    }, 1500);
  };

  const resetAdvisor = () => {
    setStep("income");
    setProfile({
      income: 0,
      monthlySpend: 0,
      categories: [],
      priorities: [],
      travelFrequency: "rare",
      rewardPreference: "cashback",
      maxAnnualFee: 5000,
      existingCards: [],
    });
    setRecommendations([]);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-10 min-h-screen">
      {/* HEADER */}
      <div className="text-center mb-10 sm:mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-5"
        >
          <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
        </motion.div>

        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
          AI Card Advisor
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xs mx-auto">
          The PaisaDekho engine audits rewards, GST and card policies to
          optimize your wallet.
        </p>
      </div>

      {/* STEPPER */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-16">
        {(
          ["income", "spending", "travel", "priorities", "results"] as Step[]
        ).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold
                ${
                  step === s
                    ? "bg-gold text-black"
                    : [
                          "income",
                          "spending",
                          "travel",
                          "priorities",
                          "results",
                        ].indexOf(step) > i
                      ? "bg-gold/20 text-amber-400"
                      : "bg-muted/50"
                }`}
            >
              {[
                "income",
                "spending",
                "travel",
                "priorities",
                "results",
              ].indexOf(step) > i ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                i + 1
              )}
            </div>
            {i < 4 && <div className="w-12 h-[2px] bg-muted rounded-full" />}
          </div>
        ))}
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
        {step === "travel" && (
          <TravelStep
            onSubmit={handleTravelSubmit}
            onBack={() => setStep("spending")}
          />
        )}
        {step === "priorities" && (
          <PrioritiesStep
            onSubmit={handlePrioritiesSubmit}
            onBack={() => setStep("travel")}
          />
        )}
        {step === "results" && (
          <ResultsStep
            profile={profile}
            recommendations={recommendations}
            isAnalyzing={isAnalyzing}
            onReset={resetAdvisor}
            onCardClick={(card: CardType) => setSelectedCard(card)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedCard && (
          <CardDetailModal
            card={selectedCard}
            profile={profile}
            nextBestCard={recommendations[1]}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* -----------------------------
   SUB-COMPONENTS
------------------------------ */

function IncomeStep({ onSubmit }: { onSubmit: (v: number) => void }) {
  const [income, setIncome] = useState(1200000);

  const presets = [500000, 1000000, 2000000, 3000000];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 sm:p-8 border rounded-3xl bg-black/20"
    >
      <h2 className="text-2xl font-bold mb-8 text-center">
        What is your annual income?
      </h2>

      {/* BIG VALUE DISPLAY */}
      {/* BIG VALUE DISPLAY */}

      {/* SLIDER */}
      <MoneySlider value={income} onChange={setIncome} />

      {/* PRESETS */}
      <div className="flex flex-wrap gap-3 justify-center mb-10">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setIncome(p)}
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
          >
            ₹{(p / 100000).toFixed(0)}L
          </button>
        ))}
      </div>

      {/* CONTINUE BUTTON */}
      <Button onClick={() => onSubmit(income)} className="w-full h-14 text-lg">
        Continue <ArrowRight className="ml-2" />
      </Button>
    </motion.div>
  );
}

function SpendingStep({ onSubmit, onBack }: any) {
  const [spend, setSpend] = useState(50000);
  const [categories, setCategories] = useState<string[]>([]);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 sm:p-8 border rounded-3xl bg-black/20 mb-12"
    >
      <h2 className="text-2xl font-bold mb-6">Monthly Spends & Categories</h2>
      <div className="mb-8">
        <MoneySlider
          value={spend}
          onChange={setSpend}
          min={5000}
          max={200000}
          step={1000}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
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
            className={`p-4 border rounded-xl transition-all ${categories.includes(c.id) ? "border-gold bg-gold/10 text-gold" : "hover:bg-white/5"}`}
          >
            <c.icon className="mx-auto mb-2" size={20} />
            <span className="text-xs font-medium">{c.label}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-4">
        <Button variant="ghost" onClick={onBack} className="flex-1 h-12">
          Back
        </Button>
        <Button
          onClick={() => onSubmit(spend, categories)}
          className="flex-[2] h-12"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}

function TravelStep({ onSubmit, onBack }: any) {
  const [travel, setTravel] = useState<"rare" | "domestic" | "international">(
    "rare",
  );
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 sm:p-8 border rounded-3xl bg-black/20 mb-12"
    >
      <h2 className="text-2xl font-bold mb-6">How often do you travel?</h2>
      <div className="grid gap-4 mb-8">
        {[
          {
            id: "rare",
            label: "Rarely (1-2 times a year)",
            desc: "Low lounge priority",
          },
          {
            id: "domestic",
            label: "Domestic (Monthly)",
            desc: "Lounge & Fuel focus",
          },
          {
            id: "international",
            label: "International",
            desc: "Forex & Miles focus",
          },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setTravel(opt.id as any)}
            className={`p-5 border rounded-xl text-left transition-all ${travel === opt.id ? "border-gold bg-gold/10" : "hover:bg-white/5"}`}
          >
            <p className="font-bold">{opt.label}</p>
            <p className="text-xs text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>
      <div className="flex gap-4 w-full h-14">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={() => onSubmit(travel)} className="flex-[2px] h-10">
          Continue
        </Button>
      </div>
    </motion.div>
  );
}

function PrioritiesStep({ onSubmit, onBack }: any) {
  const [priorities, setPriorities] = useState<string[]>([]);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 sm:p-8 border rounded-3xl bg-black/20 mb-12"
    >
      <h2 className="text-2xl font-bold mb-8">What matters most?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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
            className={`p-5 border rounded-xl flex items-center gap-3 transition-all ${priorities.includes(p.id) ? "border-gold bg-gold/10" : "hover:bg-white/5"}`}
          >
            <p.icon size={18} />
            <span className="font-medium">{p.label}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-4 ">
        <Button variant="ghost" onClick={onBack} className="flex-1 h-14">
          Back
        </Button>
        <Button
          onClick={() => onSubmit(priorities)}
          className="flex-2 h-14 bg-gold text-black hover:bg-amber-400"
        >
          Run Simulation <Sparkles className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function ResultsStep({
  recommendations,
  profile,
  isAnalyzing,
  onReset,
  onCardClick,
}: any) {
  const annualSpend = profile.monthlySpend * 12;

  const spendProfile = {
    food: profile.categories.includes("dining") ? annualSpend * 0.25 * 0.6 : 0,
    shopping: profile.categories.includes("shopping")
      ? annualSpend * 0.25 * 0.7
      : 0,
    travel: profile.categories.includes("travel") ? annualSpend * 0.25 : 0,
    utilities: annualSpend * 0.1,
    fuel: profile.categories.includes("fuel") ? annualSpend * 0.1 : 0,
    rent: annualSpend * 0.2,
    other: annualSpend * 0.05,
  };

  const audit =
    recommendations.length > 0
      ? calculateInDepthSavings(recommendations[0], spendProfile)
      : null;

  return (
    <div className="space-y-6">
      {isAnalyzing && (
        <p className="text-center text-muted-foreground">
          AI analyzing best cards...
        </p>
      )}

      {!isAnalyzing &&
        recommendations.map((card: any, i: number) => {
          const yearlySpend = profile.monthlySpend * 12;
          const projectedValue = Math.round(
            yearlySpend * (card.baseRewardRate / 100),
          );

          return (
            <div
              key={card.name}
              className="cursor-pointer relative"
              onClick={() => onCardClick(card)}
            >
              {i === 0 && (
                <div className="absolute -top-2 right-2 bg-gold text-black text-xs px-2 py-1 rounded-full z-10">
                  #1 Best Match
                </div>
              )}

              {i === 1 && (
                <div className="absolute -top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-10">
                  #2 Alternative
                </div>
              )}

              <CreditCardVisual card={card} value={projectedValue} />
            </div>
          );
        })}

      <Button onClick={onReset} variant="ghost" className="w-full mb-12">
        <RotateCcw className="mr-2 h-4 w-4" />
        Start Over
      </Button>
    </div>
  );
}

function MiniMetric({ icon, label, value }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-wider font-bold mb-1">
        {icon} {label}
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function CardDetailModal({ card, onClose, profile, nextBestCard }: any) {
  const yearlySpend = profile.monthlySpend * 12;

  const projectedValue = Math.round(yearlySpend * (card.baseRewardRate / 100));

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHero card={card} onClose={onClose} />

        <div className="p-5 sm:p-8 space-y-8 sm:space-y-12">
          <AIRecommendationSection card={card} profile={profile} />

          <ValueCalculator
            projectedValue={projectedValue}
            annualFee={card.annualFee}
          />

          <RewardMultipliers card={card} />

          <TravelBenefits card={card} />

          <TransferPartners card={card} />

          {nextBestCard && (
            <ComparisonSection primary={card} competitor={nextBestCard} />
          )}

          <ApplySection card={card} />
        </div>
      </motion.div>
    </motion.div>
  );
}
function Metric({ icon, label, value }: any) {
  return (
    <div className="p-4 border border-white/10 rounded-xl bg-white/5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon} {label}
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
function Section({ title, children }: any) {
  return (
    <div className="mb-10">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function RewardRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3 text-sm">
        {icon}
        {label}
      </div>

      <p className="font-bold text-gold">{value}</p>
    </div>
  );
}
function TransferCard({ name, value }: any) {
  return (
    <div className="border border-white/10 rounded-xl p-4 bg-white/5 flex justify-between">
      <span className="text-sm">{name}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
function CardHero({ card, onClose }: any) {
  return (
    <div className={`p-8 bg-gradient-to-br ${card.imageGradient} relative`}>
      <button
        onClick={onClose}
        className="absolute right-6 top-6 p-2 rounded-lg bg-black/40"
      >
        <X />
      </button>

      <div className="flex justify-between items-end">
        <div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {card.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-xs bg-white/10 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs opacity-80">Network</p>
          <p className="font-bold">{card.network}</p>
        </div>
      </div>
    </div>
  );
}
function AIRecommendationSection({ card, profile }: any) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-gold" />
        <h3 className="text-xl font-bold">Why AI Recommended This</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Insight
          icon={<Utensils />}
          title="Dining Rewards"
          text={`${card.diningRate}% rewards on dining`}
        />

        <Insight
          icon={<Plane />}
          title="Travel Multiplier"
          text={`${card.flightRate}% rewards on flights`}
        />

        <Insight
          icon={<ShoppingCart />}
          title="Shopping Boost"
          text={`${card.amazonRate}% on Amazon`}
        />
      </div>
    </section>
  );
}
function ValueCalculator({ projectedValue, annualFee }: any) {
  const net = projectedValue - annualFee;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="text-green-400" />
        <h3 className="text-xl font-bold">Projected Yearly Value</h3>
      </div>

      <div className="relative h-[320px] w-full max-w-sm mx-auto">
        <Metric label="Reward Earnings" value={`₹${projectedValue}`} />

        <Metric label="Annual Fee" value={`₹${annualFee}`} />

        <Metric label="Net Profit" value={`₹${net}`} highlight />
      </div>
    </section>
  );
}
function RewardMultipliers({ card }: any) {
  const items = [
    { label: "Dining", value: card.diningRate, icon: Utensils },
    { label: "Amazon", value: card.amazonRate, icon: ShoppingCart },
    { label: "Flights", value: card.flightRate, icon: Plane },
    { label: "Hotels", value: card.hotelRate, icon: Hotel },
    { label: "Fuel", value: card.fuelRewardRate, icon: Fuel },
    { label: "Utilities", value: card.utilityRate, icon: Home },
  ];

  return (
    <section>
      <h3 className="text-xl font-bold mb-4">Reward Multipliers</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((i) => (
          <div
            key={i.label}
            className="border border-white/10 rounded-xl p-4 bg-white/5 flex justify-between"
          >
            <div className="flex items-center gap-2">
              <i.icon size={16} />
              {i.label}
            </div>

            <span className="font-bold text-gold">{i.value}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
function TravelBenefits({ card }: any) {
  return (
    <section>
      <h3 className="text-xl font-bold mb-4">Travel Benefits</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Metric
          icon={<Plane />}
          label="Domestic Lounge"
          value={card.domesticLounge}
        />

        <Metric
          icon={<Globe />}
          label="Forex Markup"
          value={`${card.forexMarkup}%`}
        />

        <Metric
          icon={<Ticket />}
          label="Intl Lounge"
          value={card.internationalLounge}
        />
      </div>
    </section>
  );
}
function TransferPartners({ card }: any) {
  if (!card.airlineTransferJson) return null;

  return (
    <section>
      <h3 className="text-xl font-bold mb-4">Airline Transfer Partners</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(
          (card.airlineTransferJson || {}) as Record<string, string>,
        ).map(([name, ratio]) => (
          <div
            key={name}
            className="border border-white/10 rounded-xl p-4 bg-white/5 flex justify-between"
          >
            <span>{name}</span>
            <span className="font-bold">{ratio}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
function ComparisonSection({ primary, competitor }: any) {
  return (
    <section>
      <h3 className="text-xl font-bold mb-6">Compare With Next Best Card</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <CompareCard card={primary} highlight />

        <CompareCard card={competitor} />
      </div>
    </section>
  );
}
function CompareCard({ card, highlight }: any) {
  return (
    <div
      className={`border rounded-xl p-6 ${
        highlight ? "border-gold bg-gold/5" : "border-white/10 bg-white/5"
      }`}
    >
      <h4 className="font-bold mb-3">{card.name}</h4>

      <ul className="text-sm space-y-1">
        <li>Annual Fee: ₹{card.annualFee}</li>
        <li>Dining: {card.diningRate}%</li>
        <li>Flights: {card.flightRate}%</li>
        <li>Forex: {card.forexMarkup}%</li>
      </ul>
    </div>
  );
}
function ApplySection({ card }: any) {
  return (
    <div className="pt-6 border-t border-white/10">
      <button className="w-full bg-gold text-black py-4 rounded-xl font-bold hover:bg-amber-400 transition">
        Apply for {card.name}
      </button>

      {card.notesTnc && (
        <p className="text-xs text-muted-foreground mt-4">{card.notesTnc}</p>
      )}
    </div>
  );
}
function Insight({ icon, title, text }: any) {
  return (
    <div className="border border-white/10 rounded-xl p-5 bg-white/5 hover:bg-white/10 transition">
      <div className="flex items-center gap-2 mb-2 text-gold">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
      </div>

      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
function CreditCardVisual({ card, value }: { card: any; value?: number }) {
  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur px-3 py-1 rounded-full text-xs">
    ₹{value?.toLocaleString() ?? "0"} / yr
  </div>;
  return (
    <div
      className={`relative w-full h-62 rounded-2xl p-5 text-white overflow-hidden bg-gradient-to-br ${card.imageGradient} shadow-lg`}
    >
      {/* metallic shine */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-40" />

      {/* CHIP */}
      <div className="relative z-10 w-10 h-7 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-md mb-4" />

      {/* BANK */}
      <p className="relative z-10 text-xs opacity-80 tracking-wider">
        {card.bank}
      </p>

      {/* CARD NAME */}
      <h3 className="relative z-10 text-lg font-bold tracking-wide mb-4">
        {card.name}
      </h3>

      {/* INFO GRID */}
      <div className="relative z-10 grid grid-cols-3 gap-2 text-xs">
        <div className="bg-black/30 rounded-lg p-2">
          <p className="opacity-70">Annual Fee</p>
          <p className="font-bold">₹{card.annualFee}</p>
        </div>

        <div className="bg-black/30 rounded-lg p-2">
          <p className="opacity-70">Base Rewards</p>
          <p className="font-bold">{card.baseRewardRate}%</p>
        </div>

        <div className="bg-black/30 rounded-lg p-2">
          <p className="opacity-70">Best For</p>
          <p className="font-bold">
            {card.diningRate > card.flightRate ? "Dining" : "Travel"}
          </p>
        </div>
      </div>

      {/* CARD NUMBER */}
      <p className="relative z-10 mt-5 tracking-[0.2em] text-sm">
        •••• •••• •••• 4589
      </p>

      {/* NETWORK */}
      <div className="absolute bottom-6 left-5 right-5 flex justify-between items-center text-xs">
        <span className="opacity-80">VALID THRU 12/29</span>
        <span className="font-semibold tracking-widest">{card.network}</span>
      </div>
      <p className="absolute bottom-2 right-5 text-[10px] opacity-70">
        Tap for more details →
      </p>
    </div>
  );
}

function StackedCard({ card, index, onClick }: any) {
  const offsets = [
    { y: 0, scale: 1, z: 30 },
    { y: 20, scale: 0.95, z: 20 },
    { y: 40, scale: 0.9, z: 10 },
  ];

  const pos = offsets[index] || offsets[2];

  return (
    <motion.div
      style={{ zIndex: pos.z }}
      initial={{ y: pos.y, scale: pos.scale }}
      whileHover={{ y: pos.y - 6 }}
      className="absolute w-full cursor-pointer"
      onClick={onClick}
    >
      <CreditCardVisual card={card} />
    </motion.div>
  );
}
