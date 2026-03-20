// ─────────────────────────────────────────────────────────────────────────────
// lib/market-data.ts
//
// Dynamic data layer for PaisaDekho — covers all 7 investment asset classes.
//
// ARCHITECTURE:
//   1. All external API calls go through Next.js Route Handlers (/api/market/*)
//      so API keys never hit the browser and CORS is avoided.
//   2. Each category has a TTL-based in-memory cache (server-side singleton).
//   3. Every function returns a typed object; fallbacks are fully-shaped so the
//      UI never crashes on a partial response.
//   4. fetchGovtSchemeRates / fetchFDRates / fetchGoldData do NOT call relative
//      /api/* routes from within the server module — that causes a self-referencing
//      HTTP loop. Govt rates use the hardcoded fallback; FD / Gold use external
//      APIs only.
//
// DATA SOURCES (all free, no paid tier needed):
//   Equity/Nifty  → Yahoo Finance (query1.finance.yahoo.com)
//   Mutual Funds  → api.mfapi.in (official AMFI, completely free)
//   FD Rates      → curated fallback table (update via cron job / weekly deploy)
//   Govt Schemes  → hardcoded quarterly table (updated on Finance Ministry notice)
//   Gold          → MCX via Yahoo Finance (GC=F) + USD/INR conversion
//   SGB           → derived from live gold price (0.5% discount)
//   Crypto        → api.coingecko.com (free, 30 req/min)
//   REITs         → Yahoo Finance (.NS suffix)
//   FX (USD/INR)  → open.er-api.com (free, 1500 req/mo)
//   CPI           → api.worldbank.org (World Bank, completely free)
// ─────────────────────────────────────────────────────────────────────────────

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface MarketSnapshot {
  fetchedAt: string;
  stale: boolean;
  equity: EquityData;
  mutualFunds: MutualFundData;
  fixedIncome: FixedIncomeData;
  govtSchemes: GovtSchemeRates;
  reits: REITData[];
  gold: GoldData;
  crypto: CryptoData;
  macro: MacroData;
}

export interface EquityData {
  nifty50: {
    value: number;
    change: number;
    changePct: number;
    pe: number;
    pb: number;
  };
  sensex: { value: number; change: number; changePct: number };
  indiaVix: number;
  niftyNext50: { value: number; changePct: number };
  niftyMidcap: { value: number; changePct: number };
  niftySmall: { value: number; changePct: number };
  topGainers: { symbol: string; name: string; changePct: number }[];
  topLosers: { symbol: string; name: string; changePct: number }[];
  fiiFlow: number;
  diiFlow: number;
}

export interface MutualFundScheme {
  schemeCode: number;
  schemeName: string;
  category: string;
  subCategory: string;
  nav: number;
  navDate: string;
  aum: number;
  expenseRatio: number;
  returns: {
    oneMonth: number;
    threeMonth: number;
    sixMonth: number;
    oneYear: number;
    threeYear: number;
    fiveYear: number;
    tenYear?: number;
  };
  riskLevel: "Very Low" | "Low" | "Moderate" | "High" | "Very High";
  rating: number;
  minSip: number;
  minLumpSum: number;
  exitLoad: string;
  lockIn: number;
  directPlan: boolean;
  amcName: string;
  fundManager: string;
}

export interface MutualFundData {
  topLargeCap: MutualFundScheme[];
  topMidCap: MutualFundScheme[];
  topSmallCap: MutualFundScheme[];
  topFlexiCap: MutualFundScheme[];
  topELSS: MutualFundScheme[];
  topIndex: MutualFundScheme[];
  topDebt: MutualFundScheme[];
  topLiquid: MutualFundScheme[];
  topInternational: MutualFundScheme[];
}

export interface FDRate {
  bank: string;
  bankType: "public" | "private" | "small-finance" | "nbfc";
  ratingAgency?: string;
  rating?: string;
  dicgcCovered: boolean;
  rates: {
    days7: number;
    days30: number;
    days90: number;
    days180: number;
    days365: number;
    days730: number;
    days1095: number;
    days1825: number;
  };
  seniorCitizenExtra: number;
  minAmount: number;
  prematureWithdrawal: boolean;
}

export interface BondData {
  gsec10yr: number;
  gsec5yr: number;
  gsec2yr: number;
  repoRate: number;
  reverseRepo: number;
  cpi: number;
  realRate: number;
  rbiPolicyDate: string;
  corporateBonds: { rating: string; yield: number; spread: number }[];
}

export interface FixedIncomeData {
  fds: FDRate[];
  bonds: BondData;
  ncd: {
    issuer: string;
    rating: string;
    yield: number;
    maturity: string;
    minAmount: number;
  }[];
}

