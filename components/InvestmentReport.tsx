"use client";

import { useMemo, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Download,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
  Star,
  Sparkles,
} from "lucide-react";
import {
  generatePreciseRecommendations,
  generatePlanSummary,
  assessGoalFeasibility,
  type FinancialProfile,
  type LiveRates,
} from "@/lib/smart-engine";
import { useFundData } from "@/hooks/useFundData";
import type { FundData as FundLiveData } from "@/hooks/useFundData";
import { cn } from "@/lib/utils";

interface InvestmentReportProps {
  profile: FinancialProfile;
  userName?: string;
  marketData?: LiveRates;
}
interface Instrument {
  name: string;
  type: "sip" | "lump-sum";
  amount: number;
  platform: string;
  purpose: string;
  lockIn: string;
  liveFund?: FundLiveData;
  sliceColor?: string;
}
interface Slice {
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

const COLORS: Record<string, string> = {
  equity: "#ef4444",
  mutual_funds: "#8b5cf6",
  govt_schemes: "#06b6d4",
  fixed_income: "#3b82f6",
  alternatives: "#f59e0b",
  real_estate: "#f97316",
  cash: "#10b981",
};
const EMOJI: Record<string, string> = {
  equity: "📈",
  mutual_funds: "📊",
  govt_schemes: "🛡️",
  fixed_income: "🏦",
  alternatives: "✨",
  real_estate: "🏠",
  cash: "💵",
};
const TAX_COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"];

const fmtC = (v: number) =>
  v >= 10_000_000
    ? `₹${(v / 10_000_000).toFixed(2)}Cr`
    : v >= 100_000
      ? `₹${(v / 100_000).toFixed(1)}L`
      : v >= 1_000
        ? `₹${(v / 1_000).toFixed(0)}k`
        : `₹${v}`;

function pickFund(
  b: Record<string, FundLiveData[]>,
  ...keys: string[]
): FundLiveData | undefined {
  for (const k of keys) {
    const a = b[k] ?? [];
    if (a.length)
      return [...a].sort(
        (x, y) =>
          (y.returns.threeYear ?? y.returns.oneYear ?? -999) -
          (x.returns.threeYear ?? x.returns.oneYear ?? -999),
      )[0];
  }
}
function shortName(f: FundLiveData) {
  return f.schemeName
    .replace(/ - (Direct Plan|Direct|Regular Plan|Regular|Growth).*$/i, "")
    .replace(/\s*(Direct Growth|Direct Plan|Direct)\s*$/i, "")
    .trim();
}
function amc2platform(f: FundLiveData) {
  const a = (f.amcName ?? "").toLowerCase();
  if (a.includes("parag parikh") || a.includes("ppfas")) return "PPFAS Direct";
  if (a.includes("mirae")) return "Mirae AMC / Groww";
  if (a.includes("hdfc")) return "HDFC AMC / Kuvera";
  if (a.includes("uti")) return "UTI Direct / Kuvera";
  if (a.includes("axis")) return "Axis MF Direct";
  if (a.includes("motilal")) return "Motilal Direct / Groww";
  if (a.includes("nippon")) return "Nippon Direct";
  if (a.includes("kotak")) return "Kotak Direct";
  if (a.includes("sbi")) return "SBI AMC Direct";
  return "Kuvera / Groww (Direct)";
}
function retStr(f: FundLiveData) {
  if (f.returns.threeYear != null)
    return `${f.returns.threeYear.toFixed(1)}% 3Y`;
  if (f.returns.oneYear != null) return `${f.returns.oneYear.toFixed(1)}% 1Y`;
  return "";
}
function catColor(cat: string) {
  const c = cat.toLowerCase();
  return c.includes("small") || c.includes("micro")
    ? "#ec4899"
    : c.includes("mid")
      ? "#f97316"
      : c.includes("large") || c.includes("index")
        ? "#ef4444"
        : c.includes("debt") || c.includes("liquid") || c.includes("short")
          ? "#3b82f6"
          : c.includes("hybrid") || c.includes("balanced")
            ? "#10b981"
            : "#8b5cf6";
}
function extractRates(m?: LiveRates) {
  const fds = m?.fixedIncome?.fds ?? [];
  return {
    ppf: m?.govtSchemes?.ppf?.rate ?? 7.1,
    ssy: m?.govtSchemes?.ssy?.rate ?? 8.2,
    rbiBonds: m?.govtSchemes?.rbiBonds?.rate ?? 8.05,
    bestFD1yr: fds.length ? Math.max(...fds.map((f) => f.rates.days365)) : 8.1,
    bestFD3yr: fds.length
      ? Math.max(...fds.map((f) => f.rates.days1095))
      : 8.85,
    topFDBank: fds.length
      ? ([...fds].sort((a, b) => b.rates.days730 - a.rates.days730)[0]?.bank ??
        "Bajaj Finance")
      : "Bajaj Finance",
    sgbUnit: m?.gold?.sgb?.lastIssuePrice ?? 8159,
  };
}

function sipCorpus(m: number, y: number, c: number) {
  if (!m || !y) return 0;
  const r = c / 100 / 12,
    n = y * 12;
  return Math.round(m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}
function lumpCorpus(l: number, y: number, c: number) {
  if (!l || !y) return 0;
  return Math.round(l * Math.pow(1 + c / 100, y));
}
function sipStepup(m: number, y: number, c: number, step = 10): number {
  if (!m || !y) return 0;
  const r = c / 100 / 12,
    total = y * 12;
  let s = 0;
  for (let mo = 0; mo < total; mo++) {
    const p = m * Math.pow(1 + step / 100, Math.floor(mo / 12));
    s += p * Math.pow(1 + r, total - mo);
  }
  return Math.round(s);
}
function yearByYear(m: number, ls: number, y: number, c: number) {
  const r = c / 100 / 12;
  return Array.from({ length: y }, (_, i) => {
    const yr = i + 1,
      n = yr * 12;
    const sc = Math.round(m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    const lc = lumpCorpus(ls, yr, c);
    return {
      year: new Date().getFullYear() + yr,
      yr,
      sipCorpus: sc,
      lsCorpus: lc,
      total: sc + lc,
      invested: m * n + ls,
      returns: sc + lc - (m * n + ls),
    };
  });
}

function buildAllocation(
  p: FinancialProfile,
  surplus: number,
  ls: number,
  R: ReturnType<typeof extractRates>,
  buckets: Record<string, FundLiveData[]>,
): Slice[] {
  const { goalYears: yrs, riskAppetite: risk } = p;
  const BASE: Record<string, Record<string, number>> = {
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
  const a = { ...BASE[risk] };
  if (yrs <= 3) {
    const s = a.equity + a.mutual_funds;
    a.equity = 0;
    a.mutual_funds = 5;
    a.fixed_income += Math.round(s * 0.7);
    a.cash += Math.round(s * 0.25);
  } else if (yrs <= 5) {
    const s = Math.round(a.equity * 0.5);
    a.equity -= s;
    a.fixed_income += s;
  }
  const tot = Object.values(a).reduce((x, y) => x + y, 0);
  Object.keys(a).forEach((k) => {
    a[k] = Math.round((a[k] / tot) * 100);
  });
  const sp = (k: string) => Math.round((surplus * a[k]) / 100),
    lp = (k: string) => Math.round((ls * a[k]) / 100);
  const addColor = (insts: Instrument[], color: string) =>
    insts.map((i) => ({ ...i, sliceColor: color }));
  const eq = COLORS.equity,
    mf = COLORS.mutual_funds,
    gs = COLORS.govt_schemes,
    fi = COLORS.fixed_income,
    al = COLORS.alternatives,
    re = COLORS.real_estate,
    ca = COLORS.cash;
  const slices: Slice[] = [
    {
      assetClass: "equity",
      label: "Equity",
      pct: a.equity,
      monthlyAmt: sp("equity"),
      lumpSumAmt: lp("equity"),
      color: eq,
      emoji: EMOJI.equity,
      riskLabel: "High",
      returnRange: "12–22%",
      instruments: addColor(
        (() => {
          if (!a.equity) return [];
          const idx = pickFund(buckets, "index", "largeCap"),
            flx = pickFund(buckets, "flexiCap", "largeCap"),
            mid = pickFund(buckets, "midCap");
          const eqS = sp("equity"),
            eqL = lp("equity"),
            insts: Instrument[] = [];
          if (idx)
            insts.push({
              name: shortName(idx),
              type: "sip",
              amount: Math.round(eqS * 0.45),
              platform: amc2platform(idx),
              purpose: `Core passive · ${retStr(idx)}`,
              lockIn: "None",
              liveFund: idx,
            });
          if (flx)
            insts.push({
              name: shortName(flx),
              type: "sip",
              amount: Math.round(eqS * 0.35),
              platform: amc2platform(flx),
              purpose: `Diversified growth · ${retStr(flx)}`,
              lockIn: "None",
              liveFund: flx,
            });
          if (mid && risk !== "conservative")
            insts.push({
              name: shortName(mid),
              type: "sip",
              amount: Math.round(eqS * 0.2),
              platform: amc2platform(mid),
              purpose: `Mid-cap satellite · ${retStr(mid)}`,
              lockIn: "None",
              liveFund: mid,
            });
          if (eqL > 5000 && idx)
            insts.push({
              name: `${shortName(idx)} (Lump Sum)`,
              type: "lump-sum",
              amount: eqL,
              platform: amc2platform(idx),
              purpose:
                eqL > 500000 ? "Deploy via STP over 3 months" : "Deploy today",
              lockIn: "None",
              liveFund: idx,
            });
          return insts;
        })(),
        eq,
      ),
    },
    {
      assetClass: "mutual_funds",
      label: "Mutual Funds",
      pct: a.mutual_funds,
      monthlyAmt: sp("mutual_funds"),
      lumpSumAmt: lp("mutual_funds"),
      color: mf,
      emoji: EMOJI.mutual_funds,
      riskLabel: yrs <= 3 ? "Low" : "Medium",
      returnRange: yrs <= 3 ? "7–9%" : "12–18%",
      instruments: addColor(
        (() => {
          const insts: Instrument[] = [],
            mfS = sp("mutual_funds");
          if (p.taxBracket >= 20) {
            const e = pickFund(buckets, "elss");
            if (e)
              insts.push({
                name: shortName(e),
                type: "sip",
                amount: Math.min(Math.round(mfS * 0.6), 12500),
                platform: amc2platform(e),
                purpose: `80C · saves ₹${Math.round((150000 * p.taxBracket) / 100)}/yr · ${retStr(e)}`,
                lockIn: "3 years",
                liveFund: e,
              });
          }
          if (yrs <= 3) {
            const d = pickFund(buckets, "debtShort", "liquid");
            if (d)
              insts.push({
                name: shortName(d),
                type: "sip",
                amount: mfS,
                platform: amc2platform(d),
                purpose: `Capital protection · ${retStr(d)}`,
                lockIn: "None",
                liveFund: d,
              });
          } else {
            const h = pickFund(buckets, "hybrid", "flexiCap");
            if (h)
              insts.push({
                name: shortName(h),
                type: "sip",
                amount: Math.round(mfS * (p.taxBracket >= 20 ? 0.4 : 1)),
                platform: amc2platform(h),
                purpose: `Auto rebalancing · ${retStr(h)}`,
                lockIn: "None",
                liveFund: h,
              });
          }
          return insts.filter((i) => i.amount > 0);
        })(),
        mf,
      ),
    },
    {
      assetClass: "govt_schemes",
      label: "Govt Schemes",
      pct: a.govt_schemes,
      monthlyAmt: sp("govt_schemes"),
      lumpSumAmt: lp("govt_schemes"),
      color: gs,
      emoji: EMOJI.govt_schemes,
      riskLabel: "Very Low",
      returnRange: `${R.ppf}–${R.ssy}%`,
      instruments: addColor(
        [
          {
            name: "PPF — Public Provident Fund",
            type: "sip",
            amount: Math.min(Math.round(sp("govt_schemes") * 0.6), 12500),
            platform: "SBI / Post Office online",
            purpose: `80C + EEE · ${R.ppf}% guaranteed`,
            lockIn: "15 years",
          },
          {
            name: "NPS Tier 1 — 80CCD(1B)",
            type: "sip",
            amount: Math.min(Math.round(sp("govt_schemes") * 0.4), 4167),
            platform: "eNPS.nsdl.com (free)",
            purpose: "Extra ₹50k beyond 80C",
            lockIn: "Until age 60",
          },
          ...(p.hasGirlChild && (p.girlChildAge ?? 0) < 10
            ? [
                {
                  name: "Sukanya Samriddhi Yojana",
                  type: "lump-sum" as const,
                  amount: Math.min(lp("govt_schemes"), 150000),
                  platform: "Post Office / SBI",
                  purpose: `${R.ssy}% guaranteed EEE`,
                  lockIn: "21 years",
                },
              ]
            : []),
        ].filter((i) => i.amount > 0) as Instrument[],
        gs,
      ),
    },
    {
      assetClass: "fixed_income",
      label: "Fixed Income",
      pct: a.fixed_income,
      monthlyAmt: 0,
      lumpSumAmt: lp("fixed_income") + sp("fixed_income") * 6,
      color: fi,
      emoji: EMOJI.fixed_income,
      riskLabel: "Low",
      returnRange: `${R.bestFD1yr.toFixed(1)}–${R.bestFD3yr.toFixed(1)}%`,
      instruments: addColor(
        [
          {
            name: `${R.topFDBank} FD (42 months)`,
            type: "lump-sum",
            amount: Math.min(lp("fixed_income"), 200000),
            platform: "bajajfinserv.in (online)",
            purpose: `${R.bestFD3yr.toFixed(2)}% guaranteed`,
            lockIn: "42 months",
          },
          {
            name: "AU Small Finance Bank FD",
            type: "lump-sum",
            amount: Math.max(0, lp("fixed_income") - 200000),
            platform: "aubank.in",
            purpose: `${R.bestFD1yr.toFixed(2)}% · DICGC insured`,
            lockIn: "18 months",
          },
        ].filter((i) => i.amount > 1000) as Instrument[],
        fi,
      ),
    },
    {
      assetClass: "alternatives",
      label: "Alternatives",
      pct: a.alternatives,
      monthlyAmt: 0,
      lumpSumAmt: lp("alternatives"),
      color: al,
      emoji: EMOJI.alternatives,
      riskLabel: risk === "aggressive" ? "High" : "Medium",
      returnRange: "8–25%",
      instruments: addColor(
        [
          {
            name: "Sovereign Gold Bond (SGB)",
            type: "lump-sum",
            amount: Math.round(lp("alternatives") * 0.7),
            platform: "HDFC Securities / SBI Net Banking",
            purpose: `2.5% p.a. + gold upside · ₹${R.sgbUnit.toLocaleString("en-IN")}/unit`,
            lockIn: "8 years (tax-free)",
          },
          ...(risk === "aggressive"
            ? [
                {
                  name: "Bitcoin (max 2%)",
                  type: "lump-sum" as const,
                  amount: Math.round(lp("alternatives") * 0.15),
                  platform: "CoinDCX / Zerodha",
                  purpose: "High-risk speculative",
                  lockIn: "None",
                },
              ]
            : []),
          {
            name: "CRED Mint / Liquiloans (P2P)",
            type: "lump-sum",
            amount: Math.round(
              lp("alternatives") * (risk === "aggressive" ? 0.15 : 0.3),
            ),
            platform: "CRED app",
            purpose: "10–13% · RBI regulated NBFC",
            lockIn: "3–12 months",
          },
        ].filter((i) => i.amount > 500) as Instrument[],
        al,
      ),
    },
    {
      assetClass: "real_estate",
      label: "Real Estate",
      pct: a.real_estate,
      monthlyAmt: 0,
      lumpSumAmt: lp("real_estate"),
      color: re,
      emoji: EMOJI.real_estate,
      riskLabel: "Medium",
      returnRange: "8–15%",
      instruments: addColor(
        lp("real_estate") >= 300
          ? [
              {
                name: "Embassy REIT / Mindspace REIT",
                type: "lump-sum",
                amount: Math.round(lp("real_estate") * 0.7),
                platform: "Zerodha / Groww (NSE listed)",
                purpose: "Commercial RE income + growth",
                lockIn: "None (listed)",
              },
              ...(lp("real_estate") >= 25000
                ? [
                    {
                      name: "Strata / hBits Fractional",
                      type: "lump-sum" as const,
                      amount: Math.round(lp("real_estate") * 0.3),
                      platform: "strata.in / hbits.co",
                      purpose: "9–10% rental yield",
                      lockIn: "3 years",
                    },
                  ]
                : []),
            ]
          : [],
        re,
      ),
    },
    {
      assetClass: "cash",
      label: "Cash & Liquid",
      pct: a.cash,
      monthlyAmt: sp("cash"),
      lumpSumAmt: 0,
      color: ca,
      emoji: EMOJI.cash,
      riskLabel: "Very Low",
      returnRange: "6.8–7%",
      instruments: addColor(
        (() => {
          const liqFund = pickFund(buckets, "liquid");
          return [
            {
              name: "IDFC FIRST Savings (7% p.a.)",
              type: "sip" as const,
              amount: sp("cash"),
              platform: "IDFC FIRST Bank app",
              purpose: "Emergency buffer + sweep",
              lockIn: "None",
            },
            ...(liqFund
              ? [
                  {
                    name: shortName(liqFund),
                    type: "lump-sum" as const,
                    amount: 0,
                    platform: amc2platform(liqFund),
                    purpose: `Surplus above ₹1L · T+1 · ${retStr(liqFund)}`,
                    lockIn: "None",
                    liveFund: liqFund,
                  },
                ]
              : []),
          ].filter((i) => i.amount > 0);
        })(),
        ca,
      ),
    },
  ];
  return slices.filter((s) => s.pct > 0);
}

function ReturnBar({
  label,
  value,
  max,
  color,
  hero = false,
}: {
  label: string;
  value: number | null;
  max: number;
  color: string;
  hero?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  if (value === null)
    return (
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "text-[10px] text-muted-foreground/40 shrink-0 text-right",
            hero ? "w-8" : "w-6",
          )}
        >
          {label}
        </span>
        <div
          className={cn(
            "flex-1 rounded-full bg-white/[0.06]",
            hero ? "h-2.5" : "h-1.5",
          )}
        />
        <span className="text-[10px] text-muted-foreground/30 w-10 text-right">
          —
        </span>
      </div>
    );
  const pct = Math.min(100, Math.max(0, (Math.abs(value) / max) * 100)),
    neg = value < 0,
    dc = neg ? "#ef4444" : color;
  return (
    <div ref={ref} className="flex items-center gap-2.5">
      <span
        className={cn(
          "text-[10px] shrink-0 text-right font-medium",
          hero ? "w-8 text-foreground/80" : "w-6 text-muted-foreground/60",
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "flex-1 rounded-full bg-white/[0.10] overflow-hidden relative",
          hero ? "h-2.5" : "h-1.5",
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: inView ? `${pct}%` : 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: hero ? 0.1 : 0 }}
          className="h-full rounded-full relative"
          style={{
            background: neg ? dc : `linear-gradient(90deg,${dc}cc,${dc})`,
          }}
        >
          {hero && !neg && (
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full blur-sm"
              style={{ background: dc, opacity: 0.7 }}
            />
          )}
        </motion.div>
      </div>
      <span
        className={cn(
          "font-bold w-12 text-right tabular-nums flex items-center justify-end gap-0.5",
          hero
            ? "text-sm"
            : neg
              ? "text-[11px] text-red-400"
              : "text-[11px] text-emerald-400",
        )}
      >
        <span className={neg ? "text-red-400" : "text-emerald-400"}>
          {neg ? "▼" : "▲"}
        </span>
        {Math.abs(value).toFixed(1)}%
      </span>
    </div>
  );
}

function FundCard({
  fund,
  amount,
  type,
  purpose,
  sliceColor,
}: {
  fund: FundLiveData;
  amount: number;
  type: "sip" | "lump-sum";
  purpose: string;
  sliceColor?: string;
}) {
  const r = fund.returns,
    max = Math.max(
      Math.abs(r.oneYear ?? 0),
      Math.abs(r.threeYear ?? 0),
      Math.abs(r.fiveYear ?? 0),
      15,
    ),
    col = catColor(fund.category ?? ""),
    hasR = r.oneYear !== null || r.threeYear !== null || r.fiveYear !== null;
  return (
    <div
      className="rounded-xl overflow-hidden border border-white/[0.09]"
      style={{
        background: `linear-gradient(135deg,${sliceColor || col}08 0%,transparent 60%)`,
      }}
    >
      <div
        className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg,${col},transparent)` }}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-snug text-foreground/95">
              {fund.schemeName}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[9px] text-muted-foreground/50">
                {fund.amcName}
              </span>
              {fund.category && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    color: col,
                    background: `${col}15`,
                    border: `1px solid ${col}30`,
                  }}
                >
                  {fund.category}
                </span>
              )}
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Direct
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                type === "sip" ? "text-violet-400" : "text-amber-400",
              )}
            >
              {type === "sip" ? `${fmtC(amount)}/mo` : fmtC(amount)}
            </p>
            {fund.nav > 0 && (
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                NAV ₹{fund.nav.toFixed(fund.nav < 100 ? 2 : 0)}
              </p>
            )}
            <span
              className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block",
                type === "sip"
                  ? "bg-violet-500/15 text-violet-400"
                  : "bg-amber-500/15 text-amber-400",
              )}
            >
              {type === "sip" ? "📅 SIP" : "⚡ Lump Sum"}
            </span>
          </div>
        </div>
        {purpose && (
          <p className="text-[10px] text-muted-foreground/50 mt-2">{purpose}</p>
        )}
      </div>
      {hasR && (
        <div className="px-4 pb-4 pt-3 border-t border-white/[0.05] space-y-2">
          <p className="text-[9px] text-muted-foreground/50 mb-2.5 uppercase tracking-widest">
            Trailing returns · 3Y &amp; 5Y annualised
          </p>
          <ReturnBar label="1Y" value={r.oneYear} max={max} color={col} />
          <ReturnBar
            label="3Y"
            value={r.threeYear}
            max={max}
            color={col}
            hero
          />
          <ReturnBar label="5Y" value={r.fiveYear} max={max} color={col} />
        </div>
      )}
    </div>
  );
}

function PerfTable({
  title,
  funds,
  color,
}: {
  title: string;
  funds: FundLiveData[];
  color: string;
}) {
  if (!funds.length) return null;
  const sorted = [...funds]
    .sort(
      (a, b) =>
        (b.returns.oneYear ?? b.returns.threeYear ?? -999) -
        (a.returns.oneYear ?? a.returns.threeYear ?? -999),
    )
    .slice(0, 6);
  const cell = (v: number | null) =>
    v !== null ? (
      <span
        className={cn(
          "text-xs font-bold tabular-nums flex items-center justify-end gap-0.5",
          v >= 0 ? "text-emerald-400" : "text-red-400",
        )}
      >
        <span className="text-[9px]">{v >= 0 ? "▲" : "▼"}</span>
        {Math.abs(v).toFixed(1)}%
      </span>
    ) : (
      <span className="text-[10px] text-muted-foreground/25 block text-right">
        —
      </span>
    );
  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg,${color}20,${color}08)` }}
      >
        <p className="text-xs font-bold" style={{ color }}>
          {title}
        </p>
        <span className="text-[9px] text-muted-foreground/50 border border-white/10 px-2 py-0.5 rounded-full">
          {sorted.length} funds
        </span>
      </div>
      <div className="grid grid-cols-12 px-4 py-1.5 border-b border-white/[0.04]">
        <span className="col-span-1 text-[9px] text-muted-foreground/40 uppercase tracking-widest">
          #
        </span>
        <span className="col-span-6 text-[9px] text-muted-foreground/40 uppercase tracking-widest">
          Fund
        </span>
        <span className="col-span-2 text-[9px] text-muted-foreground/40 uppercase tracking-widest text-right">
          1Y
        </span>
        <span className="col-span-3 text-[9px] text-muted-foreground/40 uppercase tracking-widest text-right">
          3Y CAGR
        </span>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {sorted.map((f, i) => {
          const name = f.schemeName
            .replace(/ - Direct Plan/gi, "")
            .replace(/ Direct$/gi, "")
            .replace(/ \(D\)$/gi, "")
            .trim();
          const isTop = i === 0;
          return (
            <div
              key={f.schemeCode}
              className="grid grid-cols-12 px-4 py-2.5 items-center transition-colors hover:bg-white/[0.02]"
              style={isTop ? { background: `${color}08` } : {}}
            >
              <div className="col-span-1">
                {isTop ? (
                  <span className="text-[10px] font-bold" style={{ color }}>
                    🥇
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/30 font-mono">
                    {i + 1}
                  </span>
                )}
              </div>
              <div className="col-span-6 min-w-0 pr-2">
                <p
                  className={cn(
                    "text-[11px] font-medium leading-tight truncate",
                    isTop ? "text-foreground" : "text-foreground/80",
                  )}
                >
                  {name}
                </p>
                {f.nav > 0 && (
                  <p className="text-[9px] text-muted-foreground/35 mt-0.5">
                    NAV ₹{f.nav.toFixed(f.nav < 100 ? 2 : 0)}
                  </p>
                )}
              </div>
              <div className="col-span-2">{cell(f.returns.oneYear)}</div>
              <div className="col-span-3">{cell(f.returns.threeYear)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Donut({ slices, glowColor }: { slices: Slice[]; glowColor: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });
  const R = 80,
    cx = 100,
    cy = 100,
    sw = 26,
    C = 2 * Math.PI * R;
  let off = 0;
  const segs = slices.map((s, i) => {
    const d = (s.pct / 100) * C,
      o = off;
    off += d;
    return { s, d, o, i };
  });
  return (
    <svg
      ref={ref}
      viewBox="0 0 200 200"
      className="w-full max-w-[170px] sm:max-w-[200px] drop-shadow-2xl"
    >
      <defs>
        <radialGradient id="dg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={95} fill="url(#dg)" />
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={sw}
      />
      {segs.map(({ s, d, o, i }) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={s.color}
          strokeWidth={sw}
          strokeLinecap="butt"
          strokeDasharray={`${d} ${C - d}`}
          strokeDashoffset={-o}
          transform={`rotate(-90 ${cx} ${cy})`}
          opacity={0.9}
          initial={{ strokeDasharray: `0 ${C}` }}
          animate={inView ? { strokeDasharray: `${d} ${C - d}` } : {}}
          transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
        />
      ))}
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="700"
        fontFamily="Georgia, serif"
      >
        {slices.length}
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize="9"
      >
        asset classes
      </text>
    </svg>
  );
}

function CorpusChart({
  rows,
  target,
}: {
  rows: ReturnType<typeof yearByYear>;
  target: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });
  if (!rows.length) return null;
  const maxV = Math.max(target * 1.1, rows[rows.length - 1].total);
  const W = 320,
    H = 120,
    pad = { t: 14, r: 12, b: 32, l: 48 };
  const iW = W - pad.l - pad.r,
    iH = H - pad.t - pad.b;
  const xP = (i: number) => pad.l + (i / Math.max(rows.length - 1, 1)) * iW,
    yP = (v: number) => pad.t + iH - (v / maxV) * iH;
  const tP = rows
    .map((r, i) => `${i === 0 ? "M" : "L"}${xP(i)},${yP(r.total)}`)
    .join(" ");
  const iP = rows
    .map((r, i) => `${i === 0 ? "M" : "L"}${xP(i)},${yP(r.invested)}`)
    .join(" ");
  const tY = yP(target);
  const yLabels = [0, maxV * 0.5, maxV].map((v) => ({
    v,
    y: yP(v),
    label: fmtC(v),
  }));
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {yLabels.map(({ v, y, label }) => (
        <g key={v}>
          <line
            x1={pad.l}
            y1={y}
            x2={W - pad.r}
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <text
            x={pad.l - 4}
            y={y + 4}
            textAnchor="end"
            fill="rgba(255,255,255,0.3)"
            fontSize="7"
          >
            {label}
          </text>
        </g>
      ))}
      <line
        x1={pad.l}
        y1={tY}
        x2={W - pad.r}
        y2={tY}
        stroke="#f59e0b"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        opacity={0.7}
      />
      <text
        x={W - pad.r - 2}
        y={tY - 5}
        fill="#f59e0b"
        fontSize="7"
        textAnchor="end"
        fontWeight="600"
      >
        Target {fmtC(target)}
      </text>
      <path
        d={`${tP} L${xP(rows.length - 1)},${pad.t + iH} L${xP(0)},${pad.t + iH} Z`}
        fill="url(#cg)"
      />
      <path
        d={iP}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
      <motion.path
        d={tP}
        fill="none"
        stroke="#10b981"
        strokeWidth={2.5}
        strokeLinejoin="round"
        filter="url(#glow)"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      {rows.map((r, i) => (
        <g key={i}>
          <circle
            cx={xP(i)}
            cy={yP(r.total)}
            r={4}
            fill="#0a0a0a"
            stroke="#10b981"
            strokeWidth={2}
          />
          <circle cx={xP(i)} cy={yP(r.total)} r={1.5} fill="#10b981" />
        </g>
      ))}
      {rows
        .filter((_, i) => i === 0 || (i + 1) % 2 === 0 || i === rows.length - 1)
        .map((r) => {
          const i = rows.indexOf(r);
          return (
            <text
              key={i}
              x={xP(i)}
              y={H - 4}
              textAnchor="middle"
              fill="rgba(255,255,255,0.3)"
              fontSize="7"
            >
              {r.year}
            </text>
          );
        })}
    </svg>
  );
}

function Section({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          {accent && (
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
            />
          )}
          <h2 className="font-serif text-xl font-bold tracking-tight">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-2 shrink-0" />
          <p className="text-xs text-muted-foreground/55 leading-relaxed flex-1">
            {subtitle}
          </p>
        </div>
        <div
          className="mt-3 h-px"
          style={{
            background: `linear-gradient(90deg,${accent || "rgba(255,255,255,0.1)"},transparent)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div
      className="h-px my-1"
      style={{
        background:
          "linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)",
      }}
    />
  );
}
function TableSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-white/8 overflow-hidden"
        >
          <div className="h-11 bg-white/5 animate-pulse" />
          <div className="divide-y divide-white/5">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-10 bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
  sub?: string;
}) {
  return (
    <div
      className="relative p-4 rounded-xl border border-white/[0.07] overflow-hidden"
      style={{ background: `linear-gradient(135deg,${color}10,${color}04)` }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5"
        style={{ background: color }}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-4xl opacity-[0.07] select-none">
        {icon}
      </div>
      <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      {sub && (
        <p className="text-[9px] text-muted-foreground/40 mt-0.5">{sub}</p>
      )}
    </div>
  );
}

export default function InvestmentReport({
  profile,
  userName = "Investor",
  marketData,
}: InvestmentReportProps) {
  const [showAllFunds, setShowAllFunds] = useState(false);
  const {
    allFunds,
    funds: byCategory,
    rates: liveRates,
    loading: fundsLoading,
    error: fundsError,
  } = useFundData();
  const effective =
    marketData ??
    (liveRates
      ? ({
          govtSchemes: {
            ppf: { rate: liveRates.govtSchemes.ppf.rate },
            ssy: { rate: liveRates.govtSchemes.ssy.rate },
            scss: { rate: liveRates.govtSchemes.scss.rate },
            nsc: { rate: liveRates.govtSchemes.nsc.rate },
            pomis: { rate: liveRates.govtSchemes.pomis.rate },
            rbiBonds: { rate: liveRates.govtSchemes.rbiBonds.rate },
          },
          fixedIncome: {
            fds: liveRates.fixedIncome.fds.map((fd) => ({
              bank: fd.bank,
              rates: {
                days365: fd.rates.days365,
                days730: fd.rates.days730,
                days1095: fd.rates.days1095,
              },
            })),
          },
          gold: {
            price24k: liveRates.gold.price24k,
            sgb: { lastIssuePrice: liveRates.gold.sgb.lastIssuePrice },
          },
        } as LiveRates)
      : undefined);
  const recs = useMemo(
    () => generatePreciseRecommendations(profile, effective),
    [profile, effective],
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
    ),
    ls = profile.availableLumpSum;
  const cagr =
    { conservative: 9, moderate: 12, aggressive: 16 }[profile.riskAppetite] ??
    12;
  const R = useMemo(() => extractRates(effective), [effective]);
  const slices = useMemo(
    () => buildAllocation(profile, surplus, ls, R, byCategory),
    [profile, surplus, ls, R, byCategory],
  );
  const planSip = Math.max(
      1000,
      summary.totalMonthlySip > 0
        ? summary.totalMonthlySip
        : Math.round(surplus * 0.6),
    ),
    planLump = Math.min(ls, ls * 0.5);
  const table = useMemo(
    () => yearByYear(planSip, planLump, profile.goalYears, cagr),
    [planSip, planLump, profile.goalYears, cagr],
  );
  const flatC = useMemo(
    () => sipCorpus(planSip, profile.goalYears, cagr),
    [planSip, profile.goalYears, cagr],
  );
  const stepupC = useMemo(
    () => sipStepup(planSip, profile.goalYears, cagr),
    [planSip, profile.goalYears, cagr],
  );
  const totMonthly = slices.reduce((s, a) => s + a.monthlyAmt, 0),
    totLump = slices.reduce((s, a) => s + a.lumpSumAmt, 0);
  const feasPct = feasibility.achievablePct,
    isOn = feasPct >= 100;
  const stColor = isOn
    ? "#10b981"
    : feasPct >= 85
      ? "#3b82f6"
      : feasPct >= 50
        ? "#f59e0b"
        : "#ef4444";
  const stTextColor = isOn
    ? "text-emerald-400"
    : feasPct >= 85
      ? "text-blue-400"
      : feasPct >= 50
        ? "text-amber-400"
        : "text-red-400";
  const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    tYear = new Date().getFullYear() + profile.goalYears;
  const handleDL = () => {
    const s = document.createElement("style");
    s.textContent = `@media print{body{background:#0a0a0a;}.print\\:hidden{display:none!important;}}`;
    document.head.appendChild(s);
    window.print();
    setTimeout(() => document.head.removeChild(s), 2000);
  };
  const fundCats = [
    {
      key: "largeCap",
      title: "📈 Large Cap & Index",
      color: "#ef4444",
      show: true,
    },
    { key: "flexiCap", title: "🔄 Flexi Cap", color: "#8b5cf6", show: true },
    { key: "midCap", title: "📊 Mid Cap", color: "#f97316", show: true },
    {
      key: "smallCap",
      title: "🚀 Small Cap",
      color: "#ec4899",
      show: profile.riskAppetite === "aggressive",
    },
    {
      key: "elss",
      title: "💰 ELSS — 80C",
      color: "#06b6d4",
      show: profile.taxBracket >= 20,
    },
    {
      key: "hybrid",
      title: "⚖️ Hybrid / BAF",
      color: "#10b981",
      show: showAllFunds,
    },
    {
      key: "debtShort",
      title: "🏦 Short Duration Debt",
      color: "#3b82f6",
      show: showAllFunds || profile.goalYears <= 3,
    },
    { key: "liquid", title: "💧 Liquid", color: "#06b6d4", show: showAllFunds },
  ].filter((c) => c.show && (byCategory[c.key]?.length ?? 0) > 0);

  return (
    <div
      className="relative w-full max-w-2xl mx-auto space-y-10 pb-16 print:pb-4"
      style={{
        backgroundImage:
          "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Ambient corner glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl"
          style={{ background: "rgba(6,182,212,0.04)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl"
          style={{ background: "rgba(245,158,11,0.04)" }}
        />
      </div>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: "0 0 6px #10b981" }}
            />
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">
              Investment Report · {today}
            </p>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            {userName}'s Financial Plan
          </h1>
          <p className="text-xs text-muted-foreground/50 mt-1">
            {profile.age} yrs · ₹{(profile.monthlyIncome / 1000).toFixed(0)}k/mo
            · {profile.riskAppetite} risk
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden flex-wrap">
          {fundsLoading && (
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading NAVs…
            </span>
          )}
          {!fundsLoading && !fundsError && allFunds.length > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400/70 border border-emerald-500/20 px-2.5 py-1 rounded-full bg-emerald-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {allFunds.length} funds live
            </span>
          )}
          <button
            onClick={handleDL}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
        </div>
      </div>

      {/* GOAL HERO */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 sm:p-8"
        style={{
          background: `radial-gradient(ellipse 60% 60% at 80% 50%,${stColor}18,transparent 70%), linear-gradient(135deg,#18181b,#0f0f0f)`,
          boxShadow: `inset 0 0 0 1px ${stColor}20, 0 0 60px ${stColor}06`,
        }}
      >
        <div className="relative flex flex-col-reverse sm:grid sm:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.2em] mb-2"
                style={{ color: stColor }}
              >
                {summary.goalName}
              </p>
              <p className="font-serif text-4xl font-bold tracking-tight">
                {fmtC(profile.goalAmountTarget)}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                by {tYear} · {profile.goalYears} years
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-1">
                Projected corpus
              </p>
              <p
                className={cn(
                  "text-4xl sm:text-5xl font-bold tabular-nums tracking-tight",
                  stTextColor,
                )}
              >
                {fmtC(feasibility.projectedCorpus)}
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                {feasPct}% of target achieved
              </p>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, feasPct)}%` }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="h-full rounded-full relative"
                style={{
                  background: `linear-gradient(90deg,${stColor}88,${stColor})`,
                }}
              >
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full blur-sm"
                  style={{ background: stColor, opacity: 0.8 }}
                />
              </motion.div>
            </div>
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{
                background: "rgba(139,92,246,0.08)",
                borderColor: "rgba(139,92,246,0.2)",
              }}
            >
              <TrendingUp className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <span className="text-xs text-violet-300">
                10% step-up → <strong>{fmtC(stepupC)}</strong>{" "}
                <span className="text-violet-400/60">
                  (+{fmtC(stepupC - flatC)})
                </span>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Donut slices={slices} glowColor={stColor} />
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
              Portfolio Allocation
            </p>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Monthly SIP"
          value={fmtC(totMonthly)}
          color="#8b5cf6"
          icon="📅"
          sub="recurring"
        />
        <StatCard
          label="Lump Sum"
          value={fmtC(Math.min(totLump, ls))}
          color="#f59e0b"
          icon="⚡"
          sub="one-time"
        />
        <StatCard
          label="Tax Saved"
          value={fmtC(summary.totalTaxSaving)}
          color="#10b981"
          icon="💰"
          sub="per year"
        />
        <StatCard
          label="Unallocated"
          value={fmtC(Math.max(0, surplus - totMonthly))}
          color="#3b82f6"
          icon="🪣"
          sub="liquid buffer"
        />
      </div>

      <Divider />

      {/* ALLOCATION */}
      <Section
        title="Portfolio Allocation"
        subtitle="Split across 7 asset classes — tuned to risk appetite and goal horizon"
        accent="#f59e0b"
      >
        <div className="space-y-4">
          <div
            className="flex h-7 rounded-2xl overflow-hidden gap-0.5 p-0.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {slices
              .filter((s) => s.pct > 0)
              .map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl h-full transition-all hover:opacity-90 cursor-default"
                  style={{
                    flex: s.pct,
                    background: `linear-gradient(135deg,${s.color}dd,${s.color}99)`,
                    boxShadow: `0 2px 8px ${s.color}33`,
                  }}
                  title={`${s.label}: ${s.pct}%`}
                />
              ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {slices.map((s, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border cursor-default"
                style={{
                  color: s.color,
                  borderColor: `${s.color}30`,
                  background: `${s.color}10`,
                }}
              >
                {s.emoji} {s.label} <span className="opacity-60">{s.pct}%</span>
              </motion.span>
            ))}
          </div>
        </div>
      </Section>

      <Divider />

      {/* INVESTMENT PLAN */}
      <Section
        title="Complete Investment Plan"
        subtitle="Live NAV · trailing 1Y / 3Y / 5Y returns · exact SIP and lump sum amounts"
        accent="#8b5cf6"
      >
        <div className="space-y-4">
          {slices.map((slice, si) => (
            <motion.div
              key={si}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.06 }}
              className="rounded-2xl overflow-hidden border border-white/[0.07]"
              style={{
                boxShadow: `0 0 0 1px ${slice.color}12, 0 4px 24px ${slice.color}06`,
              }}
            >
              <div
                className="h-0.5 w-full"
                style={{
                  background: `linear-gradient(90deg,${slice.color},${slice.color}33,transparent)`,
                }}
              />
              <div
                className="flex items-center gap-4 px-5 py-4"
                style={{
                  background: `linear-gradient(135deg,${slice.color}14,${slice.color}06)`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{
                    background: `${slice.color}18`,
                    border: `1px solid ${slice.color}25`,
                  }}
                >
                  {slice.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="text-sm font-bold"
                      style={{ color: slice.color }}
                    >
                      {slice.label}
                    </p>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-bold border"
                      style={{
                        color: slice.color,
                        borderColor: `${slice.color}40`,
                        background: `${slice.color}15`,
                      }}
                    >
                      {slice.pct}% · {slice.riskLabel}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {slice.returnRange}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {slice.monthlyAmt > 0 && (
                    <p className="text-sm font-bold text-violet-400">
                      {fmtC(slice.monthlyAmt)}/mo
                    </p>
                  )}
                  {slice.lumpSumAmt > 0 && (
                    <p className="text-sm font-bold text-amber-400">
                      {fmtC(slice.lumpSumAmt)} lump
                    </p>
                  )}
                </div>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {slice.instruments.map((inst, ii) =>
                  inst.liveFund ? (
                    <div key={ii} className="p-4">
                      <FundCard
                        fund={inst.liveFund}
                        amount={inst.amount}
                        type={inst.type}
                        purpose={inst.purpose}
                        sliceColor={slice.color}
                      />
                    </div>
                  ) : (
                    <div
                      key={ii}
                      className="flex items-start justify-between gap-3 px-5 py-4 relative"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                        style={{ background: slice.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground/90">
                          {inst.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground/55 mt-0.5">
                          {inst.purpose}
                        </p>
                        {inst.lockIn !== "None" && (
                          <p className="text-[9px] text-orange-400 mt-1 flex items-center gap-1">
                            <span>🔒</span>
                            {inst.lockIn}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/35 mt-1">
                          {inst.platform}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            "text-xs font-bold tabular-nums",
                            inst.type === "sip"
                              ? "text-violet-400"
                              : "text-amber-400",
                          )}
                        >
                          {inst.type === "sip"
                            ? `${fmtC(inst.amount)}/mo`
                            : fmtC(inst.amount)}
                        </p>
                        <span
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block",
                            inst.type === "sip"
                              ? "bg-violet-500/15 text-violet-400"
                              : "bg-amber-500/15 text-amber-400",
                          )}
                        >
                          {inst.type === "sip" ? "📅 SIP" : "⚡ Lump"}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* FUND PERFORMANCE */}
      <Section
        title="Fund Performance"
        subtitle="Live NAV from AMFI · 1Y point-to-point · 3Y annualised CAGR · ▲▼ direction indicators"
        accent="#06b6d4"
      >
        {fundsLoading ? (
          <TableSkeleton />
        ) : fundsError ? (
          <div className="p-4 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-400">
            Fund data unavailable: {fundsError}
          </div>
        ) : (
          <div className="space-y-4">
            {fundCats.map((cat) => (
              <PerfTable
                key={cat.key}
                title={cat.title}
                funds={byCategory[cat.key] ?? []}
                color={cat.color}
              />
            ))}
            <button
              onClick={() => setShowAllFunds((v) => !v)}
              className="w-full py-2.5 rounded-xl border border-white/[0.07] text-xs text-muted-foreground/50 hover:text-foreground hover:border-white/[0.12] flex items-center justify-center gap-2 transition-all"
            >
              {showAllFunds ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Fewer categories
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  All categories (Hybrid, Liquid, Debt)
                </>
              )}
            </button>
          </div>
        )}
      </Section>

      <Divider />

      {/* CORPUS GROWTH */}
      <Section
        title="Year-by-Year Corpus Growth"
        subtitle={`₹${planSip.toLocaleString()}/mo SIP · ${cagr}% CAGR · Y-axis in ₹ · animated on scroll`}
        accent="#10b981"
      >
        <div className="space-y-4">
          <div
            className="p-5 rounded-2xl border border-white/[0.07]"
            style={{
              background:
                "linear-gradient(135deg,rgba(16,185,129,0.04),transparent)",
            }}
          >
            <CorpusChart rows={table} target={profile.goalAmountTarget} />
            <div className="flex gap-5 mt-4 justify-center">
              {[
                { color: "#10b981", label: "Corpus", d: false },
                { color: "rgba(255,255,255,0.15)", label: "Invested", d: true },
                { color: "#f59e0b", label: "Target", d: true },
              ].map((l) => (
                <span
                  key={l.label}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50"
                >
                  <span
                    className="w-6 h-0.5 rounded-full"
                    style={{ background: l.color, opacity: l.d ? 0.6 : 1 }}
                  />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.07] overflow-hidden">
            <div
              className="grid grid-cols-4 px-4 py-2 border-b border-white/[0.05] text-[9px] text-muted-foreground/40 uppercase tracking-widest"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <span>Year</span>
              <span className="text-right">SIP Corpus</span>
              <span className="text-right">Total</span>
              <span className="text-right">Returns</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {(showAllFunds
                ? table
                : table.filter((_, i) => i < 5 || i === table.length - 1)
              ).map((r, i, arr) => (
                <div
                  key={i}
                  className={cn(
                    "grid grid-cols-4 px-4 py-2.5 text-xs transition-colors",
                    i === arr.length - 1
                      ? "font-semibold"
                      : "hover:bg-white/[0.02]",
                  )}
                  style={
                    i === arr.length - 1
                      ? { background: "rgba(245,158,11,0.06)" }
                      : {}
                  }
                >
                  <span className="text-muted-foreground/50">{r.year}</span>
                  <span className="text-right text-violet-400 tabular-nums">
                    {fmtC(r.sipCorpus)}
                  </span>
                  <span className="text-right text-emerald-400 tabular-nums">
                    {fmtC(r.total)}
                  </span>
                  <span className="text-right text-green-400 tabular-nums">
                    +{fmtC(r.returns)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Divider />

      {/* SIP STEP-UP */}
      {profile.goalYears >= 3 && (
        <Section
          title="SIP Step-Up Impact"
          subtitle="10% annual increase — the single most powerful lever in long-term compounding"
          accent="#8b5cf6"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-4 rounded-xl border border-white/[0.07] text-center"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <p className="text-[10px] text-muted-foreground/50 mb-2">
                  Flat SIP · {fmtC(planSip)}/mo
                </p>
                <p className="font-serif text-2xl font-bold">{fmtC(flatC)}</p>
                <p className="text-[10px] text-muted-foreground/40 mt-1">
                  in {profile.goalYears} years
                </p>
              </div>
              <div
                className="p-4 rounded-xl border text-center relative overflow-hidden"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 0%,rgba(139,92,246,0.2),rgba(139,92,246,0.06))",
                  borderColor: "rgba(139,92,246,0.25)",
                }}
              >
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Star className="w-3 h-3 text-violet-400 fill-violet-400" />
                  <p className="text-[10px] text-violet-400">
                    10% annual step-up
                  </p>
                </div>
                <p className="font-serif text-2xl font-bold text-violet-300">
                  {fmtC(stepupC)}
                </p>
                <div
                  className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: "rgba(139,92,246,0.2)",
                    color: "#a78bfa",
                    border: "1px solid rgba(139,92,246,0.3)",
                  }}
                >
                  <Sparkles className="w-3 h-3" />+{fmtC(stepupC - flatC)} extra
                </div>
              </div>
            </div>
            <div
              className="p-4 rounded-xl border border-white/[0.07] space-y-3"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              {[
                {
                  label: "Flat SIP",
                  val: flatC,
                  bg: "linear-gradient(90deg,rgba(255,255,255,0.15),rgba(255,255,255,0.08))",
                },
                {
                  label: "With step-up",
                  val: stepupC,
                  bg: "linear-gradient(90deg,#7c3aed,#8b5cf6)",
                },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground/50 w-20 shrink-0 text-right">
                    {b.label}
                  </span>
                  <div className="flex-1 h-3.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(b.val / Math.max(stepupC, 1)) * 100}%`,
                      }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: b.bg }}
                    />
                  </div>
                  <span className="text-xs font-bold w-16 text-right tabular-nums">
                    {fmtC(b.val)}
                  </span>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground/40 leading-relaxed pt-1 border-t border-white/[0.04]">
                Yr 1: {fmtC(planSip)}/mo → Yr 2:{" "}
                {fmtC(Math.round(planSip * 1.1))}/mo → Yr 5:{" "}
                {fmtC(Math.round(planSip * Math.pow(1.1, 4)))}/mo · Increase
                every April.
              </p>
            </div>
          </div>
        </Section>
      )}

      <Divider />

      {/* TAX SAVINGS */}
      <Section
        title="Tax Savings Breakdown"
        subtitle="Every deduction available to you this financial year"
        accent="#10b981"
      >
        <div className="space-y-2">
          {[
            {
              label: "Section 80C",
              limit: "₹1,50,000",
              saving: Math.round((150000 * profile.taxBracket) / 100),
              desc: "PPF + ELSS + EPF + SSY",
              icon: "📌",
              color: TAX_COLORS[0],
              highlight: false,
            },
            {
              label: "Section 80CCD(1B)",
              limit: "₹50,000",
              saving: Math.round((50000 * profile.taxBracket) / 100),
              desc: "NPS — beyond 80C",
              icon: "🏛️",
              color: TAX_COLORS[1],
              highlight: false,
            },
            {
              label: "Section 80D",
              limit: "₹50,000",
              saving: Math.round((50000 * profile.taxBracket) / 100),
              desc: "Health insurance premium",
              icon: "🏥",
              color: TAX_COLORS[2],
              highlight: false,
            },
            {
              label: "Total saved / year",
              limit: "₹2,50,000",
              saving: Math.round((250000 * profile.taxBracket) / 100),
              desc: `At ${profile.taxBracket}% bracket + 4% cess`,
              icon: "💰",
              color: TAX_COLORS[3],
              highlight: true,
            },
          ].map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-4 p-4 rounded-xl border relative overflow-hidden"
              style={
                t.highlight
                  ? {
                      background: `linear-gradient(135deg,${t.color}14,${t.color}06)`,
                      borderColor: `${t.color}30`,
                    }
                  : {
                      background: "rgba(255,255,255,0.025)",
                      borderColor: "rgba(255,255,255,0.07)",
                    }
              }
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5"
                style={{ background: t.color }}
              />
              <span className="text-2xl shrink-0 ml-2">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    t.highlight ? "text-foreground" : "text-foreground/85",
                  )}
                >
                  {t.label}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                  {t.desc} · limit {t.limit}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className="text-xl font-bold tabular-nums"
                  style={{ color: t.color }}
                >
                  ₹{t.saving.toLocaleString()}
                </p>
                <p className="text-[9px] text-muted-foreground/40">saved/yr</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {!isOn && feasibility.altScenarios.length > 0 && (
        <>
          <Divider />
          <Section
            title="Paths to Close the Gap"
            subtitle="Concrete alternatives if the goal needs adjustment"
            accent="#f59e0b"
          >
            <div className="space-y-3">
              {feasibility.altScenarios.map((alt, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-4 p-4 rounded-xl border border-white/[0.07]"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{
                      background: "rgba(245,158,11,0.12)",
                      color: "#f59e0b",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/90">
                      {alt.label}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5 leading-relaxed">
                      {alt.description}
                    </p>
                    <p className="text-[10px] text-amber-400 mt-1.5 font-semibold">
                      → {alt.action}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* FOOTER */}
      <div
        className="text-center space-y-2 pt-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center justify-center gap-2">
          <div className="w-1 h-1 rounded-full bg-emerald-400/60" />
          <p className="text-xs text-muted-foreground/40">
            PaisaDekho AI · {today}
            {!fundsLoading && allFunds.length > 0
              ? ` · ${allFunds.length} funds from AMFI`
              : ""}
          </p>
          <div className="w-1 h-1 rounded-full bg-emerald-400/60" />
        </div>
        <p className="text-[10px] text-muted-foreground/25 leading-relaxed max-w-md mx-auto">
          NAVs from api.mfapi.in (official AMFI). 3Y &amp; 5Y returns are
          annualised CAGR. Past performance does not guarantee future results.
          Consult a SEBI-registered fee-only advisor before large investment
          decisions.
        </p>
      </div>
    </div>
  );
}
