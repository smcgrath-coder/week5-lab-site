import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useChat } from "./useChat";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function sseChunk(contentDelta) {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: contentDelta } }] })}\n\n`;
}

function makeSSEResponse(chunks, { ok = true, status = 200 } = {}) {
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
  return { ok, status, body };
}

function baseConversation() {
  return { model: "claude-haiku", startedAt: "2026-01-01T00:00:00.000Z", messages: [] };
}

describe("useChat — sending and streaming", () => {
  it("appends the user message immediately, then streams the assistant reply incrementally", async () => {
    const onUpdate = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeSSEResponse([sseChunk("Hello"), sseChunk(" there"), "data: [DONE]\n\n"]))
    );

    const { result } = renderHook(() =>
      useChat({ conversation: baseConversation(), onUpdate, passcode: "class-secret" })
    );

    let sendResult;
    await act(async () => {
      sendResult = await result.current.send("Explain metformin");
    });

    expect(sendResult).toEqual({ ok: true });

    // first call: user message appended
    const firstCallMessages = onUpdate.mock.calls[0][0];
    expect(firstCallMessages).toHaveLength(1);
    expect(firstCallMessages[0]).toMatchObject({ role: "user", content: "Explain metformin" });

    // final call: assistant content fully accumulated
    const lastCallMessages = onUpdate.mock.calls.at(-1)[0];
    expect(lastCallMessages).toHaveLength(2);
    expect(lastCallMessages[1]).toMatchObject({ role: "assistant", content: "Hello there" });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
  });

  it("ignores [DONE] and unparseable lines without crashing", async () => {
    const onUpdate = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeSSEResponse([
          sseChunk("Hel"),
          "data: not json at all\n\n",
          ": this is a comment line, not data\n\n",
          sseChunk("lo"),
          "data: [DONE]\n\n",
        ])
      )
    );

    const { result } = renderHook(() =>
      useChat({ conversation: baseConversation(), onUpdate, passcode: "class-secret" })
    );

    await act(async () => {
      await result.current.send("hi");
    });

    const lastCallMessages = onUpdate.mock.calls.at(-1)[0];
    expect(lastCallMessages[1]).toMatchObject({ role: "assistant", content: "Hello" });
    expect(result.current.error).toBeNull();
  });
});

describe("useChat — HTTP error", () => {
  it("surfaces the server's error message and rolls back the optimistic user message", async () => {
    const onUpdate = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          error: "Daily message limit reached. If you hit this doing the assignment, contact your instructor.",
        }),
      })
    );

    const { result } = renderHook(() =>
      useChat({ conversation: baseConversation(), onUpdate, passcode: "class-secret" })
    );

    await act(async () => {
      await result.current.send("hi");
    });

    expect(result.current.error).toBe(
      "Daily message limit reached. If you hit this doing the assignment, contact your instructor."
    );
    expect(result.current.isStreaming).toBe(false);

    // first call optimistically appends the user message...
    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate.mock.calls[0][0]).toHaveLength(1);
    expect(onUpdate.mock.calls[0][0][0].role).toBe("user");
    // ...but the second call rolls it back to the original (empty) history,
    // so the failed send doesn't pollute the transcript/PDF or lock the model.
    expect(onUpdate.mock.calls[1][0]).toEqual(baseConversation().messages);
  });

  it("resolves to {ok: false} so the caller can restore the student's draft text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({ error: "boom" }) })
    );

    const { result } = renderHook(() =>
      useChat({ conversation: baseConversation(), onUpdate: () => {}, passcode: "class-secret" })
    );

    let sendResult;
    await act(async () => {
      sendResult = await result.current.send("hi");
    });

    expect(sendResult).toEqual({ ok: false });
  });
});

describe("useChat — mid-stream failure", () => {
  it("does NOT roll back the user message when the connection drops after streaming has started", async () => {
    const onUpdate = vi.fn();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseChunk("Partial")));
        controller.error(new Error("network drop"));
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, body }));

    const { result } = renderHook(() =>
      useChat({ conversation: baseConversation(), onUpdate, passcode: "class-secret" })
    );

    await act(async () => {
      await result.current.send("hi");
    });

    expect(result.current.error).toMatch(/lost connection/i);
    // the user message (and any partial assistant content already streamed) survives —
    // only pre-stream HTTP errors roll back, since real output may exist here.
    const lastCallMessages = onUpdate.mock.calls.at(-1)[0];
    expect(lastCallMessages.some((m) => m.role === "user")).toBe(true);
  });
});

describe("useChat — abort", () => {
  it("stops the stream without setting an error when abort() is called mid-flight", async () => {
    const onUpdate = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url, options) => {
        return new Promise((_resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      })
    );

    const { result } = renderHook(() =>
      useChat({ conversation: baseConversation(), onUpdate, passcode: "class-secret" })
    );

    let sendPromise;
    act(() => {
      sendPromise = result.current.send("hi");
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(true));

    act(() => {
      result.current.abort();
    });

    await act(async () => {
      await sendPromise;
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