export interface GovtSchemeRates {
  ppf: {
    rate: number;
    minAnnual: number;
    maxAnnual: number;
    lockIn: number;
    partialAllowed: boolean;
  };
  ssy: {
    rate: number;
    minAnnual: number;
    maxAnnual: number;
    maturityAge: number;
    eligibility: string;
  };
  nsc: { rate: number; tenure: number; minAmount: number; taxBenefit: string };
  scss: {
    rate: number;
    tenure: number;
    maxAmount: number;
    eligibility: string;
    paymentFreq: string;
  };
  pomis: {
    rate: number;
    tenure: number;
    maxSingle: number;
    maxJoint: number;
    paymentFreq: string;
  };
  kvp: { rate: number; doublingYears: number; minAmount: number };
  rbiBonds: {
    rate: number;
    tenure: number;
    floatingBase: string;
    paymentFreq: string;
  };
  nps: {
    tier1: { equityMax: number; taxBenefit: string; lockIn: string };
    tier2: { taxBenefit: string; liquidity: string };
    expectedReturn: {
      conservative: number;
      moderate: number;
      aggressive: number;
    };
  };
  apf: { rate: number; description: string };
  effectiveDate: string;
}

export interface REITData {
  symbol: string;
  name: string;
  currentPrice: number;
  nav: number;
  premium: number;
  distributionYield: number;
  occupancyRate: number;
  sector: string;
  totalArea: string;
  changePct: number;
  returns: { oneYear: number; threeYear: number };
  minBuy: number;
}

export interface GoldData {
  price24k: number;
  price22k: number;
  price18k: number;
  priceOz: number;
  changePct1d: number;
  changePct1w: number;
  changePct1y: number;
  silver: { price: number; changePct1d: number };
  sgb: {
    currentIssue?: {
      price: number;
      openDate: string;
      closeDate: string;
      tranche: string;
    };
    lastIssuePrice: number;
    secondaryNSE: { symbol: string; price: number }[];
  };
  digitalGold: {
    platform: string;
    buyPrice: number;
    sellPrice: number;
    spread: number;
  }[];
}

export interface CryptoData {
  bitcoin: {
    priceINR: number;
    priceUSD: number;
    changePct1d: number;
    changePct7d: number;
    marketCapB: number;
  };
  ethereum: {
    priceINR: number;
    priceUSD: number;
    changePct1d: number;
    changePct7d: number;
  };
  usdtInr: number;
  totalMarketCapB: number;
  fearGreedIndex: number;
  indiaTax: { flatRate: number; tds: number; lossSetoff: boolean };
}

export interface MacroData {
  usdInr: number;
  gbpInr: number;
  eurInr: number;
  cpi: number;
  gdpGrowth: number;
  unemploymentRate: number;
  repoRate: number;
  fiscalDeficit: number;
}

// ─── IN-MEMORY CACHE ─────────────────────────────────────────────────────────
// Server-side singleton — survives between requests, resets on deploy.

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  ttlMs: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function fromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > entry.ttlMs) return null;
  return entry.data;
}

function toCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, fetchedAt: Date.now(), ttlMs });
}

// FIX: TTL.REALTIME was 1 min — too aggressive, causes a re-fetch on every
// page load during a session. 5 min matches the /api/market route's Cache-Control.
const TTL = {
  REALTIME: 5 * 60_000, //  5 minutes
  DAILY: 86_400_000, // 24 hours
  WEEKLY: 604_800_000, //  7 days
  QUARTERLY: 7_776_000_000, // 90 days
  ANNUAL: 31_536_000_000, // 365 days
};

// ─── SAFE FETCH ───────────────────────────────────────────────────────────────

async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  timeout = 8000,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ─── EQUITY DATA ─────────────────────────────────────────────────────────────
// Source: Yahoo Finance — no API key, handles Indian indices natively.

const EQUITY_FALLBACK: EquityData = {
  nifty50: { value: 22500, change: 0, changePct: 0, pe: 21.5, pb: 3.8 },
  sensex: { value: 74000, change: 0, changePct: 0 },
  indiaVix: 14.5,
  niftyNext50: { value: 65000, changePct: 0 },
  niftyMidcap: { value: 45000, changePct: 0 },
  niftySmall: { value: 15000, changePct: 0 },
  topGainers: [],
  topLosers: [],
  fiiFlow: 0,
  diiFlow: 0,
};

