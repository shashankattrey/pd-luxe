export function categorizeMerchant(name: string) {
  const m = name.toLowerCase();

  if (m.includes("swiggy") || m.includes("zomato")) return "dining";

  if (m.includes("amazon") || m.includes("flipkart")) return "shopping";

  if (m.includes("uber") || m.includes("ola")) return "travel";

  if (m.includes("petrol") || m.includes("indian oil")) return "fuel";

  if (m.includes("electricity") || m.includes("bill")) return "utilities";

  return "other";
}
