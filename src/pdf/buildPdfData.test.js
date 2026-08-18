import { describe, expect, it } from "vitest";
import { buildPdfData } from "./buildPdfData";
import { LABS } from "../data/labs";
import {
  addLab3Attempt,
  appendMessage,
  createInitialState,
  setStudent,
  startConversation,
  updateLab,
  updateLab3Attempt,
} from "../state/labState";

describe("buildPdfData — cover", () => {
  it("includes the student's name, lane, and a date/timestamp", () => {
    let state = createInitialState();
    state = setStudent(state, { name: "Jordan Lee", lane: "clinical", acknowledgedPHI: true });

    const data = buildPdfData(state);

    expect(data.cover.name).toBe("Jordan Lee");
    expect(data.cover.lane).toBe("clinical");
    expect(typeof data.cover.date).toBe("string");
    expect(typeof data.cover.timestamp).toBe("string");
  });

  it("lists the distinct models used across all conversations, deduped", () => {
    let state = createInitialState();
    state = startConversation(state, ["lab1", "runA"], "anthropic/claude-haiku-4.5");
    state = startConversation(state, ["lab1", "runB"], "anthropic/claude-haiku-4.5");
    state = startConversation(state, ["lab4", "ungrounded"], "google/gemini-3.6-flash");

    const data = buildPdfData(state);

    expect(data.cover.models.sort()).toEqual(["Claude Haiku", "Gemini Flash"].sort());
  });

  it("has an empty models list when no conversations have started", () => {
    const state = createInitialState();
    const data = buildPdfData(state);
    expect(data.cover.models).toEqual([]);
  });
});

describe("buildPdfData — lab1 section", () => {
  it("includes both conversations with Student/model-label speakers, and the graded reflection", () => {
    let state = createInitialState();
    state = startConversation(state, ["lab1", "runA"], "anthropic/claude-haiku-4.5");
    state = appendMessage(state, ["lab1", "runA"], { role: "user", content: "explain metformin" });
    state = appendMessage(state, ["lab1", "runA"], { role: "assistant", content: "Metformin lowers blood sugar." });
    state = updateLab(state, "lab1", { reflectionComparison: "B was more specific." });

    const data = buildPdfData(state);
    const lab1 = data.labSections.find((s) => s.heading.startsWith("Lab 1"));

    const runAConversation = lab1.blocks.find((b) => b.type === "conversation" && b.label.includes("Version A"));
    expect(runAConversation.turns).toEqual([
      { speaker: "Student", text: "explain metformin" },
      { speaker: "Claude Haiku", text: "Metformin lowers blood sugar." },
    ]);

    const comparisonReflection = lab1.blocks.find(
      (b) => b.type === "reflection" && b.prompt.includes("What actually changed")
    );
    expect(comparisonReflection.answer).toBe("B was more specific.");
  });

  it("renders a blank reflection answer as '— not answered —'", () => {
    const state = createInitialState();
    const data = buildPdfData(state);
    const lab1 = data.labSections.find((s) => s.heading.startsWith("Lab 1"));

    const comparisonReflection = lab1.blocks.find((b) => b.type === "reflection");
    expect(comparisonReflection.answer).toBe("— not answered —");
  });

  it("renders an empty turns array for a conversation that was never started", () => {
    const state = createInitialState();
    const data = buildPdfData(state);
    const lab1 = data.labSections.find((s) => s.heading.startsWith("Lab 1"));

    const runAConversation = lab1.blocks.find((b) => b.type === "conversation" && b.label.includes("Version A"));
    expect(runAConversation.turns).toEqual([]);
  });
});

describe("buildPdfData — lab2 section", () => {
  it("includes all three sub-task conversations and reflections", () => {
    let state = createInitialState();
    state = updateLab(state, "lab2", {
      t2a: { lane: "clinical", chat: null, reflection: "noticed X" },
    });

    const data = buildPdfData(state);
    const lab2 = data.labSections.find((s) => s.heading.startsWith("Lab 2"));

    const conversationLabels = lab2.blocks.filter((b) => b.type === "conversation").map((b) => b.label);
    expect(conversationLabels).toEqual(["2A — Reading level", "2B — Source to structured summary", "2C — Synthesis"]);

    const t2aReflection = lab2.blocks.find(
      (b) => b.type === "reflection" && b.prompt === LABS.lab2.t2a.reflection
    );
    expect(t2aReflection.answer).toBe("noticed X");
  });
});

describe("buildPdfData — lab3 section", () => {
  it("numbers each attempt with its category name, plus documentation and conversation blocks", () => {
    let state = createInitialState();
    state = addLab3Attempt(state);
    state = updateLab3Attempt(state, 0, {
      category: "fabricatedCitation",
      tried: "asked for a guideline citation",
      produced: "a citation that doesn't exist",
      caught: "checked PubMed",
    });
    state = addLab3Attempt(state);
    state = updateLab3Attempt(state, 1, { category: "biased" });
    state = updateLab(state, "lab3", { almostGotPastMe: "a subtle one" });

    const data = buildPdfData(state);
    const lab3 = data.labSections.find((s) => s.heading.startsWith("Lab 3"));

    const subheadings = lab3.blocks.filter((b) => b.type === "subheading").map((b) => b.text);
    expect(subheadings).toEqual([
      "Attempt 1 — Fabricated citation, guideline, study, or statistic",
      "Attempt 2 — Biased or skewed completion",
    ]);

    const caughtField = lab3.blocks.find(
      (b) => b.type === "reflection" && b.prompt.startsWith("How I caught it")
    );
    expect(caughtField.answer).toBe("checked PubMed");

    const almostGotPastMe = lab3.blocks.find(
      (b) => b.type === "reflection" && b.prompt === LABS.lab3.optionalPrompt
    );
    expect(almostGotPastMe.answer).toBe("a subtle one");
  });

  it("labels an attempt with no category chosen yet", () => {
    let state = createInitialState();
    state = addLab3Attempt(state);

    const data = buildPdfData(state);
    const lab3 = data.labSections.find((s) => s.heading.startsWith("Lab 3"));

    const subheading = lab3.blocks.find((b) => b.type === "subheading");
    expect(subheading.text).toBe("Attempt 1 — (no category chosen)");
  });
});

describe("buildPdfData — lab4 section", () => {
  it("includes the task/source field, both runs, and the final reflection in order", () => {
    let state = createInitialState();
    state = updateLab(state, "lab4", {
      taskAndSource: "Summarize this abstract...",
      reflection: "grounding fixed the fabricated stat",
    });

    const data = buildPdfData(state);
    const lab4 = data.labSections.find((s) => s.heading.startsWith("Lab 4"));

    expect(lab4.blocks.map((b) => b.type)).toEqual([
      "reflection",
      "conversation",
      "conversation",
      "reflection",
    ]);
    expect(lab4.blocks[0].answer).toBe("Summarize this abstract...");
    expect(lab4.blocks[1].label).toBe("Ungrounded run");
    expect(lab4.blocks[2].label).toBe("Grounded run");
    expect(lab4.blocks[3].answer).toBe("grounding fixed the fabricated stat");
  });
});

describe("buildPdfData — wrapUp section", () => {
  it("includes the wrap-up paragraph", () => {
    let state = createInitialState();
    state = updateLab(state, "wrapUp", { paragraph: "I learned to verify citations." });

    const data = buildPdfData(state);
    const wrapUp = data.labSections.find((s) => s.heading.startsWith("Wrap-Up"));

    expect(wrapUp.blocks).toEqual([
      { type: "reflection", prompt: LABS.wrapUp.prompt, answer: "I learned to verify citations." },
    ]);
  });
});
