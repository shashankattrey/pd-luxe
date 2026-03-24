// ═══════════════════════════════════════════════════════════════════════════
//  PaisaDekho Credit Card Engine — 2026 Edition (Complete Integrated Version)
//
//  This file contains:
//    1. Legacy CreditCard interface (for backward compatibility)
//    2. StandardizedCreditCard interface (new enhanced schema)
//    3. Complete dataset loader with 93+ cards
//    4. Calculation engine with caps, exclusions, accelerated rewards
//    5. Card scoring and ranking system
//    6. Multi-card wallet optimizer
//    7. Statement analysis and recommendations
//    8. Backward compatibility wrappers
// ═══════════════════════════════════════════════════════════════════════════

import rawCards from "./csvjson (3).json";
import { getCategory } from "@/lib/parsers/categorizer";

// ============================================================================
// SECTION 1 — TYPES (Legacy + Enhanced)
// ============================================================================

// ────────────────────────────────────────────────────────────────────────────
// Legacy CreditCard Interface (for backward compatibility)
// ────────────────────────────────────────────────────────────────────────────

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
  baseRewardRate: number;
  pointValue: number;
  rewardUnit: string;
  travelMultiplier: number;

  // Platform-specific effective cash-yield %
  swiggyRate: number;
  zomatoRate: number;
  diningRate: number;
  groceryRate: number;
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

export interface StatementRecommendation {
  card: CreditCard;
  reason: string;
  expectedSavings: number;
}

export interface CapDetail {
  amount: number | null;
  period:
    | "daily"
    | "monthly"
    | "quarterly"
    | "yearly"
    | "per_transaction"
    | "unlimited";
  unit: "points" | "rupees" | "miles" | "coins";
  notes?: string;
  spend_requirement?: number;
  spend_period?: string;
}

export interface TieredCap {
  tier_name: string;
  spend_range_min: number;
  spend_range_max: number | null;
  rate_percent: number;
  cap_amount: number | null;
  cap_period: string;
  notes?: string;
}

