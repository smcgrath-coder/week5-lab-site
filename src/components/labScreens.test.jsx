import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Lab1 from "./Lab1";
import Lab2 from "./Lab2";
import Lab3 from "./Lab3";
import Lab4 from "./Lab4";
import { LABS } from "../data/labs";
import {
  addLab3Attempt,
  appendMessage,
  createInitialState,
  serialize,
  setStudent,
  startConversation,
  updateLab3Attempt,
} from "../state/labState";
import { useLabState } from "../state/useLabState";

const STATE_KEY = "mhi289a-week5-v1";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function Harness({ Screen }) {
  const labState = useLabState();
  return <Screen labState={labState} onNavigate={() => {}} />;
}

describe("Landing — course line", () => {
  it("does not mention UC Davis School of Medicine", () => {
    expect(LABS.intro.courseLine).not.toMatch(/UC Davis School of Medicine/i);
  });
});

describe.each([
  ["Lab1", Lab1],
  ["Lab2", Lab2],
  ["Lab3", Lab3],
  ["Lab4", Lab4],
])("%s — back to hub link", (name, Screen) => {
  it("shows a back-to-hub link at both the top and the bottom of the screen", () => {
    render(<Harness Screen={Screen} />);

    expect(screen.getAllByRole("button", { name: /back to hub/i }).length).toBeGreaterThanOrEqual(2);
  });
});

describe.each([
  ["Lab1", Lab1],
  ["Lab2", Lab2],
  ["Lab3", Lab3],
  ["Lab4", Lab4],
])("%s — how-to instructions", (name, Screen) => {
  it("shows instructions for how to proceed through the lab", () => {
    render(<Harness Screen={Screen} />);

    expect(screen.getByTestId("lab-howto")).toBeInTheDocument();
  });
});

describe.each([
  ["Lab1", Lab1],
  ["Lab2", Lab2],
  ["Lab3", Lab3],
  ["Lab4", Lab4],
])("%s — progress indicator", (name, Screen) => {
  it("shows a step progress indicator", () => {
    render(<Harness Screen={Screen} />);

    expect(screen.getByTestId("lab-progress")).toBeInTheDocument();
  });
});

describe.each([
  ["Lab3", Lab3],
  ["Lab4", Lab4],
])("%s — worked example", (name, Screen) => {
  it("includes a worked example the student can open", () => {
    render(<Harness Screen={Screen} />);

    expect(screen.getByText(/see a worked example/i)).toBeInTheDocument();
  });
});

describe("Lab1 — progress indicator updates as work is done", () => {
  it("increases the done count once a task is picked", async () => {
    const user = userEvent.setup();
    render(<Harness Screen={Lab1} />);

    const before = screen.getByTestId("lab-progress").textContent;
    await user.click(screen.getByText(LABS.lab1.taskOptions[0].label));
    const after = screen.getByTestId("lab-progress").textContent;

    expect(after).not.toBe(before);
    expect(after).toMatch(/1 of 4/);
  });
});

describe("Lab1 — task picker", () => {
  it("shows all 4 task options", () => {
    render(<Harness Screen={Lab1} />);

    for (const opt of LABS.lab1.taskOptions) {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
    }
  });
});

describe("Lab3 — duplicate category warning", () => {
  it("warns when two attempts share the same failure category", () => {
    let state = createInitialState();
    state = addLab3Attempt(state);
    state = updateLab3Attempt(state, 0, { category: "biased" });
    state = addLab3Attempt(state);
    state = updateLab3Attempt(state, 1, { category: "biased" });
    localStorage.setItem(STATE_KEY, serialize(state));

    render(<Harness Screen={Lab3} />);

    expect(screen.getAllByText(/already used this category/i)).toHaveLength(2);
  });

  it("does not warn when attempts use different categories", () => {
    let state = createInitialState();
    state = addLab3Attempt(state);
    state = updateLab3Attempt(state, 0, { category: "biased" });
    state = addLab3Attempt(state);
    state = updateLab3Attempt(state, 1, { category: "fabricatedCitation" });
    localStorage.setItem(STATE_KEY, serialize(state));

    render(<Harness Screen={Lab3} />);

    expect(screen.queryByText(/already used this category/i)).not.toBeInTheDocument();
  });
});

