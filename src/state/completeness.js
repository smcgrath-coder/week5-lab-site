function nonBlank(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasAssistantReply(conversation) {
  return Boolean(conversation?.messages?.some((m) => m.role === "assistant"));
}

function getLab1Completeness(lab1) {
  const missing = [];
  if (!lab1.taskChoice) missing.push("Lab 1: pick a task");
  if (!hasAssistantReply(lab1.runA)) missing.push("Lab 1: Version A needs at least one model reply");
  if (!hasAssistantReply(lab1.runB)) missing.push("Lab 1: Version B needs at least one model reply");
  if (!nonBlank(lab1.reflectionComparison)) {
    missing.push("Lab 1: answer the comparison reflection");
  }
  return { done: missing.length === 0, missing };
}

const LAB2_TASK_LABELS = {
  t2a: "Lab 2A (reading level)",
  t2b: "Lab 2B (source to summary)",
  t2c: "Lab 2C (synthesis)",
};

function getLab2Completeness(lab2) {
  const missing = [];
  for (const task of ["t2a", "t2b", "t2c"]) {
    const label = LAB2_TASK_LABELS[task];
    if (!hasAssistantReply(lab2[task].chat)) {
      missing.push(`${label}: needs at least one model reply`);
    } else if (!nonBlank(lab2[task].reflection)) {
      missing.push(`${label}: answer the reflection`);
    }
  }
  return { done: missing.length === 0, missing };
}

const LAB3_DOC_FIELDS = [
  { id: "tried", label: "what I was trying to do" },
  { id: "produced", label: "what it produced" },
  { id: "caught", label: "how I caught it" },
];
const MIN_ATTEMPTS = 2;
const MIN_DISTINCT_CATEGORIES = 2;

function getLab3Completeness(lab3) {
  const missing = [];
  const { attempts } = lab3;

  if (attempts.length < MIN_ATTEMPTS) {
    missing.push(`Lab 3: add at least ${MIN_ATTEMPTS} failure attempts (you have ${attempts.length})`);
  }

  const distinctCategories = new Set(attempts.map((a) => a.category).filter(Boolean));
  if (attempts.length >= MIN_ATTEMPTS && distinctCategories.size < MIN_DISTINCT_CATEGORIES) {
    missing.push("Lab 3: use at least 2 different failure categories across your attempts");
  }

  attempts.forEach((attempt, i) => {
    const n = i + 1;
    if (!hasAssistantReply(attempt.chat)) {
      missing.push(`Lab 3: attempt ${n} needs at least one model reply`);
    }
    for (const field of LAB3_DOC_FIELDS) {
      if (!nonBlank(attempt[field.id])) {
        missing.push(`Lab 3: attempt ${n} is missing "${field.label}" (${field.id})`);
      }
    }
  });

  return { done: missing.length === 0, missing };
}

function getLab4Completeness(lab4) {
  const missing = [];
  if (!hasAssistantReply(lab4.ungrounded)) {
    missing.push("Lab 4: the ungrounded run needs at least one model reply");
  }
  if (!hasAssistantReply(lab4.grounded)) {
    missing.push("Lab 4: the grounded run needs at least one model reply");
  }
  if (!nonBlank(lab4.reflection)) {
    missing.push("Lab 4: answer the final reflection");
  }
  return { done: missing.length === 0, missing };
}

function getWrapUpCompleteness(wrapUp) {
  const missing = [];
  if (!nonBlank(wrapUp.paragraph)) {
    missing.push("Wrap-Up: answer \"What this week changed for me\"");
  }
  return { done: missing.length === 0, missing };
}

export function getCompleteness(state) {
  return {
    lab1: getLab1Completeness(state.labs.lab1),
    lab2: getLab2Completeness(state.labs.lab2),
    lab3: getLab3Completeness(state.labs.lab3),
    lab4: getLab4Completeness(state.labs.lab4),
    wrapUp: getWrapUpCompleteness(state.labs.wrapUp),
  };
}
