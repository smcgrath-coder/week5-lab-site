import { LABS } from "../data/labs";
import { MODELS } from "../data/models";

const BLANK = "— not answered —";

function modelLabel(openrouterId) {
  return MODELS.find((m) => m.openrouterId === openrouterId)?.label ?? openrouterId;
}

function conversationBlock(label, conversation) {
  const turns = (conversation?.messages ?? []).map((m) => ({
    speaker: m.role === "user" ? "Student" : modelLabel(conversation.model),
    text: m.content,
  }));
  return { type: "conversation", label, turns };
}

function reflectionBlock(prompt, answer) {
  return { type: "reflection", prompt, answer: answer?.trim() ? answer : BLANK };
}

function collectModels(state) {
  const ids = new Set();
  const { lab1, lab2, lab3, lab4 } = state.labs;
  for (const c of [lab1.runA, lab1.runB, lab2.t2a.chat, lab2.t2b.chat, lab2.t2c.chat, lab4.ungrounded, lab4.grounded]) {
    if (c) ids.add(c.model);
  }
  for (const attempt of lab3.attempts) {
    if (attempt.chat) ids.add(attempt.chat.model);
  }
  return [...ids].map(modelLabel);
}

function buildCover(state) {
  const now = new Date();
  return {
    name: state.student.name,
    lane: state.student.lane,
    date: now.toLocaleDateString(),
    timestamp: now.toISOString(),
    models: collectModels(state),
  };
}

function buildLab1Section(lab1) {
  return {
    heading: "Lab 1 — Prompt Engineering Fundamentals",
    blocks: [
      conversationBlock("Version A — throwaway", lab1.runA),
      conversationBlock("Version B — structured", lab1.runB),
      reflectionBlock(LABS.lab1.reflections.comparison.prompt, lab1.reflectionComparison),
    ],
  };
}

function buildLab2Section(lab2) {
  return {
    heading: "Lab 2 — Applied Task Labs",
    blocks: [
      conversationBlock("2A — Reading level", lab2.t2a.chat),
      reflectionBlock(LABS.lab2.t2a.reflection, lab2.t2a.reflection),
      conversationBlock("2B — Source to structured summary", lab2.t2b.chat),
      reflectionBlock(LABS.lab2.t2b.reflection, lab2.t2b.reflection),
      conversationBlock("2C — Synthesis", lab2.t2c.chat),
      reflectionBlock(LABS.lab2.t2c.reflection, lab2.t2c.reflection),
    ],
  };
}

function categoryLabel(categoryId) {
  const category = LABS.lab3.failureCategories.find((c) => c.id === categoryId);
  return category ? category.label : "(no category chosen)";
}

function buildLab3Section(lab3) {
  const attemptBlocks = lab3.attempts.flatMap((attempt, i) => {
    const n = i + 1;
    return [
      { type: "subheading", text: `Attempt ${n} — ${categoryLabel(attempt.category)}` },
      conversationBlock(`Attempt ${n} conversation`, attempt.chat),
      ...LABS.lab3.documentationFields.map((field) => reflectionBlock(field.label, attempt[field.id])),
    ];
  });

  return {
    heading: "Lab 3 — Break It on Purpose",
    blocks: [...attemptBlocks, reflectionBlock(LABS.lab3.optionalPrompt, lab3.almostGotPastMe)],
  };
}

function buildLab4Section(lab4) {
  return {
    heading: "Lab 4 — Grounding and Its Limits",
    blocks: [
      reflectionBlock(LABS.lab4.fields.taskAndSource.label, lab4.taskAndSource),
      conversationBlock("Ungrounded run", lab4.ungrounded),
      conversationBlock("Grounded run", lab4.grounded),
      reflectionBlock(LABS.lab4.fields.reflection.label, lab4.reflection),
    ],
  };
}

function buildWrapUpSection(wrapUp) {
  return {
    heading: "Wrap-Up",
    blocks: [reflectionBlock(LABS.wrapUp.prompt, wrapUp.paragraph)],
  };
}

export function buildPdfData(state) {
  return {
    cover: buildCover(state),
    labSections: [
      buildLab1Section(state.labs.lab1),
      buildLab2Section(state.labs.lab2),
      buildLab3Section(state.labs.lab3),
      buildLab4Section(state.labs.lab4),
      buildWrapUpSection(state.labs.wrapUp),
    ],
  };
}
