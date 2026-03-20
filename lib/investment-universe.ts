// ─────────────────────────────────────────────────────────────────────────────
// investment-universe.ts
// Complete Indian investment universe — 7 asset classes, 45+ options
// Used by: Wealth Advisor, Explore, Risk Profiler, My Money
// ─────────────────────────────────────────────────────────────────────────────

export type AssetClass =
  | "equity"
  | "fixed_income"
  | "cash"
  | "real_estate"
  | "mutual_funds"
  | "alternatives"
  | "govt_schemes";

export type RiskLevel = "very-low" | "low" | "medium" | "high" | "very-high";

export interface AssetClassMeta {
  id: AssetClass;
  label: string;
  emoji: string;
  color: string; // tailwind-compatible hex
  bgClass: string; // tailwind bg class
  textClass: string; // tailwind text class
  borderClass: string; // tailwind border class
  risk: RiskLevel;
  returnMin: number; // % p.a.
  returnMax: number;
  horizon: string;
  desc: string;
  taxSummary: string;
}

export interface InvestmentOption {
  id: string;
  assetClass: AssetClass;
  name: string;
  shortName: string;
  subcategory: string;
  platform: string[];
  minInvest: number; // ₹
  riskLevel: RiskLevel;
  returnMin: number; // % p.a.
  returnMax: number;
  liquidityDays: number; // approx days to withdraw (0 = instant)
  taxBenefit: string; // "80C" | "80CCD" | "EEE" | "None" | "30% flat" etc.
  lockInYears: number; // 0 = no lock-in
  sipAvailable: boolean;
  tags: string[];
  proTip: string;
  deepLinkBase?: string; // affiliate/partner URL base
}

// ─── ASSET CLASS METADATA ────────────────────────────────────────────────────

export const ASSET_CLASSES: AssetClassMeta[] = [
  {
    id: "equity",
    label: "Equity",
    emoji: "📈",
    color: "#ef4444",
    bgClass: "bg-red-500/10",
    textClass: "text-red-400",
    borderClass: "border-red-500/25",
    risk: "high",
    returnMin: 12,
    returnMax: 25,
    horizon: "5+ years",
    desc: "Stocks, direct equity, IPOs — highest return potential with volatility",
    taxSummary: "STCG 15% · LTCG 10% above ₹1.25L",
  },
  {
    id: "fixed_income",
    label: "Fixed Income",
    emoji: "🏦",
    color: "#3b82f6",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/25",
    risk: "low",
    returnMin: 6,
    returnMax: 12,
    horizon: "1–10 years",
    desc: "FDs, bonds, NCDs, RDs — predictable regular income",
    taxSummary: "Taxed as per income slab",
  },
  {
    id: "cash",
    label: "Cash & Liquid",
    emoji: "💵",
    color: "#10b981",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/25",
    risk: "very-low",
    returnMin: 3,
    returnMax: 7,
    horizon: "Anytime",
    desc: "Savings, liquid funds, money market — emergency fund foundation",
    taxSummary: "Taxed as per income slab",
  },
  {
    id: "real_estate",
    label: "Real Estate",
    emoji: "🏠",
    color: "#f97316",
    bgClass: "bg-orange-500/10",
    textClass: "text-orange-400",
    borderClass: "border-orange-500/25",
    risk: "medium",
    returnMin: 8,
    returnMax: 15,
    horizon: "5–15 years",
    desc: "REITs, fractional property, physical real estate",
    taxSummary: "LTCG 20% with indexation",
  },
  {
    id: "mutual_funds",
    label: "Mutual Funds & ETFs",
    emoji: "📊",
    color: "#8b5cf6",
    bgClass: "bg-violet-500/10",
    textClass: "text-violet-400",
    borderClass: "border-violet-500/25",
    risk: "medium",
    returnMin: 10,
    returnMax: 22,
    horizon: "3–10 years",
    desc: "SIPs, index funds, ETFs — diversified professional management",
    taxSummary: "ELSS 80C · Equity LTCG 10% above ₹1.25L",
  },
  {
    id: "alternatives",
    label: "Alternatives",
    emoji: "✨",
    color: "#f59e0b",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/25",
    risk: "high",
    returnMin: 0,
    returnMax: 50,
    horizon: "Variable",
    desc: "Gold, SGBs, crypto, P2P lending, commodities",
    taxSummary: "SGB tax-free on maturity · Crypto 30% flat",
  },
  {
    id: "govt_schemes",
    label: "Govt Schemes",
    emoji: "🛡️",
    color: "#06b6d4",
    bgClass: "bg-cyan-500/10",
    textClass: "text-cyan-400",
    borderClass: "border-cyan-500/25",
    risk: "very-low",
    returnMin: 7,
    returnMax: 12,
    horizon: "5–30 years",
    desc: "PPF, NPS, SSY, NSC — guaranteed, tax-efficient, government-backed",
    taxSummary: "PPF/SSY fully EEE · NPS 80CCD(1B) extra ₹50k",
  },
];

