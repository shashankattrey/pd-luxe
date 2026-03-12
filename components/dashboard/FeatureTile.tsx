// components/dashboard/FeatureTile.tsx
interface DetailItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface TileProps {
  title: string;
  subtitle: string;
  badge?: string;
  details: DetailItem[];
  type: "card" | "fund";
}

export function FeatureTile({
  title,
  subtitle,
  badge,
  details,
  type,
}: TileProps) {
  const isFund = type === "fund";

  return (
    <div className="glass-gold rounded-2xl overflow-hidden hover-shine border border-gold/10 group">
      <div
        className={`h-32 p-4 bg-gradient-to-br ${isFund ? "from-emerald-950/40" : "from-neutral-900"} to-black/20`}
      >
        <div className="flex justify-between items-start">
          <div>
            <p
              className={`text-[10px] uppercase tracking-widest ${isFund ? "text-emerald-400" : "text-amber-400"}`}
            >
              {subtitle}
            </p>
            <h3 className="text-white font-serif font-bold text-sm mt-1">
              {title}
            </h3>
          </div>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-white/10 text-white uppercase">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="p-4 bg-black/20 grid grid-cols-2 gap-3">
        {details.map((item, i) => (
          <div key={i}>
            <p className="text-muted-foreground text-[9px] uppercase">
              {item.label}
            </p>
            <p
              className={`font-mono font-bold text-xs ${item.highlight ? "text-amber-400" : "text-foreground"}`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