export interface RewardCategory {
  name: string;
  rate_percent: number;
  multiplier?: number;
  type: "accelerated" | "base";
  cap: CapDetail | null;
  tiered_caps?: TieredCap[];
  qualifying_spend?: {
    amount: number;
    period: string;
    notes?: string;
  };
  exclusions?: string[];
  applicable_channels?: string[];
  applicable_merchants?: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Standardized Credit Card Interface (Enhanced Schema) — matches your JSON
// ────────────────────────────────────────────────────────────────────────────

// Update the StandardizedCreditCard interface - replace the existing one with this enhanced version

export interface StandardizedCreditCard {
  id: string;
  card_name: string;
  issuer: string;
  variant: string;
  network: string;
  card_type: string;
  status: string;
  last_updated: string;
  fees: {
    joining: number;
    annual: number;
    renewal_waiver_spend: number;
    is_lifetime_free: boolean;
    gst_applicable: boolean;
    joining_benefit: string;
  };
  eligibility: {
    min_income_annual_lakhs: number;
    employment_type: string[];
    age_min: number;
    age_max: number;
    credit_score_min: number;
    invite_only: boolean;
    relationship_required: string[];
  };
  rewards: {
    base: {
      rate_percent: number;
      points_per_rupee: number;
      unit: string;
      redemption_value_rupees: number;
    };
    categories: Array<{
      name: string;
      rate_percent: number;
      multiplier?: number;
      capped?: boolean;
      cap_amount?: number;
      cap_period?: string;
      cap_unit?: string;
      // Add these for better type safety
      type?: "accelerated" | "base";
      cap?: {
        amount: number | null;
        period: string;
        unit: string;
        notes?: string;
      } | null;
    }>;
    accelerated_rewards: Array<{
      name: string;
      multiplier: number;
      limit?: number;
      limit_period?: string;
      applicable_channels: string[];
      applicable_categories: string[];
      // Add these for better type safety
      cap?: {
        amount: number | null;
        period: string;
        unit: string;
        notes?: string;
      };
    }>;
  };
  limits: {
    monthly_reward_cap_rupees: number | null;
    monthly_reward_cap_points?: number | null;
    accelerated_reward_cap_points?: number | null;
    statement_credit_cap?: number | null;
    redemption_caps?: Array<{
      category: string;
      cap_amount: number;
      period: string;
      unit: string;
    }>;
    transaction_limits: {
      min?: number;
      max?: number;
      per_day?: number;
      per_month?: number;
    };
  };
  excluded_categories: {
    categories: string[];
    mcc_codes: number[];
    notes: string;
  };
  benefits: {
    lounge_access: {
      domestic: {
        visits: number | string;
        period: string;
        spend_requirement?: number;
        spend_period?: string;
        guest_allowed?: boolean;
        guest_fee?: number;
      };
      international: {
        visits: number | string;
        period: string;
        spend_requirement?: number;
        access_type: string;
      };
    };
    milestones: Array<{
      spend_amount: number;
      benefit: string;
      value_rupees: number;
      period: "annual" | "quarterly";
    }>;
    entertainment: {
      movie_benefit: string;
      value_rupees: number;
      limit_per_month: number;
      partner: string;
    };
    travel: {
      forex_markup_percent: number;
      zero_forex: boolean;
      travel_insurance: string[];
      concierge: boolean;
    };
    fuel: {
      surcharge_waiver_percent: number;
      surcharge_min_transaction: number;
      surcharge_max_transaction: number;
      surcharge_max_waiver_monthly: number;
      reward_rate_percent: number;
      reward_cap_rupees: number;
      reward_cap_period: string;
    };
    dining: {
      discount_percent?: number;
      partners?: string[];
      max_discount?: number;
    };
    other_benefits: Array<{
      name: string;
      value_rupees: number;
      frequency: string;
      conditions?: string;
    }>;
  };
  channel_rewards: {
    smartbuy: {
      flights_rate: number;
      hotels_rate: number;
      vouchers_rate: number;
      cap?: number;
    };
    gyftr: { rate: number; limit?: number };
    travel_edge: { rate: number };
    reward_multiplier: { rate: number; multiplier: number };
    direct: { rate: number };
  };
  partners: {
    airlines: Array<{
      name: string;
      transfer_ratio: string;
      minimum_transfer?: number;
      annual_cap?: number;
    }>;
    hotels: Array<{
      name: string;
      transfer_ratio: string;
      annual_cap?: number;
    }>;
    ecommerce: {
      amazon: number;
      flipkart: number;
      meesho: number;
      ajio: number;
      reliance_digital: number;
      croma: number;
    };
    food: { swiggy: number; zomato: number; bigbasket: number };
    travel_portals: { cleartrip: number; mmt: number; yatra: number };
  };
  fee_transactions: {
    rent: { fee_percent: number; min_fee?: number; reward_eligible: boolean };
    utility: {
      fee_percent: number;
      min_fee?: number;
      max_fee?: number;
      reward_eligible: boolean;
      reward_rate?: number;
    };
    insurance: {
      fee_percent: number;
      reward_eligible: boolean;
      reward_rate?: number;
    };
    education: { fee_percent: number; reward_eligible: boolean };
    wallet_load: {
      fee_percent: number;
      min_fee?: number;
      reward_eligible: boolean;
    };
    government: { fee_percent: number; reward_eligible: boolean };
  };
  notes_tnc: string;
  search_tags: string[];
}

export interface RewardCapTableRow {
  category: string;
  type: "accelerated" | "base" | "channel";
  rate_percent: number;
  qualifying_spend?: {
    amount: number;
    period: string;
    notes?: string;
  };
  cap: {
    amount: number | null;
    period: string;
    unit: string;
  };
  conditions: string[];
  applicable_channels?: string[];
}

export function getRewardCapsTable(
  card: StandardizedCreditCard,
): RewardCapTableRow[] {
  const rows: RewardCapTableRow[] = [];

  // Get base rate
  const baseRate = card.rewards.base.rate_percent;

  // Process categories from standard card
  if (card.rewards.categories) {
    for (const cat of card.rewards.categories) {
      const isAccelerated = cat.multiplier && cat.multiplier > 1;
      // Use type assertion for optional properties
      const catAny = cat as any;

      rows.push({
        category: cat.name,
        type: isAccelerated ? "accelerated" : "base",
        rate_percent: cat.rate_percent,
        qualifying_spend: catAny.qualifying_spend
          ? {
              amount: catAny.qualifying_spend.amount,
              period: catAny.qualifying_spend.period,
              notes: catAny.qualifying_spend.notes,
            }
          : undefined,
        cap: {
          amount: catAny.cap_amount || null,
          period:
            catAny.cap_period || (catAny.capped ? "monthly" : "unlimited"),
          unit: catAny.cap_unit || (catAny.capped ? "points" : "none"),
        },
        conditions: catAny.cap_details?.notes
          ? [catAny.cap_details.notes]
          : catAny.capped
            ? [
                `Capped at ${catAny.cap_amount} ${catAny.cap_unit || "points"} per ${catAny.cap_period || "month"}`,
              ]
            : ["No cap"],
      });
    }
  }

  // Process accelerated rewards
  if (card.rewards.accelerated_rewards) {
    for (const acc of card.rewards.accelerated_rewards) {
      const accAny = acc as any;
      rows.push({
        category: acc.name,
        type: "accelerated",
        rate_percent: baseRate * acc.multiplier,
        qualifying_spend: accAny.qualifying_spend
          ? {
              amount: accAny.qualifying_spend.amount,
              period: accAny.qualifying_spend.period,
              notes: accAny.qualifying_spend.notes,
            }
          : undefined,
        cap: {
          amount: accAny.limit || null,
          period: accAny.limit_period || "monthly",
          unit: "points",
        },
        conditions: accAny.notes
          ? [accAny.notes]
          : [
              `Applicable on: ${acc.applicable_categories.join(", ")} via ${acc.applicable_channels.join(", ")}`,
            ],
      });
    }
  }

  // Process channel rewards with caps - check if cap is a number
  const smartbuyCap = card.channel_rewards?.smartbuy?.cap;
  if (smartbuyCap && typeof smartbuyCap === "number") {
    rows.push({
      category: "SmartBuy",
      type: "channel",
      rate_percent: card.channel_rewards.smartbuy.flights_rate,
      cap: {
        amount: smartbuyCap,
        period: "monthly",
        unit: "points",
      },
      conditions: ["Applies to SmartBuy platform bookings"],
    });
  }

  return rows;
}

export interface MilestoneTableRow {
  spend_amount: number;
  benefit: string;
  value_rupees: number;
  period: string;
  type: string;
  progress?: number;
  shortfall?: number;
  redemption_details?: string;
  notes?: string;
}

export function getMilestoneTable(
  card: StandardizedCreditCard,
  annualSpend: number,
): MilestoneTableRow[] {
  return card.benefits.milestones.map((ms) => {
    const msAny = ms as any;
    return {
      spend_amount: ms.spend_amount,
      benefit: ms.benefit,
      value_rupees: ms.value_rupees,
      period: ms.period,
      type: msAny.type || "points",
      progress: Math.min(100, (annualSpend / ms.spend_amount) * 100),
      shortfall: Math.max(0, ms.spend_amount - annualSpend),
      redemption_details: msAny.redemption_details,
      notes: msAny.notes,
    };
  });
}

export interface RedemptionTableRow {
  partner: string;
  transfer_ratio: string;
  minimum_transfer?: number;
  annual_cap?: number;
  transfer_time_days?: number;
  value_per_point: number;
  notes?: string;
}

export function getRedemptionTable(card: StandardizedCreditCard): {
  airlines: RedemptionTableRow[];
  hotels: RedemptionTableRow[];
} {
  const pointValue = card.rewards.base.redemption_value_rupees;

  const airlines = card.partners.airlines.map((airline) => {
    const airlineAny = airline as any;
    const [from, to] = airline.transfer_ratio.split(":").map(Number);
    const transferRate = to / from;
    const valuePerPoint = pointValue * transferRate;

    return {
      partner: airline.name,
      transfer_ratio: airline.transfer_ratio,
      minimum_transfer: airline.minimum_transfer,
      annual_cap: airline.annual_cap,
      transfer_time_days: airlineAny.transfer_time_days,
      value_per_point: valuePerPoint,
      notes: airlineAny.notes,
    };
  });

  const hotels = card.partners.hotels.map((hotel) => {
    const hotelAny = hotel as any;
    const [from, to] = hotel.transfer_ratio.split(":").map(Number);
    const transferRate = to / from;
    const valuePerPoint = pointValue * transferRate;

    return {
      partner: hotel.name,
      transfer_ratio: hotel.transfer_ratio,
      minimum_transfer: hotelAny.minimum_transfer,
      annual_cap: hotel.annual_cap,
      transfer_time_days: hotelAny.transfer_time_days,
      value_per_point: valuePerPoint,
      notes: hotelAny.notes,
    };
  });

  return { airlines, hotels };
}

function calculateTransferValue(ratio: string, pointValue: number): number {
  const [from, to] = ratio.split(":").map(Number);
  const transferRate = to / from;
  return pointValue * transferRate;
}

export interface ExclusionTableRow {
  category: string;
  mcc_codes?: number[];
  notes?: string;
}

export function getExclusionsTable(
  card: StandardizedCreditCard,
): ExclusionTableRow[] {
  const exclusions: ExclusionTableRow[] =
    card.excluded_categories.categories.map((cat) => ({
      category: cat,
      notes: card.excluded_categories.notes,
    }));

  // Check if specific_exclusions exists
  const excludedAny = card.excluded_categories as any;
  if (
    excludedAny.specific_exclusions &&
    Array.isArray(excludedAny.specific_exclusions)
  ) {
    exclusions.push(...excludedAny.specific_exclusions);
  }

  return exclusions;
}
// ────────────────────────────────────────────────────────────────────────────
// SpendProfile — all values are MONTHLY ₹
// ────────────────────────────────────────────────────────────────────────────

export interface SpendProfile {
  food: number;
  grocery: number;
  shopping: number;
  travel: number;
  utilities: number;
  fuel: number;
  rent: number;
  other: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Audit Types
// ────────────────────────────────────────────────────────────────────────────

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
  travelValue: number;
  breakdown: Array<{ label: string; value: number; plus: boolean }>;
}

export interface EnhancedCardAudit extends CardAudit {
  milestoneValue: number;
  acceleratedRewardsCaptured: number;
  partnerTransferValue: number;
  feeTransactionSavings: number;
  statusBonus: number;
  status: string;
  annualSpend: number;
  categoryBreakdown: {
    food: number;
    grocery: number;
    shopping: number;
    travel: number;
    utilities: number;
    fuel: number;
    rent: number;
    other: number;
  };
  warnings: string[];
  tips: string[];
}

export interface Milestone {
  spendAmount: number;
  benefit: string;
  valueRupees: number;
  period: "annual" | "quarterly";
  achieved: boolean;
  shortfall?: number;
}

export interface AcceleratedReward {
  name: string;
  multiplier: number;
  cap: CapDetail;
  applicable_categories: string[];
  applicable_channels: string[];
  qualifying_spend?: {
    amount: number;
    period: string;
  };
  notes?: string;
}

export interface PartnerTransferValue {
  airline: string;
  transferRatio: string;
  valuePerPoint: number;
  totalValue: number;
}

export interface MilestoneBenefit {
  spend_amount: number;
  benefit: string;
  value_rupees: number;
  period: "annual" | "quarterly" | "monthly";
  type: "points" | "voucher" | "cashback" | "ticket" | "membership";
  redemption_details?: string;
  notes?: string;
}

export interface LoungeBenefit {
  visits: number | "unlimited";
  period: "yearly" | "quarterly" | "monthly" | "unlimited";
  spend_requirement?: number;
  spend_period?: string;
  guest_allowed: boolean;
  guest_fee?: number;
  network?: string[];
  notes?: string;
}
export interface RedemptionCap {
  category: string;
  cap_amount: number;
  period: "daily" | "monthly" | "quarterly" | "yearly" | "per_transaction";
  unit: "points" | "rupees" | "miles";
  minimum_redemption?: number;
  notes?: string;
}

export interface PartnerTransfer {
  name: string;
  transfer_ratio: string;
  minimum_transfer?: number;
  annual_cap?: number;
  transfer_time_days?: number;
  notes?: string;
}

export interface WalletOptimisation {
  breakdown: Record<
    keyof SpendProfile,
    { card: CreditCard | null; reward: number; rate: number }
  >;
  totalMonthlyReward: number;
}

export interface EnhancedWalletOptimisation {
  breakdown: Record<
    keyof SpendProfile,
    {
      card: StandardizedCreditCard | null;
      reward: number;
      rate: number;
      acceleratedBonus: number;
    }
  >;
  totalMonthlyReward: number;
  totalAcceleratedBonus: number;
  warnings: string[];
}

export interface TransactionInsight {
  transaction: ParsedTransaction;
  merchant: MerchantCategory;
  isRewardable: boolean;
  bestCard: CreditCard | null;
  bestRate: number;
  bestReward: number;
  currentRate: number;
  currentReward: number;
  missedSavings: number;
}

export interface StatementAnalysis {
  insights: TransactionInsight[];
  totalSpend: number;
  rewardableSpend: number;
  totalMissedSavings: number;
  totalPotentialRewards: number;
  spendProfile: SpendProfile;
  categoryBreakdown: Array<{
    merchant: MerchantCategory;
    totalSpend: number;
    txnCount: number;
    bestCard: CreditCard | null;
    bestRate: number;
    bestReward: number;
  }>;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  category: string;
  balance?: number | null;
}

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

// ============================================================================
// SECTION 2 — DATASET LOADER (93+ Cards) with SAFE TYPE HANDLING
// ============================================================================

// Safe string conversion helper
function safeString(val: any): string {
  if (val === undefined || val === null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "true" : "false";
  return "";
}
function safeNumber(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[₹%,]/g, "").trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

function generateTagsFromStandard(c: any): string[] {
  const tags: string[] = [];
  const fees = c.fees || {};
  const isLtf = fees.is_lifetime_free || false;
  const annualFee = fees.annual || 0;
  const variant = c.variant || "";
  const searchTags = c.search_tags || [];
  const lounge = c.benefits?.lounge_access?.domestic?.visits || 0;

  if (isLtf || annualFee === 0) tags.push("Lifetime Free");
  if (annualFee > 0 && annualFee <= 1000) tags.push("Entry");
  if (annualFee > 1000 && annualFee < 10000) tags.push("Premium");
  if (annualFee >= 10000 || variant === "Ultra" || variant === "Ultra")
    tags.push("Super Premium");
  if (
    searchTags.some((t: string) => t.includes("travel") || t.includes("miles"))
  )
    tags.push("Travel");
  if (searchTags.some((t: string) => t.includes("cashback")))
    tags.push("Cashback");
  if (lounge === "unlimited" || Number(lounge) > 0) tags.push("Lounge");

  return [...new Set(tags)];
}

function detectNetwork(cardName: string): CreditCard["network"] {
  const n = safeToLowerCase(cardName);
  if (n.includes("amex") || n.includes("american express")) return "Amex";
  if (n.includes("mastercard")) return "Mastercard";
  if (n.includes("rupay")) return "RuPay";
  if (n.includes("diners")) return "Diners";
  return "Visa";
}

function parseJsonField(val: any): Record<string, string> {
  if (val === undefined || val === null) return {};
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  if (typeof val === "object") return val;
  return {};
}

function parseLakhs(val: any): number {
  const s = safeToLowerCase(val);
  if (!s || s.includes("none") || s === "0") return 0;
  const match = s.match(/(\d+(?:\.\d+)?)\s*l/i);
  if (match) return parseFloat(match[1]) * 100000;
  const clean = parseFloat(safeString(val).replace(/[^0-9.]/g, ""));
  return isNaN(clean) ? 0 : clean;
}

function cleanNumber(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (typeof val === "string") {
    if (
      val === "" ||
      val === "None" ||
      val === "Excluded" ||
      val === "N/A" ||
      val === "No"
    )
      return 0;
    const n = parseFloat(val.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function detectDevaluation(notes: any): boolean {
  const notesStr = safeToLowerCase(notes);
  return /(devaluation|critical|retention updated|rate.*cut|rewards.*reduced|cap.*reduced|capped.*reduced|redemption.*limited)/i.test(
    notesStr,
  );
}

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
  Federal: "from-emerald-800 via-teal-900 to-emerald-950",
  RBL: "from-purple-800 via-fuchsia-900 to-purple-950",
  HSBC: "from-red-700 via-rose-800 to-red-900",
  YES: "from-amber-700 via-orange-800 to-amber-900",
  BOB: "from-sky-800 via-blue-900 to-sky-950",
  PNB: "from-green-800 via-emerald-900 to-green-950",
  Canara: "from-yellow-700 via-amber-800 to-yellow-900",
  Union: "from-orange-600 via-red-700 to-orange-800",
  SCB: "from-blue-800 via-indigo-900 to-blue-950",
  default: "from-zinc-800 to-zinc-950",
};

export const creditCards: CreditCard[] = (rawCards as any[]).map((c, index) => {
  // Extract values from nested structure
  const fees = c.fees || {};
  const eligibility = c.eligibility || {};
  const rewards = c.rewards || {};
  const baseReward = rewards.base || {};
  const limits = c.limits || {};
  const excluded = c.excluded_categories || {};
  const benefits = c.benefits || {};
  const lounge = benefits.lounge_access || { domestic: {}, international: {} };
  const travel = benefits.travel || {};
  const fuel = benefits.fuel || {};
  const entertainment = benefits.entertainment || {};
  const channelRewards = c.channel_rewards || {};
  const smartbuy = channelRewards.smartbuy || {};
  const partners = c.partners || {};
  const ecommerce = partners.ecommerce || {};
  const foodPartners = partners.food || {};
  const travelPortals = partners.travel_portals || {};
  const feeTransactions = c.fee_transactions || {};

  // Get category rates from rewards.categories
  const getCategoryRate = (categoryName: string): number => {
    const cat = (rewards.categories || []).find(
      (cat: any) => cat.name === categoryName,
    );
    return cat?.rate_percent || 0;
  };

  // Get accelerated rewards limit
  const acceleratedRewards = rewards.accelerated_rewards || [];
  const acceleratedLimit =
    acceleratedRewards.length > 0 ? acceleratedRewards[0].limit : 0;

  return {
    id: c.id || String(index + 1),
    name: c.card_name || "",
    bank: c.issuer || "",
    tier: c.variant || "Standard",
    network: (c.network === "Diners Club"
      ? "Diners"
      : c.network) as CreditCard["network"],
    tags: generateTagsFromStandard(c),
    lifetimeFree: fees.is_lifetime_free || false,
    monthlyRewardCap: limits.monthly_reward_cap_rupees?.toString() || "No Cap",

    // Core reward economics
    baseRewardRate: baseReward.rate_percent || 0,
    pointValue: baseReward.redemption_value_rupees || 1,
    rewardUnit: baseReward.unit || "Points",
    travelMultiplier:
      getCategoryRate("Travel") / Math.max(baseReward.rate_percent, 0.01),

    // Platform-specific rates
    swiggyRate: foodPartners.swiggy || 0,
    zomatoRate: foodPartners.zomato || 0,
    diningRate: getCategoryRate("Dining") || baseReward.rate_percent,
    groceryRate: getCategoryRate("Grocery") || baseReward.rate_percent,
    amazonRate: ecommerce.amazon || 0,
    flipkartRate: ecommerce.flipkart || 0,
    meeshoRate: ecommerce.meesho || 0,
    ajioRate: ecommerce.ajio || 0,
    cromaRate: ecommerce.croma || 0,
    relianceRate: ecommerce.reliance_digital || 0,
    utilityRate: getCategoryRate("Utilities") || 0,
    rentRate: getCategoryRate("Rent") || 0,
    fuelRewardRate: fuel.reward_rate_percent || 0,
    flightRate: getCategoryRate("Travel") || travelPortals.mmt || 0,
    hotelRate: getCategoryRate("Travel") || 0,
    movieEffectiveRate:
      entertainment.value_rupees > 0
        ? (entertainment.value_rupees / 100) * 5
        : 0,

    // Caps & waiver
    rewardCap: limits.monthly_reward_cap_rupees?.toString() || "No Cap",
    retentionSpendReq: fees.renewal_waiver_spend || 0,
    renewalWaiverLimit: fees.renewal_waiver_spend,

    // Fees
    joiningFee: fees.joining || 0,
    annualFee: fees.annual || 0,
    isLtf: fees.is_lifetime_free || false,

    // Eligibility
    minIncomeLakhs: eligibility.min_income_annual_lakhs || 0,

    // Travel perks
    forexMarkup: travel.forex_markup_percent || 0,
    domesticLounge: parseLoungeVisits(lounge.domestic?.visits),
    internationalLounge: safeNumber(lounge.international?.visits),
    loungeCapDetails: `Spend requirement: ₹${lounge.domestic?.spend_requirement?.toLocaleString() || 0} ${lounge.domestic?.spend_period || ""}`,

    // Metadata
    joiningBenefit: fees.joining_benefit || "N/A",
    milestoneBenefit:
      (benefits.milestones || []).map((m: any) => m.benefit).join(", ") ||
      "None",
    notesTnc: c.notes_tnc || "",
    searchTags: (c.search_tags || []).join(", "),
    devaluation2026: detectDevaluation(c.notes_tnc),
    imageGradient: gradients[c.issuer] || gradients.default,
    multiplierChannel: "Direct",

    // Redemption
    pointsRedemptionValueTravel: baseReward.redemption_value_rupees || 1,
    airIndiaTransferRatio: (partners.airlines || [])
      .find((a: any) => a.name === "Air India")
      ?.transfer_ratio?.split(":")[0]
      ? 1
      : 0,
    airlineTransferJson: Object.fromEntries(
      (partners.airlines || []).map((a: any) => [a.name, a.transfer_ratio]),
    ),
    hotelTransferJson: Object.fromEntries(
      (partners.hotels || []).map((h: any) => [h.name, h.transfer_ratio]),
    ),
    detailedRewardsJson: Object.fromEntries(
      (rewards.categories || []).map((cat: any) => [
        cat.name,
        `${cat.rate_percent}%`,
      ]),
    ),

    // Misc
    smartbuyFlightPct: smartbuy.flights_rate || 0,
    atlasFlightPct: channelRewards.travel_edge?.rate || 0,
    sbiCashbackFlightPct: 0,
    emiratesSuitability: 0,
    instantDiscountEligible: travel.instant_discount_eligible || false,
    surchargeWaiver: `${fuel.surcharge_waiver_percent || 0}%`,
    fuelCap: String(fuel.reward_cap_rupees || 0),
    forexEffective:
      travel.forex_markup_percent === 0
        ? "0%"
        : `${travel.forex_markup_percent}%`,
    flipkartMethod: "Direct",
    relianceMethod: "Direct",
    amazonMethod: "Direct",
    movieDealType: entertainment.movie_benefit || "Standard Rewards",
  };
});

// ============================================================================
// SECTION 3 — UTILITY FUNCTIONS
// ============================================================================

function parseCapValue(
  cap: string | number,
  pointValue: number = 1,
): { value: number; isPoints: boolean } {
  if (
    !cap ||
    cap === "No Cap" ||
    cap === "Unlimited" ||
    cap === "See Category Rules"
  ) {
    return { value: Infinity, isPoints: false };
  }

  const s = String(cap).toLowerCase();

  const cleaned = s
    .replace(/\(\s*from\s+[^)]+\)/gi, "")
    .replace(/\(\s*was\s+[^)]+\)/gi, "")
    .replace(/\(\s*as\s+[^)]+\)/gi, "")
    .replace(/\(\s*max[^)]+\)/gi, "")
    .trim();

