import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import Lab1 from "./Lab1";
import Lab2 from "./Lab2";
import Lab3 from "./Lab3";
import { LABS } from "../data/labs";
import {
  addLab3Attempt,
  createInitialState,
  serialize,
  updateLab3Attempt,
} from "../state/labState";
import { useLabState } from "../state/useLabState";

const STATE_KEY = "mhi289a-week5-v1";

beforeEach(() => {
  localStorage.clear();
});

function Harness({ Screen }) {
  const labState = useLabState();
  return <Screen labState={labState} onNavigate={() => {}} />;
}

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
});
