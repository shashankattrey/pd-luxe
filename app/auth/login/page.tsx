"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldCheck, PhoneCall, ChevronLeft } from "lucide-react";

const APP_KEY = "ZFqYs3dba925ef19e4399bab05757b667696d";
const APP_NAME = "PaisaDekho";
const PRIVACY_URL = encodeURIComponent("https://pd-luxe.vercel.app/privacy");
const TERMS_URL = encodeURIComponent("https://pd-luxe.vercel.app/terms");

export default function LoginPage() {
  const [step, setStep] = useState<"choice" | "otp">("choice");
  const [phone, setPhone] = useState("");
  const [canUseTruecaller, setCanUseTruecaller] = useState(false);

  // Detect if Truecaller is installed
  useEffect(() => {
    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      const requestNonce = Math.random().toString(36).substring(2, 12);
      const deepLink = `truecallersdk://truesdk/web_verify?type=btmsheet&requestNonce=${requestNonce}&partnerKey=${APP_KEY}&partnerName=${APP_NAME}&lang=en`;

      let hidden = document.createElement("iframe");
      hidden.style.display = "none";
      hidden.src = deepLink;
      document.body.appendChild(hidden);

      let isInstalled = true;

      const timer = setTimeout(() => {
        // If user is still on page after 1.5s, app not installed
        if (isInstalled) setCanUseTruecaller(false);
      }, 1500);

      const visibilityChange = () => {
        // If page becomes hidden, Truecaller likely opened
        isInstalled = false;
        setCanUseTruecaller(true);
        clearTimeout(timer);
      };

      document.addEventListener("visibilitychange", visibilityChange);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", visibilityChange);
        document.body.removeChild(hidden);
      };
    }
  }, []);

  const handleTruecallerLogin = () => {
    const requestNonce = Math.random().toString(36).substring(2, 12);
    const deepLink = `truecallersdk://truesdk/web_verify?type=btmsheet&requestNonce=${requestNonce}&partnerKey=${APP_KEY}&partnerName=${APP_NAME}&lang=en&privacyUrl=${PRIVACY_URL}&termsUrl=${TERMS_URL}&loginPrefix=getstarted&loginSuffix=login&ctaPrefix=continuewith&ctaColor=%23FBBF24&ctaTextColor=%23020202&btnShape=round&skipOption=useanothermethod&ttl=15000`;

    window.location.href = deepLink;
  };

  return (
    <div className="min-h-screen bg-[#020202] text-slate-200 flex flex-col justify-center items-center p-6">
      <Link href="/" className="absolute top-12 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center">
          <img src="/favicon.ico" alt="Logo" className="w-10 h-10 rounded-lg" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white">PaisaDekho</span>
          <span className="text-yellow-400 text-[10px] uppercase">
            Luxe Intelligence
          </span>
        </div>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/50 backdrop-blur-2xl border border-white/5 p-10 rounded-[2.5rem]"
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
              <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
              <p className="text-slate-500 text-sm">
                Access your sovereign wealth vault
              </p>

              <div className="space-y-4">
                {canUseTruecaller && (
                  <Button
                    onClick={handleTruecallerLogin}
                    className="w-full h-14 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-2xl flex items-center justify-center gap-3"
                  >
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <span className="text-[#0087FF] text-[10px] font-black">
                        T
                      </span>
                    </div>
                    One-Tap Verification
                  </Button>
                )}

                <div className="relative py-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <span className="relative bg-[#0b0b0b] px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    or use phone
                  </span>
                </div>

                <div className="space-y-3">
                  <input
                    type="tel"
                    placeholder="+91 00000 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white placeholder:text-slate-600"
                  />
                  <Button
                    disabled={!phone}
                    onClick={() => setStep("otp")}
                    className="w-full h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-2xl"
                  >
                    <PhoneCall size={18} className="text-yellow-400" />
                    Verify via OTP
                  </Button>
                </div>
              </div>

              <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest font-medium">
                <ShieldCheck className="inline w-3 h-3 mr-1 text-yellow-400 mb-0.5" />
                Sovereign Data Protection Enabled
              </p>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center space-y-8"
            >
              <button
                onClick={() => setStep("choice")}
                className="text-[10px] text-slate-500 uppercase tracking-widest"
              >
                <ChevronLeft size={14} /> Back
              </button>
              <h3 className="text-white text-2xl font-bold">Enter OTP</h3>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
