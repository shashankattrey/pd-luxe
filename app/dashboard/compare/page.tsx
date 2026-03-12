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
    // "overflow-x-hidden" on the main container is key
    <div className="w-full max-w-full overflow-x-hidden px-4 py-6 space-y-8">
      {/* HEADER: Stack on mobile, side-by-side on desktop */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between max-w-screen-xl mx-auto">
        <div>
          <h1 className="font-serif text-2xl md:text-4xl font-bold text-foreground">
            Comparison Lab
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Side-by-side audit
          </p>
        </div>

        <div className="flex items-center gap-3 glass-gold p-2 rounded-2xl border border-gold/20 w-full md:w-auto">
          <span className="text-[10px] font-black uppercase tracking-tighter text-amber-400 pl-2">
            Annual Spend
          </span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400/50 text-xs">
              ₹
            </span>
            <Input
              type="number"
              value={annualSpend}
              onChange={(e) => setAnnualSpend(parseInt(e.target.value) || 0)}
              className="pl-7 h-9 bg-black/40 border-gold/10 text-sm font-bold focus-visible:ring-gold/30"
            />
          </div>
        </div>
      </div>

      {/* CARD GRID: 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-screen-xl mx-auto">
        <AnimatePresence mode="popLayout">
          {selectedCards.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
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
            className="h-32 md:h-44 rounded-2xl border-2 border-dashed border-gold/20 flex flex-col items-center justify-center gap-2 hover:bg-gold/5 transition-colors group"
          >
            <Plus className="w-5 h-5 text-amber-400/50 group-hover:text-amber-400 transition-colors" />
            <span className="text-[10px] uppercase font-bold text-muted-foreground">
              Add Card
            </span>
          </button>
        )}
      </div>

      {/* COMPARISON TABLE: The heavy lifting for responsiveness */}
      {selectedCards.length >= 2 ? (
        <div className="max-w-screen-xl mx-auto">
          <div className="glass-gold rounded-3xl border border-gold/100 overflow-hidden shadow-2xl">
            {/* The scrollable wrapper */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[280px] md:min-w-[640px]">
                <thead>
                  <tr className="bg-black/60">
                    <th className="w-[120px] md:w-[180px] p-4 text-left text-[10px] uppercase font-black text-amber-400/60 border-b border-gold/10">
                      Features
                    </th>
                    {selectedCards.map((card) => (
                      <th
                        key={card.id}
                        className="p-4 text-center border-gold/10"
                      >
                        <p className="text-xs font-serif font-bold truncate">
                          {card.name}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/5">
                  <ComparisonRow
                    label="Net Profit"
                    icon={Zap}
                    values={selectedCards.map((card) => {
                      const audit = calculateInDepthSavings(card, {
                        dining: annualSpend * 0.3,
                        travel: annualSpend * 0.3,
                        shopping: annualSpend * 0.2,
                        fuel: annualSpend * 0.1,
                        other: annualSpend * 0.1,
                      } as any);
                      return {
                        display: `₹${audit.netValue.toLocaleString()}`,
                        value: audit.netValue,
                      };
                    })}
                    highlight="highest"
                  />
                  <ComparisonRow
                    label="Forex Fee"
                    icon={Globe}
                    values={selectedCards.map((card) => ({
                      display: `${card.forexMarkup}%`,
                      value: card.forexMarkup,
                    }))}
                    highlight="lowest"
                  />
                  <ComparisonRow
                    label="Lounge"
                    icon={Plane}
                    values={selectedCards.map((card) => ({
                      display:
                        card.loungeCap === -1
                          ? "Unlimited"
                          : `${card.loungeCap}/yr`,
                      value: card.loungeCap,
                    }))}
                    highlight="highest"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 glass-gold rounded-3xl border border-gold/10 max-w-md mx-auto">
          <CreditCard className="w-8 h-8 text-amber-400/20 mx-auto mb-3" />
          <p className="text-sm font-serif text-muted-foreground">
            Add at least two cards to compare
          </p>
        </div>
      )}

      {/* SELECTOR MODAL */}
      <AnimatePresence>
        {showSelector && (
          <>
            <motion.div
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSelector(false)}
            />
            <motion.div
              className="fixed left-4 right-4 top-[10%] bottom-[10%] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-[101] glass-gold rounded-3xl overflow-hidden flex flex-col"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <div className="p-4 border-b border-gold/10 flex justify-between items-center">
                <h2 className="font-serif font-bold">Choose a Card</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSelector(false)}
                >
                  <X />
                </Button>
              </div>
              <div className="p-4 bg-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/40" />
                  <Input
                    placeholder="Search bank..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 bg-black/20 border-gold/10"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {filteredCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => addCard(card)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-gold/5 rounded-xl transition-colors text-left group"
                  >
                    <div
                      className={`w-12 h-8 rounded bg-gradient-to-br ${card.imageGradient}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{card.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {card.bank}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
    <div className="relative h-32 md:h-44 rounded-2xl overflow-hidden shadow-xl border border-amber-400">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${card.imageGradient}`}
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute top-4 left-4 w-8 h-6 rounded-sm bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 shadow-inner">
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full opacity-60"></div>
      </div>
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white z-10"
      >
        <X className="w-3 h-3" />
      </button>
      {/* Card Network */}
      <div className="absolute top-4 right-10 text-[9px] font-bold text-white/80 bg-background px-2 rounded-lg">
        {card.network}
      </div>
      <div className="absolute bottom-3 left-3 right-3 text-white">
        <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-0.5">
          {card.bank}
        </p>
        <p className="text-[11px] md:text-sm font-serif font-bold leading-tight line-clamp-2">
          {card.name}
        </p>
      </div>
    </div>
  );
}

function ComparisonRow({ label, icon: Icon, values, highlight }: any) {
  const numericValues = values.map((v: any) => v.value);
  const bestValue =
    highlight === "highest"
      ? Math.max(...numericValues)
      : Math.min(...numericValues);

  return (
    <tr className="hover:bg-gold/[0.02] transition-colors">
      <td className="p-4 bg-black/20 md:bg-transparent">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-amber-400/40" />
          <span className="text-[11px] font-medium text-muted-foreground">
            {label}
          </span>
        </div>
      </td>
      {values.map((v: any, i: number) => (
        <td key={i} className="p-4 text-center">
          <div className="flex flex-col items-center">
            <span
              className={`text-xs font-bold ${v.value === bestValue ? "text-amber-400" : "text-foreground"}`}
            >
              {v.display}
            </span>
            {v.value === bestValue && (
              <Check className="w-2.5 h-2.5 text-amber-400 mt-1" />
            )}
          </div>
        </td>
      ))}
    </tr>
  );
}
