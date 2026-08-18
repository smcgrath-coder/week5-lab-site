import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Landing from "./Landing";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function fillRequiredFields(user) {
  return (async () => {
    await user.type(screen.getByLabelText(/your name/i), "Rion");
    await user.click(screen.getByRole("button", { name: /clinical/i }));
    await user.click(screen.getByRole("checkbox", { name: /will not enter real patient information/i }));
    await user.type(screen.getByLabelText(/class passcode/i), "class-secret");
  })();
}

describe("Landing — Begin button gating", () => {
  it("is disabled until name, lane, PHI acknowledgement, and passcode are all filled in", async () => {
    const user = userEvent.setup();
    render(<Landing onSuccess={() => {}} />);

    const begin = screen.getByRole("button", { name: /begin/i });
    expect(begin).toBeDisabled();

    await fillRequiredFields(user);

    expect(begin).toBeEnabled();
  });
});

describe("Landing — passcode check", () => {
  it("shows an inline error when the server rejects the passcode", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "That passcode isn't right — check with your instructor." }),
      })
    );
    const onSuccess = vi.fn();
    render(<Landing onSuccess={onSuccess} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /begin/i }));

    expect(await screen.findByText(/passcode isn't right/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
