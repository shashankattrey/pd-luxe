"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Upload,
  Wallet,
  BarChart3,
  ChevronRight,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Bell,
  Calendar,
  Tag,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { creditCards } from "@/lib/credit-cards-data";
import { useUser } from "@/context/UserContext";
import { useFundData } from "@/hooks/useFundData";

// ─── ANIMATION ───────────────────────────────────────────────────────────────
const stagger = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: i * 0.06,
      ease: [0.22, 1, 0.36, 1] as any,
    },
  },
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 5) return { label: "night", emoji: "🌙" };
  if (h < 12) return { label: "morning", emoji: "☀️" };
  if (h < 17) return { label: "afternoon", emoji: "⚡" };
  return { label: "evening", emoji: "🌆" };
}

// 1. Loading Shield: Prevents static fallback flicker

// ─── IPO DATA ─────────────────────────────────────────────────────────────────
export const IPOS = [
  {
    id: "1",
    company: "Hyundai India",
    sector: "Automobile",
    type: "Mainboard",
    status: "ongoing" as const,
    priceRange: "₹1,865 – ₹1,960",
    lotSize: 7,
    minInvest: "₹13,720",
    gmp: "+₹180 (9.2%)",
    gmpPos: true,
    opens: "Oct 15, 2025",
    closes: "Oct 17, 2025",
    allotment: "Oct 18, 2025",
    listing: "Oct 22, 2025",
    issue: "₹27,870 Cr",
    closesMs: new Date("2025-10-17T18:00:00").getTime(),
    logo: "HY",
    gradient: "from-sky-900 to-blue-950",
    accent: "#38bdf8",
    about:
      "Hyundai Motor India Limited is the Indian arm of South Korean automotive giant Hyundai Motor Company. It is one of India's largest passenger vehicle manufacturers with a strong presence across segments.",
    strengths: [
      "Strong brand equity & parent backing",
      "Expanding EV lineup with Creta Electric",
      "14% market share in Indian PV segment",
    ],
    risks: [
      "High competition from Maruti & Tata Motors",
      "EV transition capital intensity",
      "Global supply chain dependence",
    ],
    financials: {
      revenue: "₹71,302 Cr",
      pat: "₹6,060 Cr",
      roe: "39.8%",
      pe: "26.3×",
    },
  },
  {
    id: "2",
    company: "Sagility India",
    sector: "Healthcare IT",
    type: "Mainboard",
    status: "upcoming" as const,
    priceRange: "₹28 – ₹30",
    lotSize: 500,
    minInvest: "₹15,000",
    gmp: "+₹6 (20%)",
    gmpPos: true,
    opens: "Nov 05, 2025",
    closes: "Nov 07, 2025",
    allotment: "Nov 10, 2025",
    listing: "Nov 12, 2025",
    issue: "₹2,106 Cr",
    closesMs: new Date("2025-11-07T18:00:00").getTime(),
    logo: "SA",
    gradient: "from-violet-900 to-purple-950",
    accent: "#a78bfa",
    about:
      "Sagility India provides technology-enabled services to US health insurers and healthcare providers. Formerly part of Hinduja Global Solutions, it focuses exclusively on the US healthcare market.",
    strengths: [
      "100% focus on high-margin healthcare BPO",
      "Long-term US insurer contracts",
      "Improving EBITDA margins",
    ],
    risks: [
      "Single geography concentration (US)",
      "Customer concentration risk",
      "Regulatory changes in US healthcare",
    ],
    financials: {
      revenue: "₹4,754 Cr",
      pat: "₹228 Cr",
      roe: "11.2%",
      pe: "46×",
    },
  },
  {
    id: "3",
    company: "Swiggy",
    sector: "Food Tech",
    type: "Mainboard",
    status: "upcoming" as const,
    priceRange: "₹371 – ₹390",
    lotSize: 38,
    minInvest: "₹14,820",
    gmp: "+₹22 (5.6%)",
    gmpPos: true,
    opens: "Nov 06, 2025",
    closes: "Nov 08, 2025",
    allotment: "Nov 11, 2025",
    listing: "Nov 13, 2025",
    issue: "₹11,327 Cr",
    closesMs: new Date("2025-11-08T18:00:00").getTime(),
    logo: "SW",
    gradient: "from-orange-900 to-red-950",
    accent: "#fb923c",
    about:
      "Swiggy is India's leading on-demand food delivery and quick commerce platform. It operates Instamart for 10-minute grocery delivery and competes directly with Zomato across major Indian cities.",
    strengths: [
      "#2 food delivery platform in India",
      "Instamart quick commerce growing fast",
      "Strong brand in urban India",
    ],
    risks: [
      "Persistent losses — not yet profitable",
      "Intense competition from Zomato",
      "High cash burn in quick commerce expansion",
    ],
    financials: {
      revenue: "₹11,247 Cr",
      pat: "-₹2,350 Cr",
      roe: "Negative",
      pe: "N/M",
    },
  },
  {
    id: "4",
    company: "NTPC Green Energy",
    sector: "Renewable Energy",
    type: "Mainboard",
    status: "upcoming" as const,
    priceRange: "₹102 – ₹108",
    lotSize: 138,
    minInvest: "₹14,904",
    gmp: "+₹15 (13.9%)",
    gmpPos: true,
    opens: "Nov 19, 2025",
    closes: "Nov 22, 2025",
    allotment: "Nov 25, 2025",
    listing: "Nov 27, 2025",
    issue: "₹10,000 Cr",
    closesMs: new Date("2025-11-22T18:00:00").getTime(),
    logo: "NT",
    gradient: "from-emerald-900 to-teal-950",
    accent: "#34d399",
    about:
      "NTPC Green Energy is the renewable energy subsidiary of NTPC Limited, India's largest power utility. It targets 60 GW of renewable capacity by 2032 through solar, wind and hydro projects.",
    strengths: [
      "Sovereign-backed parent (NTPC)",
      "Aggressive 60 GW capacity target",
      "Attractive green energy tailwind",
    ],
    risks: [
      "Execution risk at scale",
      "Land acquisition challenges",
      "Intermittent nature of renewables",
    ],
    financials: {
      revenue: "₹1,962 Cr",
      pat: "₹344 Cr",
      roe: "8.6%",
      pe: "58×",
    },
  },
  {
    id: "5",
    company: "Envision Solar",
    sector: "Clean Energy",
    type: "SME",
    status: "listed" as const,
    priceRange: "₹52 – ₹55",
    lotSize: 200,
    minInvest: "₹11,000",
    gmp: "+₹8 (14.5%)",
    gmpPos: true,
    opens: "Oct 01, 2025",
    closes: "Oct 03, 2025",
    allotment: "Oct 06, 2025",
    listing: "Oct 08, 2025",
    issue: "₹180 Cr",
    closesMs: new Date("2025-10-03T18:00:00").getTime(),
    logo: "EN",
    gradient: "from-yellow-900 to-amber-950",
    accent: "#fbbf24",
    listedAt: "₹71 (+29.1%)",
    about:
      "Envision Solar develops turnkey solar power projects for industrial and commercial customers in Tier 2 and Tier 3 cities across India, with an asset-light execution model.",
    strengths: [
      "Asset-light model with good margins",
      "Strong SME segment tailwinds",
      "High 29% listing gain validates price",
    ],
    risks: [
      "Small scale limits growth capital",
      "Execution dependent on project pipeline",
      "SME liquidity risk post-listing",
    ],
    financials: { revenue: "₹84 Cr", pat: "₹11 Cr", roe: "18.4%", pe: "32×" },
  },
] as const;

