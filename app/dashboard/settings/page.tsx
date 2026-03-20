// ═══════════════════════════════════════════════════════════════════
// ALERTS PAGE — /dashboard/alerts
// ═══════════════════════════════════════════════════════════════════
"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  Info,
  CheckCircle2,
  TrendingDown,
  Calendar,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { creditCards } from "@/lib/credit-cards-data";
import { cn } from "@/lib/utils";
type AlertSeverity = "critical" | "warning" | "info";
interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  date: string;
  cardName?: string;
  dismissed?: boolean;
}

// Build alerts from real card data
function buildAlerts(): Alert[] {
  const alerts: Alert[] = [];

  // 2026 devaluation alerts
  (creditCards as any[])
    .filter(
      (c) =>
        c.devaluation2026 || c.notesTnc?.toLowerCase().includes("devaluation"),
    )
    .forEach((c) => {
      alerts.push({
        id: `dev-${c.id}`,
        severity: "critical",
        title: `${c.name} — 2026 Devaluation`,
        body:
          c.notesTnc?.slice(0, 200) ||
          "This card has undergone reward structure changes for 2026.",
        date: "Effective 2026",
        cardName: c.name,
      });
    });

  // Policy change alerts
  (creditCards as any[])
    .filter(
      (c) =>
        c.notesTnc?.toLowerCase().includes("critical") ||
        c.notesTnc?.toLowerCase().includes("updated"),
    )
    .slice(0, 3)
    .forEach((c) => {
      if (!alerts.find((a) => a.cardName === c.name)) {
        alerts.push({
          id: `policy-${c.id}`,
          severity: "warning",
          title: `${c.name} — Policy Update`,
          body: c.notesTnc?.slice(0, 200) || "Terms and conditions updated.",
          date: c.notesTnc?.match(/\d{4}/)?.[0]
            ? `Updated ${c.notesTnc.match(/\d{4}/)?.[0]}`
            : "Recent",
          cardName: c.name,
        });
      }
    });

  // Static market alerts
  alerts.push(
    {
      id: "market-1",
      severity: "info",
      title: "HDFC SmartBuy rates revised",
      body: "HDFC SmartBuy portal rates adjusted for Infinia Metal and Diners Black. Confirm latest multipliers before booking.",
      date: "Jan 2026",
    },
    {
      id: "market-2",
      severity: "info",
      title: "Axis Magnus devaluation — 2024",
      body: "Axis Magnus reward structure was devalued in 2024. Effective reward rate reduced from 4.8% to 1.2% on direct spends.",
      date: "Ongoing",
    },
    {
      id: "tax-1",
      severity: "info",
      title: "ELSS Lock-in reminder",
      body: "ELSS investments made in January 2023 complete their 3-year lock-in this month. Review for redemption or continuation.",
      date: "January 2026",
    },
  );

  return alerts.slice(0, 12);
}

const ALERTS = buildAlerts();

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    icon: React.ElementType;
    bg: string;
    border: string;
    label: string;
    labelColor: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    bg: "bg-red-500/8",
    border: "border-red-500/25",
    label: "Critical",
    labelColor: "text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-orange-500/8",
    border: "border-orange-500/25",
    label: "Warning",
    labelColor: "text-orange-400",
  },
  info: {
    icon: Info,
    bg: "bg-blue-500/8",
    border: "border-blue-500/25",
    label: "Info",
    labelColor: "text-blue-400",
  },
};

