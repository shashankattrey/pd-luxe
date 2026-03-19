"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Script from "next/script";
import {
  ShieldCheck,
  Fingerprint,
  PhoneCall,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronLeft,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Truecaller?: {
      init: (config: {
        appKey: string;
        appDomain: string;
        callbackUrl: string;
        buttonColor?: string;
        buttonText?: string;
        buttonShape?: string;
      }) => void;
    };
  }
}

export default function LoginPage() {
  const [step, setStep] = useState<"choice" | "missed-call" | "success">(
    "choice",
  );
  const [phone, setPhone] = useState("");
  const MISSED_CALL_NUMBER = "+91804748XXXX"; // Replace with your provider number

  const handleTruecallerLogin = () => {
    if (window.Truecaller) {
      window.Truecaller.init({
        appKey: "ZFqYs3dba925ef19e4399bab05757b667696d", // From your dashboard
        appDomain: "pd-luxe.vercel.app",
        callbackUrl: "paisadekho-ai.paisadekhogroup.workers.dev/auth/callback",
        buttonColor: "#FBBF24",
        buttonText: "CONTINUE_WITH_TRUECALLER",
        buttonShape: "rounded",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-slate-200 font-sans flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px] -z-10" />

      {/* Header / Logo */}
      <Link
        href="/"
        className="absolute top-12 flex items-center gap-2 group mb-12"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
          <img src="/favicon.ico" alt="Logo" className="w-10 h-10 rounded-lg" />
        </div>
        <div className="flex flex-col">
          <span className="font-serif text-xl font-bold text-white leading-none tracking-tight">
            PaisaDekho
          </span>
          <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-[0.3em] mt-1">
            Luxe Intelligence
          </span>
        </div>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/50 backdrop-blur-2xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl relative z-10"
      >
        <AnimatePresence mode="wait">
          {step === "choice" && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="font-serif text-3xl font-bold text-white mb-2 italic">
                  Welcome Back
                </h2>
                <p className="text-slate-500 text-sm">
                  Access your sovereign wealth vault
                </p>
              </div>

              <div className="space-y-4">
                {/* Truecaller - Primary Free Method */}
                <Button
                  onClick={handleTruecallerLogin}
                  className="w-full h-14 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-500/10"
                >
                  {/* Replace the <img> tag with this */}
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <span className="text-[#0087FF] text-[10px] font-black">
                      T
                    </span>
                  </div>
                  One-Tap Verification
                </Button>

                <div className="relative py-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <span className="relative bg-[#0b0b0b] px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    or use phone
                  </span>
                </div>

                {/* Missed Call Fallback */}
                <div className="space-y-3">
                  <input
                    type="tel"
                    placeholder="+91 00000 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white placeholder:text-slate-600 focus:outline-none focus:border-yellow-400/50 transition-all"
                  />
                  <Button
                    disabled={!phone}
                    onClick={() => setStep("missed-call")}
                    className="w-full h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-2xl flex items-center justify-center gap-2"
                  >
                    <PhoneCall size={18} className="text-yellow-400" />
                    Verify via Missed Call
                  </Button>
                </div>
              </div>

              <p className="text-[10px] text-center text-slate-500 leading-relaxed uppercase tracking-widest font-medium">
                <ShieldCheck className="inline w-3 h-3 mr-1 text-yellow-400 mb-0.5" />
                Sovereign Data Protection Enabled
              </p>
            </motion.div>
          )}

          {step === "missed-call" && (
            <motion.div
              key="missed-call"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center space-y-8"
            >
              <button
                onClick={() => setStep("choice")}
                className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>

              <div className="space-y-4">
                <div className="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center mx-auto border border-yellow-400/20">
                  <PhoneCall className="text-yellow-400 w-8 h-8 animate-pulse" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-white">
                  Give a Missed Call
                </h3>
                <p className="text-slate-400 text-sm">
                  Tap the number below. The call will disconnect automatically
                  after 1 ring.
                </p>
              </div>

              <a
                href={`tel:${MISSED_CALL_NUMBER}`}
                className="block text-4xl font-serif font-bold text-white tracking-tighter hover:text-yellow-400 transition-colors py-4"
              >
                {MISSED_CALL_NUMBER}
              </a>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Awaiting Signal from Network...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="text-emerald-400 w-10 h-10" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-white italic">
                Identity Verified
              </h2>
              <p className="text-slate-400 text-sm">
                Welcome to the inner circle. Redirecting to your Luxe Vault...
              </p>
              <div className="pt-4">
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                    className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 text-center">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em]">
          Powered by Edge Biometrics • PD Finserve Pvt Ltd
        </p>
      </div>

      <Script
        src="https://sdk-cdn.truecaller.com/weblink/v2/sdk.js"
        strategy="beforeInteractive"
        onError={(e) => {
          console.error("Truecaller SDK failed to load", e);
        }}
      />
    </div>
  );
}
