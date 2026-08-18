import { useState } from "react";

export default function Instructor() {
  const [passcode, setPasscode] = useState("");
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function handleCheck() {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Couldn't check the balance.");
        setStatus("error");
        return;
      }
      setData(body);
      setStatus("success");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <div className="lab-screen">
      <h1>Instructor — OpenRouter Balance</h1>
      <p className="lab-hint">
        This page isn't linked from student navigation — bookmark the <code>#instructor</code> URL to
        return to it.
      </p>

      <label className="field">
        <span>Class passcode</span>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
        />
      </label>

      <button type="button" onClick={handleCheck} disabled={!passcode.trim() || status === "loading"}>
        {status === "loading" ? "Checking…" : "Check balance"}
      </button>

      {status === "error" && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}

      {status === "success" && data && (
        <div className="instructor-balance">
          <div className="instructor-balance-row">
            <span className="instructor-balance-label">Loaded</span>
            <span>${Number(data.totalCredits ?? 0).toFixed(2)}</span>
          </div>
          <div className="instructor-balance-row">
            <span className="instructor-balance-label">Used</span>
            <span>${Number(data.totalUsage ?? 0).toFixed(2)}</span>
          </div>
          <div className="instructor-balance-row">
            <span className="instructor-balance-label">Remaining</span>
            <strong>${Number(data.remaining ?? 0).toFixed(2)}</strong>
          </div>
        </div>
      )}

      <p className="lab-hint">
        A daily check alerts the instructor by email automatically when the remaining balance drops
        below the configured threshold. Spend caps and top-ups are managed in the OpenRouter
        dashboard, not here.
      </p>
    </div>
  );
}
