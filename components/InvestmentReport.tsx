"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  Download,
  TrendingUp,
  Shield,
  Target,
  Zap,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  generatePreciseRecommendations,
  generatePlanSummary,
  assessGoalFeasibility,
  type FinancialProfile,
  type PlanSummary,
  type LiveRates,
} from "@/lib/smart-engine";
import { RECOMMENDED_FUNDS } from "@/lib/fund-universe";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvestmentReportProps {
  profile: FinancialProfile;
  userName?: string;
  /** Pass the live MarketSnapshot from useMarketData — optional, falls back to hardcoded */
  marketData?: LiveRates;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSET_COLORS: Record<string, string> = {
  equity: "#ef4444",
  mutual_funds: "#8b5cf6",
  govt_schemes: "#06b6d4",
  fixed_income: "#3b82f6",
  alternatives: "#f59e0b",
  real_estate: "#f97316",
  cash: "#10b981",
};

const ASSET_EMOJI: Record<string, string> = {
  equity: "📈",
  mutual_funds: "📊",
  govt_schemes: "🛡️",
  fixed_income: "🏦",
  alternatives: "✨",
  real_estate: "🏠",
  cash: "💵",
};

// ─── Allocation types ─────────────────────────────────────────────────────────

interface Instrument {
  name: string;
  type: "sip" | "lump-sum";
  amount: number;
  platform: string;
  purpose: string;
  lockIn: string;
}

interface AllocationSlice {
  assetClass: string;
  label: string;
  pct: number;
  monthlyAmt: number;
  lumpSumAmt: number;
  color: string;
  emoji: string;
  riskLabel: string;
  returnRange: string;
  instruments: Instrument[];
}

// ─── Live rates extraction helper ─────────────────────────────────────────────
// Mirrors the RATES object in smart-engine.ts so both use the same live values.

function extractRates(marketData?: LiveRates) {
  const fds = marketData?.fixedIncome?.fds ?? [];
  return {
    ppf: marketData?.govtSchemes?.ppf?.rate ?? 7.1,
    ssy: marketData?.govtSchemes?.ssy?.rate ?? 8.2,
    scss: marketData?.govtSchemes?.scss?.rate ?? 8.2,
    nsc: marketData?.govtSchemes?.nsc?.rate ?? 7.7,
    rbiBonds: marketData?.govtSchemes?.rbiBonds?.rate ?? 8.05,
    bestFD1yr:
      fds.length > 0 ? Math.max(...fds.map((f) => f.rates.days365)) : 8.1,
    bestFD3yr:
      fds.length > 0 ? Math.max(...fds.map((f) => f.rates.days1095)) : 8.85,
    bestFDBank:
      // Replace line 100 with this:
      fds.length > 0
        ? ((fds as any[]).sort((a, b) => b.rates.days730 - a.rates.days730)[0]
            ?.bank ?? "Bajaj Finance")
        : "Bajaj Finance",
    gold24k: marketData?.gold?.price24k ?? 8200,
    sgbUnit: marketData?.gold?.sgb?.lastIssuePrice ?? 8159,
  };
}

// ─── Allocation builder ───────────────────────────────────────────────────────
// FIX: now receives `rates` so instrument descriptions use live PPF/FD/SSY rates
// instead of hardcoded strings. Fund names come from RECOMMENDED_FUNDS.

function buildAllocation(
  p: FinancialProfile,
  surplus: number,
  ls: number,
  rates: ReturnType<typeof extractRates>,
): AllocationSlice[] {
  const yrs = p.goalYears;
  const risk = p.riskAppetite;

  type AllocMap = Record<string, number>;
  const BASE: Record<string, AllocMap> = {
    conservative: {
      equity: 15,
      mutual_funds: 20,
      govt_schemes: 30,
      fixed_income: 20,
      alternatives: 5,
      real_estate: 5,
      cash: 5,
    },
    moderate: {
      equity: 30,
      mutual_funds: 20,
      govt_schemes: 15,
      fixed_income: 15,
      alternatives: 8,
      real_estate: 7,
      cash: 5,
    },
    aggressive: {
      equity: 45,
      mutual_funds: 20,
      govt_schemes: 10,
      fixed_income: 8,
      alternatives: 10,
      real_estate: 5,
      cash: 2,
    },
  };

  let alloc = { ...BASE[risk] };

  // Short-goal adjustment: move equity into fixed income
  if (yrs <= 3) {
    const equityShift = alloc.equity + alloc.mutual_funds;
    alloc.equity = 0;
    alloc.mutual_funds = 5;
    alloc.fixed_income += Math.round(equityShift * 0.7);
    alloc.cash += Math.round(equityShift * 0.25);
  } else if (yrs <= 5) {
    const shift = Math.round(alloc.equity * 0.5);
    alloc.equity -= shift;
    alloc.fixed_income += shift;
  }

  // Normalise to 100
  const total = Object.values(alloc).reduce((a, b) => a + b, 0);
  Object.keys(alloc).forEach((k) => {
    alloc[k] = Math.round((alloc[k] / total) * 100);
  });

  const sip = (cls: string) => Math.round((surplus * alloc[cls]) / 100);
  const lsp = (cls: string) => Math.round((ls * alloc[cls]) / 100);

  // ── Equity slice ────────────────────────────────────────────────────────────
  const equitySip = sip("equity");
  const equityLs = lsp("equity");
  const equityInstruments: Instrument[] =
    alloc.equity > 0
      ? [
          {
            name: RECOMMENDED_FUNDS.nifty50Index.name,
            type: "sip",
            amount: Math.round(equitySip * 0.45),
            platform: RECOMMENDED_FUNDS.nifty50Index.platform,
            purpose: `Core large cap · ER ${RECOMMENDED_FUNDS.nifty50Index.er}`,
            lockIn: "None",
          },
          {
            name: RECOMMENDED_FUNDS.flexiCap.name,
            type: "sip",
            amount: Math.round(equitySip * 0.35),
            platform: RECOMMENDED_FUNDS.flexiCap.platform,
            purpose: `Diversified + US stocks · ER ${RECOMMENDED_FUNDS.flexiCap.er}`,
            lockIn: "None",
          },
          {
            name: RECOMMENDED_FUNDS.midCap.name,
            type: "sip",
            amount: Math.round(equitySip * 0.2),
            platform: RECOMMENDED_FUNDS.midCap.platform,
            purpose: `Mid-cap growth · ER ${RECOMMENDED_FUNDS.midCap.er}`,
            lockIn: "None",
          },
          ...(equityLs > 5000
            ? [
                {
                  name: `${RECOMMENDED_FUNDS.nifty50Index.name} (Lump Sum)`,
                  type: "lump-sum" as const,
                  amount: equityLs,
                  platform: RECOMMENDED_FUNDS.nifty50Index.platform,
                  purpose:
                    equityLs > 500000
                      ? "Deploy via STP over 3 months"
                      : "Deploy existing savings",
                  lockIn: "None",
                },
              ]
            : []),
        ]
      : [];

  // ── Mutual Funds slice ──────────────────────────────────────────────────────
  const mfSip = sip("mutual_funds");
  const mfInstruments: Instrument[] = (
    [
      ...(p.taxBracket >= 20
        ? [
            {
              name: RECOMMENDED_FUNDS.elss.name,
              type: "sip" as const,
              amount: Math.min(Math.round(mfSip * 0.6), 12500),
              platform: RECOMMENDED_FUNDS.elss.platform,
              purpose: `80C tax saving — saves ₹${Math.round((150000 * p.taxBracket) / 100)}/yr`,
              lockIn: "3 years",
            },
          ]
        : []),
      yrs <= 3
        ? {
            name: RECOMMENDED_FUNDS.shortDuration.name,
            type: "sip" as const,
            amount: mfSip,
            platform: RECOMMENDED_FUNDS.shortDuration.platform,
            purpose: "Short-term capital protection, ~7.5%",
            lockIn: "None",
          }
        : {
            name: RECOMMENDED_FUNDS.balancedAdvantage.name,
            type: "sip" as const,
            amount: Math.round(mfSip * (p.taxBracket >= 20 ? 0.4 : 1.0)),
            platform: RECOMMENDED_FUNDS.balancedAdvantage.platform,
            purpose: "Auto equity-debt rebalancing",
            lockIn: "None",
          },
    ] as Instrument[]
  ).filter((i): i is Instrument => i.amount > 0);
  //  ^^^^^^^^^^^^^^^
  //  Add this cast and wrap the array in parentheses

  // ── Govt Schemes slice ──────────────────────────────────────────────────────
  const govtSip = sip("govt_schemes");
  const govtLs = lsp("govt_schemes");
  const govtInstruments: Instrument[] = [
    {
      name: "PPF — Public Provident Fund",
      type: "sip",
      amount: Math.min(Math.round(govtSip * 0.6), 12500),
      platform: "SBI / Post Office online",
      purpose: `80C + EEE tax-free · ${rates.ppf}% guaranteed`,
      lockIn: "15 years",
    },
    {
      name: "NPS Tier 1 — 80CCD(1B)",
      type: "sip",
      amount: Math.min(Math.round(govtSip * 0.4), 4167),
      platform: "eNPS.nsdl.com (direct, free)",
      purpose: "Extra ₹50k deduction beyond 80C",
      lockIn: "Until age 60",
    },
    ...(p.hasGirlChild && (p.girlChildAge ?? 0) < 10
      ? [
          {
            name: "Sukanya Samriddhi Yojana (SSY)",
            type: "lump-sum" as const,
            amount: Math.min(govtLs, 150000),
            platform: "Post Office / SBI",
            purpose: `Best 80C for daughter — ${rates.ssy}% guaranteed EEE`,
            lockIn: "21 years",
          },
        ]
      : []),
  ].filter((i): i is Instrument => i.amount > 0);

  // ── Fixed Income slice ──────────────────────────────────────────────────────
  const fdLs = lsp("fixed_income") + sip("fixed_income") * 6; // 6-month SIP → lump sum
  const fdInstruments: Instrument[] = [
    {
      name: `${rates.bestFDBank} FD (42 months)`,
      type: "lump-sum",
      amount: Math.min(fdLs, 200000),
      platform:
        rates.bestFDBank === "Bajaj Finance"
          ? "bajajfinserv.in (10 min)"
          : "Bank app",
      purpose: `${rates.bestFD3yr.toFixed(2)}% guaranteed · AAA-rated`,
      lockIn: "42 months",
    },
    {
      name: "AU Small Finance Bank FD (18 months)",
      type: "lump-sum",
      amount: Math.max(0, fdLs - 200000),
      platform: "aubank.in",
      purpose: `${rates.bestFD1yr.toFixed(2)}% · DICGC insured`,
      lockIn: "18 months",
    },
  ].filter((i): i is Instrument => i.amount > 1000);

  // ── Alternatives slice ──────────────────────────────────────────────────────
  const altLs = lsp("alternatives");
  const altInstruments: Instrument[] = [
    {
      name: "Sovereign Gold Bond (SGB)",
      type: "lump-sum",
      amount: Math.round(altLs * 0.7),
      platform: "HDFC Securities / SBI net banking",
      purpose: `2.5% annual interest + gold upside · current: ₹${rates.sgbUnit.toLocaleString("en-IN")}/unit`,
      lockIn: "8 years (tax-free)",
    },
    ...(risk === "aggressive"
      ? [
          {
            name: "Cryptocurrency (Bitcoin only — speculative)",
            type: "lump-sum" as const,
            amount: Math.round(altLs * 0.15),
            platform: "CoinDCX / Zerodha Coin",
            purpose: "High-risk, max 2% of portfolio",
            lockIn: "None",
          },
        ]
      : []),
    {
      name: "CRED Mint / Liquiloans (P2P Lending)",
      type: "lump-sum",
      amount: Math.round(altLs * (risk === "aggressive" ? 0.15 : 0.3)),
      platform: "CRED app / liquiloans.com",
      purpose: "10–13% returns · NBFC regulated",
      lockIn: "3–12 months",
    },
  ].filter((i): i is Instrument => i.amount > 500);

  // ── Real Estate slice ───────────────────────────────────────────────────────
  const reLs = lsp("real_estate");
  const reInstruments: Instrument[] =
    reLs >= 300
      ? [
          {
            name: "Embassy REIT / Mindspace REIT",
            type: "lump-sum",
            amount: Math.round(reLs * 0.7),
            platform: "Zerodha / Groww (exchange listed)",
            purpose: "Commercial real estate income + growth, min ₹300/unit",
            lockIn: "None (listed)",
          },
          ...(reLs >= 25000
            ? [
                {
                  name: "Strata / hBits Fractional Property",
                  type: "lump-sum" as const,
                  amount: Math.round(reLs * 0.3),
                  platform: "strata.in / hbits.co",
                  purpose: "9–10% rental yield on Grade-A commercial",
                  lockIn: "3 years",
                },
              ]
            : []),
        ]
      : [];

  // ── Cash slice ──────────────────────────────────────────────────────────────
  const cashSip = sip("cash");
  const cashInstruments: Instrument[] = [
    {
      name: "IDFC FIRST Bank Savings Account",
      type: "sip",
      amount: cashSip,
      platform: "IDFC FIRST Bank app",
      purpose: "Emergency fund + liquid buffer at 7%",
      lockIn: "None",
    },
    {
      name: RECOMMENDED_FUNDS.liquid.name,
      type: "lump-sum",
      amount: 0, // placeholder — user parks surplus above ₹1L
      platform: RECOMMENDED_FUNDS.liquid.platform,
      purpose: "Surplus above ₹1L — 6.8%, T+1 redemption",
      lockIn: "None",
    },
  ].filter((i): i is Instrument => i.amount > 0);

  return [
    {
      assetClass: "equity",
      label: "Equity",
      pct: alloc.equity,
      monthlyAmt: equitySip,
      lumpSumAmt: equityLs,
      color: ASSET_COLORS.equity,
      emoji: ASSET_EMOJI.equity,
      riskLabel: "High",
      returnRange: "12–22%",
      instruments: equityInstruments,
    },
    {
      assetClass: "mutual_funds",
      label: "Mutual Funds",
      pct: alloc.mutual_funds,
      monthlyAmt: mfSip,
      lumpSumAmt: lsp("mutual_funds"),
      color: ASSET_COLORS.mutual_funds,
      emoji: ASSET_EMOJI.mutual_funds,
      riskLabel: yrs <= 3 ? "Low" : "Medium",
      returnRange: yrs <= 3 ? "7–9%" : "12–18%",
      instruments: mfInstruments,
    },
    {
      assetClass: "govt_schemes",
      label: "Govt Schemes",
      pct: alloc.govt_schemes,
      monthlyAmt: govtSip,
      lumpSumAmt: govtLs,
      color: ASSET_COLORS.govt_schemes,
      emoji: ASSET_EMOJI.govt_schemes,
      riskLabel: "Very Low",
      // FIX: returnRange uses live PPF and SSY rates
      returnRange: `${rates.ppf}–${rates.ssy}%`,
      instruments: govtInstruments,
    },
    {
      assetClass: "fixed_income",
      label: "Fixed Income",
      pct: alloc.fixed_income,
      monthlyAmt: 0,
      lumpSumAmt: fdLs,
      color: ASSET_COLORS.fixed_income,
      emoji: ASSET_EMOJI.fixed_income,
      riskLabel: "Low",
      // FIX: returnRange uses live FD rates
      returnRange: `${rates.bestFD1yr.toFixed(1)}–${rates.bestFD3yr.toFixed(1)}%`,
      instruments: fdInstruments,
    },
    {
      assetClass: "alternatives",
      label: "Alternatives",
      pct: alloc.alternatives,
      monthlyAmt: 0,
      lumpSumAmt: altLs,
      color: ASSET_COLORS.alternatives,
      emoji: ASSET_EMOJI.alternatives,
      riskLabel: risk === "aggressive" ? "High" : "Medium",
      returnRange: "8–25%",
      instruments: altInstruments,
    },
    {
      assetClass: "real_estate",
      label: "Real Estate",
      pct: alloc.real_estate,
      monthlyAmt: 0,
      lumpSumAmt: reLs,
      color: ASSET_COLORS.real_estate,
      emoji: ASSET_EMOJI.real_estate,
      riskLabel: "Medium",
      returnRange: "8–15%",
      instruments: reInstruments,
    },
    {
      assetClass: "cash",
      label: "Cash & Liquid",
      pct: alloc.cash,
      monthlyAmt: cashSip,
      lumpSumAmt: 0,
      color: ASSET_COLORS.cash,
      emoji: ASSET_EMOJI.cash,
      riskLabel: "Very Low",
      returnRange: "6.8–7%",
      instruments: cashInstruments,
    },
  ].filter((s) => s.pct > 0);
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

function sipCorpus(monthly: number, years: number, cagr: number): number {
  if (monthly <= 0 || years <= 0) return 0;
  if (cagr === 0) return monthly * years * 12;
  const r = cagr / 100 / 12,
    n = years * 12;
  return Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

function lumpCorpus(lump: number, years: number, cagr: number): number {
  if (lump <= 0 || years <= 0) return 0;
  return Math.round(lump * Math.pow(1 + cagr / 100, years));
}

function yearByYear(monthly: number, ls: number, years: number, cagr: number) {
  const r = cagr / 100 / 12;
  return Array.from({ length: years }, (_, i) => {
    const yr = i + 1;
    const n = yr * 12;
    const sipC = Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    const lsC = lumpCorpus(ls, yr, cagr);
    return {
      year: new Date().getFullYear() + yr,
      yr,
      sipCorpus: sipC,
      lsCorpus: lsC,
      total: sipC + lsC,
      invested: monthly * n + ls,
      returns: sipC + lsC - (monthly * n + ls),
    };
  });
}

// FIX: previous sipStepup was double-counting compounding.
// Correct formula: each year's SIP contributes a full-year corpus at that SIP level.
function sipStepup(
  monthly: number,
  years: number,
  cagr: number,
  stepupPct = 10,
): number {
  let total = 0;
  let sip = monthly;
  const r = cagr / 100 / 12;
  for (let yr = 0; yr < years; yr++) {
    const remaining = years - yr;
    const n = remaining * 12;
    total += Math.round(sip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    sip *= 1 + stepupPct / 100;
  }
  return Math.round(total);
}

// ─── Format helpers ───────────────────────────────────────────────────────────

const fmtC = (v: number) =>
  v >= 10000000
    ? `₹${(v / 10000000).toFixed(2)}Cr`
    : v >= 100000
      ? `₹${(v / 100000).toFixed(1)}L`
      : v >= 1000
        ? `₹${(v / 1000).toFixed(0)}k`
        : `₹${v}`;

// ─── SVG Donut chart ──────────────────────────────────────────────────────────

function DonutChart({ slices }: { slices: AllocationSlice[] }) {
  const R = 80,
    cx = 100,
    cy = 100,
    strokeW = 28;
  const circumference = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[200px]">
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={strokeW}
      />
      {slices.map((s, i) => {
        const dash = (s.pct / 100) * circumference;
        const gap = circumference - dash;
        const seg = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeW}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity={0.9}
          />
        );
        offset += dash;
        return seg;
      })}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="white"
        fontSize="13"
        fontWeight="700"
        fontFamily="Georgia, serif"
      >
        {slices.length}
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize="8"
      >
        asset classes
      </text>
    </svg>
  );
}

// ─── Corpus line chart ────────────────────────────────────────────────────────

function CorpusLineChart({
  rows,
  target,
}: {
  rows: ReturnType<typeof yearByYear>;
  target: number;
}) {
  if (rows.length === 0) return null;
  const maxVal = Math.max(target * 1.1, rows[rows.length - 1].total);
  const W = 320,
    H = 120,
    pad = { t: 10, r: 10, b: 30, l: 10 };
  const iW = W - pad.l - pad.r,
    iH = H - pad.t - pad.b;
  const xPos = (i: number) => pad.l + (i / Math.max(rows.length - 1, 1)) * iW;
  const yPos = (v: number) => pad.t + iH - (v / maxVal) * iH;
  const totalPath = rows
    .map((r, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPos(r.total)}`)
    .join(" ");
  const investedPath = rows
    .map((r, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPos(r.invested)}`)
    .join(" ");
  const targetY = yPos(target);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1={pad.l}
        y1={targetY}
        x2={W - pad.r}
        y2={targetY}
        stroke="#f59e0b"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.6}
      />
      <text
        x={W - pad.r - 2}
        y={targetY - 4}
        fill="#f59e0b"
        fontSize="7"
        textAnchor="end"
        opacity={0.8}
      >
        Target
      </text>
      <path
        d={`${totalPath} L${xPos(rows.length - 1)},${pad.t + iH} L${xPos(0)},${pad.t + iH} Z`}
        fill="url(#corpusGrad)"
        opacity={0.25}
      />
      <path
        d={investedPath}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
      <path
        d={totalPath}
        fill="none"
        stroke="#10b981"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {rows.map((r, i) => (
        <circle
          key={i}
          cx={xPos(i)}
          cy={yPos(r.total)}
          r={2.5}
          fill="#10b981"
        />
      ))}
      {rows
        .filter((_, i) => i === 0 || (i + 1) % 2 === 0 || i === rows.length - 1)
        .map((r) => {
          const i = rows.indexOf(r);
          return (
            <text
              key={i}
              x={xPos(i)}
              y={H - 4}
              textAnchor="middle"
              fill="rgba(255,255,255,0.35)"
              fontSize="7"
            >
              {r.year}
            </text>
          );
        })}
    </svg>
  );
}