  const isPoints = cleaned.includes("points") || cleaned.includes("pts");
  const hasK = cleaned.includes("k") && !cleaned.includes("points");
  const hasL = cleaned.includes("l") && !cleaned.includes("points");
  const mult = hasL ? 100000 : hasK ? 1000 : 1;

  let numericStr = cleaned.replace(/[^0-9.,]/g, "");
  numericStr = numericStr.replace(/,/g, "");
  let value = parseFloat(numericStr) * mult;

  if (isPoints && value !== Infinity) {
    value = value * pointValue;
  }

  return { value: isNaN(value) ? Infinity : value, isPoints };
}

function applyRewardCap(
  annualRewards: number,
  cap: any,
  pointValue: number = 1,
): number {
  const s = String(cap || "")
    .toLowerCase()
    .trim();

  const passThroughPhrases = [
    "no cap",
    "unlimited",
    "standard",
    "see category",
    "category rules",
  ];
  if (!s || passThroughPhrases.some((x) => s.includes(x))) return annualRewards;

  const cleaned = s
    .replace(/\(\s*from\s+[^)]+\)/gi, "")
    .replace(/\(\s*was\s+[^)]+\)/gi, "")
    .replace(/\(\s*as\s+[^)]+\)/gi, "")
    .replace(/\(\s*max[^)]+\)/gi, "")
    .trim();

  const hasK = cleaned.includes("k");
  const hasL = cleaned.includes("l");
  const mult = hasL ? 100000 : hasK ? 1000 : 1;

  const n = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
  if (isNaN(n) || n === 0) return annualRewards;

  const rawCapPerPeriod = n * mult;
  const isPointsCap = s.includes("points") || s.includes("pts");
  const capRupees = isPointsCap
    ? rawCapPerPeriod * pointValue
    : rawCapPerPeriod;
  const isAnnual =
    s.includes("year") || s.includes("annual") || s.includes("p.a.");
  const annualCap = isAnnual ? capRupees : capRupees * 12;

  return Math.min(annualRewards, annualCap);
}

