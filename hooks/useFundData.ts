"use client";

import { useState, useEffect, useCallback } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface FundData {
  schemeCode?: number;
  schemeName: string;
  amcName?: string;
  category: string;
  displayCategory?: string;
  riskLevel?: string;
  nav: number;
  returns: {
    oneYear: number | null;
    threeYear: number | null;
    fiveYear: number | null;
  };
  aum?: number; // Add this
  expenseRatio?: number; // Add this
}
export interface IpoData {
  id: string;
  company: string;
  status: "ongoing" | "upcoming" | "listed";
  priceRange: string;
  lotSize: string;
  opens: string;
  closes: string;
  issue: string;
  listing: string;
  logo: string;
  accent: string;
  gradient: string;
}
/** All live rates the smart-engine's LiveRates interface expects */
export interface LiveRates {
  govtSchemes: {
    ppf: { rate: number; description: string };
    ssy: { rate: number; description: string };
    scss: { rate: number; description: string };
    nsc: { rate: number; description: string };
    pomis: { rate: number; description: string };
    rbiBonds: { rate: number; description: string };
    nsc5yr: { rate: number; description: string };
    kvp: { rate: number; description: string };
    td1yr: { rate: number; description: string };
    td3yr: { rate: number; description: string };
    td5yr: { rate: number; description: string };
    mis: { rate: number; description: string };
  };
  fixedIncome: {
    fds: Array<{
      bank: string;
      rating: string;
      rates: {
        days180: number;
        days365: number;
        days730: number;
        days1095: number;
      };
    }>;
    corporateBonds: Array<{
      issuer: string;
      rating: string;
      yield: number;
      maturityYrs: number;
      type: "PSU" | "Corporate" | "Infrastructure";
    }>;
    debtFunds: Array<{
      name: string;
      category: string;
      oneYearReturn: number | null;
    }>;
  };
  gold: {
    price24k: number;
    price22k: number;
    sgb: {
      lastIssuePrice: number;
      interestRate: number;
      taxFreeAtMaturity: boolean;
    };
    goldETF: { oneYearReturn: number | null; expenseRatio: number };
  };
  equity: {
    nifty50: { value: number; changePct: number };
    sensex: { value: number; changePct: number };
    niftyMidcap: { value: number; changePct: number };
    niftySmall: { value: number; changePct: number };
    indiaVix?: number;
  };
  alternativeInvestments: {
    p2p: Array<{
      platform: string;
      expectedReturn: number;
      minInvestment: number;
      riskLevel: string;
      regulated: boolean;
    }>;
    reits: Array<{
      name: string;
      ticker: string;
      distributionYield: number;
      oneYearReturn: number | null;
    }>;
    invits: Array<{ name: string; distributionYield: number }>;
  };
  macro: {
    inflation: number;
    repoRate: number;
    usdInr: number;
    fetchedAt: string;
  };
}

export interface FundDataState {
  funds: Record<string, FundData[]>;
  allFunds: FundData[];
  ipos: IpoData[]; // ✅ Added to interface
  rates: LiveRates | null;
  loading: boolean;
  ratesLoading: boolean;
  iposLoading: boolean; // ✅ Added to interface
  error: string | null;
}

// ─── STATIC FALLBACK RATES (Q1 2026) ──────────────────────────────────────────

const FALLBACK_RATES: LiveRates = {
  govtSchemes: {
    ppf: {
      rate: 7.1,
      description: "Public Provident Fund — EEE, 15yr lock-in",
    },
    ssy: {
      rate: 8.2,
      description: "Sukanya Samriddhi Yojana — EEE, girl child < 10",
    },
    scss: { rate: 8.2, description: "Senior Citizens Savings Scheme — 60+" },
    nsc: { rate: 7.7, description: "National Savings Certificate — 5yr" },
    pomis: { rate: 7.4, description: "Post Office Monthly Income Scheme" },
    rbiBonds: { rate: 8.05, description: "RBI Floating Rate Savings Bonds" },
    nsc5yr: { rate: 7.7, description: "NSC 5-Year — 80C, no TDS" },
    kvp: {
      rate: 7.5,
      description: "Kisan Vikas Patra — doubles in ~9.7 years",
    },
    td1yr: { rate: 6.9, description: "Post Office Time Deposit 1yr" },
    td3yr: { rate: 7.1, description: "Post Office Time Deposit 3yr" },
    td5yr: { rate: 7.5, description: "Post Office Time Deposit 5yr" },
    mis: { rate: 7.4, description: "Monthly Income Scheme" },
  },
  fixedIncome: {
    fds: [
      {
        bank: "HDFC Bank FD",
        rating: "AAA",
        rates: { days180: 6.5, days365: 7.0, days730: 7.25, days1095: 7.25 },
      },
      {
        bank: "SBI FD",
        rating: "AAA",
        rates: { days180: 6.5, days365: 6.8, days730: 7.0, days1095: 6.9 },
      },
    ],
    corporateBonds: [
      {
        issuer: "NHAI",
        rating: "AAA",
        yield: 7.8,
        maturityYrs: 5,
        type: "Infrastructure",
      },
    ],
    debtFunds: [
      {
        name: "HDFC Short Duration",
        category: "Short Duration",
        oneYearReturn: 7.6,
      },
    ],
  },
  gold: {
    price24k: 8200,
    price22k: 7520,
    sgb: { lastIssuePrice: 6263, interestRate: 2.5, taxFreeAtMaturity: true },
    goldETF: { oneYearReturn: 15.2, expenseRatio: 0.59 },
  },
  equity: {
    nifty50: { value: 22400, changePct: 0 },
    sensex: { value: 73800, changePct: 0 },
    niftyMidcap: { value: 49200, changePct: 0 },
    niftySmall: { value: 16800, changePct: 0 },
    indiaVix: 14, // Add this line
  },
  alternativeInvestments: {
    p2p: [
      {
        platform: "Liquiloans",
        expectedReturn: 9.5,
        minInvestment: 50000,
        riskLevel: "Low",
        regulated: true,
      },
    ],
    reits: [
      {
        name: "Embassy Office Parks REIT",
        ticker: "EMBASSY.NS",
        distributionYield: 7.2,
        oneYearReturn: 8.5,
      },
    ],
    invits: [{ name: "PowerGrid InvIT", distributionYield: 10.8 }],
  },
  macro: {
    inflation: 5.1,
    repoRate: 6.5,
    usdInr: 83.2,
    fetchedAt: new Date().toISOString(),
  },
};

