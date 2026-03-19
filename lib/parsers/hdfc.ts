import PDFParser from "pdf2json";
import { getCategory } from "./categorizer";
import fs from "fs";

type TextItem = {
  text: string;
  x: number;
};

type Row = TextItem[];

type RawTxn = {
  date: string;
  narration: string;
  debit: string;
  credit: string;
  balance: string;
};

type NormalizedTxn = {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  bank: string;
  _balance?: string;
  category?: string;
};

// const pdfParser = new PDFParser();

// --- EXTRACTION HELPERS ---
function decode(text: string): string {
  return decodeURIComponent(text).trim();
}
function isDate(str: string): boolean {
  return /^\d{2}\/\d{2}\/\d{2}$/.test(str);
}
function isAmount(text: string): boolean {
  return /^[\d,]+\.\d{2}$/.test(text.trim()) || /^\d+$/.test(text.trim());
}
function cleanAmount(val: string): string {
  return val ? val.replace(/,/g, "").trim() : "";
}

// --- CORE PARSING LOGIC ---
function groupRows(page: any): Row[] {
  const rows: Record<string, Row> = {};

  page.Texts.forEach((t: any) => {
    const text = decode(t.R[0].T);
    const y = t.y.toFixed(1);

    if (!rows[y]) rows[y] = [];
    rows[y].push({ text, x: t.x });
  });

  return Object.values(rows).map((row) => row.sort((a, b) => a.x - b.x));
}

function parseTransactions(rows: Row[]): RawTxn[] {
  const txns: RawTxn[] = [];
  let current: RawTxn | null = null;
  const X_LIMITS = {
    DEBIT_MIN: 27.0,
    DEBIT_MAX: 30.0,
    CREDIT_MIN: 31.0,
    CREDIT_MAX: 34.5,
    BALANCE_MIN: 35.0,
  };

  rows.forEach((row: Row) => {
    const dateCell = row.find((cell: TextItem) => isDate(cell.text));
    if (dateCell) {
      if (current) {
        finalizeTxn(current);
        txns.push(current);
      }
      current = {
        date: dateCell.text,
        narration: "",
        debit: "",
        credit: "",
        balance: "",
      };

      const txn = current; // ✅ TS now knows this is NOT null

      row.forEach((cell: TextItem) => {
        const text = cell.text.trim();
        const x = cell.x;

        if (isAmount(text)) {
          const val = cleanAmount(text);

          if (text.length > 10 && !text.includes(".")) {
            txn.narration += " " + text;
          } else if (x >= X_LIMITS.BALANCE_MIN) {
            txn.balance = val;
          } else if (x >= X_LIMITS.CREDIT_MIN && x <= X_LIMITS.CREDIT_MAX) {
            txn.credit = val;
          } else if (x >= X_LIMITS.DEBIT_MIN && x <= X_LIMITS.DEBIT_MAX) {
            txn.debit = val;
          } else {
            txn.narration += " " + text;
          }
        } else if (!isDate(text)) {
          txn.narration += " " + text;
        }
      });
    } else if (current) {
      current.narration += " " + row.map((r) => r.text).join(" ");
    }
  });
  if (current) {
    finalizeTxn(current);
    txns.push(current);
  }
  return txns;
}

function finalizeTxn(txn: RawTxn): void {
  const amountRegex = /(\d{1,3}(,\d{3})*\.\d{2})/g;
  const matches = txn.narration.match(amountRegex);
  if (matches && !txn.debit && !txn.credit) {
    txn.debit = matches[0].replace(/,/g, "");
    txn.narration = txn.narration
      .replace(matches[0], "")
      .replace(/\s\s+/g, " ")
      .trim();
  }
}

