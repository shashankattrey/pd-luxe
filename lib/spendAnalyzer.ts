export function buildSpendProfile(transactions: any[]) {
  const categories: any = {};

  for (const tx of transactions) {
    let category = "Other";

    const desc = tx.description.toLowerCase();

    if (desc.includes("swiggy") || desc.includes("zomato")) category = "Dining";

    if (desc.includes("uber") || desc.includes("ola")) category = "Travel";

    if (desc.includes("amazon") || desc.includes("flipkart"))
      category = "Shopping";

    categories[category] = (categories[category] || 0) + tx.amount;
  }

  return categories;
}
