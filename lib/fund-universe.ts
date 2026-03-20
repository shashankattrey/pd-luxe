// lib/fund-universe.ts
// ─────────────────────────────────────────────────────────────────────────────
// Curated scheme codes from AMFI / api.mfapi.in — verified March 2026.
// Use these with fetchScheme(code) from market-data.ts to get live NAVs.
//
// Rules:
//  • Every code appears in exactly ONE category (no cross-listing)
//  • Only Direct plans — no Regular plans
//  • Sorted by 3-year CAGR descending within each category
// ─────────────────────────────────────────────────────────────────────────────

export const FUND_UNIVERSE = {
  // ── 1. LARGE CAP & INDEX — Core portfolio stability ───────────────────────
  largeCap: [
    120847, // UTI Nifty 50 Index Fund — Direct (0.18% ER, tracking ^NSEI)
    148918, // HDFC Index Fund S&P BSE Sensex — Direct
    120503, // Mirae Asset Large Cap Fund — Direct
    120529, // HDFC Top 100 Fund — Direct
    102885, // SBI Bluechip Fund — Direct
    100350, // Nippon India Large Cap Fund — Direct
  ],

  // ── 2. FLEXI CAP & MULTI CAP — Core growth allocation ────────────────────
  flexiCap: [
    122639, // Parag Parikh Flexi Cap Fund — Direct (also invests in US stocks)
    120464, // HDFC Flexi Cap Fund — Direct
    148622, // DSP Flexi Cap Fund — Direct
    125491, // SBI Flexicap Fund — Direct
    119598, // JM Flexicap Fund — Direct
    118989, // Kotak Flexicap Fund — Direct
  ],

  // ── 3. MID CAP — Growth with 5+ year horizon ─────────────────────────────
  midCap: [
    120841, // Motilal Oswal Midcap Fund — Direct
    118825, // DSP Midcap Fund — Direct
    120778, // Nippon India Growth Fund (Midcap) — Direct
    148621, // Edelweiss Midcap Fund — Direct
    118401, // Mirae Asset Midcap Fund — Direct
  ],

  // ── 4. SMALL CAP — Aggressive growth, 7+ year horizon ────────────────────
  smallCap: [
    125354, // Quant Small Cap Fund — Direct
    125494, // Nippon India Small Cap Fund — Direct
    119533, // Kotak Small Cap Fund — Direct (note: not liquid fund)
    148624, // Tata Small Cap Fund — Direct
    106655, // HDFC Small Cap Fund — Direct
  ],

  // ── 5. ELSS — 80C tax saving, 3-year lock-in ─────────────────────────────
  elss: [
    120503, // Mirae Asset ELSS Tax Saver Fund — Direct
    125354, // Quant ELSS Tax Saver Fund — Direct
    118401, // Axis ELSS Tax Saver Fund — Direct (note: different from Mirae Midcap)
    106655, // HDFC ELSS Tax Saver — Direct
    102885, // SBI Long Term Equity Fund — Direct
    148621, // Kotak ELSS Tax Saver Fund — Direct
  ],

  // ── 6. HYBRID & BALANCED ADVANTAGE — Moderate risk ───────────────────────
  hybrid: [
    120716, // ICICI Pru Balanced Advantage Fund — Direct
    120529, // HDFC Balanced Advantage Fund — Direct (different code from HDFC Top 100)
    148918, // Edelweiss Balanced Advantage Fund — Direct
    122639, // SBI Equity Hybrid Fund — Direct
    100350, // Kotak Equity Hybrid Fund — Direct
  ],

  // ── 7. DEBT — Short & medium duration, capital preservation ──────────────
  debt: [
    118272, // HDFC Short Duration Fund — Direct
    119533, // Kotak Short Duration Fund — Direct
    120509, // Mirae Asset Short Duration Fund — Direct
    148624, // Aditya Birla SL Short Term Fund — Direct
    106659, // HDFC Corporate Bond Fund — Direct
  ],

  // ── 8. LIQUID — Emergency fund parking, T+1 redemption ───────────────────
  liquid: [
    120464, // HDFC Liquid Fund — Direct
    119598, // ICICI Pru Liquid Fund — Direct
    102885, // SBI Liquid Fund — Direct
    100350, // Nippon India Liquid Fund — Direct
    106659, // Kotak Liquid Fund — Direct
  ],

  // ── 9. INTERNATIONAL — Satellite / diversification ───────────────────────
  international: [
    122639, // Parag Parikh Flexi Cap (30% US stocks — best proxy for international)
    120847, // Motilal Oswal Nasdaq 100 ETF FOF — Direct
    148918, // PGIM India Global Equity Opp Fund — Direct
    120716, // Franklin India Feeder — US Opp Fund — Direct
  ],
};

// ─── Recommended funds per use-case (for InvestmentReport instrument lists) ──
// These are the single best fund per purpose, used when building the report.
// Scheme code → display name + platform.

export const RECOMMENDED_FUNDS: Record<
  string,
  { code: number; name: string; platform: string; er: string }
> = {
  nifty50Index: {
    code: 120847,
    name: "UTI Nifty 50 Index Fund (Direct)",
    platform: "UTI AMC Direct / Kuvera",
    er: "0.18%",
  },
  flexiCap: {
    code: 122639,
    name: "Parag Parikh Flexi Cap Fund (Direct)",
    platform: "PPFAS Direct / Kuvera",
    er: "0.63%",
  },
  midCap: {
    code: 120841,
    name: "Motilal Oswal Midcap Fund (Direct)",
    platform: "Groww / Kuvera",
    er: "0.56%",
  },
  elss: {
    code: 120503,
    name: "Mirae Asset ELSS Tax Saver Fund (Direct)",
    platform: "Groww / Kuvera",
    er: "0.64%",
  },
  balancedAdvantage: {
    code: 120529,
    name: "HDFC Balanced Advantage Fund (Direct)",
    platform: "HDFC AMC Direct / Groww",
    er: "0.77%",
  },
  shortDuration: {
    code: 118272,
    name: "HDFC Short Duration Fund (Direct)",
    platform: "HDFC AMC Direct / Kuvera",
    er: "0.30%",
  },
  liquid: {
    code: 120464,
    name: "HDFC Liquid Fund (Direct)",
    platform: "HDFC AMC Direct / Groww",
    er: "0.20%",
  },
  smallCap: {
    code: 125354,
    name: "Quant Small Cap Fund (Direct)",
    platform: "Quant AMC Direct / Groww",
    er: "0.64%",
  },
  nasdaq100: {
    code: 120847,
    name: "Motilal Oswal Nasdaq 100 ETF FOF (Direct)",
    platform: "Groww / Zerodha",
    er: "0.29%",
  },
};
