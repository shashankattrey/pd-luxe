"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  CreditCard,
  Plus,
  ArrowRight,
  Check,
  AlertTriangle,
  Plane,
  Globe,
  IndianRupee,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  creditCards,
  type CreditCard as CardType,
  calculateInDepthSavings,
} from "@/lib/credit-cards-data";

const MAX_CARDS = 4;

export default function ComparisonPage() {
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSelector, setShowSelector] = useState(false);
  const [annualSpend, setAnnualSpend] = useState(500000);

  const filteredCards = useMemo(() => {
    return creditCards.filter(
      (card) =>
        !selectedCards.find((sc) => sc.id === card.id) &&
        (card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.bank.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [searchQuery, selectedCards]);

  const addCard = (card: CardType) => {
    if (selectedCards.length < MAX_CARDS) {
      setSelectedCards((prev) => [...prev, card]);
      setShowSelector(false);
      setSearchQuery("");
    }
  };

  const removeCard = (cardId: string) => {
    setSelectedCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Comparison Lab
          </h1>
          <p className="text-muted-foreground">
            Side-by-side audit for up to {MAX_CARDS} instruments
          </p>
        </div>

        <div className="flex items-center gap-3 glass-gold p-2 rounded-xl border border-gold/10">
          <span className="text-xs font-bold uppercase tracking-wider text-gold px-2">
            Simulated Spend:
          </span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/60 text-sm">
              ₹
            </span>
            <Input
              type="number"
              value={annualSpend}
              onChange={(e) => setAnnualSpend(parseInt(e.target.value) || 0)}
              className="w-40 pl-8 bg-black/20 border-gold/20 focus:border-gold text-foreground font-bold"
            />
          </div>
        </div>
      </div>

      {/* Card Selection Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {selectedCards.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <SelectedCardSlot
                card={card}
                onRemove={() => removeCard(card.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {selectedCards.length < MAX_CARDS && (
          <button
            onClick={() => setShowSelector(true)}
            className="h-48 rounded-2xl border-2 border-dashed border-gold/20 hover:border-gold/50 flex flex-col items-center justify-center gap-3 transition-all group hover:bg-gold/5"
          >
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-gold" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-gold">
              Add Card
            </span>
          </button>
        )}
      </div>

      {/* Comparison Table */}
      {selectedCards.length >= 2 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-gold rounded-3xl overflow-hidden border border-gold/10"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gold/10 bg-black/20">
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] text-gold font-black w-48">
                    Feature Audit
                  </th>
                  {selectedCards.map((card) => (
                    <th key={card.id} className="p-6 text-center min-w-[200px]">
                      <p className="text-sm font-serif font-bold text-foreground">
                        {card.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {card.bank}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/5">
                <ComparisonRow
                  label="Net Annual Profit"
                  icon={Zap}
                  values={selectedCards.map((card) => {
                    const audit = calculateInDepthSavings(card, annualSpend);
                    return {
                      display: `₹${audit.netValue.toLocaleString()}`,
                      value: audit.netValue,
                      isPositive: audit.netValue > 0,
                    };
                  })}
                  highlightBest="highest"
                />
                <ComparisonRow
                  label="Realized Yield"
                  icon={TrendingUp}
                  values={selectedCards.map((card) => {
                    const audit = calculateInDepthSavings(card, annualSpend);
                    return { display: `${audit.yield}%`, value: audit.yield };
                  })}
                  highlightBest="highest"
                />
                <ComparisonRow
                  label="Maintenance Cost"
                  icon={IndianRupee}
                  values={selectedCards.map((card) => {
                    const audit = calculateInDepthSavings(card, annualSpend);
                    const cost = audit.effectiveFee + audit.redemptionCosts;
                    return {
                      display: `₹${cost.toLocaleString()}`,
                      value: cost,
                      isPositive: false,
                    };
                  })}
                  highlightBest="lowest"
                />
                <ComparisonRow
                  label="Forex Markup"
                  icon={Globe}
                  values={selectedCards.map((card) => ({
                    display: `${card.forexMarkup}%`,
                    value: card.forexMarkup,
                  }))}
                  highlightBest="lowest"
                />
                <ComparisonRow
                  label="Lounge Access"
                  icon={Plane}
                  values={selectedCards.map((card) => ({
                    display:
                      card.loungeCap === -1
                        ? "Unlimited"
                        : `${card.loungeCap}/yr`,
                    value: card.loungeCap === -1 ? 99 : card.loungeCap,
                  }))}
                  highlightBest="highest"
                />

                {/* 2026 Alert Row */}
                <tr>
                  <td className="p-6 flex items-center gap-2 text-xs text-muted-foreground italic">
                    <AlertTriangle className="w-3 h-3" /> 2026 Devaluation
                  </td>
                  {selectedCards.map((card) => (
                    <td key={card.id} className="p-6 text-center">
                      {card.devaluation2026 ? (
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
                          HIGH RISK
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                          STABLE
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="glass-gold rounded-3xl p-20 text-center border border-gold/10">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gold/40" />
          </div>
          <h3 className="text-xl font-serif font-bold mb-2">
            Add cards to begin comparison
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Select at least two cards from the vault to see side-by-side
            financial metrics.
          </p>
        </div>
      )}

      {/* Selector Modal */}
      <AnimatePresence>
        {showSelector && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSelector(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl glass-gold rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gold/10 flex justify-between items-center bg-black/40">
                <h3 className="font-serif font-bold">Select Card</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSelector(false)}
                >
                  <X />
                </Button>
              </div>
              <div className="p-4 bg-black/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                  <Input
                    placeholder="Search bank or card name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-gold/10"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                {filteredCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => addCard(card)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-gold/10 rounded-2xl transition-all group text-left"
                  >
                    <div
                      className={`w-12 h-8 rounded-md bg-gradient-to-br ${card.imageGradient}`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{card.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {card.bank}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-gold" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SelectedCardSlot({
  card,
  onRemove,
}: {
  card: CardType;
  onRemove: () => void;
}) {
  return (
    <div
      className={`relative h-48 rounded-2xl overflow-hidden group shadow-lg shadow-black/40`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${card.imageGradient}`}
      />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="absolute bottom-4 left-4 text-white">
        <p className="text-[10px] uppercase font-black tracking-widest opacity-60">
          {card.bank}
        </p>
        <p className="font-serif font-bold text-sm leading-tight">
          {card.name}
        </p>
      </div>
    </div>
  );
}

function ComparisonRow({ label, icon: Icon, values, highlightBest }: any) {
  const numericValues = values.map((v: any) => v.value);
  const targetValue =
    highlightBest === "highest"
      ? Math.max(...numericValues)
      : Math.min(...numericValues);

  return (
    <tr className="group hover:bg-gold/5 transition-colors">
      <td className="p-6">
        <div className="flex items-center gap-3 text-muted-foreground group-hover:text-gold transition-colors">
          <Icon className="w-4 h-4" />
          <span className="text-xs font-medium">{label}</span>
        </div>
      </td>
      {values.map((val: any, i: number) => {
        const isBest = val.value === targetValue;
        return (
          <td key={i} className="p-6 text-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`text-sm font-bold ${val.isPositive === false ? "text-orange-400" : isBest ? "text-gold" : "text-foreground"}`}
              >
                {val.display}
              </span>
              {isBest && <Check className="w-3 h-3 text-gold" />}
            </div>
          </td>
        );
      })}
    </tr>
  );
}
