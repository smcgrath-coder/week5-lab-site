import { useState } from "react";
import { getCompleteness } from "../state/completeness";
import { usePasscode } from "../state/passcode";

function downloadFilename(name) {
  const safe = (name || "student").trim().replace(/[/\\:*?"<>|]/g, "").replace(/\s+/g, "-");
  return `week5-lab-${safe || "student"}.pdf`;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function Finish({ labState, onNavigate }) {
  const passcode = usePasscode();
  const [emailStatus, setEmailStatus] = useState("idle");

  const completeness = getCompleteness(labState.state);
  const allMissing = Object.values(completeness).flatMap((c) => c.missing);

  async function handleDownload() {
    const { generatePdfBlob } = await import("../pdf/LabPdf");
    const blob = await generatePdfBlob(labState.state);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename(labState.state.student.name);
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleEmail() {
    setEmailStatus("sending");
    try {
      const { generatePdfBlob } = await import("../pdf/LabPdf");
      const blob = await generatePdfBlob(labState.state);
      const pdfBase64 = await blobToBase64(blob);
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, studentName: labState.state.student.name, pdfBase64 }),
      });
      if (!res.ok) throw new Error("email failed");
      setEmailStatus("success");
    } catch {
      setEmailStatus("error");
    }
  }

  return (
    <div className="lab-screen">
      <button type="button" className="back-link" onClick={() => onNavigate("hub")}>
        ← Back to hub
      </button>

      <h1>Finish</h1>

      <h2>Checklist</h2>
      <p className="lab-hint">
        Blank sections are listed so nothing is missing by accident. An honest incomplete beats a
        padded complete.
      </p>
      {allMissing.length === 0 ? (
        <p>Everything is filled in.</p>
      ) : (
        <ul className="checklist">
          {allMissing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      <div className="finish-actions">
        <button type="button" onClick={handleDownload}>
          Download PDF
        </button>
        <button type="button" onClick={handleEmail} disabled={emailStatus === "sending"}>
          {emailStatus === "sending" ? "Sending…" : "Email a copy to my instructor"}
        </button>
      </div>

      {emailStatus === "success" && <p className="email-success">Sent. Your instructor has a copy.</p>}
      {emailStatus === "error" && (
        <p className="error-banner" role="alert">
          Email failed. Download the PDF and submit it on Canvas instead.
        </p>
      )}

      <p className="lab-hint">
        Canvas upload is the official submission either way. The PDF download always works, even if
        email doesn't.
      </p>
    </div>
  );
}
