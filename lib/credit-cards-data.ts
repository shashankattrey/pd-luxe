// ═══════════════════════════════════════════════════════════════════════════
//  PaisaDekho Credit Card Engine  —  2026 Edition  (fully corrected)
//
//  Bug-fixes applied vs original:
//   1.  lifetimeFree reads c.is_ltf (not non-existent c.lifetimeFree)
//   2.  monthlyRewardCap reads c.monthly_reward_cap (correct field name)
//   3.  hotelTransferJson JSON.parsed (same as airlineTransferJson)
//   4.  diningRate  reads dining_rate_eff  (effective %, already portal-adjusted)
//   5.  groceryRate reads grocery_rate_eff (effective %, already portal-adjusted)
//   6.  applyRewardCap — point-count caps multiplied by pointValue → ₹ cap
//   7.  applyRewardCap — strips date clause before numeric extraction (₹4k bug)
//   8.  applyRewardCap — "See Category Rules" / "category rules" bypass added
//   9.  SpendProfile — new `grocery` bucket (was incorrectly merged into food)
//  10.  getMerchantRate shopping_online — includes meesho/ajio/croma/reliance
//  11.  calculateInDepthSavings food — separate grocery bucket using groceryRate
//  12.  calcForexSavings — now uses annual travel spend (not 20% of all spend)
//  13.  CardAudit travelValue — computed (loungeValue + forexSavings), not 0
//  14.  scoreCard xtra multiplier — 0.05 (was 0.005, killing category bonuses)
//  15.  devaluation2026 — regex matches CRITICAL/retention/rate cut etc.
//  16.  optimizeCards — separate grocery bucket, meesho/ajio in shopping
//  [parsers] bob.ts regex unclosed quantifier {2,40?  →  {2,40} (runtime crash)
// ═══════════════════════════════════════════════════════════════════════════

import rawCards from "./csvjson (3).json";
import { getCategory } from "@/lib/parsers/categorizer";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  tier: string;
  network: "Visa" | "Mastercard" | "Amex" | "RuPay" | "Diners";
  tags: string[];
  lifetimeFree: boolean;
  monthlyRewardCap: string | number;

  // Core reward economics
  baseRewardRate: number; // effective cash-yield % on all spend
  pointValue: number; // ₹ value of 1 reward point
  rewardUnit: string;
  travelMultiplier: number;

  // Platform-specific effective cash-yield %
  // All _eff rates = real ₹-cashback-equivalent %, already accounting for
  // portal multipliers (SmartBuy, Travel Edge, etc.) and pointValue
  swiggyRate: number;
  zomatoRate: number;
  diningRate: number; // reads dining_rate_eff — effective dining rate
  groceryRate: number; // reads grocery_rate_eff — effective grocery rate
  amazonRate: number;
  flipkartRate: number;
  meeshoRate: number;
  ajioRate: number;
  cromaRate: number;
  relianceRate: number;
  utilityRate: number;
  rentRate: number;
  fuelRewardRate: number;
  flightRate: number;
  hotelRate: number;
  movieEffectiveRate: number;

  // Caps & waiver
  rewardCap: string;
  retentionSpendReq: number;
  renewalWaiverLimit?: number;

  // Fees
  joiningFee: number;
  annualFee: number;
  isLtf: boolean;

  // Eligibility
  minIncomeLakhs: number;

  // Travel perks
  forexMarkup: number;
  domesticLounge: number | string;
  internationalLounge: number;
  loungeCapDetails: string;

  // Metadata
  joiningBenefit: string;
  milestoneBenefit: string;
  notesTnc: string;
  searchTags: string;
  devaluation2026: boolean;
  imageGradient: string;
  multiplierChannel: string;

  // Redemption
  pointsRedemptionValueTravel: number;
  airIndiaTransferRatio: number;
  airlineTransferJson: Record<string, string>;
  hotelTransferJson: Record<string, string>;
  detailedRewardsJson: Record<string, string>;

  // Misc
  smartbuyFlightPct: number;
  atlasFlightPct: number;
  sbiCashbackFlightPct: number;
  emiratesSuitability: number;
  instantDiscountEligible: boolean;
  surchargeWaiver: string;
  fuelCap: string;
  forexEffective: string;
  flipkartMethod: string;
  relianceMethod: string;
  amazonMethod: string;
  movieDealType: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SpendProfile — all values are MONTHLY ₹.
