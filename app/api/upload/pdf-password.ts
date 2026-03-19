/**
 * Shared utility for handling password-protected PDFs across all parsers.
 *
 * Usage in any parser's pdfParser_dataError handler:
 *
 *   pdfParser.on("pdfParser_dataError", (err) => {
 *     if (isPasswordError(err)) return resolve(PASSWORD_REQUIRED);
 *     reject(err);
 *   });
 */

/** Standard response shape when a PDF requires a password */
export const PASSWORD_REQUIRED = {
  requiresPassword: true as const,
};

export type PasswordRequiredResponse = typeof PASSWORD_REQUIRED;

/** Returns true if the pdf2json error is a password/encryption error */
export function isPasswordError(err: any): boolean {
  if (!err) return false;

  // pdf2json throws password errors in several shapes depending on
  // whether the error fires synchronously, via event, or via async timer:
  //
  //   { parserError: "PasswordException: No password given" }  ← most common
  //   { name: "PasswordException", message: "..." }
  //   { code: 471 }
  //   Error object with message containing "password"
  //   Raw string "PasswordException: ..."

  // Handle case where err is a plain string
  if (typeof err === "string") {
    const s = err.toLowerCase();
    return (
      s.includes("passwordexception") ||
      s.includes("password") ||
      s.includes("encrypted")
    );
  }

  const parserErrStr =
    typeof err.parserError === "string" ? err.parserError.toLowerCase() : "";
  const parserErrMsg = (err?.parserError?.message || "").toLowerCase();
  const errMsg = (err?.message || "").toLowerCase();
  const errName = (err?.name || "").toLowerCase();

  return (
    errName.includes("passwordexception") ||
    err.code === 471 ||
    parserErrStr.includes("passwordexception") ||
    parserErrStr.includes("password") ||
    parserErrMsg.includes("password") ||
    errMsg.includes("passwordexception") ||
    errMsg.includes("no password") ||
    errMsg.includes("encrypted") ||
    errMsg.includes("decrypt")
  );
}