export function AlertsPage() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");

  const visible = ALERTS.filter(
    (a) => !dismissed.has(a.id) && (filter === "all" || a.severity === filter),
  );

  const critCount = ALERTS.filter(
    (a) => a.severity === "critical" && !dismissed.has(a.id),
  ).length;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {critCount > 0 ? (
              <span className="text-red-400">
                {critCount} critical alerts require attention
              </span>
            ) : (
              "Stay on top of card policy changes"
            )}
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center">
          <Bell className="w-4 h-4 text-amber-400" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {(["all", "critical", "warning", "info"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border capitalize",
              filter === f
                ? "bg-amber-400/20 border-amber-400/40 text-amber-400"
                : "border-white/10 text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "all"
              ? `All (${ALERTS.filter((a) => !dismissed.has(a.id)).length})`
              : f}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {visible.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" />
          <p className="text-foreground font-medium">All clear!</p>
          <p className="text-sm text-muted-foreground mt-1">
            No {filter !== "all" ? filter : ""} alerts
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((alert, i) => {
            const cfg = SEVERITY_CONFIG[alert.severity];
            const IconComponent = cfg.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "rounded-2xl border p-4 relative",
                  cfg.bg,
                  cfg.border,
                )}
              >
                <button
                  onClick={() =>
                    setDismissed((prev) => new Set([...prev, alert.id]))
                  }
                  className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="flex gap-3">
                  <IconComponent
                    className={cn("w-4 h-4 shrink-0 mt-0.5", cfg.labelColor)}
                  />
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          cfg.labelColor,
                        )}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {alert.date}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {alert.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {alert.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {dismissed.size > 0 && (
        <button
          onClick={() => setDismissed(new Set())}
          className="w-full py-2.5 rounded-xl border border-white/8 text-sm text-muted-foreground hover:text-foreground transition-all"
        >
          Restore {dismissed.size} dismissed alerts
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS PAGE — /dashboard/settings
// ═══════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const [name, setName] = useState("Arnika Kumawat");
  const [email, setEmail] = useState("kumawatarnika@gmail.com");
  const [income, setIncome] = useState(600000);
  const [notifications, setNotifications] = useState({
    devaluations: true,
    policyChanges: true,
    sipReminders: false,
    weeklyDigest: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile section */}
      <Section title="Profile">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 flex items-center justify-center text-2xl font-bold text-amber-400">
            {name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-foreground">{name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
        <SettingField label="Full Name" value={name} onChange={setName} />
        <SettingField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
        />
      </Section>

      {/* Financial profile */}
      <Section title="Financial Profile">
        <div className="space-y-2">
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Annual Income</p>
            <p className="text-sm font-bold text-amber-400">
              ₹{income.toLocaleString()}
            </p>
          </div>
          <input
            type="range"
            min={300000}
            max={10000000}
            step={100000}
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/50">
            <span>₹3L</span>
            <span>₹1Cr</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          💡 Used to filter eligible cards by minimum income requirement
        </p>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        {[
          {
            key: "devaluations",
            label: "Card devaluations",
            desc: "Alert when a card in your wallet is devalued",
          },
          {
            key: "policyChanges",
            label: "Policy changes",
            desc: "T&C updates for your cards",
          },
          {
            key: "sipReminders",
            label: "SIP reminders",
            desc: "Monthly reminder for SIP investments",
          },
          {
            key: "weeklyDigest",
            label: "Weekly digest",
            desc: "Summary of top cards and market insights",
          },
        ].map((n) => (
          <div
            key={n.key}
            className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{n.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
            </div>
            <button
              onClick={() =>
                setNotifications((prev) => ({
                  ...prev,
                  [n.key]: !prev[n.key as keyof typeof prev],
                }))
              }
              className={cn(
                "relative w-11 h-6 rounded-full transition-all shrink-0",
                notifications[n.key as keyof typeof notifications]
                  ? "bg-amber-500"
                  : "bg-white/10",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
                  notifications[n.key as keyof typeof notifications]
                    ? "left-5.5 translate-x-0.5"
                    : "left-0.5",
                )}
                style={{
                  left: notifications[n.key as keyof typeof notifications]
                    ? "22px"
                    : "2px",
                }}
              />
            </button>
          </div>
        ))}
      </Section>

      {/* About */}
      <Section title="About">
        {[
          { label: "Version", value: "2.4.1 · 2026 Edition" },
          { label: "Data", value: "93 cards · Updated Mar 2026" },
          { label: "Privacy", value: "All data stored locally" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex justify-between py-3 border-b border-white/5 last:border-0"
          >
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-sm text-foreground">{item.value}</p>
          </div>
        ))}
      </Section>

      <button
        onClick={handleSave}
        className={cn(
          "w-full py-4 rounded-xl font-bold transition-all",
          saved
            ? "bg-green-500 text-white"
            : "bg-amber-500 hover:bg-amber-400 text-black",
        )}
      >
        {saved ? "✓ Saved!" : "Save Changes"}
      </button>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
          {title}
        </p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function SettingField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="text-xs text-muted-foreground block mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-amber-400/50 transition-all"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RISK PROFILER PAGE — /dashboard/risk-profiler
// ═══════════════════════════════════════════════════════════════════
export function RiskProfilerPage() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const questions = [
    {
      q: "If your investment dropped 20% in a month, what would you do?",
      options: [
        { label: "Sell everything immediately", score: 1 },
        { label: "Sell some to reduce exposure", score: 2 },
        { label: "Hold and wait for recovery", score: 3 },
        { label: "Buy more — great opportunity!", score: 4 },
      ],
    },
    {
      q: "What is your investment time horizon?",
      options: [
        { label: "Less than 2 years", score: 1 },
        { label: "2–5 years", score: 2 },
        { label: "5–10 years", score: 3 },
        { label: "More than 10 years", score: 4 },
      ],
    },
    {
      q: "How much of your monthly income can you invest?",
      options: [
        { label: "Less than 10%", score: 1 },
        { label: "10–20%", score: 2 },
        { label: "20–40%", score: 3 },
        { label: "More than 40%", score: 4 },
      ],
    },
    {
      q: "What is your primary investment goal?",
      options: [
        { label: "Capital preservation — don't lose money", score: 1 },
        { label: "Steady income with moderate growth", score: 2 },
        { label: "Long-term wealth creation", score: 3 },
        { label: "Maximum returns, any risk", score: 4 },
      ],
    },
    {
      q: "How much investment experience do you have?",
      options: [
        { label: "None — total beginner", score: 1 },
        { label: "Some FD/RD experience", score: 2 },
        { label: "Invest in mutual funds", score: 3 },
        { label: "Stocks, F&O, crypto trader", score: 4 },
      ],
    },
  ];

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);
    if (currentQ + 1 === questions.length) {
      setDone(true);
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  if (done) {
    const total = answers.reduce((a, b) => a + b, 0);
    const max = questions.length * 4;
    const pct = total / max;
    const riskLevel =
      pct < 0.35 ? "Conservative" : pct < 0.65 ? "Moderate" : "Aggressive";
    const riskColor =
      pct < 0.35
        ? "text-blue-400"
        : pct < 0.65
          ? "text-amber-400"
          : "text-red-400";
    const alloc =
      pct < 0.35
        ? [
            { label: "Large Cap", value: 50, color: "#10b981" },
            { label: "Debt Funds", value: 30, color: "#3b82f6" },
            { label: "Gold ETF", value: 20, color: "#f59e0b" },
          ]
        : pct < 0.65
          ? [
              { label: "Large Cap", value: 40, color: "#10b981" },
              { label: "Flexi Cap", value: 30, color: "#8b5cf6" },
              { label: "Mid Cap", value: 20, color: "#f59e0b" },
              { label: "Debt", value: 10, color: "#3b82f6" },
            ]
          : [
              { label: "Small Cap", value: 35, color: "#ef4444" },
              { label: "Mid Cap", value: 30, color: "#f97316" },
              { label: "Flexi Cap", value: 25, color: "#8b5cf6" },
              { label: "ELSS", value: 10, color: "#10b981" },
            ];

    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Your Risk Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Based on {questions.length} questions
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/3 border border-white/8 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            Risk Score
          </p>
          <p className={cn("font-serif text-4xl font-bold", riskColor)}>
            {riskLevel}
          </p>
          <div className="mt-4 h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-red-400"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Conservative</span>
            <span>Moderate</span>
            <span>Aggressive</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Suggested Allocation
          </p>
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
            {alloc.map((a, i) => (
              <div key={i} style={{ flex: a.value, background: a.color }} />
            ))}
          </div>
          {alloc.map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-white/3"
            >
              <span className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: a.color }}
                />
                {a.label}
              </span>
              <span className="text-sm font-bold text-foreground">
                {a.value}%
              </span>
            </div>
          ))}
        </div>

        <a
          href="/dashboard/wealth-advisor"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all"
        >
          Build Wealth Plan with this Profile
        </a>

        <button
          onClick={() => {
            setAnswers([]);
            setCurrentQ(0);
            setDone(false);
          }}
          className="w-full py-3 rounded-xl border border-white/8 text-sm text-muted-foreground hover:text-foreground transition-all"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  const q = questions[currentQ];
  const progress = (currentQ / questions.length) * 100;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Risk Profiler
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          5 questions · ~2 minutes
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Question {currentQ + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-amber-400"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <p className="font-serif text-xl font-semibold text-foreground leading-snug">
            {q.q}
          </p>
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt.score)}
                className="w-full p-4 rounded-xl border border-white/8 bg-white/3 text-left text-sm text-foreground hover:border-amber-400/40 hover:bg-amber-400/5 transition-all"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Named exports for route files ───────────────────────────────────────────