// calculateInDepthSavings annualises internally (×12).
//
// FIX #9: `grocery` is now its own bucket.
// Previously it was merged into `food`, causing groceryRate to be ignored
// in reward calculations (food catR used max(swiggy, zomato, dining) only).
// ─────────────────────────────────────────────────────────────────────────────
export interface SpendProfile {
  food: number; // Swiggy + Zomato + offline restaurants
  grocery: number; // BigBasket, DMart, Reliance Fresh, JioMart — FIX #9
  shopping: number; // Amazon + Flipkart + Meesho + Ajio + other online
  travel: number; // flights + hotels
  utilities: number; // electricity + JIO + Airtel + OTT subscriptions
  fuel: number; // petrol / diesel
  rent: number; // house rent
  other: number; // base-rate general spend
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — DATASET LOADER
// ─────────────────────────────────────────────────────────────────────────────

function generateTags(c: any): string[] {
  const tags: string[] = [];
  const fee = parseFloat(String(c.annual_fee || "0")) || 0;
  const tier = (c.card_tier || "").toLowerCase();
  // FIX #1: use c.is_ltf (correct field), not c.lifetimeFree (doesn't exist)
  const isLtf = String(c.is_ltf).toLowerCase() === "true";
  const stags = (c.search_tags || "").toLowerCase();

  if (isLtf || fee === 0) tags.push("Lifetime Free");
  if (fee > 0 && fee <= 1_000) tags.push("Entry");
  if (fee > 1_000 && fee < 10_000) tags.push("Premium");
  if (fee >= 10_000 || tier === "ultra" || tier === "luxury")
    tags.push("Super Premium");
  if (stags.includes("travel") || stags.includes("miles")) tags.push("Travel");
  if (stags.includes("cashback")) tags.push("Cashback");
  if (c.domestic_lounge === "Unlimited" || parseInt(c.domestic_lounge) > 0)
    tags.push("Lounge");
  return [...new Set(tags)];
}

export const creditCards: CreditCard[] = (rawCards as any[]).map((c, index) => {
  const clean = (val: any): number => {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (!val || ["None", "Excluded", "N/A", "No", ""].includes(String(val)))
      return 0;
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  const parseLakhs = (val: any): number => {
    const s = String(val || "").toLowerCase();
    if (!s || s.includes("none") || s === "0") return 0;
    const m = s.match(/(\d+(\.\d+)?)\s*l/i);
    if (m) return parseFloat(m[1]) * 100_000;
    const raw = clean(val);
    return raw > 0 && raw < 100 ? raw * 100_000 : raw;
  };

  const gradients: Record<string, string> = {
    HDFC: "from-blue-900 via-slate-800 to-blue-950",
    Axis: "from-rose-950 via-zinc-900 to-black",
    SBI: "from-blue-700 via-indigo-800 to-blue-900",
    ICICI: "from-orange-800 via-red-900 to-orange-950",
    Amex: "from-cyan-800 via-blue-900 to-slate-900",
    IDFC: "from-red-900 via-zinc-900 to-red-950",
    Kotak: "from-red-800 via-red-700 to-red-900",
    IndusInd: "from-amber-800 via-yellow-900 to-amber-950",
    AU: "from-violet-900 via-indigo-900 to-purple-950",
  };

  const detectNetwork = (name: string): CreditCard["network"] => {
    const n = name.toLowerCase();
    if (n.includes("amex") || n.includes("american express")) return "Amex";
    if (n.includes("mastercard")) return "Mastercard";
    if (n.includes("rupay")) return "RuPay";
    if (n.includes("diners")) return "Diners";
    return "Visa";
  };

  // FIX #15: devaluation detection via regex — catches CRITICAL, retention updates,
  // rate cuts, reward reductions, and cap reductions — not just the word "devaluation"
  const devaluation2026 =
    /(devaluation|CRITICAL|retention updated|rate.*cut|rewards.*reduced|cap.*reduced|capped.*reduced|redemption.*limited)/i.test(
      c.notes_tnc || "",
    );

  // FIX #3: parse hotelTransferJson as JSON string (same as airlineTransferJson)
  const parseJsonField = (val: any): Record<string, string> => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return {};
      }
    }
    return val || {};
  };

