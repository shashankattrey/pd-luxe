"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const handleTruecallerLogin = () => {
    const requestId = Math.random().toString(36).substring(2, 12); // 10-char unique nonce
    const appKey = "ZFqYs3dba925ef19e4399bab05757b667696d"; // same as in Cloudflare worker
    const appName = "PaisaDekho";
    const privacyUrl = encodeURIComponent("https://pd-luxe.vercel.app/privacy");
    const termsUrl = encodeURIComponent("https://pd-luxe.vercel.app/terms");

    const deepLink = `
      truecallersdk://truesdk/web_verify?
      type=btmsheet
      &requestNonce=${requestId}
      &partnerKey=${appKey}
      &partnerName=${appName}
      &lang=en
      &privacyUrl=${privacyUrl}
      &termsUrl=${termsUrl}
      &loginPrefix=getstarted
      &loginSuffix=login
      &ctaPrefix=continuewith
      &ctaColor=%23FBBF24
      &ctaTextColor=%23020202
      &btnShape=round
      &skipOption=useanothermethod
      &ttl=15000
    `;

    window.location.href = deepLink.replace(/\s/g, "");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <Button onClick={handleTruecallerLogin}>Continue with Truecaller</Button>
    </div>
  );
}
