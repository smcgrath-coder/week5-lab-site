import ChatPanel from "./ChatPanel";
import ReflectionField from "./ReflectionField";
import { LABS } from "../data/labs";

export default function Lab3({ labState, onNavigate }) {
  const lab3 = labState.state.labs.lab3;

  function isDuplicateCategory(index) {
    const category = lab3.attempts[index].category;
    if (!category) return false;
    return lab3.attempts.some((a, i) => i !== index && a.category === category);
  }

  function chatHandlersFor(index) {
    const path = ["lab3", "attempts", index, "chat"];
    return {
      onUpdate: ({ model, messages }) => labState.setConversationState(path, { model, messages }),
      allowNewConversation: true,
      onNewConversation: () => {
        if (window.confirm("Start a new conversation? This clears the current transcript for this attempt.")) {
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

      <h1>Lab 3 — Break It on Purpose</h1>
      <p>{LABS.lab3.goal}</p>
      <p className="lab-howto" data-testid="lab-howto">
        {LABS.lab3.howTo}
      </p>

      {lab3.attempts.map((attempt, index) => (
        <div key={index} className="lab3-attempt">
          <div className="lab3-attempt-header">
            <h2>Attempt {index + 1}</h2>
            <button
              type="button"
              className="remove-attempt-button"
              onClick={() => {
                if (window.confirm(`Remove attempt ${index + 1}? This deletes its transcript and notes.`)) {
                  labState.removeLab3Attempt(index);
                }
              }}
            >
              Remove this attempt
            </button>
          </div>

          <div className="category-picker">
            {LABS.lab3.failureCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                aria-pressed={attempt.category === cat.id}
                className={`category-button${attempt.category === cat.id ? " selected" : ""}`}
                onClick={() => labState.updateLab3Attempt(index, { category: cat.id })}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {isDuplicateCategory(index) && (
            <p className="soft-warning">
              You've already used this category in another attempt. The assignment asks for at
              least two different categories, but you can still continue with this one.
            </p>
          )}

          <ChatPanel
            conversation={attempt.chat}
            caseButtons={[]}
            label={`Attempt ${index + 1} conversation`}
            {...chatHandlersFor(index)}
          />

          {LABS.lab3.documentationFields.map((field) => (
            <ReflectionField
              key={field.id}
              label={field.label}
              value={attempt[field.id]}
              onChange={(value) => labState.updateLab3Attempt(index, { [field.id]: value })}
            />
          ))}
        </div>
      ))}

      <button type="button" className="add-attempt-button" onClick={() => labState.addLab3Attempt()}>
        + Add another failure attempt
      </button>

      <ReflectionField
        label={LABS.lab3.optionalPrompt}
        value={lab3.almostGotPastMe}
        onChange={(value) => labState.updateLab("lab3", { almostGotPastMe: value })}
      />

      <button type="button" className="back-link" onClick={() => onNavigate("hub")}>
        ← Back to hub
      </button>
    </div>
  );
}
