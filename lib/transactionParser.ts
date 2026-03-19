export function extractTransactions(text: string) {
  const lines = text.split("\n");

  const transactions: any[] = [];

  const regex = /(\d{1,2}\s\w{3})\s(.+?)\s([\d,]+\.\d{2})/;

  for (const line of lines) {
    const match = line.match(regex);

    if (!match) continue;

    const [, date, description, amount] = match;

    transactions.push({
      date,
      description: description.trim(),
      amount: parseFloat(amount.replace(",", "")),
    });
  }

  return transactions;
}
