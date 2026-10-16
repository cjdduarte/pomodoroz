import { describe, expect, it } from "vitest";

import { getTaskHistoryShortcutAction } from "./taskHistoryShortcut";

const keyZ = {
  code: "KeyZ",
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
};

describe("taskHistoryShortcut", () => {
  it("maps Ctrl/Cmd+Z to undo and Ctrl/Cmd+Shift+Z to redo only", () => {
    expect(
      getTaskHistoryShortcutAction({ ...keyZ, ctrlKey: true })
    ).toBe("undo");
    expect(
      getTaskHistoryShortcutAction({
        ...keyZ,
        ctrlKey: true,
        shiftKey: true,
      })
    ).toBe("redo");
    expect(
      getTaskHistoryShortcutAction({
        ...keyZ,
        metaKey: true,
        shiftKey: true,
      })
    ).toBe("redo");
    expect(getTaskHistoryShortcutAction(keyZ)).toBeNull();
    expect(
      getTaskHistoryShortcutAction({
        ...keyZ,
        code: "KeyY",
        ctrlKey: true,
      })
    ).toBeNull();
  });
});
