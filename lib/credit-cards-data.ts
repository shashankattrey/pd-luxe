import rawCards from "./csvjson (3).json";

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  tier: string;
  network: "Visa" | "Mastercard" | "Amex" | "RuPay" | "Diners";
  tags: string[];
  loungeCap?: number;
  monthlyRewardCap?: string | number;

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
  flipkartMethod: string;
  relianceMethod: string;
  pointsRedemptionValueTravel: number;

  emiratesSuitability: number;
  atlasFlightPct: number;
  sbiCashbackFlightPct: number;

  joiningFee: number;
  annualFee: number;
  retentionSpendReq: number;
  retentionSpendDisplay: string;
  isLtf: boolean;
  joiningBenefit: string;
  milestoneBenefit: string;
  minIncomeLakhs: number;
  lifetimeFree?: boolean;

  swiggyRate: number;
  zomatoRate: number;
  amazonRate: number;
  flipkartRate: number;
  hotelRate: number;
  flightRate: number;
  utilityRate: number;
  rentRate: number;

  amazonMethod: string;
  smartbuyFlightPct: number;
  movieDealType: string;
  movieEffectiveRate: number;

  forexMarkup: number;
  forexEffective: string;
  domesticLounge: number | string;
  internationalLounge: number;
  loungeCapDetails: string;
  airIndiaTransferRatio: number;

  rewardCap: string;
  fuelRewardRate: number;
  fuelCap: string;
  surchargeWaiver: string;

  searchTags: string;
  notesTnc: string;
  devaluation2026: boolean;
  imageGradient: string;
  multiplierChannel: string;
  instantDiscountEligible: boolean;

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

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const cleanNumber = (val: any): number => {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (
    val === undefined ||
    val === null ||
    ["None", "Excluded", "N/A", "No"].includes(val)
  )
    return 0;
  const parsed = parseFloat(String(val).replace(/[^0-9.]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
};

const parseLakhs = (val: any): number => {
  const str = String(val || "").toLowerCase();
  if (!str || str.includes("none") || str === "0") return 0;
  const match = str.match(/(\d+(\.\d+)?)\s*l/i);
  if (match) return parseFloat(match[1]) * 100000;
  const raw = cleanNumber(val);
  return raw > 0 && raw < 100 ? raw * 100000 : raw;
};

// FIX: JSON fields in the dataset arrive as strings — parse them safely
const parseJsonField = (val: any): Record<string, string> => {
  if (!val) return {};
  if (typeof val === "object") return val as Record<string, string>;
  try {
    return JSON.parse(val) as Record<string, string>;
  } catch {
    return {};
  }
};

// FIX: devaluation check — scan notes_tnc for the actual keywords present
const isDevalued = (c: any): boolean => {
  const notes = (c.notes_tnc || "").toLowerCase();
  return notes.includes("devaluation") || notes.includes("devalued");
};

function generateTags(c: any): string[] {
  const tags: string[] = [];
  const annualFee = cleanNumber(c.annual_fee);
  const tier = (c.card_tier || "").toLowerCase();
  const isLtf = String(c.is_ltf).toLowerCase() === "true";
  const searchTags = (c.search_tags || "").toLowerCase();

  if (isLtf || annualFee === 0) tags.push("Lifetime Free");
  if (annualFee > 0 && annualFee <= 1000) tags.push("Entry");
  if (annualFee > 1000 && annualFee < 10000) tags.push("Premium");
  if (annualFee >= 10000 || tier === "ultra" || tier === "luxury")
    tags.push("Super Premium");
  if (searchTags.includes("travel") || searchTags.includes("miles"))
    tags.push("Travel");
  if (searchTags.includes("cashback")) tags.push("Cashback");
  // FIX: domestic_lounge can be "Unlimited" string — must not parseInt("Unlimited")
  const dl = c.domestic_lounge;
  const dlNum = dl === "Unlimited" ? Infinity : parseInt(String(dl)) || 0;
  if (dlNum > 0 || cleanNumber(c.international_lounge) > 0) tags.push("Lounge");
  return [...new Set(tags)];
}

// FIX: expanded bank gradient map to cover all 93 cards in the dataset
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
  YES: "from-emerald-900 via-teal-900 to-emerald-950",
  RBL: "from-rose-800 via-pink-900 to-rose-950",
  HSBC: "from-red-900 via-slate-800 to-red-950",
  Federal: "from-blue-800 via-cyan-900 to-blue-950",
  SBM: "from-gray-800 via-zinc-700 to-gray-900",
  "Standard Chartered": "from-teal-800 via-slate-900 to-teal-950",
  SCB: "from-teal-800 via-slate-900 to-teal-950",
  BOB: "from-orange-800 via-amber-900 to-orange-950",
  Canara: "from-indigo-800 via-blue-900 to-indigo-950",
  PNB: "from-orange-700 via-red-800 to-orange-900",
  Union: "from-yellow-800 via-amber-900 to-yellow-950",
};

const detectNetwork = (name: string): CreditCard["network"] => {
  const n = name.toLowerCase();
  if (n.includes("amex") || n.includes("american express")) return "Amex";
  if (n.includes("mastercard")) return "Mastercard";
  if (n.includes("rupay")) return "RuPay";
  if (n.includes("diners")) return "Diners";
  return "Visa";
};

// ─── CARD LIST ────────────────────────────────────────────────────────────────

export const creditCards: CreditCard[] = (rawCards as any[]).map((c, index) => {
  const cardTags = generateTags(c);

  return {
    id: String(index + 1),
    name: c.card_name,
    bank: c.issuer,
    tier: c.card_tier || "Premium",
    network: detectNetwork(c.card_name),
    tags: cardTags.length ? cardTags : ["Standard"],

    baseRewardRate: cleanNumber(c.base_reward_rate),
    pointValue: cleanNumber(c.point_value) || 1,
    rewardUnit: c.reward_unit || "Points",
    travelMultiplier: cleanNumber(c.travel_multiplier),
    flipkartMethod: c.flipkart_method || "Direct",
    // FIX: was reading from wrong field (c.reliance_method which doesn't exist)
    relianceMethod: c.reliance_digital_method || "Direct",

    emiratesSuitability: cleanNumber(c.emirates_suitability),
    atlasFlightPct: cleanNumber(c.atlas_flight_pct),
    sbiCashbackFlightPct: cleanNumber(c.sbi_cashback_flight_pct),

    swiggyRate: cleanNumber(c.swiggy_rate),
    zomatoRate: cleanNumber(c.zomato_rate),
    amazonRate: cleanNumber(c.amazon_benefit_pct),
    flipkartRate: cleanNumber(c.flipkart_benefit_pct),
    hotelRate: cleanNumber(c.hotel_rate),
    flightRate: cleanNumber(c.flight_rate),
    utilityRate: cleanNumber(c.utility_rate),
    rentRate: cleanNumber(c.rent_rate),

    renewalWaiverLimit: parseLakhs(c.retention_spend_req),
    relianceRate: cleanNumber(c.reliance_digital_benefit_pct),
    meeshoRate: cleanNumber(c.meesho_benefit_pct),
    ajioRate: cleanNumber(c.ajio_benefit_pct),
    cromaRate: cleanNumber(c.croma_benefit_pct),
    groceryRate: cleanNumber(c.grocery_rate),
    // FIX: use dining_rate (base card rate), not dining_rate_eff (portal-boosted rate)
    // dining_rate_eff bakes in SmartBuy/portal multipliers and would double-count
    diningRate: cleanNumber(c.dining_rate),
    minIncomeLakhs: cleanNumber(c.min_income_annual_lakhs),

    // FIX: parseJsonField instead of JSON.parse — handles already-parsed objects
    airlineTransferJson: parseJsonField(c.airline_transfer_json),
    hotelTransferJson: parseJsonField(c.hotel_transfer_json),
    detailedRewardsJson: parseJsonField(c.detailed_rewards_json),

    pointsRedemptionValueTravel: cleanNumber(c.points_redemption_value_travel),

    joiningFee: cleanNumber(c.joining_fee),
    annualFee: cleanNumber(c.annual_fee),
    joiningBenefit: c.joining_benefit || "N/A",
    retentionSpendReq: parseLakhs(c.retention_spend_req),
    retentionSpendDisplay: c.retention_spend_req || "No Waiver",
    isLtf: String(c.is_ltf).toLowerCase() === "true",

    forexMarkup: cleanNumber(c.forex_markup),
    forexEffective: c.forex_effective || "N/A",
    domesticLounge: c.domestic_lounge || "0",
    internationalLounge: cleanNumber(c.international_lounge),
    loungeCapDetails: c.lounge_cap_details || "Standard T&C",
    airIndiaTransferRatio: cleanNumber(c.air_india_transfer_ratio),

    rewardCap: c.monthly_reward_cap || "No Cap",
    milestoneBenefit: c.milestone_benefit || "None",
    fuelRewardRate: cleanNumber(c.fuel_reward_rate),
    fuelCap: c.fuel_cap || "0",
    surchargeWaiver: c.surcharge_waiver || "0%",
    multiplierChannel: c.multiplier_channel || "Direct Spends",

    searchTags: c.search_tags || "",
    notesTnc: c.notes_tnc || "",
    devaluation2026: isDevalued(c),
    imageGradient: bankGradients[c.issuer] || "from-zinc-800 to-zinc-950",

    amazonMethod: c.amazon_method || "Direct",
    smartbuyFlightPct: cleanNumber(c.smartbuy_flight_pct),
    movieDealType: c.movie_deal_type || "None",
    movieEffectiveRate: cleanNumber(c.movie_effective_rate),
    instantDiscountEligible:
      String(c.instant_discount_eligible).toLowerCase() === "true",
  };
});

// ─── OPTIMISE HELPER ─────────────────────────────────────────────────────────

function calculateCategoryReward(
  card: CreditCard,
  spend: number,
  rate: number,
): number {
  if (rate === 0) return 0;
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
  return { card: bestCard, reward: bestValue };
}

export function optimizeCards(cards: CreditCard[], spend: SpendProfile) {
  const food = bestCardForCategory(cards, spend.food, (c) =>
    // FIX: include diningRate
    Math.max(c.swiggyRate, c.zomatoRate, c.diningRate, c.baseRewardRate),
  );
  const shopping = bestCardForCategory(cards, spend.shopping, (c) =>
    // FIX: include groceryRate
    Math.max(c.amazonRate, c.flipkartRate, c.groceryRate, c.baseRewardRate),
  );
  const travel = bestCardForCategory(cards, spend.travel, (c) =>
    Math.max(c.flightRate, c.hotelRate, c.travelMultiplier * c.baseRewardRate),
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
    breakdown: { food, shopping, travel, utilities, fuel, rent, other },
    totalReward: total,
  };
}

// ─── AUDIT ────────────────────────────────────────────────────────────────────

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
  breakdown: { label: string; value: number; plus: boolean }[];
}

