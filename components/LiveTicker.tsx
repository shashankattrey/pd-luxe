// components/LiveTicker.tsx
"use client";
import { useLiveRates } from "@/hooks/useLiveRates";

export function LiveTicker() {
  const { tickerItems, isLoading } = useLiveRates();

  if (isLoading || tickerItems.length === 0) return null;

  const tripled = [...tickerItems, ...tickerItems, ...tickerItems];

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] overflow-hidden bg-black/80 backdrop-blur-md border-b border-white/5 py-2">
      <div className="flex whitespace-nowrap animate-ticker">
        {tripled.map((item, i) => (
          <div key={i} className="inline-flex items-center mx-8 space-x-2">
            <span className="text-[10px] font-bold text-white/40 tracking-widest">{item.label}</span>
            <span className="text-[10px] font-black text-white">{item.val}</span>
            <span className={item.up ? "text-emerald-400" : "text-rose-400"}>
              {item.up ? "▲" : "▼"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}