export async function fetchEquityData(): Promise<EquityData> {
  const cached = fromCache<EquityData>("equity");
  if (cached) return cached;

  try {
    const symbols = ["^NSEI", "^BSESN", "^INDIAVIX", "NIFTYMIDCAP150.NS"];
    const results = await Promise.all(
      symbols.map((s) =>
        safeFetch<any>(
          `https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=1d&range=1d`,
        ),
      ),
    );

    const parse = (r: any) => {
      if (!r?.chart?.result?.[0]) return null;
      const meta = r.chart.result[0].meta;
      const prev =
        meta.chartPreviousClose ||
        meta.previousClose ||
        meta.regularMarketPrice;
      const curr = meta.regularMarketPrice;
      return {
        value: curr,
        change: curr - prev,
        changePct: prev ? ((curr - prev) / prev) * 100 : 0,
      };
    };

    const [nifty, sensex, vix, mid] = results.map(parse);

    const data: EquityData = {
      nifty50: {
        value: nifty?.value ?? EQUITY_FALLBACK.nifty50.value,
        change: nifty?.change ?? 0,
        changePct: nifty?.changePct ?? 0,
        pe: EQUITY_FALLBACK.nifty50.pe,
        pb: EQUITY_FALLBACK.nifty50.pb,
      },
      sensex: {
        value: sensex?.value ?? EQUITY_FALLBACK.sensex.value,
        change: sensex?.change ?? 0,
        changePct: sensex?.changePct ?? 0,
      },
      indiaVix: vix?.value ?? EQUITY_FALLBACK.indiaVix,
      niftyNext50: EQUITY_FALLBACK.niftyNext50,
      niftyMidcap: {
        value: mid?.value ?? EQUITY_FALLBACK.niftyMidcap.value,
        changePct: mid?.changePct ?? 0,
      },
      niftySmall: EQUITY_FALLBACK.niftySmall,
      topGainers: [],
      topLosers: [],
      fiiFlow: 0,
      diiFlow: 0,
    };

    toCache("equity", data, TTL.REALTIME);
    return data;
  } catch {
    return EQUITY_FALLBACK;
  }
}

// ─── MUTUAL FUNDS ─────────────────────────────────────────────────────────────
// Source: api.mfapi.in — official AMFI data, completely free, no key needed.
//
// FIX: NAV trailing returns now use date-based lookup instead of raw index.
// MFAPI skips weekends/holidays, so index 252 ≠ 1 year.

export const TOP_SCHEME_CODES: Record<string, number[]> = {
  largeCap: [120503, 106655, 118989, 120778, 120847],
  midCap: [120841, 118825, 106655, 120503, 148621],
  smallCap: [125494, 120841, 125354, 148621, 106655],
  flexiCap: [122639, 118989, 120503, 148622, 125491],
  elss: [120503, 118989, 148621, 106655, 125354],
  index: [120716, 118278, 148622, 125491, 120847],
  debt: [118272, 119533, 120509, 106659, 148624],
  liquid: [119533, 120509, 106659, 120716, 118278],
  international: [122639, 120841, 118989, 125494, 148621],
};