function calculateEffectiveRewardRate(rewards: number, spend: number): number {
  if (!spend) return 0;
  return Number(((rewards / spend) * 100).toFixed(2));
}

function calculateBreakEvenSpend(
  annualFee: number,
  rewardRate: number,
): number {
  if (rewardRate === 0) return Infinity;
  return annualFee / (rewardRate / 100);
}

function calculateLoungeValue(
  card: CreditCard,
  monthlyVisits: number,
  monthlyTravelSpend: number = 0,
): number {
  const capacity =
    card.domesticLounge === "Unlimited"
      ? 999
      : parseInt(String(card.domesticLounge)) || 0;
  if (capacity === 0) return 0;

  // FIX: lounge visits must scale with actual travel spend.
  // A fixed 0.5 visits/month regardless of travel spend caused cards with
  // unlimited lounge (Scapia, IndusInd Tiger, etc.) to dominate rankings
  // for users spending ₹20/month on travel who clearly never use airport lounges.
  //
  // Formula: effectiveVisits = min(parameterVisits, travelSpend / ₹3,000)
  //   ₹3,000/month travel ≈ one domestic flight = one lounge visit.
  //   Below ₹3,000/month travel the fraction scales linearly toward zero.
  const travelBasedVisits = monthlyTravelSpend / 3000;
  const effectiveMonthlyVisits = Math.min(monthlyVisits, travelBasedVisits);
  const annualVisits = Math.min(capacity, effectiveMonthlyVisits * 12);

  return Math.round(annualVisits * 800);
}

