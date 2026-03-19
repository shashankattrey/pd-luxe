"use client";

import React, { useEffect } from "react";
import Script from "next/script";
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
      login: () => void;
    };
  }
}

export default function LoginPage() {
  // Configure your Truecaller button
  const handleTruecallerLogin = () => {
    if (window.Truecaller) {
      window.Truecaller.init({
        appKey: process.env.NEXT_PUBLIC_TRUE_APP_KEY!,
        appDomain: window.location.origin,
        callbackUrl: `${process.env.NEXT_PUBLIC_TRUE_CALLBACK_URL}/auth/callback`,
        buttonColor: "#0087FF",
        buttonText: "Continue with Truecaller",
        buttonShape: "rounded",
      });
      window.Truecaller.login(); // Launch Truecaller login
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome to PaisaDekho</h1>
      <p className="text-gray-400 mb-8 text-center">
        One-tap login with your phone using Truecaller
      </p>

      <Button
        onClick={handleTruecallerLogin}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
      >
        Continue with Truecaller
      </Button>

      {/* Load Truecaller SDK */}
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
