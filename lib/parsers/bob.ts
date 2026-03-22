import PDFParser from "pdf2json";
import { getCategory } from "./categorizer";
import { isPasswordError } from "../../app/api/upload/pdf-password";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface RawTransaction {
  date: string;
  descLines: string[];
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

interface NormalizedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  bank: "BOB";
  balance: number | null;
  category?: string;
}

interface BOBMeta {
  accountHolder: string;
  accountNo: string;
  nominee: string;
  ifsc: string;
  branch: string;
  statementPeriod: string;
}

interface BOBReport {
  meta: BOBMeta;
  bank_name: "BOB";
  account_holder: string;
  account_number: string;
  summary: {
    opening_balance: number | null;
    closing_balance: number | null;
    total_debits: number;
    total_credits: number;
    transaction_count: number;
  };
  transactions: NormalizedTransaction[];
}

// ─────────────────────────────────────────────────────────────
// COLUMN BOUNDARIES
// From BOB coordinate dump (x values from the original script):
//   date:        x ~  1.8        →  0.0 –  4.5
//   narration:   x ~  4.7        →  4.5 – 21.0
//   withdrawal:  x ~ 21.8        → 21.0 – 26.0
//   deposit:     x ~ 27.7        → 26.0 – 31.0
//   balance:     x ~ 33.2        → 31.0 – 40.0
// ─────────────────────────────────────────────────────────────
const COL = {
  date: { min: 0.0, max: 4.5 },
  narration: { min: 4.5, max: 21.0 },
  withdrawal: { min: 21.0, max: 26.0 },
  deposit: { min: 26.0, max: 31.0 },
  balance: { min: 31.0, max: 40.0 },
} as const;

type ColName = keyof typeof COL;
const ROW_Y_TOLERANCE = 0.4;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function decode(R: Array<{ T: string }>): string {
  return R.map((r) => {
    try {
      return decodeURIComponent(r.T);
    } catch {
      return r.T;
    }
  })
    .join("")
    .trim();
}

function classifyCol(x: number): ColName | null {
  for (const [name, range] of Object.entries(COL) as [
    ColName,
    { min: number; max: number },
  ][]) {
    if (x >= range.min && x < range.max) return name;
  }
  return null;
}

