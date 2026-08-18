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
    };
  }

  return (
    <div className="lab-screen">
      <button type="button" className="back-link" onClick={() => onNavigate("hub")}>
        ← Back to hub
      </button>

      <h1>Lab 4 — Grounding and Its Limits</h1>
      <p>{LABS.lab4.goal}</p>

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
      <ChatPanel
        conversation={lab4.ungrounded}
        caseButtons={[]}
        label="Ungrounded run"
        {...chatHandlersFor("ungrounded")}
      />

      <h2>Grounded run</h2>
      <ChatPanel
        conversation={lab4.grounded}
        caseButtons={[]}
        label="Grounded run"
        {...chatHandlersFor("grounded")}
      />

      <ReflectionField
        label={LABS.lab4.fields.reflection.label}
        value={lab4.reflection}
        onChange={(value) => labState.updateLab("lab4", { reflection: value })}
      />
    </div>
  );
}
