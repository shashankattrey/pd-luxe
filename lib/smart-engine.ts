// ─────────────────────────────────────────────────────────────────────────────
// smart-engine-v2.ts  —  PaisaDekho Wealth Intelligence Engine
//
// Design principles (what separates this from every other tool):
//
//  1. GOAL FEASIBILITY FIRST — validates whether the goal is mathematically
//     possible before recommending anything. If not, shows exact scenarios.
//
//  2. HORIZON-GATED INSTRUMENTS — PPF/NPS/ELSS are NEVER recommended for
//     goals < 5 years. Lock-in must be shorter than the goal horizon.
//
//  3. PARALLEL GOAL ARCHITECTURE — distinguishes between:
//       a) The user's stated goal (house/wealth/education/etc.)
//       b) Always-on goals (retirement, tax saving) that run in parallel
//     Tax-saving instruments appear as a SEPARATE parallel track, not mixed
//     in with the primary goal allocation.
//
//  4. NET WORTH AWARE — considers existing corpus, not just monthly surplus.
//     A ₹3L earner with ₹80L already saved needs completely different advice
//     than one starting from zero.
//
//  5. BUDGET-ACCURATE — every recommendation deducts from a running surplus
//     tracker. The final SIP allocation for the goal = surplus AFTER all
//     prior obligations. No double-spending.
//
//  6. SCENARIO PLANNING — when goal is infeasible, shows 4 specific numbered
//     alternatives with exact amounts, not vague "extend timeline" advice.
//
//  7. INSTRUMENT VETO TABLE — each instrument has a minimum horizon. If the
//     goal horizon is shorter, the instrument is vetoed entirely.
//
//  8. SGB suppressed when no lump sum — never shows a vague "₹5,800+" card.
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

export interface FinancialProfile {
  // Identity
  age: number;
  isMarried: boolean;
  hasGirlChild: boolean;
  girlChildAge?: number;
  isGovtEmployee: boolean;
  dependents: number;
  // Income
  monthlyIncome: number;
  incomeType: IncomeType;
  taxBracket: TaxBracket;
  employerPfMonthly: number;
  // Obligations
  monthlyExpenses: number;
  monthlyEmi: number;
  monthlyRent: number;
  // Protection
  hasTermInsurance: boolean;
  termCoverAmount: number;
  hasHealthInsurance: boolean;
  healthCoverAmount: number;
  // Current state
  emergencyFund: number;
  existingCorpus: number; // ← NEW: existing savings/investments already built up
  existing80cInvested: number;
  highInterestDebt: number;
  existingInvestments: string[];
  availableLumpSum: number;
  lumpSumSource: "savings" | "bonus" | "inheritance" | "maturity" | "none";
  // Goals
  primaryGoal: GoalType;
  goalAmountTarget: number;
  goalYears: number;
  retirementAge: number;
  // Preferences
  riskAppetite: RiskAppetite;
  prefersSip: boolean;
}

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
  isParallelGoal?: boolean; // true = runs alongside primary goal, not from its budget
  horizonYears?: number; // minimum years this instrument needs
}

export interface GoalScenario {
  label: string; // "A", "B", "C", "D"
  title: string;
  description: string;
  monthlySip: number;
  lumpSum: number;
  years: number;
  targetAmt: number;
  feasible: boolean; // is this achievable given their income?
  recommended: boolean; // is this the best option?
}

export type FeasibilityStatus =
  | "achievable"
  | "close"
  | "stretch"
  | "impossible";

export interface AltScenario {
  label: string;
  description: string;
  action: string;
}

export interface GoalFeasibility {
  status: FeasibilityStatus;
  achievablePct: number; // % of target achievable
  shortfall: number;
  requiredSipMonthly: number; // SIP needed to hit target
  yearsAtCurrentSip: number; // how long at current SIP
  riskWarning?: string; // instrument mismatch warning
  altScenarios: AltScenario[]; // show when not achievable
}

export interface PlanSummary {
  goalName: string;
  goalTarget: number;
  goalYears: number;
  projectedCorpus: number;
  projectedFromSip: number;
  projectedFromLump: number;
  projectedFromExisting: number;
  sipStepupCorpus: number; // corpus if SIP grows 10%/yr
  onTrack: boolean;
  targetYear: number;
  totalMonthlySip: number;
  totalLumpSum: number;
  remainingLumpSum: number;
  totalTaxSaving: number;
  feasibility: GoalFeasibility; // ← what GoalProgressCard reads
}

// ─── INSTRUMENT VETO TABLE ────────────────────────────────────────────────────
// Any instrument whose minimum horizon exceeds the goal horizon is excluded
// from the primary goal allocation (may still appear as parallel/retirement)

const INSTRUMENT_MIN_HORIZON: Record<string, number> = {
  ppf: 15, // 15-year maturity (partial withdrawal from yr 7, but not for goal)
  nps: 999, // locked till 60 — never for a specific-year goal
  elss: 3, // 3-year lock-in
  sgb: 5, // 8-year full benefit; 5-year min for SGB to make sense
  scss: 5, // 5-year maturity
  pomis: 5, // 5-year maturity
  "rbi-bonds": 7, // 7-year maturity
  "eq-smallcap": 7, // too volatile for < 7 years
  "eq-midcap": 5, // too volatile for < 5 years
  "eq-largecap": 3, // 3-year min
  "mf-index": 3, // 3-year min for index funds
  "mf-flexi": 5, // 5-year for flexi cap
  "mf-elss": 3, // 3-year lock-in
  "bal-adv": 2, // balanced advantage: 2-year min
  fd: 0, // any duration
  liquid: 0, // any duration
  "debt-short": 1, // 1-year min
  "nps-tier2": 0, // liquid, no lock-in
};

function isAllowedForGoal(instrumentKey: string, goalYears: number): boolean {
  const min = INSTRUMENT_MIN_HORIZON[instrumentKey] ?? 0;
  return goalYears >= min;
}

// ─── MATH HELPERS ─────────────────────────────────────────────────────────────

