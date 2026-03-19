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
  CreditCard,
  Plane,
  Globe,
  Zap,
  ShoppingCart,
  Utensils,
  Hotel,
  Fuel,
  Home,
  Ticket,
  TrendingUp,
  FileText,
  ClipboardList,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  creditCards,
  calculateInDepthSavings,
  type CreditCard as CardType,
  rankCards,
} from "@/lib/credit-cards-data";
import MoneySlider from "@/components/ui/moneyslider";
import StatementUpload from "@/components/StatementUpload";

// ─────────────────────────────────────────────────────────────
type Step = "income" | "spending" | "travel" | "priorities" | "results";
type InputMode = "statement" | "questionnaire";

interface BankAccount {
  id: string;
  bankName: string;
  accountType: string;
  lastFour?: string;
  statementData?: any; // Store the parsed spend profile here
}
interface UserProfile {
  income: number;
  monthlySpend: number;
  categories: string[];
  priorities: string[];
  travelFrequency: "rare" | "domestic" | "international";
  rewardPreference: "cashback" | "points" | "miles";
  maxAnnualFee: number;
  existingCards: string[];
  accounts: BankAccount[];
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

const defaultProfile: UserProfile = {
  income: 0,
  monthlySpend: 0,
  categories: [],
  priorities: [],
  travelFrequency: "rare",
  rewardPreference: "cashback",
  maxAnnualFee: 50000,
  existingCards: [],
  accounts: [],
};

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function AIAdvisorPage() {
  const [step, setStep] = useState<Step>("income");
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [recommendations, setRecommendations] = useState<CardType[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Bottom sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode | null>(null);

  // ── Statement parsed — run analysis immediately, skip travel+priorities ──
  const handleStatementParsed = (parsedData: any) => {
    const txns: any[] = parsedData.transactions ?? [];

    // ── Categories that can NEVER earn credit card rewards ────────────────
    const NON_REWARDABLE_CATS = new Set([
      "transfers_and_p2p",
      "bank_charges_and_taxes",
    ]);

    // ── Narration-based P2P / non-rewardable detection ────────────────────
    // The AI sometimes mis-categorises large UPI person-to-person transfers
    // as "other" or even "shopping". We apply a second pass on the raw narration
    // to catch these. A transaction is treated as non-rewardable if:
    //   (a) Its category is already transfers_and_p2p / bank_charges_and_taxes, OR
    //   (b) The narration looks like a person-to-person UPI (personal name, phone
    //       number UPI handle) and amount ≥ ₹500, OR
    //   (c) It matches known non-merchant patterns (bank charges, EMI, loan, etc.)
    const isNonRewardable = (t: any): boolean => {
      // Already correctly categorised
      if (NON_REWARDABLE_CATS.has(t.category)) return true;

      const narr: string = (t.description ?? t.narration ?? "").toUpperCase();
      const amt: number = t.amount ?? 0;

      // Bank-generated charges
      if (
        /AMB\s*CHRG|ANNUAL\s*FEE|BANK\s*CHG|GST\s*CHG|PENALTY|LOAN\s*EMI|EMI\s*DEB/.test(
          narr,
        )
      )
        return true;

      // NEFT/IMPS credits don't matter for debits — but NEFT debits to individuals
      if (
        /^NEFT\s+DR/.test(narr) &&
        !/INSURANCE|POLICY|MUTUAL\s*FUND/.test(narr)
      )
        return true;

      // Gambling / lottery
      if (/MATKA|LOTTERY|SATTA|BETWAY|DREAM\s*11|RUMMY/.test(narr)) return true;

      // UPI to a person (not a business / merchant)
      // Heuristic: UPI narration that contains a personal-name handle AND
      // NOT a known merchant/business keyword AND amount ≥ ₹200
      if (/^UPI-/.test(narr) && amt >= 200) {
        // Known merchant/business signals — these ARE rewardable
        const MERCHANT_SIGNALS = [
          "AMAZON",
          "FLIPKART",
          "SWIGGY",
          "ZOMATO",
          "NETFLIX",
          "HOTSTAR",
          "APPLE",
          "GOOGLE",
          "JIO",
          "AIRTEL",
          "BSNL",
          "VODAFONE",
          "IDEA",
          "ELECTRICITY",
          "BESCOM",
          "MSEB",
          "TNERC",
          "BSES",
          "NPCL",
          "HPCL",
          "BPCL",
          "INDIAN OIL",
          "IOCL",
          "HP PETROL",
          "ESSAR",
          "INDIGO",
          "AIR INDIA",
          "SPICEJET",
          "AKASA",
          "GOAIR",
          "VISTARA",
          "IRCTC",
          "RAILWAYS",
          "REDBUS",
          "OYO",
          "MAKEMYTRIP",
          "CLEARTRIP",
          "YATRA",
          "GOIBIBO",
          "UBER",
          "OLA",
          "RAPIDO",
          "RELIANCE",
          "TATA",
          "BIGBASKET",
          "JIOMART",
          "DMART",
          "NYKAA",
          "MYNTRA",
          "MEESHO",
          "AJIO",
          "CROMA",
          "DECATHLON",
          "PAYTM",
          "PHONEPE",
          "GPAY", // keep — these are often merchant aggregators
          "INSURANCE",
          "LIC",
          "SBI LIFE",
          "HDFC LIFE",
          "ICICI PRUDENTIAL",
          "MUTUAL FUND",
          "ZERODHA",
          "GROWW",
          "UPSTOX",
          "DOMINOS",
          "MCDONALD",
          "KFC",
          "PIZZA",
          "CAFE",
          "RESTAURANT",
          "OUTLET",
          "STORE",
          "SHOP",
          "MART",
          "BAKERY",
          "MOMOS",
          "NESCAFE",
          "INFOCOM", // JIO
          "MEDIA SERVICES", // Apple
          "TIMES", // newspaper
        ];

        const isMerchant = MERCHANT_SIGNALS.some((s) => narr.includes(s));
        if (isMerchant) return false;

        // UPI handle patterns that strongly indicate P2P:
        //   person@okicici, person@okhdfcbank, person@ybl, phone@ibl, etc.
        //   where "person" looks like a name (letters + digits, no merchant keywords)
        const P2P_HANDLE_RE =
          /UPI-[A-Z\s]+-[A-Z0-9]+@(OKICICI|OKHDFCBANK|OKAXIS|YBL|IBL|PAYTM(?:QR)?|YESB0|AIRP|UBIN|SBIN|BARB|PUNB|UTIB|CITIN|HDFCBANK)/;
        // If the handle after @ is a banking UPI handle (not PTYS/MCHUPI which are Paytm merchant)
        const isMerchantPaytmHandle =
          /PAYTMQR[A-Z0-9]+@PTYS|@PTYS|@YESB0PTMUPI|@YESB0MCHUPI|MERUPI/.test(
            narr,
          );

        if (!isMerchantPaytmHandle && P2P_HANDLE_RE.test(narr)) return true;

        // Additional heuristic: large round-number transfers to individuals
        // that match personal name pattern (no brand/outlet in name)
        if (amt >= 1000 && !isMerchant) {
          // If narration is just "UPI-FIRSTNAME LASTNAME-handle" with no business name
          const nameMatch = narr.match(/^UPI-([A-Z ]+)-[A-Z0-9@.]+/);
          if (nameMatch) {
            const name = nameMatch[1].trim();
            // If name looks like a person (1-3 words, no ALL_CAPS brand patterns)
            const wordCount = name.split(/\s+/).length;
            if (
              wordCount <= 3 &&
              !/LTD|PVT|CORP|BANK|INFOCOM|INDIA|SERVICES|OUTLET|STORE/.test(
                name,
              )
            ) {
              return true;
            }
          }
        }
      }

      return false;
    };

    // ── Rewardable debit transactions only ───────────────────────────────
    const rewardableDebits = txns.filter(
      (t: any) => t.type === "debit" && !isNonRewardable(t),
    );

    const sumCat = (...keys: string[]) =>
      rewardableDebits
        .filter((t: any) => keys.includes(t.category))
        .reduce((s: number, t: any) => s + (t.amount ?? 0), 0);

    // Monthly rewardable amounts — split travel_and_utilities correctly
    const monthlyFood = sumCat("food_and_dining");
    const monthlyShopping = sumCat("shopping_and_ecommerce");
    const monthlyTravel = sumCat("travel");
    const monthlyUtilities = sumCat("utilities", "travel_and_utilities");
    const monthlyFuel = sumCat("fuel");
    const monthlyRent = sumCat("rent");
    const monthlyOther = rewardableDebits
      .filter(
        (t: any) =>
          ![
            "food_and_dining",
            "shopping_and_ecommerce",
            "travel",
            "utilities",
            "travel_and_utilities",
            "fuel",
            "rent",
          ].includes(t.category),
      )
      .reduce((s: number, t: any) => s + (t.amount ?? 0), 0);

    const monthlyRewardable =
      monthlyFood +
      monthlyShopping +
      monthlyTravel +
      monthlyFuel +
      monthlyRent +
      monthlyUtilities +
      monthlyOther;

    // Total gross debits from summary (for display only)
    const monthlySpend = Math.round(parsedData.summary?.total_debits ?? 0);

    // Monthly spend profile — calculateInDepthSavings multiplies by *12 internally
    const sp = {
      food: monthlyFood,
      shopping: monthlyShopping,
      travel: monthlyTravel,
      utilities: monthlyUtilities,
      fuel: monthlyFuel,
      rent: monthlyRent,
      other: monthlyOther,
    };

    // Deduplicate UI categories (for display chips)
    const rawCats = rewardableDebits
      .map((t: any) => {
        if (t.category === "food_and_dining") return "dining";
        if (t.category === "shopping_and_ecommerce") return "shopping";
        if (t.category === "travel" || t.category === "travel_and_utilities")
          return "travel";
        if (t.category === "fuel") return "fuel";
        return null;
      })
      .filter(Boolean) as string[];
    const categories = [...new Set(rawCats)];

    // ── maxAnnualFee based strictly on REWARDABLE spend ───────────────────
    // Key insight: a person with ₹4k rewardable/month cannot justify a ₹500 fee
    // card — the card would need to return >₹500/yr which requires substantial spend.
    let maxAnnualFee: number;
    if (monthlyRewardable < 2_000)
      maxAnnualFee = 0; // LTF only
    else if (monthlyRewardable < 8_000) maxAnnualFee = 500;
    else if (monthlyRewardable < 20_000) maxAnnualFee = 1_500;
    else if (monthlyRewardable < 50_000) maxAnnualFee = 3_000;
    else if (monthlyRewardable < 125_000) maxAnnualFee = 5_000;
    else maxAnnualFee = 10_000;

    // Category keyword: biggest rewardable category (must be >15% of rewardable)
    const catAmounts: [string, number][] = [
      ["food", sp.food],
      ["shopping", sp.shopping],
      ["travel", sp.travel],
      ["fuel", sp.fuel],
    ];
    const [topCatKey, topCatAmt] = catAmounts.sort((a, b) => b[1] - a[1])[0];
    const categoryKeyword =
      monthlyRewardable > 0 && topCatAmt / monthlyRewardable > 0.15
        ? topCatKey
        : "general";

    const updatedProfile: UserProfile = {
      ...defaultProfile,
      monthlySpend,
      categories,
      travelFrequency: categories.includes("travel") ? "domestic" : "rare",
      income: parsedData.metadata?.income ?? parsedData.meta?.income ?? 0,
      maxAnnualFee,
      priorities: [],
    };

    setProfile(updatedProfile);
    setSheetOpen(false);
    setIsAnalyzing(true);
    setStep("results");

    setTimeout(() => {
      let eligible = creditCards.filter((c) => c.annualFee <= maxAnnualFee);

      // Fallback: relax fee cap if too few cards qualify
      if (eligible.length < 3)
        eligible = creditCards.filter((c) => c.annualFee <= maxAnnualFee * 2);
      if (eligible.length < 3)
        eligible = creditCards.filter((c) => c.isLtf || c.annualFee === 0);

      const ranked = rankCards(sp, categoryKeyword, eligible);
      setRecommendations(ranked.slice(0, 5).map((r) => r.card));
      setIsAnalyzing(false);
    }, 1200);
  };

  // ── Step handlers ─────────────────────────────────────────
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

    setTimeout(() => {
      const monthly = updated.monthlySpend;

      const hasFood = updated.categories.includes("dining");
      const hasShopping = updated.categories.includes("shopping");
      const hasTravel = updated.categories.includes("travel");
      const hasFuel = updated.categories.includes("fuel");

      // FIX: percentages now sum to 1.0 across all allocated categories
      // Old code allocated fixed fractions (0.2+0.2+0.25+0.1+0.1+0.15+0.05 = 1.05 — overflow)
      const sp = {
        food: hasFood ? monthly * 0.2 : 0,
        shopping: hasShopping ? monthly * 0.2 : 0,
        travel: hasTravel ? monthly * 0.2 : 0,
        fuel: hasFuel ? monthly * 0.1 : 0,
        utilities: monthly * 0.1,
        rent: monthly * 0.15,
        other: monthly * 0.05,
      };

      let maxFee: number;
      if (monthly < 5_000) maxFee = 0;
      else if (monthly < 15_000) maxFee = 500;
      else if (monthly < 30_000) maxFee = 1_500;
      else if (monthly < 60_000) maxFee = 3_000;
      else if (monthly < 150_000) maxFee = 5_000;
      else maxFee = 10_000;

      const effectiveMaxFee = Math.max(maxFee, updated.maxAnnualFee ?? 0);

      // Category keyword from selected categories + priorities
      const priorityStr = priorities.join(",").toLowerCase();
      const catKeyword =
        priorityStr.includes("dining") || updated.categories.includes("dining")
          ? "food"
          : updated.categories.includes("shopping")
            ? "shopping"
            : updated.categories.includes("travel") ||
                priorityStr.includes("lounge")
              ? "travel"
              : updated.categories.includes("fuel")
                ? "fuel"
                : "general";

      // FIX: income filter was comparing raw rupee income against minIncomeLakhs
      // (which is already in lakhs). Divide by 100_000 to convert to lakhs first.
      const eligible = creditCards.filter(
        (c) =>
          (updated.income === 0 ||
            updated.income / 100_000 >= (c.minIncomeLakhs || 0)) &&
          c.annualFee <= effectiveMaxFee,
      );

      const finalEligible =
        eligible.length >= 3
          ? eligible
          : creditCards.filter((c) => c.annualFee <= effectiveMaxFee * 2);

      const ranked = rankCards(sp, catKeyword, finalEligible);
      setRecommendations(ranked.slice(0, 5).map((r) => r.card));
      setIsAnalyzing(false);
      setStep("results");
    }, 1500);
  };

  const resetAdvisor = () => {
    setStep("income");
    setProfile({ ...defaultProfile, maxAnnualFee: 5000 });
    setRecommendations([]);
    setInputMode(null);
  };

  const handleModeSelect = (mode: InputMode) => {
    setInputMode(mode);
    if (mode === "questionnaire") setSheetOpen(false);
  };

  const stepsArr: Step[] = [
    "income",
    "spending",
    "travel",
    "priorities",
    "results",
  ];

  return (
    <div className="w-full max-w-md mx-auto px-4 py-10 min-h-screen">
      {/* HEADER */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-[1.5rem] bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto mb-5"
        >
          <Bot className="w-8 h-8 text-amber-400" />
        </motion.div>
        <h1 className="font-serif text-3xl font-bold mb-2">AI Card Advisor</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          The PaisaDekho engine audits rewards, GST and card policies to
          optimize your wallet.
        </p>
      </div>

      {/* ── CTA: Upload Statement ───────────────────────────── */}
      {step === "income" && !inputMode && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => setSheetOpen(true)}
            className="w-full group relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-amber-600/5 p-5 text-left hover:border-amber-400/60 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">
                  Upload Bank Statement
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get instant AI-powered card recommendations from your actual
                  spending
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="mt-3 flex gap-2">
              {["SBI", "ICICI", "HDFC", "Kotak", "BOB"].map((b) => (
                <span
                  key={b}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-muted-foreground font-medium">
              or fill manually
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        </motion.div>
      )}

      {/* STEPPER */}
      {(inputMode === "questionnaire" || step !== "income") && (
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {stepsArr.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all
                ${
                  step === s
                    ? "bg-amber-400 text-black"
                    : stepsArr.indexOf(step) > i
                      ? "bg-amber-400/20 text-amber-400"
                      : "bg-white/5 text-muted-foreground"
                }`}
              >
                {stepsArr.indexOf(step) > i ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 4 && <div className="w-8 h-px bg-white/10" />}
            </div>
          ))}
        </div>
      )}

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

      {/* ── BOTTOM SHEET ────────────────────────────────────── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-white/10 rounded-t-3xl overflow-hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="px-5 mb-20 pb-8 pt-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold">
                      Get Card Recommendations
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose how to get started
                    </p>
                  </div>
                  <button
                    onClick={() => setSheetOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {!inputMode ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleModeSelect("statement")}
                      className="w-full group p-4 rounded-2xl border border-amber-400/30 bg-amber-400/5 hover:bg-amber-400/10 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            Upload Bank Statement
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Automatic • 30 seconds
                          </p>
                        </div>
                        <div className="ml-auto px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] font-bold">
                          RECOMMENDED
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground pl-13">
                        PDF of SBI, ICICI, HDFC, Kotak or BOB. AI reads your
                        actual spending patterns.
                      </p>
                    </button>

                    <button
                      onClick={() => handleModeSelect("questionnaire")}
                      className="w-full group p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <ClipboardList className="w-5 h-5 text-white/70" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            Fill Questionnaire
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Manual • 2 minutes
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                ) : inputMode === "statement" ? (
                  <div className="mb-20">
                    <button
                      onClick={() => setInputMode(null)}
                      className="flex items-center gap-1 text-xs text-muted-foreground mb-4 hover:text-white transition-colors"
                    >
                      <ChevronUp className="w-3 h-3 rotate-[-90deg]" /> Back to
                      options
                    </button>
                    <StatementUpload onDataParsed={handleStatementParsed} />
                  </div>
                ) : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Card detail modal */}
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

/* ─────────────────────────────────────────────────────────────
   STEP COMPONENTS
───────────────────────────────────────────────────────────── */

function IncomeStep({ onSubmit }: { onSubmit: (v: number) => void }) {
  const [income, setIncome] = useState(1200000);
  const presets = [500000, 1000000, 2000000, 3000000];
  return (
    <motion.div
      key="income"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 border rounded-3xl bg-black/20"
    >
      <h2 className="text-2xl font-bold mb-8 text-center">
        What is your annual income?
      </h2>
      <MoneySlider value={income} onChange={setIncome} />
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
      key="spending"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 border rounded-3xl bg-black/20 mb-12"
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
      <div className="grid grid-cols-2 gap-3 mb-8">
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
            className={`p-4 border rounded-xl transition-all ${categories.includes(c.id) ? "border-amber-400 bg-amber-400/10 text-amber-400" : "hover:bg-white/5"}`}
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
      key="travel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 border rounded-3xl bg-black/20 mb-12"
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
            className={`p-5 border rounded-xl text-left transition-all ${travel === opt.id ? "border-amber-400 bg-amber-400/10" : "hover:bg-white/5"}`}
          >
            <p className="font-bold">{opt.label}</p>
            <p className="text-xs text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>
      <div className="flex gap-4">
        <Button variant="ghost" onClick={onBack} className="flex-1 h-12">
          Back
        </Button>
        <Button onClick={() => onSubmit(travel)} className="flex-[2] h-12">
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
      key="priorities"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 border rounded-3xl bg-black/20 mb-12"
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
            className={`p-5 border rounded-xl flex items-center gap-3 transition-all ${priorities.includes(p.id) ? "border-amber-400 bg-amber-400/10" : "hover:bg-white/5"}`}
          >
            <p.icon size={18} />
            <span className="font-medium">{p.label}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-4">
        <Button variant="ghost" onClick={onBack} className="flex-1 h-14">
          Back
        </Button>
        <Button
          onClick={() => onSubmit(priorities)}
          className="flex-2 h-14 bg-amber-400 text-black hover:bg-amber-300"
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
  // FIX: ResultsStep was building its own sp from annualSpend fractions, but
  // calculateInDepthSavings expects MONTHLY values and multiplies by 12 internally.
  // Also the fractions were inconsistent with what handlePrioritiesSubmit sent to rankCards.
  // Now we pass monthlySpend and use the same fractions as the ranking step.
  const monthly = profile.monthlySpend;
  const sp = {
    food: profile.categories.includes("dining") ? monthly * 0.2 : 0,
    shopping: profile.categories.includes("shopping") ? monthly * 0.2 : 0,
    travel: profile.categories.includes("travel") ? monthly * 0.2 : 0,
    utilities: monthly * 0.1,
    fuel: profile.categories.includes("fuel") ? monthly * 0.1 : 0,
    rent: monthly * 0.15,
    other: monthly * 0.05,
  };

  return (
    <div className="space-y-6">
      {isAnalyzing && (
        <div className="flex items-center justify-center gap-3 py-12">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">AI analyzing best cards…</p>
        </div>
      )}
      {!isAnalyzing &&
        recommendations.map((card: any, i: number) => {
          // FIX: use calculateInDepthSavings with the proper monthly sp for accurate
          // projected value, instead of the naive baseRewardRate * totalAnnualSpend
          const audit = calculateInDepthSavings(card, sp);
          const projectedValue = audit.grossRewards;

          return (
            <div
              key={card.name}
              className="cursor-pointer relative"
              onClick={() => onCardClick(card)}
            >
              {i === 0 && (
                <div className="absolute -top-2 right-2 bg-amber-400 text-black text-xs px-2 py-1 rounded-full z-10">
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
        <RotateCcw className="mr-2 h-4 w-4" /> Start Over
      </Button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CARD COMPONENTS
───────────────────────────────────────────────────────────── */

function CreditCardVisual({ card, value }: { card: any; value?: number }) {
  return (
    <div
      className={`relative w-full rounded-2xl p-5 text-white overflow-hidden bg-gradient-to-br ${card.imageGradient} shadow-lg`}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-40" />
      <div className="relative z-10 w-10 h-7 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-md mb-4" />
      <p className="relative z-10 text-xs opacity-80 tracking-wider">
        {card.bank}
      </p>
      <h3 className="relative z-10 text-lg font-bold tracking-wide mb-4">
        {card.name}
      </h3>
      <div className="relative z-10 grid grid-cols-3 gap-2 text-xs">
        <div className="bg-black/30 rounded-lg p-2">
          <p className="opacity-70">Annual Fee</p>
          <p className="font-bold">
            {card.annualFee === 0
              ? "Free"
              : `₹${card.annualFee.toLocaleString()}`}
          </p>
        </div>
        <div className="bg-black/30 rounded-lg p-2">
          <p className="opacity-70">Base Rewards</p>
          <p className="font-bold">{card.baseRewardRate}%</p>
        </div>
        <div className="bg-black/30 rounded-lg p-2">
          <p className="opacity-70">Best For</p>
          <p className="font-bold">
            {(() => {
              const rates: [string, number][] = [
                [
                  "Dining",
                  Math.max(
                    card.diningRate ?? 0,
                    card.swiggyRate ?? 0,
                    card.zomatoRate ?? 0,
                  ),
                ],
                [
                  "Shopping",
                  Math.max(
                    card.amazonRate ?? 0,
                    card.flipkartRate ?? 0,
                    card.groceryRate ?? 0,
                  ),
                ],
                ["Travel", Math.max(card.flightRate ?? 0, card.hotelRate ?? 0)],
                ["Fuel", card.fuelRewardRate ?? 0],
                ["Utility", card.utilityRate ?? 0],
              ];
              const best = rates.reduce((a, b) => (b[1] > a[1] ? b : a));
              return best[1] > (card.baseRewardRate ?? 0) ? best[0] : "General";
            })()}
          </p>
        </div>
      </div>
      <p className="relative z-10 mt-5 tracking-[0.2em] text-sm">
        •••• •••• •••• 4589
      </p>
      <div className="absolute bottom-6 left-5 right-5 flex justify-between items-center text-xs">
        <span className="opacity-80">VALID THRU 12/29</span>
        <span className="font-semibold tracking-widest">{card.network}</span>
      </div>
      {value != null && (
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur px-3 py-1 rounded-full text-xs">
          ₹{value.toLocaleString()} / yr
        </div>
      )}
      <p className="absolute bottom-2 right-5 text-[10px] opacity-70">
        Tap for more details →
      </p>
    </div>
  );
}

function CardDetailModal({ card, onClose, profile, nextBestCard }: any) {
  // FIX: use calculateInDepthSavings with the correct MONTHLY sp
  // Old code used profile.monthlySpend * 12 * baseRewardRate which:
  //   (a) ignored category-specific rates entirely
  //   (b) double-counted the *12 that calculateInDepthSavings already applies
  const monthly = profile.monthlySpend;
  const sp = {
    food: profile.categories?.includes("dining") ? monthly * 0.2 : 0,
    shopping: profile.categories?.includes("shopping") ? monthly * 0.2 : 0,
    travel: profile.categories?.includes("travel") ? monthly * 0.2 : 0,
    utilities: monthly * 0.1,
    fuel: profile.categories?.includes("fuel") ? monthly * 0.1 : 0,
    rent: monthly * 0.15,
    other: monthly * 0.05,
  };
  const audit = calculateInDepthSavings(card, sp);

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className={`p-8 bg-gradient-to-br ${card.imageGradient} relative`}>
          <button
            onClick={onClose}
            className="absolute right-6 top-6 p-2 rounded-lg bg-black/40"
          >
            <X />
          </button>
          <div className="flex gap-2 mt-3 flex-wrap">
            {card.tags?.map((tag: string) => (
              <span
                key={tag}
                className="text-xs bg-white/10 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Why recommended */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-amber-400" />
              <h3 className="text-lg font-bold">Why AI Recommended This</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  icon: <Utensils size={16} />,
                  title: "Dining",
                  // FIX: show the effective dining rate (max of swiggy/zomato/dining)
                  val: `${Math.max(card.diningRate ?? 0, card.swiggyRate ?? 0, card.zomatoRate ?? 0)}%`,
                },
                {
                  icon: <Plane size={16} />,
                  title: "Flights",
                  val: `${card.flightRate}%`,
                },
                {
                  icon: <ShoppingCart size={16} />,
                  title: "Shopping",
                  // FIX: show the effective shopping rate (max of amazon/flipkart/grocery)
                  val: `${Math.max(card.amazonRate ?? 0, card.flipkartRate ?? 0, card.groceryRate ?? 0)}%`,
                },
              ].map((i) => (
                <div
                  key={i.title}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2 text-sm">
                    {i.icon} {i.title} Rewards
                  </div>
                  <span className="font-bold text-amber-400">{i.val}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Value — now driven by the real audit */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-green-400" />
              <h3 className="text-lg font-bold">Projected Yearly Value</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Earnings",
                  val: `₹${audit.grossRewards.toLocaleString()}`,
                  color: "text-green-400",
                },
                {
                  label: "Annual Fee",
                  val:
                    card.annualFee === 0
                      ? "Free"
                      : `₹${card.annualFee.toLocaleString()}`,
                  color: "text-red-400",
                },
                {
                  label: "Net Value",
                  val: `₹${audit.netValue.toLocaleString()}`,
                  color:
                    audit.netValue >= 0 ? "text-amber-400" : "text-red-400",
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-center"
                >
                  <p className="text-[10px] text-muted-foreground mb-1">
                    {m.label}
                  </p>
                  <p className={`font-bold text-sm ${m.color}`}>{m.val}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Travel */}
          <section>
            <h3 className="text-lg font-bold mb-4">Travel Benefits</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Dom. Lounge", val: card.domesticLounge },
                { label: "Forex", val: `${card.forexMarkup}%` },
                { label: "Intl Lounge", val: card.internationalLounge },
              ].map((m) => (
                <div
                  key={m.label}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-center"
                >
                  <p className="text-[10px] text-muted-foreground mb-1">
                    {m.label}
                  </p>
                  <p className="font-bold text-sm">{m.val}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Fee waiver note */}
          {card.retentionSpendReq > 0 && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-muted-foreground">
              💡 Annual fee waived if you spend ₹
              {(card.retentionSpendReq / 100000).toFixed(1)}L/yr (
              {card.retentionSpendDisplay})
              {audit.feeWaived && (
                <span className="text-green-400 font-bold ml-1">
                  ✓ Waived based on your spend
                </span>
              )}
            </div>
          )}

          {/* Apply */}
          <div className="pt-4 border-t border-white/10">
            <button className="w-full bg-amber-400 text-black py-4 rounded-xl font-bold hover:bg-amber-300 transition">
              Apply for {card.name}
            </button>
            {card.notesTnc && (
              <p className="text-xs text-muted-foreground mt-3">
                {card.notesTnc}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
