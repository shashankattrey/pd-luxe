"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Zap,
  PieChart,
  Target,
  Activity,
  Globe,
  Layers,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  Lock,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronDown,
  CircleCheck,
} from "lucide-react";
import { useFundData, FundData } from "@/hooks/useFundData";
import { getCleanCategory } from "@/lib/category-utils";

// ─── types ───────────────────────────────────────────────────────────────────
type Category =
  | "all"
  | "largeCap"
  | "midCap"
  | "smallCap"
  | "flexiCap"
  | "multiCap"
  | "elss"
  | "index"
  | "value";
type SortKey = "cagr3y" | "cagr1y" | "nav" | "name";
type RiskLevel = "all" | "low" | "moderate" | "high" | "veryHigh";
type View = "list" | "detail";
type DetailTab = "overview" | "returns" | "composition" | "risk";

const PAGE_SIZE = 15;

// ─── category meta ────────────────────────────────────────────────────────────
const CATS: Record<
  string,
  { label: string; icon: any; accent: string; desc: string }
> = {
  all: {
    label: "All Funds",
    icon: Globe,
    accent: "#22d3ee",
    desc: "Every verified direct scheme",
  },
  largeCap: {
    label: "Bluechip",
    icon: ShieldCheck,
    accent: "#60a5fa",
    desc: "Top 100 companies",
  },
  midCap: {
    label: "Growth",
    icon: TrendingUp,
    accent: "#fb923c",
    desc: "Future market leaders",
  },
  smallCap: {
    label: "Aggressive",
    icon: Zap,
    accent: "#f472b6",
    desc: "High-reward early stage",
  },
  flexiCap: {
    label: "Dynamic",
    icon: Activity,
    accent: "#a78bfa",
    desc: "Flexible market exposure",
  },
  multiCap: {
    label: "Diversified",
    icon: Layers,
    accent: "#fbbf24",
    desc: "Large, Mid & Small mix",
  },
  elss: {
    label: "Tax Saver",
    icon: Target,
    accent: "#34d399",
    desc: "Section 80C optimised",
  },
  index: {
    label: "Passive",
    icon: BarChart3,
    accent: "#94a3b8",
    desc: "Low-cost index tracking",
  },
  value: {
    label: "Value",
    icon: PieChart,
    accent: "#818cf8",
    desc: "Undervalued opportunities",
  },
};

const RISK_MAP: Record<string, RiskLevel> = {
  Low: "low",
  "Moderately Low": "low",
  Moderate: "moderate",
  "Moderately High": "moderate",
  High: "high",
  "Very High": "veryHigh",
};

// ─── pure helpers (NO hooks — safe anywhere) ──────────────────────────────────
function buildSparkValues(r3: number | null | undefined): number[] {
  const base = r3 ?? 0;
  return Array.from({ length: 14 }, (_, i) => {
    const t = i / 13;
    return (
      100 *
      (1 +
        (base / 100) * t +
        Math.sin(i * 2.1) * 0.03 * (1 + Math.abs(base) / 100))
    );
  });
}

function getAccent(f: FundData): string {
  const cat = getCleanCategory(f.category).toLowerCase();
  if (cat.includes("small")) return "#f472b6";
  if (cat.includes("mid")) return "#fb923c";
  if (cat.includes("index")) return "#94a3b8";
  if (cat.includes("elss") || cat.includes("tax")) return "#34d399";
  if (cat.includes("flexi")) return "#a78bfa";
  if (cat.includes("value")) return "#818cf8";
  if (cat.includes("multi")) return "#fbbf24";
  if (cat.includes("silver") || cat.includes("comm")) return "#c0c0c0";
  return "#60a5fa";
}

function cleanName(s: string): string {
  return s
    .replace(/ - (Growth|Direct|Regular|Plan).*$/i, "")
    .replace(/\s*(Direct Growth|Direct Plan)\s*$/i, "")
    .trim();
}

