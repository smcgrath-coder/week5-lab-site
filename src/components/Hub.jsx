import { importBackup } from "../state/labState";
import { getCompleteness } from "../state/completeness";

const STOPS = [
  { id: "lab1", title: "Lab 1 — Prompt Engineering Fundamentals" },
  { id: "lab2", title: "Lab 2 — Applied Task Labs" },
  { id: "lab3", title: "Lab 3 — Break It on Purpose" },
  { id: "lab4", title: "Lab 4 — Grounding and Its Limits" },
  { id: "wrapUp", title: "Wrap-Up" },
];

export default function Hub({ labState, onNavigate, onStartOver, isFirstVisit = false }) {
  const completeness = getCompleteness(labState.state);
  const firstIncomplete = STOPS.find((s) => !completeness[s.id].done)?.id ?? STOPS[0].id;

  function handleDownloadBackup() {
    const { blob, filename } = labState.exportBackup();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRestoreBackup(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const restored = await importBackup(file);
      labState.restoreState(restored);
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div className="hub">
      <p className="autosave-indicator">Autosaving to this browser as you go.</p>
      <h1>
        {isFirstVisit ? "Welcome" : "Welcome back"}, {labState.state.student.name || "there"}
      </h1>

      <button type="button" className="continue-button" onClick={() => onNavigate(firstIncomplete)}>
        Continue
      </button>

      <div className="hub-cards">
        {STOPS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="hub-card"
            onClick={() => onNavigate(s.id)}
          >
            <span className="hub-card-title">{s.title}</span>
            <span className={`hub-card-status${completeness[s.id].done ? " done" : ""}`}>
              {completeness[s.id].done ? "✓ Complete" : "In progress"}
            </span>
          </button>
        ))}
      </div>

      <button type="button" className="finish-link" onClick={() => onNavigate("finish")}>
        Finish &amp; submit →
      </button>

      <div className="backup-controls">
        <button type="button" onClick={handleDownloadBackup}>
          Download backup
        </button>
        <label className="restore-backup-label">
          Restore backup
          <input type="file" accept="application/json" onChange={handleRestoreBackup} />
        </label>
      </div>

      <button
        type="button"
        className="start-over-button"
        onClick={() => {
          if (
            window.confirm(
              "Start over? This clears all saved work on this browser. Use this before handing off a shared computer to another student."
            )
          ) {
            onStartOver();
          }
        }}
      >
        Start over (clear this browser)
      </button>
    </div>
  );
}
