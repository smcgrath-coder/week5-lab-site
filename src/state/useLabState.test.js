import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState, serialize } from "./labState";
import { useLabState } from "./useLabState";

const STORAGE_KEY = "mhi289a-week5-v1";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useLabState", () => {
  it("initializes from createInitialState when localStorage is empty", () => {
    const { result } = renderHook(() => useLabState());
    expect(result.current.state).toEqual(createInitialState());
  });

  it("hydrates from a saved state already in localStorage", () => {
    const saved = { ...createInitialState(), student: { name: "Rion", lane: "clinical", acknowledgedPHI: true } };
    localStorage.setItem(STORAGE_KEY, serialize(saved));

    const { result } = renderHook(() => useLabState());

    expect(result.current.state.student.name).toBe("Rion");
  });

  it("debounces saves: does not write immediately, writes once after ~500ms", () => {
    vi.useFakeTimers();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    const { result } = renderHook(() => useLabState());

    act(() => {
      result.current.setStudent({ name: "Rion" });
    });

    expect(setItemSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    const [key, value] = setItemSpy.mock.calls[0];
    expect(key).toBe(STORAGE_KEY);
    expect(JSON.parse(value).student.name).toBe("Rion");
  });
});