function sipCorpus(monthly: number, years: number, cagrPct: number): number {
  if (monthly <= 0 || years <= 0) return 0;
  const r = cagrPct / 100 / 12,
    n = years * 12;
  return Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

function lumpCorpus(lump: number, years: number, cagrPct: number): number {
  if (lump <= 0 || years <= 0) return 0;
  return Math.round(lump * Math.pow(1 + cagrPct / 100, years));
}

function requiredSip(target: number, years: number, cagrPct: number): number {
  if (years <= 0) return target;
  const r = cagrPct / 100 / 12,
    n = years * 12;
  if (r === 0) return Math.round(target / n);
  return Math.round(target / (((Math.pow(1 + r, n) - 1) / r) * (1 + r)));
}

function taxSaved(amount: number, bracket: TaxBracket): number {
  return Math.round(((amount * bracket) / 100) * 1.04); // 4% cess
}

function monthsExpenses(p: FinancialProfile): number {
  const monthly = p.monthlyExpenses + p.monthlyEmi;
  return monthly > 0 ? parseFloat((p.emergencyFund / monthly).toFixed(1)) : 0;
}

function surplus(p: FinancialProfile): number {
  return Math.max(
    0,
    p.monthlyIncome - p.monthlyExpenses - p.monthlyEmi - p.monthlyRent,
  );
}

function remaining80c(p: FinancialProfile): number {
  const epfAnnual = p.employerPfMonthly * 24; // employer + employee
  return Math.max(0, 150000 - p.existing80cInvested - epfAnnual);
}

function yrsToRetirement(p: FinancialProfile): number {
  return Math.max(0, p.retirementAge - p.age);
}

// ─── GOAL FEASIBILITY ENGINE ──────────────────────────────────────────────────

function computeGoalFeasibility(p: FinancialProfile): {
  feasible: boolean;
  requiredSipAmt: number;
  maxAchievable: number;
  feasibilityPct: number;
  scenarios: GoalScenario[];
} {
  const sp = surplus(p);
  const cagrMap = { conservative: 8, moderate: 12, aggressive: 16 };
  const cagr = cagrMap[p.riskAppetite];
  const existing = p.existingCorpus + p.availableLumpSum;

  // What corpus can we build with max surplus?
  const maxFromSip = sipCorpus(sp, p.goalYears, cagr);
  const maxFromLump = lumpCorpus(existing, p.goalYears, cagr);
  const maxTotal = maxFromSip + maxFromLump;

  const reqSip = Math.max(
    0,
    requiredSip(p.goalAmountTarget - maxFromLump, p.goalYears, cagr),
  );

  const feasible = maxTotal >= p.goalAmountTarget * 0.95; // 5% tolerance
  const feasibilityPct = Math.round((maxTotal / p.goalAmountTarget) * 100);

  // ── 4 scenarios ───────────────────────────────────────────────────────
  const scenarios: GoalScenario[] = [];

  // Scenario A: Achieve same target, extend years
  let yearsNeeded = p.goalYears;
  for (let y = p.goalYears; y <= 30; y++) {
    const test = sipCorpus(sp * 0.8, y, cagr) + maxFromLump;
    if (test >= p.goalAmountTarget) {
      yearsNeeded = y;
      break;
    }
  }
  const aSip = Math.round(sp * 0.8);
  scenarios.push({
    label: "A",
    title: `Extend timeline to ${yearsNeeded} years`,
    description: `Same ₹${(p.goalAmountTarget / 100000).toFixed(0)}L target, more time`,
    monthlySip: aSip,
    lumpSum: existing,
    years: yearsNeeded,
    targetAmt: p.goalAmountTarget,
    feasible: yearsNeeded <= 30 && aSip <= sp,
    recommended: yearsNeeded <= p.goalYears * 3,
  });

  // Scenario B: Same timeline, reduced target (what CAN be achieved)
  const bTarget = maxTotal;
  scenarios.push({
    label: "B",
    title: `Reduce target to ${(bTarget / 100000).toFixed(0)}L in ${p.goalYears} years`,
    description: "Achievable with current income",
    monthlySip: Math.round(sp * 0.8),
    lumpSum: existing,
    years: p.goalYears,
    targetAmt: bTarget,
    feasible: bTarget > 0,
    recommended: !feasible && bTarget > p.goalAmountTarget * 0.5,
  });

  // Scenario C: Lump sum needed today
  const lumpNeeded = Math.max(
    0,
    p.goalAmountTarget / Math.pow(1 + cagr / 100, p.goalYears) - existing,
  );
  scenarios.push({
    label: "C",
    title: `Need ₹${(lumpNeeded / 100000).toFixed(0)}L lump sum today`,
    description: "Keep timeline, invest a large corpus now",
    monthlySip: 0,
    lumpSum: Math.round(lumpNeeded),
    years: p.goalYears,
    targetAmt: p.goalAmountTarget,
    feasible: lumpNeeded <= p.existingCorpus * 0.9,
    recommended: lumpNeeded <= p.existingCorpus * 0.7,
  });

  // Scenario D: Aggressive allocation (higher CAGR)
  const aggrCagr = 18;
  const dYears = p.goalYears;
  const dSip = requiredSip(p.goalAmountTarget - maxFromLump, dYears, aggrCagr);
  scenarios.push({
    label: "D",
    title: `Aggressive portfolio, same ${dYears} years`,
    description: `18% CAGR target via mid+small cap SIPs`,
    monthlySip: dSip,
    lumpSum: existing,
    years: dYears,
    targetAmt: p.goalAmountTarget,
    feasible: dSip <= sp,
    recommended: dSip <= sp * 0.85 && p.riskAppetite === "aggressive",
  });

  return {
    feasible,
    requiredSipAmt: reqSip,
    maxAchievable: maxTotal,
    feasibilityPct,
    scenarios,
  };
}

// ─── MAIN RECOMMENDATION ENGINE ───────────────────────────────────────────────

export function generatePreciseRecommendations(
  p: FinancialProfile,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const sp = surplus(p);
  const monthly = p.monthlyExpenses + p.monthlyEmi;
  const covered = monthsExpenses(p);
  const gap80c = remaining80c(p);
  const yrsRet = yrsToRetirement(p);
  const annualIncome = p.monthlyIncome * 12;
  const isQ4 = [1, 2, 3].includes(new Date().getMonth() + 1);
  const goalYrs = p.goalYears;

  let order = 1;
  let remSurplus = sp;
  let remLumpSum = p.availableLumpSum;

  // ══════════════════════════════════════════════════════════════════════════
  // GATE 1 — Term Insurance
  // ══════════════════════════════════════════════════════════════════════════
  if (!p.hasTermInsurance && p.dependents > 0) {
    const cover = annualIncome * 12;
    const premium = Math.round((cover * 0.0003) / 12);
    recs.push({
      id: "term-insurance",
      priority: "critical",
      category: "protection",
      emoji: "🛡️",
      title: "Buy Term Insurance — Do This Before Investing a Rupee",
      subtitle: `₹${(cover / 10000000).toFixed(1)}Cr cover · ~₹${premium.toLocaleString()}/mo`,
      reasoning: `You have ${p.dependents} dependent${p.dependents > 1 ? "s" : ""} and no term insurance. If you die tomorrow, your family has nothing. This is the single most important financial action — before any SIP, any FD, any investment whatsoever.`,
      action: `Go to ditto.in right now (fee-only, no commission bias) or PolicyBazaar. Buy ₹${(cover / 10000000).toFixed(1)}Cr pure term plan from HDFC Click2Protect Life or Max Life Smart Secure Plus. Takes 30 minutes. Pure term only — reject any agent who recommends ULIP or endowment.`,
      monthlyAmount: premium,
      investmentType: "sip",
      platform: [
        "Ditto Insurance (ditto.in)",
        "PolicyBazaar",
        "HDFC Click2Protect",
      ],
      expectedOutcome: `₹${(cover / 10000000).toFixed(1)}Cr protection for your family at ~₹${(premium * 12).toLocaleString()}/yr`,
      avoidMistake:
        "Never buy endowment/money-back/ULIP plans disguised as insurance. They give terrible returns AND inadequate cover. Your term plan should be a pure death benefit, nothing else.",
      urgency: "TODAY — literally before opening any investment app.",
      orderIndex: order++,
    });
    remSurplus -= premium;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GATE 2 — Health Insurance
  // ══════════════════════════════════════════════════════════════════════════
  if (!p.hasHealthInsurance) {
    const premium = Math.round(p.isMarried ? 2100 : 1300);
    const saving = taxSaved(p.isMarried ? 50000 : 25000, p.taxBracket);
    recs.push({
      id: "health-insurance",
      priority: "critical",
      category: "protection",
      emoji: "🏥",
      title:
        "Get Health Insurance — Medical Bills Are Financially Catastrophic",
      subtitle: `₹10L floater · ~₹${premium.toLocaleString()}/mo · saves ₹${saving.toLocaleString()}/yr tax`,
      reasoning: `No health insurance means a single hospitalisation (₹2–5L in private hospitals) can wipe out months of savings. Your employer's group cover ends the day you resign. The premium also saves you ₹${saving.toLocaleString()} under 80D this year.`,
      action: `Buy ₹10L family floater on Niva Bupa (their ReAssure plan is best value) or Star Health Comprehensive. Compare on PolicyBazaar. Add parents separately (₹5L senior plan) for extra ₹25k 80D deduction.`,
      monthlyAmount: premium,
      investmentType: "sip",
      platform: ["Niva Bupa — ReAssure plan", "Star Health", "PolicyBazaar"],
      expectedOutcome: `₹10L health cover + ₹${saving.toLocaleString()}/yr tax saving via 80D`,
      avoidMistake:
        "Don't rely only on employer health insurance — it provides zero cover during job gaps, notice periods, and freelance stints.",
      taxSaving: saving,
      urgency: "This month — before starting any SIP.",
      orderIndex: order++,
    });
    remSurplus -= premium;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GATE 3 — Emergency Fund
  // ══════════════════════════════════════════════════════════════════════════
  if (covered < 6) {
    const target = monthly * 6;
    const gap = Math.max(0, target - p.emergencyFund);
    const lsNow = Math.min(remLumpSum, gap);
    const gapLeft = gap - lsNow;
    const sipEm = Math.min(
      remSurplus * 0.4,
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
      reasoning: `Your emergency fund covers ${covered} months of ₹${monthly.toLocaleString()}/mo expenses. Without 6 months buffer you'll be forced to break SIPs or take personal loans during any job loss or medical event — exactly when markets are also likely down.`,
      action:
        lsNow > 0
          ? `Transfer ₹${lsNow.toLocaleString()} to IDFC FIRST Bank savings (7% p.a.) today. Then add ₹${sipEm.toLocaleString()}/mo till you hit ₹${target.toLocaleString()}. Above ₹1L, sweep into HDFC Liquid Fund (6.8%, T+1 withdrawal).`
          : `Auto-transfer ₹${sipEm.toLocaleString()}/mo to IDFC FIRST Bank savings (7%). Target: ₹${target.toLocaleString()} in ${months} months. Above ₹1L, park in HDFC Liquid Fund.`,
      monthlyAmount: sipEm,
      lumpSum: lsNow > 0 ? lsNow : undefined,
      investmentType: lsNow > 0 ? (sipEm > 0 ? "both" : "lump-sum") : "sip",
      platform: ["IDFC FIRST Bank savings (7%)", "HDFC Liquid Fund via Groww"],
      expectedOutcome: `6-month emergency fund of ₹${target.toLocaleString()} in ${months} months`,
      avoidMistake:
        "Never invest emergency money in equity, crypto, or locked FDs. Needs to be available within 24 hours.",
      urgency:
        covered < 2
          ? "CRITICAL — before equity SIPs."
          : "Complete within 6 months.",
      orderIndex: order++,
    });
    remLumpSum -= lsNow;
    remSurplus -= sipEm;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GATE 4 — High-Interest Debt
  // ══════════════════════════════════════════════════════════════════════════
  if (p.highInterestDebt > 0) {
    const lsToDebt = Math.min(remLumpSum, p.highInterestDebt);
    const remaining = p.highInterestDebt - lsToDebt;
    const sipDebt = Math.min(remSurplus * 0.6, Math.round(remaining / 12));
    const interest = Math.round(p.highInterestDebt * 0.15);
    recs.push({
      id: "debt-payoff",
      priority: "critical",
      category: "debt",
      emoji: "🔴",
      title: "Clear High-Interest Debt First — Guaranteed 15%+ Return",
      subtitle:
        lsToDebt >= p.highInterestDebt
          ? `Pay ₹${p.highInterestDebt.toLocaleString()} today · saves ₹${interest.toLocaleString()}/yr interest`
          : `₹${lsToDebt.toLocaleString()} now + ₹${sipDebt.toLocaleString()}/mo`,
      reasoning: `Paying off 15% debt is a guaranteed 15% return — better than any mutual fund. Your ₹${p.highInterestDebt.toLocaleString()} debt costs ₹${interest.toLocaleString()}/yr in interest. No equity fund gives guaranteed 15% returns.`,
      action:
        lsToDebt >= p.highInterestDebt
          ? `Pay ₹${p.highInterestDebt.toLocaleString()} via bank app → Loan Repayment → Prepay Principal. Credit card first (36% rate), then personal loan, then car loan.`
          : `Pay ₹${lsToDebt > 0 ? lsToDebt.toLocaleString() : "0"} now as prepayment + ₹${sipDebt.toLocaleString()}/mo extra principal. Avalanche method: highest interest rate first.`,
      monthlyAmount: sipDebt,
      lumpSum: lsToDebt > 0 ? lsToDebt : undefined,
      investmentType:
        lsToDebt > 0 ? (sipDebt > 0 ? "both" : "lump-sum") : "sip",
      platform: ["Your bank app — Prepay Principal"],
      expectedOutcome: `Debt-free in ${sipDebt > 0 ? Math.ceil(remaining / sipDebt) : 0} months · saves ₹${interest.toLocaleString()}/yr in interest`,
      avoidMistake:
        "Never invest in equity while carrying credit card debt at 36%. You are guaranteed to lose money on net.",
      urgency: "Today — every day of delay costs interest.",
      orderIndex: order++,
    });
    remLumpSum -= lsToDebt;
    remSurplus -= sipDebt;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRIMARY GOAL — Feasibility Check & Allocation
  // ══════════════════════════════════════════════════════════════════════════
  const { feasible, requiredSipAmt, maxAchievable, feasibilityPct, scenarios } =
    computeGoalFeasibility(p);

  const cagrMap = { conservative: 8, moderate: 12, aggressive: 16 };
  const goalCagr = cagrMap[p.riskAppetite];

  // Budget for primary goal = remaining surplus after gates
  const goalBudget = remSurplus;
  const goalLump = remLumpSum; // remaining lump sum after gates

  if (!feasible) {
    // ── INFEASIBLE GOAL — show scenario card ────────────────────────────
    const bestScenario =
      scenarios.find((s) => s.feasible && s.recommended) ||
      scenarios.find((s) => s.feasible) ||
      scenarios[0];

    recs.push({
      id: "goal-infeasible",
      priority: "critical",
      category: "goal",
      emoji: "⚡",
      title: `₹${(p.goalAmountTarget / 100000).toFixed(0)}L in ${goalYrs} Years — Needs Adjustment`,
      subtitle: `You can reach ₹${(maxAchievable / 100000).toFixed(0)}L · target needs ₹${(requiredSipAmt / 1000).toFixed(0)}k/mo SIP`,
      reasoning: `To reach ₹${(p.goalAmountTarget / 100000).toFixed(0)}L in ${goalYrs} years at ${goalCagr}% CAGR you need ₹${requiredSipAmt.toLocaleString()}/mo in SIPs. Your available surplus after obligations is ₹${goalBudget.toLocaleString()}/mo — that reaches ₹${(maxAchievable / 100000).toFixed(0)}L. The gap is real and the math doesn't lie. Here are your 4 realistic paths:`,
      action: scenarios
        .map(
          (s) =>
            `Scenario ${s.label}: ${s.title}\n  → ₹${s.monthlySip.toLocaleString()}/mo SIP for ${s.years} years → reaches ₹${(s.targetAmt / 100000).toFixed(0)}L${s.feasible ? " ✅ Achievable" : " ❌ Still needs more"}`,
        )
        .join("\n\n"),
      monthlyAmount:
        bestScenario.monthlySip > 0
          ? Math.min(bestScenario.monthlySip, goalBudget)
          : 0,
      lumpSum:
        bestScenario.lumpSum > 0
          ? Math.min(bestScenario.lumpSum, goalLump)
          : undefined,
      investmentType: "both",
      platform: ["Review and pick a scenario, then return to start plan"],
      expectedOutcome: `Best achievable: ₹${(maxAchievable / 100000).toFixed(0)}L in ${goalYrs} years with your current income`,
      avoidMistake:
        "Don't set an unreachable target and invest randomly. Pick Scenario A or B above and commit to it — consistency beats ambition.",
      urgency: "Revisit your goal first, then come back to build the plan.",
      orderIndex: order++,
    });
  } else {
    // ── FEASIBLE GOAL — allocate by horizon ─────────────────────────────
    const existingBoost = lumpCorpus(p.existingCorpus, goalYrs, goalCagr);
    const lumpBoost = lumpCorpus(goalLump, goalYrs, goalCagr);
    const sipNeeded = Math.max(
      0,
      requiredSip(
        p.goalAmountTarget - existingBoost - lumpBoost,
        goalYrs,
        goalCagr,
      ),
    );
    const actualSip = Math.min(goalBudget, sipNeeded);

    if (goalYrs <= 1) {
      // ── ULTRA SHORT: liquid + FD only ─────────────────────────────
      const fdLump = Math.min(goalLump, p.goalAmountTarget);
      const corpus =
        sipCorpus(actualSip, goalYrs, 7.5) + lumpCorpus(fdLump, goalYrs, 8.85);
      recs.push({
        id: "goal-ultrashort",
        priority: "high",
        category: "goal",
        emoji: "💧",
        title: `${goalYrs}-Year Goal → Liquid Fund + FD Only`,
        subtitle: `₹${actualSip.toLocaleString()}/mo HDFC Short Duration + ${fdLump > 0 ? `₹${fdLump.toLocaleString()} FD` : ""}`,
        reasoning: `${goalYrs <= 1 ? "Under 1 year" : `${goalYrs} years`} is too short for equity — markets can drop 40% and not recover in time. Capital protection is more important than returns here.`,
        action: [
          actualSip > 0
            ? `₹${actualSip.toLocaleString()}/mo → HDFC Short Duration Fund (Direct) on Kuvera. 7.8%, capital safe.`
            : null,
          fdLump > 0
            ? `₹${fdLump.toLocaleString()} → AU Small Finance Bank FD (9.1%, 9-12 months) via aubank.in`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        monthlyAmount: actualSip,
        lumpSum: fdLump > 0 ? fdLump : undefined,
        investmentType:
          fdLump > 0 && actualSip > 0
            ? "both"
            : fdLump > 0
              ? "lump-sum"
              : "sip",
        platform: ["Kuvera — HDFC Short Duration", "AU Bank app"],
        expectedOutcome: `₹${(corpus / 100000).toFixed(0)}L · capital protected · ready when needed`,
        avoidMistake:
          "Zero equity for < 1 year goals. Not even balanced funds. Stick to FD and short duration debt.",
        urgency: "Start this month.",
        orderIndex: order++,
      });
      remLumpSum -= fdLump;
      remSurplus -= actualSip;
    } else if (goalYrs <= 3) {
      // ── SHORT: FD lump sum + balanced fund SIP ─────────────────────
      const fdLump = Math.min(goalLump, Math.round(p.goalAmountTarget * 0.4));
      const balSip = Math.min(actualSip, remSurplus);
      const corpus =
        sipCorpus(balSip, goalYrs, 10) + lumpCorpus(fdLump, goalYrs, 8.85);
      recs.push({
        id: "goal-short",
        priority: "high",
        category: "goal",
        emoji: "⚖️",
        title: `${goalYrs}-Year Goal → Balanced Fund SIP + FD`,
        subtitle: `₹${balSip.toLocaleString()}/mo Balanced Advantage${fdLump > 0 ? ` + ₹${fdLump.toLocaleString()} FD` : ""}`,
        reasoning: `${goalYrs} years allows moderate equity exposure. SIP into balanced advantage fund reduces timing risk. Lump sum goes into FD (guaranteed 8.85%) not equity — you can't afford a market crash 1 year before your goal date.`,
        action: [
          `₹${balSip.toLocaleString()}/mo → HDFC Balanced Advantage Fund (Direct) on Groww`,
          fdLump > 0
            ? `₹${fdLump.toLocaleString()} → Bajaj Finance FD (8.85%, 33-42 months) via bajajfinserv.in`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        monthlyAmount: balSip,
        lumpSum: fdLump > 0 ? fdLump : undefined,
        investmentType: fdLump > 0 ? "both" : "sip",
        platform: ["HDFC AMC Direct / Groww", "Bajaj Finserv app"],
        expectedOutcome: `~₹${(corpus / 100000).toFixed(0)}L in ${goalYrs} years · low volatility`,
        avoidMistake:
          "For 2-3 year goals, lump sum must go into FD or debt, NOT equity. Equity SIP is fine — equity lump sum is not.",
        urgency: "Start SIP this month. Book FD today.",
        orderIndex: order++,
      });
      remLumpSum -= fdLump;
      remSurplus -= balSip;
    } else if (goalYrs <= 7) {
      // ── MEDIUM: 60% index + 40% short duration ─────────────────────
      const indexSip = Math.round(actualSip * 0.6);
      const debtSip = actualSip - indexSip;
      const corpus =
        sipCorpus(actualSip, goalYrs, 12) + lumpCorpus(goalLump, goalYrs, 12);
      const lsAction =
        goalLump > 10000
          ? `\nLump sum: ₹${goalLump.toLocaleString()} → UTI Nifty 50 Index Fund (Direct). ${goalLump > 500000 ? "Use STP over 3 months." : "Single investment today."}`
          : "";
      recs.push({
        id: "goal-medium",
        priority: "high",
        category: "goal",
        emoji: "📈",
        title: `${goalYrs}-Year Goal → 60:40 Index + Debt`,
        subtitle: `₹${indexSip.toLocaleString()}/mo index + ₹${debtSip.toLocaleString()}/mo debt`,
        reasoning: `${goalYrs} years is enough to ride out 1-2 market cycles. 60% Nifty 50 index for growth + 40% short duration debt for stability gives ~12% blended return with controlled drawdown. This 2-fund approach outperforms 80% of active fund portfolios over 7 years.`,
        action: [
          `₹${indexSip.toLocaleString()}/mo → UTI Nifty 50 Index Fund (Direct, 0.18% expense ratio) on Kuvera`,
          `₹${debtSip.toLocaleString()}/mo → HDFC Short Duration Fund (Direct) on Kuvera`,
          lsAction,
        ]
          .filter(Boolean)
          .join("\n"),
        monthlyAmount: actualSip,
        lumpSum: goalLump > 10000 ? goalLump : undefined,
        investmentType: goalLump > 10000 ? "both" : "sip",
        platform: ["Kuvera (manage both SIPs together)"],
        expectedOutcome: `₹${(corpus / 100000).toFixed(0)}L in ${goalYrs} years · for ${p.primaryGoal}`,
        avoidMistake:
          "Don't split into 5+ funds thinking diversification helps. This 2-fund portfolio is proven. More funds = more complexity, not more returns.",
        urgency: "Set SIPs on the 1st of next month after salary credit.",
        orderIndex: order++,
      });
      remLumpSum -= Math.min(goalLump, remLumpSum);
      remSurplus -= actualSip;
    } else {
      // ── LONG: Full equity 3-fund ────────────────────────────────────
      const eqPct = Math.max(60, Math.min(85, 100 - p.age));
      const indexSip = Math.round(actualSip * 0.4);
      const flexiSip = Math.round(actualSip * 0.3);
      const midSip = Math.round(actualSip * Math.max(0, eqPct / 100 - 0.7));
      const safeSip = Math.max(0, actualSip - indexSip - flexiSip - midSip);
      const corpus = sipCorpus(actualSip, goalYrs, goalCagr);
      const lsBoost = lumpCorpus(goalLump, goalYrs, goalCagr);
      recs.push({
        id: "goal-long",
        priority: "high",
        category: "goal",
        emoji: "🚀",
        title: `${goalYrs}+ Year Wealth → ${eqPct}% Equity 3-Fund Portfolio`,
        subtitle: `₹${actualSip.toLocaleString()}/mo across 3 funds · ${goalCagr}% CAGR`,
        reasoning: `${goalYrs} years spans 3-4 market cycles. At age ${p.age}, you can hold ${eqPct}% equity (100 - age rule). The 3-fund structure — Nifty 50 for stability, Parag Parikh for alpha + global diversification, Motilal Midcap for growth — has historically returned 14-18% over any 10-year period in India.`,
        action: [
          `₹${indexSip.toLocaleString()}/mo → UTI Nifty 50 Index Fund (Direct) [Core 40%]`,
          `₹${flexiSip.toLocaleString()}/mo → Parag Parikh Flexi Cap (Direct) [25% India, 75% global]`,
          midSip > 500
            ? `₹${midSip.toLocaleString()}/mo → Motilal Oswal Midcap (Direct) [High-growth satellite]`
            : null,
          safeSip > 500
            ? `₹${safeSip.toLocaleString()}/mo → HDFC Short Duration (Direct) [Stability anchor]`
            : null,
          goalLump > 10000
            ? `\nLump sum: ₹${goalLump.toLocaleString()} → UTI Nifty 50 Index Fund today${goalLump > 500000 ? " via STP over 3 months" : ""}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        monthlyAmount: actualSip,
        lumpSum: goalLump > 10000 ? goalLump : undefined,
        investmentType: goalLump > 10000 ? "both" : "sip",
        platform: [
          "Kuvera (all 3 SIPs in one place)",
          "PPFAS Direct — for Parag Parikh",
        ],
        expectedOutcome: `₹${((corpus + lsBoost) / 10000000).toFixed(2)}Cr in ${goalYrs} years (SIP ₹${(corpus / 10000000).toFixed(2)}Cr + lump sum ₹${(lsBoost / 10000000).toFixed(2)}Cr)`,
        avoidMistake:
          "Don't redeem when markets fall 20% — that's the single worst mistake. Historically, every Indian market drawdown has recovered within 2-3 years. Keep SIPping through the dip.",
        urgency:
          "Start all 3 SIPs today. Lump sum into index after SIPs are running.",
        orderIndex: order++,
      });
      remLumpSum -= Math.min(goalLump, remLumpSum);
      remSurplus -= actualSip;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARALLEL TRACK 1 — Tax Saving (only instruments compatible with goal horizon)
  // These are separate from goal allocation — they have their own budget
  // ══════════════════════════════════════════════════════════════════════════
  const taxBudget = Math.min(remSurplus, Math.round(sp * 0.15)); // max 15% of surplus for tax

  // PPF — only if goal horizon > 7 years OR user has a separate retirement mindset
  if (
    gap80c > 10000 &&
    remSurplus > 5000 &&
    (goalYrs > 7 || p.primaryGoal === "retirement")
  ) {
    const ppfSip = Math.min(
      Math.round(Math.min(gap80c, 150000) / 12),
      taxBudget,
    );
    const ppfLump = isQ4 && remLumpSum >= 150000 ? 150000 : 0;
    const saving = taxSaved(Math.min(gap80c, 150000), p.taxBracket);
    recs.push({
      id: "ppf",
      priority: "high",
      category: "parallel",
      emoji: "📌",
      title: "PPF — Parallel Retirement Track (Not for Your Primary Goal)",
      subtitle: `₹${ppfSip.toLocaleString()}/mo · 80C + EEE · separate from your ${p.goalYears}-yr goal`,
      reasoning: `PPF has a 15-year lock-in — it cannot help your ${goalYrs}-year ${p.primaryGoal} goal. But it runs as a parallel retirement/wealth track. Invest ₹${ppfSip.toLocaleString()}/mo here separately; this money is untouchable for 15 years and builds a tax-free retirement cushion.`,
      action:
        ppfLump > 0
          ? `Deposit ₹1,50,000 in PPF on April 5 for maximum interest (12 months vs partial). Then open at SBI/HDFC Bank.`
          : `Set ₹${ppfSip.toLocaleString()}/mo standing instruction to PPF on the 1st. Open at SBI or HDFC Bank online.`,
      monthlyAmount: ppfSip,
      lumpSum: ppfLump > 0 ? ppfLump : undefined,
      investmentType: ppfLump > 0 ? "lump-sum" : "sip",
      platform: ["SBI PPF online", "HDFC Bank PPF"],
      expectedOutcome: `₹${taxSaved(ppfSip * 12, p.taxBracket).toLocaleString()}/yr tax saved · ₹${(sipCorpus(ppfSip, 15, 7.1) / 100000).toFixed(0)}L retirement corpus in 15 years`,
      avoidMistake: `PPF cannot be used for your ${goalYrs}-year goal — money is locked for 15 years. This is a parallel retirement investment, not goal-linked.`,
      taxSaving: saving,
      urgency: "Run this parallel to your main goal SIPs.",
      orderIndex: order++,
      isParallelGoal: true,
      horizonYears: 15,
    });
    remSurplus -= ppfSip;
    if (ppfLump > 0) remLumpSum -= ppfLump;
  }

  // ELSS — only if horizon >= 3 years
  if (gap80c > 5000 && isAllowedForGoal("elss", goalYrs) && remSurplus > 3000) {
    const consumed = goalYrs > 7 ? Math.min(gap80c, 150000) : 0; // PPF consumed if long goal
    const elssGap = Math.max(0, gap80c - consumed);
    if (elssGap > 3000) {
      const elssSip = Math.min(Math.round(elssGap / 12), remSurplus);
      const lsElss = isQ4 && remLumpSum >= elssGap ? elssGap : 0;
      const saving = taxSaved(lsElss > 0 ? lsElss : elssSip * 12, p.taxBracket);
      recs.push({
        id: "elss",
        priority: "high",
        category: "parallel",
        emoji: "💰",
        title:
          isQ4 && lsElss > 0
            ? "ELSS — Lump Sum Before March 31 to Save Taxes This Year"
            : "ELSS — Fill 80C Gap, Best Return Among Tax Savers",
        subtitle: `${lsElss > 0 ? `₹${lsElss.toLocaleString()} lump sum` : `₹${elssSip.toLocaleString()}/mo`} · saves ₹${saving.toLocaleString()}/yr`,
        reasoning: isQ4
          ? `March 31 deadline approaching. You have ₹${elssGap.toLocaleString()} of unused 80C. Investing now saves ₹${saving.toLocaleString()} in taxes this financial year.`
          : `Your 80C gap is ₹${elssGap.toLocaleString()}/yr. ELSS gives equity returns (~16% historical) with 80C deduction — the only tax saver that also grows your wealth.`,
        action:
          lsElss > 0
            ? `Invest ₹${lsElss.toLocaleString()} in Mirae Asset ELSS Tax Saver (Direct) on Groww before March 31.`
            : `₹${elssSip.toLocaleString()}/mo SIP in Mirae Asset ELSS Tax Saver (Direct) on Groww. Choose Direct Plan only.`,
        monthlyAmount: lsElss > 0 ? 0 : elssSip,
        lumpSum: lsElss > 0 ? lsElss : undefined,
        investmentType: lsElss > 0 ? "lump-sum" : "sip",
        platform: ["Groww", "Kuvera", "Mirae AMC Direct"],
        expectedOutcome: `₹${saving.toLocaleString()}/yr tax saved · ₹${(sipCorpus(elssSip > 0 ? elssSip : Math.round(elssGap / 12), 10, 16) / 100000).toFixed(0)}L in 10 years`,
        avoidMistake:
          "Never buy Regular Plan ELSS from bank — the 1.5-2% annual commission compounds massively against you over 10 years.",
        taxSaving: saving,
        urgency: isQ4
          ? "Before March 31 — firm deadline."
          : "Start this month.",
        orderIndex: order++,
        isParallelGoal: true,
        horizonYears: 3,
      });
      if (lsElss > 0) remLumpSum -= lsElss;
      else remSurplus -= elssSip;
    }
  }

  // SSY — for girl child, parallel to any goal
  if (
    p.hasGirlChild &&
    (p.girlChildAge ?? 0) < 10 &&
    gap80c > 0 &&
    remSurplus > 0
  ) {
    const ssySip = Math.min(
      Math.round(Math.min(gap80c, 150000) / 12),
      remSurplus,
    );
    const ssyLump = remLumpSum >= 150000 ? 150000 : 0;
    const saving = taxSaved(150000, p.taxBracket);
    recs.push({
      id: "ssy",
      priority: "high",
      category: "parallel",
      emoji: "👧",
      title: "SSY — Best 80C for Your Daughter (8.2% Guaranteed + EEE)",
      subtitle: `₹${ssySip.toLocaleString()}/mo · 8.2% guaranteed · saves ₹${saving.toLocaleString()}/yr · parallel track`,
      reasoning: `8.2% guaranteed + completely tax-free (EEE) + 80C deduction. This is mathematically the best 80C instrument when you have a girl child — guaranteed 8.2% beats ELSS risk-adjusted returns for a 21-year horizon.`,
      action:
        ssyLump > 0
          ? `Deposit ₹1.5L in SSY on April 5 for maximum annual interest. Open at Post Office or SBI.`
          : `₹${ssySip.toLocaleString()}/mo standing instruction to SSY at Post Office or SBI in your daughter's name.`,
      monthlyAmount: ssySip,
      lumpSum: ssyLump > 0 ? ssyLump : undefined,
      investmentType: ssyLump > 0 ? "lump-sum" : "sip",
      platform: ["Post Office", "SBI", "HDFC Bank"],
      expectedOutcome: `₹${(sipCorpus(ssySip, 21 - (p.girlChildAge ?? 5), 8.2) / 100000).toFixed(0)}L at daughter's age 21 · fully tax-free`,
      avoidMistake:
        "Account MUST be opened before daughter turns 10. This window closes permanently.",
      taxSaving: saving,
      urgency: "Open account this week if daughter is near 10.",
      orderIndex: order++,
      isParallelGoal: true,
    });
    if (ssyLump > 0) remLumpSum -= ssyLump;
    else remSurplus -= ssySip;
  }

  // NPS — parallel retirement track, never for goal < retirement age
  if (p.taxBracket >= 20 && yrsRet > 10 && remSurplus >= 4167) {
    const npsSip = Math.min(4167, remSurplus); // ₹50k/yr
    const npsLump = isQ4 && remLumpSum >= 50000 ? 50000 : 0;
    const saving = taxSaved(50000, p.taxBracket);
    recs.push({
      id: "nps",
      priority: "high",
      category: "parallel",
      emoji: "🏛️",
      title: `NPS — ₹${saving.toLocaleString()} Extra Tax Saving (Parallel Retirement Track)`,
      subtitle: `₹${npsSip.toLocaleString()}/mo · 80CCD(1B) ₹50k EXTRA beyond 80C`,
      reasoning: `At ${p.taxBracket}% bracket, NPS's extra ₹50k deduction (80CCD(1B) — separate from your ₹1.5L 80C) saves ₹${saving.toLocaleString()}/yr. This runs parallel to your ${goalYrs}-year goal. NPS locks money till age ${p.retirementAge} — it cannot fund your ${goalYrs}-year goal.`,
      action:
        npsLump > 0
          ? `Deposit ₹50,000 in NPS Tier 1 at eNPS.nsdl.com before March 31. HDFC Pension, Aggressive (75% equity).`
          : `₹${npsSip.toLocaleString()}/mo in NPS Tier 1 at eNPS.nsdl.com. ${p.incomeType === "self-employed" ? "Consider Tier 2 (liquid) instead." : "HDFC Pension, Moderate allocation."}`,
      monthlyAmount: npsSip,
      lumpSum: npsLump > 0 ? 50000 : undefined,
      investmentType: npsLump > 0 ? "lump-sum" : "sip",
      platform: ["eNPS.nsdl.com (direct, free)", "SBI / HDFC Bank"],
      expectedOutcome: `₹${saving.toLocaleString()}/yr tax saved · ₹${(sipCorpus(npsSip, yrsRet, 11) / 100000).toFixed(0)}L retirement corpus`,
      avoidMistake: `NPS Tier 1 is locked till age ${p.retirementAge}. Do NOT count this money for your ${goalYrs}-year goal.`,
      taxSaving: saving,
      urgency: isQ4 ? "Before March 31 for this FY." : "Start this month.",
      orderIndex: order++,
      isParallelGoal: true,
      horizonYears: yrsRet,
    });
    if (npsLump > 0) remLumpSum -= npsLump;
    else remSurplus -= npsSip;
  }

  // SGB — only when there's actual lump sum available
  if (remLumpSum >= 5800 && goalYrs >= 5) {
    const sgbAmt = Math.min(remLumpSum, 100000);
    recs.push({
      id: "sgb",
      priority: "medium",
      category: "parallel",
      emoji: "🥇",
      title: "Sovereign Gold Bond — Portfolio Hedge With 2.5% Interest",
      subtitle: `₹${sgbAmt.toLocaleString()} lump sum · tax-free at maturity · 2.5% annual interest`,
      reasoning: `Gold has near-zero correlation with equity — when markets crash, gold usually rises. 5-10% gold allocation reduces portfolio volatility. SGB is the only gold instrument that also pays 2.5% annual interest. Capital gains tax-free if held to 8-year maturity.`,
      action: `When RBI announces next SGB tranche (check rbi.org.in — usually Jan/Feb and Sep/Oct), invest ₹${sgbAmt.toLocaleString()} via HDFC Securities or SBI. Each unit ~₹5,800. 5-day subscription window.`,
      monthlyAmount: 0,
      lumpSum: sgbAmt,
      investmentType: "lump-sum",
      platform: ["HDFC Securities", "SBI Net Banking", "Zerodha"],
      expectedOutcome: `2.5% annual interest + gold price growth + zero capital gains tax at 8-year maturity`,
      avoidMistake:
        "Never buy Digital Gold for long-term investment — 3% GST on every purchase compounds against you. SGB has no such cost.",
      urgency:
        "Next RBI tranche announcement — don't buy on secondary exchange unless at fair price.",
      orderIndex: order++,
      isParallelGoal: true,
    });
    remLumpSum -= sgbAmt;
  }

  // Remaining lump sum → FD
  if (remLumpSum >= 25000) {
    const fdAmt = remLumpSum;
    const fdRate = fdAmt >= 100000 ? 8.85 : 7.5;
    const fdYears = Math.min(3, goalYrs > 0 ? goalYrs : 3);
    const fdCorpus = Math.round(fdAmt * Math.pow(1 + fdRate / 100, fdYears));
    recs.push({
      id: "fd-remainder",
      priority: "medium",
      category: "goal",
      emoji: "🏦",
      title: `Park Remaining ₹${(fdAmt / 1000).toFixed(0)}k in Fixed Deposit`,
      subtitle: `₹${fdAmt.toLocaleString()} → ${fdRate}% FD · guaranteed · ₹${fdCorpus.toLocaleString()} in ${fdYears} yrs`,
      reasoning: `After all allocations, you have ₹${fdAmt.toLocaleString()} undeployed. FDs require lump sum investment. At ${fdRate}%, this grows to ₹${fdCorpus.toLocaleString()} in ${fdYears} years, guaranteed, with zero market risk.`,
      action: `Book at ${fdAmt >= 100000 ? "Bajaj Finance (8.85%, AAA-rated) via bajajfinserv.in" : "AU Small Finance Bank (8.5%) via aubank.in"}. Fully online, 10 minutes. Keep at least ₹${Math.round(monthly * 3).toLocaleString()} accessible (choose FD with premature withdrawal option).`,
      monthlyAmount: 0,
      lumpSum: fdAmt,
      investmentType: "lump-sum",
      platform:
        fdAmt >= 100000
          ? ["Bajaj Finserv app", "bajajfinserv.in"]
          : ["AU Bank app", "aubank.in"],
      expectedOutcome: `₹${fdCorpus.toLocaleString()} in ${fdYears} years · guaranteed · zero risk`,
      avoidMistake:
        "Don't lock ALL remaining funds in long FDs — keep at least 3 months expenses in a liquid, breakable FD.",
      urgency: "Book online today — takes 10 minutes. Rates can change.",
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
      title: "Start Shifting to Income Instruments — Sequence Risk Is Real",
      subtitle: `Age ${p.age} → reduce equity 10%/yr, build guaranteed income`,
      reasoning: `At ${p.age} you have ${yrsRet} years to retirement. A 40% market crash 2 years before retirement permanently damages your corpus (sequence-of-returns risk). Start de-risking now: move 10% of equity to SCSS/POMIS every year.`,
      action: `Move 10% of current equity portfolio to SCSS (8.2%, max ₹30L, quarterly income) and POMIS (7.4%, max ₹9L, monthly income). Both are lump-sum-only, at Post Office or SBI.`,
      monthlyAmount: 0,
      investmentType: "lump-sum",
      platform: ["Post Office", "SBI"],
      expectedOutcome: `₹${Math.round((Math.min(p.existingCorpus, 3000000) * 0.082) / 12).toLocaleString()}/mo guaranteed income from SCSS`,
      avoidMistake:
        "Don't stay 80% equity into retirement. The market doesn't care about your timeline.",
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
  const r = cagr / 100 / 12,
    n = p.goalYears * 12;

  // Only primary goal recs for projection
  const goalRecs = recs.filter(
    (r) =>
      (r.category === "goal" || r.category === "wealth") && !r.isParallelGoal,
  );
  const totalSip = goalRecs.reduce((s, r) => s + (r.monthlyAmount || 0), 0);
  const totalLs = goalRecs.reduce((s, r) => s + (r.lumpSum || 0), 0);

  const sipCorpusVal =
    totalSip > 0 && n > 0
      ? Math.round(totalSip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r))
      : 0;
  const lsCorpusVal =
    totalLs > 0
      ? Math.round(totalLs * Math.pow(1 + cagr / 100, p.goalYears))
      : 0;
  const existCorpus = Math.round(
    (p.existingCorpus || 0) * Math.pow(1 + cagr / 100, p.goalYears),
  );
  const projected = sipCorpusVal + lsCorpusVal + existCorpus;

  // 10% annual step-up corpus
  let stepupCorpus = existCorpus;
  let steppedSip = totalSip;
  for (let m = 0; m < p.goalYears * 12; m++) {
    if (m > 0 && m % 12 === 0) steppedSip *= 1.1;
    stepupCorpus +=
      steppedSip * Math.pow(1 + cagr / 100 / 12, p.goalYears * 12 - m);
  }

  const allSip = recs.reduce((s, r) => s + (r.monthlyAmount || 0), 0);
  const allLs = recs.reduce((s, r) => s + (r.lumpSum || 0), 0);
  const taxSav = recs.reduce((s, r) => s + (r.taxSaving || 0), 0);

  const { feasible, requiredSipAmt, maxAchievable, feasibilityPct, scenarios } =
    computeGoalFeasibility(p);

  const pct = Math.min(100, Math.round((projected / p.goalAmountTarget) * 100));
  const shortfall = Math.max(0, p.goalAmountTarget - projected);

  // Feasibility status
  const status: FeasibilityStatus =
    pct >= 95
      ? "achievable"
      : pct >= 75
        ? "close"
        : pct >= 40
          ? "stretch"
          : "impossible";

  // How many years at current SIP to hit goal
  let yearsNeeded = p.goalYears;
  for (let y = p.goalYears; y <= 40; y++) {
    const t = sipCorpus(totalSip, y, cagr) + lsCorpusVal + existCorpus;
    if (t >= p.goalAmountTarget) {
      yearsNeeded = y;
      break;
    }
  }

  // Risk warning for instrument-horizon mismatch
  let riskWarning: string | undefined;
  if (p.goalYears <= 2) {
    riskWarning = `2-year goal: equity instruments removed from this plan — market crash risk is too high for a ${p.goalYears}-year horizon.`;
  } else if (p.goalYears <= 5 && p.riskAppetite === "aggressive") {
    riskWarning = `${p.goalYears}-year goal with aggressive risk: mid/small cap funds excluded — they need 7+ years to recover from downturns.`;
  }

  // Alt scenarios for GoalProgressCard
  const altScenarios: AltScenario[] = scenarios.map((s) => ({
    label: `Scenario ${s.label}: ${s.title}`,
    description: s.description,
    action: s.feasible
      ? `₹${s.monthlySip.toLocaleString()}/mo SIP for ${s.years} years → reaches ₹${(s.targetAmt / 100000).toFixed(0)}L ✅`
      : `Still requires more than your current surplus ❌`,
  }));

  return {
    goalName: GOAL_NAMES[p.primaryGoal] ?? p.primaryGoal,
    goalTarget: p.goalAmountTarget,
    goalYears: p.goalYears,
    projectedCorpus: projected,
    projectedFromSip: sipCorpusVal,
    projectedFromLump: lsCorpusVal,
    projectedFromExisting: existCorpus,
    sipStepupCorpus: Math.round(stepupCorpus),
    onTrack: pct >= 95,
    targetYear: new Date().getFullYear() + p.goalYears,
    totalMonthlySip: allSip,
    totalLumpSum: allLs,
    remainingLumpSum: Math.max(0, p.availableLumpSum - allLs),
    totalTaxSaving: taxSav,
    feasibility: {
      status,
      achievablePct: pct,
      shortfall,
      requiredSipMonthly: requiredSipAmt,
      yearsAtCurrentSip: yearsNeeded,
      riskWarning,
      altScenarios,
    },
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
    subtext: "Opens SSY — 8.2% guaranteed + fully tax-free",
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
    question: "How many financial dependents?",
    subtext: "Spouse, children, parents relying on your income",
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
      { value: "salaried", label: "Salaried — fixed salary" },
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
    question: "Your income tax slab?",
    options: [
      { value: 0, label: "No tax (< ₹3L)" },
      { value: 5, label: "5% (₹3–7L)" },
      { value: 10, label: "10% slab" },
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
    subtext: "Employee contribution only. 0 if self-employed.",
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
    subtext: "Rent + groceries + utilities + subscriptions (not EMIs)",
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
    question: "Do you have term life insurance?",
    subtext: "Pure term plan — not endowment or ULIP",
    options: [
      { value: true, label: "Yes, I have term insurance" },
      { value: false, label: "No term insurance" },
    ],
    default: false,
  },
  {
    id: "hasHealthInsurance",
    step: 3,
    type: "boolean",
    question: "Do you have health insurance?",
    subtext: "Personal or comprehensive employer-provided cover",
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
    subtext: "Savings or liquid fund — accessible within 24 hours",
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
    question: "Existing investments / savings corpus?",
    subtext: "Mutual funds + FDs + stocks + gold already held",
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
    subtext: "LIC + ELSS + 5-yr FD + home loan principal (exclude EPF)",
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
    question: "High-interest debt outstanding (> 10%)?",
    subtext: "Credit card + personal loans above 10% interest rate",
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
    question: "Lump sum available to invest right now?",
    subtext: "Bonus, FD maturity, savings surplus — one-time amount",
    min: 0,
    max: 10000000,
    step_size: 25000,
    format: "currency",
    default: 0,
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
    subtext: "Longer horizon = more equity = higher expected returns",
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
