import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { CASE_PACK, FICTIONAL_NOTE } from "../data/casePack";
import { MODELS } from "../data/models";
import { useChat } from "../hooks/useChat";
import { usePasscode } from "../state/passcode";

export default function ChatPanel({
  conversation,
  onUpdate,
  onStartConversation,
  caseButtons = [],
  label,
  allowNewConversation = false,
  onNewConversation,
}) {
  const passcode = usePasscode();
  const [pendingModel, setPendingModel] = useState(MODELS[0].openrouterId);
  const [draft, setDraft] = useState("");

  const effectiveConversation = conversation ?? { model: pendingModel, messages: [] };
  const { send, isStreaming, error } = useChat({
    conversation: effectiveConversation,
    onUpdate,
    passcode,
  });

  const hasMessages = Boolean(conversation?.messages?.length);
  const modelValue = conversation?.model ?? pendingModel;

  function handleModelChange(e) {
    const nextModel = e.target.value;
    if (!conversation) {
      setPendingModel(nextModel);
    } else {
      onStartConversation?.(nextModel);
    }
  }

  function handleInsertCase(caseId) {
    const item = CASE_PACK.find((c) => c.id === caseId);
    if (!item) return;
    setDraft((prev) => (prev ? `${prev}\n\n${item.text}` : item.text));
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || isStreaming) return;
    if (!conversation) {
      onStartConversation?.(pendingModel);
      return;
    }
    setDraft("");
    await send(text);
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-panel">
      {label && <h3>{label}</h3>}

      <label className="field chat-model-field">
        <span>Model</span>
        <select value={modelValue} onChange={handleModelChange} disabled={hasMessages}>
          {MODELS.map((m) => (
            <option key={m.id} value={m.openrouterId}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      {!conversation && (
        <p className="chat-empty-hint">Pick a model, then type your first message to begin.</p>
      )}

      {conversation && (
        <>
          <div className="chat-messages">
            {conversation.messages.map((m) => (
              <div key={`${m.role}-${m.at}`} className={`chat-message chat-message-${m.role}`}>
                <span className="chat-message-role">{m.role === "user" ? "You" : "Model"}</span>
                {m.role === "assistant" ? (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                ) : (
                  <p className="chat-message-text">{m.content}</p>
                )}
              </div>
            ))}
          </div>

          {caseButtons.length > 0 && (
            <div className="case-buttons">
              {caseButtons.map((caseId) => {
                const item = CASE_PACK.find((c) => c.id === caseId);
                if (!item) return null;
                return (
                  <button key={caseId} type="button" onClick={() => handleInsertCase(caseId)}>
                    Insert {item.title}
                  </button>
                );
              })}
              <p className="case-note">{FICTIONAL_NOTE}</p>
            </div>
          )}

          <label className="field">
            <span className="sr-only">Message</span>
            <textarea
              aria-label="Message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              placeholder="Type your message… (Cmd/Ctrl+Enter to send)"
            />
          </label>

          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}

          <div className="chat-actions">
            <button type="button" onClick={handleSend} disabled={!draft.trim() || isStreaming}>
              {isStreaming ? "Sending…" : "Send"}
            </button>
            {allowNewConversation && (
              <button type="button" className="chat-new-conversation" onClick={onNewConversation}>
                New conversation
              </button>
            )}
          </div>

          <p className="phi-reminder">
            Reminder: never enter real patient information or PHI — use fictional cases only.
          </p>
        </>
      )}
    </div>
  );
}
