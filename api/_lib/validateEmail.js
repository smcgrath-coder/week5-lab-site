import { MAX_PDF_BYTES } from "./limits.js";

export function validateEmailRequest(body, env) {
  if (body?.passcode !== env.CLASS_PASSCODE) {
    return { ok: false, status: 401, error: "That passcode isn't right. Check with your instructor." };
  }

  if (typeof body?.pdfBase64 !== "string" || body.pdfBase64.length === 0) {
    return { ok: false, status: 400, error: "Missing PDF data." };
  }

  if (Buffer.byteLength(body.pdfBase64, "base64") > MAX_PDF_BYTES) {
    return { ok: false, status: 413, error: "The PDF is too large to email." };
  }

  return { ok: true };
}
