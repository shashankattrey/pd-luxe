"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function WaterfallProgress({ profile }: { profile: any }) {
  // Calculate months from the rupee amount in your profile
  const monthlyExp = profile.monthlyExpenses || 1;
  const emergencyMonths = Math.floor((profile.emergencyFund || 0) / monthlyExp);

  const steps = [
    {
      id: "emergency",
      label: "Safety Net",
      desc: "Target: 6 Months Expenses",
      icon: ShieldCheck,
      isDone: emergencyMonths >= 6,
      current: `${emergencyMonths}/6 months`,
    },
    {
      id: "insurance",
      label: "Protection",
      desc: "Term & Health Cover",
      icon: Zap,
      isDone: !!(profile.insuranceTerm && profile.insuranceHealth),
      current: profile.insuranceTerm ? "Active" : "Action Required",
    },
    {
      id: "wealth",
      label: "Wealth Engine",
      desc: "Equity & Index Funds",
      icon: TrendingUp,
      isDone: emergencyMonths >= 3 && !!profile.insuranceTerm,
      current: "Optimizing",
    },
  ];

  return (
    <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
      {steps.map((step, i) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.2 }}
          className="relative flex gap-6 group"
        >
          <div
            className={cn(
              "relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
              step.isDone
                ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-black"
                : "bg-white/5 border border-white/10 text-white/20",
            )}
          >
            <step.icon size={20} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "font-serif font-bold text-lg",
                  step.isDone ? "text-white" : "text-white/20",
                )}
              >
                {step.label}
              </p>
              {step.isDone && (
                <CheckCircle2 size={14} className="text-emerald-400" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground/40">{step.desc}</p>
            <div className="mt-2 inline-block px-2 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] font-mono text-amber-400/80">
              {step.current}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
