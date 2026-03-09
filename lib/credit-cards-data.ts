import rawCards from "./csvjson (1).json";

/**
 * 2026 PaisaDekho Credit Card Interface
 * Mapping every field from the 2026 CSV Vault
 */
export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  tier: string;
  cardTier?: string; // optional
  category?: string; // optional
  network: "Visa" | "Mastercard" | "Amex" | "RuPay" | "Diners";

  // Reward Metrics
  baseRewardRate: number;
  pointValue: number;
  rewardUnit: string;
  travelMultiplier: number;

  // Fees & Waivers
  joiningFee: number;
  annualFee: number;
  retentionSpendReq: number;
  retentionSpendDisplay: string;
  isLtf: boolean;

  // Travel & Lounge
  forexMarkup: number;
  forexEffective: string;
  domesticLounge: string;
  internationalLounge: number;
  loungeCapDetails: string;
  loungeCap?: number; // optional
  airIndiaTransferRatio: number;

  // Perks & Constraints
  rewardCap: string;
  milestoneBenefit: string;
  fuelRewardRate: number;
  fuelCap: string;
  surchargeWaiver: string;

  // Metadata & UI
  searchTags: string;
  notesTnc: string;
  devaluation2026: boolean;
  imageGradient: string;
  multiplierChannel: string;
  transactionRange: string;
  fuelStationScope: string;
  directBookingRate: string;
  instantDiscountEligible: boolean; // ✅ boolean now
  diningRate: string;
  groceryRate: string;
  movieRate: string;
  joiningBenefit: string;
  airlineTransferJson: Record<string, string>;
  hotelTransferJson: Record<string, string>;
  detailedRewardsJson: Record<string, string>;
}

/**
 * Data Transformation & Mapping
 * Cleans raw CSV strings into usable logic numbers
 */
export const creditCards: CreditCard[] = (rawCards as any[]).map((c, index) => {
  const cleanNumber = (val: any) => {
    if (typeof val === "number") return val;
    if (
      !val ||
      val === "None" ||
      val === "Excluded" ||
      val === "N/A" ||
      val === "No"
    )
      return 0;
    return parseFloat(String(val).replace(/[^0-9.]/g, "")) || 0;
  };

  const parseLakhs = (str: string) => {
    if (!str || str.toLowerCase().includes("none") || str === "0") return 0;
    const match = String(str).match(/(\d+(\.\d+)?)\s*L/i);
    if (match) return parseFloat(match[1]) * 100000;
    const raw = cleanNumber(str);
    return raw < 100 ? raw * 100000 : raw;
  };

  const name = (c.card_name || "").toLowerCase();
  let network: CreditCard["network"] = "Visa";
  if (name.includes("amex") || name.includes("american express"))
    network = "Amex";
  else if (name.includes("diners")) network = "Diners";
  else if (name.includes("rupay")) network = "RuPay";
  else if (name.includes("mastercard")) network = "Mastercard";

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

  const isDevalued =
    c.notes_tnc?.toLowerCase().includes("devaluation") ||
    c.notes_tnc?.toLowerCase().includes("2026") ||
    c.card_name.includes("Magnus") ||
    c.card_name.includes("Reserve");

  return {
    id: String(index + 1),
    name: c.card_name,
    bank: c.issuer,
    tier: c.card_tier || "Premium",
    network,

    // optional fields: no '?' needed here
    cardTier: c.cardTier || undefined,
    category: c.category || undefined,

    // Reward Metrics
    baseRewardRate: cleanNumber(c.base_reward_rate),
    pointValue: cleanNumber(c.point_value),
    rewardUnit: c.reward_unit || "Points",
    travelMultiplier: cleanNumber(c.travel_multiplier),

    // Fees & Waivers
    joiningFee: cleanNumber(c.joining_fee),
    annualFee: cleanNumber(c.annual_fee),
    retentionSpendReq: parseLakhs(c.retention_spend_req),
    retentionSpendDisplay: c.retention_spend_req || "No Waiver",
    isLtf: String(c.is_ltf).toLowerCase() === "true",

    // Travel & Lounge
    forexMarkup: cleanNumber(c.forex_markup),
    forexEffective: c.forex_effective || "N/A",
    domesticLounge: c.domestic_lounge || "0",
    internationalLounge: cleanNumber(c.international_lounge),
    loungeCapDetails: c.lounge_cap_details || "Standard T&C",
    loungeCap: c.lounge_cap ? cleanNumber(c.lounge_cap) : undefined,
    airIndiaTransferRatio: cleanNumber(c.air_india_transfer_ratio),

    // Perks & Constraints
    rewardCap: c.monthly_reward_cap || "No Cap",
    milestoneBenefit: c.milestone_benefit || "None",
    fuelRewardRate: cleanNumber(c.fuel_reward_rate),
    fuelCap: c.fuel_cap || "0",
    surchargeWaiver: c.surcharge_waiver || "0%",

    // Detailed API Fields (Mapped from your JSON)
    transactionRange: c["Transaction Range (min – max)"] || "N/A",
    fuelStationScope: c["~"] || "All Stations",
    directBookingRate: c.direct_booking_rate || "Base Rate",
    instantDiscountEligible:
      String(c.instant_discount_eligible).toLowerCase() === "true" ||
      String(c.instant_discount_eligible || "").includes("%"),
    diningRate: c.dining_rate || "Base Rate",
    groceryRate: c.grocery_rate || "Base Rate",
    movieRate: c.movie_rate || "Base Rate",
    joiningBenefit: c.joining_benefit || "N/A",

    // Partnership & Reward JSONs
    airlineTransferJson: c.airline_transfer_json || {},
    hotelTransferJson: c.hotel_transfer_json || {},
    detailedRewardsJson: c.detailed_rewards_json || {},

    // Metadata & UI
    searchTags: c.search_tags || "",
    notesTnc: c.notes_tnc || "",
    devaluation2026: isDevalued,
    imageGradient: bankGradients[c.issuer] || "from-zinc-800 to-zinc-950",
    multiplierChannel: c.multiplier_channel || "Direct Spends",
  };
});

