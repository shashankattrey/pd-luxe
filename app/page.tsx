"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import Link from "next/link";
import {
  CreditCard,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Bot,
  Globe,
  SquareChartGantt,
  SearchCheck,
  Zap,
  PieChart,
  ShieldAlert,
  ChevronRight,
  Cpu,
  Target,
  Coins,
  HeartPulse,
  ShoppingBag,
  Briefcase,
  Users,
  ReceiptIndianRupee,
  Languages,
  BarChart3,
  History,
  Scale,
  LineChart,
  Lock,
  Database,
} from "lucide-react";

// ─── GLOBAL FONT INJECTION ────────────────────────────────────────────────────
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Serif+Display:ital@0;1&family=Instrument+Sans:wght@400;500;600;700&display=swap');
    :root {
      --gold: #D4A853;
      --gold-light: #F0C878;
      --gold-dim: rgba(212,168,83,0.15);
      --ink: #080808;
    }
    * { box-sizing: border-box; }
    body { background: var(--ink); }
    .font-display { font-family: 'Playfair Display', serif; }
    .font-serif  { font-family: 'DM Serif Display', serif; }
    .font-sans   { font-family: 'Instrument Sans', sans-serif; }

    /* Gold shimmer animation */
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    .gold-shimmer {
      background: linear-gradient(90deg, #b8860b 0%, #f5d07a 40%, #D4A853 60%, #b8860b 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 4s linear infinite;
    }

    /* Ticker tape */
    @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .ticker-inner { animation: ticker 28s linear infinite; }
    .ticker-inner:hover { animation-play-state: paused; }

    /* Pulsing glow dot */
    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 4px 1px rgba(212,168,83,0.6); }
      50%       { box-shadow: 0 0 14px 4px rgba(212,168,83,0.9); }
    }
    .glow-dot { animation: glow-pulse 2s ease-in-out infinite; }

    /* Float animation */
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33%       { transform: translateY(-8px) rotate(1deg); }
      66%       { transform: translateY(-4px) rotate(-1deg); }
    }
    .float { animation: float 6s ease-in-out infinite; }

    /* Number tick */
    @keyframes numtick {
      0%   { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .numtick { animation: numtick 0.3s ease forwards; }

    /* Scan line */
    @keyframes scan {
      0%   { top: 0%; opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
    .scan-line {
      position: absolute; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(212,168,83,0.6), transparent);
      animation: scan 3s ease-in-out infinite;
    }

    /* Gradient border */
    .gold-border {
      border: 1px solid transparent;
      background-clip: padding-box;
      position: relative;
    }
    .gold-border::before {
      content: '';
      position: absolute; inset: -1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(212,168,83,0.4), transparent 50%, rgba(212,168,83,0.2));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    /* Noise overlay */
    .noise::after {
      content: '';
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      pointer-events: none; z-index: 0;
    }
  `}</style>
);

// ─── STATIC RATES FROM useFundData FALLBACK ──────────────────────────────────
// Values mirror FALLBACK_RATES in useFundData.ts (Q1 2026)
// When you wire up the real hook, replace these with the live rates object.
const RATES = {
  nifty50: { value: 24148, changePct: +0.42 },
  sensex: { value: 79480, changePct: +0.38 },
  niftyBank: { value: 52340, changePct: -0.12 },
  niftyMid: { value: 49200, changePct: +0.61 },
  gold24k: { value: 79420, changePct: +0.21 }, // ₹/10g live proxy
  usdInr: { value: 83.2, changePct: -0.05 },
  ppf: { rate: 7.1 },
  ssy: { rate: 8.2 },
  scss: { rate: 8.2 },
  rbiBonds: { rate: 8.05 },
  nsc: { rate: 7.7 },
  sgb: { interestRate: 2.5, lastIssuePrice: 6263 },
  hdfcFD: { rate365: 7.0 },
  repoRate: { value: 6.5 },
  inflation: { value: 5.1 },
};

// Build ticker items from real rate data — wealth-first, not card-first
const TICKER_ITEMS = [
  {
    label: "NIFTY 50",
    val: RATES.nifty50.value.toLocaleString("en-IN"),
    up: RATES.nifty50.changePct >= 0,
  },
  {
    label: "SENSEX",
    val: RATES.sensex.value.toLocaleString("en-IN"),
    up: RATES.sensex.changePct >= 0,
  },
  {
    label: "NIFTY BANK",
    val: RATES.niftyBank.value.toLocaleString("en-IN"),
    up: RATES.niftyBank.changePct >= 0,
  },
  {
    label: "NIFTY MIDCAP",
    val: RATES.niftyMid.value.toLocaleString("en-IN"),
    up: RATES.niftyMid.changePct >= 0,
  },
  {
    label: "GOLD / 10g",
    val: `₹${RATES.gold24k.value.toLocaleString("en-IN")}`,
    up: RATES.gold24k.changePct >= 0,
  },
  {
    label: "USD/INR",
    val: RATES.usdInr.value.toFixed(2),
    up: RATES.usdInr.changePct >= 0,
  },
  { label: "PPF RATE", val: `${RATES.ppf.rate}%`, up: true },
  { label: "SSY RATE", val: `${RATES.ssy.rate}%`, up: true },
  { label: "RBI BONDS", val: `${RATES.rbiBonds.rate}%`, up: true },
  { label: "HDFC FD 1Y", val: `${RATES.hdfcFD.rate365}%`, up: true },
  { label: "SGB YIELD", val: `${RATES.sgb.interestRate}% + Gold`, up: true },
  { label: "REPO RATE", val: `${RATES.repoRate.value}%`, up: false },
  { label: "INFLATION", val: `${RATES.inflation.value}%`, up: false },
  { label: "NSC RATE", val: `${RATES.nsc.rate}%`, up: true },
  { label: "SCSS RATE", val: `${RATES.scss.rate}%`, up: true },
];

function LiveTicker() {
  // Triple the items so the seamless loop always has content visible
  const tripled = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] overflow-hidden h-7 bg-black border-b border-[rgba(212,168,83,0.2)] flex items-center font-sans">
      <div className="shrink-0 px-4 text-[10px] font-bold uppercase tracking-widest text-[#D4A853] border-r border-[rgba(212,168,83,0.2)] h-full flex items-center gap-1.5 bg-[rgba(212,168,83,0.05)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A853] glow-dot inline-block" />
        LIVE
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-inner flex gap-0 whitespace-nowrap">
          {tripled.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 px-5 text-[10px] font-bold border-r border-white/5 h-7 leading-7"
            >
              <span className="text-white/25 uppercase tracking-widest">
                {item.label}
              </span>
              <span className={item.up ? "text-emerald-400" : "text-red-400"}>
                {item.val}
              </span>
              <span
                className={item.up ? "text-emerald-400/50" : "text-red-400/50"}
              >
                {item.up ? "▲" : "▼"}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────
function AnimCount({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const [val, setVal] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.5 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const steps = 60,
      inc = to / steps;
    const id = setInterval(() => {
      start = Math.min(to, start + inc + (to - start) * 0.08);
      setVal(start);
      if (start >= to) {
        setVal(to);
        clearInterval(id);
      }
    }, 1000 / steps);
    return () => clearInterval(id);
  }, [visible, to]);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ─── FLOATING CARD VISUAL ─────────────────────────────────────────────────────
function FloatingCard({
  delay = 0,
  gradient,
  name,
  reward,
  top,
  left,
  right,
  rotate,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{ top, left, right, rotate: `${rotate}deg`, position: "absolute" }}
      className="float"
    >
      <div
        className={`w-44 h-28 rounded-2xl bg-gradient-to-br ${gradient} relative overflow-hidden shadow-2xl border border-white/10`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="scan-line" />
        <div className="absolute top-3 left-3 w-8 h-6 rounded-md bg-gradient-to-br from-amber-300/40 to-amber-500/30 border border-white/20" />
        <div className="absolute top-3 right-3 text-[8px] font-bold text-white/50 uppercase tracking-widest">
          {name}
        </div>
        <div className="absolute bottom-3 left-3">
          <p className="text-[8px] text-white/40 uppercase tracking-widest">
            Reward Rate
          </p>
          <p className="text-sm font-bold text-[#D4A853]">{reward}</p>
        </div>
        <div className="absolute bottom-3 right-3 opacity-20">
          <div className="w-3.5 h-3.5 rounded-full border border-white" />
          <div className="w-5 h-5 rounded-full border border-white absolute -top-0.5 -left-0.5" />
        </div>
        {/* Holographic shimmer strip */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      </div>
    </motion.div>
  );
}

// ─── FLOAT WIDGET WRAPPER (wealth instrument panels) ─────────────────────────
function FloatWidget({ children, delay = 0, top, left, right, rotate }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{ top, left, right, rotate: `${rotate}deg`, position: "absolute" }}
      className="float"
    >
      {children}
    </motion.div>
  );
}

// ─── SECTION REVEAL WRAPPER ───────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("travel");
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  // Subtle parallax on mouse move for hero
  useEffect(() => {
    const h = (e: MouseEvent) => {
      setMouseX((e.clientX / window.innerWidth - 0.5) * 20);
      setMouseY((e.clientY / window.innerHeight - 0.5) * 20);
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-slate-200 selection:bg-[#D4A853] selection:text-black overflow-x-hidden font-sans">
      <FontStyle />
      <LiveTicker />

      {/* ══ NAVIGATION ════════════════════════════════════════════════════ */}
      <nav className="fixed top-7 left-0 right-0 z-[100]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between px-6 py-3 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/[0.07]">
            <Link href="/" className="flex items-center gap-3 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,#D4A853,#8B6914)",
                }}
              >
                <span className="text-black font-black text-sm font-display">
                  P
                </span>
              </div>
              <div>
                <span className="font-display text-lg font-bold text-white leading-none tracking-tight">
                  PaisaDekho
                </span>
                <span className="block text-[9px] text-[#D4A853] font-bold uppercase tracking-[0.3em] mt-0.5">
                  Luxe Intelligence
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              {[
                ["#how-it-works", "The Loop"],
                ["#use-cases", "Use Cases"],
                ["#butler-lab", "Butler Lab"],
                ["#wealth", "Wealth Meta"],
                ["#security", "Privacy"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 hover:text-[#D4A853] transition-all duration-200"
                >
                  {label}
                </Link>
              ))}
            </div>

            <Link href="/auth/login">
              <button
                className="relative overflow-hidden px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-all group"
                style={{
                  background: "linear-gradient(135deg,#D4A853,#F0C878)",
                }}
              >
                <span className="relative z-10">Apply for Access</span>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-28 pb-24 px-6 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0">
          {/* Deep radial */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(212,168,83,0.07),transparent)]" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(212,168,83,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(212,168,83,0.6) 1px,transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
          {/* Corner vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,transparent_50%,rgba(8,8,8,0.8)_100%)]" />
        </div>

        {/* Floating wealth widgets — parallax */}
        <motion.div
          className="absolute inset-0 pointer-events-none hidden lg:block"
          style={{ x: mouseX * 0.3, y: mouseY * 0.3 }}
        >
          {/* SIP Calculator widget — top left */}
          <FloatWidget delay={0.3} top="14%" left="3%" rotate={-6}>
            <div className="w-52 rounded-2xl bg-gradient-to-br from-emerald-950 to-zinc-950 border border-emerald-400/15 p-4 shadow-2xl">
              <div className="scan-line" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/60 mb-3">
                SIP Calculator
              </p>
              <p className="text-[10px] text-white/40 mb-1">
                Monthly ₹10,000 · 15 yrs · 14%
              </p>
              <p className="text-xl font-black text-emerald-400 font-display">
                ₹74.7 Lakhs
              </p>
              <p className="text-[9px] text-white/25 mt-1">Projected corpus</p>
              <div className="mt-3 flex gap-1">
                {[40, 55, 62, 70, 80, 91, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-emerald-400/20"
                    style={{ height: h * 0.28 + "px", alignSelf: "flex-end" }}
                  />
                ))}
              </div>
            </div>
          </FloatWidget>

          {/* Gold / SGB widget — top right */}
          <FloatWidget delay={0.5} top="16%" right="3%" rotate={7}>
            <div className="w-48 rounded-2xl bg-gradient-to-br from-amber-950 to-zinc-950 border border-amber-400/15 p-4 shadow-2xl">
              <div className="scan-line" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#D4A853]/60 mb-3">
                Gold / SGB
              </p>
              <div className="flex items-end justify-between mb-1">
                <p className="text-xl font-black text-[#D4A853] font-display">
                  ₹79,420
                </p>
                <span className="text-[9px] text-emerald-400 font-bold">
                  ▲ 0.21%
                </span>
              </div>
              <p className="text-[9px] text-white/30">Per 10g · 24k</p>
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[9px] text-white/30 mb-0.5">
                  SGB Interest Rate
                </p>
                <p className="text-sm font-bold text-[#D4A853]">
                  {RATES.sgb.interestRate}% p.a. + Gains
                </p>
              </div>
            </div>
          </FloatWidget>

          {/* Portfolio donut widget — bottom left */}
          <FloatWidget delay={0.7} top="60%" left="2%" rotate={4}>
            <div className="w-52 rounded-2xl bg-gradient-to-br from-violet-950 to-zinc-950 border border-violet-400/12 p-4 shadow-2xl">
              <div className="scan-line" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-violet-400/60 mb-3">
                Sample Portfolio
              </p>
              <div className="flex items-center gap-3">
                {/* Mini donut SVG */}
                <svg width="48" height="48" viewBox="0 0 48 48">
                  {[
                    { pct: 45, color: "#a78bfa", offset: 0 },
                    { pct: 25, color: "#D4A853", offset: 45 },
                    { pct: 20, color: "#34d399", offset: 70 },
                    { pct: 10, color: "#60a5fa", offset: 90 },
                  ].map((s, i) => {
                    const r = 16,
                      circ = 2 * Math.PI * r;
                    return (
                      <circle
                        key={i}
                        cx="24"
                        cy="24"
                        r={r}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="7"
                        strokeDasharray={`${(s.pct / 100) * circ} ${circ}`}
                        strokeDashoffset={-(s.offset / 100) * circ}
                        transform="rotate(-90 24 24)"
                        opacity="0.85"
                      />
                    );
                  })}
                </svg>
                <div className="space-y-1.5">
                  {[
                    ["Equity", "45%", "#a78bfa"],
                    ["Gold", "25%", "#D4A853"],
                    ["Debt", "20%", "#34d399"],
                    ["Intl", "10%", "#60a5fa"],
                  ].map(([l, p, c]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: c }}
                      />
                      <span className="text-[9px] text-white/40">{l}</span>
                      <span className="text-[9px] font-bold text-white/70 ml-auto">
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FloatWidget>

          {/* Govt scheme rates widget — bottom right */}
          <FloatWidget delay={0.9} top="56%" right="2%" rotate={-5}>
            <div className="w-48 rounded-2xl bg-gradient-to-br from-sky-950 to-zinc-950 border border-sky-400/12 p-4 shadow-2xl">
              <div className="scan-line" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-sky-400/60 mb-3">
                Govt Schemes
              </p>
              <div className="space-y-2">
                {[
                  ["PPF", `${RATES.ppf.rate}%`, "#34d399"],
                  ["SSY", `${RATES.ssy.rate}%`, "#D4A853"],
                  ["RBI Bonds", `${RATES.rbiBonds.rate}%`, "#60a5fa"],
                  ["SCSS", `${RATES.scss.rate}%`, "#a78bfa"],
                ].map(([name, rate, color]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-[9px] text-white/35">{name}</span>
                    <span className="text-[9px] font-black" style={{ color }}>
                      {rate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FloatWidget>
        </motion.div>

        {/* Hero text */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-[rgba(212,168,83,0.25)] bg-[rgba(212,168,83,0.06)] text-[#D4A853] text-[10px] font-bold uppercase tracking-[0.25em] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A853] glow-dot" />
              2026 · AI Wealth Manager · SIP · Mutual Funds · Gold · Govt
              Schemes · Cards
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-[72px] sm:text-[88px] md:text-[108px] font-black leading-[0.88] tracking-tighter mb-8 text-white"
          >
            Your Money,
            <br />
            <span className="gold-shimmer italic">Self-Driving.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-lg md:text-xl text-white/40 max-w-3xl mx-auto mb-12 leading-relaxed font-sans font-light"
          >
            India's first AI that builds your{" "}
            <span className="text-white font-medium">wealth corpus</span>,
            optimises every{" "}
            <span className="text-white font-medium">
              SIP, FD, and Govt Scheme
            </span>
            , and supercharges your credit card rewards — all in one intelligent
            engine.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/login">
              <button
                className="group relative overflow-hidden px-10 py-4 rounded-full text-sm font-bold uppercase tracking-[0.2em] text-black transition-all duration-300 hover:scale-105 shadow-2xl"
                style={{
                  background:
                    "linear-gradient(135deg,#D4A853 0%,#F0C878 50%,#D4A853 100%)",
                  boxShadow: "0 0 40px rgba(212,168,83,0.3)",
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start for Free{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
              </button>
            </Link>
            <button className="px-10 py-4 rounded-full text-sm font-bold uppercase tracking-[0.2em] text-white/60 border border-white/10 hover:border-[rgba(212,168,83,0.4)] hover:text-[#D4A853] transition-all duration-200">
              Watch Demo
            </button>
          </motion.div>

          {/* Live stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12"
          >
            {[
              { label: "Corpus Managed", to: 487, suffix: " Cr", prefix: "₹" },
              { label: "Funds Tracked", to: 2500, suffix: "+", prefix: "" },
              {
                label: "Simulations / Day",
                to: 50000,
                suffix: "+",
                prefix: "",
              },
              {
                label: "Avg. XIRR Boost",
                to: 3.2,
                suffix: "%",
                prefix: "+",
                decimals: 1,
              },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <AnimCount
                  to={s.to}
                  prefix={s.prefix || ""}
                  suffix={s.suffix}
                  decimals={(s as any).decimals || 0}
                  className="font-display text-3xl font-bold text-[#D4A853] tabular-nums"
                />
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080808] to-transparent" />
      </section>

      {/* ══ INTELLIGENCE LOOP ═════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(212,168,83,0.04),transparent)]" />
        <div className="max-w-7xl mx-auto relative">
          <Reveal className="text-center mb-20">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4A853] mb-4">
              How It Works
            </p>
            <h2 className="font-display text-5xl md:text-6xl font-black text-white leading-tight">
              The <em className="gold-shimmer not-italic">Intelligence</em> Loop
            </h2>
            <p className="text-white/35 mt-4 text-lg">
              How we turn your daily spend into long-term generational wealth.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.3)] to-transparent" />

            {[
              {
                num: "01",
                icon: SearchCheck,
                title: "Local Data Scan",
                desc: "Scans cashflow and card devaluations on-device. Zero data leaves your phone.",
              },
              {
                num: "02",
                icon: Cpu,
                title: "Alpha Analysis",
                desc: "Butler runs 50,000+ simulations to find the highest-yield path for every rupee.",
              },
              {
                num: "03",
                icon: Target,
                title: "Goal Mapping",
                desc: "SIPs and Reward Points unified into a single goal-based trajectory.",
              },
              {
                num: "04",
                icon: Zap,
                title: "Auto-Execution",
                desc: "One-tap trades, rebalancing, and fee waivers via secure institutional bridges.",
              },
            ].map((s, i) => (
              <Reveal key={s.num} delay={i * 0.1}>
                <div className="group p-8 text-center relative">
                  {/* Step number */}
                  <div className="relative inline-flex items-center justify-center w-14 h-14 mb-8">
                    <div className="absolute inset-0 rounded-full border border-[rgba(212,168,83,0.2)] group-hover:border-[rgba(212,168,83,0.5)] transition-colors" />
                    <div className="absolute inset-0 rounded-full bg-[rgba(212,168,83,0.04)] group-hover:bg-[rgba(212,168,83,0.1)] transition-colors" />
                    <s.icon className="w-6 h-6 text-[#D4A853]" />
                    <span className="absolute -top-2 -right-2 text-[9px] font-black text-[#D4A853]/60 bg-[#080808] px-1">
                      {s.num}
                    </span>
                  </div>
                  <h4 className="font-display text-lg font-bold text-white mb-3">
                    {s.title}
                  </h4>
                  <p className="text-white/35 text-sm leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ USE CASES BENTO ═══════════════════════════════════════════════ */}
      <section id="use-cases" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-16">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4A853] mb-4">
                Intelligence in Action
              </p>
              <h2 className="font-display text-5xl md:text-6xl font-black text-white leading-tight mb-4">
                Built for{" "}
                <em className="gold-shimmer not-italic">Life's Complexity</em>
              </h2>
              <p className="text-white/35 text-xl max-w-2xl">
                From Jaipur to Dubai, from today's coffee to your daughter's
                wedding — the Butler manages it all.
              </p>
            </div>
          </Reveal>

          {/* Featured row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            <Reveal delay={0} className="md:col-span-5">
              <UseCaseBig
                icon={ShoppingBag}
                title="Point-of-Sale Intelligence"
                desc="Standing at a Taj Hotel? Butler detects the merchant and tells you which card triggers the 10× reward multiplier — before you tap."
                stat="10×"
                statLabel="Reward Multiplier"
                accent="#D4A853"
              />
            </Reveal>
            <Reveal delay={0.1} className="md:col-span-7">
              <UseCaseBig
                icon={Briefcase}
                title="Tax-Loss Harvesting Engine"
                desc="Every March, the AI automatically sells loss-making units and re-buys them instantly, saving you up to ₹1 Lakh in Capital Gains tax."
                stat="₹1L"
                statLabel="Annual Tax Saving"
                accent="#34d399"
              />
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: HeartPulse,
                title: "Emergency Fund Lockbox",
                desc: "Detects medical spends and prepares a Liquidity Plan — telling you which fund to exit first to minimize exit loads.",
              },
              {
                icon: ReceiptIndianRupee,
                title: "Rental Yield Loop",
                desc: "Pay rent via Butler to maximize miles, then auto-invest the reward value into high-yield 11% corporate bonds.",
              },
              {
                icon: Users,
                title: "Family Office Mode",
                desc: "Aggregate your family's spending to hit Super Milestone targets like the ₹12L fee waiver on HDFC Infinia.",
              },
              {
                icon: Languages,
                title: "Forex Hedging",
                desc: "Traveling to Dubai? Butler compares card Forex markups vs. zero-markup cards in real time.",
              },
              {
                icon: Scale,
                title: "Stress Test Simulation",
                desc: "Simulates a 2008-style crash on your portfolio to ensure your ₹10L goal remains on track via hedging.",
              },
              {
                icon: ShieldAlert,
                title: "Hidden Fee Audit",
                desc: "AI scans for Dynamic Currency Conversion fees and alerts you to claim refunds for merchant-forced markups.",
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 0.06}>
                <UseCaseSmall icon={c.icon} title={c.title} desc={c.desc} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BUTLER LAB (Interactive) ═══════════════════════════════════════ */}
      <section id="butler-lab" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(212,168,83,0.02)] to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <Reveal className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4A853] mb-4">
              Live Simulation
            </p>
            <h2 className="font-display text-5xl md:text-6xl font-black text-white italic">
              The Butler <span className="gold-shimmer">Lab</span>
            </h2>
            <p className="text-white/35 mt-4">
              Ask. Analyze. Execute. See it happen in real time.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-10">
              {[
                ["travel", "✈ Jaipur → Dubai"],
                ["wealth", "📈 ₹10L Wealth Goal"],
                ["luxury", "💎 Luxury Purchase"],
              ].map(([t, l]) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeTab === t
                      ? "text-black shadow-lg"
                      : "bg-white/5 text-white/40 border border-white/10 hover:border-[rgba(212,168,83,0.3)] hover:text-[#D4A853]"
                  }`}
                  style={
                    activeTab === t
                      ? {
                          background: "linear-gradient(135deg,#D4A853,#F0C878)",
                          boxShadow: "0 4px 20px rgba(212,168,83,0.3)",
                        }
                      : {}
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </Reveal>

          {/* Terminal window */}
          <Reveal>
            <div
              className="rounded-3xl border border-[rgba(212,168,83,0.15)] overflow-hidden shadow-2xl relative"
              style={{ boxShadow: "0 0 80px rgba(212,168,83,0.08)" }}
            >
              {/* Terminal title bar */}
              <div className="flex items-center gap-3 px-6 py-3 bg-[#111] border-b border-white/[0.06]">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="ml-4 text-[10px] text-white/25 font-mono uppercase tracking-widest">
                  butler://intelligence.engine · v2.1.0
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4A853] glow-dot" />
                  <span className="text-[9px] text-[#D4A853] font-bold uppercase tracking-widest">
                    Online
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Input side */}
                <div className="p-8 sm:p-12 bg-[#0d0d0d] border-r border-white/[0.06]">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white/40 italic">
                        You
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">
                      Client Query
                    </span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="relative p-8 rounded-2xl rounded-tl-none border border-white/[0.08] bg-white/[0.02]">
                        <p className="font-serif text-xl text-white/85 leading-relaxed italic">
                          {activeTab === "travel" &&
                            '"Butler, I\'m booking Jaipur → Dubai for ₹45,000. Which card should I use?"'}
                          {activeTab === "wealth" &&
                            '"Butler, I want to SIP ₹10,000 monthly and need ₹10 Lakhs in 5 years. Give me the alpha path."'}
                          {activeTab === "luxury" &&
                            '"Butler, buying a ₹2 Lakh Rolex. Is No-Cost EMI better than paying in full?"'}
                        </p>
                        {/* Typing cursor */}
                        <span className="inline-block w-0.5 h-4 bg-[#D4A853] animate-pulse ml-1 align-middle" />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Response side */}
                <div className="p-8 sm:p-12 bg-black relative overflow-hidden">
                  {/* Scan line effect */}
                  <div className="scan-line" />
                  <div className="flex items-center gap-3 mb-10">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                      style={{
                        background: "linear-gradient(135deg,#D4A853,#8B6914)",
                      }}
                    >
                      <Bot className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A853]">
                        Butler Analysis
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 glow-dot" />
                        <span className="text-[8px] text-emerald-400/60 uppercase tracking-widest">
                          Processing complete
                        </span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab + "ans"}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {activeTab === "travel" && (
                        <>
                          <div className="flex justify-between items-end pb-5 border-b border-white/[0.08]">
                            <div>
                              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">
                                Recommended
                              </p>
                              <h4 className="font-display text-2xl font-bold text-white">
                                Axis Atlas
                              </h4>
                            </div>
                            <div className="text-right">
                              <p className="font-display text-3xl font-bold text-emerald-400">
                                ₹7,800
                              </p>
                              <p className="text-[9px] text-white/30 uppercase tracking-widest">
                                Reward Value
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2.5">
                            <LabRow
                              label="Axis Atlas (Miles Transfer)"
                              val="17.3% Yield"
                              active
                            />
                            <LabRow
                              label="HDFC Infinia (Direct)"
                              val="13.2% Yield"
                            />
                          </div>
                          <div className="p-4 rounded-2xl bg-[rgba(212,168,83,0.05)] border border-[rgba(212,168,83,0.12)]">
                            <p className="text-[11px] text-white/50 leading-relaxed italic font-serif">
                              "Since you're ₹12k from Gold Milestone, this spend
                              triggers 2,500 bonus miles. Total yield beats
                              direct cashback by 34%."
                            </p>
                          </div>
                        </>
                      )}
                      {activeTab === "wealth" && (
                        <>
                          <div className="flex justify-between items-end pb-5 border-b border-white/[0.08]">
                            <div>
                              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">
                                Projected Corpus
                              </p>
                              <h4 className="font-display text-2xl font-bold text-white">
                                ₹10.42 Lakhs
                              </h4>
                            </div>
                            <div className="text-right">
                              <p className="font-display text-3xl font-bold text-[#D4A853]">
                                14.2%
                              </p>
                              <p className="text-[9px] text-white/30 uppercase tracking-widest">
                                Required XIRR
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {[
                              ["Mid-Cap Momentum (AI-Sourced)", "55%"],
                              ["Digital Gold (Hedge)", "25%"],
                              ["Indian Tech Portfolio", "20%"],
                            ].map(([l, p]) => (
                              <div
                                key={l}
                                className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                              >
                                <span className="text-sm text-white/60">
                                  {l}
                                </span>
                                <span className="text-sm font-bold text-white">
                                  {p}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="p-4 rounded-2xl bg-[rgba(212,168,83,0.05)] border border-[rgba(212,168,83,0.12)]">
                            <p className="text-[11px] text-white/50 leading-relaxed italic font-serif">
                              "Base SIP covers ₹7.8L. Butler bridges the ₹2.2L
                              gap by harvesting card cashback and auto-sweeping
                              bank dividends."
                            </p>
                          </div>
                        </>
                      )}
                      {activeTab === "luxury" && (
                        <>
                          <div className="flex justify-between items-end pb-5 border-b border-white/[0.08]">
                            <div>
                              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">
                                Verdict
                              </p>
                              <h4 className="font-display text-2xl font-bold text-white">
                                Pay In Full
                              </h4>
                            </div>
                            <div className="text-right">
                              <p className="font-display text-3xl font-bold text-emerald-400">
                                ₹1,450
                              </p>
                              <p className="text-[9px] text-white/30 uppercase tracking-widest">
                                Saved in Fees
                              </p>
                            </div>
                          </div>
                          <div className="p-4 rounded-2xl bg-red-500/[0.06] border border-red-500/[0.12]">
                            <p className="text-[11px] text-white/50 leading-relaxed italic font-serif">
                              "No-Cost EMI has a hidden 18% GST on interest.
                              Paying in full nets 6,600 Reward Points (₹6,600
                              value) vs a net loss of ₹1,450 on EMI."
                            </p>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ MARKET DOMINANCE (Bento) ══════════════════════════════════════ */}
      <section id="wealth" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="flex flex-col sm:flex-row justify-between items-end mb-16 gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4A853] mb-3">
                  Asset Intelligence
                </p>
                <h2 className="font-display text-5xl md:text-6xl font-black text-white">
                  Market <em className="gold-shimmer not-italic">Dominance.</em>
                </h2>
              </div>
              <div className="flex gap-3 flex-wrap">
                {["SEBI Registered", "DPDP Compliant", "RBI Compliant"].map(
                  (t) => (
                    <span
                      key={t}
                      className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-[9px] font-bold uppercase tracking-widest text-white/35"
                    >
                      {t}
                    </span>
                  ),
                )}
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <Reveal delay={0} className="md:col-span-8">
              <BentoCard
                icon={LineChart}
                title="Mutual Fund Alpha"
                desc="Butler scans 2,500+ funds for the top 1% that beat the index. Tax-Loss harvesting included."
                tags={["Direct Plans", "Momentum", "Exit Load Alert"]}
                large
              />
            </Reveal>
            <Reveal delay={0.1} className="md:col-span-4">
              <BentoCard
                icon={Globe}
                title="Indian Blue Chips"
                desc="Fractional access to Top Performing NSE-listed funds and equities."
                tags={["NSE", "BSE", "LRS Bridge"]}
              />
            </Reveal>
            <Reveal delay={0.2} className="md:col-span-4">
              <BentoCard
                icon={SquareChartGantt}
                title="Yield Bonds"
                desc="Institutional access to AAA-rated corporate bonds with fixed 9–11% annual yields."
                tags={["Fixed Income", "No Vol"]}
              />
            </Reveal>
            <Reveal delay={0.3} className="md:col-span-8">
              <BentoCard
                icon={CreditCard}
                title="Credit Card Meta 2026"
                desc="Real-time devaluation alerts, lounge counters, and Milestone spend predictors for all Indian premium cards."
                tags={["Infinia", "Atlas", "Magnus", "Amex"]}
                large
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF TICKER ═══════════════════════════════════════════ */}
      <section className="py-16 border-y border-white/[0.05] overflow-hidden">
        <div className="flex gap-0 whitespace-nowrap">
          <div
            className="ticker-inner flex gap-0"
            style={{ animationDuration: "20s" }}
          >
            {[...Array(3)].map((_, g) => (
              <React.Fragment key={g}>
                {[
                  "₹4.8% avg. effective reward across users",
                  "200+ credit cards tracked daily",
                  "₹487 Cr corpus under intelligence",
                  "50,000+ simulations every day",
                  "Zero data breaches since inception",
                  "HDFC Infinia · Axis Atlas · Amex Platinum · SBI Cashback",
                ].map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-4 px-10 text-sm font-semibold text-white/25 border-r border-white/[0.05]"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#D4A853]/60" />
                    {t}
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRIVACY SECTION ═══════════════════════════════════════════════ */}
      <section id="security" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_50%,rgba(212,168,83,0.04),transparent)]" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative">
          <Reveal>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-8"
              style={{
                background: "rgba(212,168,83,0.1)",
                border: "1px solid rgba(212,168,83,0.2)",
              }}
            >
              <ShieldCheck className="w-6 h-6 text-[#D4A853]" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4A853] mb-4">
              Data Sovereignty
            </p>
            <h2 className="font-display text-5xl font-black text-white leading-tight mb-8">
              Privacy is <em className="gold-shimmer not-italic">Luxury.</em>
            </h2>
            <p className="text-white/40 text-lg leading-relaxed mb-10">
              Free apps sell your data to banks. We sell intelligence to you.
              PaisaDekho Luxe uses{" "}
              <strong className="text-white font-semibold">
                Zero-Knowledge Edge Computing
              </strong>
              .
            </p>
            <div className="space-y-7">
              {[
                {
                  title: "On-Device Parsing",
                  desc: "Financial SMS and PDF statements are analyzed on your phone. Our servers only see the metadata needed for execution.",
                },
                {
                  title: "AES-256 Token Sandboxing",
                  desc: "We use encrypted tokens. We never store your bank passwords or net-banking credentials.",
                },
                {
                  title: "DPDP Act 2023 Compliant",
                  desc: "Full data sovereignty. Delete your entire financial vault with a single tap. Your data, your choice.",
                },
              ].map((p) => (
                <div key={p.title} className="flex gap-4">
                  <div
                    className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      background: "#D4A853",
                      boxShadow: "0 0 10px rgba(212,168,83,0.8)",
                    }}
                  />
                  <div>
                    <h5 className="font-display text-lg font-bold text-white mb-1.5">
                      {p.title}
                    </h5>
                    <p className="text-white/35 text-sm leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "Data Residency", value: "INDIA" },
                { title: "Audit Standard", value: "SOC 2" },
                { title: "Encryption", value: "AES-256" },
                { title: "Regulation", value: "ISO 27001" },
              ].map((b) => (
                <div
                  key={b.title}
                  className="p-10 rounded-3xl bg-[#0d0d0d] border border-white/[0.06] text-center flex flex-col justify-center hover:border-[rgba(212,168,83,0.25)] transition-colors group"
                >
                  <span className="font-display text-2xl font-black text-[#D4A853] mb-2 tabular-nums group-hover:gold-shimmer transition-all">
                    {b.value}
                  </span>
                  <span className="text-[9px] text-white/25 uppercase tracking-[0.3em] font-bold">
                    {b.title}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(212,168,83,0.07),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,168,83,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(212,168,83,0.8) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <Reveal>
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.2)] text-[#D4A853] text-[9px] font-bold uppercase tracking-[0.3em] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A853] glow-dot" />
              Private Access · Limited Onboarding
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-black text-white leading-tight mb-6">
              Your Corpus Is <br />
              <em className="gold-shimmer not-italic">Waiting.</em>
            </h2>
            <p className="text-white/35 text-xl mb-12 leading-relaxed">
              Join 1,200+ wealth-conscious Indians who've already put their
              money to work with Butler.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/login">
                <button
                  className="group relative overflow-hidden px-12 py-5 rounded-full text-base font-bold uppercase tracking-[0.15em] text-black transition-all hover:scale-105"
                  style={{
                    background:
                      "linear-gradient(135deg,#D4A853 0%,#F0C878 50%,#D4A853 100%)",
                    boxShadow: "0 0 60px rgba(212,168,83,0.3)",
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Apply for Private Access{" "}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer className="py-20 px-6 border-t border-white/[0.05] bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#D4A853,#8B6914)",
                  }}
                >
                  <span className="text-black font-black font-display">P</span>
                </div>
                <span className="font-display text-2xl font-black text-white tracking-tight">
                  PaisaDekho Luxe
                </span>
              </div>
              <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] leading-loose max-w-sm">
                A Private Wealth Network for the Top 1%.
                <br />
                Managed by PD Finserve Pvt Ltd.
                <br />
                Bengaluru · Dubai · London
              </p>
            </div>
            <div>
              <h5 className="text-white/50 font-bold text-[9px] uppercase tracking-[0.35em] mb-6">
                Asset Classes
              </h5>
              {[
                "Mutual Funds Alpha",
                "Corporate Bonds",
                "Indian Equities",
                "Real Estate REITs",
              ].map((l) => (
                <Link
                  key={l}
                  href="#"
                  className="block text-white/25 hover:text-[#D4A853] text-[10px] font-bold uppercase tracking-[0.2em] mb-3.5 transition-colors"
                >
                  {l}
                </Link>
              ))}
            </div>
            <div>
              <h5 className="text-white/50 font-bold text-[9px] uppercase tracking-[0.35em] mb-6">
                Legal
              </h5>
              {[
                "Privacy Vault",
                "DPDP Rights",
                "Terms of Service",
                "Risk Disclosures",
              ].map((l) => (
                <Link
                  key={l}
                  href="#"
                  className="block text-white/25 hover:text-[#D4A853] text-[10px] font-bold uppercase tracking-[0.2em] mb-3.5 transition-colors"
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <div className="pt-10 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-[9px] text-white/15 font-bold tracking-[0.4em] uppercase">
              © 2026 PAISADEKHO LUXE · BENGALURU · DUBAI · LONDON
            </span>
            <p className="text-[9px] text-white/15">
              Investments are subject to market risk. Please read all scheme
              documents carefully.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function UseCaseBig({ icon: Icon, title, desc, stat, statLabel, accent }: any) {
  return (
    <div className="group h-full p-8 sm:p-10 rounded-3xl bg-white/[0.025] border border-white/[0.07] hover:border-[rgba(212,168,83,0.2)] transition-all duration-300 cursor-default relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `${accent}08`, transform: "translate(30%,-30%)" }}
      />
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-8 border transition-colors"
        style={{ background: `${accent}12`, borderColor: `${accent}25` }}
        onMouseEnter={(e) => (e.currentTarget.style.background = `${accent}22`)}
        onMouseLeave={(e) => (e.currentTarget.style.background = `${accent}12`)}
      >
        <Icon className="w-6 h-6" style={{ color: accent }} />
      </div>
      <h4 className="font-display text-2xl font-bold text-white mb-4 leading-tight">
        {title}
      </h4>
      <p className="text-white/35 text-sm leading-relaxed mb-8">{desc}</p>
      <div className="flex items-end gap-2">
        <span
          className="font-display text-4xl font-black"
          style={{ color: accent }}
        >
          {stat}
        </span>
        <span className="text-[10px] text-white/25 uppercase tracking-widest font-bold mb-1">
          {statLabel}
        </span>
      </div>
    </div>
  );
}

function UseCaseSmall({ icon: Icon, title, desc }: any) {
  return (
    <div className="group p-7 rounded-2xl bg-white/[0.025] border border-white/[0.07] hover:border-[rgba(212,168,83,0.2)] transition-all duration-300 cursor-default">
      <div className="w-10 h-10 rounded-xl bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.15)] flex items-center justify-center mb-6 group-hover:bg-[rgba(212,168,83,0.15)] transition-colors">
        <Icon className="w-5 h-5 text-[#D4A853]" />
      </div>
      <h4 className="font-display text-lg font-bold text-white mb-3">
        {title}
      </h4>
      <p className="text-white/30 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function BentoCard({ icon: Icon, title, desc, tags, large }: any) {
  return (
    <div
      className={`group p-8 sm:p-10 rounded-3xl bg-[#0d0d0d] border border-white/[0.06] hover:border-[rgba(212,168,83,0.2)] transition-all duration-300 cursor-default relative overflow-hidden ${large ? "h-full" : ""}`}
    >
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "rgba(212,168,83,0.05)",
          transform: "translate(30%,-30%)",
        }}
      />
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-8 group-hover:bg-[rgba(212,168,83,0.1)] group-hover:border-[rgba(212,168,83,0.2)] transition-all">
        <Icon className="w-6 h-6 text-white/40 group-hover:text-[#D4A853] transition-colors" />
      </div>
      <h4 className="font-display text-2xl font-bold text-white mb-3">
        {title}
      </h4>
      <p className="text-white/35 text-sm leading-relaxed mb-7">{desc}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag: string) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[9px] font-bold uppercase tracking-widest text-white/25 group-hover:text-white/50 transition-colors"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function LabRow({
  label,
  val,
  active,
}: {
  label: string;
  val: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center p-4 rounded-xl border transition-colors ${active ? "bg-[rgba(212,168,83,0.06)] border-[rgba(212,168,83,0.2)]" : "bg-white/[0.03] border-white/[0.06]"}`}
    >
      <span
        className={`text-sm ${active ? "text-white font-semibold" : "text-white/40"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm font-bold ${active ? "text-[#D4A853]" : "text-white/25"}`}
      >
        {val}
      </span>
    </div>
  );
}
