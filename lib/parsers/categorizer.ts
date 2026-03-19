// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY RULES
//
// ORDER IS CRITICAL — the first matching category wins.
// Non-rewardable categories (bank charges, P2P, gambling) come first or last:
//   • bank_charges_and_taxes  — FIRST  (unambiguous bank-generated text)
//   • gambling_and_restricted — EARLY  (before generic "others")
//   • transfers_and_p2p       — LAST   (after all merchant categories, because
//                                        P2P handles like @YBL- can appear in
//                                        merchant narrations too)
//
// KEY FIXES vs original:
//   1. "UPI/" removed — HDFC narrations end in "-UPI", never contain "UPI/"
//   2. "PAYMENT FROM" removed — only appears in CREDIT (deposit) rows, not debits
//   3. travel_and_utilities SPLIT into travel + utilities + fuel (3 separate cats)
//      so the scoring engine applies the right card rates to each
//   4. JIO moved from travel → utilities
//   5. HPCL/BPCL moved from travel → fuel
//   6. P2P detection uses UPI personal-bank handle suffixes (@OKICICI, @YBL-, @IBL-,
//      @OKAXIS, @SBIN-, @UBIN-, @BARB-, @PUNB-) which are personal accounts.
//      Merchant aggregator handles (@PTYS, @YESB0PTMUPI, @YESB0MCHUPI, @MERUPI,
//      @AUBANK) are NOT in P2P list — they correctly fall through to "others"
//      or get caught by merchant keyword rules above.
//   7. Added gambling_and_restricted category (non-rewardable)
//   8. Added MUJ.4276 (restaurant UPI handle), BAOZI (restaurant name) to food
//   9. "COIN" removed from investments — too generic, matches "BITCOIN" etc.
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORY_RULES: Record<string, string[]> = {
  // ── Non-rewardable: bank-generated charges ─────────────────────────────
  bank_charges_and_taxes: [
    "AMB CHRG",
    "PENAL CHRG",
    "MIN BAL CHRG",
    "NON-HDFC ATM",
    "NON-HOME BRANCH",
    "CONV FEE",
    "ANNUAL FEE",
    "CHQ RTN",
    "CHEQUE RETURN",
    "STAMP DUTY",
    "IT DEPT",
    "INCOME TAX",
    "GST CHRG",
    "SERVICE CHG",
    "PROCESSING FEE",
    "LATE PAYMENT",
  ],

  // ── Non-rewardable: gambling (excluded from reward calculation) ─────────
  gambling_and_restricted: [
    "MATKA",
    "SATTA",
    "LOTTERY",
    "BETWAY",
    "DREAM11",
    "DREAM 11",
    "RUMMY CIRCLE",
    "RUMMY",
    "POKER",
    "CASINO",
    "BETTING",
  ],

  // ── Non-rewardable: investments & insurance (not card-rewardable) ───────
  investment_and_insurance: [
    "ZERODHA",
    "GROWW",
    "KITE",
    "UPSTOX",
    "INDMONEY",
    "LIC",
    "HDFC LIFE",
    "ICICI PRU",
    "ICICI PRUDENTIAL",
    "POLICYBAZAAR",
    "KUVERA",
    "SMALLCASE",
    "NEXTBI",
    "ANGELONE",
    "ANGELMF",
    "ICCLMF",
    "IPO.",
    "MUTUAL FUND",
    "NAVI MF",
    "MIRAE",
    "NIPPON MF",
    "AXIS MF",
    "SBI MF",
    "PARAG PARIKH",
    "INB MF",
  ],

  // ── Non-rewardable: rent & credit card bill payments ───────────────────
  rent_and_credit_card: [
    "CRED",
    "CRED.CLUB",
    "HOUSE RENT",
    "RENTPAY",
    "DREAMPLUG",
    "NOBROKER",
    "MAGICBRICKS RENT",
  ],

  // ── Non-rewardable: loan EMIs ──────────────────────────────────────────
  loans_and_emi: [
    "PERSONAL LOAN",
    " EMI ",
    "EMI-",
    "LOAN CHRG",
    "LOAN EMI",
    "FINSERV",
    "BAJAJ",
    "BAJAJFINSERV",
    "HOME LOAN",
    "CAR LOAN",
    "HDFC LOAN",
    "ICICI LOAN",
    "PIRAMAL",
    "FULLERTON",
    "TATA CAPITAL",
  ],

  // ── Rewardable: digital subscriptions ─────────────────────────────────
  subscriptions_and_digital: [
    "NETFLIX",
    "APPLE MEDIA",
    "APPLE.COM",
    "GOOGLE",
    "SPOTIFY",
    "ADOBE",
    "YOUTUBE",
    "YOUTUBE PREMIUM",
    "DISNEY",
    "HOTSTAR",
    "AMAZON PRIME",
    "SONY LIV",
    "SONYLIV",
    "CANVA",
    "OPENAI",
    "CHATGPT",
    "LINKEDIN",
    "MICROSOFT",
    "DROPBOX",
    "ICLOUD",
  ],

  // ── Rewardable: food & dining ──────────────────────────────────────────
  food_and_dining: [
    "ZOMATO",
    "SWIGGY",
    "MOMOS", // generic restaurant type
    "NESCAFE",
    "GORDHANDASS",
    "STARBUCKS",
    "DOMINOS",
    "DOMINO",
    "PIZZA HUT",
    "KFC",
    "BURGER KING",
    "MCDONALDS",
    "MCDONALD",
    "CHAIOS",
    "BLUE TOKAI",
    "EATSURE",
    "BLINKIT", // quick commerce / food
    "ZEPTO", // quick commerce / food
    "MUJ.4276", // restaurant UPI handle pattern (HDFC Merchant UPI)
    "BAOZI", // restaurant name
    "DINEOUT",
    "EAZYDINER",
    "FASOOS",
    "BOX8",
    "FRESHMENU",
    "DUNZO", // quick delivery (food)
    "CHAI POINT",
    "CAFE COFFEE",
    "HALDIRAMS",
    "BARBEQUE",
    "MAINLAND CHINA",
  ],

  // ── Rewardable: online shopping & ecommerce ────────────────────────────
  shopping_and_ecommerce: [
    "AMAZON",
    "FLIPKART",
    "MYNTRA",
    "AJIO",
    "NYKAA",
    "MEESHO",
    "RELIANCE DIGITAL",
    "CROMA",
    "TATA CLIQ",
    "ZARA",
    "H&M",
    "DECATHLON",
    "PEPPERFRY",
    "URBAN LADDER",
    "BOAT ", // boAt audio (note trailing space to avoid "BOAT CLUB")
    "NOISE ",
    "VIJAY SALES",
    "CHROMA",
    "SHREE SHYAM ART",
    "ART AND", // local art/stationery shops
    "MERCHANT", // catch-all for merchant UPI IDs with "MERCHANT" in name
  ],

  // ── Rewardable: grocery & daily essentials ─────────────────────────────
  grocery_and_essentials: [
    "BIGBASKET",
    "BBDAILY",
    "DMART",
    "D MART",
    "RELIANCE FRESH",
    "RELIANCE SMART",
    "SPENCERS",
    "NATURES BASKET",
    "MILK BASKET",
    "COUNTRY DELIGHT",
    "JIOMART",
    "SMART BAZAAR",
    "MORE SUPERMARKET",
    "STAR BAZAAR",
    "HYPERCITY",
  ],

  // ── Rewardable: health & pharmacy ─────────────────────────────────────
  health_and_wellness: [
    "APOLLO",
    "APOLLO PHARMACY",
    "PHARMEASY",
    "1MG",
    "NETMEDS",
    "CULT.FIT",
    "CULT FIT",
    "PRACTO",
    "MAX HEALTH",
    "TATA 1MG",
    "MEDPLUS",
    "WELLNESS FOREVER",
    "FORTIS",
    "MANIPAL HOSPITAL",
    "THYROCARE",
    "LYBRATE",
  ],

  // ── Rewardable: fuel ──────────────────────────────────────────────────
  // Kept separate from travel so fuel-specialist cards score correctly
  fuel: [
    "HPCL",
    "BPCL",
    "IOCL",
    "INDIAN OIL",
    "HINDUSTAN PETROLEUM",
    "BHARAT PETROLEUM",
    "HP PETROL",
    "HP PUMP",
    "ESSAR FUEL",
    "SHELL PETROL",
    "SHELL FUEL",
    "PETROL PUMP",
    "FUEL STATION",
    "NAYARA",
    "RELIANCE PETRO",
  ],

  // ── Rewardable: travel (flights, hotels, cabs, trains) ────────────────
  travel: [
    "IRCTC",
    "RAILWAYS",
    "RAILWAY",
    "INDIGO",
    "AIR INDIA",
    "SPICEJET",
    "AKASA",
    "GOAIR",
    "VISTARA",
    "AIRINDIA",
    "MAKEMYTRIP",
    "MMT",
    "GOIBIBO",
    "CLEARTRIP",
    "YATRA",
    "OYO",
    "TREEBO",
    "FABHOTELS",
    "AIRBNB",
    "UBER",
    "OLA",
    "RAPIDO",
    "REDBUS",
    "RED_BUS",
    "ABHIBUS",
    "KSRTC",
    "MSRTC",
    "GSRTC",
    "MERU",
    "BLUEBIKE", // BluSmart / EV cabs
    "BLUSMART",
    "DRIVEZY",
    "ZOOMCAR",
  ],

  // ── Rewardable: utilities & telecom bills ─────────────────────────────
  // Separated from travel so utility-specialist cards score correctly
  utilities: [
    "JIO",
    "JIOFIBER",
    "AIRTEL",
    "AIRTEL PAYMENTS",
    "BSNL",
    "VODAFONE",
    "VI ", // note trailing space — avoids matching "VIVEK" etc.
    "IDEA CELLULAR",
    "TATA SKY",
    "TATAPLAY",
    "TATA PLAY",
    "DISH TV",
    "D2H",
    "SUN DIRECT",
    "BESCOM",
    "MSEB",
    "TNERC",
    "TNEB",
    "BSES",
    "WESCO",
    "NPCL",
    "TORRENT POWER",
    "ADANI ELECTRICITY",
    "ELECTRICITY",
    "WATER BOARD",
    "WATER SUPPLY",
    "MUNICIPAL",
    "BROADBAND",
    "FIBER",
    "PARK+",
    "GPAYRECHARGE", // Google Pay mobile recharge
    "RECHARGE",
    "PREPAID",
    "FASTAG",
    "NHAI",
    "PAYTM RECHARGE",
  ],

  // ── Non-rewardable: P2P UPI transfers ─────────────────────────────────
  // MUST BE LAST — after all merchant keyword categories.
  //
  // HOW IT WORKS:
  // Indian UPI handles fall into two groups:
  //   PERSONAL: person@okicici  person@okhdfcbank  person@okaxis
  //             name@ybl  name@ibl  name@sbin  name@ubin  name@barb  name@punb
  //   MERCHANT: shop@ptys (Paytm)  shop@yesb0ptmupi  shop@yesb0mchupi
  //             shop@merupi (HDFC merchant)  shop@aubank  shop@paytm
  //
  // We match personal suffixes. The "dash-before" (@YBL-, @IBL- etc.) is
  // important — HDFC narrations include the IFSC after the handle:
  //   UPI-PERSON-handle@YBL-YESB0YBLUPI-refno-UPI
  // The "-YBL-" suffix distinguishes personal Yes Bank handles from merchant ones.
  //
  // We do NOT match @PTYS, @MERUPI, @AUBANK here — those are merchant aggregators
  // and correctly fall to "others" (rewardable general spend).
  transfers_and_p2p: [
    "@OKICICI",
    "@OKHDFCBANK",
    "@OKAXIS",
    "@YBL-", // Yes Bank personal UPI (followed by IFSC code)
    "@IBL-", // IndusInd personal UPI
    "@SBIN-", // SBI personal UPI
    "@UBIN-", // Union Bank personal UPI
    "@BARB-", // Bank of Baroda personal UPI
    "@PUNB-", // Punjab National Bank personal UPI
    "@CNRB-", // Canara Bank personal UPI
    "@KKBK-", // Kotak personal UPI
    "SENT TO",
    "CASH WITHDRAWAL",
    "SELF TRANSFER",
    "NEFT DR-", // outward NEFT (person-to-person)
    "IMPS-P2A", // IMPS person-to-account
    "P2P TRANSFER",
  ],
};

