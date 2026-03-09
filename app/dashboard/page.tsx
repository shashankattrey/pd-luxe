"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  CreditCard as CardIcon,
  TrendingUp,
  Plane,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Wallet,
  Gift,
  PieChart,
  Activity,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Data Imports
import { creditCards } from "@/lib/credit-cards-data";
import { mutualFunds } from "@/lib/mutual-funds-data"; // Using the dummy data created earlier

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function DashboardHome() {
  // Card Logic
  const totalCards = creditCards.length;
  const devaluationCards = creditCards.filter((c: any) =>
    c.notes_tnc?.toLowerCase().includes("devaluation"),
  ).length;

  // Wealth Logic
  const totalSip = mutualFunds.reduce((sum, f) => sum + (f.sip_amount || 0), 0);
  const avgReturn = "18.4"; // Example aggregate metric

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-10 pb-10"
    >
      {/* 1. WELCOME SECTION */}
      <motion.div variants={fadeInUp}>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
          Welcome back, <span className="text-gold">Elite Member</span>
        </h1>
        <p className="text-muted-foreground">
          Your unified wealth and credit intelligence for 2026
        </p>
      </motion.div>

      {/* 2. UNIFIED STATS GRID */}
      {/* <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          icon={CardIcon}
          label="Cards in Vault"
          value={totalCards}
          subtext="Premium Portfolio"
          color="gold"
        />
        <StatCard
          icon={RefreshCcw}
          label="Monthly SIP"
          value={`₹${totalSip.toLocaleString()}`}
          subtext="Wealth Engine"
          color="gold"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. Returns"
          value={`${avgReturn}%`}
          subtext="Portfolio CAGR"
          color="gold"
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical Alerts"
          value={devaluationCards}
          subtext="Policy Updates"
          color="orange"
        />
      </motion.div> */}

      {/* 3. CARD QUICK ACTIONS (Original) */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.2em] text-gold/60 font-bold ml-1">
          Card Services
        </h3>
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <QuickActionCard
            title="Find Your Perfect Card"
            description="Ask Luxe Butler to find the best card for your spending profile."
            icon={Sparkles}
            href="/dashboard/advisor"
            cta="Start Analysis"
          />
          <QuickActionCard
            title="Explore Card Vault"
            description="Browse all 93 premium credit cards with detailed rewards."
            icon={Wallet}
            href="/dashboard/card-vault"
            cta="View Cards"
          />
          <QuickActionCard
            title="Compare Cards"
            description="Side-by-side comparison of forex rates and reward units."
            icon={Gift}
            href="/dashboard/compare"
            cta="Compare Now"
          />
        </motion.div>
      </div>

      {/* 4. WEALTH QUICK ACTIONS (New) */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.2em] text-emerald-500/60 font-bold ml-1">
          Wealth Services
        </h3>
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <QuickActionCard
            title="Luxe Wealth Plan"
            description="Generate a custom SIP roadmap based on your financial goals."
            icon={Activity}
            href="/dashboard/wealth-advisor"
            cta="Plan Wealth"
            theme="emerald"
          />
          <QuickActionCard
            title="Fund Explorer"
            description="Analyze 500+ Top rated Direct Mutual Funds with zero commission."
            icon={PieChart}
            href="/dashboard/funds-vault"
            cta="Explore Funds"
            theme="emerald"
          />
          <QuickActionCard
            title="Risk Profiler"
            description="Understand your risk appetite for Small-cap vs Large-cap allocation."
            icon={ShieldCheck}
            href="/dashboard/risk-profiler"
            cta="Test Profile"
            theme="emerald"
          />
        </motion.div>
      </div>

      {/* 5. FEATURED CARDS */}
      <motion.div variants={fadeInUp}>
        <SectionHeader title="Featured Cards" href="/dashboard/card-vault" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creditCards.slice(0, 3).map((card: any, index: number) => (
            <FeaturedCardTile key={index} card={card} index={index} />
          ))}
        </div>
      </motion.div>

      {/* 6. FEATURED FUNDS */}
      <motion.div variants={fadeInUp}>
        <SectionHeader
          title="Top Performing Funds"
          href="/dashboard/funds"
          color="text-emerald-500"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mutualFunds.slice(0, 3).map((fund: any, index: number) => (
            <FeaturedFundTile key={index} fund={fund} index={index} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- SUB-COMPONENTS ---

function SectionHeader({ title, href, color = "text-gold" }: any) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className={`font-serif text-2xl font-semibold ${color}`}>{title}</h2>
      <Link href={href}>
        <Button variant="ghost" className={`${color} hover:bg-white/5`}>
          View All <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, color }: any) {
  const colorClasses = {
    gold: "bg-gold/20 text-gold",
    orange: "bg-[#FF8C00]/20 text-[#FF8C00]",
  };
  return (
    <div className="glass-gold rounded-2xl p-6 hover-shine border border-gold/10">
      <div
        className={`w-10 h-10 rounded-xl ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}
      >
        <img src="/favicon.ico" alt="Logo" className="w-10 h-10 rounded-lg" />
      </div>
      <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">
        {label}
      </p>
      <p className="font-serif text-3xl font-bold text-foreground mb-1">
        {value}
      </p>
      <p className="text-muted-foreground text-[10px]">{subtext}</p>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  cta,
  theme = "gold",
}: any) {
  const isEmerald = theme === "emerald";
  return (
    <Link href={href}>
      <div
        className={`glass-gold rounded-2xl p-6 hover-shine h-full group cursor-pointer transition-all border border-gold/10 ${isEmerald ? "hover:border-emerald-500/40" : "hover:border-gold/40"}`}
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${isEmerald ? "bg-emerald-500/20 text-emerald-500" : "bg-gold/20 text-gold"}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
          {description}
        </p>
        <span
          className={`inline-flex items-center text-sm font-medium ${isEmerald ? "text-emerald-500" : "text-gold"}`}
        >
          {cta}{" "}
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

function FeaturedCardTile({ card, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-gold rounded-2xl overflow-hidden hover-shine border border-gold/10"
    >
      <div className="h-32 bg-gradient-to-br from-neutral-900 to-neutral-800 p-4 relative">
        <p className="text-gold text-[10px] uppercase tracking-widest">
          {card.issuer}
        </p>
        <p className="text-white font-serif font-bold text-sm">
          {card.card_name}
        </p>
        <CardIcon className="absolute bottom-4 right-4 w-6 h-6 text-white/10" />
      </div>
      <div className="p-4 bg-black/20 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">Reward</p>
          <p className="font-mono font-bold">{card.base_reward_rate}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">Fee</p>
          <p className="font-mono font-bold">₹{card.annual_fee}</p>
        </div>
      </div>
    </motion.div>
  );
}

function FeaturedFundTile({ fund, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-gold rounded-2xl overflow-hidden hover-shine border border-gold/10"
    >
      <div className="h-32 bg-gradient-to-br from-emerald-950 to-neutral-900 p-4 relative">
        <p className="text-emerald-400 text-[10px] uppercase tracking-widest">
          {fund.category}
        </p>
        <p className="text-white font-serif font-bold text-sm">
          {fund.fund_name}
        </p>
        <TrendingUp className="absolute bottom-4 right-4 w-6 h-6 text-white/10" />
      </div>
      <div className="p-4 bg-black/20 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">3Y CAGR</p>
          <p className="text-emerald-400 font-mono font-bold">
            {fund.three_year_return}%
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">Min SIP</p>
          <p className="font-mono font-bold">₹{fund.min_sip}</p>
        </div>
      </div>
    </motion.div>
  );
}
