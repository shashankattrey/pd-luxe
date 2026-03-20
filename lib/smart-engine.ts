// ─────────────────────────────────────────────────────────────────────────────
// smart-engine.ts  —  PaisaDekho Wealth Intelligence Engine
// ─────────────────────────────────────────────────────────────────────────────

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type IncomeType =
  | "salaried"
  | "self-employed"
  | "business"
  | "freelance"
  | "retired";
export type TaxBracket = 0 | 5 | 10 | 15 | 20 | 30;
export type GoalType =
  | "retirement"
  | "house"
  | "education"
  | "emergency"
  | "wealth"
  | "marriage"
  | "travel";
export type RiskAppetite = "conservative" | "moderate" | "aggressive";
export type RecommendationPriority =
  | "critical"
  | "high"
  | "medium"
  | "optional";
export type RecommendationCategory =
  | "protection"
  | "emergency"
  | "debt"
  | "tax"
  | "goal"
  | "wealth"
  | "parallel"
  | "rebalance";
export type FeasibilityStatus =
  | "achievable"
  | "close"
  | "stretch"
  | "impossible";

export interface FinancialProfile {
  age: number;
  isMarried: boolean;
  hasGirlChild: boolean;
  girlChildAge?: number;
  isGovtEmployee: boolean;
  dependents: number;
  monthlyIncome: number;
  incomeType: IncomeType;
  taxBracket: TaxBracket;
  employerPfMonthly: number;
  monthlyExpenses: number;
  monthlyEmi: number;
  monthlyRent: number;
  hasTermInsurance: boolean;
  termCoverAmount: number;
  hasHealthInsurance: boolean;
  healthCoverAmount: number;
  emergencyFund: number;
  existingCorpus: number;
  existing80cInvested: number;
  highInterestDebt: number;
  existingInvestments: string[];
  availableLumpSum: number;
  lumpSumSource: "savings" | "bonus" | "inheritance" | "maturity" | "none";
  primaryGoal: GoalType;
  goalAmountTarget: number;
  goalYears: number;
  retirementAge: number;
  riskAppetite: RiskAppetite;
  prefersSip: boolean;
  prefersOldRegime: boolean; // NEW: Toggle for 80C/80D logic
  includeStepUp: boolean; // NEW: Toggle for 10% annual increase in projections
  inflationRate: number; // NEW: Default 6% to show "Real" vs "Nominal" targets
}

export const DEFAULT_PROFILE: FinancialProfile = {
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
  existingCorpus: 0,
  existing80cInvested: 0,
  highInterestDebt: 0,
  existingInvestments: [],
  availableLumpSum: 0,
  lumpSumSource: "none",
  primaryGoal: "wealth",
  goalAmountTarget: 5000000,
  goalYears: 10,
  retirementAge: 60,
  riskAppetite: "moderate",
  prefersSip: true,
  prefersOldRegime: false, // NEW: Toggle for 80C/80D logic
  includeStepUp: false, // NEW: Toggle for 10% annual increase in projections
  inflationRate: 6,
};

const INFLATION_RATE = 6;
const LIQUID_RATE = 6; // Rate for funds sitting in STP

export interface Recommendation {
  id: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  emoji: string;
  title: string;
  subtitle: string;
  reasoning: string;
  action: string;
  monthlyAmount: number;
  lumpSum?: number;
  sipAmount?: number;
  investmentType: "sip" | "lump-sum" | "both" | "one-time-then-sip";
  platform: string[];
  expectedOutcome: string;
  avoidMistake: string;
  taxSaving?: number;
  urgency: string;
  orderIndex: number;
  isParallelGoal?: boolean;
  horizonYears?: number;
}

export interface AltScenario {
  label: string;
  description: string;
  action: string;
}

export interface GoalFeasibility {
  status: FeasibilityStatus;
  achievablePct: number;
  projectedCorpus: number;
  shortfall: number;
  requiredSipMonthly: number;
  yearsAtCurrentSip: number;
  riskWarning?: string;
  altScenarios: AltScenario[];
}

export interface PlanSummary {
  goalName: string;
  goalTarget: number;
  goalYears: number;
  projectedCorpus: number;
  projectedFromSip: number;
  projectedFromLump: number;
  projectedFromExisting: number;
  sipStepupCorpus: number;
  onTrack: boolean;
  targetYear: number;
  totalMonthlySip: number;
  totalLumpSum: number;
  remainingLumpSum: number;
  totalTaxSaving: number;
  surplusUsed: number;
  surplusRemaining: number;
  feasibility: GoalFeasibility;
}

// ─── Live market rates shape (minimal — only what the engine uses) ────────────
// Mirrors MarketSnapshot from lib/market-data.ts but kept local to avoid
// circular dependencies. page.tsx passes the full MarketSnapshot and TS is
// happy because it's a structural superset.
export interface LiveRates {
  govtSchemes?: {
    ppf?: { rate: number };
    ssy?: { rate: number };
    scss?: { rate: number };
    nsc?: { rate: number };
    pomis?: { rate: number };
    rbiBonds?: { rate: number };
  };
  fixedIncome?: {
    fds?: { rates: { days365: number; days730: number; days1095: number } }[];
  };
  gold?: {
    price24k?: number;
    sgb?: { lastIssuePrice?: number };
  };
}

// ─── INSTRUMENT VETO TABLE ────────────────────────────────────────────────────

const MIN_HORIZON: Record<string, number> = {
  ppf: 15,
  nps: 999,
  elss: 3,
  sgb: 5,
  scss: 5,
  pomis: 5,
  "rbi-bonds": 7,
  "eq-smallcap": 7,
  "eq-midcap": 5,
  "eq-largecap": 3,
  "mf-index": 3,
  "mf-flexi": 5,
  "mf-elss": 3,
  "bal-adv": 2,
  fd: 0,
  liquid: 0,
  "debt-short": 1,
  "nps-tier2": 0,
};

function horizonOk(key: string, goalYears: number): boolean {
  return goalYears >= (MIN_HORIZON[key] ?? 0);
}

// ─── MATH HELPERS ─────────────────────────────────────────────────────────────