function parseAmount(str: string | number): number {
  if (typeof str === "number") return isNaN(str) ? 0 : str;
  if (!str || str === "None" || str === "N/A" || str === "Excluded") return 0;
  const cleaned = String(str).replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

// ============================================================================
// SECTION 4 — CATEGORY RESOLVER
// ============================================================================

export const NON_REWARDABLE = new Set<MerchantCategory>([
  "transfer",
  "bank_charge",
]);

export function parserCatToMerchant(
  _parserCategory: string,
  description: string,
): MerchantCategory {
  const cat = getCategory(description);

  switch (cat) {
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
    case "meesho":
      return Math.max(card.meeshoRate, card.baseRewardRate);
    case "ajio":
      return Math.max(card.ajioRate, card.baseRewardRate);
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

// ============================================================================
// SECTION 5 — ENHANCED CALCULATION ENGINE
// ============================================================================

function calcLoungeValue(card: CreditCard, monthlyVisits: number): number {
  const annualVisits =
    card.domesticLounge === "Unlimited"
      ? 999
      : parseInt(String(card.domesticLounge)) || 0;
  const usedVisits = Math.min(annualVisits, monthlyVisits * 12);
  return usedVisits * 800;
}

function calcForexSavings(annualTravelSpend: number, markup: number): number {
  if (annualTravelSpend <= 0 || markup <= 0) return 0;
  return Math.max(0, (annualTravelSpend * 0.5 * (3.5 - markup)) / 100);
}

function calculateMilestoneBenefits(
  card: StandardizedCreditCard,
  annualSpend: number,
): Milestone[] {
  const milestones: Milestone[] = [];
  if (!card.benefits.milestones || card.benefits.milestones.length === 0)
    return milestones;

  for (const ms of card.benefits.milestones) {
    const achieved = annualSpend >= ms.spend_amount;
    milestones.push({
      spendAmount: ms.spend_amount,
      benefit: ms.benefit,
      valueRupees: ms.value_rupees,
      period: ms.period,
      achieved,
      shortfall: achieved ? 0 : Math.max(0, ms.spend_amount - annualSpend),
    });
  }
  return milestones;
}

function calculateMilestoneValue(milestones: Milestone[]): number {
  return milestones
    .filter((m) => m.achieved)
    .reduce((sum, m) => sum + m.valueRupees, 0);
}

function calculateAcceleratedRewards(
  card: StandardizedCreditCard,
  categorySpend: number,
  categoryName: string,
  baseRate: number,
  pointValue: number,
): { reward: number; captured: number; capped: boolean } {
  if (
    !card.rewards.accelerated_rewards ||
    card.rewards.accelerated_rewards.length === 0
  ) {
    return {
      reward: (categorySpend * baseRate) / 100,
      captured: 0,
      capped: false,
    };
  }

  let totalReward = 0;
  let capturedReward = 0;
  let capped = false;

  for (const acc of card.rewards.accelerated_rewards) {
    const applicable =
      acc.applicable_categories.includes(categoryName) ||
      acc.applicable_categories.includes("All");
    if (!applicable) continue;

    const acceleratedRate = baseRate * acc.multiplier;
    // Safely handle limit which might be undefined
    const limit = (acc as any).limit || 0;
    const maxAcceleratedReward = (limit * pointValue) / acc.multiplier;
    const spendCap = (limit / (acceleratedRate / 100)) * pointValue;
    const eligibleSpend = Math.min(categorySpend, spendCap);
    const acceleratedReward = (eligibleSpend * acceleratedRate) / 100;
    const baseReward = (eligibleSpend * baseRate) / 100;
    const extraReward = acceleratedReward - baseReward;

    if (extraReward > maxAcceleratedReward) {
      capped = true;
      capturedReward += maxAcceleratedReward;
      totalReward += baseReward + maxAcceleratedReward;
    } else {
      capturedReward += extraReward;
      totalReward += acceleratedReward;
    }
  }

  const remainingSpend = categorySpend - (totalReward / (baseRate / 100)) * 100;
  if (remainingSpend > 0) {
    totalReward += (remainingSpend * baseRate) / 100;
  }

  return { reward: totalReward, captured: capturedReward, capped };
}

const PARTNER_VALUES: Record<string, number> = {
  "Air India": 0.5,
  Vistara: 0.6,
  "Singapore Airlines": 0.8,
  "British Airways": 0.7,
  "Marriott Bonvoy": 0.6,
  Accor: 1.0,
  ITC: 0.5,
  Hilton: 0.4,
  Emirates: 0.4,
  "Turkish Airlines": 0.5,
  "Qatar Airways": 0.6,
};

function calculatePartnerTransferValue(
  card: StandardizedCreditCard,
  annualPoints: number,
): PartnerTransferValue[] {
  const transfers: PartnerTransferValue[] = [];

  for (const partner of card.partners.airlines) {
    const [from, to] = partner.transfer_ratio.split(":").map(Number);
    const transferRate = to / from;
    const transferredPoints = annualPoints * transferRate;
    const valuePerPoint = PARTNER_VALUES[partner.name] || 0.4;
    transfers.push({
      airline: partner.name,
      transferRatio: partner.transfer_ratio,
      valuePerPoint,
      totalValue: transferredPoints * valuePerPoint,
    });
  }

  for (const partner of card.partners.hotels) {
    const [from, to] = partner.transfer_ratio.split(":").map(Number);
    const transferRate = to / from;
    const transferredPoints = annualPoints * transferRate;
    const valuePerPoint = PARTNER_VALUES[partner.name] || 0.5;
    transfers.push({
      airline: partner.name,
      transferRatio: partner.transfer_ratio,
      valuePerPoint,
      totalValue: transferredPoints * valuePerPoint,
    });
  }

  return transfers;
}

function getMaxPartnerTransferValue(transfers: PartnerTransferValue[]): number {
  return transfers.length > 0
    ? Math.max(...transfers.map((t) => t.totalValue))
    : 0;
}

function calculateFeeTransactionSavings(
  card: StandardizedCreditCard,
  spend: SpendProfile,
): { savings: number; breakdown: Record<string, number> } {
  let totalSavings = 0;
  const breakdown: Record<string, number> = {};

  if (spend.rent > 0 && card.fee_transactions.rent.reward_eligible) {
    const feeSaved =
      spend.rent * 12 * (card.fee_transactions.rent.fee_percent / 100);
    const minFee = card.fee_transactions.rent.min_fee || 0;
    breakdown.rent = Math.max(feeSaved, minFee);
    totalSavings += breakdown.rent;
  }

  if (spend.utilities > 0 && card.fee_transactions.utility.reward_eligible) {
    const feeSaved =
      spend.utilities * 12 * (card.fee_transactions.utility.fee_percent / 100);
    const maxFee = card.fee_transactions.utility.max_fee || Infinity;
    breakdown.utility = Math.min(feeSaved, maxFee);
    totalSavings += breakdown.utility;
  }

  if (spend.other > 0 && card.fee_transactions.insurance.reward_eligible) {
    const insuranceSpend = spend.other * 12 * 0.1;
    breakdown.insurance =
      insuranceSpend * (card.fee_transactions.insurance.fee_percent / 100);
    totalSavings += breakdown.insurance;
  }

  return { savings: totalSavings, breakdown };
}

function getStatusMultiplier(status: string): number {
  switch (status) {
    case "Active":
      return 1.0;
    case "Changing":
      return 0.8;
    case "Limited":
      return 0.5;
    case "Discontinued":
      return 0;
    default:
      return 1.0;
  }
}

function getStatusBonus(status: string): number {
  switch (status) {
    case "Discontinued":
      return -10000;
    case "Changing":
      return -500;
    case "Limited":
      return -200;
    default:
      return 0;
  }
}

// ============================================================================
// SECTION 6 — ENHANCED CARD AUDIT
// ============================================================================

export function calculateEnhancedCardAudit(
  card: StandardizedCreditCard,
  spend: SpendProfile,
  monthlyLoungeVisits: number = 0.5,
): EnhancedCardAudit {
  const annualSpend = Object.values(spend).reduce((a, b) => a + b, 0) * 12;
  const pointValue = card.rewards.base.redemption_value_rupees;
  const baseRate = card.rewards.base.rate_percent;

  let totalRewards = 0;
  let acceleratedCaptured = 0;
  const categoryBreakdown: EnhancedCardAudit["categoryBreakdown"] = {
    food: 0,
    grocery: 0,
    shopping: 0,
    travel: 0,
    utilities: 0,
    fuel: 0,
    rent: 0,
    other: 0,
  };

  const categories = [
    {
      name: "food",
      spend: spend.food,
      rates: [
        card.rewards.categories.find((c) => c.name === "Dining")?.rate_percent,
        baseRate,
      ],
    },
    {
      name: "grocery",
      spend: spend.grocery,
      rates: [
        card.rewards.categories.find((c) => c.name === "Grocery")?.rate_percent,
        baseRate,
      ],
    },
    {
      name: "shopping",
      spend: spend.shopping,
      rates: [
        card.rewards.categories.find((c) => c.name === "Shopping")
          ?.rate_percent,
        baseRate,
      ],
    },
    {
      name: "travel",
      spend: spend.travel,
      rates: [
        card.rewards.categories.find((c) => c.name === "Travel")?.rate_percent,
        baseRate,
      ],
    },
    {
      name: "utilities",
      spend: spend.utilities,
      rates: [
        card.rewards.categories.find((c) => c.name === "Utilities")
          ?.rate_percent,
        baseRate,
      ],
    },
    {
      name: "fuel",
      spend: spend.fuel,
      rates: [
        card.rewards.categories.find((c) => c.name === "Fuel")?.rate_percent,
        baseRate,
      ],
    },
    {
      name: "rent",
      spend: spend.rent,
      rates: [
        card.rewards.categories.find((c) => c.name === "Rent")?.rate_percent,
        0,
      ],
    },
    { name: "other", spend: spend.other, rates: [baseRate] },
  ];

  for (const cat of categories) {
    if (cat.spend === 0) continue;
    const rate = Math.max(
      ...cat.rates.filter((r) => r !== undefined && r !== null),
    );
    if (rate === 0) continue;

    const accelerated = calculateAcceleratedRewards(
      card,
      cat.spend * 12,
      cat.name,
      rate,
      pointValue,
    );
    totalRewards += accelerated.reward;
    acceleratedCaptured += accelerated.captured;
    categoryBreakdown[cat.name as keyof typeof categoryBreakdown] =
      accelerated.reward;
  }

  const monthlyCap = parseCapValue(
    card.limits.monthly_reward_cap_rupees || "No Cap",
    pointValue,
  );
  if (monthlyCap.value !== Infinity && totalRewards > monthlyCap.value) {
    totalRewards = monthlyCap.value;
  }

  const milestones = calculateMilestoneBenefits(card, annualSpend);
  const milestoneValue = calculateMilestoneValue(milestones);
  const partnerTransfers = calculatePartnerTransferValue(card, totalRewards);
  const partnerTransferValue = getMaxPartnerTransferValue(partnerTransfers);
  const feeSavings = calculateFeeTransactionSavings(card, spend);

  const loungeVisits =
    typeof card.benefits.lounge_access.domestic.visits === "number"
      ? card.benefits.lounge_access.domestic.visits
      : card.benefits.lounge_access.domestic.visits === "unlimited"
        ? 999
        : 0;
  const loungeSpendReq =
    card.benefits.lounge_access.domestic.spend_requirement || 0;
  const loungeEligible = loungeSpendReq === 0 || annualSpend >= loungeSpendReq;
  const loungeValue = loungeEligible
    ? Math.min(loungeVisits, monthlyLoungeVisits * 12) * 800
    : 0;

  const travelSpend = spend.travel * 12;
  const forexSavings =
    travelSpend > 0 && card.benefits.travel.forex_markup_percent < 3.5
      ? (travelSpend *
          0.5 *
          (3.5 - card.benefits.travel.forex_markup_percent)) /
        100
      : 0;

  const feeWaived =
    card.fees.renewal_waiver_spend > 0 &&
    annualSpend >= card.fees.renewal_waiver_spend;
  const annualFee = feeWaived ? 0 : card.fees.annual;
  const outflow = annualFee * 1.18;

  const statusMultiplier = getStatusMultiplier(card.status);
  const statusBonus = getStatusBonus(card.status);

  const netValue =
    (totalRewards +
      milestoneValue +
      partnerTransferValue +
      feeSavings.savings +
      loungeValue +
      forexSavings -
      outflow) *
      statusMultiplier +
    statusBonus;
  const effectiveRate =
    annualSpend > 0 ? (totalRewards / annualSpend) * 100 : 0;
  const breakEven =
    card.fees.annual === 0 || effectiveRate === 0
      ? 0
      : (card.fees.annual * 1.18) / 12 / (effectiveRate / 100);

  const warnings: string[] = [];
  const tips: string[] = [];

  if (card.status === "Discontinued") {
    warnings.push(
      "⚠️ This card is being discontinued. New applications are not accepted.",
    );
    tips.push(
      "Consider alternative cards before this card is fully phased out.",
    );
  }
  if (card.status === "Changing") {
    warnings.push(
      "📢 This card's benefits are changing due to policy updates.",
    );
    tips.push(
      "Check the latest terms before applying. Some benefits may be reduced.",
    );
  }
  if (
    milestones.some((m) => !m.achieved && m.shortfall && m.shortfall < 50000)
  ) {
    tips.push(
      `💰 Spend ₹${milestones.find((m) => !m.achieved)?.shortfall?.toLocaleString()} more to unlock milestone benefits.`,
    );
  }
  if (
    annualFee > 0 &&
    !feeWaived &&
    annualSpend < card.fees.renewal_waiver_spend
  ) {
    const shortfall = card.fees.renewal_waiver_spend - annualSpend;
    tips.push(
      `💳 Spend ₹${shortfall.toLocaleString()} more annually to waive the ₹${annualFee.toLocaleString()} fee.`,
    );
  }
  if (
    card.limits.monthly_reward_cap_rupees &&
    totalRewards >= parseCapValue(card.limits.monthly_reward_cap_rupees).value
  ) {
    warnings.push(
      `⚠️ You're hitting the monthly reward cap. Consider using another card for additional spends.`,
    );
  }

  return {
    netValue: Math.round(netValue),
    yield: parseFloat(((netValue / (annualSpend || 1)) * 100).toFixed(2)),
    feeWaived,
    grossRewards: Math.round(totalRewards),
    outflow: Math.round(outflow),
    effectiveRewardRate: parseFloat(effectiveRate.toFixed(2)),
    breakEvenMonthlySpend: parseFloat(breakEven.toFixed(0)),
    loungeValue: Math.round(loungeValue),
    forexSavings: Math.round(forexSavings),
    travelValue: Math.round(loungeValue + forexSavings),
    breakdown: [
      { label: "Reward Cashback", value: Math.round(totalRewards), plus: true },
      {
        label: "Milestone Benefits",
        value: Math.round(milestoneValue),
        plus: true,
      },
      {
        label: "Partner Transfer Value",
        value: Math.round(partnerTransferValue),
        plus: true,
      },
      {
        label: "Fee Transaction Savings",
        value: Math.round(feeSavings.savings),
        plus: true,
      },
      {
        label: "Lounge & Perks",
        value: Math.round(loungeValue + forexSavings),
        plus: true,
      },
      { label: "Annual Fee + GST", value: Math.round(outflow), plus: false },
    ],
    milestoneValue: Math.round(milestoneValue),
    acceleratedRewardsCaptured: Math.round(acceleratedCaptured),
    partnerTransferValue: Math.round(partnerTransferValue),
    feeTransactionSavings: Math.round(feeSavings.savings),
    statusBonus,
    status: card.status,
    annualSpend,
    categoryBreakdown,
    warnings,
    tips,
  };
}

// ============================================================================
// SECTION 7 — LEGACY CALCULATION ENGINE (Backward Compatible)
// ============================================================================

export function calculateInDepthSavings(
  card: CreditCard,
  spend: SpendProfile,
  monthlyLoungeVisits: number = 0.5,
): CardAudit {
  const pv = card.pointValue || 1;
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

  const catR = (monthlyAmt: number, rate: number): number => {
    let r = ((monthlyAmt * 12 * rate) / 100) * pv;
    const rules = card.detailedRewardsJson;
    if (rules?.["Utility"] === "Capped") r = Math.min(r, 500 * 12);
    return r;
  };

  const food = catR(
    spend.food,
    Math.max(
      card.swiggyRate,
      card.zomatoRate,
      card.diningRate,
      card.baseRewardRate,
    ),
  );
  const grocery = catR(
    spend.grocery,
    Math.max(card.groceryRate, card.baseRewardRate),
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
  );
  const trav = catR(
    spend.travel,
    Math.max(card.flightRate, card.hotelRate, card.baseRewardRate),
  );
  const util = catR(
    spend.utilities,
    card.utilityRate > 0 ? card.utilityRate : card.baseRewardRate,
  );
  const fuel = catR(
    spend.fuel,
    card.fuelRewardRate > 0 ? card.fuelRewardRate : card.baseRewardRate,
  );
  const rent = card.rentRate > 0 ? catR(spend.rent, card.rentRate) : 0;
  const other = ((spend.other * 12 * card.baseRewardRate) / 100) * pv;

  const grossRaw = food + grocery + shop + trav + util + fuel + rent + other;
  const grossRewards = applyRewardCap(grossRaw, card.rewardCap, pv);

  const feeWaived =
    card.retentionSpendReq > 0 && annualSpend >= card.retentionSpendReq;
  const outflow = feeWaived ? 0 : card.annualFee * 1.18;

  const lv = calcLoungeValue(card, monthlyLoungeVisits);
  const fs = calcForexSavings(spend.travel * 12, card.forexMarkup);
  const net = grossRewards + lv + fs - outflow;
  const eff = annualSpend > 0 ? (grossRewards / annualSpend) * 100 : 0;
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
    travelValue: lv + fs,
    breakdown: [
      { label: "Reward Cashback", value: Math.round(grossRewards), plus: true },
      { label: "Lounge & Perks", value: Math.round(lv + fs), plus: true },
      { label: "Annual Fee + GST", value: Math.round(outflow), plus: false },
    ],
  };
}

// ============================================================================
// SECTION 8 — CARD SCORING
// ============================================================================

export function scoreCard(
  card: CreditCard,
  spend: SpendProfile,
  category: string,
): { card: CreditCard; audit: CardAudit; score: number } {
  const audit = calculateInDepthSavings(card, spend);
  const annualSpend = Object.values(spend).reduce((a, b) => a + b, 0) * 12;

  if (audit.netValue < 0) return { card, audit, score: 0 };

  let score = 0;
  score += Math.sqrt(Math.max(0, audit.netValue)) * 1.5;
  score += Math.max(0, audit.effectiveRewardRate) * 4;

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

  const xtra = (monthly: number, rate: number) =>
    ((monthly * Math.max(0, rate - card.baseRewardRate)) / 100) * 0.05;
  const cat = category.toLowerCase();

  if (
    cat.includes("food") ||
    cat.includes("swiggy") ||
    cat.includes("dining")
  ) {
    score += xtra(
      spend.food,
      Math.max(card.swiggyRate, card.zomatoRate, card.diningRate),
    );
  }
  if (cat.includes("grocery")) score += xtra(spend.grocery, card.groceryRate);
  if (
    cat.includes("shopping") ||
    cat.includes("amazon") ||
    cat.includes("flipkart")
  ) {
    score += xtra(
      spend.shopping,
      Math.max(
        card.amazonRate,
        card.flipkartRate,
        card.meeshoRate,
        card.ajioRate,
      ),
    );
  }
  if (cat.includes("travel") || cat.includes("flight")) {
    score += xtra(spend.travel, Math.max(card.flightRate, card.hotelRate));
    if (card.tags.includes("Travel")) score += 2;
  }
  if (cat.includes("fuel")) score += xtra(spend.fuel, card.fuelRewardRate);
  if (card.utilityRate > card.baseRewardRate)
    score += xtra(spend.utilities, card.utilityRate);
  if (card.searchTags.toLowerCase().includes(cat) && cat !== "general")
    score += 3;

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
  if (card.devaluation2026) score -= 10;

  return { card, audit, score: parseFloat(Math.max(0, score).toFixed(2)) };
}

export function scoreCardEnhanced(
  card: StandardizedCreditCard,
  spend: SpendProfile,
  category: string,
): { card: StandardizedCreditCard; audit: EnhancedCardAudit; score: number } {
  const audit = calculateEnhancedCardAudit(card, spend);
  if (audit.status === "Discontinued") return { card, audit, score: 0 };
  if (audit.netValue < 0 && audit.netValue > -5000)
    return { card, audit, score: 0.1 };

  let score = 0;
  score += Math.sqrt(Math.max(0, audit.netValue)) * 2;
  score += Math.max(0, audit.effectiveRewardRate) * 5;

  if (card.fees.is_lifetime_free || card.fees.annual === 0) {
    score += 8;
  } else {
    const feeRatio =
      audit.annualSpend > 0 ? card.fees.annual / audit.annualSpend : 1;
    if (feeRatio <= 0.005) score += 5;
    else if (feeRatio <= 0.01) score += 2;
    else if (feeRatio <= 0.02) score -= 2;
    else if (feeRatio <= 0.05) score -= 8;
    else score -= 15;
  }

  const categoryBonuses: Record<string, number> = {
    food: Math.max(
      ...card.rewards.categories
        .filter((c) => c.name === "Dining")
        .map((c) => c.rate_percent),
      0,
    ),
    grocery: Math.max(
      ...card.rewards.categories
        .filter((c) => c.name === "Grocery")
        .map((c) => c.rate_percent),
      0,
    ),
    shopping: Math.max(
      ...card.rewards.categories
        .filter((c) => c.name === "Shopping")
        .map((c) => c.rate_percent),
      0,
    ),
    travel: Math.max(
      ...card.rewards.categories
        .filter((c) => c.name === "Travel")
        .map((c) => c.rate_percent),
      0,
    ),
  };

  const cat = category.toLowerCase();
  if (categoryBonuses[cat]) {
    const extra = categoryBonuses[cat] - card.rewards.base.rate_percent;
    const monthlySpend = spend[cat as keyof SpendProfile] || 0;
    score += ((monthlySpend * 12 * extra) / 100) * 0.08;
  }

  const loungeVisits =
    typeof card.benefits.lounge_access.domestic.visits === "number"
      ? card.benefits.lounge_access.domestic.visits
      : card.benefits.lounge_access.domestic.visits === "unlimited"
        ? 999
        : 0;
  if (loungeVisits >= 12) score += 8;
  else if (loungeVisits >= 8) score += 5;
  else if (loungeVisits >= 4) score += 3;

  if (card.benefits.travel.forex_markup_percent <= 0) score += 10;
  else if (card.benefits.travel.forex_markup_percent <= 1) score += 6;
  else if (card.benefits.travel.forex_markup_percent < 2) score += 3;
  else if (card.benefits.travel.forex_markup_percent > 3) score -= 5;

  if (audit.milestoneValue > 5000) score += 12;
  else if (audit.milestoneValue > 2000) score += 6;
  else if (audit.milestoneValue > 500) score += 3;

  if (audit.partnerTransferValue > 5000) score += 10;
  else if (audit.partnerTransferValue > 2000) score += 5;
  else if (audit.partnerTransferValue > 500) score += 2;

  if (card.status === "Changing") score -= 8;
  if (card.status === "Limited") score -= 12;

  return { card, audit, score: parseFloat(Math.max(0, score).toFixed(2)) };
}
function safeToLowerCase(val: any): string {
  return safeString(val).toLowerCase();
}
function parseLoungeVisits(val: any): number | string {
  if (val === "unlimited") return "Unlimited";
  return safeNumber(val);
}

// ============================================================================
// SECTION 9 — RANKING FUNCTIONS
// ============================================================================

export function deriveMaxFee(monthlyRewardableSpend: number): number {
  if (monthlyRewardableSpend < 2000) return 0;
  else if (monthlyRewardableSpend < 8000) return 500;
  else if (monthlyRewardableSpend < 20000) return 1500;
  else if (monthlyRewardableSpend < 50000) return 3000;
  else if (monthlyRewardableSpend < 125000) return 5000;
  else return 10000;
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

export function rankCardsEnhanced(
  spend: SpendProfile,
  category: string,
  availableCards?: StandardizedCreditCard[],
  minScore?: number,
): Array<{
  card: StandardizedCreditCard;
  audit: EnhancedCardAudit;
  score: number;
}> {
  const cards = availableCards || [];
  return cards
    .map((c) => scoreCardEnhanced(c, spend, category))
    .filter((r) => r.score > (minScore || 0))
    .sort((a, b) => b.score - a.score);
}

// ============================================================================
// SECTION 10 — WALLET OPTIMIZER
// ============================================================================

export function optimizeCards(
  cards: CreditCard[],
  spend: SpendProfile,
): WalletOptimisation {
  const best = (monthly: number, rateFn: (c: CreditCard) => number) => {
    let bestCard: CreditCard | null = null,
      bestReward = 0,
      bestRate = 0;
    for (const c of cards) {
      const rate = rateFn(c);
      const reward = (monthly * rate) / 100;
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
  const grocery = best(spend.grocery, (c) =>
    Math.max(c.groceryRate, c.baseRewardRate),
  );
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

export function optimizeCardsEnhanced(
  cards: StandardizedCreditCard[],
  spend: SpendProfile,
): EnhancedWalletOptimisation {
  const activeCards = cards.filter(
    (c) => c.status === "Active" || c.status === "Changing",
  );
  const warnings: string[] = [];

  if (cards.some((c) => c.status === "Changing")) {
    warnings.push(
      "⚠️ Some cards in your wallet have changing benefits. Review terms before major spends.",
    );
  }

  const best = (
    monthly: number,
    categoryName: string,
    getRateFn: (c: StandardizedCreditCard) => number,
  ) => {
    let bestCard: StandardizedCreditCard | null = null;
    let bestReward = 0;
    let bestRate = 0;
    let bestAccelerated = 0;

    for (const c of activeCards) {
      const rate = getRateFn(c);
      const accelerated = calculateAcceleratedRewards(
        c,
        monthly * 12,
        categoryName,
        rate,
        c.rewards.base.redemption_value_rupees,
      );
      const reward = accelerated.reward / 12;
      if (reward > bestReward) {
        bestReward = reward;
        bestRate = rate;
        bestCard = c;
        bestAccelerated = accelerated.captured / 12;
      }
    }
    return {
      card: bestCard,
      reward: bestReward,
      rate: bestRate,
      acceleratedBonus: bestAccelerated,
    };
  };

  const food = best(spend.food, "food", (c) =>
    Math.max(
      ...c.rewards.categories
        .filter((cat) => cat.name === "Dining")
        .map((cat) => cat.rate_percent),
      c.rewards.base.rate_percent,
    ),
  );
  const grocery = best(spend.grocery, "grocery", (c) =>
    Math.max(
      ...c.rewards.categories
        .filter((cat) => cat.name === "Grocery")
        .map((cat) => cat.rate_percent),
      c.rewards.base.rate_percent,
    ),
  );
  const shopping = best(spend.shopping, "shopping", (c) =>
    Math.max(
      ...c.rewards.categories
        .filter((cat) => cat.name === "Shopping")
        .map((cat) => cat.rate_percent),
      c.rewards.base.rate_percent,
    ),
  );
  const travel = best(spend.travel, "travel", (c) =>
    Math.max(
      ...c.rewards.categories
        .filter((cat) => cat.name === "Travel")
        .map((cat) => cat.rate_percent),
      c.rewards.base.rate_percent,
    ),
  );
  const utilities = best(spend.utilities, "utilities", (c) =>
    Math.max(
      ...c.rewards.categories
        .filter((cat) => cat.name === "Utilities")
        .map((cat) => cat.rate_percent),
      c.rewards.base.rate_percent,
    ),
  );
  const fuel = best(spend.fuel, "fuel", (c) =>
    Math.max(
      ...c.rewards.categories
        .filter((cat) => cat.name === "Fuel")
        .map((cat) => cat.rate_percent),
      c.rewards.base.rate_percent,
    ),
  );
  const rent = best(spend.rent, "rent", (c) =>
    Math.max(
      ...c.rewards.categories
        .filter((cat) => cat.name === "Rent")
        .map((cat) => cat.rate_percent),
      0,
    ),
  );
  const other = best(spend.other, "other", (c) => c.rewards.base.rate_percent);

  const total =
    food.reward +
    grocery.reward +
    shopping.reward +
    travel.reward +
    utilities.reward +
    fuel.reward +
    rent.reward +
    other.reward;
  const totalAccelerated =
    food.acceleratedBonus +
    grocery.acceleratedBonus +
    shopping.acceleratedBonus +
    travel.acceleratedBonus +
    utilities.acceleratedBonus +
    fuel.acceleratedBonus +
    rent.acceleratedBonus +
    other.acceleratedBonus;

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
    totalAcceleratedBonus: parseFloat(totalAccelerated.toFixed(2)),
    warnings,
  };
}

// ============================================================================
// SECTION 11 — STATEMENT ANALYSIS
// ============================================================================

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

export function recommendFromStatement(
  transactions: ParsedTransaction[],
  incomeInLakhs?: number,
  currentCard: CreditCard | null = null,
): {
  analysis: StatementAnalysis;
  topCards: Array<{ card: CreditCard; audit: CardAudit; score: number }>;
  maxFee: number;
  categoryKeyword: string;
} {
  const analysis = analyseStatement(transactions, creditCards, currentCard);
  const maxFee = deriveMaxFee(analysis.rewardableSpend);
  let eligible = getEligibleCards(maxFee, incomeInLakhs);
  if (eligible.length < 3)
    eligible = getEligibleCards(maxFee * 2, incomeInLakhs);
  if (eligible.length < 3)
    eligible = creditCards.filter((c) => c.isLtf || c.annualFee === 0);

  const sp = analysis.spendProfile;
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
  const topCards = rankCards(sp, categoryKeyword, eligible).slice(0, 5);

  return { analysis, topCards, maxFee, categoryKeyword };
}

// ============================================================================
// SECTION 12 — CARD COMPARISON
// ============================================================================

export interface CardComparison {
  card: StandardizedCreditCard;
  audit: EnhancedCardAudit;
  bestFor: string[];
  weaknesses: string[];
}

export function compareCards(
  cards: StandardizedCreditCard[],
  spend: SpendProfile,
): CardComparison[] {
  const comparisons: CardComparison[] = [];

  for (const card of cards) {
    const audit = calculateEnhancedCardAudit(card, spend);
    const bestFor: string[] = [];
    const weaknesses: string[] = [];

    if (audit.effectiveRewardRate > 3) bestFor.push("High rewards");
    const domesticVisits = card.benefits.lounge_access.domestic.visits;
    if (typeof domesticVisits === "number" && domesticVisits > 8) {
      bestFor.push("Lounge access");
    }
    if (card.benefits.travel.forex_markup_percent <= 1)
      bestFor.push("Low forex fees");
    if (audit.milestoneValue > 2000) bestFor.push("Milestone benefits");
    if (audit.partnerTransferValue > 2000) bestFor.push("Partner transfers");

    const categoryRates = card.rewards.categories;
    if (categoryRates.some((c) => c.name === "Dining" && c.rate_percent > 5))
      bestFor.push("Dining rewards");
    if (categoryRates.some((c) => c.name === "Travel" && c.rate_percent > 5))
      bestFor.push("Travel rewards");
    if (categoryRates.some((c) => c.name === "Grocery" && c.rate_percent > 5))
      bestFor.push("Grocery rewards");

    if (audit.netValue < 0) weaknesses.push("Negative net value");
    if (card.fees.annual > 5000 && audit.netValue < 5000)
      weaknesses.push("High fee relative to rewards");
    const spendReq = card.benefits.lounge_access.domestic.spend_requirement;
    if (spendReq && spendReq > 0 && audit.annualSpend < spendReq) {
      weaknesses.push(`Lounge requires ₹${spendReq.toLocaleString()} spend`);
    }
    if (card.status === "Changing") weaknesses.push("Benefits changing soon");
    if (card.status === "Limited") weaknesses.push("Limited availability");

    comparisons.push({ card, audit, bestFor, weaknesses });
  }

  return comparisons.sort((a, b) => b.audit.netValue - a.audit.netValue);
}

// ============================================================================
// SECTION 13 — ADAPTER FUNCTION (Legacy to Standardized) with SAFE HANDLING
// ============================================================================

export function adaptLegacyToStandard(
  legacyCard: CreditCard,
): StandardizedCreditCard {
  // Find the original standardized card by name
  const original = (rawCards as any[]).find(
    (c: any) => c.card_name === legacyCard.name,
  );

  if (original) {
    // Return the original standardized card
    return original as StandardizedCreditCard;
  }

  // Fallback: build from legacy card (rare case)
  return {
    id: legacyCard.id,
    card_name: legacyCard.name,
    issuer: legacyCard.bank,
    variant: legacyCard.tier,
    network: legacyCard.network,
    card_type: "Credit",
    status: legacyCard.devaluation2026 ? "Changing" : "Active",
    last_updated: new Date().toISOString().split("T")[0],
    fees: {
      joining: legacyCard.joiningFee,
      annual: legacyCard.annualFee,
      renewal_waiver_spend: legacyCard.renewalWaiverLimit || 0,
      is_lifetime_free: legacyCard.lifetimeFree,
      gst_applicable: true,
      joining_benefit: legacyCard.joiningBenefit,
    },
    eligibility: {
      min_income_annual_lakhs: legacyCard.minIncomeLakhs,
      employment_type: ["Salaried", "Self-Employed"],
      age_min: 21,
      age_max: 70,
      credit_score_min: 700,
      invite_only: false,
      relationship_required: [],
    },
    rewards: {
      base: {
        rate_percent: legacyCard.baseRewardRate,
        points_per_rupee:
          legacyCard.baseRewardRate / Math.max(legacyCard.pointValue, 0.01),
        unit: legacyCard.rewardUnit as any,
        redemption_value_rupees: legacyCard.pointValue,
      },
      categories: [
        { name: "Dining", rate_percent: legacyCard.diningRate, multiplier: 1 },
        {
          name: "Grocery",
          rate_percent: legacyCard.groceryRate,
          multiplier: 1,
        },
        {
          name: "Shopping",
          rate_percent: Math.max(
            legacyCard.amazonRate,
            legacyCard.flipkartRate,
          ),
          multiplier: 1,
        },
        {
          name: "Travel",
          rate_percent: Math.max(legacyCard.flightRate, legacyCard.hotelRate),
          multiplier: 1,
        },
        {
          name: "Utilities",
          rate_percent: legacyCard.utilityRate,
          multiplier: 1,
        },
        {
          name: "Fuel",
          rate_percent: legacyCard.fuelRewardRate,
          multiplier: 1,
        },
        { name: "Rent", rate_percent: legacyCard.rentRate, multiplier: 1 },
      ],
      accelerated_rewards: [],
    },
    limits: {
      monthly_reward_cap_rupees:
        parseCapValue(legacyCard.monthlyRewardCap, legacyCard.pointValue)
          .value === Infinity
          ? null
          : parseCapValue(legacyCard.monthlyRewardCap, legacyCard.pointValue)
              .value,
      monthly_reward_cap_points: null,
      accelerated_reward_cap_points: null,
      statement_credit_cap: null,
      redemption_caps: [],
      transaction_limits: { min: 0, max: 0 },
    },
    excluded_categories: {
      categories: [
        "Rent",
        "Fuel",
        "Wallet Load",
        "Cash Advance",
        "EMI",
        "Government",
        "Insurance",
      ],
      mcc_codes: [],
      notes: "From legacy card data",
    },
    benefits: {
      lounge_access: {
        domestic: {
          visits:
            legacyCard.domesticLounge === "Unlimited"
              ? "unlimited"
              : typeof legacyCard.domesticLounge === "number"
                ? legacyCard.domesticLounge
                : 0,
          period: "yearly",
          spend_requirement: undefined,
          guest_allowed: false,
          guest_fee: 0,
        },
        international: {
          visits: legacyCard.internationalLounge,
          period: "yearly",
          spend_requirement: undefined,
          access_type: "Priority Pass",
        },
      },
      milestones: [],
      entertainment: {
        movie_benefit: "Standard",
        value_rupees: 0,
        limit_per_month: 0,
        partner: "",
      },
      travel: {
        forex_markup_percent: legacyCard.forexMarkup,
        zero_forex: legacyCard.forexMarkup === 0,
        travel_insurance: [],
        concierge: false,
      },
      fuel: {
        surcharge_waiver_percent: parseFloat(legacyCard.surchargeWaiver) || 0,
        surcharge_min_transaction: 0,
        surcharge_max_transaction: 0,
        surcharge_max_waiver_monthly: 0,
        reward_rate_percent: legacyCard.fuelRewardRate,
        reward_cap_rupees:
          parseCapValue(legacyCard.fuelCap).value === Infinity
            ? 0
            : parseCapValue(legacyCard.fuelCap).value,
        reward_cap_period: "monthly",
      },
      dining: {},
      other_benefits: [],
    },
    channel_rewards: {
      smartbuy: {
        flights_rate: legacyCard.smartbuyFlightPct,
        hotels_rate: 0,
        vouchers_rate: 0,
      },
      gyftr: { rate: 0 },
      travel_edge: { rate: legacyCard.atlasFlightPct },
      reward_multiplier: { rate: 0, multiplier: 1 },
      direct: { rate: legacyCard.baseRewardRate },
    },
    partners: {
      airlines: Object.entries(legacyCard.airlineTransferJson).map(
        ([name, ratio]) => ({ name, transfer_ratio: ratio }),
      ),
      hotels: Object.entries(legacyCard.hotelTransferJson).map(
        ([name, ratio]) => ({ name, transfer_ratio: ratio }),
      ),
      ecommerce: {
        amazon: legacyCard.amazonRate,
        flipkart: legacyCard.flipkartRate,
        meesho: legacyCard.meeshoRate,
        ajio: legacyCard.ajioRate,
        reliance_digital: legacyCard.relianceRate,
        croma: legacyCard.cromaRate,
      },
      food: {
        swiggy: legacyCard.swiggyRate,
        zomato: legacyCard.zomatoRate,
        bigbasket: 0,
      },
      travel_portals: { cleartrip: 0, mmt: 0, yatra: 0 },
    },
    fee_transactions: {
      rent: { fee_percent: 0, reward_eligible: false },
      utility: {
        fee_percent: 0,
        reward_eligible: true,
        reward_rate: legacyCard.utilityRate,
      },
      insurance: { fee_percent: 0, reward_eligible: false },
      education: { fee_percent: 0, reward_eligible: false },
      wallet_load: { fee_percent: 0, reward_eligible: false },
      government: { fee_percent: 0, reward_eligible: false },
    },
    notes_tnc: legacyCard.notesTnc,
    search_tags: legacyCard.searchTags.split(","),
  };
}

// ============================================================================
// SECTION 14 — EXPORTS
// ============================================================================

// Legacy exports for backward compatibility
export default creditCards;

// Enhanced exports for new features
export const standardizedCards: StandardizedCreditCard[] = creditCards.map(
  adaptLegacyToStandard,
);
