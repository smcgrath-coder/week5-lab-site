import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Finish from "./Finish";
import { PasscodeContext } from "../state/passcode";
import { createInitialState, setStudent } from "../state/labState";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderFinish(state) {
  const labState = { state, exportBackup: () => ({}) };
  return render(
    <PasscodeContext.Provider value="class-secret">
      <Finish labState={labState} onNavigate={() => {}} />
    </PasscodeContext.Provider>
  );
}

describe("Finish — checklist", () => {
  it("renders the missing items reported by getCompleteness", () => {
    renderFinish(createInitialState());

    expect(screen.getByText(/Lab 1: pick a task/i)).toBeInTheDocument();
    expect(screen.getByText(/Wrap-Up: answer/i)).toBeInTheDocument();
  });
});

describe("Finish — email submission", () => {
  it("shows the fallback message when the email request fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({ error: "boom" }) })
    );

    const state = setStudent(createInitialState(), {
      name: "Jordan Lee",
      lane: "clinical",
      acknowledgedPHI: true,
    });
    renderFinish(state);

    await user.click(screen.getByRole("button", { name: /email a copy to my instructor/i }));

    expect(
      await screen.findByText(/email failed\. download the pdf and submit it on canvas instead/i)
    ).toBeInTheDocument();
  });
});
