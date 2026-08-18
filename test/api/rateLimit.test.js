import { afterEach, describe, expect, it, vi } from "vitest";
import { checkAndIncrement } from "../../api/_lib/rateLimit";

const env = {
  UPSTASH_REDIS_REST_URL: "https://example-upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token123",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("checkAndIncrement — local dev (no Upstash env vars)", () => {
  it("fails open without calling fetch when Upstash env vars are absent", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkAndIncrement("chat", "1.2.3.4", 150, {});

    expect(result).toEqual({ allowed: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("checkAndIncrement — Upstash pipeline", () => {
  it("allows the request when the incremented count is at or under the max", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: 5 }, { result: 1 }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkAndIncrement("chat", "1.2.3.4", 150, env);

    expect(result).toEqual({ allowed: true, count: 5 });
  });

  it("denies the request when the incremented count exceeds the max", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: 151 }, { result: 0 }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkAndIncrement("chat", "1.2.3.4", 150, env);

    expect(result).toEqual({ allowed: false, count: 151 });
  });

  it("sends an INCR + EXPIRE NX pipeline keyed by kind, ip, and UTC date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-17T23:30:00Z"));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: 1 }, { result: 1 }],
    });
    vi.stubGlobal("fetch", fetchMock);

    await checkAndIncrement("email", "5.6.7.8", 5, env);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example-upstash.io/pipeline");
    expect(options.headers.Authorization).toBe("Bearer token123");
    const body = JSON.parse(options.body);
    expect(body).toEqual([
      ["INCR", "rl:email:5.6.7.8:2026-08-17"],
      ["EXPIRE", "rl:email:5.6.7.8:2026-08-17", "90000", "NX"],
    ]);

    vi.useRealTimers();
  });
});

describe("checkAndIncrement — Upstash failure", () => {
  it("fails open and logs when the fetch call itself throws", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await checkAndIncrement("chat", "1.2.3.4", 150, env);

    expect(result).toEqual({ allowed: true });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("fails open and logs when Upstash responds with a non-ok status", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await checkAndIncrement("chat", "1.2.3.4", 150, env);

    expect(result).toEqual({ allowed: true });
    expect(errorSpy).toHaveBeenCalled();
  });
});