  return {
    id: String(index + 1),
    name: c.card_name,
    bank: c.issuer,
    tier: c.card_tier || "Standard",
    network: detectNetwork(c.card_name),
    tags: generateTags(c).length ? generateTags(c) : ["Standard"],

    // FIX #1: was c.lifetimeFree (doesn't exist in JSON) → c.is_ltf
    lifetimeFree: String(c.is_ltf).toLowerCase() === "true",
    // FIX #2: was c.monthlyRewardCap (wrong camelCase) → c.monthly_reward_cap
    monthlyRewardCap: c.monthly_reward_cap || "No Cap",

    baseRewardRate: clean(c.base_reward_rate),
    pointValue: clean(c.point_value) || 1,
    rewardUnit: c.reward_unit || "Points",
    travelMultiplier: clean(c.travel_multiplier),

    swiggyRate: clean(c.swiggy_rate),
    zomatoRate: clean(c.zomato_rate),
    // FIX #4: read _eff columns — these are pre-computed effective rates that
    // already factor in portal multipliers (SmartBuy 10x, etc.)
    diningRate: clean(c.dining_rate_eff),
    // FIX #5: same — effective grocery rate
    groceryRate: clean(c.grocery_rate_eff),
    amazonRate: clean(c.amazon_benefit_pct),
    flipkartRate: clean(c.flipkart_benefit_pct),
    meeshoRate: clean(c.meesho_benefit_pct),
    ajioRate: clean(c.ajio_benefit_pct),
    cromaRate: clean(c.croma_benefit_pct),
    relianceRate: clean(c.reliance_digital_benefit_pct),
    utilityRate: clean(c.utility_rate),
    rentRate: clean(c.rent_rate),
    fuelRewardRate: clean(c.fuel_reward_rate),
    flightRate: clean(c.flight_rate),
    hotelRate: clean(c.hotel_rate),
    movieEffectiveRate: clean(c.movie_effective_rate),

    rewardCap: c.monthly_reward_cap || "No Cap",
    retentionSpendReq: parseLakhs(c.retention_spend_req),
    renewalWaiverLimit: parseLakhs(c.retention_spend_req),

    joiningFee: clean(c.joining_fee),
    annualFee: clean(c.annual_fee),
    isLtf: String(c.is_ltf).toLowerCase() === "true",

    minIncomeLakhs: clean(c.min_income_annual_lakhs),

    forexMarkup: clean(c.forex_markup),
    domesticLounge: c.domestic_lounge || "0",
    internationalLounge: clean(c.international_lounge),
    loungeCapDetails: c.lounge_cap_details || "",

    joiningBenefit: c.joining_benefit || "N/A",
    milestoneBenefit: c.milestone_benefit || "None",
    notesTnc: c.notes_tnc || "",
    searchTags: c.search_tags || "",
    devaluation2026,
    imageGradient: gradients[c.issuer] || "from-zinc-800 to-zinc-950",
    multiplierChannel: c.multiplier_channel || "Direct",

    pointsRedemptionValueTravel: clean(c.points_redemption_value_travel),
    airIndiaTransferRatio: clean(c.air_india_transfer_ratio),
    airlineTransferJson: parseJsonField(c.airline_transfer_json),
    // FIX #3: was c.hotel_transfer_json || {} — JSON string, never parsed
    hotelTransferJson: parseJsonField(c.hotel_transfer_json),
    detailedRewardsJson: parseJsonField(c.detailed_rewards_json),

    smartbuyFlightPct: clean(c.smartbuy_flight_pct),
    atlasFlightPct: clean(c.atlas_flight_pct),
    sbiCashbackFlightPct: clean(c.sbi_cashback_flight_pct),
    emiratesSuitability: clean(c.emirates_suitability),
    instantDiscountEligible:
      String(c.instant_discount_eligible).toLowerCase() === "true",
    surchargeWaiver: c.surcharge_waiver || "0%",
    fuelCap: c.fuel_cap || "0",
    forexEffective: c.forex_effective || "N/A",
    flipkartMethod: c.flipkart_method || "Direct",
    relianceMethod: c.reliance_method || "Direct",
    amazonMethod: c.amazon_method || "Direct",
    movieDealType: c.movie_deal_type || "Standard Rewards",
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — REWARD CAP ENGINE
// ─────────────────────────────────────────────────────────────────────────────
// Cap semantics in this dataset:
//   "1k" / "2k"      → points/month → annualise ×12 → convert to ₹ via pointValue
//   "60,000 points"  → point count/month → ×12 → ×pointValue for ₹
//   "10L"            → ₹10L/month cap (very generous — pass-through likely)
//   "300" / "400"    → monthly points cap → ×12 → ×pointValue
//   "₹4,000 (...)"   → rupee monthly cap — strip date clauses first
//   No Cap / Unlimited / See Category Rules → return annualRewards unchanged
//
// FIX #6: multiply point-count caps by pointValue to get ₹ cap
// FIX #7: strip date clauses like "(from April 1, 2026; was ₹5,000)" before parse
// FIX #8: add "see category" / "category rules" to the bypass list

function applyRewardCap(
  annualRewards: number,
  cap: any,
  pointValue = 1, // FIX #6: needed to convert point-count caps to ₹
): number {
  const s = String(cap || "")
    .toLowerCase()
    .trim();

  // Pass-through: no cap, unlimited, or category-specific rules
  const passThroughPhrases = [
    "no cap",
    "unlimited",
    "standard",
    "see category",
    "category rules",
  ];
  if (!s || passThroughPhrases.some((x) => s.includes(x))) return annualRewards;

  // FIX #7: strip date/version clauses before numeric extraction
  // e.g. "₹4,000 (from April 1, 2026; was ₹5,000)" → "₹4,000"
  const cleaned = s
    .replace(/\(\s*from\s+[^)]+\)/gi, "") // "(from April 1, 2026...)"
    .replace(/\(\s*was\s+[^)]+\)/gi, "") // "(was ₹5,000)"
    .replace(/\(\s*as\s+[^)]+\)/gi, "") // "(as statement credit)"
    .replace(/\(\s*max[^)]+\)/gi, "") // "(max/month)"
    .trim();

  // Determine magnitude suffix
  const hasK = cleaned.includes("k");
  const hasL = cleaned.includes("l");
  const mult = hasL ? 100_000 : hasK ? 1_000 : 1;

  const n = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
  if (isNaN(n) || n === 0) return annualRewards; // unparseable → no cap

  const rawCapPerPeriod = n * mult;

  // FIX #6: if the cap string mentions "points" or "pts" it's a point count,
  // not a rupee amount → convert via pointValue
  const isPointsCap = s.includes("points") || s.includes("pts");
  const capRupees = isPointsCap
    ? rawCapPerPeriod * pointValue
    : rawCapPerPeriod;

  // Is it an annual cap or a monthly cap?
  const isAnnual =
    s.includes("year") || s.includes("annual") || s.includes("p.a.");
  const annualCap = isAnnual ? capRupees : capRupees * 12;

  return Math.min(annualRewards, annualCap);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — TRANSACTION-LEVEL MERCHANT CATEGORY RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

