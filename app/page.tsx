"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CreditCard,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Wallet,
  Bot,
  Plane,
  LineChart,
  Globe,
  SquareChartGantt,
  Fingerprint,
  Lock,
  Database,
  SearchCheck,
  Zap,
  PieChart,
  ShieldAlert,
  ChevronRight,
  Cpu,
  CheckCircle2,
  Calculator,
  Landmark,
  Target,
  Coins,
  HeartPulse,
  ShoppingBag,
  Briefcase,
  Users,
  ReceiptIndianRupee,
  Languages,
  BarChart3,
  Landmark as Bank,
  History,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("travel");

  return (
    <div className="min-h-screen bg-[#020202] text-slate-200 selection:bg-gold/30 selection:text-white overflow-x-hidden font-sans">
      {/* 1. NAVIGATION (Master Version) */}
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl  flex items-center justify-center shadow-lg">
              <img
                src="/favicon.ico"
                alt="Logo"
                className="w-10 h-10 rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold text-white leading-none tracking-tight">
                PaisaDekho
              </span>
              <span className="text-[10px] text-gold font-bold uppercase tracking-[0.3em] mt-1">
                Luxe Intelligence
              </span>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-8">
            <NavLink href="#how-it-works">The Loop</NavLink>
            <NavLink href="#use-cases">Use Cases</NavLink>
            <NavLink href="#butler-lab">Butler Lab</NavLink>
            <NavLink href="#wealth">Wealth Meta</NavLink>
            <NavLink href="#security">Privacy</NavLink>
          </div>
          <Link href="/auth?mode=signup">
            <Button className="bg-gold text-black font-extrabold hover:scale-105 transition-all rounded-full px-8 shadow-lg shadow-gold/20 h-12">
              Apply for Access
            </Button>
          </Link>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-52 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-8 inline-flex items-center gap-2 px-5 py-2 rounded-full border border-gold/20 bg-gold/5 text-gold text-[10px] font-bold uppercase tracking-[0.2em]">
              <Sparkles className="w-4 h-4" /> 2026 Sovereign Wealth
              Intelligence
            </div>
            <h1 className="font-serif text-7xl md:text-9xl font-extrabold text-white mb-8 tracking-tighter leading-[0.9]">
              Your Money, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-amber-200 to-amber-500 italic">
                Self-Driving.
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-400 max-w-4xl mx-auto mb-12 font-light leading-relaxed">
              The only AI layer that bridges the gap between your{" "}
              <span className="text-white font-medium">Credit Card swipe</span>{" "}
              and your{" "}
              <span className="text-white font-medium">Retirement Corpus</span>.
              PaisaDekho Luxe orchestrates every rupee across 200+ Indian assets
              with institutional precision.
            </p>
          </motion.div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent -z-10 opacity-50" />
      </section>

      {/* 3. HOW IT WORKS (THE INTELLIGENCE LOOP) */}
      <section
        id="how-it-works"
        className="py-24 px-6 bg-white/[0.01] border-y border-white/5"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-white mb-4 italic">
              The <span className="text-gold">Intelligence</span> Loop
            </h2>
            <p className="text-slate-500">
              How we turn your daily spend into long-term generational wealth.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StepCard
              num="01"
              icon={SearchCheck}
              title="Local Data Scan"
              desc="Scans your cashflow and card devaluations on-device. No data ever leaves your phone."
            />
            <StepCard
              num="02"
              icon={Cpu}
              title="Alpha Analysis"
              desc="Butler runs 50,000+ simulations to find the highest-yield path for every rupee."
            />
            <StepCard
              num="03"
              icon={Target}
              title="Goal Mapping"
              desc="Your SIPs and Reward Points are unified into a single goal-based trajectory."
            />
            <StepCard
              num="04"
              icon={Zap}
              title="Auto-Execution"
              desc="One-tap trades, rebalancing, and fee waivers via secure institutional bridges."
            />
          </div>
        </div>
      </section>

      {/* 4. THE LUXE USE CASE DIRECTORY */}
      <section id="use-cases" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center md:text-left">
            <h2 className="font-serif text-5xl font-bold text-white mb-6">
              Built for <span className="text-gold">Life's Complexity</span>
            </h2>
            <p className="text-slate-500 text-xl max-w-3xl">
              From Jaipur to Dubai, from today's coffee to your daughter's
              wedding—the Butler manages it all.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <UseCaseCard
              icon={ShoppingBag}
              title="The 'Point-of-Sale' Check"
              desc="Standing at a Taj Hotel or a local mall? Butler detects the merchant and tells you which card triggers the 10X reward multiplier."
            />
            <UseCaseCard
              icon={Briefcase}
              title="Tax-Loss Harvesting"
              desc="Every March, the AI sells loss-making units and instantly re-buys them, saving you up to ₹1 Lakh in Capital Gains tax automatically."
            />
            <UseCaseCard
              icon={HeartPulse}
              title="Emergency Fund Lockbox"
              desc="Detects medical spends and instantly prepares a 'Liquidity Plan'—telling you which fund to exit first to minimize exit loads."
            />
            <UseCaseCard
              icon={ReceiptIndianRupee}
              title="The Rental Yield Loop"
              desc="Pay rent via the Butler to maximize miles, then auto-invest the 3.3% reward value into high-yield 11% corporate bonds."
            />
            <UseCaseCard
              icon={Users}
              title="Family Office Mode"
              desc="Aggregate the spending of your whole family to hit 'Super Milestone' targets like the ₹12L fee waiver on HDFC Infinia."
            />
            <UseCaseCard
              icon={Languages}
              title="Forex Hedging"
              desc="Traveling to Dubai? Butler compares card Forex markups vs. zero-markup cards based on real-time exchange rate volatility."
            />
            <UseCaseCard
              icon={Scale}
              title="Stress Test Simulation"
              desc="Butler simulates a 2008-style crash on your portfolio to ensure your ₹10L goal remains on track via hedging."
            />
            <UseCaseCard
              icon={History}
              title="Dividend Tracker"
              desc="Never let a dividend go idle. Butler detects incoming corporate dividends and sweeps them into your high-momentum SIPs."
            />
            <UseCaseCard
              icon={ShieldAlert}
              title="Fee Audit"
              desc="AI scans for hidden 'Dynamic Currency Conversion' (DCC) fees and alerts you to claim refunds for merchant-forced markups."
            />
          </div>
        </div>
      </section>

      {/* 5. BUTLER INTELLIGENCE LAB (Interactive Simulation) */}
      <section id="butler-lab" className="py-24 px-6 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-white mb-4 italic">
              The Butler <span className="text-gold">Lab</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <TabBtn
                label="Jaipur to Dubai Flight"
                active={activeTab === "travel"}
                onClick={() => setActiveTab("travel")}
              />
              <TabBtn
                label="₹10L Wealth Goal"
                active={activeTab === "wealth"}
                onClick={() => setActiveTab("wealth")}
              />
              <TabBtn
                label="Luxury Purchase Logic"
                active={activeTab === "luxury"}
                onClick={() => setActiveTab("luxury")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/10 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
            {/* Left side: Client Side */}
            <div className="p-12 bg-zinc-900/40 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-12">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-white/10 italic">
                  CLIENT
                </div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Query Input
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="bg-zinc-800/80 p-10 rounded-[2rem] rounded-tl-none border border-white/5 shadow-2xl relative">
                    <p className="text-white text-2xl font-serif italic leading-relaxed">
                      {activeTab === "travel" &&
                        '"Butler, I am booking a Jaipur to Dubai flight for ₹45,000. Which card should I use?"'}
                      {activeTab === "wealth" &&
                        '"Butler, I want to SIP ₹10,000 monthly. I need ₹10 Lakhs in 5 years. Give me the alpha path."'}
                      {activeTab === "luxury" &&
                        '"Butler, buying a ₹2 Lakh Rolex. Is No-Cost EMI better than paying in full?"'}
                    </p>
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gold/10 rounded-full blur-xl" />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right side: AI Execution */}
            <div className="p-12 bg-black relative">
              <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center shadow-lg shadow-gold/20">
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <span className="text-gold text-xs font-extrabold uppercase tracking-[0.2em]">
                  Butler Intelligence Analysis
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab + "-ans"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  {activeTab === "travel" && (
                    <>
                      <div className="flex justify-between items-end border-b border-white/10 pb-6">
                        <h4 className="text-2xl font-bold text-white font-serif">
                          Axis Atlas
                        </h4>
                        <div className="text-right">
                          <span className="text-green-400 text-3xl font-bold">
                            ₹7,800
                          </span>
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">
                            Reward Value
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <ComparisonRow
                          label="Axis Atlas (Miles Transfer)"
                          value="17.3% Yield"
                          active
                        />
                        <ComparisonRow
                          label="HDFC Infinia (Direct)"
                          value="13.2% Yield"
                        />
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/10 italic">
                        "Analysis: Since you are ₹12k away from the Gold
                        Milestone, this spend triggers a 2,500 bonus mile
                        credit. Total yield beats direct cashback by 34%."
                      </p>
                    </>
                  )}
                  {activeTab === "wealth" && (
                    <>
                      <div className="flex justify-between items-end border-b border-white/10 pb-6">
                        <h4 className="text-2xl font-bold text-white font-serif">
                          Projected: ₹10.42L
                        </h4>
                        <div className="text-right">
                          <span className="text-gold text-3xl font-bold">
                            14.2%
                          </span>
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">
                            Required XIRR
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <AllocationRow
                          label="Mid-Cap Momentum (AI-Sourced)"
                          pct="55%"
                        />
                        <AllocationRow label="Digital Gold (Hedge)" pct="25%" />
                        <AllocationRow
                          label="Indian Tech Portfolio"
                          pct="20%"
                        />
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed bg-gold/5 p-5 rounded-2xl border border-gold/10">
                        "Butler Strategy: Your base SIP covers ₹7.8L. Butler
                        will bridge the ₹2.2L gap by harvesting card cashback
                        and auto-sweeping bank dividends."
                      </p>
                    </>
                  )}
                  {activeTab === "luxury" && (
                    <>
                      <div className="flex justify-between items-end border-b border-white/10 pb-6">
                        <h4 className="text-2xl font-bold text-white font-serif">
                          Pay In Full
                        </h4>
                        <div className="text-right">
                          <span className="text-red-400 text-3xl font-bold">
                            ₹1,450
                          </span>
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">
                            Saved in Fees
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/10">
                        "Warning: No-Cost EMI has a hidden 18% GST charge on the
                        interest component that the bank never waives. Paying in
                        full nets you 6,600 Reward Points (Value: ₹6,600) vs a
                        net loss of ₹1,450 on EMI."
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CARD META & WEALTH BENTO (Combined Master Grid) */}
      <section id="wealth" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <h2 className="font-serif text-5xl font-bold text-white">
              Market <span className="text-gold">Dominance</span>.
            </h2>
            <div className="flex gap-4">
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400">
                SEBI REGISTERED ADVICE
              </div>
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400">
                DPDP COMPLIANT
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <InvestmentCard
              span="md:col-span-8"
              icon={LineChart}
              title="Mutual Fund Alpha"
              desc="Butler scans 2,500+ funds to find the top 1% that beat the index. Automated Tax-Loss harvesting included."
              tags={["Direct Plans", "Momentum", "Exit Load Alert"]}
            />
            <InvestmentCard
              span="md:col-span-4"
              icon={Globe}
              title="Indian Blue Chips"
              desc="Fractional access to Top Performing Funds"
              tags={["NSE", "LRS Bridge"]}
            />
            <InvestmentCard
              span="md:col-span-4"
              icon={SquareChartGantt}
              title="Yield Bonds"
              desc="Institutional access to AAA-rated corporate bonds with fixed 9-11% annual yields."
              tags={["Fixed Income", "No Market Vol"]}
            />
            <InvestmentCard
              span="md:col-span-8"
              icon={CreditCard}
              title="Credit Card Meta 2026"
              desc="Real-time devaluation alerts, Lounge counters, and Milestone spend predictors for all Indian premium cards."
              tags={["Infinia", "Atlas", "Magnus", "Amex"]}
            />
          </div>
        </div>
      </section>

      {/* 7. DATA SOVEREIGNTY (Privacy First) */}
      <section
        id="security"
        className="py-32 px-6 border-t border-white/5 bg-[#010101]"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center mb-8 border border-gold/20">
              <ShieldCheck className="w-6 h-6 text-gold" />
            </div>
            <h2 className="font-serif text-5xl font-bold text-white mb-8 italic">
              Privacy is <span className="text-gold">Luxury</span>.
            </h2>
            <p className="text-slate-400 text-xl leading-relaxed mb-10">
              Free apps sell your data to banks. We sell intelligence to you.
              PaisaDekho Luxe uses <b>Zero-Knowledge Edge Computing</b>.
            </p>
            <div className="space-y-6">
              <SecurityPoint
                title="On-Device Parsing"
                desc="Your financial SMS and PDF statements are analyzed on your phone. Our servers only see the metadata needed for execution."
              />
              <SecurityPoint
                title="Institutional API Sandboxing"
                desc="We use AES-256 encrypted tokens. We never store your bank passwords or net-banking credentials."
              />
              <SecurityPoint
                title="DPDP Act 2023 Compliant"
                desc="Full data sovereignty. You can delete your entire financial vault with a single tap. Your data, your choice."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <ComplianceBox title="Data Residency" value="INDIA" />
            <ComplianceBox title="Audit Standard" value="SOC2" />
            <ComplianceBox title="Encryption" value="AES-256" />
            <ComplianceBox title="Regulation" value="ISO 27001" />
          </div>
        </div>
      </section>

      {/* 8. FOOTER (Master Version) */}
      <footer className="py-24 px-6 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <img
                  src="/favicon.ico"
                  alt="Logo"
                  className="w-10 h-10 rounded-lg"
                />
                <span className="font-serif text-3xl font-bold text-white tracking-tighter">
                  PaisaDekho Luxe
                </span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] leading-loose max-w-sm">
                A Private Wealth Network for the Top 1%. <br />
                Managed by PD Finserve Pvt Ltd. <br />
              </p>
            </div>
            <div>
              <h5 className="text-white font-extrabold text-[10px] uppercase tracking-[0.3em] mb-8">
                Asset Classes
              </h5>
              <FooterLink>Mutual Funds Alpha</FooterLink>
              <FooterLink>Corporate Bonds</FooterLink>
              <FooterLink>Indian Equities</FooterLink>
              <FooterLink>Real Estate REITs</FooterLink>
            </div>
            <div>
              <h5 className="text-white font-extrabold text-[10px] uppercase tracking-[0.3em] mb-8">
                Legal
              </h5>
              <FooterLink>Privacy Vault</FooterLink>
              <FooterLink>DPDP Rights</FooterLink>
              <FooterLink>Terms of Service</FooterLink>
              <FooterLink>Risk Disclosures</FooterLink>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-[10px] text-slate-700 font-extrabold tracking-[0.4em] uppercase">
              © 2026 PAISADEKHO LUXE • BENGALURU • DUBAI • LONDON
            </span>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded bg-white/5" />
              <div className="w-8 h-8 rounded bg-white/5" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- MASTER HELPERS ---

function NavLink({ href, children }: any) {
  return (
    <Link
      href={href}
      className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-slate-500 hover:text-gold transition-colors"
    >
      {children}
    </Link>
  );
}

function UseCaseCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-gold/20 transition-all group">
      <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mb-8 group-hover:bg-gold group-hover:text-black transition-all">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-xl font-bold text-white mb-4 tracking-tight font-serif">
        {title}
      </h4>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function InvestmentCard({ icon: Icon, title, desc, span, tags }: any) {
  return (
    <div
      className={`${span} p-10 rounded-[3rem] bg-zinc-900/40 border border-white/5 hover:border-gold/30 transition-all group cursor-pointer relative overflow-hidden`}
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:bg-gold group-hover:text-black transition-all">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-2xl font-bold text-white mb-4 font-serif">{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed mb-8">{desc}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag: any) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase text-slate-500 group-hover:text-slate-200"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-3 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all ${active ? "bg-gold text-black shadow-lg shadow-gold/20" : "bg-white/5 text-slate-500 border border-white/10 hover:border-white/20"}`}
    >
      {label}
    </button>
  );
}

function ComparisonRow({ label, value, active }: any) {
  return (
    <div
      className={`flex justify-between p-5 rounded-2xl border ${active ? "border-gold/30 bg-gold/5" : "border-white/5 bg-white/5"}`}
    >
      <span
        className={`text-sm ${active ? "text-white font-bold" : "text-slate-400"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm ${active ? "text-gold font-bold" : "text-slate-500"}`}
      >
        {value}
      </span>
    </div>
  );
}

function AllocationRow({ label, pct }: any) {
  return (
    <div className="flex justify-between items-center p-5 rounded-2xl bg-white/5 border border-white/5">
      <span className="text-sm text-slate-400 font-medium">{label}</span>
      <span className="text-sm font-bold text-white">{pct}</span>
    </div>
  );
}

function SecurityPoint({ title, desc }: any) {
  return (
    <div className="flex gap-5 mb-8">
      <div className="mt-1.5 w-2 h-2 rounded-full bg-gold shrink-0 shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
      <div>
        <h5 className="text-white font-bold text-lg mb-2">{title}</h5>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ComplianceBox({ title, value }: any) {
  return (
    <div className="p-10 rounded-[2.5rem] bg-black border border-white/5 text-center flex flex-col justify-center">
      <span className="block text-gold font-bold text-2xl mb-2 tracking-tighter">
        {value}
      </span>
      <span className="text-slate-600 text-[9px] uppercase tracking-[0.3em] font-extrabold">
        {title}
      </span>
    </div>
  );
}

function StepCard({ num, icon: Icon, title, desc }: any) {
  return (
    <div className="p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-gold/20 transition-all relative group">
      <span className="absolute top-6 right-8 text-5xl font-serif font-bold text-white/[0.03] group-hover:text-gold/5 transition-colors">
        {num}
      </span>
      <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-8 border border-gold/20">
        <Icon className="w-6 h-6 text-gold" />
      </div>
      <h4 className="text-xl font-bold text-white mb-3 tracking-tight">
        {title}
      </h4>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function FooterLink({ children }: any) {
  return (
    <Link
      href="#"
      className="block text-slate-600 hover:text-gold text-[10px] font-bold uppercase tracking-[0.2em] mb-4 transition-colors"
    >
      {children}
    </Link>
  );
}
