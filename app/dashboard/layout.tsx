"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  LayoutDashboard,
  Search,
  Settings,
  Bot,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  Wallet,
  BarChart3,
  Bell,
  User,
  TrendingUp,
  Home,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ButlerCard } from "@/components/dashboard/ButlerCard";
import { calculateInDepthSavings } from "@/lib/credit-cards-data";

// ─── NAVIGATION ARCHITECTURE ──────────────────────────────────────────────────
//
// Product vision: smart financial advisor for credit cards + investments
//
// 4 bottom nav items (optimal per Apple HIG / Material Design):
//
//  1. Advisor   — The AI. Primary entry point. Upload statement, get card +
//                 investment recommendations in one unified flow.
//  2. My Money  — Personalised dashboard. My saved cards, my SIP portfolio,
//                 my reward earnings, my upcoming fee renewals.
//  3. Explore   — Browse mode. Card vault + fund explorer in one screen,
//                 with filters. Secondary to the advisor flow.
//  4. Settings  — Profile, preferences, notifications, account. Maintenance.
//                 Moved out of primary nav from the old "Profile" tab.
//
// Desktop sidebar adds power-user tools: Compare Lab, Alerts, Wealth deep-dive.
// Profile avatar in header corner (not a nav tab).
// ─────────────────────────────────────────────────────────────────────────────

// Mobile bottom nav — 5 items
// Settings lives in header avatar (top-right) — not a primary destination
// Wealth Advisor given equal slot to Cards Advisor — both are core to the product
const mobileNavItems = [
  {
    href: "/dashboard",
    icon: Home,
    label: "Home",
    activeClass: "text-amber-400 bg-amber-400/10",
  },
  {
    href: "/dashboard/advisor",
    icon: Sparkles,
    label: "Cards",
    activeClass: "text-amber-400 bg-amber-400/10",
  },
  {
    href: "/dashboard/wealth-advisor",
    icon: TrendingUp,
    label: "Wealth",
    activeClass: "text-emerald-400 bg-emerald-400/10",
  },
  {
    href: "/dashboard/card-vault",
    icon: Search,
    label: "Explore",
    activeClass: "text-amber-400 bg-amber-400/10",
  },
  {
    href: "/dashboard/my-money",
    icon: LayoutDashboard,
    label: "My Money",
    activeClass: "text-amber-400 bg-amber-400/10",
  },
];

// Desktop sidebar — full feature set
const desktopNavItems = [
  {
    group: "Core",
    items: [
      { href: "/dashboard", icon: Home, label: "Home", badge: null },
      {
        href: "/dashboard/advisor",
        icon: Sparkles,
        label: "Card Advisor",
        badge: null,
      },
      {
        href: "/dashboard/my-money",
        icon: LayoutDashboard,
        label: "My Money",
        badge: null,
      },
    ],
  },
  {
    group: "Cards",
    items: [
      {
        href: "/dashboard/card-vault",
        icon: Search,
        label: "Explore Cards",
        badge: null,
      },
      {
        href: "/dashboard/compare",
        icon: BarChart3,
        label: "Compare Cards",
        badge: null,
      },
    ],
  },
  {
    group: "Wealth",
    items: [
      {
        href: "/dashboard/wealth-advisor",
        icon: TrendingUp,
        label: "Wealth Advisor",
        badge: "NEW",
      },
      {
        href: "/dashboard/funds",
        icon: Wallet,
        label: "Fund Explorer",
        badge: null,
      },
    ],
  },
  {
    group: "Account",
    items: [
      { href: "/dashboard/alerts", icon: Bell, label: "Alerts", badge: null },
      {
        href: "/dashboard/settings",
        icon: Settings,
        label: "Settings",
        badge: null,
      },
    ],
  },
];

