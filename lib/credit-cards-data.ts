import rawCards from "./csvjson (3).json";

/**
 * 2026 PaisaDekho Credit Card Interface
 * Mapping every field from the 2026 CSV Vault
 */
/**
 * 2026 PaisaDekho Credit Card Interface (High-Fidelity)
 * Captures core metrics + platform-specific 2026 accelerators.
 */

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  tier: string;
  network: "Visa" | "Mastercard" | "Amex" | "RuPay" | "Diners";
  tags: string[];
  loungeCap?: number;
  monthlyRewardCap?: string | number;

  // Basic Reward Metrics
  baseRewardRate: number;
  pointValue: number;
  rewardUnit: string;
  travelMultiplier: number;
  renewalWaiverLimit?: number;
  relianceRate: number;
  meeshoRate: number;
  ajioRate: number;
  cromaRate: number;
  groceryRate: number;
  diningRate: number;
  flipkartMethod: string; // Added for completeness
  relianceMethod: string; // Added for completeness
  pointsRedemptionValueTravel: number; // Value in INR (e.g. 1.0 or 0.25)

  // 2026 Specific Yields
  emiratesSuitability: number;
  atlasFlightPct: number;
  sbiCashbackFlightPct: number;
  // Fees & Retention
  joiningFee: number;
  annualFee: number;
  retentionSpendReq: number;
  retentionSpendDisplay: string;
  isLtf: boolean;
  joiningBenefit: string;
  milestoneBenefit: string;
  minIncomeLakhs: number; // Add this!
  lifetimeFree?: boolean;

  // 🚀 LIFESTYLE & PLATFORM ACCELERATORS (New from JSON)
  swiggyRate: number;
  zomatoRate: number;
  amazonRate: number;
  flipkartRate: number;
  hotelRate: number;
  flightRate: number;
  utilityRate: number;
  rentRate: number;

  // Specific Merchant Methods
  amazonMethod: string;
  smartbuyFlightPct: number;
  movieDealType: string;
  movieEffectiveRate: number;

  // Travel & Lounge
  forexMarkup: number;
  forexEffective: string;
  domesticLounge: number | string;
  internationalLounge: number;
  loungeCapDetails: string;
  airIndiaTransferRatio: number;

  // Constraints
  rewardCap: string;
  fuelRewardRate: number;
  fuelCap: string;
  surchargeWaiver: string;

  // Metadata & UI
  searchTags: string;
  notesTnc: string;
  devaluation2026: boolean;
  imageGradient: string;
  multiplierChannel: string;
  instantDiscountEligible: boolean;

  // JSON Objects for Transfers & Exclusions
  airlineTransferJson: Record<string, string>;
  hotelTransferJson: Record<string, string>;
  detailedRewardsJson: Record<string, string>;
}
export interface SpendProfile {
  food: number;
  shopping: number;
  travel: number;
  utilities: number;
  fuel: number;
  rent: number;
  other: number;
}

const userSpend: SpendProfile = {
  food: 60000,
  shopping: 80000,
  travel: 100000,
  utilities: 30000,
  fuel: 40000,
  rent: 120000,
  other: 70000,
};

/**
 * Data Transformation & Mapping
 * Cleans raw CSV strings into usable logic numbers
 */
/**
 * THE REWARD ENGINE FIX
 * In the 2026 standardized set, 'rate' is already the FINAL CASH YIELD.
 * We no longer multiply by card.pointValue.
 */
function calculateCategoryReward(
  card: CreditCard,
  spend: number,
  rate: number,
) {
  // 1. If the rate is 0, it means the category is excluded (e.g. Rent)
  if (rate === 0) return 0;

  // 2. Simple Math: Spend * (Effective Yield % / 100)
  // Example: 10,000 * (0.75 / 100) = ₹75
  return spend * (rate / 100);
}
function bestCardForCategory(
  cards: CreditCard[],
  spend: number,
  rateSelector: (card: CreditCard) => number,
) {
  let bestCard: CreditCard | null = null;
  let bestValue = 0;

  for (const card of cards) {
    const rate = rateSelector(card);

    const reward = calculateCategoryReward(card, spend, rate);

    if (reward > bestValue) {
      bestValue = reward;
      bestCard = card;
    }
  }

  return {
    card: bestCard,
    reward: bestValue,
  };
}

