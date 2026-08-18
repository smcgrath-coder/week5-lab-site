export function createInitialState() {
  return {
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
  };
}

export function serialize(state) {
  return JSON.stringify(state);
}

export function deserialize(json) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.version !== 1) return null;
  if (typeof parsed.student !== "object" || typeof parsed.labs !== "object") {
    return null;
  }
  return parsed;
}

export function setStudent(state, patch) {
  return { ...state, student: { ...state.student, ...patch } };
}

export function updateLab(state, labId, patch) {
  return {
    ...state,
    labs: {
      ...state.labs,
      [labId]: { ...state.labs[labId], ...patch },
    },
  };
}

export function addLab3Attempt(state) {
  const attempt = { category: null, chat: null, tried: "", produced: "", caught: "" };
  return updateLab(state, "lab3", {
    attempts: [...state.labs.lab3.attempts, attempt],
  });
}

export function updateLab3Attempt(state, index, patch) {
  const attempts = state.labs.lab3.attempts.map((attempt, i) =>
    i === index ? { ...attempt, ...patch } : attempt
  );
  return updateLab(state, "lab3", { attempts });
}

export function removeLab3Attempt(state, index) {
  const attempts = state.labs.lab3.attempts.filter((_, i) => i !== index);
  return updateLab(state, "lab3", { attempts });
}

function getIn(obj, path) {
  return path.reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function setIn(obj, path, value) {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[key] = setIn(obj[key], rest, value);
    return copy;
  }
  return { ...obj, [key]: setIn(obj ? obj[key] : undefined, rest, value) };
}

export function startConversation(state, path, model) {
  const conversation = { model, startedAt: new Date().toISOString(), messages: [] };
  return setIn(state, ["labs", ...path], conversation);
}

export function appendMessage(state, path, message) {
  const conversation = getIn(state, ["labs", ...path]);
  const fullMessage = { ...message, at: message.at ?? new Date().toISOString() };
  const nextMessages = [...conversation.messages, fullMessage];
  return setIn(state, ["labs", ...path, "messages"], nextMessages);
}

export function setConversationMessages(state, path, messages) {
  return setIn(state, ["labs", ...path, "messages"], messages);
}

export function clearConversation(state, path) {
  return setIn(state, ["labs", ...path], null);
}

export function setConversationState(state, path, { model, messages }) {
  const existing = getIn(state, ["labs", ...path]);
  const conversation = {
    model,
    startedAt: existing?.startedAt ?? new Date().toISOString(),
    messages,
  };
  return setIn(state, ["labs", ...path], conversation);
}

export function exportBackup(state) {
  const date = new Date().toISOString().slice(0, 10);
  return {
    blob: new Blob([serialize(state)], { type: "application/json" }),
    filename: `week5-lab-backup-${date}.json`,
  };
}

export async function importBackup(file) {
  const text = await file.text();
  const state = deserialize(text);
  if (!state) {
    throw new Error(
      "That doesn't look like a valid backup file. Please choose a week5-lab-backup-*.json file."
    );
  }
  return state;
}