// ─── sub-components ───────────────────────────────────────────────────────────
function Sparkline({
  values,
  color,
  h = 36,
}: {
  values: number[];
  color: string;
  h?: number;
}) {
  if (values.length < 2) return null;
  const W = 96;
  const mn = Math.min(...values),
    mx = Math.max(...values),
    r = mx - mn || 1;
  const pts = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * W},${h - ((v - mn) / r) * (h - 4) + 2}`,
    )
    .join(" ");
  const last = values[values.length - 1];
  const lx = W,
    ly = h - ((last - mn) / r) * (h - 4) + 2;
  return (
    <svg
      width={W}
      height={h}
      viewBox={`0 0 ${W} ${h}`}
      className="overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const styles: Record<string, string> = {
    Low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    "Moderately Low": "text-green-400 bg-green-400/10 border-green-400/20",
    Moderate: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    "Moderately High": "text-orange-400 bg-orange-400/10 border-orange-400/20",
    High: "text-red-400 bg-red-400/10 border-red-400/20",
    "Very High": "text-pink-400 bg-pink-400/10 border-pink-400/20",
  };
  const s = styles[risk] || "text-white/40 bg-white/5 border-white/10";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s}`}
    >
      <AlertTriangle className="w-2.5 h-2.5" />
      {risk || "Unknown"}
    </span>
  );
}

