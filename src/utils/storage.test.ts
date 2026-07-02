import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  backupCorruptStorageValue,
  readFromStorage,
  saveToStorage,
} from "./storage";

const createLocalStorageMock = () => {
  const store = new Map<string, string>();

  return {
    clear: () => store.clear(),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn(
      (index: number) => Array.from(store.keys())[index] ?? null
    ),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    get length() {
      return store.size;
    },
  } satisfies Storage;
};

describe("storage", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: createLocalStorageMock(),
    });
  });

  it("reports missing values", () => {
    expect(readFromStorage("state")).toEqual({ status: "missing" });
  });

  it("reports valid values", () => {
    saveToStorage("state", { tasks: [] });

    expect(readFromStorage("state")).toEqual({
      status: "ok",
      value: { tasks: [] },
    });
  });

  it("reports corrupt values and preserves the raw payload", () => {
    localStorage.setItem("state", "{bad json");

    const result = readFromStorage("state");

    expect(result.status).toBe("corrupt");
    if (result.status === "corrupt") {
      expect(result.rawValue).toBe("{bad json");
    }
  });

  it("backs up corrupt values before replacement", () => {
    localStorage.setItem("statistics", "{bad json");
    readFromStorage("statistics");

    const backupKey = backupCorruptStorageValue("statistics");

    expect(backupKey).toMatch(/^statistics\.corrupt\./);
    expect(localStorage.getItem(backupKey ?? "")).toBe("{bad json");
    expect(localStorage.getItem("statistics")).toBe("{bad json");
  });
});
