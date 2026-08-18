import ChatPanel from "./ChatPanel";
import ReflectionField from "./ReflectionField";
import { CASE_PACK, FICTIONAL_NOTE } from "../data/casePack";
import { LABS } from "../data/labs";

export default function Lab4({ labState, onNavigate }) {
  const lab4 = labState.state.labs.lab4;

  function insertCase(caseId) {
    const item = CASE_PACK.find((c) => c.id === caseId);
    if (!item) return;
    const next = lab4.taskAndSource ? `${lab4.taskAndSource}\n\n${item.text}` : item.text;
    labState.updateLab("lab4", { taskAndSource: next });
  }

  function chatHandlersFor(slot) {
    const path = ["lab4", slot];
    return {
      onUpdate: ({ model, messages }) => labState.setConversationState(path, { model, messages }),
      allowNewConversation: true,
      onNewConversation: () => {
        if (window.confirm("Start a new conversation? This clears the current transcript for this run.")) {
          labState.clearConversation(path);
        }
      },
      onTryDifferentModel: () => labState.clearConversation(path),
    };
  }

  return (
    <div className="lab-screen">
      <button type="button" className="back-link" onClick={() => onNavigate("hub")}>
        ← Back to hub
      </button>

      <h1>Lab 4 — Grounding and Its Limits</h1>
      <p>{LABS.lab4.goal}</p>
      <p className="lab-howto" data-testid="lab-howto">
        {LABS.lab4.howTo}
      </p>

      <ReflectionField
        label={LABS.lab4.fields.taskAndSource.label}
        value={lab4.taskAndSource}
        onChange={(value) => labState.updateLab("lab4", { taskAndSource: value })}
      />
      <div className="case-buttons">
        {CASE_PACK.map((item) => (
          <button key={item.id} type="button" onClick={() => insertCase(item.id)}>
            Insert {item.title}
          </button>
        ))}
        <p className="case-note">{FICTIONAL_NOTE}</p>
      </div>

      <h2>Ungrounded run</h2>
      <p className="lab-hint">No source material here. See what the model does with just the task.</p>
      <ChatPanel
        conversation={lab4.ungrounded}
        caseButtons={[]}
        label="Ungrounded run"
        {...chatHandlersFor("ungrounded")}
      />

      <h2>Grounded run</h2>
      <p className="lab-hint">
        Paste your source text into the chat along with your task. The model can only see what you
        send it. Use the insert-case buttons below, or paste your own source.
      </p>
      <ChatPanel
        conversation={lab4.grounded}
        caseButtons={CASE_PACK.map((item) => item.id)}
        label="Grounded run"
        {...chatHandlersFor("grounded")}
      />

      <ReflectionField
        label={LABS.lab4.fields.reflection.label}
        value={lab4.reflection}
        onChange={(value) => labState.updateLab("lab4", { reflection: value })}
      />

      <button type="button" className="back-link" onClick={() => onNavigate("hub")}>
        ← Back to hub
      </button>
    </div>
  );
}