function StatChip({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3 sm:p-4">
      <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/30 mb-1 font-semibold">
        {label}
      </p>
      <p
        className="text-sm sm:text-base font-bold"
        style={{ color: color || "white" }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] sm:text-xs text-white/25 mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function AnimBar({
  value,
  max,
  color,
  label,
}: {
  value: number | null;
  max: number;
  color: string;
  label: string;
}) {
  const pct = value != null ? (Math.abs(value) / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs sm:text-sm font-mono text-white/40 w-7 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-6 bg-white/[0.05] rounded-lg overflow-hidden">
        {value != null && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-lg flex items-center justify-end pr-2"
            style={{ background: `${color}cc` }}
          ></motion.div>
        )}
      </div>
      <span
        className={`text-xs sm:text-sm font-bold font-mono w-16 text-right ${(value ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
      >
        {value != null ? `${value > 0 ? "+" : ""}${value.toFixed(1)}%` : "—"}
      </span>
    </div>
  );
}

function Donut({
  pct,
  size,
  accent,
}: {
  pct: number;
  size: number;
  accent: string;
}) {
  const r = size / 2 - 6,
    c = size / 2,
    circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size}>
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="5"
      />
      <motion.circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth="5"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1, ease: "easeOut" }}
        strokeLinecap="round"
        transform={`rotate(-90 ${c} ${c})`}
      />
      <text
        x={c}
        y={c + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={size < 70 ? "11" : "13"}
        fontWeight="bold"
      >
        {pct.toFixed(0)}%
      </text>
    </svg>
  );
}

// ─── FUND DETAIL ──────────────────────────────────────────────────────────────
function FundDetail({
  fund,
  accent,
  onBack,
}: {
  fund: FundData;
  accent: string;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("overview");
  const r3 = fund.returns?.threeYear;
  const r1 = fund.returns?.oneYear;
  const r5 = fund.returns?.fiveYear;

  const sparkVals = useMemo(() => buildSparkValues(r3), [r3]);

  const TABS: DetailTab[] = ["overview", "returns", "composition", "risk"];

  // area chart path
  const areaPath = useMemo(() => {
    const vals = sparkVals;
    const W = 400,
      H = 96;
    const mn = Math.min(...vals),
      mx = Math.max(...vals),
      rng = mx - mn || 1;
    const toX = (i: number) => (i / (vals.length - 1)) * W;
    const toY = (v: number) => H - ((v - mn) / rng) * (H - 8) + 4;
    const linePts = vals.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
    const areaFill = `${vals.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")} ${W},${H} 0,${H}`;
    return { linePts, areaFill };
  }, [sparkVals]);

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ duration: 0.28 }}
      className="min-h-screen bg-[#070709] pb-28"
    >
      {/* sticky top bar */}
      <div className="sticky top-0 z-30 bg-[#070709]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.10] flex items-center justify-center transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-bold text-white truncate">
            {cleanName(fund.schemeName)}
          </p>
          <p className="text-xs text-white/30">{fund.amcName}</p>
        </div>
        <RiskBadge risk={fund.riskLevel || "High"} />
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-5 sm:pt-6 space-y-5 sm:space-y-6">
        {/* hero card */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: `${accent}25` }}
        >
          <div
            className="p-4 sm:p-7"
            style={{
              background: `linear-gradient(135deg,${accent}14 0%,transparent 55%)`,
            }}
          >
            {/* name + returns — stacks vertically on mobile, side-by-side on sm+ */}
            <div className="mb-5">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-white/[0.07] text-white/50">
                  {getCleanCategory(fund.category)}
                </span>
                <RiskBadge risk={fund.riskLevel || "High"} />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-white leading-snug break-words">
                    {cleanName(fund.schemeName)}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/35 mt-1">
                    {fund.amcName}
                  </p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0 shrink-0">
                  <p
                    className="text-3xl sm:text-4xl font-bold"
                    style={{ color: accent }}
                  >
                    {r3 != null ? `${r3 > 0 ? "+" : ""}${r3.toFixed(1)}%` : "—"}
                  </p>
                  <p className="text-xs text-white/30 sm:mt-1 uppercase tracking-widest">
                    3Y Annualised
                  </p>
                </div>
              </div>
            </div>

            {/* chart */}
            <div className="relative h-24 sm:h-28 mb-5">
              <svg
                className="w-full h-full"
                viewBox="0 0 400 96"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id={`fg-${fund.schemeCode}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <polygon
                  points={areaPath.areaFill}
                  fill={`url(#fg-${fund.schemeCode})`}
                />
                <motion.polyline
                  points={areaPath.linePts}
                  fill="none"
                  stroke={accent}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute top-0 right-0 flex gap-1 sm:gap-1.5">
                {["1M", "6M", "1Y", "3Y", "All"].map((p) => (
                  <button
                    key={p}
                    className={`text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition
                    ${p === "3Y" ? "text-black" : "text-white/30 hover:text-white/60 bg-white/[0.04]"}`}
                    style={p === "3Y" ? { background: accent } : {}}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* key stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { l: "NAV", v: `₹${fund.nav || "—"}` },
                {
                  l: "Fund Size",
                  v: fund.aum ? `₹${(fund.aum / 100).toFixed(0)} Cr` : "—",
                },
                {
                  l: "Exp. Ratio",
                  v: fund.expenseRatio ? `${fund.expenseRatio}%` : "—",
                },
                { l: "Min SIP", v: "₹100" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="bg-black/30 rounded-xl p-3 text-center"
                >
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">
                    {s.l}
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* tabs */}
        {/* Tabs — short labels on mobile to avoid overflow */}
        <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
          {TABS.map((t) => {
            const mobileLabels: Record<string, string> = {
              overview: "Info",
              returns: "Returns",
              composition: "Holdings",
              risk: "Risk",
            };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-all
                  ${tab === t ? "text-black" : "text-white/30 hover:text-white/60"}`}
                style={tab === t ? { background: accent } : {}}
              >
                <span className="sm:hidden">{mobileLabels[t]}</span>
                <span className="hidden sm:inline capitalize">{t}</span>
              </button>
            );
          })}
        </div>

        {/* tab content */}
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div
              key="ov"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {/* return calculator */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.05]">
                  <p className="text-sm font-bold text-white/50 uppercase tracking-widest">
                    Return Calculator · Monthly SIP ₹100
                  </p>
                </div>
                {[
                  { period: "3 months", inv: 300, ret: -3.33 },
                  { period: "6 months", inv: 600, ret: 16.83 },
                  { period: "1 year", inv: 1200, ret: 60.58 },
                  { period: "3 years", inv: 3600, ret: 137.64 },
                ].map((row, idx) => {
                  const final = row.inv * (1 + row.ret / 100);
                  return (
                    <div
                      key={idx}
                      className="px-5 py-4 flex items-center justify-between border-b border-white/[0.03] last:border-0"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white/70 capitalize">
                          {row.period}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">
                          Invested ₹{row.inv.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-white">
                          ₹{Math.round(final).toLocaleString("en-IN")}
                        </p>
                        <p
                          className={`text-xs font-bold mt-0.5 ${row.ret >= 0 ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {row.ret >= 0 ? "+" : ""}
                          {row.ret.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* fund managers */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">
                  Fund Managers
                </p>
                <div className="space-y-3">
                  {[
                    { n: "Arun Agarwal", s: "Feb 2023" },
                    { n: "Nandita Menezes", s: "Mar 2025" },
                  ].map((m) => (
                    <div
                      key={m.n}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04]"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-black shrink-0"
                        style={{ background: accent }}
                      >
                        {m.n
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{m.n}</p>
                        <p className="text-xs text-white/30">{m.s} – Present</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* exit load */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Exit Load & Tax
                </p>
                <div className="space-y-2 text-sm text-white/50">
                  <p>
                    Exit load of{" "}
                    <span className="text-white font-bold">1%</span> if redeemed
                    within 15 days.
                  </p>
                  <p>
                    Within 2 years: taxed at{" "}
                    <span className="text-white font-bold">
                      income tax slab rate
                    </span>
                    .
                  </p>
                  <p>
                    After 2 years:{" "}
                    <span className="text-white font-bold">12.5%</span> LTCG
                    tax.
                  </p>
                  <p>
                    Stamp duty:{" "}
                    <span className="text-white font-bold">0.005%</span> on
                    investment.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "returns" && (
            <motion.div
              key="ret"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">
                  Annualised Returns
                </p>
                <div className="space-y-3">
                  {(() => {
                    const vals = [
                      { label: "6M", value: 76.2 },
                      { label: "1Y", value: r1 ?? 126.9 },
                      { label: "3Y", value: r3 ?? 47.4 },
                      { label: "5Y", value: r5 ?? null },
                    ];
                    const max = Math.max(
                      ...vals.map((v) => Math.abs(v.value ?? 0)),
                      1,
                    );
                    return vals.map((v) => (
                      <AnimBar key={v.label} {...v} max={max} color={accent} />
                    ));
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatChip
                  label="3Y CAGR"
                  value={`+${(r3 ?? 47.4).toFixed(1)}%`}
                  color={accent}
                  sub="Annualised"
                />
                <StatChip
                  label="1Y Return"
                  value={`+${(r1 ?? 126.9).toFixed(1)}%`}
                  color="#34d399"
                  sub="Point-to-point"
                />
                <StatChip
                  label="Cat. Rank"
                  value="#1"
                  color={accent}
                  sub="Comm. Silver"
                />
                <StatChip
                  label="Since Launch"
                  value="+48.6%"
                  color="#a78bfa"
                  sub="Absolute"
                />
              </div>

              {/* vs category table */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.05]">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30">
                    Fund vs Category Average
                  </p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      {["Period", "Fund", "Category", "Rank"].map((h) => (
                        <th
                          key={h}
                          className={`py-3 text-[10px] font-bold uppercase tracking-widest text-white/25 ${h === "Period" ? "text-left pl-5" : "text-right pr-5"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {[
                      { p: "6M", f: "+76.2%", c: "+115.7%", r: "—" },
                      { p: "1Y", f: "+126.9%", c: "+154.8%", r: "7" },
                      { p: "3Y", f: "+47.4%", c: "+47.1%", r: "1" },
                    ].map((row) => (
                      <tr key={row.p}>
                        <td className="py-3 pl-5 text-sm text-white/50">
                          {row.p}
                        </td>
                        <td className="py-3 pr-5 text-right text-sm font-bold text-emerald-400">
                          {row.f}
                        </td>
                        <td className="py-3 pr-5 text-right text-sm text-white/35">
                          {row.c}
                        </td>
                        <td
                          className="py-3 pr-5 text-right text-sm font-bold"
                          style={{ color: accent }}
                        >
                          #{row.r}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {tab === "composition" && (
            <motion.div
              key="comp"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">
                  Asset Allocation · ₹4,735 Cr
                </p>
                <div className="flex items-center gap-6 flex-wrap">
                  <Donut pct={98.22} size={88} accent={accent} />
                  <div className="flex-1 min-w-0 space-y-3">
                    {[
                      {
                        label: "Commodities (Silver)",
                        pct: 98.22,
                        color: accent,
                      },
                      {
                        label: "Cash & Equivalents",
                        pct: 1.78,
                        color: "#64748b",
                      },
                    ].map((a) => (
                      <div key={a.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-white/50 flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full inline-block shrink-0"
                              style={{ background: a.color }}
                            />
                            {a.label}
                          </span>
                          <span className="text-xs font-bold text-white/70">
                            {a.pct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${a.pct}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ background: a.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.05] flex justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30">
                    Holdings (1)
                  </p>
                  <span className="text-xs text-white/20">Top 5 · 100%</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                        style={{ background: `${accent}20`, color: accent }}
                      >
                        ETF
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          HDFC Silver ETF Regular - Growth
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">
                          Mutual Fund · Silver Commodities
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-white">
                      100.04%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatChip label="Top 5 Concentration" value="100%" />
                <StatChip label="Top 20 Concentration" value="100%" />
              </div>
            </motion.div>
          )}

          {tab === "risk" && (
            <motion.div
              key="risk"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">
                  Advanced Risk Ratios
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      l: "Alpha",
                      v: "-0.89",
                      desc: "vs benchmark",
                      warn: true,
                    },
                    { l: "Beta", v: "0.97", desc: "Market corr.", warn: false },
                    {
                      l: "Sharpe",
                      v: "1.18",
                      desc: "Risk-adj. return",
                      warn: false,
                    },
                    {
                      l: "Sortino",
                      v: "2.71",
                      desc: "Downside risk",
                      warn: false,
                    },
                  ].map((r) => (
                    <div
                      key={r.l}
                      className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 sm:p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/30 font-bold">
                          {r.l}
                        </p>
                        {r.warn && (
                          <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                        )}
                      </div>
                      <p
                        className={`text-xl sm:text-2xl font-bold ${r.warn ? "text-amber-400" : "text-white"}`}
                      >
                        {r.v}
                      </p>
                      <p className="text-[10px] text-white/25 mt-1">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* riskometer */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">
                  SEBI Riskometer
                </p>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 220 120" className="w-full max-w-xs">
                    <defs>
                      <linearGradient
                        id="rmGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="25%" stopColor="#34d399" />
                        <stop offset="50%" stopColor="#fbbf24" />
                        <stop offset="75%" stopColor="#fb923c" />
                        <stop offset="100%" stopColor="#f87171" />
                      </linearGradient>
                    </defs>
                    {[0, 1, 2, 3, 4].map((i) => {
                      const a1 = (Math.PI / 5) * i - Math.PI,
                        a2 = (Math.PI / 5) * (i + 1) - Math.PI;
                      const R = 85;
                      const x1 = 110 + R * Math.cos(a1),
                        y1 = 110 + R * Math.sin(a1);
                      const x2 = 110 + R * Math.cos(a2),
                        y2 = 110 + R * Math.sin(a2);
                      const cols = [
                        "#22d3ee",
                        "#34d399",
                        "#fbbf24",
                        "#fb923c",
                        "#f87171",
                      ];
                      return (
                        <path
                          key={i}
                          d={`M 110 110 L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`}
                          fill={cols[i]}
                          opacity={i === 4 ? 0.9 : 0.25}
                        />
                      );
                    })}
                    <motion.line
                      x1="110"
                      y1="110"
                      x2="190"
                      y2="38"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ rotate: -90 }}
                      animate={{ rotate: 0 }}
                      style={{ originX: "110px", originY: "110px" }}
                      transition={{
                        duration: 1.2,
                        delay: 0.3,
                        type: "spring",
                        stiffness: 60,
                      }}
                    />
                    <circle cx="110" cy="110" r="5" fill="white" />
                  </svg>
                  <div className="flex justify-between w-full max-w-xs text-[10px] text-white/30 px-1 -mt-1">
                    {[
                      "Low",
                      "Mod-Low",
                      "Moderate",
                      "Mod-High",
                      "High",
                      "V. High",
                    ].map((l) => (
                      <span
                        key={l}
                        className={
                          l === "V. High" ? "text-pink-400 font-bold" : ""
                        }
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-400/80 leading-relaxed">
                  This fund invests in silver commodities. Commodity prices are
                  highly volatile and subject to global macroeconomic events.
                  Past performance does not guarantee future results.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#070709]/95 backdrop-blur-xl border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button className="flex-1 py-3.5 rounded-xl text-sm font-bold border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition">
            + Watchlist
          </button>
          <button
            className="flex-[2] py-3.5 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{ background: accent }}
          >
            Start SIP <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────
function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-center gap-1.5 py-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center disabled:opacity-25 hover:bg-white/[0.09] transition"
      >
        <ChevronLeft className="w-4 h-4 text-white/60" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`e${i}`}
            className="w-9 h-9 flex items-center justify-center text-sm text-white/25"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-9 h-9 rounded-lg text-sm font-bold transition border
                ${page === p ? "text-black border-transparent" : "bg-white/[0.04] border-white/[0.07] text-white/50 hover:text-white hover:bg-white/[0.08]"}`}
            style={
              page === p
                ? { background: "#22d3ee", borderColor: "#22d3ee" }
                : {}
            }
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center disabled:opacity-25 hover:bg-white/[0.09] transition"
      >
        <ChevronRight className="w-4 h-4 text-white/60" />
      </button>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function FundsPage() {
  const { funds: categorizedFunds, allFunds, loading } = useFundData();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [sortBy, setSortBy] = useState<SortKey>("cagr3y");
  const [riskFilter, setRiskFilter] = useState<RiskLevel>("all");
  const [minReturn, setMinReturn] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<View>("list");
  const [selectedFund, setSelectedFund] = useState<FundData | null>(null);
  const [page, setPage] = useState(1);

  const filteredFunds = useMemo(() => {
    let list =
      category === "all"
        ? [...allFunds]
        : [...(categorizedFunds[category] || [])];
    if (query)
      list = list.filter(
        (f) =>
          f.schemeName.toLowerCase().includes(query.toLowerCase()) ||
          f.amcName?.toLowerCase().includes(query.toLowerCase()),
      );
    if (riskFilter !== "all")
      list = list.filter((f) => RISK_MAP[f.riskLevel || ""] === riskFilter);
    if (minReturn > 0)
      list = list.filter((f) => (f.returns?.threeYear ?? 0) >= minReturn);
    return list.sort((a, b) => {
      if (sortBy === "cagr3y")
        return (b.returns?.threeYear ?? 0) - (a.returns?.threeYear ?? 0);
      if (sortBy === "cagr1y")
        return (b.returns?.oneYear ?? 0) - (a.returns?.oneYear ?? 0);
      if (sortBy === "nav") return (b.nav ?? 0) - (a.nav ?? 0);
      return a.schemeName.localeCompare(b.schemeName);
    });
  }, [
    allFunds,
    categorizedFunds,
    category,
    query,
    sortBy,
    riskFilter,
    minReturn,
  ]);

  // reset page on filter change
  const resetPage = () => setPage(1);
  const handleCat = (c: Category) => {
    setCategory(c);
    resetPage();
  };
  const handleSort = (s: SortKey) => {
    setSortBy(s);
    resetPage();
  };
  const handleRisk = (r: RiskLevel) => {
    setRiskFilter(r);
    resetPage();
  };
  const handleMinRet = (v: number) => {
    setMinReturn(v);
    resetPage();
  };
  const handleQuery = (q: string) => {
    setQuery(q);
    resetPage();
  };
  const clearFilters = () => {
    setRiskFilter("all");
    setMinReturn(0);
    setQuery("");
    resetPage();
  };

  const pageFunds = useMemo(
    () => filteredFunds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredFunds, page],
  );

  const openFund = (f: FundData) => {
    setSelectedFund(f);
    setView("detail");
    window.scrollTo(0, 0);
  };
  const closeFund = () => {
    setSelectedFund(null);
    setView("list");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center gap-5">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/15 animate-ping" />
          <div className="absolute inset-0 rounded-full border-2 border-t-emerald-400 border-emerald-400/10 animate-spin" />
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400/50">
          Syncing AMFI Data…
        </p>
      </div>
    );

  // ── font override via style tag (use existing project font) ─────────────────
  // The outer layout/sidebar already sets the project font family.
  // We only override the mono-specific sections; prose inherits from layout.

  return (
    <div className="min-h-screen bg-[#070709] text-slate-200">
      <AnimatePresence mode="wait">
        {/* ── DETAIL VIEW ── */}
        {view === "detail" && selectedFund ? (
          <FundDetail
            key="detail"
            fund={selectedFund}
            accent={getAccent(selectedFund)}
            onBack={closeFund}
          />
        ) : (
          /* ── LIST VIEW ── */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-10"
          >
            {/* ══ HEADER ════════════════════════════════════════════════ */}
            <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {/* Back button — visible when navigated here from another page */}
                  <button
                    onClick={() => window.history.back()}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition shrink-0"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="w-4 h-4 text-white/50" />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
                      PaisaDekho · Fund Intelligence
                    </span>
                  </div>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-none">
                  Mutual <span className="text-emerald-400">Funds</span>
                </h1>
                <p className="text-sm sm:text-base text-white/35 mt-2">
                  {allFunds.length} direct-plan schemes · AMFI live data
                </p>
              </div>
              <div className="flex gap-6 sm:gap-8">
                <div className="text-center sm:text-right">
                  <p
                    className="text-3xl sm:text-4xl font-bold text-white"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {allFunds.length > 0
                      ? (
                          (allFunds.filter(
                            (f) => (f.returns?.threeYear ?? 0) > 15,
                          ).length /
                            allFunds.length) *
                          100
                        ).toFixed(0)
                      : "—"}
                    %
                  </p>
                  <p className="text-xs text-white/30 uppercase tracking-widest mt-1">
                    Beat 15% · 3Y
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-3xl sm:text-4xl font-bold text-emerald-400">
                    {allFunds.length}
                  </p>
                  <p className="text-xs text-white/30 uppercase tracking-widest mt-1">
                    Total Schemes
                  </p>
                </div>
              </div>
            </header>

            {/* ══ CATEGORY GRID ════════════════════════════════════════ */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-2">
              {Object.entries(CATS).map(([id, meta]) => {
                const Icon = meta.icon;
                const active = category === id;
                const count =
                  id === "all"
                    ? allFunds.length
                    : (categorizedFunds[id]?.length ?? 0);
                return (
                  <motion.button
                    key={id}
                    onClick={() => handleCat(id as Category)}
                    whileTap={{ scale: 0.96 }}
                    className={`relative overflow-hidden rounded-2xl border text-left transition-all p-3 sm:p-4
                      ${active ? "border-emerald-500/40" : "border-white/[0.05] hover:border-white/[0.12] bg-white/[0.02]"}`}
                    style={
                      active
                        ? {
                            background: `linear-gradient(135deg,${meta.accent}18,transparent)`,
                          }
                        : {}
                    }
                  >
                    {active && (
                      <motion.div
                        layoutId="catGlow"
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: `radial-gradient(circle at 25% 25%,${meta.accent}20,transparent 70%)`,
                        }}
                      />
                    )}
                    <Icon
                      className="w-5 h-5 mb-2.5 relative z-10"
                      style={{
                        color: active ? meta.accent : "rgba(255,255,255,0.25)",
                      }}
                    />
                    <p
                      className={`text-xs font-bold leading-tight relative z-10 ${active ? "text-white" : "text-white/40"}`}
                    >
                      {meta.label}
                    </p>
                    <p className="text-[10px] text-white/20 mt-1 relative z-10">
                      {count} funds
                    </p>
                    {active && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* ══ SEARCH + CONTROLS ═══════════════════════════════════ */}
            <div className="space-y-3">
              <div className="flex gap-2 sm:gap-3">
                {/* search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    value={query}
                    onChange={(e) => handleQuery(e.target.value)}
                    placeholder="Search funds or AMCs…"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 pl-11 pr-10
                      text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all text-white/80"
                  />
                  {query && (
                    <button
                      onClick={() => handleQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    >
                      <X className="w-4 h-4 text-white/30" />
                    </button>
                  )}
                </div>
                {/* sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value as SortKey)}
                    className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl
                      px-4 pr-8 py-3 text-sm font-semibold text-white/60 outline-none cursor-pointer hover:bg-white/[0.07] transition"
                  >
                    <option value="cagr3y">3Y CAGR</option>
                    <option value="cagr1y">1Y Return</option>
                    <option value="nav">NAV</option>
                    <option value="name">A–Z</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                </div>
                {/* filter toggle */}
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all
                    ${showFilters ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white/70"}`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {(riskFilter !== "all" || minReturn > 0) && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </button>
              </div>

              {/* filter panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-5 mt-1">
                      {/* risk */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
                          Risk Level
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              "all",
                              "low",
                              "moderate",
                              "high",
                              "veryHigh",
                            ] as RiskLevel[]
                          ).map((r) => (
                            <button
                              key={r}
                              onClick={() => handleRisk(r)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                                ${riskFilter === r ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-white/[0.07] text-white/35 hover:text-white/70 hover:border-white/20"}`}
                            >
                              {r === "all"
                                ? "Any"
                                : r === "veryHigh"
                                  ? "Very High"
                                  : r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* min return */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
                          Min 3Y CAGR
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[0, 10, 15, 20, 25].map((v) => (
                            <button
                              key={v}
                              onClick={() => handleMinRet(v)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                                ${minReturn === v ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-white/[0.07] text-white/35 hover:text-white/70 hover:border-white/20"}`}
                            >
                              {v === 0 ? "Any" : `> ${v}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ══ RESULTS BAR ═════════════════════════════════════════ */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/30">
                <span className="text-emerald-400 font-bold text-base">
                  {filteredFunds.length}
                </span>{" "}
                funds · page{" "}
                <span className="text-white/50 font-semibold">{page}</span> of{" "}
                <span className="text-white/50 font-semibold">
                  {Math.ceil(filteredFunds.length / PAGE_SIZE) || 1}
                </span>
              </p>
              {(riskFilter !== "all" || minReturn > 0 || query) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-white/30 hover:text-white/70 flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Clear all
                </button>
              )}
            </div>

            {/* ══ FUND LIST ════════════════════════════════════════════ */}
            <div className="space-y-2.5">
              {pageFunds.map((fund, i) => {
                const accent = getAccent(fund);
                const r3 = fund.returns?.threeYear;
                const r1 = fund.returns?.oneYear;
                const spark = buildSparkValues(r3);
                const globalIdx = (page - 1) * PAGE_SIZE + i;

                return (
                  <motion.div
                    key={fund.schemeCode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.018, 0.25) }}
                    onClick={() => openFund(fund)}
                    className="group cursor-pointer rounded-2xl border border-white/[0.05] bg-white/[0.02]
                      hover:bg-white/[0.05] hover:border-white/[0.12] transition-all overflow-hidden"
                    style={{ borderLeft: `3px solid ${accent}40` }}
                  >
                    <div className="p-4 sm:p-5 flex items-center gap-4">
                      {/* rank + logo */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-white/15 font-mono w-5 text-right hidden sm:block">
                          {globalIdx + 1}
                        </span>
                        <div
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: `${accent}20`, color: accent }}
                        >
                          {fund.amcName
                            ?.split(" ")[0]
                            ?.slice(0, 3)
                            .toUpperCase() || "MF"}
                        </div>
                      </div>

                      {/* name + tags */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-white/85 group-hover:text-white transition-colors leading-snug line-clamp-1">
                          {cleanName(fund.schemeName)}
                        </p>
                        <div className="flex items-center flex-wrap gap-2 mt-1.5">
                          <span
                            className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md"
                            style={{ background: `${accent}18`, color: accent }}
                          >
                            {getCleanCategory(fund.category)}
                          </span>
                          <span className="text-[10px] sm:text-xs text-white/20">
                            NAV ₹{fund.nav}
                          </span>
                          {fund.riskLevel && (
                            <span className="text-[10px] sm:text-xs text-white/20 hidden sm:block">
                              {fund.riskLevel} Risk
                            </span>
                          )}
                        </div>
                      </div>

                      {/* sparkline — desktop only */}
                      <div className="hidden lg:block opacity-40 group-hover:opacity-80 transition-opacity shrink-0">
                        <Sparkline values={spark} color={accent} h={36} />
                      </div>

                      {/* returns */}
                      <div className="text-right shrink-0 ml-2">
                        <p
                          className="text-lg sm:text-xl font-bold"
                          style={{
                            color: accent,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {r3 != null
                            ? `${r3 > 0 ? "+" : ""}${r3.toFixed(1)}%`
                            : "—"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-white/25 uppercase tracking-widest">
                          3Y CAGR
                        </p>
                        {r1 != null && (
                          <p
                            className={`text-xs mt-0.5 ${r1 >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}
                          >
                            {r1 > 0 ? "+" : ""}
                            {r1.toFixed(1)}% 1Y
                          </p>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
                    </div>
                  </motion.div>
                );
              })}

              {filteredFunds.length === 0 && (
                <div className="py-24 text-center">
                  <p className="text-5xl mb-5">🔍</p>
                  <p className="text-lg font-bold text-white/30">
                    No funds matched
                  </p>
                  <p className="text-sm text-white/15 mt-2">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>

            {/* ══ PAGINATION ══════════════════════════════════════════ */}
            <Pagination
              page={page}
              total={filteredFunds.length}
              pageSize={PAGE_SIZE}
              onChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />

            {/* footer */}
            <footer className="pt-4 pb-8 border-t border-white/[0.05] text-center">
              <p className="text-xs text-white/15 max-w-md mx-auto leading-relaxed">
                Mutual fund investments are subject to market risks. Read all
                scheme-related documents carefully before investing.
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