export type MerchantCategory =
  | "swiggy"
  | "zomato"
  | "dining"
  | "grocery"
  | "amazon"
  | "flipkart"
  | "meesho"
  | "ajio"
  | "shopping_online"
  | "utility"
  | "fuel"
  | "flight"
  | "hotel"
  | "rent"
  | "transfer"
  | "bank_charge"
  | "other";

// Categories that earn ZERO credit card rewards
export const NON_REWARDABLE = new Set<MerchantCategory>([
  "transfer",
  "bank_charge",
]);

export function parserCatToMerchant(
  _parserCategory: string, // kept for API compat; we re-derive below
  description: string,
): MerchantCategory {
  // Always re-run getCategory on the raw description — the categorizer is the
  // single source of truth for all parsers (HDFC, ICICI, SBI, Kotak, BOB).
  const cat = getCategory(description);

  switch (cat) {
    // ── Non-rewardable ──────────────────────────────────────────────────
    case "bank_charges_and_taxes":
      return "bank_charge";
    case "gambling_and_restricted":
      return "bank_charge";
    case "investment_and_insurance":
      return "bank_charge";
    case "loans_and_emi":
      return "bank_charge";
    case "transfers_and_p2p":
      return "transfer";
    case "rent_and_credit_card":
      return "rent";

    // ── Rewardable: platform-specific ───────────────────────────────────
    case "food_and_dining": {
      const d = description.toUpperCase();
      if (d.includes("SWIGGY")) return "swiggy";
      if (d.includes("ZOMATO")) return "zomato";
      return "dining";
    }
    case "grocery_and_essentials":
      return "grocery";

    case "shopping_and_ecommerce": {
      const d = description.toUpperCase();
      if (d.includes("AMAZON") || d.includes("AMZN")) return "amazon";
      if (d.includes("FLIPKART") || d.includes("FKRT")) return "flipkart";
      if (d.includes("MEESHO")) return "meesho";
      if (d.includes("AJIO")) return "ajio";
      return "shopping_online";
    }

    case "subscriptions_and_digital":
      return "utility";
    case "utilities":
      return "utility";
    case "fuel":
      return "fuel";
    case "travel": {
      const d = description.toUpperCase();
      // Distinguish hotel stays from flight/transport bookings
      if (
        d.includes("OYO") ||
        d.includes("TREEBO") ||
        d.includes("FABHOTEL") ||
        d.includes("AIRBNB") ||
        d.includes("HOTEL")
      )
        return "hotel";
      return "flight";
    }
    case "health_and_wellness":
      return "other";
    case "others":
    default:
      return "other";
  }
}

