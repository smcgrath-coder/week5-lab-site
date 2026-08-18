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
    const onUpdate = vi.fn(({ model, messages }) => {
      conversation = { ...conversation, model, messages };
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
  it("locks the model picker once the conversation has an assistant reply", () => {
    const withReply = startedConversation({
      messages: [
        { role: "user", content: "hi", at: "2026-01-01T00:00:01.000Z" },
        { role: "assistant", content: "hello", at: "2026-01-01T00:00:02.000Z" },
      ],
    });
    render(<ChatPanel conversation={withReply} onUpdate={() => {}} caseButtons={[]} label="Test panel" />);

    expect(screen.getByLabelText(/model/i)).toBeDisabled();
  });

  it("leaves the model picker enabled when the conversation has no messages yet", () => {
    render(<ChatPanel conversation={startedConversation()} onUpdate={() => {}} caseButtons={[]} label="Test panel" />);

    expect(screen.getByLabelText(/model/i)).toBeEnabled();
  });

  it("leaves the model picker enabled when a user message exists but no reply has come back yet (e.g. a failed first send)", () => {
    const noReplyYet = startedConversation({
      messages: [{ role: "user", content: "hi", at: "2026-01-01T00:00:01.000Z" }],
    });
    render(<ChatPanel conversation={noReplyYet} onUpdate={() => {}} caseButtons={[]} label="Test panel" />);

    expect(screen.getByLabelText(/model/i)).toBeEnabled();
  });
});

describe("ChatPanel — user messages render as markdown too", () => {
  it("renders a bulleted list pasted from a case as an actual list, not raw dashes", () => {
    const withPastedCase = startedConversation({
      messages: [
        { role: "user", content: "- First step\n- Second step", at: "2026-01-01T00:00:01.000Z" },
      ],
    });
    render(
      <ChatPanel conversation={withPastedCase} onUpdate={() => {}} caseButtons={[]} label="Test panel" />
    );

    // real <li> list items, not the literal text "- First step"
    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["First step", "Second step"]);
    expect(screen.queryByText(/^- First step/)).not.toBeInTheDocument();
  });
});

describe("ChatPanel — failed send restores the draft", () => {
  it("puts the typed message back in the textarea when the send fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: "Daily limit reached." }) })
    );

    render(
      <ChatPanel conversation={startedConversation()} onUpdate={() => {}} caseButtons={[]} label="Test panel" />
    );

    const textarea = screen.getByRole("textbox", { name: /message/i });
    await user.type(textarea, "Explain metformin");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(await screen.findByText(/daily limit reached/i)).toBeInTheDocument();
    expect(textarea.value).toBe("Explain metformin");
  });
});

describe("ChatPanel — message placeholder", () => {
  it("does not show the old Jupyter-notebook Cmd/Ctrl+Enter hint", () => {
    render(<ChatPanel conversation={startedConversation()} onUpdate={() => {}} caseButtons={[]} label="Test panel" />);

    expect(screen.getByRole("textbox", { name: /message/i })).not.toHaveAttribute(
      "placeholder",
      expect.stringMatching(/cmd|ctrl/i)
    );
  });
});