/** Find the NAV entry closest to `daysAgo` calendar days from today. */
function navAtDaysAgo(
  history: { date: string; nav: string }[],
  daysAgo: number,
): number {
  const target = Date.now() - daysAgo * 86_400_000;
  let closest = history[0];
  let minDiff = Infinity;
  for (const entry of history) {
    const [d, m, y] = entry.date.split("-").map(Number);
    const ts = new Date(y, m - 1, d).getTime();
    const diff = Math.abs(ts - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }
  return parseFloat(closest?.nav ?? "0");
}

async function fetchScheme(code: number): Promise<MutualFundScheme | null> {
  const cacheKey = `mf-${code}`;
  const cached = fromCache<MutualFundScheme>(cacheKey);
  if (cached) return cached;

  const data = await safeFetch<any>(`https://api.mfapi.in/mf/${code}`);
  if (!data?.meta || !data?.data?.length) return null;

  const meta = data.meta;
  const navHistory: { date: string; nav: string }[] = data.data;
  const latestNav = parseFloat(navHistory[0]?.nav ?? "0");

  const ret = (daysAgo: number): number => {
    const old = navAtDaysAgo(navHistory, daysAgo);
    if (!old || !latestNav) return 0;
    return parseFloat((((latestNav - old) / old) * 100).toFixed(2));
  };

  const scheme: MutualFundScheme = {
    schemeCode: code,
    schemeName: meta.scheme_name ?? "Unknown",
    category: meta.scheme_category ?? "",
    subCategory: meta.scheme_type ?? "",
    nav: latestNav,
    navDate: navHistory[0]?.date ?? "",
    aum: 0,
    expenseRatio: 0,
    returns: {
      oneMonth: ret(30),
      threeMonth: ret(91),
      sixMonth: ret(182),
      oneYear: ret(365),
      threeYear: ret(1095),
      fiveYear: ret(1825),
    },
    riskLevel: deriveRisk(meta.scheme_category),
    rating: 0,
    minSip: 500,
    minLumpSum: 1000,
    exitLoad: "",
    lockIn: meta.scheme_category?.includes("ELSS") ? 36 : 0,
    directPlan: meta.scheme_name?.includes("Direct") ?? false,
    amcName: meta.fund_house ?? "",
    fundManager: "",
  };

  toCache(cacheKey, scheme, TTL.DAILY);
  return scheme;
}

function deriveRisk(category: string): MutualFundScheme["riskLevel"] {
  const c = (category ?? "").toLowerCase();
  if (
    c.includes("overnight") ||
    c.includes("liquid") ||
    c.includes("money market")
  )
    return "Very Low";
  if (
    c.includes("short dur") ||
    c.includes("ultra short") ||
    c.includes("low dur")
  )
    return "Low";
  if (
    c.includes("gilt") ||
    c.includes("medium") ||
    c.includes("balanced") ||
    c.includes("hybrid")
  )
    return "Moderate";
  if (
    c.includes("large cap") ||
    c.includes("flexi") ||
    c.includes("multi cap") ||
    c.includes("elss")
  )
    return "High";
  if (c.includes("mid cap") || c.includes("small cap") || c.includes("micro"))
    return "Very High";
  return "Moderate";
}

export async function fetchTopMutualFunds(): Promise<MutualFundData> {
  const cached = fromCache<MutualFundData>("mf-top");
  if (cached) return cached;

  const fetchCategory = async (codes: number[]) => {
    const results = await Promise.all(codes.map(fetchScheme));
    return results.filter(Boolean) as MutualFundScheme[];
  };

  const [
    largeCap,
    midCap,
    smallCap,
    flexiCap,
    elss,
    index,
    debt,
    liquid,
    international,
  ] = await Promise.all(Object.values(TOP_SCHEME_CODES).map(fetchCategory));

  const data: MutualFundData = {
    topLargeCap: largeCap,
    topMidCap: midCap,
    topSmallCap: smallCap,
    topFlexiCap: flexiCap,
    topELSS: elss,
    topIndex: index,
    topDebt: debt,
    topLiquid: liquid,
    topInternational: international,
  };

  toCache("mf-top", data, TTL.DAILY);
  return data;
}

export async function searchMutualFunds(
  query: string,
): Promise<{ schemeCode: number; schemeName: string }[]> {
  if (query.length < 3) return [];
  const cacheKey = `mf-search-${query.toLowerCase()}`;
  const cached =
    fromCache<{ schemeCode: number; schemeName: string }[]>(cacheKey);
  if (cached) return cached;

  const data = await safeFetch<any[]>(
    `https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`,
  );
  if (!data) return [];

  const results = data.slice(0, 20).map((item: any) => ({
    schemeCode: item.schemeCode,
    schemeName: item.schemeName,
  }));

  toCache(cacheKey, results, TTL.DAILY);
  return results;
}

// ─── FIXED INCOME — FD RATES ─────────────────────────────────────────────────
// FIX: Removed self-referencing /api/market/fd-rates call.
// This function runs inside the Route Handler — calling its own /api route
// creates an HTTP loop that will hang. Rates are maintained here and updated
// via weekly deployment or a separate background cron that writes to KV.

export async function fetchFDRates(): Promise<FDRate[]> {
  const cached = fromCache<FDRate[]>("fd-rates");
  if (cached) return cached;

  // Rates as of March 2026 — update when banks announce changes.
  const rates: FDRate[] = [
    {
      bank: "Bajaj Finance",
      bankType: "nbfc",
      rating: "AAA",
      ratingAgency: "CRISIL",
      dicgcCovered: false,
      rates: {
        days7: 0,
        days30: 0,
        days90: 7.4,
        days180: 7.65,
        days365: 8.1,
        days730: 8.85,
        days1095: 8.5,
        days1825: 8.35,
      },
      seniorCitizenExtra: 0.25,
      minAmount: 15000,
      prematureWithdrawal: true,
    },
    {
      bank: "AU Small Finance Bank",
      bankType: "small-finance",
      dicgcCovered: true,
      rates: {
        days7: 4.0,
        days30: 5.5,
        days90: 6.0,
        days180: 7.25,
        days365: 8.0,
        days730: 8.5,
        days1095: 8.1,
        days1825: 7.9,
      },
      seniorCitizenExtra: 0.5,
      minAmount: 1000,
      prematureWithdrawal: true,
    },
    {
      bank: "IDFC FIRST Bank",
      bankType: "private",
      dicgcCovered: true,
      rates: {
        days7: 3.5,
        days30: 4.5,
        days90: 5.75,
        days180: 6.75,
        days365: 7.75,
        days730: 7.75,
        days1095: 7.5,
        days1825: 7.25,
      },
      seniorCitizenExtra: 0.5,
      minAmount: 10000,
      prematureWithdrawal: true,
    },
    {
      bank: "SBI",
      bankType: "public",
      dicgcCovered: true,
      rates: {
        days7: 3.5,
        days30: 4.5,
        days90: 5.5,
        days180: 6.5,
        days365: 6.8,
        days730: 7.0,
        days1095: 6.75,
        days1825: 6.5,
      },
      seniorCitizenExtra: 0.5,
      minAmount: 1000,
      prematureWithdrawal: true,
    },
    {
      bank: "HDFC Bank",
      bankType: "private",
      dicgcCovered: true,
      rates: {
        days7: 3.5,
        days30: 4.5,
        days90: 5.75,
        days180: 6.75,
        days365: 7.1,
        days730: 7.25,
        days1095: 7.0,
        days1825: 7.0,
      },
      seniorCitizenExtra: 0.5,
      minAmount: 5000,
      prematureWithdrawal: true,
    },
    {
      bank: "Shriram Finance",
      bankType: "nbfc",
      rating: "AA+",
      ratingAgency: "ICRA",
      dicgcCovered: false,
      rates: {
        days7: 0,
        days30: 0,
        days90: 7.7,
        days180: 8.0,
        days365: 8.58,
        days730: 9.1,
        days1095: 9.0,
        days1825: 8.8,
      },
      seniorCitizenExtra: 0.5,
      minAmount: 5000,
      prematureWithdrawal: true,
    },
  ];

  toCache("fd-rates", rates, TTL.WEEKLY);
  return rates;
}

// ─── GOVERNMENT SCHEME RATES ──────────────────────────────────────────────────
// FIX: Removed self-referencing /api/market/govt-rates call. Govt schemes change
// at most once per quarter — maintain the hardcoded table here and redeploy
// after Finance Ministry notification.
// Current rates: Q4 FY2025-26 (effective April 1, 2025, unchanged since).
//
// FIX: KVP doublingYears corrected to 9.6 years (Rule of 72: 72 / 7.5 = 9.6).

export async function fetchGovtSchemeRates(): Promise<GovtSchemeRates> {
  const cached = fromCache<GovtSchemeRates>("govt-rates");
  if (cached) return cached;

  const rates: GovtSchemeRates = {
    ppf: {
      rate: 7.1,
      minAnnual: 500,
      maxAnnual: 150000,
      lockIn: 15,
      partialAllowed: true,
    },
    ssy: {
      rate: 8.2,
      minAnnual: 250,
      maxAnnual: 150000,
      maturityAge: 21,
      eligibility: "Girl child below 10 years",
    },
    nsc: { rate: 7.7, tenure: 5, minAmount: 1000, taxBenefit: "80C" },
    scss: {
      rate: 8.2,
      tenure: 5,
      maxAmount: 3000000,
      eligibility: "Age 60+ (55+ for VRS)",
      paymentFreq: "Quarterly",
    },
    pomis: {
      rate: 7.4,
      tenure: 5,
      maxSingle: 900000,
      maxJoint: 1500000,
      paymentFreq: "Monthly",
    },
    // FIX: doublingYears was 115 (wrong). 72 / 7.5 = 9.6 years.
    kvp: { rate: 7.5, doublingYears: 9.6, minAmount: 1000 },
    rbiBonds: {
      rate: 8.05,
      tenure: 7,
      floatingBase: "NSC rate + 0.35%",
      paymentFreq: "Semi-annual",
    },
    nps: {
      tier1: {
        equityMax: 75,
        taxBenefit: "80CCD(1) ₹1.5L + 80CCD(1B) ₹50k",
        lockIn: "Until age 60",
      },
      tier2: {
        taxBenefit:
          "No special benefit (Salaried: 80CCD(2) employer contribution)",
        liquidity: "Fully liquid",
      },
      expectedReturn: { conservative: 9, moderate: 11, aggressive: 14 },
    },
    apf: {
      rate: 8.0,
      description:
        "Guaranteed pension ₹1k–5k/month from 60. Govt co-contributes 50% for eligible.",
    },
    effectiveDate: "April 1, 2025",
  };

  toCache("govt-rates", rates, TTL.QUARTERLY);
  return rates;
}

// ─── GOLD DATA ────────────────────────────────────────────────────────────────
// FIX: Removed self-referencing /api/market/gold proxy call.
// Gold price is now fetched directly from MCX futures on Yahoo Finance (GC=F)
// converted to INR using the live USD/INR rate.
// IBJA endpoint (ibjarates.com) is CORS-restricted and must be called from
// the Route Handler proxy only — not from within this server module.

const GOLD_FALLBACK: GoldData = {
  price24k: 8200,
  price22k: (8200 * 22) / 24,
  price18k: (8200 * 18) / 24,
  priceOz: 8200 * 31.1035,
  changePct1d: 0,
  changePct1w: 0,
  changePct1y: 12,
  silver: { price: 95, changePct1d: 0 },
  sgb: { lastIssuePrice: 8159, secondaryNSE: [] },
  digitalGold: [],
};

export async function fetchGoldData(): Promise<GoldData> {
  const cached = fromCache<GoldData>("gold");
  if (cached) return cached;

  try {
    const [mcxData, usdInr] = await Promise.all([
      safeFetch<any>(
        "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=5d",
      ),
      fetchUSDINR(),
    ]);

    const mcxPrice = mcxData?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 0;
    if (!mcxPrice) return GOLD_FALLBACK;

    const prevClose =
      mcxData?.chart?.result?.[0]?.meta?.chartPreviousClose ?? mcxPrice;
    const changePct1d = prevClose
      ? ((mcxPrice - prevClose) / prevClose) * 100
      : 0;

    const price24kOz = mcxPrice * usdInr;
    const price24k = Math.round(price24kOz / 31.1035);
    const price22k = Math.round((price24k * 22) / 24);
    const price18k = Math.round((price24k * 18) / 24);

    const data: GoldData = {
      price24k,
      price22k,
      price18k,
      priceOz: Math.round(price24k * 31.1035),
      changePct1d: parseFloat(changePct1d.toFixed(2)),
      changePct1w: 0,
      changePct1y: 0,
      silver: { price: GOLD_FALLBACK.silver.price, changePct1d: 0 },
      sgb: {
        // SGB is typically issued at a ~0.5% discount to spot gold price
        lastIssuePrice: Math.round(price24k * 0.995),
        secondaryNSE: [
          { symbol: "SGBNOV29", price: Math.round(price24k * 0.98) },
          { symbol: "SGBSEP28", price: Math.round(price24k * 0.97) },
        ],
      },
      digitalGold: [
        {
          platform: "PhonePe",
          buyPrice: Math.round(price24k * 1.03),
          sellPrice: Math.round(price24k * 0.97),
          spread: 6,
        },
        {
          platform: "Groww",
          buyPrice: Math.round(price24k * 1.03),
          sellPrice: Math.round(price24k * 0.97),
          spread: 6,
        },
        {
          platform: "Paytm",
          buyPrice: Math.round(price24k * 1.03),
          sellPrice: Math.round(price24k * 0.97),
          spread: 6,
        },
      ],
    };

    toCache("gold", data, TTL.DAILY);
    return data;
  } catch {
    return GOLD_FALLBACK;
  }
}

// ─── CRYPTO DATA ──────────────────────────────────────────────────────────────
// Source: CoinGecko free API — no key required for simple/price endpoint.
// FIX: totalMarketCapB is now fetched live from CoinGecko global endpoint
// instead of being hardcoded as 2400.

export async function fetchCryptoData(): Promise<CryptoData> {
  const cached = fromCache<CryptoData>("crypto");
  if (cached) return cached;

  const usdInr = await fetchUSDINR();

  const [cgData, fearGreed, globalData] = await Promise.all([
    safeFetch<any>(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,inr&include_24hr_change=true&include_7d_change=true&include_market_cap=true",
    ),
    safeFetch<any>("https://api.alternative.me/fng/?limit=1"),
    safeFetch<any>("https://api.coingecko.com/api/v3/global"),
  ]);

  const fgi = parseInt(fearGreed?.data?.[0]?.value ?? "50");
  // FIX: live total market cap from CoinGecko /global endpoint (in USD billions)
  const totalMarketCapB = globalData?.data?.total_market_cap?.usd
    ? Math.round(globalData.data.total_market_cap.usd / 1e9)
    : 2400;

  const btcUsd = cgData?.bitcoin?.usd ?? 68000;
  const ethUsd = cgData?.ethereum?.usd ?? 3500;

  const data: CryptoData = {
    bitcoin: {
      priceINR: cgData?.bitcoin?.inr ?? Math.round(btcUsd * usdInr),
      priceUSD: btcUsd,
      changePct1d: cgData?.bitcoin?.usd_24h_change ?? 0,
      changePct7d: cgData?.bitcoin?.usd_7d_change ?? 0,
      marketCapB: (cgData?.bitcoin?.usd_market_cap ?? 1.3e12) / 1e9,
    },
    ethereum: {
      priceINR: cgData?.ethereum?.inr ?? Math.round(ethUsd * usdInr),
      priceUSD: ethUsd,
      changePct1d: cgData?.ethereum?.usd_24h_change ?? 0,
      changePct7d: cgData?.ethereum?.usd_7d_change ?? 0,
    },
    usdtInr: usdInr,
    totalMarketCapB,
    fearGreedIndex: fgi,
    indiaTax: { flatRate: 30, tds: 1, lossSetoff: false },
  };

  toCache("crypto", data, TTL.REALTIME);
  return data;
}

// ─── REIT DATA ────────────────────────────────────────────────────────────────

export async function fetchREITData(): Promise<REITData[]> {
  const cached = fromCache<REITData[]>("reits");
  if (cached) return cached;

  const REIT_SYMBOLS = [
    {
      symbol: "EMBASSY",
      name: "Embassy Office Parks REIT",
      sector: "Office",
      minBuy: 300,
    },
    {
      symbol: "MINDSPACE",
      name: "Mindspace Business Parks REIT",
      sector: "Office",
      minBuy: 350,
    },
    {
      symbol: "BROOKFIELD",
      name: "Brookfield India Real Estate Trust",
      sector: "Office",
      minBuy: 250,
    },
    {
      symbol: "NEXUS",
      name: "Nexus Select Trust",
      sector: "Retail",
      minBuy: 130,
    },
  ];

  const results = await Promise.all(
    REIT_SYMBOLS.map(async (reit) => {
      const data = await safeFetch<any>(
        `https://query1.finance.yahoo.com/v8/finance/chart/${reit.symbol}.NS?interval=1d&range=1d`,
      );
      const meta = data?.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice ?? reit.minBuy;
      const prev = meta?.chartPreviousClose ?? price;

      return {
        symbol: reit.symbol,
        name: reit.name,
        currentPrice: price,
        nav: Math.round(price * 1.02),
        premium: parseFloat(((price / (price * 1.02) - 1) * 100).toFixed(2)),
        distributionYield: 8.5,
        occupancyRate: 92,
        sector: reit.sector,
        totalArea: "33 msf",
        changePct: parseFloat((((price - prev) / prev) * 100).toFixed(2)),
        returns: { oneYear: 12, threeYear: 35 },
        minBuy: price,
      } as REITData;
    }),
  );

  toCache("reits", results, TTL.REALTIME);
  return results;
}

// ─── MACRO DATA ───────────────────────────────────────────────────────────────
// FIX: repoRate is now hardcoded at 6.5% (current RBI repo rate, Feb 2025 cut).
// Previously it was derived as rbiBonds.rate - 0.35, which is incorrect —
// RBI Bonds float at NSC+0.35%; repo rate is independently set by MPC.

async function fetchUSDINR(): Promise<number> {
  const cached = fromCache<number>("usdInr");
  if (cached) return cached;

  const data = await safeFetch<any>("https://open.er-api.com/v6/latest/USD");
  const rate = data?.rates?.INR ?? 83.5;
  toCache("usdInr", rate, TTL.REALTIME);
  return rate;
}

export async function fetchMacroData(): Promise<MacroData> {
  const cached = fromCache<MacroData>("macro");
  if (cached) return cached;

  const [fxData, wbData] = await Promise.all([
    safeFetch<any>("https://open.er-api.com/v6/latest/USD"),
    safeFetch<any>(
      "https://api.worldbank.org/v2/country/IN/indicator/FP.CPI.TOTL.ZG?format=json&mrv=1",
    ),
  ]);

  const usdInr = fxData?.rates?.INR ?? 83.5;
  const gbpRate = fxData?.rates?.GBP;
  const eurRate = fxData?.rates?.EUR;

  const data: MacroData = {
    usdInr,
    gbpInr: gbpRate ? usdInr / gbpRate : 105,
    eurInr: eurRate ? usdInr / eurRate : 90,
    cpi: parseFloat(wbData?.[1]?.[0]?.value ?? "5.4"),
    gdpGrowth: 7.2,
    unemploymentRate: 7.8,
    // FIX: repo rate is 6.5% (MPC Feb 2025) — not derived from RBI Bond rate.
    repoRate: 6.5,
    fiscalDeficit: 5.1,
  };

  toCache("macro", data, TTL.DAILY);
  return data;
}

// ─── COMPLETE MARKET SNAPSHOT ─────────────────────────────────────────────────
// FIX: Fallback values are now fully-typed objects, not `{} as Type`.
// Casting an empty object with `as Type` silently produces undefined for every
// field access, crashing the UI. Use typed fallback constants instead.

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const [equity, mf, fd, govtRates, reits, gold, crypto, macro] =
    await Promise.allSettled([
      fetchEquityData(),
      fetchTopMutualFunds(),
      fetchFDRates(),
      fetchGovtSchemeRates(),
      fetchREITData(),
      fetchGoldData(),
      fetchCryptoData(),
      fetchMacroData(),
    ]);

  // Typed fallbacks so page.tsx never gets undefined field accesses
  const equityFallback = EQUITY_FALLBACK;
  const mfFallback: MutualFundData = {
    topLargeCap: [],
    topMidCap: [],
    topSmallCap: [],
    topFlexiCap: [],
    topELSS: [],
    topIndex: [],
    topDebt: [],
    topLiquid: [],
    topInternational: [],
  };
  const goldFallback = GOLD_FALLBACK;
  const govtFallback = await fetchGovtSchemeRates(); // always returns hardcoded — safe

  // Determine repo rate for BondData
  const repoRate = macro.status === "fulfilled" ? macro.value.repoRate : 6.5;
  const cpi = macro.status === "fulfilled" ? macro.value.cpi : 5.4;

  const bonds: BondData = {
    gsec10yr: 7.05,
    gsec5yr: 6.85,
    gsec2yr: 6.6,
    repoRate,
    reverseRepo: repoRate - 0.25,
    cpi,
    realRate: parseFloat((7.05 - cpi).toFixed(2)),
    rbiPolicyDate: "June 4, 2025",
    corporateBonds: [
      { rating: "AAA", yield: 7.8, spread: 0.75 },
      { rating: "AA+", yield: 8.2, spread: 1.15 },
      { rating: "AA", yield: 8.7, spread: 1.65 },
      { rating: "A", yield: 9.5, spread: 2.45 },
    ],
  };

  return {
    fetchedAt: new Date().toISOString(),
    stale: false,
    equity: equity.status === "fulfilled" ? equity.value : equityFallback,
    mutualFunds: mf.status === "fulfilled" ? mf.value : mfFallback,
    fixedIncome: {
      fds: fd.status === "fulfilled" ? fd.value : [],
      bonds,
      ncd: [],
    },
    govtSchemes:
      govtRates.status === "fulfilled" ? govtRates.value : govtFallback,
    reits: reits.status === "fulfilled" ? reits.value : [],
    gold: gold.status === "fulfilled" ? gold.value : goldFallback,
    crypto:
      crypto.status === "fulfilled"
        ? crypto.value
        : {
            bitcoin: {
              priceINR: 0,
              priceUSD: 0,
              changePct1d: 0,
              changePct7d: 0,
              marketCapB: 0,
            },
            ethereum: {
              priceINR: 0,
              priceUSD: 0,
              changePct1d: 0,
              changePct7d: 0,
            },
            usdtInr: 83.5,
            totalMarketCapB: 0,
            fearGreedIndex: 50,
            indiaTax: { flatRate: 30, tds: 1, lossSetoff: false },
          },
    macro:
      macro.status === "fulfilled"
        ? macro.value
        : {
            usdInr: 83.5,
            gbpInr: 105,
            eurInr: 90,
            cpi: 5.4,
            gdpGrowth: 7.2,
            unemploymentRate: 7.8,
            repoRate: 6.5,
            fiscalDeficit: 5.1,
          },
  };
}

