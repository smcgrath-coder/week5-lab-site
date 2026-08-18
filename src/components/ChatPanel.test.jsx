import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChatPanel from "./ChatPanel";
import { MODELS } from "../data/models";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function sseChunk(contentDelta) {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: contentDelta } }] })}\n\n`;
}

function makeSSEResponse(chunks) {
  const encoder = new TextEncoder();
  let i = 0;
  const body = new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i]));
        i += 1;
      } else {
        controller.close();
      }
    },
  });
  return { ok: true, status: 200, body };
}

function startedConversation(overrides = {}) {
  return {
    model: MODELS[0].openrouterId,
    startedAt: "2026-01-01T00:00:00.000Z",
    messages: [],
    ...overrides,
  };
}

describe("ChatPanel — insert case", () => {
  it("appends the case text into the textarea", async () => {
    const user = userEvent.setup();
    render(
      <ChatPanel
        conversation={startedConversation()}
        onUpdate={() => {}}
        caseButtons={["c2"]}
        label="Test panel"
      />
    );

    await user.click(screen.getByRole("button", { name: /insert.*c2/i }));

    const textarea = screen.getByRole("textbox", { name: /message/i });
    expect(textarea.value).toMatch(/bite on gauze/i);
  });
});

describe("ChatPanel — send and stream", () => {
  it("appends the user message and streams the assistant reply", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeSSEResponse([sseChunk("Sure"), sseChunk(", here you go."), "data: [DONE]\n\n"]))
    );

    let conversation = startedConversation();
    const onUpdate = vi.fn((messages) => {
      conversation = { ...conversation, messages };
    });

    const { rerender } = render(
      <ChatPanel conversation={conversation} onUpdate={onUpdate} caseButtons={[]} label="Test panel" />
    );

    const textarea = screen.getByRole("textbox", { name: /message/i });
    await user.type(textarea, "Explain metformin");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    rerender(<ChatPanel conversation={conversation} onUpdate={onUpdate} caseButtons={[]} label="Test panel" />);

    expect(await screen.findByText(/sure, here you go\./i)).toBeInTheDocument();
    expect(screen.getByText(/explain metformin/i)).toBeInTheDocument();
  });
});

describe("ChatPanel — model picker locking", () => {
  it("locks the model picker once the conversation has messages", () => {
    const withMessages = startedConversation({
      messages: [{ role: "user", content: "hi", at: "2026-01-01T00:00:01.000Z" }],
    });
    render(<ChatPanel conversation={withMessages} onUpdate={() => {}} caseButtons={[]} label="Test panel" />);

    expect(screen.getByLabelText(/model/i)).toBeDisabled();
  });

  it("leaves the model picker enabled when the conversation has no messages yet", () => {
    render(<ChatPanel conversation={startedConversation()} onUpdate={() => {}} caseButtons={[]} label="Test panel" />);

    expect(screen.getByLabelText(/model/i)).toBeEnabled();
  });
});
