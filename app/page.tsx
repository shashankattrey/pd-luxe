"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  CreditCard,
  Sparkles,
  Shield,
  TrendingUp,
  ArrowRight,
  Wallet,
  Bot,
  BarChart3,
  Plane,
  Gift,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-gold">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center">
                <Wallet className="w-6 h-6 text-background" />
              </div>
              <span className="font-serif text-xl font-semibold text-gold">
                PaisaDekho
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold font-medium">
                Luxe
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-muted-foreground hover:text-gold transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-muted-foreground hover:text-gold transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-gold transition-colors"
              >
                Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth">
                <Button
                  variant="ghost"
                  className="text-foreground hover:text-gold hover:bg-gold/10"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth?mode=signup">
                <Button className="bg-gold text-background hover:bg-gold/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF8C00]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <motion.div
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-gold text-gold text-sm">
                <Sparkles className="w-4 h-4" />
                2026 Intelligence Layer
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6"
            >
              <span className="text-foreground">The </span>
              <span className="text-gold">2026</span>
              <span className="text-foreground"> Intelligence</span>
              <br />
              <span className="text-foreground">Layer for Your </span>
              <span className="text-gold">Wallet</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Unlock the full potential of your credit cards with AI-powered
              optimization. Navigate reward devaluations, maximize cashback, and
              access exclusive insights for the Indian market.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Link href="/auth?mode=signup">
                <Button
                  size="lg"
                  className="bg-gold text-background hover:bg-gold/90 text-lg px-8 py-6 rounded-xl group"
                >
                  Start Optimizing
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gold/30 text-gold hover:bg-gold/10 text-lg px-8 py-6 rounded-xl"
                >
                  Explore Dashboard
                </Button>
              </Link>
            </motion.div>

            {/* 3D Card Mockup */}
            <motion.div
              variants={fadeInUp}
              className="relative max-w-lg mx-auto"
            >
              <RotatingCard />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gold">Elite</span> Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to master your credit card strategy in 2026
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Large Feature Card */}
            <motion.div
              className="md:col-span-2 glass-gold rounded-2xl p-8 glow-gold hover-shine"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center shrink-0">
                  <Bot className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
                    Luxe Butler AI
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Your personal AI concierge that analyzes your spending
                    patterns, income, and lifestyle to recommend the perfect
                    credit card portfolio. Get real-time answers to complex
                    reward optimization questions.
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center text-gold hover:text-gold/80 transition-colors"
                  >
                    Meet your Butler <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Feature Cards */}
            <FeatureCard
              icon={Shield}
              title="2026 Truth Layer"
              description="Real-time alerts on reward devaluations, T&C changes, and hidden fee updates"
              delay={0.2}
            />
            <FeatureCard
              icon={BarChart3}
              title="Comparison Matrix"
              description="Side-by-side analysis with forex rates, transfer ratios, and net value calculations"
              delay={0.3}
            />
            <FeatureCard
              icon={CreditCard}
              title="Card Vault"
              description="Curated collection of 93+ premium cards with live reward tracking"
              delay={0.4}
            />
            <FeatureCard
              icon={Plane}
              title="Lounge Intelligence"
              description="Track your complimentary visits, caps, and quarterly requirements"
              delay={0.5}
            />
            <FeatureCard
              icon={TrendingUp}
              title="Smart Waiver Engine"
              description="Automatic fee waiver calculations based on your spending projections"
              delay={0.6}
            />
            <FeatureCard
              icon={Gift}
              title="Milestone Tracker"
              description="Never miss a spending milestone for bonus rewards and upgrades"
              delay={0.7}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/5 to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              How It <span className="text-gold">Works</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to optimize your credit card rewards
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HowItWorksStep
              number="01"
              title="Connect Your Profile"
              description="Share your income range and monthly spending patterns securely"
              delay={0.1}
            />
            <HowItWorksStep
              number="02"
              title="AI Analysis"
              description="Luxe Butler analyzes 93+ cards against your unique financial profile"
              delay={0.2}
            />
            <HowItWorksStep
              number="03"
              title="Get Recommendations"
              description="Receive personalized card rankings with projected annual value"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="glass-gold rounded-3xl p-12 text-center glow-gold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Ready to <span className="text-gold">Elevate</span> Your Wallet?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of savvy cardholders who maximize their rewards
              with PaisaDekho Luxe
            </p>
            <Link href="/auth?mode=signup">
              <Button
                size="lg"
                className="bg-gold text-background hover:bg-gold/90 text-lg px-10 py-6 rounded-xl"
              >
                Start Free Today
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
                <Wallet className="w-4 h-4 text-background" />
              </div>
              <span className="font-serif text-lg font-semibold text-gold">
                PaisaDekho Luxe
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              2026 PaisaDekho. The Intelligence Layer for Your Wallet.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RotatingCard() {
  return (
    <motion.div
      className="relative w-80 h-48 mx-auto perspective-1000"
      animate={{
        rotateY: [0, 10, -10, 0],
        rotateX: [0, 5, -5, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border border-gold/30 shadow-2xl overflow-hidden">
        {/* Card Chip */}
        <div className="absolute top-8 left-8 w-12 h-9 rounded bg-gradient-to-br from-gold to-amber-600 opacity-80" />

        {/* Card Network */}
        <div className="absolute top-8 right-8 text-gold/60">
          <CreditCard className="w-8 h-8" />
        </div>

        {/* Card Number */}
        <div className="absolute bottom-16 left-8 right-8">
          <p className="text-foreground/70 font-mono text-lg tracking-widest">
            **** **** **** 4832
          </p>
        </div>

        {/* Card Details */}
        <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">
              Card Holder
            </p>
            <p className="text-foreground font-medium">PAISA DEKHO</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs uppercase tracking-wider">
              Expires
            </p>
            <p className="text-foreground font-medium">12/28</p>
          </div>
        </div>

        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-200%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
      </div>
    </motion.div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      className="glass-gold rounded-2xl p-6 hover-shine group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/30 transition-colors">
        <Icon className="w-6 h-6 text-gold" />
      </div>
      <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function HowItWorksStep({
  number,
  title,
  description,
  delay,
}: {
  number: string;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <div className="w-20 h-20 rounded-full glass-gold mx-auto mb-6 flex items-center justify-center">
        <span className="font-serif text-3xl font-bold text-gold">
          {number}
        </span>
      </div>
      <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}
