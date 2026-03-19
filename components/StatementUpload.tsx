"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import {
  ArrowRight,
  Lock,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  Utensils,
  ShoppingBag,
  Plane,
  Fuel,
  Zap,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface StatementUploadProps {
  onDataParsed: (data: any) => void;
}

type UploadState =
  | "idle"
  | "loading"
  | "needs_password"
  | "wrong_password"
  | "done"
  | "error";

const BANKS = [
  { value: "SBI", label: "SBI" },
  { value: "ICICI", label: "ICICI" },
  { value: "KOTAK", label: "Kotak Mahindra" },
  { value: "HDFC", label: "HDFC" },
  { value: "BOB", label: "Bank of Baroda" },
];

// Category display config — maps parser category keys → label + icon + color
const CAT_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bg: string }
> = {
  food_and_dining: {
    label: "Food & Dining",
    icon: Utensils,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  shopping_and_ecommerce: {
    label: "Shopping",
    icon: ShoppingBag,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
  travel_and_utilities: {
    label: "Travel",
    icon: Plane,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  fuel: {
    label: "Fuel",
    icon: Fuel,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  transfers_and_p2p: {
    label: "Transfers",
    icon: Zap,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  bank_charges_and_taxes: {
    label: "Bank Charges",
    icon: Wallet,
    color: "text-gray-400",
    bg: "bg-gray-400/10",
  },
  others: {
    label: "Others",
    icon: MoreHorizontal,
    color: "text-gray-400",
    bg: "bg-gray-400/10",
  },
};

// Loading messages that rotate during processing
const LOADING_MESSAGES = [
  "Reading your transactions…",
  "Detecting spend categories…",
  "Mapping your patterns…",
  "Almost done…",
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function getCatConfig(key: string) {
  return (
    CAT_CONFIG[key] ?? {
      label: key.replace(/_/g, " "),
      icon: MoreHorizontal,
      color: "text-gray-400",
      bg: "bg-gray-400/10",
    }
  );
}

// ─────────────────────────────────────────────────────────────
// LOADING SCREEN
// ─────────────────────────────────────────────────────────────
function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const msgTimer = setInterval(
      () => setMsgIdx((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1)),
      600,
    );
    const progTimer = setInterval(
      () => setProgress((p) => Math.min(p + 18, 92)),
      400,
    );
    return () => {
      clearInterval(msgTimer);
      clearInterval(progTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="flex flex-col items-center justify-center py-10 space-y-6"
    >
      {/* Pulsing orb */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-amber-400"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.5, 0.25] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
          className="absolute inset-3 rounded-full bg-amber-400"
        />
        <div className="relative w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-black" />
        </div>
      </div>

      {/* Status message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-sm font-medium text-white"
        >
          {LOADING_MESSAGES[msgIdx]}
        </motion.p>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full bg-amber-400 rounded-full"
        />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// RESULTS SCREEN
// ─────────────────────────────────────────────────────────────
function ResultsScreen({
  data,
  onConfirm,
}: {
  data: any;
  onConfirm: () => void;
}) {
  const txns: any[] = data.transactions ?? [];
  const summary = data.summary ?? {};

  // Build category breakdown from transactions
  const catTotals = txns.reduce((acc: Record<string, number>, t: any) => {
    if (t.type === "debit") acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const sortedCats = Object.entries(catTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // top 5 only

  const totalDebits = summary.total_debits ?? 0;
  const monthlySpend = Math.round(totalDebits); // already monthly from parser

  // Top category insight
  const topCat = sortedCats[0];
  const topCatConfig = topCat ? getCatConfig(topCat[0]) : null;
  const topCatPct = topCat ? Math.round((topCat[1] / totalDebits) * 100) : 0;

  // Net flow
  const netFlow = (summary.total_credits ?? 0) - totalDebits;
  const netPositive = netFlow >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      {/* Account pill */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={() => onConfirm()} // Pass data back to the parent
          className="w-full h-12 bg-amber-400 text-black hover:bg-amber-300 font-bold text-sm rounded-xl shadow-lg shadow-amber-400/10"
        >
          Add to Vault & Analyze <ArrowRight className="ml-2 w-4 h-4" />
        </Button>

        <p className="text-[10px] text-center text-muted-foreground">
          This will save your spend patterns to your local profile for better
          recommendations.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          {data.account_holder && (
            <p className="text-xs font-semibold text-white">
              {data.account_holder}
            </p>
          )}
          <p className="text-[11px] text-gray-500">
            {data.bank_name} ·{" "}
            {data.account_number || data.metadata?.account_no}
            {(data.meta?.statementPeriod || data.metadata?.statementPeriod) &&
              ` · ${data.meta?.statementPeriod || data.metadata?.statementPeriod}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-emerald-400 font-semibold">
            {txns.length} txns
          </span>
        </div>
      </div>

      {/* 4 summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "Total Spent",
            value: fmt(totalDebits),
            color: "text-red-400",
            icon: TrendingDown,
          },
          {
            label: "Total Credited",
            value: fmt(summary.total_credits),
            color: "text-emerald-400",
            icon: TrendingUp,
          },
          {
            label: "Opening Bal",
            value: fmt(summary.opening_balance),
            color: "text-blue-400",
            icon: Wallet,
          },
          {
            label: "Closing Bal",
            value: fmt(summary.closing_balance),
            color: "text-purple-400",
            icon: Calendar,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="p-3.5 bg-white/5 rounded-2xl border border-white/8"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon className={`w-3 h-3 ${color}`} />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {label}
              </p>
            </div>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Net flow insight banner */}
      <div
        className={`flex items-center gap-3 p-3.5 rounded-xl border ${
          netPositive
            ? "bg-emerald-400/8 border-emerald-400/20"
            : "bg-red-400/8 border-red-400/20"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            netPositive ? "bg-emerald-400/15" : "bg-red-400/15"
          }`}
        >
          {netPositive ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div>
          <p
            className={`text-xs font-semibold ${netPositive ? "text-emerald-400" : "text-red-400"}`}
          >
            {netPositive ? "Positive cash flow" : "Negative cash flow"} this
            month
          </p>
          <p className="text-[11px] text-gray-500">
            Net {netPositive ? "surplus" : "deficit"} of{" "}
            {fmt(Math.abs(netFlow))}
          </p>
        </div>
      </div>

      {/* Spend breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
            Where you spent
          </h4>
          {topCatConfig && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${topCatConfig.bg} ${topCatConfig.color}`}
            >
              {topCatPct}% on {topCatConfig.label}
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {sortedCats.map(([cat, amt], i) => {
            const cfg = getCatConfig(cat);
            const pct = Math.round((amt / totalDebits) * 100);
            const Icon = cfg.icon;
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}
                  >
                    <Icon className={`w-3 h-3 ${cfg.color}`} />
                  </div>
                  <span className="text-xs font-medium text-gray-300 flex-1 capitalize">
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-500">{fmt(amt)}</span>
                  <span
                    className={`text-[10px] font-bold w-8 text-right ${cfg.color}`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="ml-9 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.06 + 0.1,
                      ease: "easeOut",
                    }}
                    className={`h-full rounded-full ${cfg.color.replace("text-", "bg-")}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* AI insight card */}
      <div className="p-4 rounded-2xl bg-amber-400/8 border border-amber-400/20 space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">
          AI insight
        </p>
        <p className="text-xs text-gray-300 leading-relaxed">
          Based on your spending, you'd benefit most from a card with strong{" "}
          {sortedCats
            .slice(0, 2)
            .map(([cat]) => getCatConfig(cat).label.toLowerCase())
            .join(" and ")}{" "}
          rewards. Your monthly spend of{" "}
          <span className="text-white font-semibold">{fmt(monthlySpend)}</span>{" "}
          could earn up to{" "}
          <span className="text-amber-400 font-semibold">
            {fmt(Math.round(monthlySpend * 12 * 0.05))}
          </span>{" "}
          / year with the right card.
        </p>
      </div>

      {/* CTA */}
      <Button
        onClick={onConfirm}
        className="w-full h-12 bg-amber-400 text-black hover:bg-amber-300 font-bold text-sm rounded-xl"
      >
        Find My Best Card <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function StatementUpload({
  onDataParsed,
}: StatementUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [bankType, setBankType] = useState("SBI");
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const isLoading = state === "loading";
  const needsPassword =
    state === "needs_password" || state === "wrong_password";

  useEffect(() => {
    if (needsPassword) setTimeout(() => passwordInputRef.current?.focus(), 50);
  }, [needsPassword]);

  async function uploadStatement(selectedFile: File, pdfPassword?: string) {
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("bankType", bankType);
    if (pdfPassword) formData.append("password", pdfPassword);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const json = await response.json();

    if (response.status === 422 && json.requiresPassword)
      return { requiresPassword: true };
    if (!response.ok)
      throw new Error(json.error || "Failed to parse statement");
    return json;
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setData(null);
    setError("");
    setPassword("");
    setState("idle");
  }

  async function handleAnalyze() {
    if (!file) return;
    setError("");
    setState("loading");
    try {
      const result = await uploadStatement(file, password || undefined);
      if (result.requiresPassword) {
        setState(password ? "wrong_password" : "needs_password");
        return;
      }
      setData(result);
      setState("done");
    } catch (err: any) {
      setError(err.message || "Failed to analyze statement");
      setState("error");
    }
  }

  function handlePasswordKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && password) handleAnalyze();
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Upload controls — hidden once done */}
      {state !== "done" && (
        <div className="space-y-4">
          {/* Bank + File */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Bank
              </label>
              <select
                value={bankType}
                onChange={(e) => {
                  setBankType(e.target.value);
                  setState("idle");
                  setData(null);
                }}
                className="w-full bg-white/5 border border-white/10 text-white text-sm p-2.5 rounded-xl outline-none focus:border-amber-400/50 transition-colors"
              >
                {BANKS.map((b) => (
                  <option key={b.value} value={b.value} className="bg-zinc-900">
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                PDF
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-400/15 file:text-amber-400 hover:file:bg-amber-400/25 cursor-pointer"
              />
            </div>
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!file || isLoading}
            className="w-full bg-amber-400 text-black font-bold py-3 rounded-xl hover:bg-amber-300 disabled:bg-white/10 disabled:text-gray-600 transition-all active:scale-[0.98]"
          >
            {isLoading ? "Analyzing…" : "Analyze Statement"}
          </button>

          {/* Password prompt */}
          <AnimatePresence>
            {needsPassword && (
              <motion.div
                key="password-prompt"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`p-4 rounded-xl border space-y-3 ${
                  state === "wrong_password"
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-amber-400/10 border-amber-400/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock
                    className={`w-4 h-4 shrink-0 ${state === "wrong_password" ? "text-red-400" : "text-amber-400"}`}
                  />
                  <p
                    className={`text-xs font-medium ${state === "wrong_password" ? "text-red-400" : "text-amber-400"}`}
                  >
                    {state === "wrong_password"
                      ? "Incorrect password — try again"
                      : "This PDF is password-protected"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter PDF password"
                    value={password}
                    onChange={(e) => {
                      e.stopPropagation();
                      setPassword(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      handlePasswordKeyDown(e);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      (e.target as HTMLInputElement).focus();
                    }}
                    onFocus={(e) => e.stopPropagation()}
                    ref={passwordInputRef}
                    autoComplete="off"
                    className="flex-1 bg-white/5 border border-white/15 text-white text-sm p-2 rounded-lg outline-none focus:border-amber-400/50 placeholder:text-gray-600"
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={!password || isLoading}
                    className="bg-amber-400 text-black px-5 py-2 rounded-lg text-sm font-bold hover:bg-amber-300 transition-colors disabled:opacity-40"
                  >
                    {isLoading ? "…" : "Unlock"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {state === "error" && error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Loading animation */}
      <AnimatePresence>{isLoading && <LoadingScreen />}</AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {data && state === "done" && (
          <>
            {/* Change statement link */}
            <button
              onClick={() => {
                setState("idle");
                setData(null);
                setFile(null);
              }}
              className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-400 transition-colors mb-1"
            >
              <ChevronRight className="w-3 h-3 rotate-180" /> Use different
              statement
            </button>
            <ResultsScreen data={data} onConfirm={() => onDataParsed(data)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