function calculateForexSavings(annualSpend: number, markup: number): number {
  const internationalSpend = annualSpend * 0.2;
  const bankForex = 3.5;
  return Math.max(0, internationalSpend * ((bankForex - markup) / 100));
}

function applyRewardCap(rewards: number, cap: any): number {
  const capStr = String(cap || "").toLowerCase();

  if (
    !capStr ||
    capStr.includes("no cap") ||
    capStr.includes("unlimited") ||
    capStr.includes("standard") ||
    capStr.includes("see category")
  ) {
    return rewards;
  }

  const hasK = capStr.includes("k");
  const hasL = capStr.includes("l");
  const multiplier = hasL ? 100000 : hasK ? 1000 : 1;

  const numericValue = parseFloat(capStr.replace(/[^0-9.]/g, ""));
  if (isNaN(numericValue) || numericValue === 0) return rewards;

  const absoluteCap = numericValue * multiplier;

  if (
    capStr.includes("month") ||
    capStr.includes("cycle") ||
    capStr.includes("mth")
  ) {
    return Math.min(rewards, absoluteCap * 12);
  }

  // Bare small numbers (e.g. "300", "1k") are monthly caps in this dataset
  if (!hasK && !hasL && absoluteCap <= 10000) {
    return Math.min(rewards, absoluteCap * 12);
  }

  return Math.min(rewards, absoluteCap);
}

