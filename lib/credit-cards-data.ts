// ═══════════════════════════════════════════════════════════════════════════
//  PaisaDekho Credit Card Engine  —  2026 Edition
//  Covers:
//    1. CreditCard interface + dataset loader
//    2. Transaction-level category → merchant matcher
//    3. Per-transaction best-card finder (what you're losing every month)
//    4. Monthly statement analyser (full picture)
//    5. Card scorer + ranker (corrected v3 algorithm)
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
  pointValue: number; // ₹ value of 1 reward point (already baked into rates below)
  rewardUnit: string;
  travelMultiplier: number;

  // Platform-specific effective cash-yield %
  // All rates = real cashback-equivalent %, already accounting for point_value
  swiggyRate: number; // Swiggy food delivery
  zomatoRate: number; // Zomato food delivery
  diningRate: number; // offline restaurants
  groceryRate: number; // grocery stores
  amazonRate: number; // Amazon purchases
  flipkartRate: number; // Flipkart purchases
  meeshoRate: number; // Meesho purchases
  ajioRate: number; // Ajio purchases
  cromaRate: number; // Croma electronics
  relianceRate: number; // Reliance Digital
  utilityRate: number; // utility bills / JIO / Airtel via card
  rentRate: number; // rent payments (usually 0 = excluded)
  fuelRewardRate: number; // fuel stations
  flightRate: number; // flight bookings (effective cash yield)
  hotelRate: number; // hotel bookings
  movieEffectiveRate: number;

  // Caps & waiver
  rewardCap: string; // monthly cap string e.g. "5k", "1k", "No Cap"
  retentionSpendReq: number; // annual spend for fee waiver (₹)
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

