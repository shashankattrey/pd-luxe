// components/dashboard/QuickActionCard.tsx
import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";

interface QuickActionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  cta: string;
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  cta,
}: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="glass-gold rounded-2xl p-6 hover-shine h-full group cursor-pointer transition-all border border-gold/10 hover:border-gold/40 flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/30 transition-colors">
            <Icon className="w-6 h-6 text-gold" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
            {description}
          </p>
        </div>
        <span className="inline-flex items-center text-gold text-sm font-medium mt-auto">
          {cta}
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
