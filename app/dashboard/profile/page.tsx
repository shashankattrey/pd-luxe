"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon, // Renamed to avoid conflict with User type
  Building2,
  Plus,
  Trash2,
  ShieldCheck,
  TrendingUp,
  Wallet,
  X,
  Loader2, // Added for loading state
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatementUpload from "@/components/StatementUpload";
import { useUser } from "@/context/UserContext"; // Update this path to your context file

interface LinkedAccount {
  id: number;
  bankName: string;
  accountType: string;
  lastFour: string;
  monthlySpend: number;
  rawParsedData?: any;
}

export default function ProfilePage() {
  const { user, isLoading } = useUser(); // 👈 Consume the context
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [accounts, setAccounts] = useState<LinkedAccount[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("paisa_linked_accounts");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const addAccount = (parsedData: any) => {
    const newAccount: LinkedAccount = {
      id: Date.now(),
      bankName: parsedData.bank_name || "Unknown Bank",
      accountType: parsedData.account_type || "Savings Account",
      lastFour: parsedData.account_number?.slice(-4) || "0000",
      monthlySpend: Math.round(parsedData.summary?.total_debits || 0),
      rawParsedData: parsedData,
    };

    const updated = [...accounts, newAccount];
    setAccounts(updated);
    localStorage.setItem("paisa_linked_accounts", JSON.stringify(updated));
    setIsUploadOpen(false);
  };

  const removeAccount = (id: number) => {
    const updated = accounts.filter((acc) => acc.id !== id);
    setAccounts(updated);
    localStorage.setItem("paisa_linked_accounts", JSON.stringify(updated));
  };

  const totalAggregatedSpend = accounts.reduce(
    (sum, acc) => sum + acc.monthlySpend,
    0,
  );

  // Show a loading spinner while fetching user data
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 animate-in fade-in duration-700">
      {/* ─── Profile Header ─── */}
      <section className="relative overflow-hidden bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] -z-10" />
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-200 p-1">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <UserIcon size={40} className="text-amber-400" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-7 h-7 rounded-full border-4 border-black flex items-center justify-center">
              <ShieldCheck size={14} className="text-white" />
            </div>
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-serif font-bold text-white mb-1">
              {/* 👈 Dynamic User Name */}
              {user?.name || "Anonymous User"}
            </h1>
            <p className="text-sm text-muted-foreground mb-2">
              {/* 👈 Dynamic Email */}
              {user?.email}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
              <span className="text-[10px] bg-amber-400/10 text-amber-400 px-3 py-1 rounded-full border border-amber-400/20 font-bold uppercase tracking-widest">
                Verified Member
              </span>
              <span className="text-[10px] bg-white/5 text-muted-foreground px-3 py-1 rounded-full border border-white/10 font-bold uppercase tracking-widest">
                Tier 1
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6 px-2">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Financial Vault
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage your linked bank statements
                </p>
              </div>
              <Button
                onClick={() => setIsUploadOpen(true)}
                className="bg-amber-400 text-black hover:bg-amber-300 rounded-xl gap-2 font-bold"
              >
                <Plus size={16} /> Add New
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {accounts.length === 0 ? (
                  <motion.div className="p-16 rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center bg-white/[0.01]">
                    <Building2 className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground text-sm">
                      Your vault is empty. Link a statement to start.
                    </p>
                  </motion.div>
                ) : (
                  accounts.map((acc) => (
                    <motion.div
                      layout
                      key={acc.id}
                      className="group flex items-center justify-between p-5 rounded-[1.5rem] bg-white/5 border border-white/10 hover:border-amber-400/30 transition-all"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400">
                          <Building2 size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">
                            {acc.bankName}
                          </p>
                          <p className="text-[11px] text-muted-foreground uppercase">
                            •••• {acc.lastFour} | {acc.accountType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">
                            Monthly Spend
                          </p>
                          <p className="font-serif font-bold text-amber-400">
                            ₹{acc.monthlySpend.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeAccount(acc.id)}
                          className="p-2.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-xl"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-600 text-black shadow-2xl relative overflow-hidden group">
            <h4 className="font-bold text-xs uppercase opacity-70 mb-1">
              Total Monthly Power
            </h4>
            <p className="text-4xl font-serif font-black">
              ₹{totalAggregatedSpend.toLocaleString()}
            </p>
            <Wallet className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10" />
          </div>
          <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-400" /> Optimization
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {accounts.length > 0
                ? "Your profile is active. Use the AI Advisor to find better cards."
                : "Link accounts to unlock optimization scores."}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setIsUploadOpen(false)}
                className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-white bg-white/5 rounded-full"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-serif font-bold text-white mb-6">
                Link Bank Statement
              </h2>
              <StatementUpload onDataParsed={addAccount} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
