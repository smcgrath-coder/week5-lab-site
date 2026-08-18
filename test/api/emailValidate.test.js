import { describe, expect, it } from "vitest";
import { MAX_PDF_BYTES } from "../../api/_lib/limits";
import { validateEmailRequest } from "../../api/_lib/validateEmail";

const env = { CLASS_PASSCODE: "class-secret" };
const smallPdfBase64 = Buffer.from("not a real pdf").toString("base64");

describe("validateEmailRequest — passcode", () => {
  it("rejects a wrong passcode with 401", () => {
    const result = validateEmailRequest(
      { passcode: "wrong", studentName: "Rion", pdfBase64: smallPdfBase64 },
      env
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(typeof result.error).toBe("string");
  });

  it("accepts a matching passcode with a valid small PDF", () => {
    const result = validateEmailRequest(
      { passcode: "class-secret", studentName: "Rion", pdfBase64: smallPdfBase64 },
      env
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("validateEmailRequest — pdfBase64", () => {
  it("rejects a request with no pdfBase64 with 400", () => {
    const result = validateEmailRequest({ passcode: "class-secret", studentName: "Rion" }, env);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(typeof result.error).toBe("string");
  });

  it("rejects a PDF over the size cap with 413", () => {
    // base64 encodes 3 bytes as 4 chars, so this comfortably decodes to > MAX_PDF_BYTES
    const oversized = "A".repeat(Math.ceil((MAX_PDF_BYTES + 1000) / 3) * 4);
    const result = validateEmailRequest(
      { passcode: "class-secret", studentName: "Rion", pdfBase64: oversized },
      env
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe(413);
    expect(typeof result.error).toBe("string");
  });

  it("accepts a PDF right at the size cap", () => {
    const atCap = "A".repeat(Math.floor(MAX_PDF_BYTES / 3) * 4);
    const result = validateEmailRequest(
      { passcode: "class-secret", studentName: "Rion", pdfBase64: atCap },
      env
    );
    expect(result).toEqual({ ok: true });
  });
});
