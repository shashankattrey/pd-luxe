// hooks/useMarketData.ts
// ─────────────────────────────────────────────────────────────────────────────
// Client-side hook that fetches live market data from /api/market.
//
// Features:
//  • Auto-refresh every 5 minutes
//  • Stale-while-revalidate — shows cached data while refreshing in background
//  • Per-category loading states so UI can show skeletons granularly
//  • isStale flag so UI can show "last updated X ago" banner
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { MarketSnapshot } from "@/lib/market-data";

export type MarketDataState = {
  data: MarketSnapshot | null;
  loading: boolean; // true only on first load (no data yet)
  refreshing: boolean; // true on background re-fetches
  error: string | null;
  lastUpdated: Date | null;
  isStale: boolean; // true if data is older than 10 minutes
  refetch: () => void;
};

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export function useMarketData(): MarketDataState {
  const [data, setData] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(
    async (isBackground = false) => {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const res = await fetch("/api/market", {
          // Next.js fetch cache: revalidate every 5 minutes on the server
          next: { revalidate: 300 },
        } as RequestInit);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: MarketSnapshot = await res.json();
        setData(json);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (!data) {
          // Only surface the error to the UI if we have no data at all
          setError(`Could not load market data: ${msg}`);
        }
        // Otherwise keep showing stale data silently
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [data],
  );

  // Initial load
  useEffect(() => {
    fetchData(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh
  useEffect(() => {
    timerRef.current = setInterval(() => fetchData(true), REFRESH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  const isStale =
    lastUpdated != null &&
    Date.now() - lastUpdated.getTime() > STALE_THRESHOLD_MS;

  return {
    data,
    loading,
    refreshing,
    error,
    lastUpdated,
    isStale,
    refetch: () => fetchData(false),
  };
}

// ─── Convenience selector hooks ───────────────────────────────────────────────
// Import these in individual components to avoid prop-drilling the full snapshot.

export function useEquityData() {
  const { data, loading, error } = useMarketData();
  return { equity: data?.equity ?? null, loading, error };
}

export function useCryptoData() {
  const { data, loading, error } = useMarketData();
  return { crypto: data?.crypto ?? null, loading, error };
}

export function useGoldData() {
  const { data, loading, error } = useMarketData();
  return { gold: data?.gold ?? null, loading, error };
}

export function useMacroData() {
  const { data, loading, error } = useMarketData();
  return { macro: data?.macro ?? null, loading, error };
}

export function useGovtSchemeRates() {
  const { data, loading, error } = useMarketData();
  return { govtSchemes: data?.govtSchemes ?? null, loading, error };
}

export function useMutualFunds() {
  const { data, loading, error } = useMarketData();
  return { mutualFunds: data?.mutualFunds ?? null, loading, error };
}

export function useFixedIncome() {
  const { data, loading, error } = useMarketData();
  return { fixedIncome: data?.fixedIncome ?? null, loading, error };
}

export function useREITData() {
  const { data, loading, error } = useMarketData();
  return { reits: data?.reits ?? null, loading, error };
}
