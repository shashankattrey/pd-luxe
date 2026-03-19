import PDFParser from "pdf2json";
import { getCategory } from "./categorizer";
import fs from "fs";

type Frag = {
  x: number;
  y: number;
  text: string;
};

type Row = {
  y: number;
  items: Frag[];
};

type ICICIRawTxn = {
  date: string;
  mode: string;
  _partsLines: string[];
  credit: number | null;
  debit: number | null;
  balance: number | null;
};

type ICICITxn = {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  bank: string;
  balance: number | null;
  mode: string;
  category?: string;
};

// -- Configuration --
const COL = {
  DATE: [1.5, 4.0],
  MODE: [4.0, 8.2],
  PARTS: [8.2, 21.0],
  DEP: [21.0, 25.0],
  DEBIT: [25.0, 30.4],
  BAL: [30.4, 34.0],
};

// Y_MIN/Y_MAX were removed — they were cutting off transactions on every page.
// ROW_TOL: items within this Y-distance are on the same row.
// PARTS_GAP: max Y-distance to look above/below for multi-line descriptions.
const ROW_TOL = 0.15,
  PARTS_GAP = 0.5;

// Noise lines that appear in ICICI page headers/footers — skip entirely
const NOISE_LINES = [
  /^S\.No\.$/,
  /^Date$/,
  /^Mode$/,
  /^Particulars$/,
  /^Deposits$/,
  /^Withdrawals$/,
  /^Balance$/,
  /^ICICI Bank/i,
  /^Statement of Account/i,
  /^Page\s+\d+/i,
  /^Account No/i,
  /^Branch/i,
  /^IFSC/i,
  /^Opening Balance/i,
];

function isNoiseLine(s: string): boolean {
  return NOISE_LINES.some((re) => re.test(s.trim()));
}

// -- Meta Extraction --
// ICICI statements have account holder name in the page header area (y < 18)
// It appears as a standalone name line, typically near the top of page 1.
function extractAccountHolder(page1Texts: any[]): string {
  const items = page1Texts
    .map((ti) => ({
      y: ti.y as number,
      x: ti.x as number,
      text: (ti.R || [])
        .map((r: any) => safeDecode(r.T))
        .join("")
        .trim(),
    }))
    .filter((t) => t.text);

  // Strategy 1: titled name anywhere on page — MR./MRS./MS./DR./SHRI/SMT
  // This is the most reliable signal. ICICI always prints the name with a title.
  const titledNameRe =
    /^(MR\.?|MRS\.?|MS\.?|DR\.?|SHRI\.?|SMT\.?)\s+[A-Z][A-Z\s\.]{2,40}$/i;

  // Words that indicate it's NOT a person's name (branch/bank/place names)
  const notAName =
    /\b(BRANCH|BANK|ROAD|MAIDAN|NAGAR|COMPLEX|TOWER|HOUSE|OFFICE|THANA|CHOWK|MARKET)\b/i;

  // Check header area first (y < 15) sorted top-to-bottom
  const headerItems = items
    .filter((t) => t.y < 15)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  for (const item of headerItems) {
    if (titledNameRe.test(item.text) && !notAName.test(item.text)) {
      return item.text.trim();
    }
  }

  // Strategy 2: widen Y range but still require title prefix
  const widerItems = items
    .filter((t) => t.y < 20)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  for (const item of widerItems) {
    if (titledNameRe.test(item.text) && !notAName.test(item.text)) {
      return item.text.trim();
    }
  }

  // Strategy 3: scan full text for titled name pattern
  const fullText = items
    .sort((a, b) => a.y - b.y)
    .map((t) => t.text)
    .join("\n");

  const m = fullText.match(
    /(MR\.?|MRS\.?|MS\.?|DR\.?|SHRI\.?|SMT\.?)\s+([A-Z][A-Z\s\.]{2,40})/i,
  );
  if (m) {
    const candidate = (m[1] + " " + m[2]).trim();
    if (!notAName.test(candidate)) return candidate;
  }

  return "";
}

