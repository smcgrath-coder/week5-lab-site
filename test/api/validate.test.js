import { describe, expect, it } from "vitest";
import { MAX_MESSAGE_CHARS, MAX_TURNS_PER_CONVERSATION } from "../../api/_lib/limits";

import { validateChatRequest } from "../../api/_lib/validate";
import { MODEL_IDS } from "../../src/data/models";

const env = { CLASS_PASSCODE: "class-secret" };
const validModel = MODEL_IDS[0];
const validMessages = [{ role: "user", content: "Explain metformin simply." }];

describe("validateChatRequest — passcode", () => {
  it("rejects a wrong passcode with 401", () => {
    const result = validateChatRequest(
      { passcode: "wrong", model: validModel, messages: validMessages },
      env
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(typeof result.error).toBe("string");
  });

  it("accepts a matching passcode (passes through to later checks)", () => {
    const result = validateChatRequest(
      { passcode: "class-secret", model: validModel, messages: validMessages },
      env
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("validateChatRequest — model allowlist", () => {
  it("rejects a model that isn't in the allowlist with 400", () => {
    const result = validateChatRequest(
      { passcode: "class-secret", model: "not-a-real-model", messages: validMessages },
      env
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(typeof result.error).toBe("string");
  });
});

describe("validateChatRequest — messages shape", () => {
  it.each([
    ["missing entirely", undefined],
    ["not an array", "hello"],
    ["an empty array", []],
    ["missing role", [{ content: "hi" }]],
    ["an invalid role", [{ role: "system-prompt", content: "hi" }]],
    ["non-string content", [{ role: "user", content: 42 }]],
  ])("rejects messages that are %s with 400", (_label, messages) => {
    const result = validateChatRequest(
      { passcode: "class-secret", model: validModel, messages },
      env
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(typeof result.error).toBe("string");
  });

  it("accepts user, assistant, and system roles", () => {
    const messages = [
      { role: "system", content: "You are a helpful tutor." },
      { role: "user", content: "Explain metformin." },
      { role: "assistant", content: "Metformin lowers blood sugar." },
    ];
    const result = validateChatRequest({ passcode: "class-secret", model: validModel, messages }, env);
    expect(result).toEqual({ ok: true });
  });
});

describe("validateChatRequest — message length cap", () => {
  it("rejects a message over the char cap with 413", () => {
    const messages = [{ role: "user", content: "x".repeat(MAX_MESSAGE_CHARS + 1) }];
    const result = validateChatRequest({ passcode: "class-secret", model: validModel, messages }, env);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(413);
    expect(typeof result.error).toBe("string");
  });

  it("accepts a message exactly at the char cap", () => {
    const messages = [{ role: "user", content: "x".repeat(MAX_MESSAGE_CHARS) }];
    const result = validateChatRequest({ passcode: "class-secret", model: validModel, messages }, env);
    expect(result).toEqual({ ok: true });
  });
});

describe("validateChatRequest — turn cap", () => {
  it("rejects a conversation with more than the max turns with 429 and a friendly message", () => {
    const messages = Array.from({ length: MAX_TURNS_PER_CONVERSATION + 1 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: "hi",
    }));
    const result = validateChatRequest({ passcode: "class-secret", model: validModel, messages }, env);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(429);
    expect(result.error).toBe("This conversation is long. Start a new one");
  });

  it("accepts a conversation exactly at the max turns", () => {
    const messages = Array.from({ length: MAX_TURNS_PER_CONVERSATION }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: "hi",
    }));
    const result = validateChatRequest({ passcode: "class-secret", model: validModel, messages }, env);
    expect(result).toEqual({ ok: true });
  });
});