function parseAmount(str: string | undefined): number | null {
  if (!str || str.trim() === "" || str.trim() === "-") return null;
  // BOB uses " Cr" suffix for credit balances
  const cleaned = str
    .replace(/\s*Cr$/i, "")
    .replace(/,/g, "")
    .trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// BOB date format: "DD-MM-YYYY" → "YYYY-MM-DD"
function parseDate(str: string): string {
  const m = str.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return str.trim();
}

function isBOBDate(str: string): boolean {
  return /^\d{2}-\d{2}-\d{4}$/.test(str.trim());
}

// ─────────────────────────────────────────────────────────────
// NOISE FILTERING
// ─────────────────────────────────────────────────────────────
function isNoiseLine(s: string): boolean {
  const t = s.trim();
  if (!t || t === "-") return true;
  if (/^Page\s+\d+/i.test(t)) return true;
  if (/^Bank of Baroda/i.test(t)) return true;
  if (/^Statement of Account/i.test(t)) return true;
  if (/^(Date|Narration|Particulars|CHQ\.NO\.)$/.test(t)) return true;
  if (/^Withdrawal/i.test(t)) return true;
  if (/^Deposit/i.test(t)) return true;
  if (/^Balance$/i.test(t)) return true;
  if (/^TOTAL$/i.test(t)) return true;
  if (/^ABBREVIATIONS/i.test(t)) return true;
  if (/^SP\s+-/i.test(t)) return true;
  if (/^EC\s+-/i.test(t)) return true;
  if (/^MB\s+-/i.test(t)) return true;
  if (/^SI\s+-/i.test(t)) return true;
  if (/^OBC\s+-/i.test(t)) return true;
  if (/^ECS\s+-/i.test(t)) return true;
  if (/^INT\s+-/i.test(t)) return true;
  if (/^CBI\s+-/i.test(t)) return true;
  if (/^Retd\s+-/i.test(t)) return true;
  if (/^DAUE\s+-/i.test(t)) return true;
  if (/^INCHGS\s+-/i.test(t)) return true;
  if (/^ISLIXN\s+-/i.test(t)) return true;
  if (/^https?:\/\//i.test(t)) return true;
  if (/^Customer Care/i.test(t)) return true;
  if (/^Cyber Crime/i.test(t)) return true;
  if (/^IMPORTANT MESSAGES/i.test(t)) return true;
  if (/^NOMINEE DETAILS/i.test(t)) return true;
  if (/^BASE BRANCH/i.test(t)) return true;
  if (/^SR\.NO\./i.test(t)) return true;
  if (/^ACCOUNT TYPE/i.test(t)) return true;
  if (/^A summary/i.test(t)) return true;
  if (/^Relationship Type/i.test(t)) return true;
  if (/^SAVINGS ACCOUNT\s+INR/i.test(t)) return true;
  if (/^TOTAL \(INR\)/i.test(t)) return true;
  return false;
}

const INLINE_NOISE: RegExp[] = [
  /Opening Balance[\s\S]*/gi,
  /Closing Balance[\s\S]*/gi,
  /Statement of Account[\s\S]*/gi,
  /Bank of Baroda[\s\S]*/gi,
  /Page\s+\d+[\s\S]*/gi,
  /ABBREVIATIONS[\s\S]*/gi,
  /https?:\/\/[\s\S]*/gi,
  /Customer Care[\s\S]*/gi,
];

function cleanDesc(str: string): string {
  let s = str;
  for (const re of INLINE_NOISE) s = s.replace(re, "");
  return s.replace(/\s+/g, " ").trim();
}

// ─────────────────────────────────────────────────────────────
// ROW GROUPING (per page)
// ─────────────────────────────────────────────────────────────
interface Cell {
  col: ColName;
  text: string;
  x: number;
}
interface Row {
  y: number;
  cells: Cell[];
}

function groupPageRows(pageTexts: any[]): Row[] {
  const items = pageTexts
    .map((t) => ({ text: decode(t.R), x: t.x as number, y: t.y as number }))
    .filter((t) => t.text && !isNoiseLine(t.text));

  items.sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));

  const rows: Row[] = [];
  for (const item of items) {
    const col = classifyCol(item.x);
    if (!col) continue;

    let row = rows.find((r) => Math.abs(r.y - item.y) <= ROW_Y_TOLERANCE);
    if (!row) {
      row = { y: item.y, cells: [] };
      rows.push(row);
    }

    const existing = row.cells.find((c) => c.col === col);
    if (existing) existing.text += " " + item.text;
    else row.cells.push({ col, text: item.text, x: item.x });
  }
  return rows;
}

// ─────────────────────────────────────────────────────────────
// TRANSACTION PARSING (per page)
// ─────────────────────────────────────────────────────────────
function parsePageTransactions(
  rows: Row[],
  pendingFromPrev: RawTransaction | null,
): {
  completed: RawTransaction[];
  pending: RawTransaction | null;
  openingBalance: number | null;
} {
  const completed: RawTransaction[] = [];
  let cur: RawTransaction | null = pendingFromPrev;
  let openingBalance: number | null = null;

  for (const row of rows) {
    const cell: Partial<Record<ColName, string>> = {};
    for (const c of row.cells) cell[c.col] = c.text.trim();

    const dateStr = cell.date ?? "";
    const narr = cell.narration ?? "";

    // Skip Opening/Closing Balance rows (they have a date but are not transactions)
    if (/opening balance/i.test(narr)) {
      if (cell.balance) openingBalance = parseAmount(cell.balance);
      continue;
    }
    if (/closing balance/i.test(narr)) continue;

    if (isBOBDate(dateStr)) {
      if (cur) completed.push(cur);
      cur = {
        date: parseDate(dateStr),
        descLines: narr ? [narr] : [],
        debit: parseAmount(cell.withdrawal),
        credit: parseAmount(cell.deposit),
        balance: parseAmount(cell.balance),
      };
    } else if (cur && narr) {
      cur.descLines.push(narr);
      if (cur.balance === null && cell.balance)
        cur.balance = parseAmount(cell.balance);
      if (cur.debit === null && cell.withdrawal)
        cur.debit = parseAmount(cell.withdrawal);
      if (cur.credit === null && cell.deposit)
        cur.credit = parseAmount(cell.deposit);
    }
  }

  return { completed, pending: cur, openingBalance };
}

