import PDFParser from "pdf2json";
import { getCategory } from "./categorizer";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface RawTransaction {
  date: string;
  descLines: string[];
  refNo: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

interface NormalizedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  bank: "KOTAK";
  refNo: string;
  balance: number | null;
  category?: string;
}

interface KotakMeta {
  accountHolder: string;
  accountNo: string;
  accountType: string;
  crn: string;
  ifsc: string;
  micr: string;
  branch: string;
  branchPhone: string;
  statementPeriod: string;
}

interface KotakReport {
  meta: KotakMeta;
  bank_name: "KOTAK";
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
// COLUMN BOUNDARIES (verified from coordinate dump)
// Same layout for Savings, Current, Salary, NRI accounts
// ─────────────────────────────────────────────────────────────
const COL = {
  serial: { min: 1.8, max: 3.8 },
  date: { min: 3.8, max: 6.5 },
  desc: { min: 6.5, max: 16.5 },
  ref: { min: 16.5, max: 22.0 },
  withdrawal: { min: 22.0, max: 27.5 },
  deposit: { min: 27.5, max: 31.5 },
  balance: { min: 31.5, max: 36.0 },
} as const;

type ColName = keyof typeof COL;
const ROW_Y_TOLERANCE = 0.35;

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
  const n = parseFloat(str.replace(/,/g, "").trim());
  return isNaN(n) ? null : n;
}

const MONTHS: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

