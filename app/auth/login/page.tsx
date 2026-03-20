"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldCheck, PhoneCall } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

const APP_KEY = "ZFqYs3dba925ef19e4399bab05757b667696d";
const APP_NAME = "PaisaDekho";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone/i.test(navigator.userAgent));
  }, []);

  // ✅ Google Login

  // ✅ Truecaller Deep Link
  const handleTruecallerLogin = () => {
    const requestNonce = Math.random().toString(36).substring(2, 12);

    const deepLink = `truecallersdk://truesdk/web_verify?type=btmsheet&requestNonce=${requestNonce}&partnerKey=${APP_KEY}&partnerName=${APP_NAME}&lang=en&loginPrefix=getstarted&loginSuffix=login&ctaPrefix=continuewith&ctaColor=%23FBBF24&ctaTextColor=%23020202&btnShape=round&ttl=15000`;

    window.location.href = deepLink;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute w-[600px] h-[600px] bg-yellow-500/10 blur-[140px] rounded-full" />

      {/* Logo */}
      <Link href="/" className="absolute top-10 flex items-center gap-2">
        <img src="/favicon.ico" className="w-10 h-10 rounded-lg" />
        <div>
          <p className="font-bold">PaisaDekho</p>
          <p className="text-[10px] text-yellow-400 tracking-widest uppercase">
            Luxe Intelligence
          </p>
        </div>
      </Link>

      {/* Card */}
      <div className="p-[1px] rounded-[2.5rem] bg-gradient-to-br from-yellow-400/20 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-[380px] bg-zinc-900/70 backdrop-blur-2xl p-10 rounded-[2.5rem]"
        >
          <h2 className="text-3xl font-serif italic mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm mb-8">
            Access your sovereign wealth vault
          </p>

          {/* Google */}
          <Button
            onClick={() => {
              window.location.href =
                "https://paisadekho-ai.paisadekhogroup.workers.dev/auth/google";
            }}
            className="w-full h-14 bg-white text-black rounded-2xl flex items-center justify-center gap-3 hover:shadow-xl transition"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              className="w-5 h-5"
            />
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="my-6 text-center text-xs text-gray-500 uppercase">
            or continue with
          </div>

          {/* Truecaller */}
          {isMobile && (
            <Button
              onClick={handleTruecallerLogin}
              className="w-full h-14 bg-[#0087FF] text-white rounded-2xl flex items-center justify-center gap-3"
            >
              <span className="bg-white text-[#0087FF] px-2 py-1 rounded-full text-xs font-bold">
                T
              </span>
              One-Tap Verification
            </Button>
          )}

          {/* Phone fallback */}
          <div className="mt-6 space-y-3">
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5"
            />

            <Button
              disabled={!phone}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl"
            >
              <PhoneCall size={16} className="mr-2" />
              Continue with OTP
            </Button>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-center text-gray-500 mt-6 uppercase tracking-widest">
            <ShieldCheck className="inline w-3 h-3 mr-1 text-yellow-400" />
            Sovereign Data Protection
          </p>
        </motion.div>
      </div>
    </div>
  );
}