/**
 * THE BUTLER ENGINE: Final Calculation Breakdown
 * Monetizes perks and audits net value for 2026
 */
export interface CardAudit {
  netValue: number;
  yield: number; // now number
  feeWaived: boolean;
  convenienceSavings: number;
  grossRewards: number;
  outflow: number;

  effectiveFee?: number; // optional if needed
  redemptionCosts?: number; // optional if needed

  breakdown: {
    label: string;
    value: number;
    plus: boolean;
  }[];
}
export function calculateInDepthSavings(
  card: CreditCard,
  annualSpend: number,
  monthlyLoungeVisits: number = 0.5,
): CardAudit {
  const isFeeWaived =
    card.retentionSpendReq > 0 && annualSpend >= card.retentionSpendReq;
  const baseFee = isFeeWaived ? 0 : card.annualFee;
  const taxOutflow = baseFee * 0.18;
  const totalOutflow = baseFee + taxOutflow;

  const grossPoints = (annualSpend * card.baseRewardRate) / 100;
  const rewardsValue = grossPoints * card.pointValue;

  const loungeVisits =
    card.domesticLounge === "Unlimited"
      ? 12
      : parseInt(card.domesticLounge) || 0;
  const loungeMonetized =
    Math.min(loungeVisits, monthlyLoungeVisits * 12) * 800;

  const fuelSavings =
    card.fuelRewardRate > 0
      ? Math.min(annualSpend * 0.05 * (card.fuelRewardRate / 100), 3000)
      : 0;

  const netValue = rewardsValue + loungeMonetized + fuelSavings - totalOutflow;
  const yieldPercent = Number(((netValue / annualSpend) * 100).toFixed(2));

  return {
    netValue,
    yield: yieldPercent,
    feeWaived: isFeeWaived,
    convenienceSavings: loungeMonetized + fuelSavings,
    grossRewards: rewardsValue,
    outflow: totalOutflow,
    effectiveFee: totalOutflow,
    redemptionCosts: 0, // optional
    breakdown: [
      { label: "Rewards", value: rewardsValue, plus: true },
      { label: "Lounge", value: loungeMonetized, plus: true },
      { label: "Fuel Savings", value: fuelSavings, plus: true },
      { label: "Fee Outflow", value: totalOutflow, plus: false },
    ],
  };
}
