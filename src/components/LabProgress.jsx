export default function LabProgress({ steps }) {
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="lab-progress" data-testid="lab-progress">
      <p className="lab-progress-summary">
        {doneCount} of {steps.length} steps done
      </p>
      <ul>
        {steps.map((step) => (
          <li key={step.label} className={step.done ? "lab-progress-done" : ""}>
            <span aria-hidden="true">{step.done ? "✓" : "○"}</span> {step.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
