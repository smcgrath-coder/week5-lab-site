import { describe, expect, it } from "vitest";
import {
  addLab3Attempt,
  appendMessage,
  createInitialState,
  startConversation,
  updateLab,
  updateLab3Attempt,
} from "./labState";
import { getCompleteness } from "./completeness";

function withAssistantReply(state, path, model = "claude-haiku") {
  let next = startConversation(state, path, model);
  next = appendMessage(next, path, { role: "user", content: "hello" });
  next = appendMessage(next, path, { role: "assistant", content: "hi there" });
  return next;
}

describe("getCompleteness — lab1", () => {
  it("is not done on a fresh state and lists what's missing", () => {
    const { lab1 } = getCompleteness(createInitialState());
    expect(lab1.done).toBe(false);
    expect(lab1.missing.length).toBeGreaterThan(0);
  });

  it("is done once a task is chosen, both runs have an assistant reply, and the comparison is answered", () => {
    let state = createInitialState();
    state = updateLab(state, "lab1", { taskChoice: "medications" });
    state = withAssistantReply(state, ["lab1", "runA"]);
    state = withAssistantReply(state, ["lab1", "runB"]);
    state = updateLab(state, "lab1", { reflectionComparison: "B was more specific." });

    const { lab1 } = getCompleteness(state);
    expect(lab1.done).toBe(true);
    expect(lab1.missing).toEqual([]);
  });

  it("stays not-done when the comparison reflection is blank even if both runs have replies", () => {
    let state = createInitialState();
    state = updateLab(state, "lab1", { taskChoice: "medications" });
    state = withAssistantReply(state, ["lab1", "runA"]);
    state = withAssistantReply(state, ["lab1", "runB"]);

    const { lab1 } = getCompleteness(state);
    expect(lab1.done).toBe(false);
    expect(lab1.missing.some((m) => /comparison/i.test(m))).toBe(true);
  });
});

function fillLab2(state) {
  let next = state;
  for (const task of ["t2a", "t2b", "t2c"]) {
    next = withAssistantReply(next, ["lab2", task, "chat"]);
    next = updateLab(next, "lab2", {
      [task]: { ...next.labs.lab2[task], reflection: `notes for ${task}` },
    });
  }
  return next;
}

describe("getCompleteness — lab2", () => {
  it("is not done on a fresh state", () => {
    const { lab2 } = getCompleteness(createInitialState());
    expect(lab2.done).toBe(false);
    expect(lab2.missing.length).toBeGreaterThan(0);
  });

  it("is done once all three tasks have a reply and a reflection", () => {
    const state = fillLab2(createInitialState());
    const { lab2 } = getCompleteness(state);
    expect(lab2.done).toBe(true);
    expect(lab2.missing).toEqual([]);
  });

  it("lists only the task that's missing its reflection when the other two are complete", () => {
    let state = fillLab2(createInitialState());
    // blank out t2b's reflection only
    state = updateLab(state, "lab2", { t2b: { ...state.labs.lab2.t2b, reflection: "" } });

    const { lab2 } = getCompleteness(state);
    expect(lab2.done).toBe(false);
    expect(lab2.missing).toHaveLength(1);
    expect(lab2.missing[0]).toMatch(/2b/i);
  });
});

function addDocumentedAttempt(state, category) {
  let next = addLab3Attempt(state);
  const index = next.labs.lab3.attempts.length - 1;
  next = withAssistantReply(next, ["lab3", "attempts", index, "chat"]);
  next = updateLab3Attempt(next, index, {
    category,
    tried: "tried to get a fabricated citation",
    produced: "a made-up guideline",
    caught: "checked PubMed, guideline doesn't exist",
  });
  return next;
}

describe("getCompleteness — lab3", () => {
  it("is not done on a fresh state", () => {
    const { lab3 } = getCompleteness(createInitialState());
    expect(lab3.done).toBe(false);
    expect(lab3.missing.length).toBeGreaterThan(0);
  });

  it("is done with 2 fully-documented attempts from 2 distinct categories", () => {
    let state = createInitialState();
    state = addDocumentedAttempt(state, "fabricatedCitation");
    state = addDocumentedAttempt(state, "biased");

    const { lab3 } = getCompleteness(state);
    expect(lab3.done).toBe(true);
    expect(lab3.missing).toEqual([]);
  });

  it("is not done with only 1 attempt and says so", () => {
    let state = createInitialState();
    state = addDocumentedAttempt(state, "fabricatedCitation");

    const { lab3 } = getCompleteness(state);
    expect(lab3.done).toBe(false);
    expect(lab3.missing.some((m) => /at least 2/i.test(m))).toBe(true);
  });

  it("is not done when 2 attempts share the same category", () => {
    let state = createInitialState();
    state = addDocumentedAttempt(state, "fabricatedCitation");
    state = addDocumentedAttempt(state, "fabricatedCitation");

    const { lab3 } = getCompleteness(state);
    expect(lab3.done).toBe(false);
    expect(lab3.missing.some((m) => /different (failure )?categor/i.test(m))).toBe(true);
  });

  it("flags a specific attempt that's missing a documentation field", () => {
    let state = createInitialState();
    state = addDocumentedAttempt(state, "fabricatedCitation");
    state = addDocumentedAttempt(state, "biased");
    state = updateLab3Attempt(state, 1, { caught: "" });

    const { lab3 } = getCompleteness(state);
    expect(lab3.done).toBe(false);
    expect(lab3.missing.some((m) => /attempt 2/i.test(m) && /caught/i.test(m))).toBe(true);
  });
});

describe("getCompleteness — lab4", () => {
  it("is not done on a fresh state", () => {
    const { lab4 } = getCompleteness(createInitialState());
    expect(lab4.done).toBe(false);
    expect(lab4.missing.length).toBeGreaterThan(0);
  });

  it("is done once both runs have a reply and the reflection is answered", () => {
    let state = createInitialState();
    state = withAssistantReply(state, ["lab4", "ungrounded"]);
    state = withAssistantReply(state, ["lab4", "grounded"]);
    state = updateLab(state, "lab4", { reflection: "grounding fixed the fabricated dose" });

    const { lab4 } = getCompleteness(state);
    expect(lab4.done).toBe(true);
    expect(lab4.missing).toEqual([]);
  });
});

describe("getCompleteness — wrapUp", () => {
  it("is not done when the paragraph is blank", () => {
    const { wrapUp } = getCompleteness(createInitialState());
    expect(wrapUp.done).toBe(false);
    expect(wrapUp.missing.length).toBeGreaterThan(0);
  });

  it("is done once the paragraph is answered", () => {
    const state = updateLab(createInitialState(), "wrapUp", { paragraph: "I learned to verify citations." });
    const { wrapUp } = getCompleteness(state);
    expect(wrapUp.done).toBe(true);
    expect(wrapUp.missing).toEqual([]);
  });
});
