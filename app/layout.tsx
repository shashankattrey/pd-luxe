import type { Metadata, Viewport } from "next";
import { Figtree, Playfair_Display } from "next/font/google"; // Swapped Inter for Figtree
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Providers from "./providers";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree", // Set variable to figtree
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PaisaDekho Luxe | 2026 Intelligent Wealth manager",
  description:
    "The 2026 Intelligence Layer for Your Wallet. Optimize your investments, credit cards with AI-powered insights for the Indian market.",
  generator: "PD Finserve Pvt Ltd",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {/* 1. Included figtree.variable
          2. Explicitly added 'font-sans' to the body 
      */}
      <body
        className={`${figtree.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