function removeNoise(txns: RawTxn[]): RawTxn[] {
  const blacklist = [
    "HDFC BANK",
    "Statement of account",
    "Page No",
    "Account Branch",
    "Registered Office",
    "Statement Summary",
    "Generated On",
    "RTGS/NEFT",
  ];
  return txns.map((t: RawTxn) => {
    blacklist.forEach((word) => {
      t.narration = t.narration.replace(new RegExp(word + ".*", "gi"), "");
    });
    t.narration = t.narration.replace(/\s+/g, " ").trim();
    return t;
  });
}

function extractAccountDetails(rows: Row[]) {
  const details = {
    account_holder: "",
    account_no: "",
    cust_id: "",
    ifsc: "",
    branch: "",
    period: "",
  };

  const fullText = rows
    .map((row: Row) => row.map((cell: TextItem) => cell.text).join(" "))
    .join("\n");

  const patterns = {
    account_holder: /MS\s+([A-Z\s]+)/,
    account_no: /Account No\s*:\s*(\d+)/i,
    cust_id: /Cust ID\s*:\s*(\d+)/i,
    ifsc: /IFSC\s*:\s*([A-Z0-9]+)/i,
    branch: /Account Branch\s*:\s*([A-Z\s]+)/i,
    period: /From\s*:\s*([\d\/]+)\s*To\s*:\s*([\d\/]+)/i,
  };

  const m1 = fullText.match(patterns.account_holder);
  if (m1) details.account_holder = m1[1].trim();

  const m2 = fullText.match(patterns.account_no);
  if (m2) details.account_no = m2[1];

  const m3 = fullText.match(patterns.cust_id);
  if (m3) details.cust_id = m3[1];

  const m4 = fullText.match(patterns.ifsc);
  if (m4) details.ifsc = m4[1];

  const m5 = fullText.match(patterns.branch);
  if (m5) details.branch = m5[1].trim();

  const m6 = fullText.match(patterns.period);
  if (m6) details.period = `${m6[1]} to ${m6[2]}`;

  return details;
}
function normalizeHDFCTxn(txn: RawTxn): NormalizedTxn {
  return {
    date: txn.date,
    description: txn.narration.replace(/\s+/g, " ").trim(),
    amount: parseFloat(txn.debit) || parseFloat(txn.credit) || 0,
    type: txn.debit ? "debit" : "credit",
    bank: "HDFC",
    // carry raw balance through so we can read it later
    _balance: txn.balance,
  };
}

// --- EXECUTION ---

