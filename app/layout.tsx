import type { Metadata, Viewport } from "next";
import { Figtree, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { UserProvider } from "./providers/UserProvider";
import ClientOnly from "./providers/ClientOnly";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
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
    "Optimize your investments & credit cards with AI-powered insights.",
  generator: "PD Finserve Pvt Ltd",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${figtree.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}
      >
        <UserProvider>
          <ClientOnly>
            {children} {/* All dashboard content will render client-side */}
          </ClientOnly>
        </UserProvider>
        <Analytics />
      </body>
    </html>
  );
}
