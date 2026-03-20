// app/api/market/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-side Route Handler — runs on Node.js, never exposes API keys to browser.
// Called by useMarketData hook on the client.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { fetchMarketSnapshot } from "@/lib/market-data";

// Cache the in-flight promise so concurrent requests share one fetch
let inflight: Promise<Response> | null = null;
let lastFetched = 0;
const CACHE_MS = 5 * 60 * 1000; // 5 minutes — matches TTL.REALTIME

export async function GET() {
  const now = Date.now();

  // Reuse cached response if still fresh
  if (inflight && now - lastFetched < CACHE_MS) {
    return inflight;
  }

  lastFetched = now;

  inflight = (async () => {
    try {
      const snapshot = await fetchMarketSnapshot();
      return NextResponse.json(snapshot, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      });
    } catch (err) {
      console.error("[/api/market] fetchMarketSnapshot failed:", err);
      return NextResponse.json(
        { error: "Market data unavailable", stale: true },
        { status: 503 },
      );
    }
  })();

  return inflight;
}

// ─── Individual category endpoints (optional, for granular fetching) ──────────
// /api/market?category=crypto  →  returns only crypto slice
// This avoids fetching all 8 categories when you only need one.

export async function POST(req: Request) {
  try {
    const { category } = await req.json();
    const snapshot = await fetchMarketSnapshot();

    const slice: Record<string, unknown> = {
      fetchedAt: snapshot.fetchedAt,
      stale: snapshot.stale,
    };

    const allowed = [
      "equity",
      "mutualFunds",
      "fixedIncome",
      "govtSchemes",
      "reits",
      "gold",
      "crypto",
      "macro",
    ] as const;

    if (category && allowed.includes(category)) {
      slice[category] = snapshot[category as keyof typeof snapshot];
    } else {
      return NextResponse.json({ error: "Unknown category" }, { status: 400 });
    }

    return NextResponse.json(slice);
  } catch (err) {
    console.error("[/api/market POST]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