/**
 * Categorizes a bank transaction based on its narration string.
 *
 * Returns one of the keys in CATEGORY_RULES, or "others" for unmatched.
 * "others" is treated as REWARDABLE (general card spend) by the advisor.
 *
 * Non-rewardable categories (excluded from spend profile):
 *   bank_charges_and_taxes, gambling_and_restricted, investment_and_insurance,
 *   rent_and_credit_card, loans_and_emi, transfers_and_p2p
 *
 * @param narration  Raw transaction description from the PDF / statement
 */
export function getCategory(narration: string): string {
  if (!narration) return "others";

  // Uppercase once for all comparisons
  const norm = narration.toUpperCase();

  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some((keyword) => norm.includes(keyword))) {
      return category;
    }
  }

  return "others";
}

/**
 * Returns true for categories that CANNOT earn credit card rewards.
 * Used by the advisor to strip non-rewardable spend from the profile.
 */
export const NON_REWARDABLE_CATEGORIES = new Set([
  "bank_charges_and_taxes",
  "gambling_and_restricted",
  "investment_and_insurance",
  "rent_and_credit_card",
  "loans_and_emi",
  "transfers_and_p2p",
]);

export function isRewardable(category: string): boolean {
  return !NON_REWARDABLE_CATEGORIES.has(category);
}
