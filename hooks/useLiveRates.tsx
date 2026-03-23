// hooks/useLiveRates.ts
import { useFundData } from "./useFundData";

export function useLiveRates() {
  const { rates, ratesLoading } = useFundData();

  const formattedTickerItems = rates ? [
    { 
      label: "NIFTY 50", 
      val: rates.equity.nifty50.value.toLocaleString("en-IN"), 
      up: rates.equity.nifty50.changePct >= 0 
    },
    { 
      label: "SENSEX", 
      val: rates.equity.sensex.value.toLocaleString("en-IN"), 
      up: rates.equity.sensex.changePct >= 0 
    },
    { 
      label: "GOLD 24K", 
      val: `₹${rates.gold.price24k.toLocaleString("en-IN")}`, 
      up: true 
    },
    { 
      label: "GOLD 22K", 
      val: `₹${rates.gold.price22k.toLocaleString("en-IN")}`, 
      up: true 
    },
    { label: "PPF RATE", val: `${rates.govtSchemes.ppf.rate}%`, up: true },
    { label: "USD/INR", val: rates.macro.usdInr.toFixed(2), up: true },
    { label: "INFLATION", val: `${rates.macro.inflation}%`, up: false },
  ] : [];

  return {
    tickerItems: formattedTickerItems,
    rawRates: rates,
    isLoading: ratesLoading
  };
}