// -- Helpers --
function normalizeICICITxn(txn: any): ICICITxn {
  const parts = txn.date.split("-");
  const isoDate =
    parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : txn.date;

  return {
    date: isoDate,
    description: txn.particulars,
    amount: txn.credit || txn.debit || 0,
    type: txn.credit ? "credit" : "debit",
    bank: "ICICI",
    balance: txn.balance,
    mode: txn.mode,
    category: getCategory(txn.particulars),
  };
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch (_) {
    return s.replace(/%(?![0-9A-Fa-f]{2})/g, "%25");
  }
}

function col(x: number): string | null {
  for (const [k, [lo, hi]] of Object.entries(COL)) {
    if (x >= lo && x < hi) return k;
  }
  return null;
}

function parseAmt(s: string): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

function isDate(s: string): boolean {
  return /^\d{2}-\d{2}-\d{4}$/.test(s);
}

function joinSameLine(frags: Frag[]): string {
  return frags
    .sort((a: Frag, b: Frag) => a.x - b.x)
    .map((f: Frag) => f.text)
    .join("");
}

function groupRows(items: Frag[]): Row[] {
  const rows: Row[] = [];

  for (const item of [...items].sort((a, b) => a.y - b.y)) {
    const row = rows.find((r) => Math.abs(r.y - item.y) <= ROW_TOL);
    if (row) row.items.push(item);
    else rows.push({ y: item.y, items: [item] });
  }

  return rows.sort((a, b) => a.y - b.y);
}

// -- Process a single page → transactions + opening balance if found --
function parsePage(
  pageTexts: any[],
  pendingFromPrev: ICICIRawTxn | null,
): {
  completed: ICICITxn[];
  pending: ICICIRawTxn | null;
  openingBalance: number | null;
} {
  // Collect all text items on this page, filter noise
  const items = pageTexts
    .map((ti) => ({
      x: parseFloat(ti.x.toFixed(4)),
      y: parseFloat(ti.y.toFixed(4)),
      text: (ti.R || []).map((r: any) => safeDecode(r.T)).join(""),
    }))
    .filter((t) => t.text.trim() && !isNoiseLine(t.text));

  const rows = groupRows(items);
  const completed: ICICITxn[] = [];
  let cur: ICICIRawTxn | null = pendingFromPrev;
  let openingBalance: number | null = null;

  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];

    const dateStr = joinSameLine(
      row.items.filter((i: Frag) => col(i.x) === "DATE"),
    ).replace(/\s/g, "");

    const balStr = joinSameLine(
      row.items.filter((i: Frag) => col(i.x) === "BAL"),
    ).trim();

    const partsFrags = row.items.filter((i: Frag) => col(i.x) === "PARTS");

    // Opening balance row (B/F)
    if (joinSameLine(partsFrags).trim() === "B/F" && balStr) {
      openingBalance = parseAmt(balStr);
      continue;
    }

    if (!isDate(dateStr)) {
      // If no date but has PARTS text — could be a continuation of pending txn
      if (cur && partsFrags.length) {
        const contText = joinSameLine(partsFrags).trim();
        if (contText) cur._partsLines.push(contText);
      }
      continue;
    }

    // New transaction row found — flush pending
    if (cur) completed.push(buildTxn(cur));

    // Multi-line description: look above
    const partsLines: string[] = [];
    for (let j = ri - 1; j >= 0; j--) {
      const candidate = rows[j];
      if (row.y - candidate.y > PARTS_GAP) break;
      const cp = candidate.items.filter((i: Frag) => col(i.x) === "PARTS");
      if (cp.length) partsLines.unshift(joinSameLine(cp));
    }

    // Current row
    if (partsFrags.length) partsLines.push(joinSameLine(partsFrags));

    // Look below (only non-date rows within gap)
    for (let j = ri + 1; j < rows.length; j++) {
      const candidate = rows[j];
      if (candidate.y - row.y > PARTS_GAP) break;
      const nextDate = joinSameLine(
        candidate.items.filter((i: Frag) => col(i.x) === "DATE"),
      ).replace(/\s/g, "");
      if (isDate(nextDate)) break;
      const cp = candidate.items.filter((i: Frag) => col(i.x) === "PARTS");
      if (cp.length) partsLines.push(joinSameLine(cp));
    }

    cur = {
      date: dateStr,
      mode: joinSameLine(
        row.items.filter((i: Frag) => col(i.x) === "MODE"),
      ).replace(/\s+/g, ""),
      _partsLines: partsLines,
      credit: parseAmt(
        joinSameLine(row.items.filter((i: Frag) => col(i.x) === "DEP")).trim(),
      ),
      debit: parseAmt(
        joinSameLine(
          row.items.filter((i: Frag) => col(i.x) === "DEBIT"),
        ).trim(),
      ),
      balance: parseAmt(balStr),
    };
  }

  return { completed, pending: cur, openingBalance };
}

