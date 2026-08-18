import { useCallback, useRef, useState } from "react";

async function parseSSEStream(response, onDelta) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]" || payload === "") continue;

      let parsed;
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }
      const delta = parsed?.choices?.[0]?.delta?.content;
      if (delta) onDelta(delta);
    }
  }
}

export function useChat({ conversation, onUpdate, passcode }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const send = useCallback(
    async (text) => {
      setError(null);
      const userMessage = { role: "user", content: text, at: new Date().toISOString() };
      const historyBefore = conversation.messages;
      const messagesWithUser = [...historyBefore, userMessage];
      onUpdate(messagesWithUser);

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            passcode,
            model: conversation.model,
            messages: messagesWithUser.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          // No streaming ever started, so nothing real is lost by rolling back —
          // this keeps a failed send from permanently locking the model picker
          // or polluting the transcript/PDF with an unanswered message.
          onUpdate(historyBefore);
          setError(data.error || "The AI service is unavailable — try again in a moment.");
          setIsStreaming(false);
          return { ok: false };
        }

        let assistantContent = "";
        await parseSSEStream(response, (delta) => {
          assistantContent += delta;
          onUpdate([
            ...messagesWithUser,
            { role: "assistant", content: assistantContent, at: new Date().toISOString() },
          ]);
        });

        setIsStreaming(false);
        return { ok: true };
      } catch (err) {
        if (err?.name === "AbortError") {
          setIsStreaming(false);
          return { ok: false };
        }
        // A mid-stream drop may have already delivered real partial output, so
        // (unlike the pre-stream HTTP-error case above) we do NOT roll back here.
        setError("Lost connection to the AI service. Check your connection and try again.");
        setIsStreaming(false);
        return { ok: false };
      }
    },
    [conversation, onUpdate, passcode]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { send, abort, isStreaming, error };
}