export function calculateInDepthSavings(
  card: CreditCard,
  spend: SpendProfile,
  monthlyLoungeVisits: number = 0.5,
): CardAudit {
  const getCategoryReward = (
    amount: number,
    rate: number,
    categoryName: string,
  ) => {
    let rawReward = (amount * 12 * rate) / 100;
    const rules = card.detailedRewardsJson;
    if (rules && rules[categoryName] === "Capped")
      rawReward = Math.min(rawReward, 500 * 12);
    return rawReward * (card.pointValue || 1);
  };

  // FIX: diningRate added to food max — dining-specialist cards were under-scoring
  const foodRewards = getCategoryReward(
    spend.food,
    Math.max(
      card.swiggyRate,
      card.zomatoRate,
      card.diningRate,
      card.baseRewardRate,
    ),
    "Food",
  );
  // FIX: groceryRate added to shopping max — grocery cards were under-scoring
  const shopRewards = getCategoryReward(
    spend.shopping,
    Math.max(
      card.amazonRate,
      card.flipkartRate,
      card.groceryRate,
      card.baseRewardRate,
    ),
    "Shopping",
  );
  const travelRewards = getCategoryReward(
    spend.travel,
    Math.max(card.flightRate, card.hotelRate, card.baseRewardRate),
    "Travel",
  );
  // FIX: fall back to baseRewardRate when utilityRate is 0
  const utilityRewards = getCategoryReward(
    spend.utilities,
    Math.max(card.utilityRate, card.baseRewardRate),
    "Utility",
  );
  // FIX: fuel rewards were completely missing — added
  const fuelRewards = getCategoryReward(
    spend.fuel,
    Math.max(card.fuelRewardRate, card.baseRewardRate),
    "Fuel",
  );
  // FIX: rent rewards were completely missing — added
  const rentRewards = getCategoryReward(
    spend.rent,
    Math.max(card.rentRate, card.baseRewardRate),
    "Rent",
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

  const grossRewardValue =
    foodRewards +
    shopRewards +
    travelRewards +
    utilityRewards +
    fuelRewards +
    rentRewards +
    otherRewards;

  const cappedRewards = applyRewardCap(grossRewardValue, card.rewardCap);

  const isFeeWaived =
    card.retentionSpendReq > 0 && totalSpendAnnual >= card.retentionSpendReq;
  const totalOutflow = isFeeWaived ? 0 : card.annualFee * 1.18;

  const loungeValue = calculateLoungeValue(
    card,
    monthlyLoungeVisits,
    spend.travel,
  );
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
      // FIX: guard against divide-by-zero when totalSpendAnnual is 0
      totalSpendAnnual > 0 ? (cappedRewards / totalSpendAnnual) * 100 : 0,
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

function calculateRecoveryMonths(
  joiningFee: number,
  annualRewards: number,
): number {
  const monthly = annualRewards / 12;
  if (!monthly) return Infinity;
  return Number((joiningFee / monthly).toFixed(1));
}

function calculateStabilityScore(card: CreditCard): number {
  let score = 100;
  if (card.rewardCap !== "No Cap") score -= 10;
  if (card.forexMarkup > 3) score -= 10;
  if (card.devaluation2026) score -= 20;
  if (card.annualFee > 15000) score -= 5;
  return Math.max(0, score);
}

// ─── SCORECARD v3 ─────────────────────────────────────────────────────────────

export function scoreCard(
  card: CreditCard,
  spend: SpendProfile,
  category: string,
) {
  const audit = calculateInDepthSavings(card, spend);

  const totalAnnualSpend =
    (spend.food +
      spend.shopping +
      spend.travel +
      spend.utilities +
      spend.fuel +
      spend.rent +
      spend.other) *
    12;

  // Hard veto: card costs more than it earns
  if (audit.netValue < 0) {
    return { card, audit, score: 0 };
  }

  let score = 0;

  // 1. Primary: Net rupee value
  const netValueScore = Math.sqrt(Math.max(0, audit.netValue)) * 1.5;
  score += netValueScore;

  // 2. Yield efficiency bonus
  const yieldBonus = Math.max(0, audit.effectiveRewardRate) * 4;
  score += yieldBonus;

  // 3. Fee cost penalty / LTF bonus
  if (card.isLtf || card.annualFee === 0) {
    score += 5;
  } else {
    const feeRatio =
      totalAnnualSpend > 0 ? card.annualFee / totalAnnualSpend : 1;
    if (feeRatio <= 0.005) score += 3;
    else if (feeRatio <= 0.01) score += 1;
    else if (feeRatio <= 0.02) score -= 2;
    else if (feeRatio <= 0.05) score -= 5;
    else score -= 12;
  }

  // 4. Category rate bonus
  const cat = category.toLowerCase();
  const annualFood = spend.food;
  const annualShopping = spend.shopping;
  const annualTravel = spend.travel;
  const annualFuel = spend.fuel;

  if (
    cat.includes("food") ||
    cat.includes("swiggy") ||
    cat.includes("zomato") ||
    cat.includes("dining")
  ) {
    // FIX: include diningRate
    const bestRate = Math.max(
      card.swiggyRate,
      card.zomatoRate,
      card.diningRate,
    );
    const extraYield =
      Math.max(0, bestRate - card.baseRewardRate) * (card.pointValue || 1);
    score += ((annualFood * extraYield) / 100) * 0.005;
  }

  if (
    cat.includes("shopping") ||
    cat.includes("amazon") ||
    cat.includes("flipkart")
  ) {
    // FIX: include groceryRate
    const bestRate = Math.max(
      card.amazonRate,
      card.flipkartRate,
      card.groceryRate,
    );
    const extraYield =
      Math.max(0, bestRate - card.baseRewardRate) * (card.pointValue || 1);
    score += ((annualShopping * extraYield) / 100) * 0.005;
  }

  if (cat.includes("travel") || cat.includes("flight")) {
    const bestRate = Math.max(card.flightRate, card.hotelRate);
    const extraYield =
      Math.max(0, bestRate - card.baseRewardRate) * (card.pointValue || 1);
    score += ((annualTravel * extraYield) / 100) * 0.005;
    if (card.tags.includes("Travel")) score += 3;
  }

  if (cat.includes("fuel")) {
    const extraYield =
      Math.max(0, card.fuelRewardRate - card.baseRewardRate) *
      (card.pointValue || 1);
    score += ((annualFuel * extraYield) / 100) * 0.005;
  }

  // Utility rate bonus
  if (card.utilityRate > card.baseRewardRate) {
    const utilSpend = spend.utilities;
    const extraYield =
      (card.utilityRate - card.baseRewardRate) * (card.pointValue || 1);
    score += ((utilSpend * extraYield) / 100) * 0.005;
  }

  // Generic tag match
  const tags = card.searchTags.toLowerCase();
  if (tags.includes(cat) && cat !== "general") score += 3;

  // 5. Travel perks — weighted by travel share
  const travelShare =
    totalAnnualSpend > 0 ? annualTravel / totalAnnualSpend : 0;
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

  return {
    card,
    audit,
    score: Number(Math.max(0, score).toFixed(2)),
  };
}

export function rankCards(
  spend: SpendProfile,
  category: string,
  availableCards?: CreditCard[],
) {
  const listToRank = availableCards || creditCards;
  const scoredCards = listToRank.map((card) =>
    scoreCard(card, spend, category),
  );
  return scoredCards.sort((a, b) => b.score - a.score);
}
