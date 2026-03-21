import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Helper: Finds the raw price in history closest to the target date
function getNavAtDate(history: any[], targetDate: Date): number | null {
  const targetTs = targetDate.getTime();
  let closestNav: number | null = null;
  let minDiff = Infinity;

  // We need to look through the WHOLE history to find 3yr/5yr dates
  for (const entry of history) {
    const [d, m, y] = entry.date.split("-").map(Number);
    const entryDate = new Date(y, m - 1, d);
    const entryTs = entryDate.getTime();

    const diff = Math.abs(targetTs - entryTs);

    // If this entry is closer to our target date (e.g., 3 years ago) than the last one we saw
    if (diff < minDiff) {
      minDiff = diff;
      closestNav = parseFloat(entry.nav);
    }

    // Optimization: If we found a date within 3 days of our target, that's good enough (covers weekends)
    if (diff < 3 * 24 * 60 * 60 * 1000) {
      break;
    }

    // Safety: If we've passed the target date by more than 30 days and haven't found it, it doesn't exist
    if (entryTs < targetTs - 30 * 24 * 60 * 60 * 1000) break;
  }

  return closestNav && closestNav > 0 ? closestNav : null;
}

export async function GET(req: Request) {
  const startTime = Date.now();
  const { searchParams } = new URL(req.url);

  // Use query params: /api/cron/sync?limit=50&offset=0
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const masterRes = await fetch("https://api.mfapi.in/mf", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const allAvailable = await masterRes.json();

    const filtered = allAvailable.filter(
      (f: any) =>
        f.schemeName.toLowerCase().includes("direct") &&
        f.schemeName.toLowerCase().includes("growth"),
    );

    // Only process the specific slice requested
    const batch = filtered.slice(offset, offset + limit);

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const ago = (yrs: number) =>
      new Date(now.getTime() - yrs * 365 * 24 * 60 * 60 * 1000);

    let added = 0;
    console.log(
      `🚀 Syncing Batch: ${offset} to ${offset + limit} (Total: ${filtered.length})`,
    );

    for (const fund of batch) {
      try {
        const res = await fetch(`https://api.mfapi.in/mf/${fund.schemeCode}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
          cache: "no-store",
          signal: AbortSignal.timeout(8000), // 8s timeout per fund fetch
        });

        const details = await res.json();
        if (!details?.data?.length) continue;

        const history = details.data;
        const [d, m, y] = history[0].date.split("-").map(Number);
        const lastNavDate = new Date(y, m - 1, d);

        if (lastNavDate < sixMonthsAgo) continue;

        const currentNav = parseFloat(history[0].nav);
        const n1y = getNavAtDate(history, ago(1));
        const n3y = getNavAtDate(history, ago(3));
        const n5y = getNavAtDate(history, ago(5));

        await prisma.mutualFund.upsert({
          where: { schemeCode: Number(fund.schemeCode) },
          update: {
            nav: currentNav,
            navDate: history[0].date,
            nav1y: n1y,
            nav3y: n3y,
            nav5y: n5y,
            lastUpdated: new Date(),
          },
          create: {
            schemeCode: Number(fund.schemeCode),
            schemeName: details.meta.scheme_name,
            amcName: details.meta.fund_house,
            category: details.meta.scheme_category,
            nav: currentNav,
            navDate: history[0].date,
            nav1y: n1y,
            nav3y: n3y,
            nav5y: n5y,
            riskLevel: "High",
          },
        });

        added++;
        await new Promise((r) => setTimeout(r, 150)); // Slightly faster delay
      } catch (e) {
        console.error(`❌ Failed: ${fund.schemeCode}`);
      }
    }

    return NextResponse.json({
      success: true,
      added,
      totalProcessedSoFar: offset + batch.length,
      hasMore: offset + limit < filtered.length,
      nextOffset: offset + limit,
      duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