function finalizeRaw(
  cur: RawTransaction,
): RawTransaction & { description: string } {
  return { ...cur, description: cleanDesc(cur.descLines.join(" ")) };
}

// ─────────────────────────────────────────────────────────────
// META EXTRACTION (page 1)
// ─────────────────────────────────────────────────────────────
function extractMeta(allPageTexts: any[][]): BOBMeta {
  // Use all pages — BOB puts IFSC/Branch/Nominee on page 2
  const items = allPageTexts
    .flatMap((pageTexts) =>
      pageTexts.map((t: any) => ({
        text: decode(t.R),
        x: t.x as number,
        y: t.y as number,
      })),
    )
    .filter((t) => t.text);

  // Page 1 items only for account holder (avoid picking up nominee name)
  const page1Items = allPageTexts[0]
    .map((t: any) => ({
      text: decode(t.R),
      x: t.x as number,
      y: t.y as number,
    }))
    .filter((t: any) => t.text);

  const fullText = items.map((t) => t.text).join(" ");

  // Account holder — BOB uses "MR. NAME" or "MRS. NAME" style
  const notAName =
    /\b(BRANCH|BANK|ROAD|NAGAR|COMPLEX|TOWER|MAIDAN|THANA|CHOWK|MARKET|BUILDING)\b/i;
  const titledRe =
    /^(MR\.?|MRS\.?|MS\.?|DR\.?|SHRI\.?|SMT\.?)\s+[A-Z][A-Z\s\.]{2,40}$/i;

  let accountHolder = "";
  const sorted = page1Items
    .filter((t: any) => t.y < 20)
    .sort((a: any, b: any) => a.y - b.y);
  for (const item of sorted) {
    if (titledRe.test(item.text) && !notAName.test(item.text)) {
      accountHolder = item.text.trim();
      break;
    }
  }
  // Fallback: regex scan
  if (!accountHolder) {
    const m = fullText.match(
      /(MR\.?|MRS\.?|MS\.?|DR\.?|SHRI\.?|SMT\.?)\s+([A-Z][A-Z\s\.]{2,40})(?=[^A-Z])/i,
    );
    if (m && !notAName.test(m[0])) accountHolder = m[0].trim();
  }

  // Account number: 14-digit pattern
  const accMatch = fullText.match(/\b(\d{14})\b/);
  const accountNo = accMatch ? accMatch[1] : "";

  // Nominee
  const nomineeMatch = fullText.match(
    /(?:Nominee|Nomination)\s*[:\-]?\s*([A-Z][A-Z\s\.]{2,40})/i,
  );
  const nominee = nomineeMatch ? nomineeMatch[1].trim() : "";

  // IFSC
  const ifscMatch = fullText.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/);
  const ifsc = ifscMatch ? ifscMatch[1] : "";

  // Branch
  const branchMatch = fullText.match(
    /Branch\s*[:\-]?\s*([A-Z][A-Z\s]+?)(?=\s{2,}|\n|,)/i,
  );
  const branch = branchMatch ? branchMatch[1].trim() : "";

  // Statement period — BOB uses "Dec 01, 2025 to Dec 31, 2025" or DD-MM-YYYY format
  let statementPeriod = "";
  const periodMatch1 = fullText.match(
    /(\d{2}-\d{2}-\d{4})\s*(?:to|-)\s*(\d{2}-\d{2}-\d{4})/i,
  );
  const periodMatch2 = fullText.match(
    /from\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
  );
  if (periodMatch1)
    statementPeriod = `${periodMatch1[1]} to ${periodMatch1[2]}`;
  else if (periodMatch2)
    statementPeriod = `${periodMatch2[1].trim()} to ${periodMatch2[2].trim()}`;

  return { accountHolder, accountNo, nominee, ifsc, branch, statementPeriod };
}