// SpendProfile values are MONTHLY ₹ amounts.
// calculateInDepthSavings annualises internally (*12).
export interface SpendProfile {
  food: number; // Swiggy + Zomato + restaurants
  shopping: number; // Amazon + Flipkart + other online
  travel: number; // flights + hotels
  utilities: number; // electricity + JIO + Airtel + OTT
  fuel: number; // petrol / diesel
  rent: number; // house rent
  other: number; // base rate spend
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — DATASET LOADER
// ─────────────────────────────────────────────────────────────────────────────

function generateTags(c: any): string[] {
  const tags: string[] = [];
  const fee = parseFloat(String(c.annual_fee || "0")) || 0;
  const tier = (c.card_tier || "").toLowerCase();
  const isLtf = String(c.is_ltf).toLowerCase() === "true";
  const stags = (c.search_tags || "").toLowerCase();

  if (isLtf || fee === 0) tags.push("Lifetime Free");
  if (fee > 0 && fee <= 1000) tags.push("Entry");
  if (fee > 1000 && fee < 10000) tags.push("Premium");
  if (fee >= 10000 || tier === "ultra" || tier === "luxury")
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
    if (m) return parseFloat(m[1]) * 100000;
    const raw = clean(val);
    return raw > 0 && raw < 100 ? raw * 100000 : raw;
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

  return {
    id: String(index + 1),
    name: c.card_name,
    bank: c.issuer,
    tier: c.card_tier || "Standard",
    network: detectNetwork(c.card_name),
    tags: generateTags(c).length ? generateTags(c) : ["Standard"],
    lifetimeFree: c.lifetimeFree ?? false, // Add this
    monthlyRewardCap: c.monthlyRewardCap ?? "No Cap", // Fixes the card-vault/page.tsx error too

    baseRewardRate: clean(c.base_reward_rate),
    pointValue: clean(c.point_value) || 1,
    rewardUnit: c.reward_unit || "Points",
    travelMultiplier: clean(c.travel_multiplier),

    swiggyRate: clean(c.swiggy_rate),
    zomatoRate: clean(c.zomato_rate),
    diningRate: clean(c.dining_rate),
    groceryRate: clean(c.grocery_rate),
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
    devaluation2026: (c.notes_tnc || "").toLowerCase().includes("devaluation"),
    imageGradient: gradients[c.issuer] || "from-zinc-800 to-zinc-950",
    multiplierChannel: c.multiplier_channel || "Direct",

    pointsRedemptionValueTravel: clean(c.points_redemption_value_travel),
    airIndiaTransferRatio: clean(c.air_india_transfer_ratio),
    airlineTransferJson:
      typeof c.airline_transfer_json === "string"
        ? JSON.parse(c.airline_transfer_json)
        : c.airline_transfer_json || {},
    hotelTransferJson: c.hotel_transfer_json || {},
    detailedRewardsJson:
      typeof c.detailed_rewards_json === "string"
        ? (() => {
            try {
              return JSON.parse(c.detailed_rewards_json);
            } catch {
              return {};
            }
          })()
        : c.detailed_rewards_json || {},

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
// ALL caps in this dataset are MONTHLY caps:
//   "5k"  → ₹5,000/mo  → annualise ×12 = ₹60,000/yr
//   "1k"  → ₹1,000/mo  → ₹12,000/yr
//   "300" → ₹300/mo    → ₹3,600/yr
//   "2L"  → ₹2,00,000/mo (very generous)
// Exception: strings containing "year" or "annual" are absolute annual caps.

function applyRewardCap(annualRewards: number, cap: any): number {
  const s = String(cap || "").toLowerCase();
  if (
    !s ||
    ["no cap", "unlimited", "standard", "see category"].some((x) =>
      s.includes(x),
    )
  ) {
    return annualRewards;
  }
  const hasK = s.includes("k");
  const hasL = s.includes("l");
  const mult = hasL ? 100_000 : hasK ? 1_000 : 1;
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (isNaN(n) || n === 0) return annualRewards;
  const capValue = n * mult;
  if (s.includes("year") || s.includes("annual"))
    return Math.min(annualRewards, capValue);
  return Math.min(annualRewards, capValue * 12); // all others = monthly → annualise
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
  | "shopping_online"
  | "utility"
  | "fuel"
  | "flight"
  | "hotel"
  | "rent"
  | "transfer"
  | "bank_charge"
  | "other";

// These earn ZERO credit card rewards
export const NON_REWARDABLE = new Set<MerchantCategory>([
  "transfer",
  "bank_charge",
]);

export function parserCatToMerchant(
  parserCategory: string,
  description: string,
): MerchantCategory {
  // The categorizer is the single source of truth for categorisation.
  // Re-run getCategory on the raw description — this overrides whatever the
  // PDF parser produced, because the categorizer has the authoritative keyword list.
  const cat = getCategory(description);

  switch (cat) {
    // ── Non-rewardable ─────────────────────────────────────────────────
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
      return "rent"; // rentRate = 0 on most cards

    // ── Rewardable: platform-specific (get accelerated rates) ──────────
    case "food_and_dining": {
      const d = description.toUpperCase();
      if (d.includes("SWIGGY")) return "swiggy";
      if (d.includes("ZOMATO")) return "zomato";
      return "dining";
    }
    case "shopping_and_ecommerce": {
      const d = description.toUpperCase();
      if (d.includes("AMAZON") || d.includes("AMZN")) return "amazon";
      if (d.includes("FLIPKART") || d.includes("FKRT")) return "flipkart";
      return "shopping_online";
    }
    case "subscriptions_and_digital":
      return "utility"; // Netflix/Apple/JIO → utility bucket
    case "utilities":
      return "utility";
    case "grocery_and_essentials":
      return "grocery";
    case "fuel":
      return "fuel";
    case "travel":
      return "flight";
    case "health_and_wellness":
      return "other"; // earns base rate

    // ── "others" = unmatched rewardable general spend ──────────────────
    case "others":
    default:
      return "other";
  }
}

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
    case "shopping_online":
      return Math.max(card.amazonRate, card.flipkartRate, card.baseRewardRate);
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
  missedSavings: number; // bestReward - currentReward
}

export interface StatementAnalysis {
  insights: TransactionInsight[];
  totalSpend: number;
  rewardableSpend: number;
  totalMissedSavings: number;
  totalPotentialRewards: number;
  spendProfile: SpendProfile; // MONTHLY
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
    // parserCatToMerchant internally calls getCategory(description),
    // so the categorizer is always authoritative regardless of parser output.
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

  const spendProfile: SpendProfile = {
    food: sumM("swiggy", "zomato", "dining", "grocery"),
    shopping: sumM("amazon", "flipkart", "shopping_online"),
    travel: sumM("flight", "hotel"),
    utilities: sumM("utility"),
    fuel: sumM("fuel"),
    rent: sumM("rent"),
    other: sumM("other"),
  };

  // Category breakdown (sorted by spend)
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
  breakdown: Array<{ label: string; value: number; plus: boolean }>;
  travelValue: number;
}

function calcLoungeValue(card: CreditCard, monthlyVisits: number): number {
  const visits =
    card.domesticLounge === "Unlimited"
      ? 12
      : parseInt(String(card.domesticLounge)) || 0;
  return Math.min(visits, monthlyVisits * 12) * 800;
}

function calcForexSavings(annualSpend: number, markup: number): number {
  return Math.max(0, (annualSpend * 0.2 * (3.5 - markup)) / 100);
}

export function calculateInDepthSavings(
  card: CreditCard,
  spend: SpendProfile, // MONTHLY ₹ — annualised internally (*12)
  monthlyLoungeVisits = 0.5,
): CardAudit {
  // getCatReward: monthly spend × 12 × rate% × pointValue
  // rate fields in the dataset are RAW points/% — must multiply by pointValue to get ₹ cashback
  // e.g. Federal Scapia: swiggyRate=4.0, pointValue=0.2 → effective cash = 4 × 0.2 = 0.8%
  // Exception: Cashback/NeuCoins cards already have pointValue=1.0 so this is a no-op
  const pv = card.pointValue || 1;
  const catR = (monthly: number, rate: number, catName: string): number => {
    const rules = card.detailedRewardsJson;
    let r = ((monthly * 12 * rate) / 100) * pv;
    if (rules?.[catName] === "Capped") r = Math.min(r, 500 * 12);
    return r;
  };

  const annualSpend =
    (spend.food +
      spend.shopping +
      spend.travel +
      spend.utilities +
      spend.fuel +
      spend.rent +
      spend.other) *
    12;

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
  const shop = catR(
    spend.shopping,
    Math.max(card.amazonRate, card.flipkartRate, card.baseRewardRate),
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

  const grossRaw = food + shop + trav + util + fuel + rent + other;
  const grossRewards = applyRewardCap(grossRaw, card.rewardCap);

  const feeWaived =
    card.retentionSpendReq > 0 && annualSpend >= card.retentionSpendReq;
  const outflow = feeWaived ? 0 : card.annualFee * 1.18;

  const lv = calcLoungeValue(card, monthlyLoungeVisits);
  const fs = calcForexSavings(annualSpend, card.forexMarkup);
  const net = grossRewards + lv + fs - outflow;
  const eff = annualSpend > 0 ? (grossRewards / annualSpend) * 100 : 0;

  // Monthly spend needed to break even on fee
  const breakEven =
    card.annualFee === 0 || eff === 0
      ? 0
      : (card.annualFee * 1.18) / 12 / (eff / 100);

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
    breakdown: [
      { label: "Reward Cashback", value: Math.round(grossRewards), plus: true },
      { label: "Lounge & Perks", value: Math.round(lv + fs), plus: true },
      { label: "Annual Fee + GST", value: Math.round(outflow), plus: false },
    ],
    travelValue: 0, // <--- ADD THIS LINE (or your calculated travel variable
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — CARD SCORER v3
// ─────────────────────────────────────────────────────────────────────────────

export function scoreCard(
  card: CreditCard,
  spend: SpendProfile, // MONTHLY ₹
  category: string,
): { card: CreditCard; audit: CardAudit; score: number } {
  const audit = calculateInDepthSavings(card, spend);
  const annualSpend =
    (spend.food +
      spend.shopping +
      spend.travel +
      spend.utilities +
      spend.fuel +
      spend.rent +
      spend.other) *
    12;

  if (audit.netValue < 0) return { card, audit, score: 0 }; // hard veto

  let score = 0;

  // 1. Net rupee value (sqrt-scaled)
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

  // 4. Category bonuses (spend × extra yield vs base)
  const cat = category.toLowerCase();
  const xtra = (monthly: number, rate: number) =>
    ((monthly * Math.max(0, rate - card.baseRewardRate)) / 100) * 0.005;

  if (cat.includes("food") || cat.includes("swiggy") || cat.includes("dining"))
    score += xtra(
      spend.food,
      Math.max(card.swiggyRate, card.zomatoRate, card.diningRate),
    );
  if (
    cat.includes("shopping") ||
    cat.includes("amazon") ||
    cat.includes("flipkart")
  )
    score += xtra(spend.shopping, Math.max(card.amazonRate, card.flipkartRate));
  if (cat.includes("travel") || cat.includes("flight")) {
    score += xtra(spend.travel, Math.max(card.flightRate, card.hotelRate));
    if (card.tags.includes("Travel")) score += 2;
  }
  if (cat.includes("fuel")) score += xtra(spend.fuel, card.fuelRewardRate);
  if (card.utilityRate > card.baseRewardRate)
    score += xtra(spend.utilities, card.utilityRate);

  if (card.searchTags.toLowerCase().includes(cat) && cat !== "general")
    score += 3;

  // 5. Travel perks (weighted by travel spend share)
  const travelShare = annualSpend > 0 ? (spend.travel * 12) / annualSpend : 0;
  const travelWeight = Math.min(1, travelShare * 4);
  const lounge =
    card.domesticLounge === "Unlimited"
      ? 999
      : parseInt(String(card.domesticLounge)) || 0;
  if (lounge >= 8) score += 6 * travelWeight;
  else if (lounge >= 4) score += 3 * travelWeight;
  if (card.forexMarkup <= 1) score += 5 * travelWeight;
  else if (card.forexMarkup < 2) score += 2 * travelWeight;

  // 6. Devaluation penalty
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
  // 1. Full analysis against all cards (per-transaction best card)
  const analysis = analyseStatement(transactions, creditCards, currentCard);

  // 2. Fee cap from rewardable spend only (not gross with P2P transfers)
  const maxFee = deriveMaxFee(analysis.rewardableSpend);

  // 3. Eligible cards with fallback relaxation
  let eligible = getEligibleCards(maxFee, incomeInLakhs);
  if (eligible.length < 3)
    eligible = getEligibleCards(maxFee * 2, incomeInLakhs);
  if (eligible.length < 3)
    eligible = creditCards.filter((c) => c.isLtf || c.annualFee === 0);

  // 4. Category keyword from biggest rewardable bucket (>15% of rewardable)
  const sp = analysis.spendProfile;
  const cats: [string, number][] = [
    ["food", sp.food],
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
  const shopping = best(spend.shopping, (c) =>
    Math.max(c.amazonRate, c.flipkartRate, c.baseRewardRate),
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
    shopping.reward +
    travel.reward +
    utilities.reward +
    fuel.reward +
    rent.reward +
    other.reward;

  return {
    breakdown: { food, shopping, travel, utilities, fuel, rent, other },
    totalMonthlyReward: parseFloat(total.toFixed(2)),
  };
}