function buildTxn(cur: ICICIRawTxn): ICICITxn {
  const particulars = cur._partsLines
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return normalizeICICITxn({ ...cur, particulars });
}

// -- Dev Report --
function printDevReport(output: any): void {
  if (process.env.NODE_ENV === "production") return;

  const { summary, transactions } = output;
  const L = "─".repeat(80);

  console.log("\n" + "═".repeat(80));
  console.log("  ICICI BANK — PARSED STATEMENT REPORT");
  console.log("═".repeat(80));
  if (output.account_holder && output.account_holder !== "Unknown") {
    console.log(`  Account Holder : ${output.account_holder}`);
  }

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
    const desc = (t.description ?? "").slice(0, 40);
    console.log(
      `  ${t.date.padEnd(12)}${type.padEnd(8)}${amt}  ${bal}  ${desc}`,
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
      const desc = (t.description ?? "").slice(0, 40);
      console.log(
        `  ${t.date.padEnd(12)}${type.padEnd(8)}${amt}  ${bal}  ${desc}`,
      );
    }
  }

  console.log("\n" + "═".repeat(80) + "\n");
}

// --- Parser ---
export async function parseICICI(
  fileBuffer: Buffer,
  password?: string,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true);
    if (password) {
      (pdfParser as any).setPassword(password);
    }

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        console.log("\n📄 Parsing ICICI Bank statement …\n");

        const pages: any[] = pdfData.Pages;
        console.log(`   Total pages: ${pages.length}`);

        // Extract account holder from page 1 header
        const accountHolder = extractAccountHolder(pages[0].Texts);
        if (accountHolder) console.log(`   Account Holder: ${accountHolder}`);

        let allTransactions: any[] = [];
        let openingBalance: number | null = null;
        let pending: any | null = null;

        // Process every page independently — no Y filter, no page skip
        for (let i = 0; i < pages.length; i++) {
          const {
            completed,
            pending: p,
            openingBalance: ob,
          } = parsePage(pages[i].Texts, pending);

          allTransactions = allTransactions.concat(completed);
          pending = p;
          if (ob !== null) openingBalance = ob;

          console.log(`   Page ${i + 1}: ${completed.length} transactions`);
        }

        // Flush last pending transaction
        if (pending) allTransactions.push(buildTxn(pending));

        if (!allTransactions.length) {
          return reject("No ICICI transactions parsed");
        }

        const totalCredit = allTransactions.reduce(
          (s, t) => s + (t.type === "credit" ? t.amount : 0),
          0,
        );
        const totalDebit = allTransactions.reduce(
          (s, t) => s + (t.type === "debit" ? t.amount : 0),
          0,
        );

        // Closing balance = last transaction's balance
        const closingBal = allTransactions.at(-1)?.balance ?? null;

        const output = {
          bank_name: "ICICI",
          account_holder: accountHolder || "Unknown",
          summary: {
            opening_balance: openingBalance,
            total_credits: Number(totalCredit.toFixed(2)),
            total_debits: Number(totalDebit.toFixed(2)),
            closing_balance: closingBal,
            count: allTransactions.length,
          },
          transactions: allTransactions,
        };

        fs.writeFileSync(
          "icici_final_report.json",
          JSON.stringify(output, null, 2),
        );
        console.log(
          `✅ Success! Processed ${allTransactions.length} ICICI transactions.`,
        );

        printDevReport(output);
        resolve(output);
      } catch (err) {
        reject(err);
      }
    });

    pdfParser.on("pdfParser_dataError", (err: any) => {
      const errorMsg = err?.parserError?.message || err?.message || "";
      if (
        err.name === "PasswordException" ||
        err.code === 471 ||
        errorMsg.toLowerCase().includes("password")
      ) {
        return resolve({ requiresPassword: true });
      }
      reject(err);
    });

    pdfParser.parseBuffer(fileBuffer);
  });
}