// ─── UTILS ────────────────────────────────────────────────────────────────────

const normalizeCategory = (raw: string): string => {
  const cat = raw.toLowerCase();
  if (cat.includes("small cap")) return "smallCap";
  if (cat.includes("mid cap")) return "midCap";
  if (cat.includes("large cap")) return "largeCap";
  if (cat.includes("flexi cap")) return "flexiCap";
  if (cat.includes("elss") || cat.includes("tax saver")) return "elss";
  if (cat.includes("index")) return "index";
  return "other";
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useFundData(): FundDataState {
  const [state, setState] = useState<FundDataState>({
    funds: {},
    allFunds: [],
    rates: FALLBACK_RATES,
    loading: true,
    ipos: [],
    iposLoading: true,
    ratesLoading: true,
    error: null,
  });

  const loadIpos = useCallback(async () => {
    try {
      const res = await fetch(
        "https://paisadekho-ai.paisadekhogroup.workers.dev/api/ipos",
      );
      if (!res.ok) throw new Error("Failed to fetch IPOs");
      const data = await res.json();
      console.log("Fetched IPO Data Sample:", data[0]);
      console.log(
        "All Statuses:",
        data.map((i: any) => i.status),
      );

      setState((s) => ({ ...s, ipos: data, iposLoading: false }));
    } catch (e) {
      console.error("IPO Load Error:", e);
      setState((s) => ({ ...s, iposLoading: false }));
    }
  }, []);

  const loadFunds = useCallback(async () => {
    try {
      const res = await fetch("/api/funds?limit=200");
      if (!res.ok) throw new Error(`Funds API: ${res.status}`);
      const data: FundData[] = await res.json();

      const grouped = data.reduce((acc: Record<string, FundData[]>, fund) => {
        const key = normalizeCategory(fund.category || "");
        if (!acc[key]) acc[key] = [];
        acc[key].push(fund);
        return acc;
      }, {});

      setState((s) => ({
        ...s,
        funds: grouped,
        allFunds: data,
        loading: false,
      }));
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);

  const loadRates = useCallback(async () => {
    try {
      const res = await fetch("/api/rates");

      if (!res.ok) throw new Error("Rates API offline");

      const liveData = await res.json();

      // 🔐 Defensive extraction
      const equity = liveData?.equity ?? {};
      const gold = liveData?.gold ?? {};
      const macro = liveData?.macro ?? {};

      setState((s) => ({
        ...s,
        ratesLoading: false,
        rates: {
          ...FALLBACK_RATES,

          equity: {
            ...FALLBACK_RATES.equity,
            nifty50: {
              ...FALLBACK_RATES.equity.nifty50,
              ...(equity.nifty50 || {}),
            },
            sensex: {
              ...FALLBACK_RATES.equity.sensex,
              ...(equity.sensex || {}),
            },
          },

          gold: {
            ...FALLBACK_RATES.gold,
            ...(gold || {}),
          },

          macro: {
            ...FALLBACK_RATES.macro,
            ...(macro || {}),
          },
        },
      }));
    } catch (err) {
      console.warn("Using static rates fallback.");

      setState((s) => ({
        ...s,
        ratesLoading: false,
        rates: FALLBACK_RATES,
      }));
    }
  }, []);

  useEffect(() => {
    loadFunds();
    loadRates();
    loadIpos();

    const interval = setInterval(loadRates, 300000); // 5-minute refresh
    return () => clearInterval(interval);
  }, [loadFunds, loadRates, loadIpos]);

  return state;
}
