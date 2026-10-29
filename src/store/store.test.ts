import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("utils", async () => await vi.importActual("../utils"));
vi.mock("assets/audios/notification-bell.wav", () => ({
  default: "notification-bell.wav",
}));
vi.mock("assets/audios/notification-custom.wav", () => ({
  default: "notification-custom.wav",
}));

const createQuotaLimitedStorage = () => {
  const values = new Map<string, string>();
  let quotaExceeded = false;

  const storage = {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      if (quotaExceeded) {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      }
      values.set(key, value);
    },
    get length() {
      return values.size;
    },
  } satisfies Storage;

  return {
    storage,
    exceedQuota: () => {
      quotaExceeded = true;
    },
  };
};

describe("store persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("navigator", { appVersion: "Linux" });
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      matchMedia: () => ({ matches: false }),
    });
    vi.stubGlobal("document", {
      addEventListener: vi.fn(),
      visibilityState: "visible",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("notifies subscribers when a debounced write fails", async () => {
    const { storage, exceedQuota } = createQuotaLimitedStorage();
    vi.stubGlobal("localStorage", storage);
    const { default: store, subscribePersistenceFailures } =
      await import("./store");
    const onFailure = vi.fn();
    subscribePersistenceFailures(onFailure);

    exceedQuota();
    store.dispatch({ type: "test/state-touched" });
    vi.advanceTimersByTime(1000);

    expect(onFailure).toHaveBeenCalled();
  });

  it("delivers a boot-time write failure to the first subscriber", async () => {
    const { storage, exceedQuota } = createQuotaLimitedStorage();
    exceedQuota();
    vi.stubGlobal("localStorage", storage);
    const { subscribePersistenceFailures } = await import("./store");
    const onFailure = vi.fn();

    subscribePersistenceFailures(onFailure);

    expect(onFailure).toHaveBeenCalledOnce();
  });
});