// Default spend profile for Luxe Butler card previews in chat
const DEFAULT_CHAT_SPEND = {
  food: 8000,
  shopping: 10000,
  travel: 5000,
  utilities: 3000,
  fuel: 2000,
  rent: 0,
  other: 5000,
  grocery: 0,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm Luxe Butler 👋\nI can help you find the best credit cards for your spending, build a SIP plan, or compare investment options.\n\nWhat would you like to explore today?",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages, chatOpen]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");

    try {
      const response = await fetch(
        "https://paisadekho-ai.paisadekhogroup.workers.dev",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMsg }),
        },
      );
      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection offline. Please check your network.",
        },
      ]);
    }
  };

  const parseButlerResponse = (content: unknown) => {
    try {
      if (typeof content !== "string") return content;
      const clean = content.replace(/```json\s*|```/g, "").trim();
      if (!clean.startsWith("[") && !clean.startsWith("{")) return content;
      const parsed = JSON.parse(clean);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return content;
    }
  };

  // Derive which top-level section is active for desktop group highlighting
  const activeGroup = desktopNavItems.find((g) =>
    g.items.some((i) => pathname.startsWith(i.href)),
  )?.group;

  return (
    <div className="min-h-screen bg-background flex w-full overflow-x-hidden">
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
      {!isMobile && (
        <motion.aside
          animate={{ width: sidebarCollapsed ? 72 : 256 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-0 top-0 bottom-0 z-50 border-r border-white/5 bg-background/95 backdrop-blur-xl flex flex-col overflow-hidden"
        >
          {/* Logo */}
          <Link
            href="/dashboard/advisor"
            className="flex items-center gap-3 px-4 py-5 border-b border-white/5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Wallet className="w-5 h-5 text-black" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <span className="font-serif text-base font-bold text-amber-400 whitespace-nowrap">
                    PaisaDekho
                  </span>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap -mt-0.5">
                    Smart Financial Advisor
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* Nav groups */}
          <nav className="flex-1 overflow-y-auto py-4 space-y-6 px-3">
            {desktopNavItems.map((group) => (
              <div key={group.group}>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold px-2 mb-2"
                    >
                      {group.group}
                    </motion.p>
                  )}
                </AnimatePresence>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-1",
                        isActive
                          ? "bg-amber-400/15 text-amber-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {/* Badge (e.g. "NEW") */}
                      {!sidebarCollapsed && item.badge && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                          {item.badge}
                        </span>
                      )}
                      {/* Active indicator dot when collapsed */}
                      {sidebarCollapsed && isActive && (
                        <span className="absolute left-0 w-1 h-6 bg-amber-400 rounded-r-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center p-4 border-t border-white/5 text-muted-foreground hover:text-amber-400 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </div>
            )}
          </button>
        </motion.aside>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <motion.div
        className="flex-1 flex flex-col min-h-screen"
        animate={{ marginLeft: isMobile ? 0 : sidebarCollapsed ? 72 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Top header — desktop only */}
        {!isMobile && (
          <header className="sticky top-0 z-40 h-14 border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6">
            {/* Breadcrumb-style page title */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-foreground font-medium capitalize">
                {pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
              </span>
            </div>
            {/* Header right: alerts + profile avatar */}
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-5 md:p-6 pb-28 md:pb-6">
          {children}
        </main>
      </motion.div>

      {/* ── MOBILE BOTTOM NAV — 4 items ────────────────────────────────── */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
          {/* Frosted glass bar */}
          <div className="mx-3 mb-3 bg-background/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 px-2 py-1.5 flex">
            {mobileNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all gap-0.5",
                    isActive ? item.activeClass : "text-muted-foreground",
                  )}
                >
                  {/* Icon with active scale */}
                  <motion.div
                    animate={{ scale: isActive ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <item.icon className="w-5 h-5" />
                  </motion.div>
                  <span
                    className={cn(
                      "text-[10px] font-medium leading-tight",
                      isActive ? "font-bold" : "",
                    )}
                  >
                    {item.label}
                  </span>
                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavDot"
                      className="w-1 h-1 rounded-full bg-amber-400"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LUXE BUTLER FAB ─────────────────────────────────────────────── */}
      {/* Only shown when chat is closed */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setChatOpen(true)}
            className="fixed bottom-24 right-5 z-50 w-13 h-13 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-center"
            style={{ width: 52, height: 52 }}
            aria-label="Open Luxe Butler AI"
          >
            <Bot className="w-6 h-6 text-black" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── LUXE BUTLER CHAT DRAWER ─────────────────────────────────────── */}
      <AnimatePresence>
        {chatOpen && (
          <>
            {/* Backdrop — visual only, pointer-events-none */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm pointer-events-none"
            />

            {/* Drawer — full height flex column with dynamic viewport height */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 200, damping: 28 }}
              className="fixed right-0 top-0 z-[60] w-full sm:max-w-[420px] flex flex-col border-l border-white/10 bg-background/95 backdrop-blur-2xl"
              style={{ height: "100dvh" }}
            >
              {/* Drawer header */}
              <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">
                      Luxe Butler
                    </h3>
                    <p className="text-[10px] text-emerald-400">
                      ● Online · Card + Investment AI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick prompt chips — shown only when no user messages yet */}
              {chatMessages.filter((m) => m.role === "user").length === 0 && (
                <div className="shrink-0 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none border-b border-white/5">
                  {[
                    "Best card for me",
                    "SIP plan ₹10k/mo",
                    "Infinia vs Magnus",
                    "Best ELSS fund",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setChatInput(prompt);
                        // auto-submit
                        setTimeout(() => {
                          const fakeEvent = {
                            preventDefault: () => {},
                          } as React.FormEvent;
                          setChatMessages((prev) => [
                            ...prev,
                            { role: "user", content: prompt },
                          ]);
                          setChatInput("");
                          // actual API call would fire here via handleChatSubmit
                        }, 50);
                      }}
                      className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:text-amber-400 hover:border-amber-400/30 transition-all whitespace-nowrap"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Messages — flex-1 + overflow-y-auto — min-h-0 is critical */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scroll-smooth p-4 space-y-3 min-h-0"
              >
                {chatMessages.map((msg, i) => {
                  const parsed = parseButlerResponse(msg.content);
                  const isCardList = Array.isArray(parsed);

                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex",
                        msg.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      {isCardList ? (
                        <div className="w-full space-y-3">
                          {(parsed as any[]).map(
                            (cardData: any, idx: number) => {
                              const audit = calculateInDepthSavings(
                                cardData,
                                DEFAULT_CHAT_SPEND,
                                0.5,
                              );
                              return (
                                <ButlerCard
                                  key={idx}
                                  name={cardData.card_name || cardData.name}
                                  issuer={cardData.issuer || cardData.bank}
                                  benefit={`${audit.yield}% Net Yield`}
                                  score={audit.yield >= 3 ? "9.8" : "8.2"}
                                  pros={[
                                    `₹${audit.netValue.toLocaleString()} Net Value`,
                                    `₹${audit.loungeValue.toLocaleString()} Lounge`,
                                  ]}
                                  alerts={
                                    cardData.notes_tnc || "Verified for 2026"
                                  }
                                  audit={audit}
                                />
                              );
                            },
                          )}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                            msg.role === "user"
                              ? "bg-amber-500 text-black font-medium rounded-br-sm"
                              : "bg-white/5 border border-white/10 text-foreground rounded-bl-sm",
                          )}
                        >
                          {/* Render newlines */}
                          {typeof parsed === "string"
                            ? parsed.split("\n").map((line, j) => (
                                <span key={j}>
                                  {line}
                                  {j < parsed.split("\n").length - 1 && <br />}
                                </span>
                              ))
                            : msg.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Input bar */}
              <form
                onSubmit={handleChatSubmit}
                className="shrink-0 flex gap-2 px-4 py-3 border-t border-white/5"
              >
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about cards or investments…"
                  className="flex-1 bg-white/5 border-white/10 focus:border-amber-400/50 text-sm transition-all rounded-xl"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!chatInput.trim()}
                  className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black rounded-xl disabled:opacity-40 transition-all"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