// ─── Horizontal allocation bar ────────────────────────────────────────────────

function AllocationBar({ slices }: { slices: AllocationSlice[] }) {
  return (
    <div className="space-y-1.5">
      <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
        {slices
          .filter((s) => s.pct > 0)
          .map((s, i) => (
            <div
              key={i}
              style={{ flex: s.pct, background: s.color }}
              className="rounded-sm"
              title={`${s.label}: ${s.pct}%`}
            />
          ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {slices.map((s, i) => (
          <span
            key={i}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: s.color }}
            />
            {s.label} {s.pct}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-serif text-lg font-bold text-foreground">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

// ─── Main Report Component ────────────────────────────────────────────────────

export default function InvestmentReport({
  profile,
  userName = "Investor",
  marketData,
}: InvestmentReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  // FIX: pass marketData so smart-engine uses live rates (PPF, SSY, FD) not hardcoded ones
  const recs = useMemo(
    () => generatePreciseRecommendations(profile, marketData),
    [profile, marketData],
  );
  const summary = useMemo(
    () => generatePlanSummary(profile, recs),
    [recs, profile],
  );
  const feasibility = useMemo(() => {
    const sp = Math.max(
      0,
      profile.monthlyIncome -
        profile.monthlyExpenses -
        profile.monthlyEmi -
        profile.monthlyRent,
    );
    return assessGoalFeasibility(profile, sp);
  }, [profile]);

  const surplus = Math.max(
    0,
    profile.monthlyIncome -
      profile.monthlyExpenses -
      profile.monthlyEmi -
      profile.monthlyRent,
  );
  const ls = profile.availableLumpSum;
  const cagr =
    { conservative: 9, moderate: 12, aggressive: 16 }[profile.riskAppetite] ??
    12;

  // FIX: extract live rates once, pass to buildAllocation and use in JSX
  const rates = useMemo(() => extractRates(marketData), [marketData]);

  const slices = useMemo(
    () => buildAllocation(profile, surplus, ls, rates),
    [profile, surplus, ls, rates],
  );
  const table = useMemo(
    () => yearByYear(surplus * 0.6, ls * 0.5, profile.goalYears, cagr),
    [profile, surplus, ls, cagr],
  );

  // FIX: corrected sipStepup — see function comment above
  const flatC = useMemo(
    () => sipCorpus(surplus * 0.6, profile.goalYears, cagr),
    [surplus, profile.goalYears, cagr],
  );
  const stepupC = useMemo(
    () => sipStepup(surplus * 0.6, profile.goalYears, cagr),
    [surplus, profile.goalYears, cagr],
  );

  const totalMonthly = slices.reduce((s, a) => s + a.monthlyAmt, 0);
  const totalLumpSum = slices.reduce((s, a) => s + a.lumpSumAmt, 0);

  const feasPct = feasibility.achievablePct;
  const isOnTrack = feasPct >= 100;
  const statusColor = isOnTrack
    ? "text-emerald-400"
    : feasPct >= 85
      ? "text-blue-400"
      : feasPct >= 50
        ? "text-amber-400"
        : "text-red-400";

  const handleDownload = () => {
    const style = document.createElement("style");
    style.textContent = `@media print { body { background: #0a0a0a; } }`;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 2000);
  };

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const targetYear = new Date().getFullYear() + profile.goalYears;

  return (
    <div
      ref={reportRef}
      className="max-w-2xl mx-auto space-y-6 pb-12 print:pb-4"
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Investment Report
          </p>
          <h1 className="font-serif text-2xl font-bold">
            {userName}'s Financial Plan
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Generated {today} · {profile.age} yrs · ₹
            {(profile.monthlyIncome / 1000).toFixed(0)}k/mo ·{" "}
            {profile.riskAppetite} risk
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="print:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-all"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      {/* ── GOAL HERO ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/8 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
        <div className="relative grid grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                {summary.goalName}
              </p>
              <p className="font-serif text-3xl font-bold mt-1">
                {fmtC(profile.goalAmountTarget)}
              </p>
              <p className="text-sm text-muted-foreground">
                by {targetYear} · {profile.goalYears} years
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Projected</span>
                <span className={cn("font-bold", statusColor)}>
                  {fmtC(feasibility.projectedCorpus)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, feasPct)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    isOnTrack
                      ? "bg-emerald-400"
                      : feasPct >= 50
                        ? "bg-amber-400"
                        : "bg-red-400",
                  )}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {feasPct}% of target · {feasibility.yearsAtCurrentSip} years at
                current plan
              </p>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span>
                10% annual step-up → {fmtC(stepupC)} (+{fmtC(stepupC - flatC)})
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <DonutChart slices={slices} />
            <p className="text-[10px] text-muted-foreground text-center">
              Portfolio Allocation
            </p>
          </div>
        </div>
      </div>

      {/* ── SUMMARY STATS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            l: "Monthly SIP",
            v: fmtC(totalMonthly),
            c: "text-violet-400",
            sub: "across all classes",
          },
          {
            l: "Lump Sum",
            v: fmtC(Math.min(totalLumpSum, ls)),
            c: "text-amber-400",
            sub: "one-time deployment",
          },
          {
            l: "Tax Saved/yr",
            v: fmtC(summary.totalTaxSaving),
            c: "text-green-400",
            sub: "80C+80CCD+80D",
          },
          {
            l: "Surplus Left",
            v: fmtC(Math.max(0, surplus - totalMonthly)),
            c: "text-blue-400",
            sub: "liquid buffer",
          },
        ].map((s) => (
          <div
            key={s.l}
            className="p-3 rounded-xl bg-white/3 border border-white/8 text-center"
          >
            <p className={cn("text-lg font-bold", s.c)}>{s.v}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{s.l}</p>
            <p className="text-[8px] text-muted-foreground/50">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── ALLOCATION BAR ─────────────────────────────────────────────────── */}
      <Section
        title="Portfolio Allocation"
        subtitle="Split across all 7 investment categories"
      >
        <AllocationBar slices={slices} />
      </Section>

      {/* ── PER-CLASS INVESTMENT TABLE ─────────────────────────────────────── */}
      <Section
        title="Complete Investment Plan"
        subtitle="Every rupee, exactly where it goes"
      >
        <div className="space-y-4">
          {slices.map((slice, si) => (
            <motion.div
              key={si}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.06 }}
              className="rounded-2xl border border-white/8 overflow-hidden"
            >
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: `${slice.color}12` }}
              >
                <span className="text-xl">{slice.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-sm font-bold"
                      style={{ color: slice.color }}
                    >
                      {slice.label}
                    </p>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium border"
                      style={{
                        color: slice.color,
                        borderColor: `${slice.color}40`,
                        background: `${slice.color}15`,
                      }}
                    >
                      {slice.pct}% · {slice.riskLabel} Risk
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {slice.returnRange} expected
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {slice.monthlyAmt > 0 && (
                    <p className="text-xs font-bold text-violet-400">
                      {fmtC(slice.monthlyAmt)}/mo
                    </p>
                  )}
                  {slice.lumpSumAmt > 0 && (
                    <p className="text-xs font-bold text-amber-400">
                      {fmtC(slice.lumpSumAmt)} lump
                    </p>
                  )}
                </div>
              </div>
              {slice.instruments.length > 0 && (
                <div className="divide-y divide-white/5">
                  {slice.instruments.map((inst, ii) => (
                    <div
                      key={ii}
                      className="grid grid-cols-12 gap-2 px-4 py-3 items-start"
                    >
                      <div className="col-span-5">
                        <p className="text-xs font-semibold text-foreground leading-snug">
                          {inst.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {inst.purpose}
                        </p>
                      </div>
                      <div className="col-span-2 text-center">
                        <span
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                            inst.type === "sip"
                              ? "bg-violet-500/15 text-violet-400"
                              : "bg-amber-500/15 text-amber-400",
                          )}
                        >
                          {inst.type === "sip" ? "📅 SIP" : "⚡ Lump Sum"}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <p
                          className={cn(
                            "text-xs font-bold",
                            inst.type === "sip"
                              ? "text-violet-400"
                              : "text-amber-400",
                          )}
                        >
                          {inst.type === "sip"
                            ? `${fmtC(inst.amount)}/mo`
                            : fmtC(inst.amount)}
                        </p>
                      </div>
                      <div className="col-span-3 text-right">
                        <p className="text-[10px] text-muted-foreground leading-snug">
                          {inst.platform}
                        </p>
                        {inst.lockIn !== "None" && (
                          <p className="text-[9px] text-orange-400 mt-0.5">
                            🔒 {inst.lockIn}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── CORPUS GROWTH CHART ─────────────────────────────────────────────── */}
      <Section
        title="Year-by-Year Corpus Growth"
        subtitle="How your wealth compounds over time"
      >
        <div className="p-4 rounded-xl bg-white/3 border border-white/8">
          <CorpusLineChart rows={table} target={profile.goalAmountTarget} />
          <div className="flex gap-4 mt-3 justify-center">
            {[
              { color: "#10b981", label: "Total Corpus", line: "solid" },
              {
                color: "rgba(255,255,255,0.25)",
                label: "Amount Invested",
                line: "dashed",
              },
              { color: "#f59e0b", label: "Target", line: "dashed" },
            ].map((l) => (
              <span
                key={l.label}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <span
                  className="w-5 h-0.5 rounded-full"
                  style={{
                    background: l.color,
                    opacity: l.line === "dashed" ? 0.6 : 1,
                  }}
                />
                {l.label}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/8 overflow-hidden mt-3">
          <div className="grid grid-cols-5 gap-0 px-4 py-2 bg-white/5 text-[9px] text-muted-foreground uppercase tracking-widest">
            <span>Year</span>
            <span className="text-right">SIP Corpus</span>
            <span className="text-right">Lump Sum</span>
            <span className="text-right">Total</span>
            <span className="text-right">Returns</span>
          </div>
          <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
            {table.map((r, i) => (
              <div
                key={i}
                className={cn(
                  "grid grid-cols-5 gap-0 px-4 py-2.5 text-xs",
                  i === table.length - 1
                    ? "bg-amber-500/5 font-bold"
                    : "hover:bg-white/3",
                )}
              >
                <span className="text-muted-foreground">{r.year}</span>
                <span className="text-right text-violet-400">
                  {fmtC(r.sipCorpus)}
                </span>
                <span className="text-right text-amber-400">
                  {fmtC(r.lsCorpus)}
                </span>
                <span className="text-right text-emerald-400">
                  {fmtC(r.total)}
                </span>
                <span className="text-right text-green-400">
                  +{fmtC(r.returns)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── SIP STEP-UP COMPARISON ─────────────────────────────────────────── */}
      {profile.goalYears >= 3 && (
        <Section
          title="SIP Step-Up Impact"
          subtitle="10% annual increase vs flat SIP — the most powerful lever"
        >
          <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <p className="text-[10px] text-muted-foreground">
                  Flat SIP ({fmtC(Math.round(surplus * 0.6))}/mo)
                </p>
                <p className="font-serif text-xl font-bold text-foreground">
                  {fmtC(flatC)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  in {profile.goalYears} years
                </p>
              </div>
              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center">
                <p className="text-[10px] text-violet-400">
                  10% annual step-up
                </p>
                <p className="font-serif text-xl font-bold text-violet-400">
                  {fmtC(stepupC)}
                </p>
                <p className="text-[10px] text-violet-400">
                  +{fmtC(stepupC - flatC)} extra
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20 shrink-0">
                  Flat SIP
                </span>
                <div className="flex-1 h-3 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full bg-white/30 rounded-full"
                    style={{
                      width: `${(flatC / Math.max(stepupC, 1)) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-foreground w-16 text-right">
                  {fmtC(flatC)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20 shrink-0">
                  Step-up
                </span>
                <div className="flex-1 h-3 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
                <span className="text-[10px] text-violet-400 w-16 text-right">
                  {fmtC(stepupC)}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              📈 Increase your SIP by 10% every April — as income grows, your
              corpus grows disproportionately due to compounding.
            </p>
          </div>
        </Section>
      )}

      {/* ── RISK & RETURN MATRIX ───────────────────────────────────────────── */}
      <Section
        title="Risk & Return Matrix"
        subtitle="Every asset class mapped by risk level"
      >
        <div className="space-y-2">
          {(["very-low", "low", "medium", "high", "very-high"] as const).map(
            (risk) => {
              const classesAtRisk = slices.filter(
                (s) =>
                  s.riskLabel.toLowerCase().replace(" ", "-") === risk ||
                  s.riskLabel.toLowerCase() === risk.replace("-", " "),
              );
              if (classesAtRisk.length === 0) return null;
              const riskConfig = {
                "very-low": { color: "text-emerald-400", label: "Very Low" },
                low: { color: "text-blue-400", label: "Low" },
                medium: { color: "text-amber-400", label: "Moderate" },
                high: { color: "text-orange-400", label: "High" },
                "very-high": { color: "text-red-400", label: "Very High" },
              }[risk];
              return (
                <div key={risk} className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-8 rounded-full shrink-0"
                    style={{ background: classesAtRisk[0]?.color || "#fff" }}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium w-20 shrink-0",
                      riskConfig.color,
                    )}
                  >
                    {riskConfig.label}
                  </span>
                  <div className="flex-1 flex flex-wrap gap-1.5">
                    {classesAtRisk.map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full border"
                        style={{
                          borderColor: `${s.color}40`,
                          background: `${s.color}12`,
                          color: s.color,
                        }}
                      >
                        {s.emoji} {s.label} ({s.pct}%) · {s.returnRange}
                      </span>
                    ))}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </Section>

      {/* ── TAX SAVINGS BREAKDOWN ──────────────────────────────────────────── */}
      <Section
        title="Tax Savings Breakdown"
        subtitle="Every deduction available to you"
      >
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Section 80C",
              limit: "₹1,50,000",
              saving: Math.round((150000 * profile.taxBracket) / 100),
              desc: "PPF + ELSS + EPF + SSY",
              icon: "📌",
            },
            {
              label: "Section 80CCD(1B)",
              limit: "₹50,000",
              saving: Math.round((50000 * profile.taxBracket) / 100),
              desc: "NPS — beyond 80C limit",
              icon: "🏛️",
            },
            {
              label: "Section 80D",
              limit: "₹50,000",
              saving: Math.round((50000 * profile.taxBracket) / 100),
              desc: "Health insurance premium",
              icon: "🏥",
            },
            {
              label: "Total Saved/yr",
              limit: "₹2,50,000",
              saving: Math.round((250000 * profile.taxBracket) / 100),
              desc: `At ${profile.taxBracket}% bracket`,
              icon: "💰",
            },
          ].map((t) => (
            <div
              key={t.label}
              className="p-4 rounded-xl bg-green-500/5 border border-green-500/15"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Limit: {t.limit}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-green-400">
                    ₹{t.saving.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-muted-foreground">saved/yr</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── ALTERNATIVES (if goal not on track) ────────────────────────────── */}
      {!isOnTrack && feasibility.altScenarios.length > 0 && (
        <Section
          title="Alternatives to Reach Your Goal"
          subtitle="Three concrete paths to close the gap"
        >
          <div className="space-y-3">
            {feasibility.altScenarios.map((alt, i) => (
              <div
                key={i}
                className="flex gap-3 p-4 rounded-xl bg-white/3 border border-white/8"
              >
                <div className="w-7 h-7 rounded-full bg-amber-400/15 flex items-center justify-center shrink-0 text-sm font-bold text-amber-400">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{alt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {alt.description}
                  </p>
                  <p className="text-[10px] text-amber-400 mt-1 font-medium">
                    → {alt.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white/3 border border-white/8 text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Generated by PaisaDekho AI · {today}
        </p>
        <p className="text-[10px] text-muted-foreground/50">
          AI-generated from your inputs. Consult a SEBI-registered fee-only
          advisor before large decisions. Past returns do not guarantee future
          performance. Equity investments are subject to market risk.
        </p>
      </div>
    </div>
  );
}