function sipCorpus(monthly: number, years: number, cagrPct: number): number {
  if (monthly <= 0 || years <= 0) return 0;
  const r = cagrPct / 100 / 12,
    n = years * 12;
  return Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

function stpLumpCorpus(
  lump: number,
  years: number,
  equityCagr: number,
): number {
  if (lump <= 0 || years <= 0) return 0;
  // Approximation: First 6 months earns Liquid Rate, remaining (years - 0.5) earns Equity
  const liquidPhase = lump * Math.pow(1 + LIQUID_RATE / 100, 0.5);
  return Math.round(liquidPhase * Math.pow(1 + equityCagr / 100, years - 0.5));
}

function lumpCorpus(lump: number, years: number, cagrPct: number): number {
  if (lump <= 0 || years <= 0) return 0;
  return Math.round(lump * Math.pow(1 + cagrPct / 100, years));
}

function requiredSip(target: number, years: number, cagrPct: number): number {
  if (target <= 0) return 0;
  if (years <= 0) return target; // Avoid division by zero
  const r = cagrPct / 100 / 12,
    n = years * 12;
  if (r === 0) return Math.round(target / n);
  return Math.round(target / (((Math.pow(1 + r, n) - 1) / r) * (1 + r)));
}

function taxSaved(amount: number, bracket: TaxBracket): number {
  return Math.round(((amount * bracket) / 100) * 1.04);
}

function surplus(p: FinancialProfile): number {
  return Math.max(
    0,
    p.monthlyIncome - p.monthlyExpenses - p.monthlyEmi - p.monthlyRent,
  );
}

function monthsCovered(p: FinancialProfile): number {
  const monthly = p.monthlyExpenses + p.monthlyEmi;
  return monthly > 0 ? parseFloat((p.emergencyFund / monthly).toFixed(1)) : 0;
}

function remaining80c(p: FinancialProfile): number {
  const epfAnnual = p.employerPfMonthly * 24;
  return Math.max(0, 150000 - p.existing80cInvested - epfAnnual);
}

function yrsToRetirement(p: FinancialProfile): number {
  return Math.max(0, p.retirementAge - p.age);
}

function sipStepupCorpus(
  monthlySip: number,
  existingCorpus: number,
  years: number,
  cagrPct: number,
  stepupPct = 10,
): number {
  let total = lumpCorpus(existingCorpus, years, cagrPct);
  let currentSip = monthlySip;
  const monthlyRate = cagrPct / 100 / 12;

  for (let yr = 0; yr < years; yr++) {
    for (let month = 0; month < 12; month++) {
      const monthsRemaining = years * 12 - (yr * 12 + month);
      total += currentSip * Math.pow(1 + monthlyRate, monthsRemaining);
    }
    currentSip *= 1 + stepupPct / 100; // Increase SIP for next year only
  }
  return Math.round(total);
}

// ─── GOAL FEASIBILITY ────────────────────────────────────────────────────────

export function assessGoalFeasibility(
  p: FinancialProfile,
  goalSurplus?: number,
): GoalFeasibility {
  if (goalSurplus === undefined) goalSurplus = surplus(p);
  const cagrMap = { conservative: 8, moderate: 12, aggressive: 16 };
  const cagr = cagrMap[p.riskAppetite];
  const realTarget = Math.round(
    p.goalAmountTarget * Math.pow(1 + p.inflationRate / 100, p.goalYears),
  );
  const existingGrowth = lumpCorpus(
    p.existingCorpus + p.availableLumpSum,
    p.goalYears,
    cagr,
  );
  const sipGrowth = sipCorpus(goalSurplus, p.goalYears, cagr);
  const projected = existingGrowth + sipGrowth;
  const pct = Math.min(200, Math.round((projected / p.goalAmountTarget) * 100));
  const shortfall = Math.max(0, p.goalAmountTarget - projected);

  const status: FeasibilityStatus =
    pct >= 95
      ? "achievable"
      : pct >= 75
        ? "close"
        : pct >= 40
          ? "stretch"
          : "impossible";

  let yearsNeeded = p.goalYears;
  for (let y = p.goalYears; y <= 40; y++) {
    if (
      sipCorpus(goalSurplus, y, cagr) + existingGrowth >=
      p.goalAmountTarget
    ) {
      yearsNeeded = y;
      break;
    }
  }

  const reqSip = requiredSip(
    Math.max(0, p.goalAmountTarget - existingGrowth),
    p.goalYears,
    cagr,
  );

  const sp = surplus(p);
  const alts: AltScenario[] = [];

  alts.push({
    label: `1. Lower target to ₹${(projected / 100000).toFixed(0)}L`,
    description: `What you CAN achieve in ${p.goalYears} years with ₹${goalSurplus.toLocaleString()}/mo SIP`,
    action: `Start the plan below as-is — you'll reach ₹${(projected / 100000).toFixed(0)}L by ${new Date().getFullYear() + p.goalYears}`,
  });

  if (yearsNeeded <= 30) {
    alts.push({
      label: `2. Extend timeline to ${yearsNeeded} years`,
      description: `Hit ₹${(p.goalAmountTarget / 100000).toFixed(0)}L without increasing SIP`,
      action: `Keep the same SIP of ₹${goalSurplus.toLocaleString()}/mo — just wait ${yearsNeeded} years instead of ${p.goalYears}`,
    });
  }

  if (reqSip <= sp && reqSip > goalSurplus) {
    alts.push({
      label: `3. Increase SIP to ₹${reqSip.toLocaleString()}/mo`,
      description: `Hit ₹${(p.goalAmountTarget / 100000).toFixed(0)}L in ${p.goalYears} years`,
      action: `Reduce expenses by ₹${(reqSip - goalSurplus).toLocaleString()}/mo to free up this SIP`,
    });
  }

  const stepup = sipStepupCorpus(
    goalSurplus,
    p.existingCorpus,
    p.goalYears,
    cagr,
    10,
  );
  if (stepup > projected * 1.1) {
    alts.push({
      label: `4. 10% annual SIP step-up`,
      description: `Corpus grows to ₹${(stepup / 100000).toFixed(0)}L — ₹${((stepup - projected) / 100000).toFixed(0)}L more`,
      action: `Increase SIP by 10% every April as income grows`,
    });
  }

  const riskWarning =
    p.goalYears <= 2
      ? `${p.goalYears}-year goal: equity excluded — markets can drop 40% with no recovery time.`
      : p.goalYears <= 5 && p.riskAppetite === "aggressive"
        ? `${p.goalYears}-year goal: mid/small cap excluded — needs 7+ years to recover from downturns.`
        : undefined;

  return {
    status,
    achievablePct: pct,
    projectedCorpus: projected,
    shortfall,
    requiredSipMonthly: reqSip,
    yearsAtCurrentSip: yearsNeeded,
    riskWarning,
    altScenarios: alts,
  };
}

// ─── MAIN RECOMMENDATION ENGINE ───────────────────────────────────────────────
// marketData is optional — when provided, live rates override static defaults.

export function generatePreciseRecommendations(
  p: FinancialProfile,
  marketData?: LiveRates,
): Recommendation[] {
  // ── Extract live rates (fall back to hardcoded if marketData not available) ──
  const RATES = {
    ppf: marketData?.govtSchemes?.ppf?.rate ?? 7.1,
    ssy: marketData?.govtSchemes?.ssy?.rate ?? 8.2,
    scss: marketData?.govtSchemes?.scss?.rate ?? 8.2,
    nsc: marketData?.govtSchemes?.nsc?.rate ?? 7.7,
    pomis: marketData?.govtSchemes?.pomis?.rate ?? 7.4,
    rbiBonds: marketData?.govtSchemes?.rbiBonds?.rate ?? 8.05,
    bestFD1yr: (() => {
      const fds = marketData?.fixedIncome?.fds;
      if (!fds || fds.length === 0) return 7.5;
      return Math.max(...fds.map((f) => f.rates.days365 ?? 0), 7.5);
    })(),
    bestFD3yr: (() => {
      const fds = marketData?.fixedIncome?.fds;
      if (!fds || fds.length === 0) return 8.0;
      return Math.max(...fds.map((f) => f.rates.days1095 ?? 0), 8.0);
    })(),
    sgbUnit: marketData?.gold?.sgb?.lastIssuePrice ?? 5800,
  };

  const recs: Recommendation[] = [];
  const sp = surplus(p);
  const covered = monthsCovered(p);
  const gap80c = remaining80c(p);
  const yrsRet = yrsToRetirement(p);
  const annual = p.monthlyIncome * 12;
  const isQ4 = [1, 2, 3].includes(new Date().getMonth() + 1);
  const goalYrs = p.goalYears;
  const cagrMap = { conservative: 8, moderate: 12, aggressive: 16 };
  const goalCagr = cagrMap[p.riskAppetite];

  let order = 1;
  let remSurplus = sp;
  let remLumpSum = p.availableLumpSum;
  let consumed80c = 0;

  // ─── GATE 1: Term Insurance ───────────────────────────────────────────────
  if (!p.hasTermInsurance && p.dependents > 0) {
    const cover = annual * 12;
    const premium = Math.round((cover * 0.0003) / 12);
    recs.push({
      id: "term-insurance",
      priority: "critical",
      category: "protection",
      emoji: "🛡️",
      title: "Buy Term Insurance — Before Investing a Single Rupee",
      subtitle: `₹${(cover / 10000000).toFixed(1)}Cr cover · ~₹${premium.toLocaleString()}/mo`,
      reasoning: `You have ${p.dependents} dependent${p.dependents > 1 ? "s" : ""} and no term insurance. If you die tomorrow, your family has nothing. This must happen before any SIP or investment.`,
      action: `Go to ditto.in (fee-only, unbiased) or PolicyBazaar. Buy ₹${(cover / 10000000).toFixed(1)}Cr pure term from HDFC Click2Protect Life or Max Life Smart Secure Plus (both 99%+ claim settlement). Pure term only — reject ULIP or endowment.`,
      monthlyAmount: premium,
      investmentType: "sip",
      platform: [
        "Ditto Insurance (ditto.in)",
        "PolicyBazaar",
        "HDFC Click2Protect",
      ],
      expectedOutcome: `₹${(cover / 10000000).toFixed(1)}Cr family protection at ~₹${(premium * 12).toLocaleString()}/yr`,
      avoidMistake:
        "Never buy endowment/ULIP disguised as insurance. Pure term = death benefit only.",
      urgency: "TODAY — before opening any investment app.",
      orderIndex: order++,
    });
    remSurplus -= premium;
  }

  // ─── GATE 2: Health Insurance ─────────────────────────────────────────────
  if (!p.hasHealthInsurance) {
    const premium = Math.round(p.isMarried ? 2100 : 1300);
    const saving = taxSaved(p.isMarried ? 50000 : 25000, p.taxBracket);
    recs.push({
      id: "health-insurance",
      priority: "critical",
      category: "protection",
      emoji: "🏥",
      title: "Health Insurance — One Hospitalisation Can Wipe Savings",
      subtitle: `₹10L floater · ~₹${premium.toLocaleString()}/mo · saves ₹${saving.toLocaleString()}/yr tax`,
      reasoning: `No health insurance. A single hospitalisation costs ₹2–5L. Employer cover ends when you resign. Premium also saves ₹${saving.toLocaleString()} under 80D.`,
      action: `Buy ₹10L family floater — Niva Bupa ReAssure or Star Health Comprehensive. Add parents separately for extra ₹25k 80D deduction.`,
      monthlyAmount: premium,
      investmentType: "sip",
      platform: ["Niva Bupa — ReAssure plan", "Star Health", "PolicyBazaar"],
      expectedOutcome: `₹10L health cover + ₹${saving.toLocaleString()}/yr tax saving (80D)`,
      avoidMistake: "Don't rely on employer cover — it ends with the job.",
      taxSaving: saving,
      urgency: "This month — before starting SIPs.",
      orderIndex: order++,
    });
    remSurplus -= premium;
  }

  // ─── GATE 3: Emergency Fund ───────────────────────────────────────────────
  if (covered < 6) {
    const monthly = p.monthlyExpenses + p.monthlyEmi;
    const target = monthly * 6;
    const gap = Math.max(0, target - p.emergencyFund);
    const lsNow = Math.min(remLumpSum, gap);
    const gapLeft = gap - lsNow;
    const sipEm = Math.min(
      Math.round(remSurplus * 0.4),
      Math.round(gapLeft / Math.max(1, 6 - covered)),
    );
    const months = sipEm > 0 ? Math.ceil(gapLeft / sipEm) : "—";
    recs.push({
      id: "emergency-fund",
      priority: covered < 2 ? "critical" : "high",
      category: "emergency",
      emoji: "💵",
      title: `Build Emergency Fund — ${covered} of 6 Months Covered`,
      subtitle: `Need ₹${gap.toLocaleString()} more${lsNow > 0 ? ` · transfer ₹${lsNow.toLocaleString()} now` : ""}`,
      reasoning: `${covered} months covered. Without 6 months buffer you'll break SIPs or take loans during job loss or medical emergencies — exactly when markets are also down.`,
      action:
        lsNow > 0
          ? `Transfer ₹${lsNow.toLocaleString()} to IDFC FIRST Bank savings (7% p.a.) today. Then ₹${sipEm.toLocaleString()}/mo till ₹${target.toLocaleString()}. Above ₹1L, sweep to HDFC Liquid Fund (6.8%, T+1).`
          : `Auto-transfer ₹${sipEm.toLocaleString()}/mo to IDFC FIRST savings (7%). Target ₹${target.toLocaleString()} in ${months} months. Above ₹1L → HDFC Liquid Fund.`,
      monthlyAmount: sipEm,
      lumpSum: lsNow > 0 ? lsNow : undefined,
      investmentType: lsNow > 0 ? (sipEm > 0 ? "both" : "lump-sum") : "sip",
      platform: ["IDFC FIRST Bank savings (7%)", "HDFC Liquid Fund via Groww"],
      expectedOutcome: `6-month emergency fund of ₹${target.toLocaleString()} in ${months} months`,
      avoidMistake:
        "Never put emergency money in equity or locked FDs. Must be accessible within 24 hours.",
      urgency:
        covered < 2
          ? "CRITICAL — before equity SIPs."
          : "Complete within 6 months.",
      orderIndex: order++,
    });
    remLumpSum -= lsNow;
    remSurplus -= sipEm;
  }

  // ─── GATE 4: High-Interest Debt ───────────────────────────────────────────
  if (p.highInterestDebt > 0) {
    const lsToDebt = Math.min(remLumpSum, p.highInterestDebt);
    const remaining = p.highInterestDebt - lsToDebt;
    const sipDebt = Math.min(
      Math.round(remSurplus * 0.6),
      Math.round(remaining / 12),
    );
    const interest = Math.round(p.highInterestDebt * 0.15);
    recs.push({
      id: "debt-payoff",
      priority: "critical",
      category: "debt",
      emoji: "🔴",
      title: "Clear High-Interest Debt — Guaranteed 15%+ Return",
      subtitle:
        lsToDebt >= p.highInterestDebt
          ? `Pay ₹${p.highInterestDebt.toLocaleString()} today · saves ₹${interest.toLocaleString()}/yr`
          : `₹${lsToDebt.toLocaleString()} now + ₹${sipDebt.toLocaleString()}/mo`,
      reasoning: `Paying 15% debt = guaranteed 15% return, better than any fund. Costs ₹${interest.toLocaleString()}/yr in interest you're paying for nothing.`,
      action:
        lsToDebt >= p.highInterestDebt
          ? `Pay ₹${p.highInterestDebt.toLocaleString()} via bank app → Loan Repayment → Prepay Principal. Credit card first (36%), then personal loan, then car loan.`
          : `Pay ₹${lsToDebt > 0 ? lsToDebt.toLocaleString() : "0"} now as prepayment + ₹${sipDebt.toLocaleString()}/mo extra principal. Avalanche: highest rate first.`,
      monthlyAmount: sipDebt,
      lumpSum: lsToDebt > 0 ? lsToDebt : undefined,
      investmentType:
        lsToDebt > 0 ? (sipDebt > 0 ? "both" : "lump-sum") : "sip",
      platform: ["Your bank app — Prepay Principal"],
      expectedOutcome: `Debt-free in ${sipDebt > 0 ? Math.ceil(remaining / sipDebt) : 0} months · saves ₹${interest.toLocaleString()}/yr`,
      avoidMistake:
        "Never invest in equity while carrying credit card debt at 36%.",
      urgency: "Today — every day costs interest.",
      orderIndex: order++,
    });
    remLumpSum -= lsToDebt;
    remSurplus -= sipDebt;
  }

  // ─── PRIMARY GOAL ─────────────────────────────────────────────────────────
  const goalBudget = remSurplus;
  const goalLump = remLumpSum;
  const feas = assessGoalFeasibility(p, goalBudget);

  if (feas.status === "impossible" || feas.status === "stretch") {
    const best = feas.altScenarios[0];
    recs.push({
      id: "goal-feasibility",
      priority: feas.status === "impossible" ? "critical" : "high",
      category: "goal",
      emoji: feas.status === "impossible" ? "🔴" : "⚠️",
      title:
        feas.status === "impossible"
          ? `Goal Needs Revision — ₹${(p.goalAmountTarget / 100000).toFixed(0)}L in ${goalYrs} Years Not Achievable`
          : `Stretch Goal — ₹${(p.goalAmountTarget / 100000).toFixed(0)}L in ${goalYrs} Years Needs Adjustment`,
      subtitle: `Can reach ₹${(feas.projectedCorpus / 100000).toFixed(0)}L · target needs ₹${feas.requiredSipMonthly.toLocaleString()}/mo`,
      reasoning: `To hit ₹${(p.goalAmountTarget / 100000).toFixed(0)}L in ${goalYrs} years at ${goalCagr}% CAGR you need ₹${feas.requiredSipMonthly.toLocaleString()}/mo. After obligations, your goal budget is ₹${goalBudget.toLocaleString()}/mo — reaching ₹${(feas.projectedCorpus / 100000).toFixed(0)}L. Here are ${feas.altScenarios.length} concrete paths:`,
      action: feas.altScenarios
        .map((a) => `${a.label}\n${a.description}\n→ ${a.action}`)
        .join("\n\n"),
      monthlyAmount: Math.min(goalBudget, feas.requiredSipMonthly),
      investmentType: "both",
      platform: ["Choose a scenario below, then proceed with the plan"],
      expectedOutcome: `Best achievable: ₹${(feas.projectedCorpus / 100000).toFixed(0)}L in ${goalYrs} years`,
      avoidMistake:
        "Don't invest randomly hoping to hit an unreachable target. Pick a scenario and commit.",
      urgency: "Revisit goal first, then build the plan.",
      orderIndex: order++,
    });
  }

  const existingBoost = lumpCorpus(p.existingCorpus, goalYrs, goalCagr);
  const lumpBoost = lumpCorpus(goalLump, goalYrs, goalCagr);
  const sipNeeded = Math.max(
    0,
    requiredSip(
      Math.max(0, p.goalAmountTarget - existingBoost - lumpBoost),
      goalYrs,
      goalCagr,
    ),
  );
  const actualSip = Math.min(
    remSurplus,
    sipNeeded > 0 ? sipNeeded : remSurplus,
  );

  if (goalYrs <= 1) {
    const fdLump = Math.min(goalLump, p.goalAmountTarget);
    recs.push({
      id: "goal-ultrashort",
      priority: "high",
      category: "goal",
      emoji: "💧",
      title: `${goalYrs}-Year Goal → Liquid Fund + Short FD Only`,
      subtitle: `₹${actualSip.toLocaleString()}/mo HDFC Short Duration${fdLump > 0 ? ` + ₹${fdLump.toLocaleString()} FD` : ""}`,
      reasoning: `Under 1 year is too short for equity — markets can drop 40% and not recover. Capital protection trumps returns here.`,
      action: [
        actualSip > 0
          ? `₹${actualSip.toLocaleString()}/mo → HDFC Short Duration Fund (Direct) on Kuvera. ${RATES.bestFD1yr.toFixed(1)}%, capital safe.`
          : null,
        fdLump > 0
          ? `₹${fdLump.toLocaleString()} → AU Small Finance Bank FD (${RATES.bestFD1yr.toFixed(2)}%, 9-12 months) via aubank.in`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      monthlyAmount: actualSip,
      lumpSum: fdLump > 0 ? fdLump : undefined,
      investmentType:
        fdLump > 0 && actualSip > 0 ? "both" : fdLump > 0 ? "lump-sum" : "sip",
      platform: ["Kuvera — HDFC Short Duration", "AU Bank app"],
      expectedOutcome: `₹${(
        (sipCorpus(actualSip, goalYrs, 7.5) +
          lumpCorpus(fdLump, goalYrs, RATES.bestFD1yr)) /
        100000
      ).toFixed(0)}L · capital protected`,
      avoidMistake:
        "Zero equity for under 1-year goals. Not even balanced funds.",
      urgency: "Start this month.",
      orderIndex: order++,
    });
    remLumpSum -= fdLump;
    remSurplus -= actualSip;
  } else if (goalYrs <= 3) {
    const fdLump = Math.min(goalLump, Math.round(p.goalAmountTarget * 0.4));
    const balSip = Math.min(actualSip, remSurplus);
    recs.push({
      id: "goal-short",
      priority: "high",
      category: "goal",
      emoji: "⚖️",
      title: `${goalYrs}-Year Goal → Balanced Fund SIP + FD Lump Sum`,
      subtitle: `₹${balSip.toLocaleString()}/mo HDFC Balanced Advantage${fdLump > 0 ? ` + ₹${fdLump.toLocaleString()} FD` : ""}`,
      reasoning: `${goalYrs} years allows moderate equity via SIP cost averaging. Lump sum goes into FD — a market crash 1 year before your goal would devastate lump sum equity but SIP can average down.`,
      action: [
        `₹${balSip.toLocaleString()}/mo → HDFC Balanced Advantage Fund (Direct) on Groww`,
        fdLump > 0
          ? `₹${fdLump.toLocaleString()} → Bajaj Finance FD (${RATES.bestFD3yr.toFixed(2)}%, 33-42 months) via bajajfinserv.in`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      monthlyAmount: balSip,
      lumpSum: fdLump > 0 ? fdLump : undefined,
      investmentType: fdLump > 0 ? "both" : "sip",
      platform: ["HDFC AMC Direct / Groww", "Bajaj Finserv app"],
      expectedOutcome: `~₹${(
        (sipCorpus(balSip, goalYrs, 10) +
          lumpCorpus(fdLump, goalYrs, RATES.bestFD3yr)) /
        100000
      ).toFixed(0)}L in ${goalYrs} years`,
      avoidMistake:
        "Lump sum goes into FD for 2-3 year goals, NOT equity. Equity lump sum needs 5+ years.",
      urgency: "Start SIP this month. Book FD today.",
      orderIndex: order++,
    });
    remLumpSum -= fdLump;
    remSurplus -= balSip;
  } else if (goalYrs <= 7) {
    const indexSip = Math.round(actualSip * 0.6);
    const debtSip = actualSip - indexSip;
    const lsAction =
      goalLump > 10000
        ? `\nLump sum: ₹${goalLump.toLocaleString()} → UTI Nifty 50 Index Fund (Direct)${goalLump > 500000 ? " via STP over 3 months" : ""}`
        : "";
    recs.push({
      id: "goal-medium",
      priority: "high",
      category: "goal",
      emoji: "📈",
      title: `${goalYrs}-Year Goal → 60:40 Index + Debt`,
      subtitle: `₹${indexSip.toLocaleString()}/mo Nifty 50 + ₹${debtSip.toLocaleString()}/mo debt`,
      reasoning: `${goalYrs} years is enough for equity to recover from crashes. 60% Nifty 50 index + 40% short duration debt gives ~12% blended return with controlled volatility.`,
      action: [
        `₹${indexSip.toLocaleString()}/mo → UTI Nifty 50 Index Fund (Direct, 0.18% ER) on Kuvera`,
        `₹${debtSip.toLocaleString()}/mo → HDFC Short Duration Fund (Direct) on Kuvera`,
        lsAction,
      ]
        .filter(Boolean)
        .join("\n"),
      monthlyAmount: actualSip,
      lumpSum: goalLump > 10000 ? goalLump : undefined,
      investmentType: goalLump > 10000 ? "both" : "sip",
      platform: ["Kuvera (both SIPs together)"],
      expectedOutcome: `₹${(
        (sipCorpus(actualSip, goalYrs, 12) +
          lumpCorpus(goalLump, goalYrs, 12)) /
        100000
      ).toFixed(0)}L in ${goalYrs} years`,
      avoidMistake:
        "Don't split into 5+ funds. This 2-fund portfolio consistently beats complex ones.",
      urgency: "Set SIPs on 1st of next month after salary credit.",
      orderIndex: order++,
    });
    remLumpSum -= Math.min(goalLump, remLumpSum);
    remSurplus -= actualSip;
  } else {
    const eqPct = Math.max(60, Math.min(85, 100 - p.age));
    const indexSip = Math.round(actualSip * 0.4);
    const flexiSip = Math.round(actualSip * 0.3);
    const midSip = Math.round(actualSip * Math.max(0, eqPct / 100 - 0.7));
    const safeSip = Math.max(0, actualSip - indexSip - flexiSip - midSip);
    const corpus = sipCorpus(actualSip, goalYrs, goalCagr);
    const lsBoost2 = lumpCorpus(goalLump, goalYrs, goalCagr);
    recs.push({
      id: "goal-long",
      priority: "high",
      category: "goal",
      emoji: "🚀",
      title: `${goalYrs}+ Year Wealth → ${eqPct}% Equity 3-Fund Portfolio`,
      subtitle: `₹${actualSip.toLocaleString()}/mo across 3 funds · ${goalCagr}% CAGR`,
      reasoning: `${goalYrs} years spans 3-4 market cycles. At age ${p.age}, you can hold ${eqPct}% equity (100-age rule). Nifty 50 for stability, Parag Parikh for alpha + global diversification, Motilal Midcap for growth.`,
      action: [
        `₹${indexSip.toLocaleString()}/mo → UTI Nifty 50 Index Fund (Direct, 0.18% ER) [Core 40%]`,
        `₹${flexiSip.toLocaleString()}/mo → Parag Parikh Flexi Cap (Direct) [Growth 30%]`,
        midSip > 500
          ? `₹${midSip.toLocaleString()}/mo → Motilal Oswal Midcap (Direct) [Satellite]`
          : null,
        safeSip > 500
          ? `₹${safeSip.toLocaleString()}/mo → HDFC Short Duration (Direct) [Stability]`
          : null,
        goalLump > 10000
          ? `\nLump sum: ₹${goalLump.toLocaleString()} → UTI Nifty 50 Index today${goalLump > 500000 ? " via STP over 3 months" : ""}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      monthlyAmount: actualSip,
      lumpSum: goalLump > 10000 ? goalLump : undefined,
      investmentType: goalLump > 10000 ? "both" : "sip",
      platform: [
        "Kuvera (all SIPs in one place)",
        "PPFAS Direct — Parag Parikh",
      ],
      expectedOutcome: `₹${((corpus + lsBoost2) / 10000000).toFixed(2)}Cr in ${goalYrs} years`,
      avoidMistake:
        "Never stop SIPs during a market crash — historically every Indian drawdown recovered within 2-3 years.",
      urgency: "Start all 3 SIPs today.",
      orderIndex: order++,
    });
    remLumpSum -= Math.min(goalLump, remLumpSum);
    remSurplus -= actualSip;
  }

  // ─── PARALLEL TRACK: Tax Saving ───────────────────────────────────────────

  // SSY — best 80C if girl child
  if (
    p.hasGirlChild &&
    p.girlChildAge !== undefined && // Explicit check
    p.girlChildAge < 10 &&
    gap80c > 0 &&
    remSurplus > 0
  ) {
    const ssyAmt = Math.min(gap80c, 150000);
    const ssySip = Math.min(Math.round(ssyAmt / 12), remSurplus);
    const ssyLump = remLumpSum >= 150000 ? 150000 : 0;
    const saving = taxSaved(ssyAmt, p.taxBracket);
    consumed80c += ssyAmt;
    recs.push({
      id: "ssy",
      priority: "high",
      category: "parallel",
      emoji: "👧",
      isParallelGoal: true,
      title: `SSY — Best 80C for Your Daughter (${RATES.ssy}% Guaranteed EEE)`,
      subtitle: `₹${ssySip.toLocaleString()}/mo · parallel track · saves ₹${saving.toLocaleString()}/yr tax`,
      reasoning: `${RATES.ssy}% guaranteed + EEE + 80C. Mathematically best 80C with a girl child. Runs as a separate parallel retirement track — independent of your ${goalYrs}-year ${p.primaryGoal} goal.`,
      action:
        ssyLump > 0
          ? `Deposit ₹1.5L in SSY on April 5 for maximum annual interest. Open at Post Office or SBI in your daughter's name.`
          : `₹${ssySip.toLocaleString()}/mo standing instruction to SSY at Post Office or SBI.`,
      monthlyAmount: ssySip,
      lumpSum: ssyLump > 0 ? ssyLump : undefined,
      investmentType: ssyLump > 0 ? "lump-sum" : "sip",
      platform: ["Post Office", "SBI", "HDFC Bank"],
      expectedOutcome: `₹${saving.toLocaleString()}/yr tax saved · ₹${(
        sipCorpus(ssySip, 21 - (p.girlChildAge ?? 5), RATES.ssy) / 100000
      ).toFixed(0)}L at daughter's age 21`,
      avoidMistake:
        "Account must be opened before daughter turns 10 — this closes permanently.",
      taxSaving: saving,
      horizonYears: 21,
      urgency: "Open this week.",
      orderIndex: order++,
    });
    if (ssyLump > 0) remLumpSum -= ssyLump;
    else remSurplus -= ssySip;
  }

  // PPF — only if goal > 7 yrs or retirement goal
  const ppfGap = Math.max(0, gap80c - consumed80c);
  if (
    ppfGap > 10000 &&
    !p.existingInvestments.includes("gs-ppf") &&
    remSurplus > 5000 &&
    (goalYrs > 7 || p.primaryGoal === "retirement")
  ) {
    const ppfSip = Math.min(
      Math.round(ppfGap / 12),
      Math.round(sp * 0.15),
      12500,
    );
    const ppfLump = isQ4 && remLumpSum >= 150000 ? 150000 : 0;
    const saving = taxSaved(Math.min(ppfGap, 150000), p.taxBracket);
    consumed80c += Math.min(ppfGap, 150000);
    recs.push({
      id: "ppf",
      priority: "high",
      category: "parallel",
      emoji: "📌",
      isParallelGoal: true,
      horizonYears: 15,
      title: `PPF — Parallel Retirement Track (${RATES.ppf}% EEE, 15-Yr Lock-In)`,
      subtitle: `₹${ppfSip.toLocaleString()}/mo · EEE · separate from your ${goalYrs}-yr goal · saves ₹${saving.toLocaleString()}/yr`,
      reasoning: `PPF has 15-year lock-in — cannot fund your ${goalYrs}-year goal. It runs as a separate retirement/wealth parallel track. Current rate: ${RATES.ppf}% tax-free.`,
      action:
        ppfLump > 0
          ? `Deposit ₹1,50,000 in PPF on April 5 for maximum interest (12 months vs partial for monthly). Open at SBI or HDFC Bank.`
          : `Set ₹${ppfSip.toLocaleString()}/mo standing instruction to PPF on the 1st. Open at SBI or HDFC Bank online.`,
      monthlyAmount: ppfSip,
      lumpSum: ppfLump > 0 ? ppfLump : undefined,
      investmentType: ppfLump > 0 ? "lump-sum" : "sip",
      platform: ["SBI PPF online", "HDFC Bank PPF", "Post Office"],
      expectedOutcome: `₹${saving.toLocaleString()}/yr tax saved · ₹${(
        sipCorpus(ppfSip, 15, RATES.ppf) / 100000
      ).toFixed(0)}L in 15 years · fully tax-free`,
      avoidMistake: `PPF CANNOT be used for your ${goalYrs}-year goal. It's a separate 15-year parallel investment.`,
      taxSaving: saving,
      urgency: ppfLump > 0 ? "Deposit April 5." : "Start this month.",
      orderIndex: order++,
    });
    if (ppfLump > 0) remLumpSum -= ppfLump;
    else remSurplus -= ppfSip;
  }

  // ELSS
  const elssGap = Math.max(0, gap80c - consumed80c);
  if (elssGap > 3000 && horizonOk("elss", goalYrs) && remSurplus > 3000) {
    const lsElss = isQ4 && remLumpSum >= elssGap ? elssGap : 0;
    const elssSip =
      lsElss > 0 ? 0 : Math.min(Math.round(elssGap / 12), remSurplus);
    const saving = taxSaved(lsElss > 0 ? lsElss : elssSip * 12, p.taxBracket);
    consumed80c += lsElss || elssSip * 12;
    recs.push({
      id: "elss",
      priority: "high",
      category: "parallel",
      emoji: "💰",
      isParallelGoal: true,
      horizonYears: 3,
      title:
        isQ4 && lsElss > 0
          ? "ELSS — Lump Sum Before March 31 Deadline"
          : "ELSS — Fill 80C Gap (Best-Return Tax Saver)",
      subtitle:
        lsElss > 0
          ? `₹${lsElss.toLocaleString()} before March 31 · saves ₹${saving.toLocaleString()} this year`
          : `₹${elssSip.toLocaleString()}/mo · saves ₹${saving.toLocaleString()}/yr`,
      reasoning: isQ4
        ? `March 31 deadline approaching. ₹${elssGap.toLocaleString()} 80C gap. Invest now to save ₹${saving.toLocaleString()} this financial year.`
        : `₹${elssGap.toLocaleString()} of 80C unused. ELSS = only tax saver with equity-like returns (~16% historical). 3-year lock-in — shortest among 80C options.`,
      action:
        lsElss > 0
          ? `Invest ₹${lsElss.toLocaleString()} in Mirae Asset ELSS Tax Saver Fund (Direct) on Groww before March 31.`
          : `₹${elssSip.toLocaleString()}/mo SIP in Mirae Asset ELSS Tax Saver Fund (Direct) on Groww. Direct Plan only.`,
      monthlyAmount: lsElss > 0 ? 0 : elssSip,
      lumpSum: lsElss > 0 ? lsElss : undefined,
      investmentType: lsElss > 0 ? "lump-sum" : "sip",
      platform: ["Groww", "Kuvera", "Mirae AMC Direct"],
      expectedOutcome: `₹${saving.toLocaleString()}/yr tax saved · ₹${(
        sipCorpus(elssSip || Math.round(elssGap / 12), 10, 16) / 100000
      ).toFixed(0)}L in 10 years`,
      avoidMistake:
        "Never buy Regular Plan ELSS from a bank RM — the 1.5-2% annual commission compounds massively against you.",
      taxSaving: saving,
      urgency: isQ4 ? "Before March 31." : "Start this month.",
      orderIndex: order++,
    });
    if (lsElss > 0) remLumpSum -= lsElss;
    else remSurplus -= elssSip;
  }

  // NPS
  if (p.taxBracket >= 20 && yrsRet > 10 && remSurplus >= 4167) {
    const npsSip = Math.min(4167, remSurplus);
    const npsLump = isQ4 && remLumpSum >= 50000 ? 50000 : 0;
    const saving = taxSaved(50000, p.taxBracket);
    recs.push({
      id: "nps",
      priority: "high",
      category: "parallel",
      emoji: "🏛️",
      isParallelGoal: true,
      horizonYears: yrsRet,
      title: `NPS — ₹${saving.toLocaleString()} Extra Tax Saving (Parallel Retirement Track)`,
      subtitle: `₹${npsSip.toLocaleString()}/mo · 80CCD(1B) ₹50k EXTRA beyond 80C`,
      reasoning: `At ${p.taxBracket}% bracket, NPS's extra ₹50k deduction (80CCD(1B) — beyond your ₹1.5L 80C) saves ₹${saving.toLocaleString()}/yr. Locked until age ${p.retirementAge}.`,
      action:
        npsLump > 0
          ? `Deposit ₹50,000 in NPS Tier 1 at eNPS.nsdl.com before March 31. HDFC Pension, Aggressive (75% equity).`
          : `₹${npsSip.toLocaleString()}/mo in NPS Tier 1 at eNPS.nsdl.com. ${
              p.incomeType === "self-employed"
                ? "Consider Tier 2 (liquid) for self-employed."
                : "HDFC Pension, Moderate allocation."
            }`,
      monthlyAmount: npsSip,
      lumpSum: npsLump > 0 ? 50000 : undefined,
      investmentType: npsLump > 0 ? "lump-sum" : "sip",
      platform: ["eNPS.nsdl.com (direct, free)", "SBI", "HDFC Bank"],
      expectedOutcome: `₹${saving.toLocaleString()}/yr tax saved · ₹${(
        sipCorpus(npsSip, yrsRet, 11) / 100000
      ).toFixed(0)}L retirement corpus`,
      avoidMistake: `NPS Tier 1 locked till age ${p.retirementAge}. Never count this for your ${goalYrs}-year goal.`,
      taxSaving: saving,
      urgency: isQ4 ? "Before March 31." : "Start this month.",
      orderIndex: order++,
    });
    if (npsLump > 0) remLumpSum -= npsLump;
    else remSurplus -= npsSip;
  }

  // SGB
  if (remLumpSum >= RATES.sgbUnit && goalYrs >= 5) {
    const sgbAmt = Math.min(remLumpSum, 100000);
    recs.push({
      id: "sgb",
      priority: "medium",
      category: "parallel",
      emoji: "🥇",
      isParallelGoal: true,
      title: "Sovereign Gold Bond — Portfolio Hedge + 2.5% Annual Interest",
      subtitle: `₹${sgbAmt.toLocaleString()} lump sum · tax-free at maturity`,
      reasoning: `Gold is uncorrelated with equity — when markets crash, gold rises. SGB pays 2.5% annual interest ON TOP of gold appreciation. Tax-free capital gains at 8-year maturity.`,
      action: `Next RBI SGB tranche (check rbi.org.in — quarterly windows). Subscribe via HDFC Securities or SBI. Each unit ~₹${RATES.sgbUnit.toLocaleString()}. Invest ₹${sgbAmt.toLocaleString()} (${Math.floor(sgbAmt / RATES.sgbUnit)} units).`,
      monthlyAmount: 0,
      lumpSum: sgbAmt,
      investmentType: "lump-sum",
      platform: ["HDFC Securities", "SBI Net Banking", "Zerodha"],
      expectedOutcome: `2.5% annual interest + gold appreciation + zero capital gains tax at 8-year maturity`,
      avoidMistake:
        "Never buy Digital Gold — 3% GST on every purchase kills long-term returns.",
      urgency: "Next RBI tranche — don't buy on secondary exchange at premium.",
      orderIndex: order++,
    });
    remLumpSum -= sgbAmt;
  }

  // FD — remaining lump sum
  if (remLumpSum >= 25000) {
    const fdAmt = remLumpSum;
    const fdRate = fdAmt >= 100000 ? RATES.bestFD3yr : RATES.bestFD1yr;
    const fdYears = Math.min(3, goalYrs > 0 ? goalYrs : 3);
    const fdCorpus = Math.round(fdAmt * Math.pow(1 + fdRate / 100, fdYears));
    recs.push({
      id: "fd-remainder",
      priority: "medium",
      category: "goal",
      emoji: "🏦",
      title: `Park Remaining ₹${(fdAmt / 1000).toFixed(0)}k in Fixed Deposit`,
      subtitle: `₹${fdAmt.toLocaleString()} → ${fdRate.toFixed(2)}% FD · guaranteed ₹${fdCorpus.toLocaleString()} in ${fdYears} yrs`,
      reasoning: `After all allocations, ₹${fdAmt.toLocaleString()} is undeployed. At ${fdRate.toFixed(2)}%, guaranteed ₹${fdCorpus.toLocaleString()} in ${fdYears} years with zero market risk.`,
      action: `Book at ${fdAmt >= 100000 ? "Bajaj Finance (AAA-rated) via bajajfinserv.in" : "AU Small Finance Bank via aubank.in"}. Fully online, 10 minutes.`,
      monthlyAmount: 0,
      lumpSum: fdAmt,
      investmentType: "lump-sum",
      platform:
        fdAmt >= 100000
          ? ["Bajaj Finserv app", "bajajfinserv.in"]
          : ["AU Bank app", "aubank.in"],
      expectedOutcome: `₹${fdCorpus.toLocaleString()} in ${fdYears} years · guaranteed · zero risk`,
      avoidMistake:
        "Keep at least one FD with premature withdrawal option — don't lock everything.",
      urgency: "Book online today — 10 minutes.",
      orderIndex: order++,
    });
    remLumpSum = 0;
  }

  // Senior rebalancing
  if (p.age >= 55) {
    recs.push({
      id: "senior-rebalance",
      priority: "high",
      category: "rebalance",
      emoji: "🔄",
      title: "De-Risk Portfolio — Sequence-of-Returns Risk Is Real at 55+",
      subtitle: `Age ${p.age} → shift 10%/yr from equity to SCSS + POMIS`,
      reasoning: `At ${p.age}, a 40% market crash 2 years before retirement permanently damages your corpus. Start shifting equity to guaranteed income instruments now.`,
      action: `Move 10% of equity holdings to SCSS (${RATES.scss}%, max ₹30L, quarterly income) and POMIS (${RATES.pomis}%, max ₹9L, monthly income) each year. Both lump-sum-only at Post Office or SBI.`,
      monthlyAmount: 0,
      investmentType: "lump-sum",
      platform: ["Post Office", "SBI"],
      expectedOutcome: `Guaranteed ₹${Math.round(
        (Math.min(p.existingCorpus, 3000000) * (RATES.scss / 100)) / 12,
      ).toLocaleString()}/mo income from SCSS`,
      avoidMistake:
        "Don't stay 80% equity into retirement — the market doesn't respect your timeline.",
      urgency: "Start this year's allocation.",
      orderIndex: order++,
    });
  }

  return recs.sort((a, b) => a.orderIndex - b.orderIndex);
}

// ─── PLAN SUMMARY ─────────────────────────────────────────────────────────────

export function generatePlanSummary(
  p: FinancialProfile,
  recs: Recommendation[],
): PlanSummary {
  const GOAL_NAMES: Record<string, string> = {
    retirement: "Retirement",
    house: "Buy a House",
    education: "Child's Education",
    emergency: "Emergency Fund",
    wealth: "Wealth Creation",
    marriage: "Marriage",
    travel: "Travel Fund",
  };
  const cagrMap = { conservative: 8, moderate: 12, aggressive: 16 };
  const cagr = cagrMap[p.riskAppetite] ?? 12;
  const sp = surplus(p);

  const goalRecs = recs.filter(
    (r) =>
      (r.category === "goal" || r.category === "wealth") && !r.isParallelGoal,
  );
  const totalSip = goalRecs.reduce((s, r) => s + (r.monthlyAmount || 0), 0);
  const totalLs = goalRecs.reduce((s, r) => s + (r.lumpSum || 0), 0);

  const r = cagr / 100 / 12,
    n = p.goalYears * 12;
  const sipC =
    totalSip > 0 && n > 0
      ? Math.round(totalSip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r))
      : 0;
  const lsC = totalLs > 0 ? lumpCorpus(totalLs, p.goalYears, cagr) : 0;
  const existC = lumpCorpus(p.existingCorpus || 0, p.goalYears, cagr);
  const projected = sipC + lsC + existC;

  const stepupC = sipStepupCorpus(
    totalSip,
    p.existingCorpus || 0,
    p.goalYears,
    cagr,
    10,
  );

  const allSip = recs.reduce((s, r) => s + (r.monthlyAmount || 0), 0);
  const allLs = recs.reduce((s, r) => s + (r.lumpSum || 0), 0);
  const taxSav = recs.reduce((s, r) => s + (r.taxSaving || 0), 0);

  const goalBudget = Math.max(0, sp - allSip + totalSip);
  const feas = assessGoalFeasibility(p, Math.max(totalSip, goalBudget));

  return {
    goalName: GOAL_NAMES[p.primaryGoal] ?? p.primaryGoal,
    goalTarget: p.goalAmountTarget,
    goalYears: p.goalYears,
    projectedCorpus: projected,
    projectedFromSip: sipC,
    projectedFromLump: lsC,
    projectedFromExisting: existC,
    sipStepupCorpus: stepupC,
    onTrack: projected >= p.goalAmountTarget * 0.95,
    targetYear: new Date().getFullYear() + p.goalYears,
    totalMonthlySip: allSip,
    totalLumpSum: allLs,
    remainingLumpSum: Math.max(0, p.availableLumpSum - allLs),
    totalTaxSaving: taxSav,
    surplusUsed: allSip,
    surplusRemaining: Math.max(0, sp - allSip),
    feasibility: { ...feas, projectedCorpus: projected },
  };
}

// ─── PROFILING QUESTIONS ──────────────────────────────────────────────────────

export type QuestionType = "number" | "boolean" | "select" | "slider";

export interface ProfileQuestion {
  id: keyof FinancialProfile | string;
  step: number;
  type: QuestionType;
  question: string;
  subtext?: string;
  options?: { value: string | number | boolean; label: string }[];
  min?: number;
  max?: number;
  step_size?: number;
  format?: "currency" | "years" | "percent";
  default: string | number | boolean;
}

export const TOTAL_STEPS = 6;

export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  // Step 1 — Identity
  {
    id: "age",
    step: 1,
    type: "slider",
    question: "How old are you?",
    subtext: "Determines equity allocation and eligible instruments",
    min: 18,
    max: 75,
    step_size: 1,
    format: "years",
    default: 30,
  },
  {
    id: "isMarried",
    step: 1,
    type: "boolean",
    question: "Are you married?",
    options: [
      { value: true, label: "Yes" },
      { value: false, label: "No" },
    ],
    default: false,
  },
  {
    id: "hasGirlChild",
    step: 1,
    type: "boolean",
    question: "Do you have a daughter under 10?",
    subtext: "SSY gives 8.2% guaranteed + fully tax-free",
    options: [
      { value: true, label: "Yes" },
      { value: false, label: "No" },
    ],
    default: false,
  },
  {
    id: "dependents",
    step: 1,
    type: "slider",
    question: "Financial dependents?",
    subtext: "Spouse, children, parents who rely on your income",
    min: 0,
    max: 8,
    step_size: 1,
    default: 0,
  },

  // Step 2 — Income
  {
    id: "monthlyIncome",
    step: 2,
    type: "slider",
    question: "Monthly gross income?",
    subtext: "Before tax and deductions",
    min: 15000,
    max: 2000000,
    step_size: 5000,
    format: "currency",
    default: 80000,
  },
  {
    id: "incomeType",
    step: 2,
    type: "select",
    question: "How do you earn?",
    options: [
      { value: "salaried", label: "Salaried" },
      { value: "self-employed", label: "Self-employed / Freelancer" },
      { value: "business", label: "Business owner" },
      { value: "retired", label: "Retired" },
    ],
    default: "salaried",
  },
  {
    id: "taxBracket",
    step: 2,
    type: "select",
    question: "Income tax slab?",
    options: [
      { value: 0, label: "No tax (< ₹3L)" },
      { value: 5, label: "5% (₹3–7L)" },
      { value: 10, label: "10%" },
      { value: 20, label: "20% (₹9–15L)" },
      { value: 30, label: "30% (> ₹15L)" },
    ],
    default: 20,
  },
  {
    id: "employerPfMonthly",
    step: 2,
    type: "slider",
    question: "Monthly EPF deduction?",
    subtext: "Employee contribution. 0 if self-employed.",
    min: 0,
    max: 50000,
    step_size: 500,
    format: "currency",
    default: 0,
  },

  // Step 3 — Obligations
  {
    id: "monthlyExpenses",
    step: 3,
    type: "slider",
    question: "Fixed monthly expenses?",
    subtext: "Rent + groceries + utilities (not EMIs)",
    min: 5000,
    max: 500000,
    step_size: 1000,
    format: "currency",
    default: 30000,
  },
  {
    id: "monthlyEmi",
    step: 3,
    type: "slider",
    question: "Total monthly EMIs?",
    subtext: "Home + car + personal loans combined",
    min: 0,
    max: 300000,
    step_size: 500,
    format: "currency",
    default: 0,
  },
  {
    id: "hasTermInsurance",
    step: 3,
    type: "boolean",
    question: "Do you have term insurance?",
    subtext: "Pure term plan — not endowment or ULIP",
    options: [
      { value: true, label: "Yes — I have term insurance" },
      { value: false, label: "No term insurance" },
    ],
    default: false,
  },
  {
    id: "hasHealthInsurance",
    step: 3,
    type: "boolean",
    question: "Do you have health insurance?",
    subtext: "Personal or comprehensive employer cover",
    options: [
      { value: true, label: "Yes, covered" },
      { value: false, label: "No health insurance" },
    ],
    default: false,
  },

  // Step 4 — Current State
  {
    id: "emergencyFund",
    step: 4,
    type: "slider",
    question: "Emergency fund balance?",
    subtext: "Savings accessible within 24 hours",
    min: 0,
    max: 2000000,
    step_size: 10000,
    format: "currency",
    default: 0,
  },
  {
    id: "existingCorpus",
    step: 4,
    type: "slider",
    question: "Existing investments / savings?",
    subtext: "MFs + FDs + stocks + gold already held",
    min: 0,
    max: 50000000,
    step_size: 50000,
    format: "currency",
    default: 0,
  },
  {
    id: "existing80cInvested",
    step: 4,
    type: "slider",
    question: "80C invested this financial year?",
    subtext: "LIC + ELSS + 5-yr FD + home loan principal (not EPF)",
    min: 0,
    max: 150000,
    step_size: 5000,
    format: "currency",
    default: 0,
  },
  {
    id: "highInterestDebt",
    step: 4,
    type: "slider",
    question: "High-interest debt outstanding?",
    subtext: "Credit card + personal loans above 10% interest",
    min: 0,
    max: 2000000,
    step_size: 10000,
    format: "currency",
    default: 0,
  },
  {
    id: "availableLumpSum",
    step: 4,
    type: "slider",
    question: "Lump sum available to invest now?",
    subtext: "Bonus, FD maturity, savings surplus — one-time amount",
    min: 0,
    max: 10000000,
    step_size: 25000,
    format: "currency",
    default: 0,
  },
  {
    id: "lumpSumSource",
    step: 4,
    type: "select",
    question: "Where is this lump sum from?",
    subtext: "Helps allocate it correctly",
    options: [
      { value: "savings", label: "💰 Built-up savings" },
      { value: "bonus", label: "🎁 Bonus / incentive" },
      { value: "inheritance", label: "🏛️ Inheritance / gift" },
      { value: "maturity", label: "📋 FD / LIC maturity" },
      { value: "none", label: "— No lump sum" },
    ],
    default: "none",
  },

  // Step 5 — Goals
  {
    id: "primaryGoal",
    step: 5,
    type: "select",
    question: "Primary financial goal?",
    options: [
      { value: "retirement", label: "🏖️ Retirement" },
      { value: "house", label: "🏠 Buy a house" },
      { value: "education", label: "🎓 Child's education" },
      { value: "emergency", label: "🛡️ Emergency fund" },
      { value: "wealth", label: "📈 Long-term wealth" },
      { value: "marriage", label: "💍 Marriage" },
    ],
    default: "wealth",
  },
  {
    id: "goalAmountTarget",
    step: 5,
    type: "slider",
    question: "Target corpus amount?",
    subtext: "How much do you need?",
    min: 100000,
    max: 100000000,
    step_size: 100000,
    format: "currency",
    default: 5000000,
  },
  {
    id: "goalYears",
    step: 5,
    type: "slider",
    question: "In how many years?",
    subtext: "Longer = more equity = higher expected returns",
    min: 1,
    max: 40,
    step_size: 1,
    format: "years",
    default: 10,
  },
  {
    id: "retirementAge",
    step: 5,
    type: "slider",
    question: "Target retirement age?",
    subtext: "Affects NPS lock-in and de-risking timeline",
    min: 45,
    max: 70,
    step_size: 1,
    format: "years",
    default: 60,
  },

  // Step 6 — Risk
  {
    id: "riskAppetite",
    step: 6,
    type: "select",
    question: "If your investment drops 20%, you:",
    subtext: "Be honest — this shapes your entire equity allocation",
    options: [
      { value: "conservative", label: "😰 Want to sell immediately" },
      { value: "moderate", label: "😐 Hold and wait — it will recover" },
      { value: "aggressive", label: "😊 Buy more — this is an opportunity" },
    ],
    default: "moderate",
  },
];
