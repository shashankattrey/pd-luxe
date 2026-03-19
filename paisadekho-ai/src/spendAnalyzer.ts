import { categorizeMerchant } from "./categorize";

export function buildSpendProfile(txns: any[]) {
  const profile = {
    dining: 0,
    shopping: 0,
    travel: 0,
    fuel: 0,
    utilities: 0,
    other: 0,
  };

  for (const txn of txns) {
    const category = categorizeMerchant(txn.merchant);

    profile[category] += txn.amount;
  }

  return profile;
}
