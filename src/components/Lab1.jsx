import ChatPanel from "./ChatPanel";
import ReflectionField from "./ReflectionField";
import { LABS } from "../data/labs";

function hasAssistantReply(conversation) {
  return Boolean(conversation?.messages?.some((m) => m.role === "assistant"));
}

export default function Lab1({ labState, onNavigate }) {
  const lab1 = labState.state.labs.lab1;

  function makeChatHandlers(slot) {
    const path = ["lab1", slot];
    return {
      onUpdate: ({ model, messages }) => labState.setConversationState(path, { model, messages }),
      allowNewConversation: true,
      onNewConversation: () => {
        if (window.confirm("Start a new conversation? This clears the current transcript for this panel.")) {
          labState.clearConversation(path);
        }
      },
    };
  }

  function toggleTechnique(id) {
    const current = lab1.techniques;
    const next = current.includes(id) ? current.filter((t) => t !== id) : [...current, id];
    labState.updateLab("lab1", { techniques: next });
  }

  return (
    <div className="lab-screen">
      <button type="button" className="back-link" onClick={() => onNavigate("hub")}>
        ← Back to hub
      </button>

      <h1>Lab 1 — Prompt Engineering Fundamentals</h1>
      <p>{LABS.lab1.goal}</p>

      <h2>Pick a task</h2>
      <div className="task-picker">
        {LABS.lab1.taskOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`task-card${lab1.taskChoice === opt.id ? " selected" : ""}`}
            aria-pressed={lab1.taskChoice === opt.id}
            onClick={() => labState.updateLab("lab1", { taskChoice: opt.id })}
          >
            <span className="task-card-lane">{opt.lane}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <h2>Version A — throwaway</h2>
      <p className="lab-hint">Fire off a fast, unstructured prompt for the task you picked.</p>
      <ChatPanel
        conversation={lab1.runA}
        caseButtons={[]}
        label="Version A — throwaway"
        {...makeChatHandlers("runA")}
      />
      <p className="lab-hint">{LABS.lab1.reflections.runA.prompt}</p>

      <h2>Version B — structured</h2>
      {!hasAssistantReply(lab1.runA) && (
        <p className="soft-warning">
          Tip: try Version A first so you have something concrete to compare against, but you can
          start B whenever you're ready.
        </p>
      )}
      <p className="lab-hint">
        Use one or more techniques below, then send a deliberately structured prompt.
      </p>
      <div className="technique-checkboxes">
        {LABS.lab1.techniques.map((t) => (
          <label key={t.id} className="technique-checkbox">
            <input
              type="checkbox"
              checked={lab1.techniques.includes(t.id)}
              onChange={() => toggleTechnique(t.id)}
            />
            {t.label}
          </label>
        ))}
      </div>
      <ChatPanel
        conversation={lab1.runB}
        caseButtons={[]}
        label="Version B — structured"
        {...makeChatHandlers("runB")}
      />
      <p className="lab-hint">{LABS.lab1.reflections.runB.prompt}</p>

      <ReflectionField
        label={LABS.lab1.reflections.comparison.prompt}
        value={lab1.reflectionComparison}
        onChange={(value) => labState.updateLab("lab1", { reflectionComparison: value })}
        graded
      />
    </div>
  );
}