// FIX #10: shopping_online now includes meeshoRate, ajioRate, cromaRate, relianceRate
export function getMerchantRate(
  card: CreditCard,
  merchant: MerchantCategory,
): number {
  if (NON_REWARDABLE.has(merchant)) return 0;
  switch (merchant) {
    case "swiggy":
      return Math.max(card.swiggyRate, card.baseRewardRate);
    case "zomato":
      return Math.max(card.zomatoRate, card.baseRewardRate);
    case "dining":
      return Math.max(card.diningRate, card.baseRewardRate);
    case "grocery":
      return Math.max(card.groceryRate, card.baseRewardRate);
    case "amazon":
      return Math.max(card.amazonRate, card.baseRewardRate);
    case "flipkart":
      return Math.max(card.flipkartRate, card.baseRewardRate);
    case "meesho":
      return Math.max(card.meeshoRate, card.baseRewardRate);
    case "ajio":
      return Math.max(card.ajioRate, card.baseRewardRate);
    // FIX #10: was max(amazon, flipkart, base) — now includes all online-shopping rates
    case "shopping_online":
      return Math.max(
        card.amazonRate,
        card.flipkartRate,
        card.meeshoRate,
        card.ajioRate,
        card.cromaRate,
        card.relianceRate,
        card.baseRewardRate,
      );
    case "utility":
      return Math.max(card.utilityRate, card.baseRewardRate);
    case "fuel":
      return Math.max(card.fuelRewardRate, card.baseRewardRate);
    case "flight":
      return Math.max(card.flightRate, card.baseRewardRate);
    case "hotel":
      return Math.max(card.hotelRate, card.baseRewardRate);
    case "rent":
      return card.rentRate > 0 ? card.rentRate : 0;
    default:
      return card.baseRewardRate;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — PER-TRANSACTION SAVINGS ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  category: string;
  balance?: number | null;
}

export interface TransactionInsight {
  transaction: ParsedTransaction;
  merchant: MerchantCategory;
  isRewardable: boolean;
  bestCard: CreditCard | null;
  bestRate: number; // %
  bestReward: number; // ₹
  currentRate: number;
  currentReward: number;
  missedSavings: number; // bestReward − currentReward
}

export interface StatementAnalysis {
  insights: TransactionInsight[];
  totalSpend: number;
  rewardableSpend: number;
  totalMissedSavings: number;
  totalPotentialRewards: number;
  spendProfile: SpendProfile; // MONTHLY ₹
  categoryBreakdown: Array<{
    merchant: MerchantCategory;
    totalSpend: number;
    txnCount: number;
    bestCard: CreditCard | null;
    bestRate: number;
    bestReward: number;
  }>;
}

export function analyseStatement(
  transactions: ParsedTransaction[],
  eligibleCards: CreditCard[],
  currentCard: CreditCard | null = null,
): StatementAnalysis {
  const debits = transactions.filter((t) => t.type === "debit");

  const insights: TransactionInsight[] = debits.map((txn) => {
    const merchant = parserCatToMerchant(txn.category, txn.description);
    const isRewardable = !NON_REWARDABLE.has(merchant);

    let bestCard: CreditCard | null = null;
    let bestRate = 0,
      bestReward = 0;

    if (isRewardable) {
      for (const card of eligibleCards) {
        const rate = getMerchantRate(card, merchant);
        const reward = (txn.amount * rate) / 100;
        if (reward > bestReward) {
          bestReward = reward;
          bestRate = rate;
          bestCard = card;
        }
      }
    }

    const currentRate =
      currentCard && isRewardable ? getMerchantRate(currentCard, merchant) : 0;
    const currentReward = (txn.amount * currentRate) / 100;

    return {
      transaction: txn,
      merchant,
      isRewardable,
      bestCard,
      bestRate,
      bestReward,
      currentRate,
      currentReward,
      missedSavings: bestReward - currentReward,
    };
  });

  const totalSpend = debits.reduce((s, t) => s + t.amount, 0);
  const rewardableSpend = insights
    .filter((i) => i.isRewardable)
    .reduce((s, i) => s + i.transaction.amount, 0);
  const totalMissed = insights.reduce(
    (s, i) => s + Math.max(0, i.missedSavings),
    0,
  );
  const totalPotential = insights.reduce((s, i) => s + i.bestReward, 0);

  const sumM = (...cats: MerchantCategory[]) =>
    insights
      .filter((i) => cats.includes(i.merchant))
      .reduce((s, i) => s + i.transaction.amount, 0);

  // FIX #9: grocery is its own bucket — no longer merged into food
  const spendProfile: SpendProfile = {
    food: sumM("swiggy", "zomato", "dining"),
    grocery: sumM("grocery"),
    shopping: sumM("amazon", "flipkart", "meesho", "ajio", "shopping_online"),
    travel: sumM("flight", "hotel"),
    utilities: sumM("utility"),
    fuel: sumM("fuel"),
    rent: sumM("rent"),
    other: sumM("other"),
  };

  // Category breakdown sorted by spend
  const catMap = new Map<
    MerchantCategory,
    {
      spend: number;
      count: number;
      bestCard: CreditCard | null;
      bestRate: number;
      bestReward: number;
    }
  >();
  for (const ins of insights) {
    if (NON_REWARDABLE.has(ins.merchant)) continue;
    const e = catMap.get(ins.merchant) ?? {
      spend: 0,
      count: 0,
      bestCard: null,
      bestRate: 0,
      bestReward: 0,
    };
    e.spend += ins.transaction.amount;
    e.count += 1;
    e.bestReward += ins.bestReward;
    if (ins.bestRate > e.bestRate) {
      e.bestRate = ins.bestRate;
      e.bestCard = ins.bestCard;
    }
    catMap.set(ins.merchant, e);
  }
  const categoryBreakdown = [...catMap.entries()]
    .map(([merchant, e]) => ({
      merchant,
      totalSpend: e.spend,
      txnCount: e.count,
      bestCard: e.bestCard,
      bestRate: e.bestRate,
      bestReward: e.bestReward,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);

  return {
    insights,
    totalSpend,
    rewardableSpend,
    totalMissedSavings: totalMissed,
    totalPotentialRewards: totalPotential,
    spendProfile,
    categoryBreakdown,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — CARD AUDIT (annual P&L for one card + spend profile)
// ─────────────────────────────────────────────────────────────────────────────

export interface CardAudit {
  netValue: number;
  yield: number;
  feeWaived: boolean;
  grossRewards: number;
  outflow: number;
  effectiveRewardRate: number;
  breakEvenMonthlySpend: number;
  loungeValue: number;
  forexSavings: number;
  // FIX #13: travelValue is now computed (loungeValue + forexSavings), not hardcoded 0
  travelValue: number;
  breakdown: Array<{ label: string; value: number; plus: boolean }>;
}

function calcLoungeValue(card: CreditCard, monthlyVisits: number): number {
  const annualVisits =
    card.domesticLounge === "Unlimited"
      ? 999
      : parseInt(String(card.domesticLounge)) || 0;
  // Domestic lounge visit value: ~₹800. Cap at card's allowed visits.
  const usedVisits = Math.min(annualVisits, monthlyVisits * 12);
  return usedVisits * 800;
}

// FIX #12: was (annualSpend * 0.2 * (3.5 - markup)) / 100
// Problem: assumed 20% of ALL spend is in forex — wildly overstated for non-travellers.
// Fix: use travel spend as proxy; assume 50% of travel is international (forex).
function calcForexSavings(annualTravelSpend: number, markup: number): number {
  if (annualTravelSpend <= 0 || markup <= 0) return 0;
  // Saving = % of travel spend done in foreign currency × markup saving vs 3.5% standard
  return Math.max(0, (annualTravelSpend * 0.5 * (3.5 - markup)) / 100);
}

export function calculateInDepthSavings(
  card: CreditCard,
  spend: SpendProfile, // MONTHLY ₹ — annualised internally (×12)
  monthlyLoungeVisits = 0.5,
): CardAudit {
  const pv = card.pointValue || 1;

  // catR: annual reward for one category bucket
  // rate fields are already in cashback-equivalent % (post pointValue adjustment
  // in the _eff columns). pointValue multiplication is kept here for backwards
  // compat with any cards that still use raw point rates.
  const catR = (monthlyAmt: number, rate: number, catName: string): number => {
    const rules = card.detailedRewardsJson;
    let r = ((monthlyAmt * 12 * rate) / 100) * pv;
    if (rules?.[catName] === "Capped") r = Math.min(r, 500 * 12);
    return r;
  };

  const annualSpend =
    (spend.food +
      spend.grocery +
      spend.shopping +
      spend.travel +
      spend.utilities +
      spend.fuel +
      spend.rent +
      spend.other) *
    12;

  // FIX #11: food and grocery are now calculated separately so each uses its
  // correct rate. Previously grocery spend earned at max(swiggy, zomato, dining)
  // which ignored groceryRate entirely for cards like HDFC Millennia (5% BB).
  const food = catR(
    spend.food,
    Math.max(
      card.swiggyRate,
      card.zomatoRate,
      card.diningRate,
      card.baseRewardRate,
    ),
    "Food",
  );
  const grocery = catR(
    spend.grocery,
    Math.max(card.groceryRate, card.baseRewardRate),
    "Grocery",
  );
  const shop = catR(
    spend.shopping,
    Math.max(
      card.amazonRate,
      card.flipkartRate,
      card.meeshoRate,
      card.ajioRate,
      card.baseRewardRate,
    ),
    "Shopping",
  );
  const trav = catR(
    spend.travel,
    Math.max(card.flightRate, card.hotelRate, card.baseRewardRate),
    "Travel",
  );
  const util = catR(
    spend.utilities,
    card.utilityRate > 0 ? card.utilityRate : card.baseRewardRate,
    "Utility",
  );
  const fuel = catR(
    spend.fuel,
    card.fuelRewardRate > 0 ? card.fuelRewardRate : card.baseRewardRate,
    "Fuel",
  );
  const rent = card.rentRate > 0 ? catR(spend.rent, card.rentRate, "Rent") : 0;
  const other = ((spend.other * 12 * card.baseRewardRate) / 100) * pv;

  const grossRaw = food + grocery + shop + trav + util + fuel + rent + other;
  // FIX #6: pass pointValue to applyRewardCap for correct point-count cap handling
  const grossRewards = applyRewardCap(grossRaw, card.rewardCap, pv);

  const feeWaived =
    card.retentionSpendReq > 0 && annualSpend >= card.retentionSpendReq;
  const outflow = feeWaived ? 0 : card.annualFee * 1.18;

  const lv = calcLoungeValue(card, monthlyLoungeVisits);
  // FIX #12: pass annual travel spend instead of total annual spend
  const fs = calcForexSavings(spend.travel * 12, card.forexMarkup);
  const net = grossRewards + lv + fs - outflow;
  const eff = annualSpend > 0 ? (grossRewards / annualSpend) * 100 : 0;

  const breakEven =
    card.annualFee === 0 || eff === 0
      ? 0
      : (card.annualFee * 1.18) / 12 / (eff / 100);

  // FIX #13: travelValue = loungeValue + forexSavings (was hardcoded 0)
  const travelValue = lv + fs;

  return {
    netValue: Math.round(net),
    yield: parseFloat(((net / (annualSpend || 1)) * 100).toFixed(2)),
    feeWaived,
    grossRewards: Math.round(grossRewards),
    outflow,
    effectiveRewardRate: parseFloat(eff.toFixed(2)),
    breakEvenMonthlySpend: parseFloat(breakEven.toFixed(0)),
    loungeValue: lv,
    forexSavings: fs,
    travelValue,
    breakdown: [
      { label: "Reward Cashback", value: Math.round(grossRewards), plus: true },
      { label: "Lounge & Perks", value: Math.round(lv + fs), plus: true },
      { label: "Annual Fee + GST", value: Math.round(outflow), plus: false },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — CARD SCORER v3 (corrected)
// ─────────────────────────────────────────────────────────────────────────────

export function scoreCard(
  card: CreditCard,
  spend: SpendProfile, // MONTHLY ₹
  category: string,
): { card: CreditCard; audit: CardAudit; score: number } {
  const audit = calculateInDepthSavings(card, spend);
  const annualSpend =
    (spend.food +
      spend.grocery +
      spend.shopping +
      spend.travel +
      spend.utilities +
      spend.fuel +
      spend.rent +
      spend.other) *
    12;

  if (audit.netValue < 0) return { card, audit, score: 0 }; // hard veto

  let score = 0;

  // 1. Net rupee value (sqrt-scaled to compress outliers)
  score += Math.sqrt(Math.max(0, audit.netValue)) * 1.5;

  // 2. Yield efficiency
  score += Math.max(0, audit.effectiveRewardRate) * 4;

  // 3. Fee suitability ratio
  if (card.isLtf || card.annualFee === 0) {
    score += 5;
  } else {
    const feeRatio = annualSpend > 0 ? card.annualFee / annualSpend : 1;
    if (feeRatio <= 0.005) score += 3;
    else if (feeRatio <= 0.01) score += 1;
    else if (feeRatio <= 0.02) score -= 2;
    else if (feeRatio <= 0.05) score -= 5;
    else score -= 12;
  }

  // 4. Category bonuses — marginal extra yield vs base rate, weighted by spend
  // FIX #14: was 0.005 (10× too small — made all category bonuses near-zero).
  // At 0.05: ₹10k food spend, 16.5% vs 3.3% base → 1320 monthly diff → +66 score
  const cat = category.toLowerCase();
  const xtra = (monthly: number, rate: number) =>
    ((monthly * Math.max(0, rate - card.baseRewardRate)) / 100) * 0.05;

  if (cat.includes("food") || cat.includes("swiggy") || cat.includes("dining"))
    score += xtra(
      spend.food,
      Math.max(card.swiggyRate, card.zomatoRate, card.diningRate),
    );

  if (cat.includes("grocery")) score += xtra(spend.grocery, card.groceryRate);

  if (
    cat.includes("shopping") ||
    cat.includes("amazon") ||
    cat.includes("flipkart")
  )
    score += xtra(
      spend.shopping,
      Math.max(
        card.amazonRate,
        card.flipkartRate,
        card.meeshoRate,
        card.ajioRate,
      ),
    );

  if (cat.includes("travel") || cat.includes("flight")) {
    score += xtra(spend.travel, Math.max(card.flightRate, card.hotelRate));
    if (card.tags.includes("Travel")) score += 2;
  }
  if (cat.includes("fuel")) score += xtra(spend.fuel, card.fuelRewardRate);

  if (card.utilityRate > card.baseRewardRate)
    score += xtra(spend.utilities, card.utilityRate);

  if (card.searchTags.toLowerCase().includes(cat) && cat !== "general")
    score += 3;

  // 5. Travel perks — only meaningful if the user actually travels
  const travelAnnual = spend.travel * 12;
  const travelShare = annualSpend > 0 ? travelAnnual / annualSpend : 0;
  const travelWeight = Math.min(1, travelShare * 4);
  const lounge =
    card.domesticLounge === "Unlimited"
      ? 999
      : parseInt(String(card.domesticLounge)) || 0;
  if (lounge >= 8) score += 6 * travelWeight;
  else if (lounge >= 4) score += 3 * travelWeight;
  if (card.forexMarkup <= 1) score += 5 * travelWeight;
  else if (card.forexMarkup < 2) score += 2 * travelWeight;

  // 6. Devaluation penalty (FIX #15: broader detection, so this fires correctly)
  if (card.devaluation2026) score -= 10;

  return { card, audit, score: parseFloat(Math.max(0, score).toFixed(2)) };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — ELIGIBILITY + RANKER
// ─────────────────────────────────────────────────────────────────────────────

export function deriveMaxFee(monthlyRewardableSpend: number): number {
  if (monthlyRewardableSpend < 2_000) return 0;
  else if (monthlyRewardableSpend < 8_000) return 500;
  else if (monthlyRewardableSpend < 20_000) return 1_500;
  else if (monthlyRewardableSpend < 50_000) return 3_000;
  else if (monthlyRewardableSpend < 125_000) return 5_000;
  else return 10_000;
}

export function getEligibleCards(
  maxAnnualFee: number,
  incomeInLakhs?: number,
): CreditCard[] {
  return creditCards.filter(
    (c) =>
      c.annualFee <= maxAnnualFee &&
      (incomeInLakhs === undefined || incomeInLakhs >= (c.minIncomeLakhs || 0)),
  );
}

export function rankCards(
  spend: SpendProfile,
  category: string,
  availableCards?: CreditCard[],
): Array<{ card: CreditCard; audit: CardAudit; score: number }> {
  return (availableCards ?? creditCards)
    .map((c) => scoreCard(c, spend, category))
    .sort((a, b) => b.score - a.score);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — FULL STATEMENT → RECOMMENDATIONS PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

export interface StatementRecommendation {
  analysis: StatementAnalysis;
  topCards: Array<{ card: CreditCard; audit: CardAudit; score: number }>;
  maxFee: number;
  categoryKeyword: string;
}

export function recommendFromStatement(
  transactions: ParsedTransaction[],
  incomeInLakhs?: number,
  currentCard: CreditCard | null = null,
): StatementRecommendation {
  // 1. Full analysis against all cards
  const analysis = analyseStatement(transactions, creditCards, currentCard);

  // 2. Fee cap from rewardable spend only (excludes P2P, bank charges)
  const maxFee = deriveMaxFee(analysis.rewardableSpend);

  // 3. Eligible cards with fallback relaxation
  let eligible = getEligibleCards(maxFee, incomeInLakhs);
  if (eligible.length < 3)
    eligible = getEligibleCards(maxFee * 2, incomeInLakhs);
  if (eligible.length < 3)
    eligible = creditCards.filter((c) => c.isLtf || c.annualFee === 0);

  // 4. Category keyword from biggest rewardable bucket (>15% of rewardable)
  const sp = analysis.spendProfile;
  // FIX #9: grocery is now a separate trackable bucket
  const cats: [string, number][] = [
    ["food", sp.food],
    ["grocery", sp.grocery],
    ["shopping", sp.shopping],
    ["travel", sp.travel],
    ["fuel", sp.fuel],
  ];
  const [topKey, topAmt] = cats.sort((a, b) => b[1] - a[1])[0];
  const categoryKeyword =
    analysis.rewardableSpend > 0 && topAmt / analysis.rewardableSpend > 0.15
      ? topKey
      : "general";

  // 5. Rank eligible cards
  const topCards = rankCards(sp, categoryKeyword, eligible).slice(0, 5);

  return { analysis, topCards, maxFee, categoryKeyword };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — MULTI-CARD WALLET OPTIMISER
// ─────────────────────────────────────────────────────────────────────────────

export interface WalletOptimisation {
  breakdown: Record<
    keyof SpendProfile,
    { card: CreditCard | null; reward: number; rate: number }
  >;
  totalMonthlyReward: number;
}

export function optimizeCards(
  cards: CreditCard[],
  spend: SpendProfile,
): WalletOptimisation {
  const best = (monthly: number, rateFn: (c: CreditCard) => number) => {
    let bestCard: CreditCard | null = null,
      bestReward = 0,
      bestRate = 0;
    for (const c of cards) {
      const rate = rateFn(c),
        reward = (monthly * rate) / 100;
      if (reward > bestReward) {
        bestReward = reward;
        bestRate = rate;
        bestCard = c;
      }
    }
    return { card: bestCard, reward: bestReward, rate: bestRate };
  };

  const food = best(spend.food, (c) =>
    Math.max(c.swiggyRate, c.zomatoRate, c.diningRate, c.baseRewardRate),
  );
  // FIX #16: grocery is its own bucket with groceryRate
  const grocery = best(spend.grocery, (c) =>
    Math.max(c.groceryRate, c.baseRewardRate),
  );
  // FIX #16: shopping includes meesho/ajio/croma/reliance rates
  const shopping = best(spend.shopping, (c) =>
    Math.max(
      c.amazonRate,
      c.flipkartRate,
      c.meeshoRate,
      c.ajioRate,
      c.cromaRate,
      c.relianceRate,
      c.baseRewardRate,
    ),
  );
  const travel = best(spend.travel, (c) =>
    Math.max(c.flightRate, c.hotelRate, c.baseRewardRate),
  );
  const utilities = best(spend.utilities, (c) =>
    Math.max(c.utilityRate, c.baseRewardRate),
  );
  const fuel = best(spend.fuel, (c) =>
    Math.max(c.fuelRewardRate, c.baseRewardRate),
  );
  const rent = best(spend.rent, (c) => (c.rentRate > 0 ? c.rentRate : 0));
  const other = best(spend.other, (c) => c.baseRewardRate);

  const total =
    food.reward +
    grocery.reward +
    shopping.reward +
    travel.reward +
    utilities.reward +
    fuel.reward +
    rent.reward +
    other.reward;

  return {
    breakdown: {
      food,
      grocery,
      shopping,
      travel,
      utilities,
      fuel,
      rent,
      other,
    },
    totalMonthlyReward: parseFloat(total.toFixed(2)),
  };
}
