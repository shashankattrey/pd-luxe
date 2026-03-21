import { NextResponse } from "next/server";

export const revalidate = 300;

async function fetchYahoo(symbol: string) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
      },
    );

    const data = await res.json();

    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta) return null;

    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose || meta.previousClose || price;

    return {
      price,
      changePct: prev ? ((price - prev) / prev) * 100 : 0,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const [nifty, sensex, gold, usd] = await Promise.all([
      fetchYahoo("^NSEI"),
      fetchYahoo("^BSESN"),
      fetchYahoo("GC=F"),
      fetchYahoo("INR=X"),
    ]);

    const usdInr = usd?.price ?? 83;

    const goldInr = gold?.price ? (gold.price * usdInr) / 31.1035 : 8200;

    return NextResponse.json({
      equity: {
        nifty50: {
          value: nifty?.price ?? 22400,
          changePct: nifty?.changePct ?? 0,
        },
        sensex: {
          value: sensex?.price ?? 73800,
          changePct: sensex?.changePct ?? 0,
        },
      },
      gold: {
        price24k: Math.round(goldInr),
        price22k: Math.round(goldInr * 0.916),
      },
      macro: {
        usdInr,
        fetchedAt: new Date().toISOString(),
        stale: false, // IMPORTANT
      },
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        equity: {},
        gold: {},
        macro: {
          usdInr: 83,
          fetchedAt: new Date().toISOString(),
          stale: true,
        },
      },
      { status: 200 }, // DON'T THROW 500
    );
  }
}
