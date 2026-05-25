import { describe, expect, it } from "vitest";

import {
  getNextTaskGridPriorityDisplayMode,
  resolveInitialTaskGridPriorityDisplayMode,
} from "./taskGridPriorityDisplay";

describe("task grid priority display mode", () => {
  it("uses a valid stored display mode before legacy values", () => {
    expect(
      resolveInitialTaskGridPriorityDisplayMode("first", "prioritized")
    ).toBe("first");
  });

  it("migrates the legacy prioritized filter to prioritized-only mode", () => {
    expect(
      resolveInitialTaskGridPriorityDisplayMode(
        undefined,
        "prioritized"
      )
    ).toBe("only");
  });

  it("keeps legacy all-task mode as normal display mode", () => {
    expect(
      resolveInitialTaskGridPriorityDisplayMode(undefined, "all")
    ).toBe("normal");
  });

  it("uses normal display mode for unknown stored values", () => {
    expect(
      resolveInitialTaskGridPriorityDisplayMode(
        "prioritized",
        "unexpected"
      )
    ).toBe("normal");
  });

  it("cycles normal, prioritized-first, and prioritized-only modes", () => {
    expect(getNextTaskGridPriorityDisplayMode("normal")).toBe("first");
    expect(getNextTaskGridPriorityDisplayMode("first")).toBe("only");
    expect(getNextTaskGridPriorityDisplayMode("only")).toBe("normal");
  });
});