export async function parseHDFC(buffer: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true);

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      let rows: any[] = [];
      pdfData.Pages.forEach((page: any) => {
        rows.push(...groupRows(page));
      });

      const accountMeta = extractAccountDetails(rows);
      let rawTransactions = parseTransactions(rows);
      rawTransactions = removeNoise(rawTransactions);

      const normalizedTransactions = rawTransactions.map((t) => {
        const normalized = normalizeHDFCTxn(t);
        normalized.category = getCategory(normalized.description);
        return normalized;
      });

      const summary = {
        total_debits: 0,
        total_credits: 0,
        count: normalizedTransactions.length,
      };

      normalizedTransactions.forEach((t) => {
        if (t.type === "debit") summary.total_debits += t.amount;
        else summary.total_credits += t.amount;
      });

      // Closing balance = balance of the last transaction
      const lastTxn = normalizedTransactions[normalizedTransactions.length - 1];
      const closingBalance = lastTxn?._balance
        ? parseFloat(lastTxn._balance)
        : null;

      // Strip internal _balance field before returning
      const transactions = normalizedTransactions.map(
        ({ _balance, ...t }) => t,
      );

      const finalReport = {
        account_holder: accountMeta.account_holder || "Unknown",
        account_number: accountMeta.account_no || "Unknown",
        metadata: accountMeta,
        summary: {
          total_debits: Number(summary.total_debits.toFixed(2)),
          total_credits: Number(summary.total_credits.toFixed(2)),
          transaction_count: summary.count,
          closing_balance: closingBalance,
        },
        transactions,
      };

      // --- DEV REPORT ---
      if (process.env.NODE_ENV !== "production") {
        const L = "─".repeat(80);
        const t = finalReport.transactions;
        const s = finalReport.summary;

        console.log("\n" + "═".repeat(80));
        console.log("  HDFC BANK — PARSED STATEMENT REPORT");
        console.log("═".repeat(80));
        console.log(`  Account Holder : ${finalReport.account_holder}`);
        console.log(`  Account No.    : ${finalReport.account_number}`);
        console.log(`  Branch         : ${accountMeta.branch}`);
        console.log(`  IFSC           : ${accountMeta.ifsc}`);
        console.log(`  Period         : ${accountMeta.period}`);

        console.log("\n" + L);
        console.log("  SUMMARY");
        console.log(L);
        console.log(
          `  Closing Balance  : ₹ ${s.closing_balance?.toLocaleString("en-IN") ?? "N/A"}`,
        );
        console.log(
          `  Total Debits     : ₹ ${s.total_debits.toLocaleString("en-IN")}`,
        );
        console.log(
          `  Total Credits    : ₹ ${s.total_credits.toLocaleString("en-IN")}`,
        );
        console.log(
          `  Net Flow         : ₹ ${(s.total_credits - s.total_debits).toLocaleString("en-IN")}`,
        );
        console.log(`  Transactions     : ${s.transaction_count}`);

        // Category breakdown
        const catMap: Record<string, { count: number; total: number }> = {};
        for (const tx of t) {
          const cat = (tx as any).category ?? "uncategorized";
          if (!catMap[cat]) catMap[cat] = { count: 0, total: 0 };
          catMap[cat].count++;
          catMap[cat].total += tx.type === "debit" ? tx.amount : 0;
        }
        const cats = Object.entries(catMap).sort(
          (a, b) => b[1].total - a[1].total,
        );
        if (cats.length > 0) {
          console.log("\n" + L);
          console.log("  CATEGORY BREAKDOWN (by debit spend)");
          console.log(L);
          for (const [cat, { count, total }] of cats) {
            const amt =
              total > 0 ? `  DR ₹${total.toLocaleString("en-IN")}` : "";
            console.log(
              `  ${cat.padEnd(30)} ${`${count} txn`.padStart(8)}${amt}`,
            );
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
        for (const tx of t.slice(0, 10)) {
          const typ = tx.type === "debit" ? "DR" : "CR";
          const amt = `₹${tx.amount.toLocaleString("en-IN")}`.padStart(12);
          const bal = (tx as any)._balance
            ? `₹${parseFloat((tx as any)._balance).toLocaleString("en-IN")}`.padStart(
                12,
              )
            : "N/A".padStart(12);
          console.log(
            `  ${tx.date.padEnd(12)}${typ.padEnd(8)}${amt}  ${bal}  ${(tx.description ?? "").slice(0, 40)}`,
          );
        }
        if (t.length > 10)
          console.log(`  ... and ${t.length - 10} more transactions`);

        // Last 5 transactions
        if (t.length > 10) {
          console.log("\n" + L);
          console.log("  LAST 5 TRANSACTIONS");
          console.log(L);
          for (const tx of t.slice(-5)) {
            const typ = tx.type === "debit" ? "DR" : "CR";
            const amt = `₹${tx.amount.toLocaleString("en-IN")}`.padStart(12);
            const bal =
              closingBalance && tx === t[t.length - 1]
                ? `₹${closingBalance.toLocaleString("en-IN")}`.padStart(12)
                : "".padStart(12);
            console.log(
              `  ${tx.date.padEnd(12)}${typ.padEnd(8)}${amt}  ${bal}  ${(tx.description ?? "").slice(0, 40)}`,
            );
          }
        }

        console.log("\n" + "═".repeat(80) + "\n");
      }

      resolve(finalReport);
    });

    pdfParser.on("pdfParser_dataError", (err) => reject(err));

    pdfParser.parseBuffer(buffer);
  });
}