function parseDate(str: string): string {
  const m = str.trim().match(/^(\d{2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (m) return `${m[3]}-${MONTHS[m[2]] ?? "00"}-${m[1]}`;
  return str.trim();
}

function isKotakDate(str: string): boolean {
  return /^\d{2}\s+[A-Za-z]{3}\s+\d{4}$/.test(str.trim());
}

// ─────────────────────────────────────────────────────────────
// NOISE FILTERING
// ─────────────────────────────────────────────────────────────
function isNoiseLine(s: string): boolean {
  const t = s.trim();
  if (!t || t === "-") return true;
  if (/^Page\s+\d+\s+of\s+\d+$/i.test(t)) return true;
  if (/^Statement Generated/i.test(t)) return true;
  if (/^(Savings|Current|Salary|NRI) Account Transactions$/i.test(t))
    return true;
  if (/^Account (No\.|Statement|Type|Status)/i.test(t)) return true;
  if (/^(#|Date|Description|Balance)$/.test(t)) return true;
  if (/^Chq\/Ref\. No\.$/.test(t)) return true;
  if (/^Withdrawal \(Dr\.\)$/.test(t)) return true;
  if (/^Deposit \(Cr\.\)$/.test(t)) return true;
  return false;
}

const INLINE_NOISE_PATTERNS: RegExp[] = [
  /\d{2}\s+\w+\s+\d{4}\s*-\s*\d{2}\s+\w+\s+\d{4}\s+(Savings|Current|Salary|NRI) Account Transactions/gi,
  /\s*Account Summary[\s\S]*/gi,
  /\s*End of Statement[\s\S]*/gi,
  /one month from the date of receipt[\s\S]*/gi,
  /This is a system generated report[\s\S]*/gi,
  /For assistance[\s\S]*/gi,
  /Any discrepancy[\s\S]*/gi,
  /Kotak Mahindra Bank Ltd\.[\s\S]*/gi,
  /Registered Office[\s\S]*/gi,
  /Remember![\s\S]*/gi,
  /Never share personal[\s\S]*/gi,
];

function cleanDesc(str: string): string {
  let s = str;
  for (const re of INLINE_NOISE_PATTERNS) s = s.replace(re, "");
  return s.replace(/\s+/g, " ").trim();
}

// ─────────────────────────────────────────────────────────────
// ROW GROUPING
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
// TRANSACTION PARSING
// ─────────────────────────────────────────────────────────────
function parsePageTransactions(
  rows: Row[],
  pendingFromPrev: RawTransaction | null,
): { completed: RawTransaction[]; pending: RawTransaction | null } {
  const completed: RawTransaction[] = [];
  let cur: RawTransaction | null = pendingFromPrev;

  for (const row of rows) {
    const cell: Partial<Record<ColName, string>> = {};
    for (const c of row.cells) cell[c.col] = c.text.trim();

    const dateStr = cell.date ?? "";

    if (isKotakDate(dateStr)) {
      if (cur) completed.push(cur);
      cur = {
        date: parseDate(dateStr),
        descLines: cell.desc ? [cell.desc] : [],
        refNo: cell.ref ?? "",
        debit: parseAmount(cell.withdrawal),
        credit: parseAmount(cell.deposit),
        balance: parseAmount(cell.balance),
      };
    } else if (cur && cell.desc) {
      cur.descLines.push(cell.desc);
      if (!cur.refNo && cell.ref) cur.refNo = cell.ref;
      if (cur.balance === null && cell.balance)
        cur.balance = parseAmount(cell.balance);
      if (cur.debit === null && cell.withdrawal)
        cur.debit = parseAmount(cell.withdrawal);
      if (cur.credit === null && cell.deposit)
        cur.credit = parseAmount(cell.deposit);
    }
  }
  return { completed, pending: cur };
}

function finalizeRaw(
  cur: RawTransaction,
): RawTransaction & { description: string } {
  return { ...cur, description: cleanDesc(cur.descLines.join(" ")) };
}

// ─────────────────────────────────────────────────────────────
// META EXTRACTION
// ─────────────────────────────────────────────────────────────
function extractMeta(page1Texts: any[]): KotakMeta {
  const items = page1Texts
    .map((t) => ({ text: decode(t.R), x: t.x as number, y: t.y as number }))
    .filter((t) => t.text);

  const LABEL_KEYS = [
    "Account No.",
    "Account Type",
    "Branch",
    "Branch Phone Number",
    "Account Status",
    "Nominee Registered",
    "Currency",
    "MICR",
    "IFSC Code",
  ];

  const kvMap: Record<string, string> = {};
  for (const item of items) {
    const key = item.text.trim();
    if (!LABEL_KEYS.includes(key)) continue;
    const val = items
      .filter((v) => Math.abs(v.y - item.y) < 0.4 && v.x > item.x)
      .sort((a, b) => a.x - b.x)[0];
    if (val && !LABEL_KEYS.includes(val.text.trim()))
      kvMap[key] = val.text.trim();
  }

  const holder = items
    .filter((t) => t.x >= 2 && t.x < 6 && t.y > 9 && t.y < 13)
    .sort((a, b) => a.y - b.y)[0];

  const period = items.find((t) =>
    /\d{2}\s+[A-Za-z]+\s+\d{4}\s+-\s+\d{2}\s+[A-Za-z]+\s+\d{4}/.test(t.text),
  );

  const crnItem = items.find((t) => /^CRN\s+/.test(t.text));

  return {
    accountHolder: holder?.text.trim() ?? "",
    accountNo: kvMap["Account No."] ?? "",
    accountType: kvMap["Account Type"] ?? "",
    crn: crnItem?.text.replace(/^CRN\s+/, "").trim() ?? "",
    ifsc: kvMap["IFSC Code"] ?? "",
    micr: kvMap["MICR"] ?? "",
    branch: kvMap["Branch"] ?? "",
    branchPhone: kvMap["Branch Phone Number"] ?? "",
    statementPeriod: period?.text.trim() ?? "",
  };
}

// ─────────────────────────────────────────────────────────────
// SUMMARY EXTRACTION
// ─────────────────────────────────────────────────────────────
function extractBalances(summaryPageTexts: any[]): {
  openingBalance: number | null;
  closingBalance: number | null;
} {
  const items = summaryPageTexts
    .map((t) => ({ text: decode(t.R), x: t.x as number, y: t.y as number }))
    .filter((t) => t.text);

  const acRow = items.find((t) =>
    /(Savings|Current|Salary|NRI) Account\s*\(\w+\)/i.test(t.text),
  );

  if (acRow) {
    const vals = items
      .filter((v) => Math.abs(v.y - acRow.y) < 0.6 && v.x > acRow.x)
      .sort((a, b) => a.x - b.x)
      .map((v) => parseAmount(v.text))
      .filter((n): n is number => n !== null);
    return { openingBalance: vals[0] ?? null, closingBalance: vals[1] ?? null };
  }

  const amounts = items
    .filter((t) => /^[\d,]+\.\d{2}$/.test(t.text.trim()))
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((t) => parseAmount(t.text))
    .filter((n): n is number => n !== null);

  return {
    openingBalance: amounts[0] ?? null,
    closingBalance: amounts[1] ?? null,
  };
}

// ─────────────────────────────────────────────────────────────
// DEV REPORT — prints a readable summary to console
// Only active when NODE_ENV !== "production"
// ─────────────────────────────────────────────────────────────
function printDevReport(report: KotakReport): void {
  if (process.env.NODE_ENV === "production") return;

  const { meta, summary, transactions } = report;
  const line = "─".repeat(80);

  // ── Header ──
  console.log("\n" + "═".repeat(80));
  console.log("  KOTAK BANK — PARSED STATEMENT REPORT");
  console.log("═".repeat(80));

  // ── Account info ──
  console.log(`  Account Holder : ${meta.accountHolder}`);
  console.log(`  Account No.    : ${meta.accountNo}`);
  console.log(`  Account Type   : ${meta.accountType}`);
  console.log(`  Period         : ${meta.statementPeriod}`);
  console.log(`  IFSC           : ${meta.ifsc}   Branch: ${meta.branch}`);

  // ── Financial summary ──
  console.log("\n" + line);
  console.log("  SUMMARY");
  console.log(line);
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

  // ── Category breakdown ──
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
    console.log("\n" + line);
    console.log("  CATEGORY BREAKDOWN (by debit spend)");
    console.log(line);
    for (const [cat, { count, total }] of categories) {
      const label = cat.padEnd(30);
      const txCount = `${count} txn`.padStart(8);
      const amount = total > 0 ? `  DR ₹${total.toLocaleString("en-IN")}` : "";
      console.log(`  ${label} ${txCount}${amount}`);
    }
  }

  // ── First 10 transactions ──
  console.log("\n" + line);
  console.log("  FIRST 10 TRANSACTIONS");
  console.log(line);
  console.log(
    "  " +
      "Date".padEnd(12) +
      "Type  ".padEnd(8) +
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
    const desc = (t.description ?? "").slice(0, 40);
    console.log(
      `  ${t.date.padEnd(12)}${type.padEnd(8)}${amt}  ${bal}  ${desc}`,
    );
  }

  if (transactions.length > 10) {
    console.log(`  ... and ${transactions.length - 10} more transactions`);
  }

  // ── Last 5 transactions ──
  if (transactions.length > 10) {
    console.log("\n" + line);
    console.log("  LAST 5 TRANSACTIONS");
    console.log(line);
    for (const t of transactions.slice(-5)) {
      const type = t.type === "debit" ? "DR" : "CR";
      const amt = `₹${t.amount.toLocaleString("en-IN")}`.padStart(12);
      const bal =
        t.balance != null
          ? `₹${t.balance.toLocaleString("en-IN")}`.padStart(12)
          : "".padStart(12);
      const desc = (t.description ?? "").slice(0, 40);
      console.log(
        `  ${t.date.padEnd(12)}${type.padEnd(8)}${amt}  ${bal}  ${desc}`,
      );
    }
  }

  console.log("\n" + "═".repeat(80) + "\n");
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export async function parseKOTAK(buffer: Buffer): Promise<KotakReport> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true);

    pdfParser.on("pdfParser_dataError", reject);

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      const pages: any[] = pdfData.Pages;

      const meta = extractMeta(pages[0].Texts);
      const summaryIdx = pages.length >= 2 ? pages.length - 2 : 0;
      const { openingBalance, closingBalance } = extractBalances(
        pages[summaryIdx].Texts,
      );

      const txnPageEnd = Math.max(pages.length - 2, 1);
      let rawTxns: RawTransaction[] = [];
      let pending: RawTransaction | null = null;

      for (let i = 0; i < txnPageEnd; i++) {
        const rows = groupPageRows(pages[i].Texts);
        const { completed, pending: p } = parsePageTransactions(rows, pending);
        rawTxns = rawTxns.concat(completed);
        pending = p;
      }
      if (pending) rawTxns.push(pending);

      const transactions: NormalizedTransaction[] = rawTxns
        .map(finalizeRaw)
        .filter((t) => !t.description.includes("Opening Balance"))
        .map((t) => {
          const isDebit = t.debit !== null && t.debit > 0;
          return {
            date: t.date,
            description: t.description,
            amount: t.debit ?? t.credit ?? 0,
            type: isDebit ? "debit" : "credit",
            bank: "KOTAK" as const,
            refNo: t.refNo.trim(),
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

      const report: KotakReport = {
        meta,
        bank_name: "KOTAK",
        account_holder: meta.accountHolder,
        account_number: meta.accountNo,
        summary: {
          opening_balance: openingBalance,
          closing_balance:
            transactions.length > 0
              ? (transactions[transactions.length - 1].balance ??
                closingBalance)
              : closingBalance,
          total_debits: +totalDebits.toFixed(2),
          total_credits: +totalCredits.toFixed(2),
          transaction_count: transactions.length,
        },
        transactions,
      };

      // ── Print dev report to console ──
      printDevReport(report);

      resolve(report);
    });

    pdfParser.parseBuffer(buffer);
  });
}