// ─── INVESTMENT OPTIONS ───────────────────────────────────────────────────────

export const INVESTMENT_OPTIONS: InvestmentOption[] = [
  // ── EQUITY ────────────────────────────────────────────────────────────────
  {
    id: "eq-largecap",
    assetClass: "equity",
    name: "Large Cap Stocks",
    shortName: "Large Cap",
    subcategory: "Stocks",
    platform: ["Zerodha", "Groww", "Upstox", "Angel One"],
    minInvest: 1,
    riskLevel: "high",
    returnMin: 12,
    returnMax: 18,
    liquidityDays: 2,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["equity", "stocks", "long-term", "blue-chip"],
    proTip:
      "Stick to Nifty 50 or Sensex constituents for lower volatility. Use SIP in large-cap mutual funds if you're a beginner.",
  },
  {
    id: "eq-midcap",
    assetClass: "equity",
    name: "Mid Cap Stocks",
    shortName: "Mid Cap",
    subcategory: "Stocks",
    platform: ["Zerodha", "Groww", "Upstox", "Angel One"],
    minInvest: 1,
    riskLevel: "high",
    returnMin: 15,
    returnMax: 25,
    liquidityDays: 2,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["equity", "stocks", "mid-cap", "growth"],
    proTip:
      "Higher growth potential than large caps. Avoid if investment horizon < 5 years — volatility is significant.",
  },
  {
    id: "eq-smallcap",
    assetClass: "equity",
    name: "Small Cap Stocks",
    shortName: "Small Cap",
    subcategory: "Stocks",
    platform: ["Zerodha", "Groww", "Upstox"],
    minInvest: 1,
    riskLevel: "very-high",
    returnMin: 15,
    returnMax: 35,
    liquidityDays: 2,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["equity", "stocks", "small-cap", "speculative"],
    proTip:
      "Only 5-10% of portfolio for small caps. Do thorough fundamental research — liquidity risk is real.",
  },
  {
    id: "eq-ipo",
    assetClass: "equity",
    name: "IPOs",
    shortName: "IPOs",
    subcategory: "New Issues",
    platform: ["Zerodha", "Groww", "HDFC Securities", "Angel One"],
    minInvest: 10000,
    riskLevel: "high",
    returnMin: 0,
    returnMax: 50,
    liquidityDays: 7,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["equity", "ipo", "listing-gains"],
    proTip:
      "Apply under HNI/NII category for better allotment chances. Listing gains are not guaranteed — evaluate fundamentals.",
  },
  {
    id: "eq-etf",
    assetClass: "equity",
    name: "Sectoral & Thematic ETFs",
    shortName: "Sectoral ETFs",
    subcategory: "ETFs",
    platform: ["Zerodha", "Groww", "Upstox"],
    minInvest: 100,
    riskLevel: "high",
    returnMin: 10,
    returnMax: 30,
    liquidityDays: 2,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: true,
    tags: ["etf", "sector", "tech", "pharma", "banking"],
    proTip:
      "Nifty IT, Nifty Bank, Nifty Pharma ETFs give concentrated sector bets. Keep sector allocation < 15% of portfolio.",
  },

  // ── FIXED INCOME ──────────────────────────────────────────────────────────
  {
    id: "fi-fd-bank",
    assetClass: "fixed_income",
    name: "Bank Fixed Deposit",
    shortName: "Bank FD",
    subcategory: "Fixed Deposits",
    platform: ["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak"],
    minInvest: 1000,
    riskLevel: "very-low",
    returnMin: 6.5,
    returnMax: 8.0,
    liquidityDays: 0,
    taxBenefit: "80C (5-yr tax-saver FD)",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["fd", "fixed-income", "safe", "guaranteed"],
    proTip:
      "Small finance banks (AU, ESAF, Jana) offer 9%+ FD rates. Covered under DICGC up to ₹5L per bank.",
  },
  {
    id: "fi-fd-nbfc",
    assetClass: "fixed_income",
    name: "NBFC Fixed Deposit",
    shortName: "NBFC FD",
    subcategory: "Fixed Deposits",
    platform: [
      "Bajaj Finserv",
      "Mahindra Finance",
      "Shriram Finance",
      "HDFC Ltd",
    ],
    minInvest: 5000,
    riskLevel: "low",
    returnMin: 7.5,
    returnMax: 9.5,
    liquidityDays: 3,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["fd", "nbfc", "higher-return", "fixed-income"],
    proTip:
      "Bajaj Finance FD is AAA-rated and offers up to 8.85%. Always check the credit rating — avoid below AA.",
  },
  {
    id: "fi-corp-bonds",
    assetClass: "fixed_income",
    name: "Corporate Bonds",
    shortName: "Corp Bonds",
    subcategory: "Bonds",
    platform: [
      "Zerodha",
      "GoldenPi",
      "Bonds India",
      "HDFC Securities",
      "ICICI Direct",
    ],
    minInvest: 1000,
    riskLevel: "low",
    returnMin: 7.5,
    returnMax: 12.0,
    liquidityDays: 2,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["bonds", "fixed-income", "yield", "corporate"],
    proTip:
      "Stick to AAA/AA+ rated bonds via platforms like GoldenPi. Higher yield = higher credit risk — never chase 14%+ yields.",
  },
  {
    id: "fi-govt-bonds",
    assetClass: "fixed_income",
    name: "Government Securities (G-Secs)",
    shortName: "G-Secs",
    subcategory: "Bonds",
    platform: ["RBI Retail Direct", "Zerodha", "HDFC Securities"],
    minInvest: 10000,
    riskLevel: "very-low",
    returnMin: 7.0,
    returnMax: 7.5,
    liquidityDays: 2,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["bonds", "govt", "sovereign", "safe"],
    proTip:
      "Zero credit risk — backed by Government of India. Use RBI Retail Direct for commission-free access.",
  },
  {
    id: "fi-rbi-bonds",
    assetClass: "fixed_income",
    name: "RBI Floating Rate Bonds",
    shortName: "RBI Bonds",
    subcategory: "Bonds",
    platform: ["SBI", "HDFC Bank", "ICICI Bank", "Bank of Baroda"],
    minInvest: 1000,
    riskLevel: "very-low",
    returnMin: 7.35,
    returnMax: 8.05,
    liquidityDays: 0,
    taxBenefit: "None",
    lockInYears: 7,
    sipAvailable: false,
    tags: ["bonds", "rbi", "floating-rate", "safe"],
    proTip:
      "Rate resets every 6 months linked to NSC rate. 7-year lock-in but senior citizens can exit after 4 years.",
  },
  {
    id: "fi-ncd",
    assetClass: "fixed_income",
    name: "Non-Convertible Debentures (NCDs)",
    shortName: "NCDs",
    subcategory: "Bonds",
    platform: ["Zerodha", "HDFC Securities", "GoldenPi", "NSE/BSE"],
    minInvest: 1000,
    riskLevel: "medium",
    returnMin: 9.0,
    returnMax: 13.0,
    liquidityDays: 2,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["ncd", "bonds", "high-yield", "secondary-market"],
    proTip:
      "Listed NCDs can be traded on NSE/BSE. Check credit rating carefully — Muthoot, Shriram NCDs are popular.",
  },
  {
    id: "fi-rd",
    assetClass: "fixed_income",
    name: "Recurring Deposit (RD)",
    shortName: "RD",
    subcategory: "Fixed Deposits",
    platform: ["Any Bank", "Post Office"],
    minInvest: 100,
    riskLevel: "very-low",
    returnMin: 5.5,
    returnMax: 7.5,
    liquidityDays: 0,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["rd", "monthly", "savings", "beginner"],
    proTip:
      "Ideal for disciplined monthly savings. Post Office RD at 6.7% is safe and accessible pan-India.",
  },

  // ── CASH & LIQUID ─────────────────────────────────────────────────────────
  {
    id: "cash-savings",
    assetClass: "cash",
    name: "High-Yield Savings Account",
    shortName: "Savings A/C",
    subcategory: "Savings",
    platform: ["IDFC FIRST", "Kotak", "DBS", "Yes Bank", "AU Small Finance"],
    minInvest: 0,
    riskLevel: "very-low",
    returnMin: 3.0,
    returnMax: 7.0,
    liquidityDays: 0,
    taxBenefit: "80TTA up to ₹10k interest",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["savings", "liquid", "emergency-fund"],
    proTip:
      "IDFC FIRST offers 7% on savings balance. Use this for your emergency fund — keep 6 months expenses here.",
  },
  {
    id: "cash-liquid-fund",
    assetClass: "cash",
    name: "Liquid Mutual Funds",
    shortName: "Liquid Funds",
    subcategory: "Mutual Funds",
    platform: ["Groww", "Kuvera", "Zerodha Coin", "Paytm Money"],
    minInvest: 500,
    riskLevel: "very-low",
    returnMin: 6.5,
    returnMax: 7.5,
    liquidityDays: 1,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: true,
    tags: ["liquid", "overnight", "parking", "cash-equivalent"],
    proTip:
      "Better than savings account for idle money. T+1 redemption. HDFC Liquid, Nippon Liquid are top-rated.",
  },
  {
    id: "cash-ultra-short",
    assetClass: "cash",
    name: "Ultra Short Duration Funds",
    shortName: "Ultra Short",
    subcategory: "Mutual Funds",
    platform: ["Groww", "Kuvera", "INDmoney"],
    minInvest: 500,
    riskLevel: "low",
    returnMin: 7.0,
    returnMax: 8.0,
    liquidityDays: 1,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: true,
    tags: ["ultra-short", "debt", "3-6 months"],
    proTip:
      "For 3-6 month money parking. Slightly better returns than liquid funds with minimal interest rate risk.",
  },

  // ── REAL ESTATE ───────────────────────────────────────────────────────────
  {
    id: "re-reit",
    assetClass: "real_estate",
    name: "Real Estate Investment Trusts (REITs)",
    shortName: "REITs",
    subcategory: "REITs",
    platform: ["Zerodha", "Groww", "HDFC Securities", "ICICI Direct"],
    minInvest: 300,
    riskLevel: "medium",
    returnMin: 8.0,
    returnMax: 12.0,
    liquidityDays: 2,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["reit", "real-estate", "passive-income", "commercial"],
    proTip:
      "Embassy REIT, Mindspace REIT, Brookfield REIT listed on NSE. Quarterly distributions (like dividends). Min buy ~₹300-400.",
  },
  {
    id: "re-fractional",
    assetClass: "real_estate",
    name: "Fractional Real Estate",
    shortName: "Fractional RE",
    subcategory: "Fractional Ownership",
    platform: ["Strata", "hBits", "PropertyShare", "Grip Invest"],
    minInvest: 25000,
    riskLevel: "medium",
    returnMin: 10.0,
    returnMax: 15.0,
    liquidityDays: 30,
    taxBenefit: "None",
    lockInYears: 3,
    sipAvailable: false,
    tags: ["fractional", "commercial", "rental-income", "alternative"],
    proTip:
      "Own fractions of Grade-A commercial properties. Strata, hBits offer pre-leased assets with 9-10% rental yield + appreciation.",
  },
  {
    id: "re-etf",
    assetClass: "real_estate",
    name: "Real Estate ETFs",
    shortName: "RE ETF",
    subcategory: "ETFs",
    platform: ["Zerodha", "Groww"],
    minInvest: 500,
    riskLevel: "medium",
    returnMin: 8.0,
    returnMax: 14.0,
    liquidityDays: 2,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: true,
    tags: ["etf", "real-estate", "diversified"],
    proTip:
      "Nifty Realty ETF gives diversified exposure to listed real estate companies. Liquid and low-cost alternative to direct property.",
  },

  // ── MUTUAL FUNDS & ETFs ───────────────────────────────────────────────────
  {
    id: "mf-index",
    assetClass: "mutual_funds",
    name: "Nifty 50 Index Fund",
    shortName: "Index Fund",
    subcategory: "Index Funds",
    platform: ["Groww", "Kuvera", "Zerodha Coin", "Paytm Money"],
    minInvest: 100,
    riskLevel: "medium",
    returnMin: 12.0,
    returnMax: 15.0,
    liquidityDays: 3,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: true,
    tags: ["index", "nifty50", "passive", "low-cost", "beginner"],
    proTip:
      "Best starting point for most investors. Expense ratio < 0.1%. UTI Nifty 50, Mirae Nifty 50 are top picks.",
  },
  {
    id: "mf-flexi",
    assetClass: "mutual_funds",
    name: "Flexi Cap Mutual Fund",
    shortName: "Flexi Cap",
    subcategory: "Equity Funds",
    platform: ["Groww", "Kuvera", "INDmoney"],
    minInvest: 500,
    riskLevel: "medium",
    returnMin: 14.0,
    returnMax: 20.0,
    liquidityDays: 3,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: true,
    tags: ["flexi-cap", "diversified", "equity", "multi-cap"],
    proTip:
      "Parag Parikh Flexi Cap is the gold standard — invests in international stocks too for diversification.",
  },
  {
    id: "mf-elss",
    assetClass: "mutual_funds",
    name: "ELSS Tax Saving Fund",
    shortName: "ELSS",
    subcategory: "Tax Saving",
    platform: ["Groww", "Kuvera", "Zerodha Coin"],
    minInvest: 500,
    riskLevel: "high",
    returnMin: 14.0,
    returnMax: 22.0,
    liquidityDays: 3,
    taxBenefit: "80C up to ₹1.5L",
    lockInYears: 3,
    sipAvailable: true,
    tags: ["elss", "tax-saving", "80c", "equity"],
    proTip:
      "Shortest lock-in (3 yrs) among 80C options. Returns historically beat PPF. Mirae ELSS, Axis ELSS are top picks.",
  },
  {
    id: "mf-international",
    assetClass: "mutual_funds",
    name: "International / US Funds",
    shortName: "International",
    subcategory: "International Funds",
    platform: ["Groww", "Kuvera", "Mirae AMC"],
    minInvest: 500,
    riskLevel: "high",
    returnMin: 10.0,
    returnMax: 20.0,
    liquidityDays: 3,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: true,
    tags: ["international", "us-stocks", "nasdaq", "global"],
    proTip:
      "USD appreciation adds extra returns. Mirae Nasdaq 100, Franklin India Feeder US Opportunities. Keep ≤15% allocation.",
  },
  {
    id: "mf-debt",
    assetClass: "mutual_funds",
    name: "Short Duration Debt Fund",
    shortName: "Debt Fund",
    subcategory: "Debt Funds",
    platform: ["Groww", "Kuvera", "Zerodha Coin"],
    minInvest: 1000,
    riskLevel: "low",
    returnMin: 7.0,
    returnMax: 9.0,
    liquidityDays: 3,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: true,
    tags: ["debt", "short-duration", "low-risk", "bonds"],
    proTip:
      "Better post-tax than FD for high-income earners (indexation benefit pre-2023 is gone, but still tax-efficient for short hold).",
  },

  // ── ALTERNATIVES ──────────────────────────────────────────────────────────
  {
    id: "alt-sgb",
    assetClass: "alternatives",
    name: "Sovereign Gold Bond (SGB)",
    shortName: "SGB",
    subcategory: "Gold",
    platform: ["RBI", "SBI", "HDFC Bank", "Zerodha", "HDFC Securities"],
    minInvest: 5800,
    riskLevel: "medium",
    returnMin: 8.0,
    returnMax: 15.0,
    liquidityDays: 0,
    taxBenefit: "Capital gains tax-free on maturity",
    lockInYears: 8,
    sipAvailable: false,
    tags: ["gold", "sgb", "sovereign", "tax-free", "interest"],
    proTip:
      "Best way to hold gold — earn 2.5% annual interest + gold price appreciation. Tax-free capital gains if held to maturity (8 yrs).",
  },
  {
    id: "alt-digital-gold",
    assetClass: "alternatives",
    name: "Digital Gold",
    shortName: "Digital Gold",
    subcategory: "Gold",
    platform: ["Zerodha", "Groww", "PhonePe", "Paytm"],
    minInvest: 1,
    riskLevel: "medium",
    returnMin: 8.0,
    returnMax: 12.0,
    liquidityDays: 1,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: true,
    tags: ["gold", "digital", "liquid", "hedge"],
    proTip:
      "More liquid than SGB but no 2.5% interest. Use for short-term gold exposure. Convert to physical jewellery when needed.",
  },
  {
    id: "alt-crypto",
    assetClass: "alternatives",
    name: "Cryptocurrency",
    shortName: "Crypto",
    subcategory: "Crypto",
    platform: ["CoinDCX", "WazirX", "CoinSwitch", "Binance"],
    minInvest: 100,
    riskLevel: "very-high",
    returnMin: -80,
    returnMax: 200,
    liquidityDays: 1,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: true,
    tags: ["crypto", "bitcoin", "ethereum", "speculative", "high-risk"],
    proTip:
      "30% flat tax + 1% TDS on every trade. Max 1-5% of portfolio. Only Bitcoin and Ethereum are reasonable long-term bets.",
  },
  {
    id: "alt-p2p",
    assetClass: "alternatives",
    name: "P2P Lending",
    shortName: "P2P",
    subcategory: "P2P Lending",
    platform: ["Faircent", "LenDenClub", "Liquiloans", "CRED Mint"],
    minInvest: 10000,
    riskLevel: "high",
    returnMin: 10.0,
    returnMax: 16.0,
    liquidityDays: 30,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["p2p", "lending", "high-yield", "alternative"],
    proTip:
      "CRED Mint is most regulated and user-friendly. Spread across 100+ loans to reduce default risk. Returns: 10-13% realistic.",
  },
  {
    id: "alt-commodities",
    assetClass: "alternatives",
    name: "Commodity ETFs",
    shortName: "Commodities",
    subcategory: "Commodities",
    platform: ["Zerodha", "Upstox", "Angel One"],
    minInvest: 500,
    riskLevel: "high",
    returnMin: 5.0,
    returnMax: 25.0,
    liquidityDays: 2,
    taxBenefit: "None",
    lockInYears: 0,
    sipAvailable: false,
    tags: ["commodities", "silver", "oil", "crude", "hedge"],
    proTip:
      "Silver ETF, commodity futures for sophisticated investors. Use only as portfolio hedge (5-10%), not core holding.",
  },

  // ── GOVERNMENT SCHEMES ────────────────────────────────────────────────────
  {
    id: "gs-ppf",
    assetClass: "govt_schemes",
    name: "Public Provident Fund (PPF)",
    shortName: "PPF",
    subcategory: "PPF",
    platform: ["SBI", "Post Office", "HDFC Bank", "ICICI Bank", "Axis Bank"],
    minInvest: 500,
    riskLevel: "very-low",
    returnMin: 7.1,
    returnMax: 7.1,
    liquidityDays: 0,
    taxBenefit: "EEE — 80C invest, interest tax-free, maturity tax-free",
    lockInYears: 15,
    sipAvailable: true,
    tags: ["ppf", "tax-free", "80c", "guaranteed", "eee"],
    proTip:
      "The gold standard of safe investing. ₹1.5L/yr in 80C + fully tax-free returns. Open online via SBI or your bank.",
  },
  {
    id: "gs-nps",
    assetClass: "govt_schemes",
    name: "National Pension System (NPS)",
    shortName: "NPS",
    subcategory: "NPS",
    platform: ["eNPS", "SBI", "HDFC Bank", "Axis Bank", "Kotak"],
    minInvest: 500,
    riskLevel: "low",
    returnMin: 9.0,
    returnMax: 12.0,
    liquidityDays: 0,
    taxBenefit: "80CCD(1): ₹1.5L + 80CCD(1B): extra ₹50k = ₹2L total deduction",
    lockInYears: 60,
    sipAvailable: true,
    tags: ["nps", "retirement", "pension", "80ccd", "extra-50k"],
    proTip:
      "Extra ₹50k deduction under 80CCD(1B) over and above 80C limit — saves ₹15,600/yr for 30% tax bracket. Tier 2 is fully liquid.",
  },
  {
    id: "gs-ssy",
    assetClass: "govt_schemes",
    name: "Sukanya Samriddhi Yojana (SSY)",
    shortName: "SSY",
    subcategory: "SSY",
    platform: ["Post Office", "SBI", "Axis Bank", "HDFC Bank"],
    minInvest: 250,
    riskLevel: "very-low",
    returnMin: 8.2,
    returnMax: 8.2,
    liquidityDays: 0,
    taxBenefit: "EEE — fully tax-free for girl child",
    lockInYears: 21,
    sipAvailable: true,
    tags: ["ssy", "girl-child", "education", "tax-free", "8.2%"],
    proTip:
      "8.2% guaranteed + fully EEE — highest safe return in India. Only for girl child below 10 yrs. Invest ₹1.5L/yr from day 1.",
  },
  {
    id: "gs-nsc",
    assetClass: "govt_schemes",
    name: "National Savings Certificate (NSC)",
    shortName: "NSC",
    subcategory: "NSC",
    platform: ["Post Office"],
    minInvest: 1000,
    riskLevel: "very-low",
    returnMin: 7.7,
    returnMax: 7.7,
    liquidityDays: 0,
    taxBenefit: "80C deduction",
    lockInYears: 5,
    sipAvailable: false,
    tags: ["nsc", "post-office", "80c", "5-year", "safe"],
    proTip:
      "Interest is reinvested annually and qualifies for 80C deduction each year. Good for lump-sum 80C investment.",
  },
  {
    id: "gs-scss",
    assetClass: "govt_schemes",
    name: "Senior Citizen Savings Scheme (SCSS)",
    shortName: "SCSS",
    subcategory: "SCSS",
    platform: ["Post Office", "SBI", "Authorised Banks"],
    minInvest: 1000,
    riskLevel: "very-low",
    returnMin: 8.2,
    returnMax: 8.2,
    liquidityDays: 0,
    taxBenefit: "80C deduction",
    lockInYears: 5,
    sipAvailable: false,
    tags: ["scss", "senior-citizen", "retirement", "8.2%"],
    proTip:
      "Available only to 60+ (or 55+ for VRS/defence retirees). Max ₹30L investment. Quarterly payouts — great for retired income.",
  },
  {
    id: "gs-pmis",
    assetClass: "govt_schemes",
    name: "Post Office Monthly Income Scheme (POMIS)",
    shortName: "PO MIS",
    subcategory: "Post Office",
    platform: ["Post Office"],
    minInvest: 1500,
    riskLevel: "very-low",
    returnMin: 7.4,
    returnMax: 7.4,
    liquidityDays: 0,
    taxBenefit: "None",
    lockInYears: 5,
    sipAvailable: false,
    tags: ["pomis", "monthly-income", "post-office", "pension"],
    proTip:
      "Max ₹9L single, ₹15L joint. Great for generating monthly passive income — ideal for parents/retired individuals.",
  },
  {
    id: "gs-atal",
    assetClass: "govt_schemes",
    name: "Atal Pension Yojana (APY)",
    shortName: "APY",
    subcategory: "Pension",
    platform: ["Any Bank", "Post Office"],
    minInvest: 42,
    riskLevel: "very-low",
    returnMin: 8.0,
    returnMax: 8.0,
    liquidityDays: 0,
    taxBenefit: "80CCD deduction",
    lockInYears: 60,
    sipAvailable: true,
    tags: ["apy", "pension", "govt", "guaranteed-pension"],
    proTip:
      "Guaranteed pension of ₹1k-5k/month from age 60. Government co-contributes 50% (max ₹1k/yr) for subscribers joining before March 2016.",
  },
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

export function getOptionsByClass(assetClass: AssetClass): InvestmentOption[] {
  return INVESTMENT_OPTIONS.filter((o) => o.assetClass === assetClass);
}

export function getOptionsByRisk(risk: RiskLevel): InvestmentOption[] {
  return INVESTMENT_OPTIONS.filter((o) => o.riskLevel === risk);
}

export function getTaxSavingOptions(): InvestmentOption[] {
  return INVESTMENT_OPTIONS.filter(
    (o) => o.taxBenefit !== "None" && o.taxBenefit !== "",
  );
}

export function searchOptions(query: string): InvestmentOption[] {
  const q = query.toLowerCase();
  return INVESTMENT_OPTIONS.filter(
    (o) =>
      o.name.toLowerCase().includes(q) ||
      o.shortName.toLowerCase().includes(q) ||
      o.subcategory.toLowerCase().includes(q) ||
      o.tags.some((t) => t.includes(q)) ||
      o.platform.some((p) => p.toLowerCase().includes(q)),
  );
}

// Risk-based allocation recommendation
export function getRecommendedAllocation(
  riskScore: number, // 0-100
  totalMonthly: number,
): { option: InvestmentOption; allocationPct: number; monthlySip: number }[] {
  let allocations: { id: string; pct: number }[];

  if (riskScore < 30) {
    // Conservative
    allocations = [
      { id: "gs-ppf", pct: 25 },
      { id: "fi-fd-bank", pct: 20 },
      { id: "mf-index", pct: 20 },
      { id: "cash-liquid-fund", pct: 15 },
      { id: "alt-sgb", pct: 10 },
      { id: "gs-nps", pct: 10 },
    ];
  } else if (riskScore < 65) {
    // Moderate
    allocations = [
      { id: "mf-index", pct: 30 },
      { id: "mf-flexi", pct: 20 },
      { id: "gs-ppf", pct: 15 },
      { id: "fi-fd-bank", pct: 10 },
      { id: "mf-elss", pct: 10 },
      { id: "alt-sgb", pct: 10 },
      { id: "gs-nps", pct: 5 },
    ];
  } else {
    // Aggressive
    allocations = [
      { id: "mf-flexi", pct: 25 },
      { id: "eq-largecap", pct: 20 },
      { id: "mf-index", pct: 15 },
      { id: "eq-midcap", pct: 15 },
      { id: "mf-elss", pct: 10 },
      { id: "mf-international", pct: 10 },
      { id: "alt-crypto", pct: 5 },
    ];
  }

  return allocations
    .map((a) => {
      const opt = INVESTMENT_OPTIONS.find((o) => o.id === a.id)!;
      return {
        option: opt,
        allocationPct: a.pct,
        monthlySip: Math.round((totalMonthly * a.pct) / 100),
      };
    })
    .filter((a) => a.option);
}

// Tax-saving options ranked by benefit
export const TAX_SAVING_PRIORITY: string[] = [
  "gs-ppf", // 80C + EEE
  "mf-elss", // 80C + highest returns
  "gs-nps", // 80C + extra 80CCD(1B) ₹50k
  "fi-fd-bank", // 80C (5-yr tax saver FD)
  "gs-nsc", // 80C
  "gs-ssy", // 80C + EEE (girl child)
];
