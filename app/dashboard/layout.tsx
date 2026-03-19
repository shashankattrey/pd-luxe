"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Home,
  CreditCard,
  Bot,
  BarChart3,
  MessageCircle,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  ChartBar,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ButlerCard } from "@/components/dashboard/ButlerCard";
import { calculateInDepthSavings } from "@/lib/credit-cards-data";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/card-vault", icon: CreditCard, label: "Card Vault" },
  { href: "/dashboard/advisor", icon: Bot, label: "AI Advisor" },
  { href: "/dashboard/compare", icon: BarChart3, label: "Comparison Lab" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
  {
    href: "/dashboard/wealth-advisor",
    icon: ChartBar,
    label: "Wealth Advisor",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to Luxe Butler! I've analyzed 93 Indian cards for 2026. How can I help?",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e: any) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: any) => {
    const touchEnd = e.changedTouches[0].clientX;

    if (touchEnd - touchStart > 80) {
      setMobileMenuOpen(true);
    }
  };

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
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection offline. Please check your network.",
        },
      ]);
    }
  };

  const parseButlerResponse = (content: any) => {
    try {
      if (typeof content !== "string") return content;
      const cleanJson = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return content;
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-background flex w-full overflow-x-hidden"
    >
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-amber-400"
        >
          <X />
        </button>
      )}
      {/* SIDEBAR */}
      {!isMobile && (
        <motion.aside
          animate={{ width: sidebarCollapsed ? 80 : 260 }}
          className="fixed left-0 top-0 bottom-0 z-50 glass-amber-400 border-r border-gold/10 p-4 flex flex-col"
        >
          {isMobile && mobileMenuOpen && (
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
          )}
          <Link href="/dashboard" className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center shadow-lg shadow-gold/20">
              <Wallet className="w-6 h-6 text-background" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-serif text-lg font-semibold text-amber-400">
                PaisaDekho
              </span>
            )}
          </Link>
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                  pathname === item.href
                    ? "bg-gold/20 text-amber-400 shadow-inner shadow-gold/10"
                    : "text-muted-foreground hover:text-amber-400",
                )}
              >
                <item.icon className="w-5 h-5" />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-3 text-muted-foreground hover:text-amber-400"
          >
            {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </motion.aside>
      )}

      {/* MAIN CONTENT */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "md:ml-20" : "md:ml-[260px]",
        )}
      >
        <main className="p-4 sm:p-5 md:p-6">{children}</main>
        {isMobile && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md glass-gold border border-gold/20 rounded-2xl px-2 py-2 flex justify-between shadow-2xl"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all",
                  pathname === item.href
                    ? "text-amber-400 bg-gold/10"
                    : "text-muted-foreground hover:text-amber-400",
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] mt-1 font-medium">
                  {item.label}
                </span>
              </Link>
            ))}
          </motion.div>
        )}
      </div>

      {/* CHAT TRIGGER */}
      <motion.button
        onClick={() => setChatOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
        className={cn(
          "fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-500 text-background shadow-[0_0_25px_rgba(212,175,55,0.5)] flex items-center justify-center",
          chatOpen && "opacity-0",
        )}
      >
        <Bot className="w-6 h-6" />
      </motion.button>

      {/* CHAT DRAWER */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 25 }}
              onClick={() => setChatOpen(false)}
              className="fixed inset-0 z-50 bg-background/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-md"
            >
              <div className="p-4 border-b border-gold/20 flex justify-between items-center bg-black/40">
                <div className="flex items-center gap-3">
                  <Bot className="text-amber-400 animate-pulse" />
                  <h3 className="font-serif font-bold tracking-wide">
                    Luxe Butler AI
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChatOpen(false)}
                  className="hover:bg-gold/10"
                >
                  <X />
                </Button>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scroll-smooth p-4 space-y-4 bg-gradient-to-b from-transparent to-black/20"
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
                        <div className="w-full sm:w-[95%] space-y-4">
                          {parsed.map((cardData: any, idx: number) => {
                            const audit = calculateInDepthSavings(
                              cardData,
                              cardData.user_spend_context || 400000,
                            );
                            return (
                              <ButlerCard
                                key={idx}
                                name={cardData.card_name || cardData.name}
                                issuer={cardData.issuer || cardData.bank}
                                benefit={`${audit.yield}% Net Yield`}
                                score={audit.yield >= 3 ? "9.8" : "8.2"}
                                pros={[
                                  `₹${audit.netValue.toLocaleString()} Net Profit`,
                                  `₹${audit.convenienceSavings.toLocaleString()} Lounge Value`,
                                ]}
                                alerts={
                                  cardData.notes_tnc || "Verified for 2026"
                                }
                                audit={audit}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md",
                            msg.role === "user"
                              ? "bg-gold text-background font-medium"
                              : "glass border border-gold/20 text-foreground",
                          )}
                        >
                          {msg.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleChatSubmit}
                className="p-3 sm:p-4 border-t border-gold/20 flex gap-2"
              >
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about Infinia vs Magnus..."
                  className="flex-1 bg-white/5 border-gold/20 focus:border-gold transition-all"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-gold text-background hover:bg-amber-500 transition-colors"
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