export function optimizeCards(cards: CreditCard[], spend: SpendProfile) {
  const food = bestCardForCategory(cards, spend.food, (c) =>
    Math.max(c.swiggyRate, c.zomatoRate, c.baseRewardRate),
  );

  const shopping = bestCardForCategory(cards, spend.shopping, (c) =>
    Math.max(c.amazonRate, c.flipkartRate, c.baseRewardRate),
  );

  const travel = bestCardForCategory(cards, spend.travel, (c) =>
    Math.max(c.flightRate, c.travelMultiplier * c.baseRewardRate),
  );

  const utilities = bestCardForCategory(cards, spend.utilities, (c) =>
    Math.max(c.utilityRate, c.baseRewardRate),
  );

  const fuel = bestCardForCategory(cards, spend.fuel, (c) =>
    Math.max(c.fuelRewardRate, c.baseRewardRate),
  );

  const rent = bestCardForCategory(cards, spend.rent, (c) =>
    Math.max(c.rentRate, c.baseRewardRate),
  );

  const other = bestCardForCategory(
    cards,
    spend.other,
    (c) => c.baseRewardRate,
  );

  const total =
    food.reward +
    shopping.reward +
    travel.reward +
    utilities.reward +
    fuel.reward +
    rent.reward +
    other.reward;

  return {
    breakdown: {
      food,
      shopping,
      travel,
      utilities,
      fuel,
      rent,
      other,
    },
    totalReward: total,
  };
}
function generateTags(c: any): string[] {
  const tags: string[] = [];

  const annualFee = parseFloat(String(c.annual_fee || "0")) || 0;
  const tier = (c.card_tier || "").toLowerCase();
  const isLtf = String(c.is_ltf).toLowerCase() === "true";
  const searchTags = (c.search_tags || "").toLowerCase();

  // Lifetime Free
  if (isLtf || annualFee === 0) {
    tags.push("Lifetime Free");
  }

  // Entry Cards
  if (annualFee > 0 && annualFee <= 1000) {
    tags.push("Entry");
  }

  // Premium
  if (annualFee > 1000 && annualFee < 10000) {
    tags.push("Premium");
  }

  // Super Premium
  if (annualFee >= 10000 || tier === "ultra" || tier === "luxury") {
    tags.push("Super Premium");
  }

  // Travel
  if (searchTags.includes("travel") || searchTags.includes("miles")) {
    tags.push("Travel");
  }

  // Cashback
  if (searchTags.includes("cashback")) {
    tags.push("Cashback");
  }

  // Lounge
  if (
    c.domestic_lounge === "Unlimited" ||
    parseInt(c.domestic_lounge) > 0 ||
    c.international_lounge === "Unlimited"
  ) {
    tags.push("Lounge");
  }

  return [...new Set(tags)];
}
// Replace your existing creditCards mapping with this:
export const creditCards: CreditCard[] = (rawCards as any[]).map((c, index) => {
  const cardTags = generateTags(c);

  const cleanNumber = (val: any) => {
    if (typeof val === "number") return isNaN(val) ? 0 : val; // Handle existing NaN
    if (
      val === undefined ||
      val === null ||
      ["None", "Excluded", "N/A", "No"].includes(val)
    )
      return 0;
    const parsed = parseFloat(String(val).replace(/[^0-9.]/g, ""));
    return isNaN(parsed) ? 0 : parsed; // Final safety check
  };

  /**
   * Safely parses Lakhs or Raw Numbers
   * Handles 1000000 (number) or "10L" (string) or null
   */
  const parseLakhs = (val: any) => {
    const str = String(val || "").toLowerCase(); // Safe string conversion
    if (!str || str.includes("none") || str === "0") return 0;

    const match = str.match(/(\d+(\.\d+)?)\s*l/i);
    if (match) return parseFloat(match[1]) * 100000;

    const raw = cleanNumber(val);
    // If input was "10" but meant "10 Lakhs", multiply.
    // If it was already "1000000", leave it.
    return raw > 0 && raw < 100 ? raw * 100000 : raw;
  };

  const bankGradients: Record<string, string> = {
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
  const detectNetwork = (name: string) => {
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
    tier: c.card_tier || "Premium",
    network: detectNetwork(c.card_name),
    tags: cardTags.length ? cardTags : ["Standard"],

    // Core Rewards
    baseRewardRate: cleanNumber(c.base_reward_rate) || 0,
    pointValue: cleanNumber(c.point_value) || 1,
    rewardUnit: c.reward_unit || "Points",
    travelMultiplier: cleanNumber(c.travel_multiplier),
    flipkartMethod: c.flipkart_method || "Direct",
    relianceMethod: c.reliance_method || "Direct",

    emiratesSuitability: cleanNumber(c.emirates_suitability),
    atlasFlightPct: cleanNumber(c.atlas_flight_pct),
    sbiCashbackFlightPct: cleanNumber(c.sbi_cashback_flight_pct),
    // 🚀 NEW: Platform Accelerators (The "Infinia" special)
    swiggyRate: cleanNumber(c.swiggy_rate) || 0,
    zomatoRate: cleanNumber(c.zomato_rate) || 0,
    amazonRate: cleanNumber(c.amazon_benefit_pct) || 0,
    flipkartRate: cleanNumber(c.flipkart_benefit_pct) || 0,
    hotelRate: cleanNumber(c.hotel_rate) || 0,
    flightRate: cleanNumber(c.flight_rate) || 0,
    utilityRate: cleanNumber(c.utility_rate) || 0,
    renewalWaiverLimit: parseLakhs(c.retention_spend_req), // <-- add this
    relianceRate: cleanNumber(c.reliance_digital_benefit_pct),
    meeshoRate: cleanNumber(c.meesho_benefit_pct),
    ajioRate: cleanNumber(c.ajio_benefit_pct) || 0, // Fallback to 0 if missing
    cromaRate: cleanNumber(c.croma_benefit_pct),
    groceryRate: cleanNumber(c.grocery_rate),
    diningRate: cleanNumber(c.dining_rate),
    minIncomeLakhs: cleanNumber(c.min_income_annual_lakhs) || 0,

    // Airline Transfer String Parsing
    airlineTransferJson:
      typeof c.airline_transfer_json === "string"
        ? JSON.parse(c.airline_transfer_json)
        : c.airline_transfer_json || {},

    pointsRedemptionValueTravel: cleanNumber(c.points_redemption_value_travel),

    // Fees & Joining
    joiningFee: cleanNumber(c.joining_fee),
    annualFee: cleanNumber(c.annual_fee),
    joiningBenefit: c.joining_benefit || "N/A",
    retentionSpendReq: parseLakhs(c.retention_spend_req),
    retentionSpendDisplay: c.retention_spend_req || "No Waiver",
    isLtf: String(c.is_ltf).toLowerCase() === "true",

    // Travel & Lounge
    forexMarkup: cleanNumber(c.forex_markup),
    forexEffective: c.forex_effective || "N/A",
    domesticLounge: c.domestic_lounge || "0",
    internationalLounge: cleanNumber(c.international_lounge),
    loungeCapDetails: c.lounge_cap_details || "Standard T&C",
    airIndiaTransferRatio: cleanNumber(c.air_india_transfer_ratio),

    // Constraints & Perks
    rewardCap: c.monthly_reward_cap || "No Cap",
    milestoneBenefit: c.milestone_benefit || "None",
    fuelRewardRate: cleanNumber(c.fuel_reward_rate),
    fuelCap: c.fuel_cap || "0",
    surchargeWaiver: c.surcharge_waiver || "0%",
    multiplierChannel: c.multiplier_channel || "Direct Spends",

    // Metadata
    searchTags: c.search_tags || "",
    notesTnc: c.notes_tnc || "",
    devaluation2026:
      c.notes_tnc?.toLowerCase().includes("devaluation") || false,
    imageGradient: bankGradients[c.issuer] || "from-zinc-800 to-zinc-950",

    // JSON Data
    hotelTransferJson: c.hotel_transfer_json || {},
    detailedRewardsJson: c.detailed_rewards_json || {},
    rentRate: cleanNumber(c.rent_rate),

    amazonMethod: c.amazon_method || "Direct",

    smartbuyFlightPct: cleanNumber(c.smartbuy_flight_pct),

    movieDealType: c.movie_deal_type || "None",

    movieEffectiveRate: cleanNumber(c.movie_effective_rate),

    instantDiscountEligible:
      String(c.instant_discount_eligible).toLowerCase() === "true",
  };
});

/**
 * THE BUTLER ENGINE: Final Calculation Breakdown
 * Monetizes perks and audits net value for 2026
 */
export interface CardAudit {
  netValue: number;
  yield: number;
  feeWaived: boolean;

  grossRewards: number;
  convenienceSavings: number;
  outflow: number;

  effectiveRewardRate: number;
  breakEvenSpend: number;
  loungeValue: number;
  forexSavings: number;
  rewardCapApplied: number;
  joiningRecoveryMonths: number;
  stabilityScore: number;
  travelValue: number;

  breakdown: {
    label: string;
    value: number;
    plus: boolean;
  }[];
}
function calculateEffectiveRewardRate(rewards: number, spend: number) {
  if (!spend) return 0;
  return Number(((rewards / spend) * 100).toFixed(2));
}

function calculateBreakEvenSpend(annualFee: number, rewardRate: number) {
  if (rewardRate === 0) return Infinity;
  return annualFee / (rewardRate / 100);
}

function calculateLoungeValue(card: CreditCard, monthlyVisits: number) {
  const visits =
    card.domesticLounge === "Unlimited"
      ? 12
      : parseInt(String(card.domesticLounge)) || 0;

  const usedVisits = Math.min(visits, monthlyVisits * 12);

  return usedVisits * 800;
}

function calculateForexSavings(annualSpend: number, markup: number) {
  const internationalSpend = annualSpend * 0.2;
  const bankForex = 3.5;

  const savings = internationalSpend * ((bankForex - markup) / 100);

  return Math.max(0, savings);
}

// FIX: Robust Cap Parser to handle 2026 string variations
function applyRewardCap(rewards: number, cap: any) {
  const capStr = String(cap || "").toLowerCase();

  // If No Cap, return original rewards
  if (
    !capStr ||
    capStr.includes("no cap") ||
    capStr.includes("unlimited") ||
    capStr.includes("standard")
  ) {
    return rewards;
  }

  // Handle "15k", "2L" style formatting from the CSV
  let multiplier = 1;
  if (capStr.includes("k")) multiplier = 1000;
  if (capStr.includes("l")) multiplier = 100000;

  const numericValue = parseFloat(capStr.replace(/[^0-9.]/g, ""));

  // Safety check: if parsing fails, assume no cap to prevent "22" fallback
  if (isNaN(numericValue) || numericValue === 0) return rewards;

  const absoluteCap = numericValue * multiplier;

  // Annualize if it's a monthly cap (common in 2026 dataset)
  if (
    capStr.includes("month") ||
    capStr.includes("cycle") ||
    capStr.includes("mth")
  ) {
    return Math.min(rewards, absoluteCap * 12);
  }

  return Math.min(rewards, absoluteCap);
}

/**
 * THE REWARD ENGINE (2026 AUDIT)
 * Handles logic where Card A has a cap on Dining, but Card B is unlimited.
 */
export function calculateInDepthSavings(
  card: CreditCard,
  spend: SpendProfile,
  monthlyLoungeVisits: number = 0.5,
): CardAudit {
  // Helper to apply category-specific T&C logic
  const getCategoryReward = (
    amount: number,
    rate: number,
    categoryName: string,
  ) => {
    let rawReward = (amount * 12 * rate) / 100;

    // Apply T&C: Many 2026 cards cap 'Utility' or 'Rent' specifically
    const rules = card.detailedRewardsJson;
    if (rules && rules[categoryName] === "Capped") {
      // Example: 2026 HDFC/SBI rules often cap utility at ₹500/mo
      rawReward = Math.min(rawReward, 500 * 12);
    }

    // Apply T&C: Point Value Multiplier
    // Note: If your CSV is already standardized, this should be 1.
    return rawReward * (card.pointValue || 1);
  };

  // 1. Calculate Platform-Specific Rewards with T&C awareness
  const foodRewards = getCategoryReward(
    spend.food,
    Math.max(card.swiggyRate, card.zomatoRate, card.baseRewardRate),
    "Food",
  );
  const shopRewards = getCategoryReward(
    spend.shopping,
    Math.max(card.amazonRate, card.flipkartRate, card.baseRewardRate),
    "Shopping",
  );
  const travelRewards = getCategoryReward(
    spend.travel,
    Math.max(card.flightRate, card.hotelRate, card.baseRewardRate),
    "Travel",
  );
  const utilityRewards = getCategoryReward(
    spend.utilities,
    card.utilityRate,
    "Utility",
  );
  const otherRewards = (spend.other * 12 * card.baseRewardRate) / 100;

  const totalSpendAnnual =
    (spend.food +
      spend.shopping +
      spend.travel +
      spend.utilities +
      spend.fuel +
      spend.rent +
      spend.other) *
    12;

  // 2. Global T&C: Apply the Monthly Reward Cap (e.g., SBI Cashback ₹5,000 cap)
  const grossRewardValue =
    foodRewards + shopRewards + travelRewards + utilityRewards + otherRewards;
  const cappedRewards = applyRewardCap(grossRewardValue, card.rewardCap);

  // 3. Outflow T&C: Check for Fee Waiver (Retention)
  const isFeeWaived =
    card.retentionSpendReq > 0 && totalSpendAnnual >= card.retentionSpendReq;
  const totalOutflow = isFeeWaived ? 0 : card.annualFee * 1.18; // 18% GST

  // 4. Perks: Lounge & Forex
  const loungeValue = calculateLoungeValue(card, monthlyLoungeVisits);
  const forexSavings = calculateForexSavings(
    totalSpendAnnual,
    card.forexMarkup,
  );

  const netValue = cappedRewards + loungeValue + forexSavings - totalOutflow;

  return {
    netValue: Math.round(netValue),
    yield: Number(((netValue / (totalSpendAnnual || 1)) * 100).toFixed(2)),
    feeWaived: isFeeWaived,
    grossRewards: Math.round(cappedRewards),
    convenienceSavings: loungeValue,
    outflow: totalOutflow,
    effectiveRewardRate: calculateEffectiveRewardRate(
      cappedRewards,
      totalSpendAnnual,
    ),
    breakEvenSpend: calculateBreakEvenSpend(
      card.annualFee,
      (cappedRewards / totalSpendAnnual) * 100,
    ),
    loungeValue,
    forexSavings,
    rewardCapApplied: cappedRewards,
    joiningRecoveryMonths: calculateRecoveryMonths(
      card.joiningFee,
      cappedRewards,
    ),
    stabilityScore: calculateStabilityScore(card),
    travelValue: loungeValue + forexSavings,
    breakdown: [
      {
        label: "Platform Rewards",
        value: Math.round(cappedRewards),
        plus: true,
      },
      {
        label: "Travel & Perks",
        value: loungeValue + forexSavings,
        plus: true,
      },
      { label: "Fees (incl. GST)", value: totalOutflow, plus: false },
    ],
  };
}

function calculateRecoveryMonths(joiningFee: number, annualRewards: number) {
  const monthly = annualRewards / 12;
  if (!monthly) return Infinity;

  return Number((joiningFee / monthly).toFixed(1));
}

function calculateStabilityScore(card: CreditCard) {
  let score = 100;

  if (card.rewardCap !== "No Cap") score -= 10;
  if (card.forexMarkup > 3) score -= 10;
  if (card.devaluation2026) score -= 20;
  if (card.annualFee > 15000) score -= 5;

  return Math.max(0, score);
}

export function scoreCard(
  card: CreditCard,
  spend: SpendProfile,
  category: string,
) {
  const audit = calculateInDepthSavings(card, spend);
  let score = 0;

  // 1. ECONOMIC YIELD (40% Weight)
  // Rewards are king. We score based on the actual Net Value generated.
  score += Math.max(0, audit.netValue / 100) * 0.4;

  // 2. ENTRY BARRIER (15% Weight)
  // Lower fees or LTF status are better for general users.
  const feeScore = card.isLtf ? 15 : Math.max(0, 15 - card.annualFee / 1000);
  score += feeScore;

  // 3. PRECISION CATEGORY MATCHING (High Intent)
  const cat = category.toLowerCase();

  // A. Platform Specific Boosts (Direct Platform Rates)
  if (
    cat.includes("swiggy") ||
    cat.includes("zomato") ||
    cat.includes("food")
  ) {
    const bestFoodRate = Math.max(card.swiggyRate, card.zomatoRate);
    if (bestFoodRate >= 10)
      score += 30; // Direct Platform Accelerator
    else if (bestFoodRate >= 5) score += 15;
  }

  if (
    cat.includes("amazon") ||
    cat.includes("flipkart") ||
    cat.includes("shopping")
  ) {
    const bestShopRate = Math.max(card.amazonRate, card.flipkartRate);
    if (bestShopRate >= 10) score += 30;
    else if (bestShopRate >= 5) score += 15;
  }

  if (cat.includes("travel") || cat.includes("flight")) {
    if (card.flightRate > 10 || card.travelMultiplier > 3) score += 30;
    if (card.tags.includes("Travel")) score += 10;
  }

  // B. Generic Tag Matching
  const tags = card.searchTags.toLowerCase();
  if (tags.includes(cat)) score += 10;

  // 4. LIFESTYLE PERKS (2026 Audit)
  // Lounge
  const lounge =
    card.domesticLounge === "Unlimited"
      ? 999
      : parseInt(String(card.domesticLounge)) || 0;
  if (lounge >= 8) score += 10;
  else if (lounge >= 4) score += 5;

  // Forex (Critical for international travelers)
  if (card.forexMarkup <= 1)
    score += 10; // Zero or Low Forex
  else if (card.forexMarkup < 2) score += 5;

  // 5. DEVALUATION PENALTY
  // If a card is flagged for 2026 devaluations, reduce its "Safe" score
  if (card.devaluation2026) {
    score -= 15;
  }

  return {
    card,
    audit,
    score: Number(score.toFixed(2)),
  };
}

// Add 'availableCards' as an optional 3rd parameter
export function rankCards(
  spend: SpendProfile,
  category: string,
  availableCards?: CreditCard[],
) {
  // Use the passed eligible cards, or fallback to the full list if none provided
  const listToRank = availableCards || creditCards;

  const scoredCards = listToRank.map((card) =>
    scoreCard(card, spend, category),
  );

  return scoredCards.sort((a, b) => b.score - a.score);
}