export type IPO = (typeof IPOS)[number];
type IpoStatus = "ongoing" | "upcoming" | "listed";
type IpoFilter = "all" | IpoStatus;

const devaluationAlerts = creditCards.filter(
  (c: any) =>
    (c.notesTnc ?? "").toLowerCase().includes("critical") ||
    (c.notesTnc ?? "").toLowerCase().includes("devaluation"),
);

// ─── MINI SPARKLINE ───────────────────────────────────────────────────────────
function MiniSparkline({
  positive,
  color,
}: {
  positive: boolean;
  color: string;
}) {
  const pts = positive
    ? [8, 13, 11, 17, 15, 20, 18, 22, 20, 25, 22, 27, 24, 30, 26, 28]
    : [28, 23, 25, 21, 23, 18, 21, 16, 19, 14, 17, 12, 14, 9, 11, 8];

  const W = 60;
  const H = 28;

  const mn = Math.min(...pts);
  const mx = Math.max(...pts);
  const rng = mx - mn || 1;

  const coords = pts.map((v, i) => ({
    x: (i / (pts.length - 1)) * W,
    y: H - ((v - mn) / rng) * (H - 4) - 2,
  }));

  const pathStr = coords
    .map((c, i) => (i === 0 ? "M" : "L") + `${c.x},${c.y}`)
    .join(" ");
  const area = pathStr + ` L${W},${H + 2} L0,${H + 2} Z`;
  const lastPoint = coords[coords.length - 1];
  const uid = `sg${positive ? "p" : "n"}${color.replace("#", "")}`;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ─── ANIMATED AREA FILL ─── */}
      <motion.path
        d={area}
        fill={`url(#${uid})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />

      {/* ─── ANIMATED PATH DRAW ─── */}
      <motion.path
        d={pathStr}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />

      {/* ─── LIVE PULSE POINT ─── */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.6, duration: 0.3 }}
        transform={`translate(${lastPoint.x}, ${lastPoint.y})`}
      >
        <circle
          r="3"
          fill={color}
          className="animate-pulse-slow"
          style={{ transformOrigin: "center" }}
        />
        <circle r="1.5" fill={color} />
      </motion.g>
    </svg>
  );
}

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function Countdown({ targetMs }: { targetMs: number }) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now());
      setParts({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
      });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [targetMs]);
  if (targetMs <= Date.now())
    return <span className="text-[10px] text-white/30">Closed</span>;
  return (
    <span className="text-[11px] font-mono font-bold text-white/80 tabular-nums">
      {parts.d > 0 ? `${parts.d}d ` : ""}
      {String(parts.h).padStart(2, "0")}h {String(parts.m).padStart(2, "0")}m
    </span>
  );
}

// ─── IPO CARD (compact, no subscription bar) ──────────────────────────────────
function IpoCard({ ipo, onClick }: { ipo: IPO; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border cursor-pointer group transition-all duration-200 select-none",
        ipo.status === "ongoing"
          ? "border-orange-400/30  hover:border-orange-400/55"
          : ipo.status === "listed"
            ? "border-emerald-400/20 hover:border-emerald-400/45"
            : "border-white/[0.08]   hover:border-white/[0.20]",
      )}
    >
      {/* BG */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-55",
          ipo.gradient,
        )}
      />
      <div className="absolute inset-0 bg-black/58" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_90%_10%,rgba(255,255,255,0.06),transparent)]" />
      {/* Subtle dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10">
        {ipo.status === "ongoing" ? (
          <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-400/20 text-orange-300 border border-orange-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
            LIVE
          </span>
        ) : ipo.status === "listed" ? (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/25">
            LISTED
          </span>
        ) : (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/8 text-white/45 border border-white/10">
            SOON
          </span>
        )}
      </div>

      <div className="relative p-4">
        {/* Logo + company */}
        <div className="flex items-center gap-3 mb-4 pr-14">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{
              background: `${ipo.accent}20`,
              border: `1px solid ${ipo.accent}35`,
            }}
          >
            {ipo.logo}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">
              {ipo.company}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-[9px] font-bold px-1.5 py-px rounded-full"
                style={{ background: `${ipo.accent}18`, color: ipo.accent }}
              >
                {ipo.type}
              </span>
              <span className="text-[9px] text-white/30">{ipo.sector}</span>
            </div>
          </div>
        </div>

        {/* 4-metric grid */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {[
            { label: "Price Band", value: ipo.priceRange },
            { label: "Issue Size", value: ipo.issue },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-black/30 p-2.5">
              <p className="text-[9px] text-white/30 uppercase tracking-widest">
                {m.label}
              </p>
              <p className="text-[11px] font-bold text-white mt-0.5 tabular-nums leading-tight">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Dates row */}
        <div className="flex items-center gap-1.5 mb-3 p-2 rounded-xl bg-black/20">
          <Calendar className="w-3 h-3 text-white/25 shrink-0" />
          <span className="text-[10px] text-white/40">{ipo.opens}</span>
          <span className="text-[10px] text-white/20">→</span>
          <span className="text-[10px] text-white/40">{ipo.closes}</span>
        </div>

        {/* GMP + status-specific bottom */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">
              GMP
            </p>
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                ipo.gmpPos ? "text-emerald-400" : "text-red-400",
              )}
            >
              {ipo.gmp}
            </p>
          </div>
          {"listedAt" in ipo && ipo.listedAt ? (
            <div className="text-right">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">
                Listed at
              </p>
              <p className="text-sm font-bold text-emerald-400 tabular-nums">
                {ipo.listedAt}
              </p>
            </div>
          ) : ipo.status === "ongoing" ? (
            <div className="text-right">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">
                Closes in
              </p>
              <Countdown targetMs={ipo.closesMs} />
            </div>
          ) : (
            <div className="text-right">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">
                Min. Invest
              </p>
              <p className="text-[11px] font-bold text-white/70 tabular-nums">
                {ipo.minInvest}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CARD TILE (replacing the cramped list rows) ──────────────────────────────
function CardTile({ card, rank }: { card: any; rank: number }) {
  const rate = (card.baseRewardRate * card.pointValue).toFixed(1);
  const isFree = card.annualFee === 0 || card.isLtf;
  return (
    <Link href={`/dashboard/explore?card=${card.id}`}>
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden rounded-2xl border border-white/[0.07] hover:border-amber-400/25 bg-white/[0.025] hover:bg-white/[0.04] transition-all cursor-pointer p-4"
      >
        {/* Rank */}
        <span className="absolute top-3 right-3 text-[10px] font-black text-white/10 tabular-nums">
          #{rank}
        </span>

        {/* Card visual */}
        <div
          className={cn(
            "w-full h-16 rounded-xl bg-gradient-to-br relative overflow-hidden mb-3 shadow-lg",
            card.imageGradient || "from-zinc-700 to-zinc-900",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/12 to-transparent" />
          {/* EMV chip */}
          <div className="absolute top-3 left-3 w-7 h-5 rounded-md bg-gradient-to-br from-amber-300/30 to-amber-500/20 border border-white/15" />
          {/* Contactless */}
          <div className="absolute top-3.5 right-3 opacity-20">
            <div className="w-3.5 h-3.5 rounded-full border border-white" />
            <div className="w-5 h-5 rounded-full border border-white absolute -top-0.5 -left-0.5" />
          </div>
          {/* Bank name */}
          <div className="absolute bottom-2.5 left-3">
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">
              {card.bank}
            </p>
          </div>
        </div>

        <p className="text-sm font-semibold text-white/85 group-hover:text-white transition-colors leading-snug line-clamp-1 mb-1">
          {card.name}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isFree && (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-px rounded-full border border-emerald-400/20">
                FREE
              </span>
            )}
            {card.devaluation2026 && (
              <span className="text-[9px] text-orange-400 bg-orange-400/10 px-1.5 py-px rounded-full">
                ⚠ 2026
              </span>
            )}
            {!isFree && !card.devaluation2026 && (
              <span className="text-[10px] text-white/30 tabular-nums">
                ₹{card.annualFee.toLocaleString()}/yr
              </span>
            )}
          </div>
          <p className="text-base font-bold text-amber-400 tabular-nums">
            {rate}%
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function DashboardHome() {
  const { user } = useUser();
  const isNewUser = !(user as any)?.hasCompletedOnboarding;
  const time = getTimeOfDay();
  const [ipoFilter, setIpoFilter] = useState<IpoFilter>("all");
  const [selectedIpo, setSelectedIpo] = useState<IPO | null>(null);
  const { rates, ratesLoading } = useFundData();
  if (ratesLoading || !rates) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-[108px] rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse flex items-center justify-center"
          >
            <Loader2 className="w-4 h-4 text-white/10 animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  const marketItems = [
    {
      label: "NIFTY 50",
      value: rates.equity.nifty50.value.toLocaleString("en-IN"),
      change: `${rates.equity.nifty50.changePct >= 0 ? "+" : ""}${rates.equity.nifty50.changePct.toFixed(2)}%`,
      pos: rates.equity.nifty50.changePct >= 0,
      sub: "NSE Index",
    },
    {
      label: "SENSEX",
      value: rates.equity.sensex.value.toLocaleString("en-IN"),
      change: `${rates.equity.sensex.changePct >= 0 ? "+" : ""}${rates.equity.sensex.changePct.toFixed(2)}%`,
      pos: rates.equity.sensex.changePct >= 0,
      sub: "BSE Index",
    },
    {
      label: "Gold 24K",
      value: `₹${rates.gold.price24k.toLocaleString("en-IN")}`,
      change: `+${rates.gold.sgb.interestRate}%`,
      pos: true,
      sub: "SGB Yield / 10g",
    },
    {
      label: "USD / INR",
      value: `₹${rates.macro.usdInr.toFixed(2)}`,
      change: `${rates.macro.inflation}%`,
      pos: rates.macro.inflation < 6, // Green if inflation is under control
      sub: "Macro Inflation",
    },
  ];
  const topCards = [...creditCards]
    .sort(
      (a: any, b: any) =>
        b.baseRewardRate * b.pointValue - a.baseRewardRate * a.pointValue,
    )
    .slice(0, 4);

  const filteredIpos = IPOS.filter(
    (i) => ipoFilter === "all" || i.status === ipoFilter,
  );

  // Show IPO detail overlay
  if (selectedIpo)
    return <IpoDetail ipo={selectedIpo} onBack={() => setSelectedIpo(null)} />;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 space-y-8 pb-12">
      {/* ══ HERO ═══════════════════════════════════════════════════════ */}
      <motion.div
        {...stagger(0)}
        className="relative overflow-hidden rounded-3xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_85%_20%,rgba(251,191,36,0.09),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_5%_85%,rgba(52,211,153,0.06),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400/70">
              PaisaDekho · Live
            </span>
          </div>
          <p className="text-xs text-white/35 uppercase tracking-widest font-medium mb-1">
            Good {time.label} {time.emoji}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none">
            {user?.name ?? (
              <span className="inline-block w-36 h-9 bg-white/8 rounded-xl animate-pulse align-middle" />
            )}
          </h1>
          <p className="text-sm text-white/40 mt-2 mb-7">
            {isNewUser
              ? "Your AI financial co-pilot is ready."
              : "Here's your financial snapshot for today."}
          </p>
          <div className="flex gap-2 flex-wrap">
            {[
              {
                label: "Cards in vault",
                val: creditCards.length,
                color: "#fbbf24",
              },
              {
                label: "2026 alerts",
                val: devaluationAlerts.length,
                color: "#f87171",
              },
              {
                label: "IPOs live",
                val: IPOS.filter((i) => i.status === "ongoing").length,
                color: "#34d399",
              },
              {
                label: "Upcoming IPOs",
                val: IPOS.filter((i) => i.status === "upcoming").length,
                color: "#a78bfa",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]"
              >
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: s.color }}
                >
                  {s.val}
                </span>
                <span className="text-[10px] text-white/35">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══ ONBOARDING ═════════════════════════════════════════════════ */}
      {isNewUser && (
        <motion.div {...stagger(1)}>
          <Link href="/dashboard/advisor">
            <div className="group relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-900 cursor-pointer hover:border-amber-400/40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/6 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/5 rounded-full blur-3xl" />
              <div className="relative flex items-start gap-4 p-5">
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-14 h-9 rounded-xl bg-gradient-to-br from-amber-400/25 to-amber-600/15 border border-amber-400/30 flex items-center justify-center shadow-xl shadow-amber-900/40">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-14 h-9 rounded-xl bg-white/[0.04] border border-white/8 -z-10" />
                  <div className="absolute -bottom-3 -right-3 w-14 h-9 rounded-xl bg-white/[0.02] border border-white/5 -z-20" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-[15px] leading-snug">
                    Get your AI financial plan
                  </p>
                  <p className="text-sm text-white/45 mt-1">
                    Upload your statement · personalised card + SIP in 30s
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    {(
                      [
                        ["Upload", Upload],
                        ["AI analysis", Sparkles],
                        ["30 sec", Zap],
                      ] as const
                    ).map(([label, Icon]) => (
                      <span
                        key={label}
                        className="flex items-center gap-1 text-[10px] text-white/35"
                      >
                        <Icon className="w-3 h-3" /> {label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors shrink-0 mt-0.5">
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* ══ ALERTS ═════════════════════════════════════════════════════ */}
      {devaluationAlerts.length > 0 && (
        <motion.div {...stagger(2)}>
          <Link href="/dashboard/alerts">
            <div className="group flex items-center gap-3 p-4 rounded-xl bg-red-500/[0.06] border border-red-500/[0.14] hover:border-red-500/30 transition-all cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-300">
                  {devaluationAlerts.length} card
                  {devaluationAlerts.length > 1 ? "s" : ""} with 2026 reward
                  changes
                </p>
                <p className="text-xs text-white/30 mt-0.5 truncate">
                  {devaluationAlerts
                    .slice(0, 2)
                    .map((c: any) => c.name)
                    .join(" · ")}
                  {devaluationAlerts.length > 2 &&
                    ` +${devaluationAlerts.length - 2} more`}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400/40 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* ══ QUICK ACTIONS ══════════════════════════════════════════════ */}
      <motion.div {...stagger(3)}>
        <Divider label="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(
            [
              {
                icon: Sparkles,
                title: "Best Card",
                sub: "For my spending",
                href: "/dashboard/advisor",
                c: "#fbbf24",
                bg: "from-amber-500/12  to-amber-500/3",
              },
              {
                icon: TrendingUp,
                title: "Plan SIP",
                sub: "Investment advice",
                href: "/dashboard/wealth-advisor",
                c: "#34d399",
                bg: "from-emerald-500/12 to-emerald-500/3",
              },
              {
                icon: BarChart3,
                title: "Compare",
                sub: "Cards side by side",
                href: "/dashboard/compare",
                c: "#60a5fa",
                bg: "from-blue-500/12    to-blue-500/3",
              },
              {
                icon: Wallet,
                title: "Funds",
                sub: "500+ direct funds",
                href: "/dashboard/funds",
                c: "#a78bfa",
                bg: "from-violet-500/12  to-violet-500/3",
              },
            ] as const
          ).map((item) => (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br border border-white/[0.07] cursor-pointer group hover:border-white/[0.14] transition-all",
                  item.bg,
                )}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${item.c}18` }}
                >
                  <item.icon className="w-4 h-4" style={{ color: item.c }} />
                </div>
                <p className="text-sm font-bold text-white leading-tight">
                  {item.title}
                </p>
                <p className="text-[10px] text-white/35 mt-0.5">{item.sub}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ══ IPO TRACKER ════════════════════════════════════════════════ */}
      <motion.div {...stagger(4)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <h2 className="text-base font-bold text-white">IPO Tracker</h2>
            {IPOS.filter((i) => i.status === "ongoing").length > 0 && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-400/15 text-orange-400 border border-orange-400/20">
                {IPOS.filter((i) => i.status === "ongoing").length} LIVE
              </span>
            )}
          </div>
          <button className="text-xs text-amber-400/70 hover:text-amber-400 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-0.5">
          {(
            [
              ["all", `All (${IPOS.length})`],
              [
                "ongoing",
                `Live (${IPOS.filter((i) => i.status === "ongoing").length})`,
              ],
              [
                "upcoming",
                `Coming (${IPOS.filter((i) => i.status === "upcoming").length})`,
              ],
              [
                "listed",
                `Listed (${IPOS.filter((i) => i.status === "listed").length})`,
              ],
            ] as [IpoFilter, string][]
          ).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setIpoFilter(f)}
              className={cn(
                "shrink-0 h-7 px-3.5 rounded-full text-[11px] font-semibold border transition-all",
                ipoFilter === f
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-white/[0.07] text-white/30 hover:text-white/60",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/*
          Carousel overflow fix.
          The page wrapper has px-4 padding. To allow mobile horizontal scroll
          without cropping, we use a viewport-relative trick:
            - The scroll div itself breaks out of the column with a negative margin
              equal to the padding, and adds the same padding back as left/right
              padding on the inner row — so the first card aligns with content.
            - `overflow-x-auto` is set only on the direct scroll wrapper.
            - On sm+, we switch to a standard 2-col grid (no scrolling).
          Crucially there is NO overflow-x-hidden anywhere in the ancestor chain,
          which would create a scroll container that traps the overflow and prevents
          scrolling from working.
        */}
        {/* Mobile: break out of padded column so scroll rail touches screen edges */}
        <div className="sm:hidden -mx-4 overflow-x-auto scrollbar-none pb-2">
          <div className="flex gap-3 px-4" style={{ width: 2 }}>
            <AnimatePresence mode="popLayout">
              {filteredIpos.map((ipo, i) => (
                <motion.div
                  key={ipo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { delay: i * 0.05 },
                  }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  style={{ width: 248 }}
                >
                  <IpoCard ipo={ipo} onClick={() => setSelectedIpo(ipo)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        {/* sm+: regular 2-col grid, no scrolling */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-3">
          {filteredIpos.map((ipo) => (
            <IpoCard
              key={ipo.id}
              ipo={ipo}
              onClick={() => setSelectedIpo(ipo)}
            />
          ))}
        </div>

        <p className="text-[10px] text-white/20 mt-2.5 text-right">
          GMP = Grey Market Premium · indicative only · not investment advice
        </p>
      </motion.div>

      {/* ══ TOP CARDS (2-col tile grid, not list) ══════════════════════ */}
      <motion.div {...stagger(5)}>
        <SectionHeader
          title="Top Cards"
          subtitle="2026 effective reward rate"
          href="/dashboard/explore"
          accent="#fbbf24"
        />
        <div className="grid grid-cols-2 gap-3">
          {topCards.map((card: any, i: number) => (
            <CardTile key={card.id ?? i} card={card} rank={i + 1} />
          ))}
        </div>
      </motion.div>

      {/* ══ MARKET SNAPSHOT ════════════════════════════════════════════ */}
      <motion.div {...stagger(6)}>
        <Divider label="Market Snapshot" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {marketItems.map((m) => (
            <div
              key={m.label}
              className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.07] group hover:bg-white/[0.045] transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">
                  {m.label}
                </p>
                <span
                  className={cn(
                    "text-[10px] font-bold flex items-center gap-0.5 shrink-0 px-1.5 py-0.5 rounded-md",
                    m.pos
                      ? "text-emerald-400 bg-emerald-400/10"
                      : "text-red-400 bg-red-400/10",
                  )}
                >
                  {m.pos ? (
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  ) : (
                    <ArrowDownRight className="w-2.5 h-2.5" />
                  )}
                  {m.change}
                </span>
              </div>

              <p className="text-[17px] font-serif font-bold text-white tabular-nums tracking-tight">
                {m.value}
              </p>
              <p className="text-[10px] text-white/20 mt-0.5 font-medium">
                {m.sub}
              </p>

              {/* Restored MiniSparkline with live data injection */}
              <div className="mt-3.5 opacity-40 group-hover:opacity-80 transition-opacity duration-500">
                <MiniSparkline
                  positive={m.pos}
                  color={m.pos ? "#34d399" : "#f87171"}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/18 mt-2 text-right">
          Indicative · 15-min delayed
        </p>
      </motion.div>
    </div>
  );
}

// ─── IPO DETAIL PAGE ──────────────────────────────────────────────────────────
function IpoDetail({ ipo, onBack }: { ipo: IPO; onBack: () => void }) {
  const isListed = ipo.status === "listed";
  const isOngoing = ipo.status === "ongoing";

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-0 pb-16"
    >
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors pt-4 pb-6"
      >
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to dashboard
      </button>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl mb-6">
        {/* Multi-layer background */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-60",
            ipo.gradient,
          )}
        />
        <div className="absolute inset-0 bg-black/55" />
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* Hexagonal pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 17.3v17.4L30 52 0 34.7V17.3z' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 52px",
          }}
        />
        {/* Radial accent glow */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30"
          style={{ background: ipo.accent }}
        />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="relative p-6 sm:p-8">
          {/* Status + type badges */}
          <div className="flex items-center gap-2 mb-5">
            {isOngoing ? (
              <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-400/20 text-orange-300 border border-orange-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />{" "}
                LIVE NOW
              </span>
            ) : isListed ? (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/25">
                LISTED
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-white/50 border border-white/15">
                UPCOMING
              </span>
            )}
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: `${ipo.accent}20`,
                color: ipo.accent,
                border: `1px solid ${ipo.accent}35`,
              }}
            >
              {ipo.type}
            </span>
            <span className="text-[10px] text-white/35 bg-white/5 px-2.5 py-1 rounded-full">
              {ipo.sector}
            </span>
          </div>

          {/* Logo + name */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-2xl"
              style={{
                background: `${ipo.accent}25`,
                border: `1.5px solid ${ipo.accent}45`,
              }}
            >
              {ipo.logo}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {ipo.company}
              </h1>
              <p className="text-sm text-white/40 mt-0.5">
                IPO · {ipo.issue} issue size
              </p>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Price Band", value: ipo.priceRange },
              { label: "Lot Size", value: `${ipo.lotSize} shares` },
              { label: "Min. Invest", value: ipo.minInvest },
              { label: "Issue Size", value: ipo.issue },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl bg-black/35 p-3 text-center backdrop-blur-sm"
              >
                <p className="text-[9px] text-white/30 uppercase tracking-widest">
                  {m.label}
                </p>
                <p className="text-sm font-bold text-white mt-1 tabular-nums leading-tight">
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── GMP + Listed price ── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
          <p className="text-[10px] text-white/35 uppercase tracking-widest mb-1">
            Grey Market Premium
          </p>
          <p
            className={cn(
              "text-2xl font-bold tabular-nums",
              ipo.gmpPos ? "text-emerald-400" : "text-red-400",
            )}
          >
            {ipo.gmp}
          </p>
          <p className="text-[10px] text-white/25 mt-1">
            Indicative · changes daily
          </p>
        </div>
        {"listedAt" in ipo && ipo.listedAt ? (
          <div className="p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20">
            <p className="text-[10px] text-white/35 uppercase tracking-widest mb-1">
              Listed At
            </p>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">
              {ipo.listedAt}
            </p>
            <p className="text-[10px] text-white/25 mt-1">vs issue price</p>
          </div>
        ) : isOngoing ? (
          <div className="p-4 rounded-2xl bg-orange-500/8 border border-orange-500/20">
            <p className="text-[10px] text-white/35 uppercase tracking-widest mb-1">
              Closes In
            </p>
            <p className="text-xl font-bold mt-1">
              <Countdown targetMs={ipo.closesMs} />
            </p>
            <p className="text-[10px] text-white/25 mt-1">
              Apply before deadline
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <p className="text-[10px] text-white/35 uppercase tracking-widest mb-1">
              Opens In
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {ipo.opens.split(",")[0]}
            </p>
            <p className="text-[10px] text-white/25 mt-1">Mark your calendar</p>
          </div>
        )}
      </div>

      {/* ── Timeline ── */}
      <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.07] mb-5">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
          IPO Timeline
        </p>
        <div className="space-y-0">
          {[
            {
              label: "Open Date",
              date: ipo.opens,
              done: ipo.status !== "upcoming",
            },
            {
              label: "Close Date",
              date: ipo.closes,
              done: ipo.status === "listed",
            },
            {
              label: "Allotment",
              date: ipo.allotment,
              done: ipo.status === "listed",
            },
            {
              label: "Listing Date",
              date: ipo.listing,
              done: ipo.status === "listed",
            },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 transition-colors",
                    step.done
                      ? "border-emerald-400 bg-emerald-400"
                      : "border-white/20 bg-transparent",
                  )}
                />
                {i < arr.length - 1 && (
                  <div
                    className={cn(
                      "w-px flex-1 mt-1 mb-1 min-h-[20px]",
                      step.done ? "bg-emerald-400/40" : "bg-white/[0.08]",
                    )}
                  />
                )}
              </div>
              <div className="pb-3 min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    step.done ? "text-white" : "text-white/40",
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-white/30 tabular-nums">
                  {step.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── About ── */}
      <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.07] mb-5">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
          About the Company
        </p>
        <p className="text-sm text-white/65 leading-relaxed">{ipo.about}</p>
      </div>

      {/* ── Financials ── */}
      <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.07] mb-5">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
          Key Financials
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Revenue", value: ipo.financials.revenue },
            { label: "PAT", value: ipo.financials.pat },
            { label: "ROE", value: ipo.financials.roe },
            { label: "P/E", value: ipo.financials.pe },
          ].map((f) => (
            <div
              key={f.label}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center"
            >
              <p className="text-[9px] text-white/30 uppercase tracking-widest">
                {f.label}
              </p>
              <p
                className={cn(
                  "text-sm font-bold mt-1 tabular-nums",
                  f.value.startsWith("-")
                    ? "text-red-400"
                    : f.value === "N/M" || f.value === "Negative"
                      ? "text-white/30"
                      : "text-white",
                )}
              >
                {f.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Strengths & Risks ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/[0.15]">
          <p className="text-xs font-bold text-emerald-400/70 uppercase tracking-widest mb-3">
            Strengths
          </p>
          <div className="space-y-2.5">
            {ipo.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <p className="text-sm text-white/65 leading-snug">{s}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-red-500/[0.05] border border-red-500/[0.15]">
          <p className="text-xs font-bold text-red-400/70 uppercase tracking-widest mb-3">
            Risks
          </p>
          <div className="space-y-2.5">
            {ipo.risks.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <p className="text-sm text-white/65 leading-snug">{r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Apply CTA ── */}
      {!isListed && (
        <div
          className="p-4 rounded-2xl border text-center space-y-3"
          style={{
            borderColor: `${ipo.accent}25`,
            background: `${ipo.accent}08`,
          }}
        >
          <p className="text-xs text-white/40">
            Apply through your broker · UPI mandate accepted
          </p>
          <div className="flex gap-3">
            <button className="flex-1 py-3 rounded-xl text-sm font-bold border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition">
              Set Reminder
            </button>
            <button
              className="flex-[2] py-3 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 hover:opacity-90 transition"
              style={{ background: ipo.accent }}
            >
              Apply via ASBA <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-white/20 leading-relaxed">
            Not investment advice · verify via NSE/BSE · SEBI registered broker
            only
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── UTILITY COMPONENTS ───────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/22 shrink-0">
        {label}
      </p>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
  accent = "#fbbf24",
}: {
  title: string;
  subtitle: string;
  href: string;
  accent?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-base font-bold text-white">{title}</h2>
        <p className="text-xs text-white/35 mt-0.5">{subtitle}</p>
      </div>
      <Link href={href}>
        <button
          className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
          style={{ color: accent }}
        >
          See all <ArrowRight className="w-3 h-3" />
        </button>
      </Link>
    </div>
  );
}