describe("ChatPanel — try a different model", () => {
  it("shows a 'Try a different model' button once the model is locked, and clears the transcript without a confirm dialog when clicked", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm");
    const withReply = startedConversation({
      messages: [
        { role: "user", content: "hi", at: "2026-01-01T00:00:01.000Z" },
        { role: "assistant", content: "hello", at: "2026-01-01T00:00:02.000Z" },
      ],
    });
    const onTryDifferentModel = vi.fn();

    render(
      <ChatPanel
        conversation={withReply}
        onUpdate={() => {}}
        caseButtons={[]}
        label="Test panel"
        onTryDifferentModel={onTryDifferentModel}
      />
    );

    await user.click(screen.getByRole("button", { name: /try a different model/i }));

    expect(onTryDifferentModel).toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("does not show the button while the model picker is still unlocked", () => {
    render(
      <ChatPanel
        conversation={startedConversation()}
        onUpdate={() => {}}
        caseButtons={[]}
        label="Test panel"
        onTryDifferentModel={() => {}}
      />
    );

    expect(screen.queryByRole("button", { name: /try a different model/i })).not.toBeInTheDocument();
  });
});

describe("ChatPanel — composer reveal on demand", () => {
  it("shows the message box by default when there are no messages yet", () => {
    render(<ChatPanel conversation={startedConversation()} onUpdate={() => {}} caseButtons={[]} label="Test panel" />);

    expect(screen.getByRole("textbox", { name: /message/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add another message/i })).not.toBeInTheDocument();
  });

  it("hides the message box and shows 'Add another message' once a reply has already arrived (e.g. a resumed session)", () => {
    const withReply = startedConversation({
      messages: [
        { role: "user", content: "hi", at: "2026-01-01T00:00:01.000Z" },
        { role: "assistant", content: "hello", at: "2026-01-01T00:00:02.000Z" },
      ],
    });
    render(<ChatPanel conversation={withReply} onUpdate={() => {}} caseButtons={[]} label="Test panel" />);

    expect(screen.queryByRole("textbox", { name: /message/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add another message/i })).toBeInTheDocument();
  });

  it("reveals the message box again when 'Add another message' is clicked", async () => {
    const user = userEvent.setup();
    const withReply = startedConversation({
      messages: [
        { role: "user", content: "hi", at: "2026-01-01T00:00:01.000Z" },
        { role: "assistant", content: "hello", at: "2026-01-01T00:00:02.000Z" },
      ],
    });
    render(<ChatPanel conversation={withReply} onUpdate={() => {}} caseButtons={[]} label="Test panel" />);

    await user.click(screen.getByRole("button", { name: /add another message/i }));

    expect(screen.getByRole("textbox", { name: /message/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add another message/i })).not.toBeInTheDocument();
  });

  it("collapses the composer again automatically once a send completes successfully", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeSSEResponse([sseChunk("hello there"), "data: [DONE]\n\n"]))
    );

    let conversation = startedConversation();
    const onUpdate = vi.fn(({ model, messages }) => {
      conversation = { ...conversation, model, messages };
    });

    const { rerender } = render(
      <ChatPanel conversation={conversation} onUpdate={onUpdate} caseButtons={[]} label="Test panel" />
    );

    await user.type(screen.getByRole("textbox", { name: /message/i }), "hi");
    await user.click(screen.getByRole("button", { name: /^send$/i }));
    rerender(<ChatPanel conversation={conversation} onUpdate={onUpdate} caseButtons={[]} label="Test panel" />);

    expect(await screen.findByRole("button", { name: /add another message/i })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /message/i })).not.toBeInTheDocument();
  });

  it("keeps the composer open when a send fails, so the restored draft is still editable", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: "Daily limit reached." }) })
    );

    render(
      <ChatPanel conversation={startedConversation()} onUpdate={() => {}} caseButtons={[]} label="Test panel" />
    );

    await user.type(screen.getByRole("textbox", { name: /message/i }), "hi");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(await screen.findByText(/daily limit reached/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /message/i })).toBeInTheDocument();
  });
});

describe("ChatPanel — before a conversation is started (conversation is null)", () => {
  it("still shows case-insert buttons and a usable textarea, not just the model picker", async () => {
    const user = userEvent.setup();
    render(<ChatPanel conversation={null} onUpdate={() => {}} caseButtons={["c2"]} label="Test panel" />);

    // the user must be able to insert a case and type *before* touching the model picker
    expect(screen.getByRole("button", { name: /insert.*c2/i })).toBeInTheDocument();
    const textarea = screen.getByRole("textbox", { name: /message/i });
    await user.type(textarea, "hello");
    expect(textarea.value).toBe("hello");
  });

  it("starts the conversation with the default model on first send", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeSSEResponse(["data: [DONE]\n\n"])));
    const onUpdate = vi.fn();

    render(<ChatPanel conversation={null} onUpdate={onUpdate} caseButtons={[]} label="Test panel" />);

    await user.type(screen.getByRole("textbox", { name: /message/i }), "hi");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(onUpdate).toHaveBeenCalledWith({
      model: MODELS[0].openrouterId,
      messages: [expect.objectContaining({ role: "user", content: "hi" })],
    });
  });
});
