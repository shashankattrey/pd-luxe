import { useState } from "react";
import {
  ShieldCheck,
  Info,
  Zap,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Calculator,
} from "lucide-react";

export function ButlerCard({
  name,
  benefit,
  score,
  pros = [],
  alerts,
  issuer,
  // New prop: Pass the audit object from your calculation engine
  audit = { grossRewards: 0, loungeValue: 0, effectiveFee: 0, netValue: 0 },
}: any) {
  const [showAudit, setShowAudit] = useState(false);

  return (
    <div className="group relative mb-6 overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-zinc-900/90 to-black p-[1px] shadow-2xl transition-all hover:border-gold/50">
      <div className="absolute -right-10 -top-10 h-32 w-32 bg-gold/5 blur-3xl group-hover:bg-gold/10 transition-colors" />

      <div className="relative rounded-[22px] bg-zinc-950/40 p-5">
        {/* Header: Issuer & Score */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 border border-gold/20">
              <ShieldCheck className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold/60">
                {issuer || "Unknown Issuer"}
              </p>
              <h4 className="font-serif text-lg font-bold text-white">
                {name || "Credit Card"}
              </h4>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex flex-col items-center rounded-xl bg-gold px-3 py-1 shadow-lg shadow-gold/20">
              <span className="text-[8px] font-black uppercase text-black/70 leading-none">
                Rating
              </span>
              <span className="text-lg font-bold text-black leading-tight">
                {score || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section: Net Benefit */}
        <div className="mb-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <Zap className="h-4 w-4 fill-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Est. Net Annual Value
              </span>
            </div>
            <button
              onClick={() => setShowAudit(!showAudit)}
              className="text-[10px] flex items-center gap-1 text-zinc-500 hover:text-gold transition-colors"
            >
              <Calculator className="h-3 w-3" />{" "}
              {showAudit ? "Hide Audit" : "See Math"}
            </button>
          </div>
          <p className="text-2xl font-bold text-emerald-500 mt-1">
            {benefit || "Calculating..."}
          </p>

          {/* --- DETAILED BREAKDOWN SECTION --- */}
          {showAudit && (
            <div className="mt-4 pt-3 border-t border-emerald-500/10 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Base & Multiplier Rewards</span>
                <span className="text-emerald-400 font-medium">
                  +₹{audit.grossRewards.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Lounge & Perk Valuation</span>
                <span className="text-emerald-400 font-medium">
                  +₹{audit.loungeValue?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Annual Fee + 18% GST</span>
                <span className="text-rose-400 font-medium">
                  -₹{audit.effectiveFee.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-zinc-800 font-bold">
                <span className="text-zinc-300 uppercase tracking-tighter">
                  Net Realized Gain
                </span>
                <span className="text-gold">
                  ₹{audit.netValue.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pros Checklist */}
        <div className="mb-5 space-y-2">
          {pros?.map((pro: string, i: number) => (
            <div
              key={i}
              className="flex items-center gap-3 text-sm text-zinc-300"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-gold/60" />
              {pro}
            </div>
          ))}
          {(!pros || pros.length === 0) && (
            <p className="text-xs text-zinc-500 italic">
              No specific pros listed for 2026.
            </p>
          )}
        </div>

        {/* 2026 Alert Box */}
        {alerts && (
          <div className="flex gap-3 rounded-xl bg-zinc-900/80 p-3 border border-zinc-800">
            <Info className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-500 tracking-tight">
                2026 Compliance Note
              </p>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                {alerts}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-xs font-bold text-white transition-colors hover:bg-gold hover:text-black group-hover:bg-gold group-hover:text-black">
          Apply Now <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