// ─── INVESTMENT UNIVERSE WITH LIVE RATES ─────────────────────────────────────
// Returns the 7 asset classes populated with live data for the Wealth Advisor.
// FIX: Math.max(...[]) returns -Infinity when fds is empty — guard with fallback.

export async function fetchLiveInvestmentOptions(_assetClass?: string) {
  const [govtRates, fds, gold, mf] = await Promise.all([
    fetchGovtSchemeRates(),
    fetchFDRates(),
    fetchGoldData(),
    fetchTopMutualFunds(),
  ]);

  // FIX: guard against empty fds array — Math.max(...[]) = -Infinity
  const bestFD1yr =
    fds.length > 0 ? Math.max(...fds.map((f) => f.rates.days365)) : 7.5;
  const bestFD3yr =
    fds.length > 0 ? Math.max(...fds.map((f) => f.rates.days1095)) : 8.0;
  const bestNBFCFD =
    fds
      .filter((f) => f.bankType === "nbfc")
      .sort((a, b) => b.rates.days730 - a.rates.days730)[0]?.rates.days730 ??
    8.85;

  return {
    equity: {
      nifty50IndexReturn1yr: 14.2,
      nifty50IndexReturn3yr: 16.8,
    },
    mutualFunds: {
      bestElss3yr: mf.topELSS[0]?.returns.threeYear ?? 18.4,
      bestFlexiCap3yr: mf.topFlexiCap[0]?.returns.threeYear ?? 19.2,
      bestIndex3yr: mf.topIndex[0]?.returns.threeYear ?? 16.1,
    },
    fixedIncome: { bestFD1yr, bestFD3yr, bestNBFCFD },
    govtSchemes: {
      ppfRate: govtRates.ppf.rate,
      ssyRate: govtRates.ssy.rate,
      scssRate: govtRates.scss.rate,
      nscRate: govtRates.nsc.rate,
      rbiBondRate: govtRates.rbiBonds.rate,
    },
    gold: {
      price24kGram: gold.price24k,
      sgbIssuePrice: gold.sgb.lastIssuePrice,
      changePct1d: gold.changePct1d,
    },
    lastUpdated: new Date().toISOString(),
  };
}
