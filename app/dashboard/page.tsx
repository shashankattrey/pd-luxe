"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
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
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { creditCards } from "@/lib/credit-cards-data";
import { useUser } from "@/context/UserContext";
import { useFundData } from "@/hooks/useFundData";

// ─── ANIMATION HELPER ────────────────────────────────────────────────────────
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

const getMinInvestment = (priceRange: any, lotSize: any): string => {
  try {
    // Extracts "98.00" from "93.00 to 98.00"
    const parts = priceRange.split("to");
    const upperPrice = parseFloat(
      parts[parts.length - 1].replace(/,/g, "").trim(),
    );

    // Extracts "1200" from "1,200 Shares"
    const units = parseInt(lotSize.replace(/[^0-9]/g, ""), 10);

    if (isNaN(upperPrice) || isNaN(units)) return "TBD";

    const total = upperPrice * units;

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(total);
  } catch (e) {
    return "TBD";
  }
};

// Handle manual drag end (remains the same)

export interface IPO {
  id: string;
  company: string;
  logo: string;
  type: string;
  sector: string;
  priceRange: string;
  issue: string;
  opens: string;
  closes: string;
  status: string;
  gmp: string;
  gmpPos: boolean;
  accent: string;
  gradient: string;
  closesMs: number;
  minInvest: string;
  lotSize: string | number; // Support both types from API
  allotment: string;
  listing: string;
  about: string;
  financials: {
    revenue: string;
    pat: string;
    roe: string;
    pe: string;
  };
  strengths: string[];
  risks: string[];
  listedAt?: string;
}
type IpoFilter = "all" | "ongoing" | "upcoming" | "listed";
const devaluationAlerts = creditCards.filter(
  (c: any) =>
    (c.notesTnc ?? "").toLowerCase().includes("critical") ||
    (c.notesTnc ?? "").toLowerCase().includes("devaluation"),
);

