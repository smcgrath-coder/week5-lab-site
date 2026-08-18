import { useState } from "react";
import { LABS } from "../data/labs";
import { savePasscode } from "../state/passcode";

const LANES = [
  { id: "clinical", label: "Clinical", blurb: "Patient-facing scenarios." },
  { id: "operational", label: "Operational", blurb: "Policy, workflow, and administrative scenarios." },
];

export default function Landing({ initialStudent, onSuccess }) {
  const [name, setName] = useState(initialStudent?.name || "");
  const [lane, setLane] = useState(initialStudent?.lane || null);
  const [acknowledgedPHI, setAcknowledgedPHI] = useState(initialStudent?.acknowledgedPHI || false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const canBegin = Boolean(name.trim() && lane && acknowledgedPHI && passcode.trim()) && !checking;

  async function handleBegin() {
    setError("");
    setChecking(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, ping: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "That passcode isn't right. Check with your instructor.");
        setChecking(false);
        return;
      }
      savePasscode(passcode);
      onSuccess({ name: name.trim(), lane, acknowledgedPHI: true, passcode });
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setChecking(false);
    }
  }

  return (
    <div className="landing">
      <h1>{LABS.intro.title}</h1>
      <p className="landing-course-line">{LABS.intro.courseLine}</p>

      {LABS.intro.howToUse.map((para) => (
        <p key={para.slice(0, 24)}>{para}</p>
      ))}
      <p>{LABS.intro.lanesNote}</p>

      <div className="phi-warning">
        <p>
          <strong>Before you start:</strong> {LABS.intro.phiWarning}
        </p>
        <label className="phi-checkbox">
          <input
            type="checkbox"
            checked={acknowledgedPHI}
            onChange={(e) => setAcknowledgedPHI(e.target.checked)}
          />
          I understand and will not enter real patient information or PHI.
        </label>
      </div>

      <label className="field">
        <span>Your name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First and last name"
        />
      </label>

      <div className="lane-picker">
        {LANES.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`lane-card${lane === l.id ? " selected" : ""}`}
            aria-pressed={lane === l.id}
            onClick={() => setLane(l.id)}
          >
            <span className="lane-card-label">{l.label}</span>
            <span className="lane-card-blurb">{l.blurb}</span>
          </button>
        ))}
      </div>
      <p className="lane-note">You can switch lanes per task later. This is just a starting point.</p>

      <label className="field">
        <span>Class passcode</span>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
        />
      </label>

      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="begin-button" disabled={!canBegin} onClick={handleBegin}>
        {checking ? "Checking…" : "Begin"}
      </button>
    </div>
  );
}
