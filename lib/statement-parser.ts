// Define categories based on common Indian merchant keywords
const CATEGORY_MAP: Record<string, string[]> = {
  fuel: ["shell", "iocl", "hpcl", "bpcl", "fuel", "petrol"],
  dining: [
    "zomato",
    "swiggy",
    "eazydiner",
    "restaurant",
    "mcdonalds",
    "starbucks",
  ],
  travel: [
    "indigo",
    "air india",
    "makemytrip",
    "cleartrip",
    "irctc",
    "uber",
    "ola",
  ],
  shopping: ["amazon", "flipkart", "myntra", "ajio", "nykaa"],
  utility: ["bescom", "airtel", "jio", "vi", "tata play", "insurance"],
};

export interface SpendSummary {
  total: number;
  categories: Record<string, number>;
}

export const parseCSVStatement = (csvData: string): SpendSummary => {
  const lines = csvData.split("\n");
  const summary: SpendSummary = { total: 0, categories: {} };

  // Initialize categories
  Object.keys(CATEGORY_MAP).forEach((cat) => (summary.categories[cat] = 0));
  summary.categories["others"] = 0;

  lines.forEach((line) => {
    const columns = line.split(",");
    if (columns.length < 3) return;

    // Assuming column 1 is Description and column 2 is Amount
    const description = columns[1]?.toLowerCase() || "";
    const amount = Math.abs(parseFloat(columns[2])) || 0;

    if (amount > 0) {
      summary.total += amount;

      let matched = false;
      for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some((kw) => description.includes(kw))) {
          summary.categories[category] += amount;
          matched = true;
          break;
        }
      }
      if (!matched) summary.categories["others"] += amount;
    }
  });

  return summary;
};
