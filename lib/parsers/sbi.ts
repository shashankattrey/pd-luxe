import { getCategory } from "./categorizer";
import { isPasswordError } from "../../app/api/upload/pdf-password";

// Using require to bypass ESM bundling issues with pdf2json in Next.js
const PDFParser: any = require("pdf2json");

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  bank: "SBI";
  balance: number | null;
  category: string;
}

interface SBIResult {
  bank_name: "SBI";
  account_holder: string;
  account_number: string;
  metadata: {
    account_holder: string;
    account_no: string;
    ifsc: string;
    branch: string;
    statementPeriod: string;
  };
  summary: {
    opening_balance: number | null;
    closing_balance: number | null;
    total_debits: number;
    total_credits: number;
    count: number;
  };
  transactions: Transaction[];
}

interface PDFCell {
  text: string;
  x: number;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function safeDecode(text: string): string {
  try {
    return decodeURIComponent(text).trim();
  } catch {
    return unescape(text).trim();
  }
}

// SBI date: DD/MM/YYYY → YYYY-MM-DD
function isDate(str: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(str);
}

function normalizeSBIDate(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function isAmount(text: string): boolean {
  return /^[\d,]+\.\d{2}$/.test(text.trim());
}

function cleanAmount(val: string): number {
  return val ? parseFloat(val.replace(/,/g, "")) : 0;
}

// Noise lines to skip during narration collection
function isNoiseLine(txt: string): boolean {
  if (!txt) return true;
  if (/^Page no\./i.test(txt)) return true;
  if (/^Statement Summary/i.test(txt)) return true;
  if (/^Balance$/i.test(txt)) return true;
  if (/^Narration$/i.test(txt)) return true;
  if (/^Date$/i.test(txt)) return true;
  if (/^Generated On/i.test(txt)) return true;
  if (/^This is a computer/i.test(txt)) return true;
  if (/^Brought Forward/i.test(txt)) return true;
  if (/^Dr Count/i.test(txt)) return true;
  if (/^Opening Bal/i.test(txt)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────
// ROW GROUPING — per page
// SBI merges all pages before grouping in original code which
// causes Y-coordinate collisions. We expose groupRows per-page
// and merge after.
// ─────────────────────────────────────────────────────────────
function groupRows(page: any): PDFCell[][] {
  const rows: Record<string, PDFCell[]> = {};
  page.Texts.forEach((t: any) => {
    const text = safeDecode(t.R[0].T);
    const y = t.y.toFixed(3);
    if (!rows[y]) rows[y] = [];
    rows[y].push({ text, x: t.x });
  });
  return Object.values(rows).map((row) => row.sort((a, b) => a.x - b.x));
}

// ─────────────────────────────────────────────────────────────
// TRANSACTION PARSING
// SBI column x-positions (from coordinate dump):
//   date:      x ≈ 1.468
//   narration: x ≈ 8.375
//   debit:     x ≈ 21.0–25.5
//   credit:    x ≈ 25.5–30.5
//   balance:   x ≈ 30.5+
// ─────────────────────────────────────────────────────────────
const X = {
  NARRATION_START: 7.5,
  NARRATION_END: 21.0,
  DEBIT_START: 21.0,
  CREDIT_START: 25.5,
  BALANCE_START: 30.5,
};

function parseSBITransactions(rows: PDFCell[][]): Transaction[] {
  const txns: any[] = [];
  let current: any = null;

  rows.forEach((row) => {
    const dateCell = row.find((c) => isDate(c.text));

    if (dateCell) {
      if (current) txns.push(current);
      current = {
        date: dateCell.text,
        narration: "",
        debit: 0,
        credit: 0,
        balance: null,
      };

      row.forEach((cell) => {
        const txt = cell.text.trim();
        const x = cell.x;
        if (isDate(txt) || txt === "-") return;

        if (isAmount(txt)) {
          const val = cleanAmount(txt);
          if (x >= X.BALANCE_START) current.balance = val;
          else if (x >= X.CREDIT_START) current.credit = val;
          else if (x >= X.DEBIT_START) current.debit = val;
        } else if (x >= X.NARRATION_START && x < X.NARRATION_END) {
          if (!isNoiseLine(txt)) current.narration += " " + txt;
        }
      });
    } else if (current) {
      row.forEach((cell) => {
        const txt = cell.text.trim();
        if (cell.x >= X.NARRATION_START && cell.x < X.NARRATION_END) {
          if (!isNoiseLine(txt)) current.narration += " " + txt;
        }
        // Pick up balance from continuation rows if not yet set
        if (
          cell.x >= X.BALANCE_START &&
          isAmount(txt) &&
          current.balance === null
        ) {
          current.balance = cleanAmount(txt);
        }
      });
    }
  });

  if (current) txns.push(current);

  return txns
    .filter((t) => t.debit > 0 || t.credit > 0)
    .map((t) => {
      const description = t.narration.replace(/\s+/g, " ").trim();
      return {
        date: normalizeSBIDate(t.date),
        description,
        amount: t.debit || t.credit || 0,
        type: t.debit > 0 ? "debit" : "credit",
        bank: "SBI" as const,
        balance: t.balance,
        category: getCategory(description),
      };
    });
}

// ─────────────────────────────────────────────────────────────
// META EXTRACTION
// ─────────────────────────────────────────────────────────────
function extractSBIMetadata(rows: PDFCell[][]) {
  const textBlob = rows.map((r) => r.map((c) => c.text).join(" ")).join("\n");

  // Account holder: SBI uses "MR/MS/MRS NAME" pattern
  const holderPatterns = [
    /(?:MR|MRS|MS|SHRI|SMT)\.?\s+([A-Z][A-Z\s]{2,40})(?=\s)/i,
    /Account Holder\s*[:\-]?\s*([A-Z][A-Z\s]{2,40})/i,
  ];
  let account_holder = "";
  for (const re of holderPatterns) {
    const m = textBlob.match(re);
    if (m) {
      account_holder = m[0].trim();
      break;
    }
  }

  const account_no =
    (textBlob.match(/Account Number\s+(\d+)/) ||
      textBlob.match(/Account No\.?\s*[:\s]+(\d{10,})/i) ||
      [])[1] || "";

  const ifsc =
    (textBlob.match(/IFSC\s*(?:Code)?\s*[:\s]+([A-Z0-9]{11})/i) || [])[1] || "";
  const branch =
    (textBlob.match(
      /(?:Branch|BRANCH)\s*[:\s]+([A-Z][A-Z\s]+?)(?=\s{2,}|\n)/i,
    ) || [])[1]?.trim() || "";

  // Period: "01/01/2026 to 31/01/2026" or similar
  const periodMatch = textBlob.match(
    /(\d{2}\/\d{2}\/\d{4})\s*(?:to|-)\s*(\d{2}\/\d{2}\/\d{4})/i,
  );
  const statementPeriod = periodMatch
    ? `${periodMatch[1]} to ${periodMatch[2]}`
    : "";

  return { account_holder, account_no, ifsc, branch, statementPeriod };
}

// ─────────────────────────────────────────────────────────────
// DEV REPORT
// ─────────────────────────────────────────────────────────────
function printDevReport(result: SBIResult): void {
  if (process.env.NODE_ENV === "production") return;

  const { metadata, summary, transactions } = result;
  const L = "─".repeat(80);

  console.log("\n" + "═".repeat(80));
  console.log("  SBI — PARSED STATEMENT REPORT");
  console.log("═".repeat(80));
  console.log(`  Account Holder : ${metadata.account_holder}`);
  console.log(`  Account No.    : ${metadata.account_no}`);
  console.log(
    `  IFSC           : ${metadata.ifsc}   Branch: ${metadata.branch}`,
  );
  console.log(`  Period         : ${metadata.statementPeriod}`);

  console.log("\n" + L);
  console.log("  SUMMARY");
  console.log(L);
  console.log(
    `  Opening Balance  : ₹ ${summary.opening_balance?.toLocaleString("en-IN") ?? "N/A"}`,
  );
  console.log(
    `  Closing Balance  : ₹ ${summary.closing_balance?.toLocaleString("en-IN") ?? "N/A"}`,
  );
  console.log(
    `  Total Debits     : ₹ ${summary.total_debits.toLocaleString("en-IN")}`,
  );
  console.log(
    `  Total Credits    : ₹ ${summary.total_credits.toLocaleString("en-IN")}`,
  );
  console.log(
    `  Net Flow         : ₹ ${(summary.total_credits - summary.total_debits).toLocaleString("en-IN")}`,
  );
  console.log(`  Transactions     : ${summary.count}`);

  // Category breakdown
  const catMap: Record<string, { count: number; total: number }> = {};
  for (const t of transactions) {
    const cat = t.category ?? "uncategorized";
    if (!catMap[cat]) catMap[cat] = { count: 0, total: 0 };
    catMap[cat].count++;
    catMap[cat].total += t.type === "debit" ? t.amount : 0;
  }
  const categories = Object.entries(catMap).sort(
    (a, b) => b[1].total - a[1].total,
  );
  if (categories.length > 0) {
    console.log("\n" + L);
    console.log("  CATEGORY BREAKDOWN (by debit spend)");
    console.log(L);
    for (const [cat, { count, total }] of categories) {
      const amount = total > 0 ? `  DR ₹${total.toLocaleString("en-IN")}` : "";
      console.log(`  ${cat.padEnd(30)} ${`${count} txn`.padStart(8)}${amount}`);
    }
  }

  // First 10 transactions
  console.log("\n" + L);
  console.log("  FIRST 10 TRANSACTIONS");
  console.log(L);
  console.log(
    "  " +
      "Date".padEnd(12) +
      "Type".padEnd(8) +
      "Amount".padStart(12) +
      "  Balance".padStart(14) +
      "  Description",
  );
  console.log("  " + "─".repeat(78));
  for (const t of transactions.slice(0, 10)) {
    const type = t.type === "debit" ? "DR" : "CR";
    const amt = `₹${t.amount.toLocaleString("en-IN")}`.padStart(12);
    const bal =
      t.balance != null
        ? `₹${t.balance.toLocaleString("en-IN")}`.padStart(12)
        : "".padStart(12);
    console.log(
      `  ${t.date.padEnd(12)}${type.padEnd(8)}${amt}  ${bal}  ${(t.description ?? "").slice(0, 40)}`,
    );
  }
  if (transactions.length > 10)
    console.log(`  ... and ${transactions.length - 10} more transactions`);

  // Last 5 transactions
  if (transactions.length > 10) {
    console.log("\n" + L);
    console.log("  LAST 5 TRANSACTIONS");
    console.log(L);
    for (const t of transactions.slice(-5)) {
      const type = t.type === "debit" ? "DR" : "CR";
      const amt = `₹${t.amount.toLocaleString("en-IN")}`.padStart(12);
      const bal =
        t.balance != null
          ? `₹${t.balance.toLocaleString("en-IN")}`.padStart(12)
          : "".padStart(12);
      console.log(
        `  ${t.date.padEnd(12)}${type.padEnd(8)}${amt}  ${bal}  ${(t.description ?? "").slice(0, 40)}`,
      );
    }
  }

  console.log("\n" + "═".repeat(80) + "\n");
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export async function parseSBI(
  fileBuffer: Buffer,
  password?: string,
): Promise<SBIResult | { requiresPassword: true }> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true);

    if (password) {
      pdfParser.setPassword(password);
    }

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        let allRows: PDFCell[][] = [];
        pdfData.Pages.forEach((page: any) => allRows.push(...groupRows(page)));

        const transactions = parseSBITransactions(allRows);
        const metadata = extractSBIMetadata(allRows);

        // Closing balance = last transaction's balance
        const closingBalance =
          transactions.length > 0
            ? transactions[transactions.length - 1].balance
            : null;

        const totalDebits = transactions.reduce(
          (s, t) => (t.type === "debit" ? s + t.amount : s),
          0,
        );
        const totalCredits = transactions.reduce(
          (s, t) => (t.type === "credit" ? s + t.amount : s),
          0,
        );

        const result: SBIResult = {
          bank_name: "SBI",
          account_holder: metadata.account_holder,
          account_number: metadata.account_no,
          metadata,
          summary: {
            opening_balance: null, // SBI summary page can be added if needed
            closing_balance: closingBalance,
            total_debits: +totalDebits.toFixed(2),
            total_credits: +totalCredits.toFixed(2),
            count: transactions.length,
          },
          transactions,
        };

        printDevReport(result);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    pdfParser.on("pdfParser_dataError", (err: any) => {
      if (isPasswordError(err)) return resolve({ requiresPassword: true });
      reject(err);
    });

    // Wrap in try/catch — pdf2json can throw synchronously for password errors
    try {
      pdfParser.parseBuffer(fileBuffer);
    } catch (syncErr: any) {
      if (isPasswordError(syncErr)) {
        resolve({ requiresPassword: true });
      } else {
        reject(syncErr);
      }
    }
  });
}