describe("Lab2 — case buttons filter by lane", () => {
  it("shows only the clinical case for 2A when clinical is selected, and only operational when switched", async () => {
    const user = userEvent.setup();
    render(<Harness Screen={Lab2} />);

    await user.click(screen.getByRole("button", { name: "clinical" }));
    expect(screen.getByRole("button", { name: /insert c2/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /insert o2/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "operational" }));
    expect(screen.getByRole("button", { name: /insert o2/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /insert c2/i })).not.toBeInTheDocument();
  });

  it("defaults to the student's chosen lane before any toggle is explicitly clicked", () => {
    let state = createInitialState();
    state = setStudent(state, { name: "Jordan", lane: "operational", acknowledgedPHI: true });
    localStorage.setItem(STATE_KEY, serialize(state));

    render(<Harness Screen={Lab2} />);

    // no click yet — should already show operational's case, not clinical's
    expect(screen.getByRole("button", { name: /insert o2/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /insert c2/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "operational" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("Lab1 — New Conversation escape hatch", () => {
  it("clears Version A's transcript when the student confirms starting over", async () => {
    let state = createInitialState();
    state = startConversation(state, ["lab1", "runA"], "anthropic/claude-haiku-4.5");
    state = appendMessage(state, ["lab1", "runA"], { role: "user", content: "a long stuck conversation" });
    state = appendMessage(state, ["lab1", "runA"], { role: "assistant", content: "a reply" });
    localStorage.setItem(STATE_KEY, serialize(state));

    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<Harness Screen={Lab1} />);

    expect(screen.getByText("a long stuck conversation")).toBeInTheDocument();

    const newConvoButtons = screen.getAllByRole("button", { name: /new conversation/i });
    await user.click(newConvoButtons[0]); // Version A is the first panel

    expect(screen.queryByText("a long stuck conversation")).not.toBeInTheDocument();
    expect(screen.getAllByText(/pick a model, then send your first message/i).length).toBeGreaterThan(0);
  });

  it("does not clear the transcript when the student cancels the confirm dialog", async () => {
    let state = createInitialState();
    state = startConversation(state, ["lab1", "runA"], "anthropic/claude-haiku-4.5");
    state = appendMessage(state, ["lab1", "runA"], { role: "user", content: "keep me" });
    localStorage.setItem(STATE_KEY, serialize(state));

    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<Harness Screen={Lab1} />);

    const newConvoButtons = screen.getAllByRole("button", { name: /new conversation/i });
    await user.click(newConvoButtons[0]);

    expect(screen.getByText("keep me")).toBeInTheDocument();
  });
});

describe("Lab3 — remove attempt", () => {
  it("removes an attempt (and only that one) when the student confirms", async () => {
    let state = createInitialState();
    state = addLab3Attempt(state);
    state = updateLab3Attempt(state, 0, { category: "biased", tried: "first attempt notes" });
    state = addLab3Attempt(state);
    state = updateLab3Attempt(state, 1, { category: "fabricatedCitation", tried: "second attempt notes" });
    localStorage.setItem(STATE_KEY, serialize(state));

    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<Harness Screen={Lab3} />);

    expect(screen.getAllByText(/^Attempt \d$/)).toHaveLength(2);

    const removeButtons = screen.getAllByRole("button", { name: /remove this attempt/i });
    await user.click(removeButtons[0]); // remove attempt 1

    expect(screen.getAllByText(/^Attempt \d$/)).toHaveLength(1);
    expect(screen.getByText("second attempt notes")).toBeInTheDocument();
    expect(screen.queryByText("first attempt notes")).not.toBeInTheDocument();
  });

  it("does not remove the attempt when the student cancels the confirm dialog", async () => {
    let state = createInitialState();
    state = addLab3Attempt(state);
    localStorage.setItem(STATE_KEY, serialize(state));

    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<Harness Screen={Lab3} />);

    await user.click(screen.getByRole("button", { name: /remove this attempt/i }));

    expect(screen.getAllByText(/^Attempt \d$/)).toHaveLength(1);
  });
});

describe("Lab4 — grounded run case-insert buttons", () => {
  it("adds one more set of case-insert buttons for the grounded run, not the ungrounded run", () => {
    render(<Harness Screen={Lab4} />);

    // One set already exists on the task/source field itself (unrelated to this
    // fix). If the grounded run also has buttons, that's 2; if ungrounded also
    // got them (which it must NOT — no source material is the point), it'd be 3.
    expect(screen.getAllByRole("button", { name: /insert c1/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /insert o3/i })).toHaveLength(2);
  });
});
