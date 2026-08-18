import { describe, expect, it } from "vitest";
import {
  addLab3Attempt,
  appendMessage,
  createInitialState,
  deserialize,
  exportBackup,
  importBackup,
  serialize,
  setStudent,
  startConversation,
  updateLab,
  updateLab3Attempt,
} from "./labState";

describe("createInitialState", () => {
  it("returns the exact initial shape", () => {
    expect(createInitialState()).toEqual({
      version: 1,
      student: { name: "", lane: null, acknowledgedPHI: false },
      labs: {
        lab1: {
          taskChoice: null,
          runA: null,
          runB: null,
          techniques: [],
          reflectionComparison: "",
        },
        lab2: {
          t2a: { lane: null, chat: null, reflection: "" },
          t2b: { lane: null, chat: null, reflection: "" },
          t2c: { chat: null, reflection: "" },
        },
        lab3: {
          attempts: [],
          almostGotPastMe: "",
        },
        lab4: {
          taskAndSource: "",
          ungrounded: null,
          grounded: null,
          reflection: "",
        },
        wrapUp: {
          paragraph: "",
        },
      },
    });
  });
});

describe("serialize / deserialize", () => {
  it("round-trips a state object", () => {
    const state = createInitialState();
    const json = serialize(state);
    expect(typeof json).toBe("string");
    expect(deserialize(json)).toEqual(state);
  });

  it("returns null for garbage input instead of throwing", () => {
    expect(() => deserialize("not json{{{")).not.toThrow();
    expect(deserialize("not json{{{")).toBeNull();
  });

  it("returns null when version is not 1", () => {
    expect(deserialize(JSON.stringify({ version: 2, student: {}, labs: {} }))).toBeNull();
  });
});

describe("setStudent", () => {
  it("merges a patch into student without mutating the original state", () => {
    const state = createInitialState();
    const next = setStudent(state, { name: "Rion", lane: "clinical" });

    expect(next.student).toEqual({
      name: "Rion",
      lane: "clinical",
      acknowledgedPHI: false,
    });
    expect(state.student.name).toBe("");
  });
});

describe("updateLab", () => {
  it("merges a patch into the named lab without mutating the original state", () => {
    const state = createInitialState();
    const next = updateLab(state, "lab1", { taskChoice: "medications" });

    expect(next.labs.lab1.taskChoice).toBe("medications");
    expect(next.labs.lab1.techniques).toEqual([]);
    expect(state.labs.lab1.taskChoice).toBeNull();
  });
});

describe("addLab3Attempt", () => {
  it("appends a blank attempt without mutating the original state", () => {
    const state = createInitialState();
    const next = addLab3Attempt(state);

    expect(next.labs.lab3.attempts).toHaveLength(1);
    expect(next.labs.lab3.attempts[0]).toEqual({
      category: null,
      chat: null,
      tried: "",
      produced: "",
      caught: "",
    });
    expect(state.labs.lab3.attempts).toHaveLength(0);
  });
});

describe("updateLab3Attempt", () => {
  it("merges a patch into the attempt at the given index only", () => {
    let state = createInitialState();
    state = addLab3Attempt(state);
    state = addLab3Attempt(state);

    const next = updateLab3Attempt(state, 1, { category: "biased" });

    expect(next.labs.lab3.attempts[0].category).toBeNull();
    expect(next.labs.lab3.attempts[1].category).toBe("biased");
    expect(state.labs.lab3.attempts[1].category).toBeNull();
  });
});

describe("startConversation", () => {
  it("creates a fresh conversation at the given path", () => {
    const state = createInitialState();
    const next = startConversation(state, ["lab1", "runA"], "claude-haiku");

    expect(next.labs.lab1.runA).toMatchObject({
      model: "claude-haiku",
      messages: [],
    });
    expect(typeof next.labs.lab1.runA.startedAt).toBe("string");
    expect(state.labs.lab1.runA).toBeNull();
  });

  it("works at a nested path inside lab2", () => {
    const state = createInitialState();
    const next = startConversation(state, ["lab2", "t2a", "chat"], "gpt-mini");

    expect(next.labs.lab2.t2a.chat.model).toBe("gpt-mini");
    expect(state.labs.lab2.t2a.chat).toBeNull();
  });
});

describe("appendMessage", () => {
  it("appends a message to the conversation at the given path immutably", () => {
    let state = createInitialState();
    state = startConversation(state, ["lab1", "runA"], "claude-haiku");

    const next = appendMessage(state, ["lab1", "runA"], {
      role: "user",
      content: "Explain metformin",
    });

    expect(next.labs.lab1.runA.messages).toHaveLength(1);
    expect(next.labs.lab1.runA.messages[0]).toMatchObject({
      role: "user",
      content: "Explain metformin",
    });
    expect(typeof next.labs.lab1.runA.messages[0].at).toBe("string");
    // original state and its nested conversation are untouched
    expect(state.labs.lab1.runA.messages).toHaveLength(0);
  });

  it("appends into an array-indexed path (lab3 attempt conversation)", () => {
    let state = createInitialState();
    state = addLab3Attempt(state);
    state = startConversation(state, ["lab3", "attempts", 0, "chat"], "llama");

    const next = appendMessage(state, ["lab3", "attempts", 0, "chat"], {
      role: "assistant",
      content: "Sure, here's a summary.",
    });

    expect(next.labs.lab3.attempts[0].chat.messages).toHaveLength(1);
    expect(state.labs.lab3.attempts[0].chat.messages).toHaveLength(0);
  });
});

describe("exportBackup", () => {
  it("returns a JSON Blob and a dated filename", async () => {
    const state = createInitialState();
    const { blob, filename } = exportBackup(state);

    expect(blob).toBeInstanceOf(Blob);
    expect(filename).toMatch(/^week5-lab-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(JSON.parse(await blob.text())).toEqual(state);
  });
});

describe("importBackup", () => {
  it("resolves with the parsed state for a valid backup file", async () => {
    const state = setStudent(createInitialState(), { name: "Rion" });
    const file = new File([serialize(state)], "backup.json", {
      type: "application/json",
    });

    await expect(importBackup(file)).resolves.toEqual(state);
  });

  it("rejects with a user-visible error for an invalid backup file", async () => {
    const file = new File(["not valid json"], "backup.json", {
      type: "application/json",
    });

    await expect(importBackup(file)).rejects.toThrow(/valid backup/i);
  });
});
