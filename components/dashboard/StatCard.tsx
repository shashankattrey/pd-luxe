// components/dashboard/StatCard.tsx
import { LucideIcon } from "lucide-react";

interface StatProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext: string;
  color?: "gold" | "orange" | "emerald";
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = "gold",
}: StatProps) {
  const colorMap = {
    gold: "bg-gold/20 text-amber-400",
    orange: "bg-orange-500/20 text-orange-500",
    emerald: "bg-emerald-500/20 text-emerald-500",
  };

  return (
    <div className="glass-gold rounded-2xl p-6 hover-shine border border-gold/10">
      <div
        className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-4`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-muted-foreground text-[10px] mb-1 uppercase tracking-widest">
        {label}
      </p>
      <p className="font-serif text-3xl font-bold text-foreground mb-1">
        {value}
      </p>
      <p className="text-muted-foreground text-[10px]">{subtext}</p>
    </div>
  );
}