// ─── TICKER ───────────────────────────────────────────────────────────────────
function LiveTicker({
  items,
}: {
  items: { label: string; val: string; up: boolean }[];
}) {
  if (!items.length) return null;
  const tripled = [...items, ...items, ...items];
  return (
    <div className="fixed top-0 right-0 z-[250] overflow-hidden bg-black/60 backdrop-blur-xl border-b border-white/5 py-2.5 left-0 lg:left-64">
      <div className="flex whitespace-nowrap animate-ticker-scroll">
        {tripled.map((item, i) => (
          <div key={i} className="inline-flex items-center mx-10 space-x-2.5">
            <span className="text-[10px] font-bold text-white/40 tracking-[0.15em] uppercase">
              {item.label}
            </span>
            <span className="text-[10px] font-black text-white tabular-nums">
              {item.val}
            </span>
            <span
              className={cn(
                "text-[9px] font-bold",
                item.up ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {item.up ? "▲" : "▼"}
            </span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .animate-ticker-scroll {
          display: flex;
          width: max-content;
          animation: ticker-slide 30s linear infinite;
        }
        @keyframes ticker-slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

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
  const W = 60,
    H = 28;
  const mn = Math.min(...pts),
    mx = Math.max(...pts),
    rng = mx - mn || 1;
  const coords = pts.map((v, i) => ({
    x: (i / (pts.length - 1)) * W,
    y: H - ((v - mn) / rng) * (H - 4) - 2,
  }));
  const pathStr = coords
    .map((c, i) => (i === 0 ? "M" : "L") + `${c.x},${c.y}`)
    .join(" ");
  const area = pathStr + ` L${W},${H + 2} L0,${H + 2} Z`;
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
      <motion.path
        d={area}
        fill={`url(#${uid})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
      <motion.path
        d={pathStr}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
      />
    </svg>
  );
}

// ─── COUNTDOWN ───────────────────────────────────────────────────────────────
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

// ─── SWIPE CAROUSEL ───────────────────────────────────────────────────────────
// A proper snap-scroll carousel:
// • The active card is centered and full-width
// • Prev/next cards peek in from the sides at reduced opacity + scale
// • Swipe left/right OR tap arrow buttons to navigate
// • Dot indicators at the bottom
// • NO overflow from the parent — the carousel is fully self-contained

interface CarouselProps<T> {
  items: T[];
  renderCard: (item: T, isActive: boolean) => React.ReactNode;
  keyExtractor: (item: T) => string;
  accentColor?: (item: T) => string;
  autoPlay?: boolean; // New prop
  interval?: number; // New prop
}

function SwipeCarousel<T>({
  items,
  renderCard,
  keyExtractor,
  accentColor,
  autoPlay = true,
  interval = 5000,
}: CarouselProps<T>) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(0);
  const dragX = useMotionValue(0);

  const goTo = useCallback((idx: number, dir: number) => {
    setDirection(dir);
    setActive(idx);
  }, []);

  // This handles the automatic rotation
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const timer = setInterval(() => {
      const nextIndex = active === items.length - 1 ? 0 : active + 1;
      const dir = nextIndex === 0 ? -1 : 1;
      goTo(nextIndex, dir);
    }, interval);

    return () => clearInterval(timer);
  }, [active, items.length, autoPlay, interval, goTo]);

  const handleDragEnd = useCallback(
    (_: any, info: any) => {
      const threshold = 60;
      if (info.offset.x < -threshold && active < items.length - 1)
        goTo(active + 1, 1);
      else if (info.offset.x > threshold && active > 0) goTo(active - 1, -1);
      dragX.set(0);
    },
    [active, items.length, goTo, dragX],
  );
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.88,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 340, damping: 34 },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.88,
      transition: { duration: 0.2 },
    }),
  };

  if (!items.length) return null;
  const accent = accentColor ? accentColor(items[active]) : "#fbbf24";

  return (
    <div className="w-full select-none">
      {/* Card stage — overflow-hidden here clips ONLY the card visuals */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ minHeight: 280 }}
      >
        {/* Peek shadow left */}
        {active > 0 && (
          <div className="absolute left-0 inset-y-0 w-8 flex items-center justify-start z-20 pl-1">
            <div
              className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center cursor-pointer"
              onClick={() => goTo(active - 1, -1)}
            >
              <ChevronLeft className="w-3.5 h-3.5 text-white/60" />
            </div>
          </div>
        )}
        {/* Peek shadow right */}
        {active < items.length - 1 && (
          <div className="absolute right-0 inset-y-0 w-8 flex items-center justify-end z-20 pr-1">
            <div
              className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center cursor-pointer"
              onClick={() => goTo(active + 1, 1)}
            >
              <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            </div>
          </div>
        )}

        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={keyExtractor(items[active])}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            style={{ x: dragX, cursor: "grab" }}
            className="w-full active:cursor-grabbing"
          >
            {renderCard(items[active], true)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > active ? 1 : -1)}
              className="transition-all duration-200"
            >
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? 20 : 6,
                  height: 6,
                  background: i === active ? accent : "rgba(255,255,255,0.15)",
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      <p className="text-center text-[10px] text-white/25 mt-2 tabular-nums">
        {active + 1} / {items.length}
      </p>
    </div>
  );
}

// ─── IPO CARD (for carousel) ──────────────────────────────────────────────────
function IpoCard({
  ipo,
  onClick,
  isActive,
}: {
  ipo: IPO;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl cursor-pointer select-none"
    >
      {/* BG layers */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-55",
          ipo.gradient,
        )}
      />
      <div className="absolute inset-0 bg-black/58" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_90%_10%,rgba(255,255,255,0.06),transparent)]" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10">
        {/* Check for the exact string from your DB */}
        {ipo.status === "🔥 OPEN NOW" ? (
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
            {/* Handle "⏳ Upcoming" or any other status */}
            {ipo.status === "⏳ Upcoming" ? "SOON" : ipo.status.toUpperCase()}
          </span>
        )}
      </div>

      <div className="relative p-5">
        {/* Logo + name */}
        <div className="flex items-center gap-3 mb-5 pr-16">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
            style={{
              background: `${ipo.accent}22`,
              border: `1px solid ${ipo.accent}35`,
            }}
          >
            {ipo.logo}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white leading-tight line-clamp-2">
              {ipo.company}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-[9px] font-bold px-1.5 py-px rounded-full"
                style={{ background: `${ipo.accent}18`, color: ipo.accent }}
              >
                {ipo.type}
              </span>
              <span className="text-[9px] text-white/35">{ipo.sector}</span>
            </div>
          </div>
        </div>

        {/* 2-metric grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: "Price Band", value: ipo.priceRange },
            { label: "Issue Size", value: ipo.issue },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-black/35 p-2.5">
              <p className="text-[9px] text-white/30 uppercase tracking-widest">
                {m.label}
              </p>
              <p className="text-[12px] font-bold text-white mt-0.5 tabular-nums leading-tight">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Date strip */}
        <div className="flex items-center gap-1.5 mb-4 px-2.5 py-2 rounded-xl bg-black/25">
          <Calendar className="w-3 h-3 text-white/25 shrink-0" />
          <span className="text-[10px] text-white/45">{ipo.opens}</span>
          <span className="text-[10px] text-white/20">→</span>
          <span className="text-[10px] text-white/45">{ipo.closes}</span>
        </div>

        {/* GMP + right stat */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">
              GMP
            </p>
            <p
              className={cn(
                "text-base font-bold tabular-nums",
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
              <p className="text-base font-bold text-emerald-400 tabular-nums">
                {ipo.listedAt}
              </p>
            </div>
          ) : ipo.status === "🔥 OPEN NOW" ? ( // FIXED THIS LINE
            <div className="text-right">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">
                Closes in
              </p>
              <p className="text-base font-bold text-white tracking-tight">
                <Countdown targetMs={ipo.closesMs} />
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-[10px] text-white/30 uppercase tracking-wider">
                Min. Invest
              </p>
              <p className="text-sm font-bold text-white">
                {/* Use the helper here */}
                {getMinInvestment(ipo.priceRange, ipo.lotSize)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CREDIT CARD CAROUSEL CARD ───────────────────────────────────────────────
function CreditCardCarouselItem({ card, rank }: { card: any; rank: number }) {
  const rate = (card.baseRewardRate * card.pointValue).toFixed(1);
  const isFree = card.annualFee === 0 || card.isLtf;

  return (
    <Link
      href={`/dashboard/explore?card=${card.id}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.025] border border-white/[0.09] p-5 cursor-pointer">
        {/* Rank ghost */}
        <span className="absolute top-4 right-4 text-[11px] font-black text-white/8 tabular-nums">
          #{rank}
        </span>

        {/* Card physical visual */}
        <div
          className={cn(
            "w-full rounded-2xl bg-gradient-to-br relative overflow-hidden mb-5 shadow-2xl",
            card.imageGradient || "from-zinc-700 to-zinc-900",
          )}
          style={{ height: 130 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/12 to-transparent" />
          {/* Shimmer strip */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -skew-x-12" />
          {/* EMV chip */}
          <div className="absolute top-4 left-4 w-9 h-7 rounded-lg bg-gradient-to-br from-amber-300/40 to-amber-500/25 border border-white/20">
            <div className="absolute inset-1 grid grid-cols-2 gap-px opacity-40">
              <div className="rounded-sm bg-white/30" />
              <div className="rounded-sm bg-white/30" />
              <div className="rounded-sm bg-white/30" />
              <div className="rounded-sm bg-white/30" />
            </div>
          </div>
          {/* Contactless */}
          <div className="absolute top-5 right-4 opacity-25">
            <div className="w-4 h-4 rounded-full border border-white" />
            <div className="w-6 h-6 rounded-full border border-white absolute -top-1 -left-1" />
            <div className="w-8 h-8 rounded-full border border-white absolute -top-2 -left-2" />
          </div>
          {/* Network */}
          <div className="absolute bottom-3 right-4">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              {card.network}
            </span>
          </div>
          {/* Bank */}
          <div className="absolute bottom-3 left-4">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
              {card.bank}
            </p>
          </div>
          {/* Horizontal line detail */}
          <div className="absolute bottom-10 left-0 right-0 h-px bg-white/5" />
        </div>

        {/* Card name */}
        <p className="text-[15px] font-bold text-white leading-snug mb-3 line-clamp-2">
          {card.name}
        </p>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {isFree && (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                FREE
              </span>
            )}
            {card.devaluation2026 && (
              <span className="text-[9px] text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-400/15">
                ⚠ 2026
              </span>
            )}
            {!isFree && !card.devaluation2026 && (
              <span className="text-[11px] text-white/30 tabular-nums">
                ₹{card.annualFee.toLocaleString()}/yr
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-amber-400 tabular-nums leading-none">
              {rate}%
            </p>
            <p className="text-[9px] text-white/25 mt-0.5">reward rate</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/[0.06]">
          {[
            {
              label: "Dining",
              val: card.diningRate > 0 ? `${card.diningRate}%` : "—",
            },
            {
              label: "Online",
              val:
                Math.max(card.amazonRate || 0, card.flipkartRate || 0) > 0
                  ? `${Math.max(card.amazonRate || 0, card.flipkartRate || 0)}%`
                  : "—",
            },
            {
              label: "Lounge",
              val:
                card.domesticLounge === "Unlimited"
                  ? "∞"
                  : (parseInt(card.domesticLounge) || 0) > 0
                    ? String(parseInt(card.domesticLounge))
                    : "—",
            },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[11px] font-bold text-white/60 tabular-nums">
                {s.val}
              </p>
              <p className="text-[8px] text-white/25 uppercase tracking-widest mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 shrink-0">
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

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
export default function DashboardHome() {
  const { user } = useUser();
  const isNewUser = !(user as any)?.hasCompletedOnboarding;
  const time = getTimeOfDay();
  const [selectedIpo, setSelectedIpo] = useState<IPO | null>(null);
  const {
    ipos: rawIpos,
    iposLoading,
    rates,
    ratesLoading,
    loading: fundsLoading,
  } = useFundData();
  const ipos = rawIpos as unknown as IPO[];
  const [ipoFilter, setIpoFilter] = useState<IpoFilter>("all");

  // const activeIpos = useMemo(
  //   () => ipos.filter((ipo) => ipo.status === "ongoing"),
  //   [ipos],
  // );

  // const upcomingIpos = useMemo(
  //   () => ipos.filter((ipo) => ipo.status === "upcoming"),
  //   [ipos],
  // );

  const filteredIpos = useMemo(() => {
    if (ipoFilter === "all") return ipos;

    // Use the EXACT strings from your console log
    const statusMap: Record<string, string> = {
      ongoing: "🔥 open now",
      upcoming: "⏳ upcoming",
      listed: "listed",
    };

    const filtered = ipos.filter((ipo) => ipo.status === statusMap[ipoFilter]);
    return filtered;
  }, [ipos, ipoFilter]);

  const topCards = useMemo(
    () =>
      [...creditCards]
        .sort(
          (a: any, b: any) =>
            b.baseRewardRate * b.pointValue - a.baseRewardRate * a.pointValue,
        )
        .slice(0, 6),
    [],
  );

  const tickerItems = useMemo(() => {
    if (!rates) return [];
    return [
      {
        label: "Nifty 50",
        val: rates.equity.nifty50.value.toLocaleString("en-IN"),
        up: rates.equity.nifty50.changePct >= 0,
      },
      {
        label: "Sensex",
        val: rates.equity.sensex.value.toLocaleString("en-IN"),
        up: rates.equity.sensex.changePct >= 0,
      },
      {
        label: "Gold 24K",
        val: `₹${rates.gold.price24k.toLocaleString("en-IN")}`,
        up: true,
      },
      { label: "USD/INR", val: rates.macro.usdInr.toFixed(2), up: false },
      { label: "PPF", val: `${rates.govtSchemes.ppf.rate}%`, up: true },
      { label: "SGB", val: `${rates.govtSchemes.rbiBonds.rate}%`, up: true },
      { label: "Inflation", val: `${rates.macro.inflation}%`, up: false },
    ];
  }, [rates]);

  const marketItems = useMemo(() => {
    if (!rates) return [];
    return [
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
        sub: "SGB Yield/10g",
      },
      {
        label: "USD / INR",
        value: `₹${rates.macro.usdInr.toFixed(2)}`,
        change: `${rates.macro.inflation}%`,
        pos: rates.macro.inflation < 6,
        sub: "Macro Inflation",
      },
    ];
  }, [rates]);

  if (selectedIpo)
    return <IpoDetail ipo={selectedIpo} onBack={() => setSelectedIpo(null)} />;

  return (
    <div className="min-h-screen">
      <LiveTicker items={tickerItems} />
      <div className="w-full mt-10 max-w-2xl mx-auto px-4 sm:px-0 space-y-8 pb-12">
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
                  // Change "ongoing" to "🔥 OPEN NOW"
                  val: ipos.filter((i) => i.status?.trim() === "🔥 open now")
                    .length,
                  color: "#34d399",
                },
                {
                  label: "Upcoming IPOs",
                  // Change "upcoming" to "⏳ Upcoming"
                  val: ipos.filter((i) => i.status?.trim() === "⏳ upcoming")
                    .length,
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

        {/* ══ ONBOARDING ════════════════════════════════════════════════ */}
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

        {/* ══ ALERTS ════════════════════════════════════════════════════ */}
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

        {/* ══ QUICK ACTIONS ═════════════════════════════════════════════ */}
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

        {/* ══ IPO TRACKER — SWIPE CAROUSEL ══════════════════════════════ */}
        <motion.div {...stagger(4)}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <h2 className="text-base font-bold text-white">IPO Tracker</h2>

              {/* ✅ FIXED: Changed "ongoing" to "🔥 OPEN NOW" to match your DB */}
              {ipos.filter((i) => i.status === "🔥 OPEN NOW").length > 0 && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-400/15 text-orange-400 border border-orange-400/20">
                  {ipos.filter((i) => i.status === "🔥 OPEN NOW").length} LIVE
                </span>
              )}
            </div>

            {/* <button className="text-xs text-amber-400/70 hover:text-amber-400 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </button> */}
          </div>

          {/* Filter pills — Logic looks good here as you already updated to emoji strings */}
          <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none pb-0.5">
            {(["all", "ongoing", "upcoming", "listed"] as IpoFilter[]).map(
              (f) => {
                const count =
                  f === "all"
                    ? ipos.length
                    : f === "ongoing"
                      ? ipos.filter((i) => i.status === "🔥 open now").length
                      : f === "upcoming"
                        ? ipos.filter((i) => i.status === "⏳ upcoming").length
                        : ipos.filter((i) => i.status === "listed").length;

                return (
                  <button
                    key={f}
                    onClick={() => setIpoFilter(f)}
                    className={cn(
                      "shrink-0 h-7 px-3.5 rounded-full text-[11px] font-semibold border transition-all capitalize",
                      ipoFilter === f
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-transparent border-white/[0.07] text-white/30 hover:text-white/60",
                    )}
                  >
                    {f === "all"
                      ? `All (${count})`
                      : f === "ongoing"
                        ? `Live (${count})`
                        : f === "upcoming"
                          ? `Coming (${count})`
                          : `Listed (${count})`}
                  </button>
                );
              },
            )}
          </div>

          {/* Swipe Carousel */}
          {ipos.length > 0 ? (
            <SwipeCarousel
              items={filteredIpos}
              interval={4000}
              keyExtractor={(ipo) => ipo?.id || Math.random().toString()}
              accentColor={(ipo) => ipo?.accent || "#38bdf8"}
              renderCard={(ipo, isActive) => {
                // Corrected Syntax: Use curly braces and an explicit return
                if (!ipo) return null;
                return (
                  <IpoCard
                    ipo={ipo}
                    isActive={isActive}
                    onClick={() => setSelectedIpo(ipo)}
                  />
                );
              }}
            />
          ) : (
            !iposLoading && (
              <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-xs text-white/20 italic">
                  No IPOs in this category
                </p>
              </div>
            )
          )}
          <p className="text-[10px] text-white/20 mt-3 text-right">
            GMP = Grey Market Premium · indicative only
          </p>
        </motion.div>

        {/* ══ TOP CARDS — SWIPE CAROUSEL ════════════════════════════════ */}
        <motion.div {...stagger(5)}>
          <SectionHeader
            title="Top Cards"
            subtitle="2026 effective reward rate · swipe to explore"
            href="/dashboard/explore"
            accent="#fbbf24"
          />
          <SwipeCarousel
            items={topCards}
            interval={6000} // Rotates every 6 seconds
            keyExtractor={(card: any) => String(card.id)}
            accentColor={() => "#fbbf24"}
            renderCard={(card: any, _) => (
              <CreditCardCarouselItem
                card={card}
                rank={topCards.indexOf(card) + 1}
              />
            )}
          />
        </motion.div>

        {/* ══ MARKET SNAPSHOT ═══════════════════════════════════════════ */}
        <motion.div {...stagger(6)}>
          <Divider label="Market Snapshot" />
          {ratesLoading || !rates ? (
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
          ) : (
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
                  <p className="text-[17px] font-bold text-white tabular-nums tracking-tight">
                    {m.value}
                  </p>
                  <p className="text-[10px] text-white/20 mt-0.5">{m.sub}</p>
                  <div className="mt-3.5 opacity-40 group-hover:opacity-80 transition-opacity duration-500">
                    <MiniSparkline
                      positive={m.pos}
                      color={m.pos ? "#34d399" : "#f87171"}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-white/18 mt-2 text-right">
            Indicative · 15-min delayed
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ─── IPO DETAIL PAGE ──────────────────────────────────────────────────────────
function IpoDetail({ ipo, onBack }: { ipo: IPO; onBack: () => void }) {
  const isListed = ipo.status === "listed";
  const isOngoing = ipo.status === "🔥 OPEN NOW";
  const isUpcoming = ipo.status === "⏳ Upcoming";
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-0 pb-16"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors pt-4 pb-6"
      >
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to dashboard
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl mb-6">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-60",
            ipo.gradient,
          )}
        />
        <div className="absolute inset-0 bg-black/55" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle,rgba(255,255,255,0.9) 1px,transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 17.3v17.4L30 52 0 34.7V17.3z' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 52px",
          }}
        />
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30"
          style={{ background: ipo.accent }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-5">
            {isOngoing ? (
              <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-400/20 text-orange-300 border border-orange-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
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

      {/* GMP + Status */}
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

      {/* Timeline */}
      <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.07] mb-5">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
          IPO Timeline
        </p>
        {[
          { label: "Open Date", date: ipo.opens, done: !isUpcoming },
          { label: "Close Date", date: ipo.closes, done: isListed },
          { label: "Allotment", date: ipo.allotment, done: isListed },
          { label: "Listing Date", date: ipo.listing, done: isListed },
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
              <p className="text-xs text-white/30 tabular-nums">{step.date}</p>
            </div>
          </div>
        ))}
      </div>

      {/* About */}
      <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.07] mb-5">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
          About the Company
        </p>
        <p className="text-sm text-white/65 leading-relaxed">{ipo.about}</p>
      </div>

      {/* Financials */}
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

      {/* Strengths & Risks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/[0.15]">
          <p className="text-xs font-bold text-emerald-400/70 uppercase tracking-widest mb-3">
            Strengths
          </p>
          {ipo.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 mb-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <p className="text-sm text-white/65 leading-snug">{s}</p>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-2xl bg-red-500/[0.05] border border-red-500/[0.15]">
          <p className="text-xs font-bold text-red-400/70 uppercase tracking-widest mb-3">
            Risks
          </p>
          {ipo.risks.map((r, i) => (
            <div key={i} className="flex items-start gap-2.5 mb-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
              <p className="text-sm text-white/65 leading-snug">{r}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Apply CTA */}
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
