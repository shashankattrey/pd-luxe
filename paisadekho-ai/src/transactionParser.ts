export interface Transaction {
  date: string;
  merchant: string;
  amount: number;
}

export function extractTransactions(text: string): Transaction[] {
  const lines = text.split("\n");

  const txns: Transaction[] = [];

  for (const line of lines) {
    const match = line.match(/(\d{1,2}[\/\-]\d{1,2})\s+(.+?)\s+(\d+(\.\d+)?)/);

    if (!match) continue;

    txns.push({
      date: match[1],
      merchant: match[2].trim(),
      amount: Number(match[3]),
    });
  }

  return txns;
}
