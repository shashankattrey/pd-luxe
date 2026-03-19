import { parseSBI } from "@/lib/parsers/sbi";
import { parseICICI } from "@/lib/parsers/icici";
import { parseHDFC } from "@/lib/parsers/hdfc";
import { parseKOTAK } from "@/lib/parsers/kotak";
import { parseBOB } from "@/lib/parsers/bob";
import { isPasswordError, PASSWORD_REQUIRED } from "./pdf-password";

// ─────────────────────────────────────────────────────────────
// PARSER MAP
// Each parser accepts (buffer: Buffer, password?: string)
// ─────────────────────────────────────────────────────────────
const PARSER_MAP = {
  SBI: parseSBI,
  ICICI: parseICICI,
  HDFC: parseHDFC,
  KOTAK: parseKOTAK,
  BOB: parseBOB,
} as const;

type BankKey = keyof typeof PARSER_MAP;

// ─────────────────────────────────────────────────────────────
// POST /api/upload
//
// FormData fields:
//   file      — the PDF file
//   bankType  — "SBI" | "ICICI" | "HDFC" | "KOTAK" | "BOB"
//   password  — (optional) PDF unlock password
//
// Response shapes:
//   { requiresPassword: true }          → PDF is locked, prompt user
//   { error: string }                   → parse or validation error
//   { ...parsedReport }                 → success
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const bankType = formData.get("bankType") as string | null;
    const password = formData.get("password") as string | null;

    // ── Validation ──────────────────────────────────────────
    if (!file || !bankType) {
      return Response.json(
        { error: "Missing file or bank type" },
        { status: 400 },
      );
    }

    const upperBank = bankType.toUpperCase() as BankKey;

    if (!(upperBank in PARSER_MAP)) {
      return Response.json(
        {
          error: `Unsupported bank: "${bankType}". Supported: ${Object.keys(PARSER_MAP).join(", ")}`,
        },
        { status: 400 },
      );
    }

    // ── Parse ────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = PARSER_MAP[upperBank];

    const result = await parser(buffer, password ?? undefined);

    // ── Password required ────────────────────────────────────
    // Any parser can resolve with { requiresPassword: true }
    // when the PDF is encrypted and no (or wrong) password was supplied.
    if ("requiresPassword" in result && result.requiresPassword) {
      return Response.json(
        { requiresPassword: true },
        { status: 422 }, // 422 Unprocessable — needs user action
      );
    }

    return Response.json(result);
  } catch (error: any) {
    // ── Catch-all — also handles password errors that bubble up as throws ──
    // pdf2json throws { parserError: "PasswordException: ..." } asynchronously
    // via timers, which bypasses the pdfParser_dataError event entirely.
    // We must check both isPasswordError() AND the raw parserError string.
    const parserErrStr =
      typeof error?.parserError === "string"
        ? error.parserError.toLowerCase()
        : "";

    if (
      isPasswordError(error) ||
      parserErrStr.includes("password") ||
      parserErrStr.includes("passwordexception")
    ) {
      return Response.json({ requiresPassword: true }, { status: 422 });
    }

    console.error("[upload] Parse error:", error);
    return Response.json(
      {
        error:
          error?.message ??
          error?.parserError ??
          "Unknown error during parsing",
      },
      { status: 500 },
    );
  }
}
