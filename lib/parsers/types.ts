// lib/parsers/types.ts

export interface PDFText {
  text: string;
  x: number;
  y: number;
}

export interface BankTransaction {
  date: any;
  narration: string;
  description?: string;
  amount: number;
  type: "credit" | "debit" | string;
  balance: number;
  category?: string;
  bank?: string;
}

export interface FinancialReport {
  account_holder: string;
  account_number: string;
  summary: any;
  categorized_transactions: {
    subscriptions_and_digital: BankTransaction[];
    food_and_dining: BankTransaction[];
    travel_and_utilities: BankTransaction[];
    transfers_and_income: BankTransaction[];
    bank_charges: BankTransaction[];
    others: BankTransaction[];
  };
  metadata?: any;
}
