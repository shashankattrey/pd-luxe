export const categoryMap: Record<string, { label: string; group: string }> = {
  // Equity Groups
  "Equity Scheme - Large Cap Fund": { label: "Large Cap", group: "Equity" },
  "Equity Scheme - Mid Cap Fund": { label: "Mid Cap", group: "Equity" },
  "Equity Scheme - Small Cap Fund": { label: "Small Cap", group: "Equity" },
  "Equity Scheme - Flexi Cap Fund": { label: "Flexi Cap", group: "Equity" },
  "Equity Scheme - ELSS": { label: "Tax Saver (ELSS)", group: "Equity" },
  ELSS: { label: "Tax Saver (ELSS)", group: "Equity" }, // Consolidating both variations
  "Equity Scheme - Sectoral/ Thematic": { label: "Sectoral", group: "Equity" },

  // Debt Groups
  "Debt Scheme - Liquid Fund": { label: "Liquid", group: "Debt" },
  "Debt Scheme - Overnight Fund": { label: "Overnight", group: "Debt" },
  "Debt Scheme - Corporate Bond Fund": {
    label: "Corporate Bond",
    group: "Debt",
  },

  // Hybrid & Others
  "Hybrid Scheme - Aggressive Hybrid Fund": {
    label: "Aggressive Hybrid",
    group: "Hybrid",
  },
  "Hybrid Scheme - Arbitrage Fund": { label: "Arbitrage", group: "Hybrid" },
  "Other Scheme - Index Funds": { label: "Index Funds", group: "Passive" },
};

// Helper to get a clean label or return the original if not mapped
export const getCleanCategory = (rawCategory: string) => {
  return categoryMap[rawCategory]?.label || rawCategory;
};