// ─────────────────────────────────────────────────────────────
// DEV REPORT
// ─────────────────────────────────────────────────────────────
function printDevReport(report: BOBReport): void {
  if (process.env.NODE_ENV === "production") return;

  const { meta, summary, transactions } = report;
  const L = "─".repeat(80);

  console.log("\n" + "═".repeat(80));
  console.log("  BANK OF BARODA — PARSED STATEMENT REPORT");
  console.log("═".repeat(80));
  console.log(`  Account Holder : ${meta.accountHolder}`);
  console.log(`  Account No.    : ${meta.accountNo}`);
  console.log(`  IFSC           : ${meta.ifsc}   Branch: ${meta.branch}`);
  console.log(`  Nominee        : ${meta.nominee || "N/A"}`);
  console.log(`  Period         : ${meta.statementPeriod}`);

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
  console.log(`  Transactions     : ${summary.transaction_count}`);

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
export async function parseBOB(
  buffer: Buffer,
  password?: string,
): Promise<BOBReport | { requiresPassword: true }> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true, password ?? "");

    pdfParser.on("pdfParser_dataError", (err: any) => {
      if (isPasswordError(err)) return resolve({ requiresPassword: true });
      reject(err);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const pages: any[] = pdfData.Pages;
        console.log(
          `\n📄 Parsing Bank of Baroda statement — ${pages.length} pages`,
        );

        // Meta from page 1
        const meta = extractMeta(pages.map((p) => p.Texts));

        // Process all pages independently
        let allTxns: RawTransaction[] = [];
        let pending: RawTransaction | null = null;
        let openingBalance: number | null = null;

        for (let i = 0; i < pages.length; i++) {
          const rows = groupPageRows(pages[i].Texts);
          const {
            completed,
            pending: p,
            openingBalance: ob,
          } = parsePageTransactions(rows, pending);

          allTxns = allTxns.concat(completed);
          pending = p;
          if (ob !== null) openingBalance = ob;

          console.log(`   Page ${i + 1}: ${completed.length} transactions`);
        }
        if (pending) allTxns.push(pending);

        // Normalize
        const transactions: NormalizedTransaction[] = allTxns
          .map(finalizeRaw)
          .filter((t) => t.description.trim() !== "")
          .map((t) => {
            const isDebit = t.debit !== null && t.debit > 0;
            return {
              date: t.date,
              description: t.description,
              amount: t.debit ?? t.credit ?? 0,
              type: isDebit ? "debit" : "credit",
              bank: "BOB" as const,
              balance: t.balance,
              category: getCategory(t.description),
            };
          });

        const totalDebits = transactions.reduce(
          (s, t) => (t.type === "debit" ? s + t.amount : s),
          0,
        );
        const totalCredits = transactions.reduce(
          (s, t) => (t.type === "credit" ? s + t.amount : s),
          0,
        );

        // Closing balance = last transaction's balance
        const closingBalance =
          transactions.length > 0
            ? transactions[transactions.length - 1].balance
            : null;

        const report: BOBReport = {
          meta,
          bank_name: "BOB",
          account_holder: meta.accountHolder,
          account_number: meta.accountNo,
          summary: {
            opening_balance: openingBalance,
            closing_balance: closingBalance,
            total_debits: +totalDebits.toFixed(2),
            total_credits: +totalCredits.toFixed(2),
            transaction_count: transactions.length,
          },
          transactions,
        };

        console.log(`✅ Parsed ${transactions.length} BOB transactions`);
        printDevReport(report);
        resolve(report);
      } catch (err) {
        reject(err);
      }
    });

    try {
      pdfParser.parseBuffer(buffer);
    } catch (syncErr: any) {
      if (isPasswordError(syncErr)) resolve({ requiresPassword: true });
      else reject(syncErr);
    }
  });
}
