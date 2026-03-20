"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CreditCard as CardIcon,
  TrendingUp,
  AlertTriangle,
  Upload,
  Wallet,
  BarChart3,
  Bell,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { creditCards } from "@/lib/credit-cards-data";
import { mutualFunds } from "@/lib/mutual-funds-data";
import { useUser } from "@/context/UserContext";

// ─── ANIMATION ───────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, delay } },
});

// ─── DATA ─────────────────────────────────────────────────────────────────────
// Devaluation alerts — real value from data, not a hardcoded number
const devaluationAlerts = creditCards.filter((c: any) =>
  c.notesTnc?.toLowerCase().includes("devaluation"),
);

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const { user } = useUser();

  const isNewUser = !(user as any)?.hasCompletedOnboarding;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* ── GREETING ──────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)}>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          Good {getTimeOfDay()},
        </p>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          {user?.name ? (
            <>
              {user.name} <span className="text-amber-400">👋</span>
            </>
          ) : (
            <span className="inline-block w-36 h-8 bg-white/10 rounded-lg animate-pulse align-middle" />
          )}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isNewUser
            ? "Let's set up your financial profile to get started."
            : "Here's your financial snapshot for today."}
        </p>
      </motion.div>

      {/* ── ONBOARDING BANNER — shown to new users ────────────────────── */}
      {isNewUser && (
        <motion.div {...fadeUp(0.05)}>
          <Link href="/dashboard/advisor">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-400/30 p-5 group cursor-pointer hover:border-amber-400/60 transition-all">
              {/* Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    Get your personalised card + investment plan
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Upload your bank statement. Our AI analyses your spending
                    and recommends the best credit cards and SIP allocations for
                    you — in under 30 seconds.
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Upload className="w-3 h-3" /> Upload statement
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Sparkles className="w-3 h-3" /> AI analysis
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Zap className="w-3 h-3" /> Instant results
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform mt-1" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── ALERTS — high value, always visible ─────────────────────── */}
      {devaluationAlerts.length > 0 && (
        <motion.div {...fadeUp(0.08)}>
          <Link href="/dashboard/alerts">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer">
              <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-orange-300">
                  {devaluationAlerts.length} card
                  {devaluationAlerts.length > 1 ? "s" : ""} with 2026 policy
                  changes
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {devaluationAlerts
                    .slice(0, 2)
                    .map((c: any) => c.name)
                    .join(", ")}
                  {devaluationAlerts.length > 2 &&
                    ` +${devaluationAlerts.length - 2} more`}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-400 shrink-0" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── QUICK ACTIONS — 2×2 grid ─────────────────────────────────── */}
      <motion.div {...fadeUp(0.1)}>
        <SectionLabel>What do you want to do?</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <ActionTile
            icon={Sparkles}
            title="Find best card"
            subtitle="For your spending"
            href="/dashboard/advisor"
            accent="amber"
          />
          <ActionTile
            icon={TrendingUp}
            title="Plan my SIP"
            subtitle="Investment advice"
            href="/dashboard/wealth-advisor"
            accent="emerald"
          />
          <ActionTile
            icon={BarChart3}
            title="Compare cards"
            subtitle="Side by side"
            href="/dashboard/compare"
            accent="blue"
          />
          <ActionTile
            icon={Wallet}
            title="Explore funds"
            subtitle="500+ direct funds"
            href="/dashboard/funds"
            accent="purple"
          />
        </div>
      </motion.div>

      {/* ── TOP CARDS (3, profile-ranked) ─────────────────────────────── */}
      <motion.div {...fadeUp(0.15)}>
        <SectionHeader
          title="Top Cards Right Now"
          subtitle="Ranked by 2026 value"
          href="/dashboard/explore"
        />
        <div className="space-y-3">
          {/* Sort by base reward rate × point value as a simple proxy for value */}
          {[...creditCards]
            .sort(
              (a: any, b: any) =>
                b.baseRewardRate * b.pointValue -
                a.baseRewardRate * a.pointValue,
            )
            .slice(0, 3)
            .map((card: any, i: number) => (
              <CardRow key={card.id ?? i} card={card} rank={i + 1} />
            ))}
        </div>
      </motion.div>

      {/* ── TOP FUNDS (3, by 3-year return) ──────────────────────────── */}
      <motion.div {...fadeUp(0.2)}>
        <SectionHeader
          title="Top Funds by 3Y Returns"
          subtitle="Direct, zero-commission"
          href="/dashboard/funds"
          accentColor="text-emerald-400"
        />
        <div className="space-y-3">
          {[...mutualFunds]
            .sort(
              (a: any, b: any) =>
                parseFloat(b.three_year_return || b.cagr_3y || "0") -
                parseFloat(a.three_year_return || a.cagr_3y || "0"),
            )
            .slice(0, 3)
            .map((fund: any, i: number) => (
              <FundRow key={fund.fund_name ?? i} fund={fund} rank={i + 1} />
            ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-bold mb-3">
      {children}
    </p>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
  accentColor = "text-amber-400",
}: {
  title: string;
  subtitle: string;
  href: string;
  accentColor?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className={`font-serif text-lg font-semibold ${accentColor}`}>
          {title}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <Link href={href}>
        <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          See all <ArrowRight className="w-3 h-3" />
        </button>
      </Link>
    </div>
  );
}

function ActionTile({
  icon: Icon,
  title,
  subtitle,
  href,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  href: string;
  accent: "amber" | "emerald" | "blue" | "purple";
}) {
  const accentMap = {
    amber: {
      bg: "bg-amber-500/10",
      icon: "text-amber-400",
      border: "hover:border-amber-400/30",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      icon: "text-emerald-400",
      border: "hover:border-emerald-400/30",
    },
    blue: {
      bg: "bg-blue-500/10",
      icon: "text-blue-400",
      border: "hover:border-blue-400/30",
    },
    purple: {
      bg: "bg-purple-500/10",
      icon: "text-purple-400",
      border: "hover:border-purple-400/30",
    },
  };
  const a = accentMap[accent];

  return (
    <Link href={href}>
      <div
        className={cn(
          "p-4 rounded-2xl bg-white/3 border border-white/8 cursor-pointer transition-all group",
          a.border,
        )}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
            a.bg,
          )}
        >
          <Icon
            className={cn("w-4.5 h-4.5", a.icon)}
            style={{ width: 18, height: 18 }}
          />
        </div>
        <p className="text-sm font-semibold text-foreground leading-tight">
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </Link>
  );
}

function CardRow({ card, rank }: { card: any; rank: number }) {
  const effectiveRate = (card.baseRewardRate * card.pointValue).toFixed(1);
  return (
    <Link href={`/dashboard/explore?card=${card.id}`}>
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/3 border border-white/8 hover:border-amber-400/20 transition-all cursor-pointer group">
        {/* Rank */}
        <span className="text-xs font-bold text-muted-foreground/40 w-4 shrink-0 text-center">
          {rank}
        </span>
        {/* Card chip colour swatch */}
        <div
          className={cn(
            "w-10 h-7 rounded-md shrink-0",
            card.imageGradient
              ? `bg-gradient-to-br ${card.imageGradient}`
              : "bg-gradient-to-br from-zinc-700 to-zinc-900",
          )}
        />
        {/* Name + bank */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {card.name}
          </p>
          <p className="text-xs text-muted-foreground">{card.bank}</p>
        </div>
        {/* Rate + fee */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-amber-400">{effectiveRate}%</p>
          <p className="text-[10px] text-muted-foreground">
            {card.annualFee === 0
              ? "Free"
              : `₹${card.annualFee.toLocaleString()}`}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-amber-400 transition-colors shrink-0" />
      </div>
    </Link>
  );
}

function FundRow({ fund, rank }: { fund: any; rank: number }) {
  const name = fund.fund_name ?? fund.name ?? "—";
  const cat = fund.category ?? fund.type ?? "Fund";
  const cagr = fund.three_year_return ?? fund.cagr_3y ?? "—";
  const minSip = fund.min_sip ?? fund.sip_min ?? "—";

  return (
    <Link href="/dashboard/funds">
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/3 border border-white/8 hover:border-emerald-400/20 transition-all cursor-pointer group">
        <span className="text-xs font-bold text-muted-foreground/40 w-4 shrink-0 text-center">
          {rank}
        </span>
        {/* Green circle icon */}
        <div className="w-10 h-7 rounded-md bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground">{cat}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-emerald-400">{cagr}%</p>
          <p className="text-[10px] text-muted-foreground">
            {typeof minSip === "number"
              ? `₹${minSip.toLocaleString()} SIP`
              : `₹${minSip} SIP`}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-emerald-400 transition-colors shrink-0" />
      </div>
    </Link>
  );
}
