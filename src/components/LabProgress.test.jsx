import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LabProgress from "./LabProgress";

describe("LabProgress", () => {
  it("shows a done/total summary and each step's label", () => {
    render(
      <LabProgress
        steps={[
          { label: "Pick a task", done: true },
          { label: "Version A", done: true },
          { label: "Version B", done: false },
          { label: "Comparison", done: false },
        ]}
      />
    );

    expect(screen.getByText("2 of 4 steps done")).toBeInTheDocument();
    expect(screen.getByText(/pick a task/i)).toBeInTheDocument();
    expect(screen.getByText(/version b/i)).toBeInTheDocument();
  });

  it("shows 0 of N when nothing is done yet", () => {
    render(
      <LabProgress
        steps={[
          { label: "Step one", done: false },
          { label: "Step two", done: false },
        ]}
      />
    );

    expect(screen.getByText("0 of 2 steps done")).toBeInTheDocument();
  });
});
