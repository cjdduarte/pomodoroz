import { describe, expect, it } from "vitest";

import {
  getSpecialBreakTrigger,
  keepSpecialBreakKeysForDate,
} from "./specialBreak";

const specialBreak = {
  fromTime: "10:00",
  toTime: "10:30",
  duration: 30,
};

describe("specialBreak", () => {
  it("triggers inside the configured window", () => {
    const trigger = getSpecialBreakTrigger(
      { firstBreak: specialBreak },
      new Date("2026-07-02T10:12:00"),
      new Set()
    );

    expect(trigger?.breakConfig).toEqual(specialBreak);
    expect(trigger?.key).toBe("2026-07-02:firstBreak:10:00-10:30");
  });

  it("does not trigger outside the configured window", () => {
    expect(
      getSpecialBreakTrigger(
        { firstBreak: specialBreak },
        new Date("2026-07-02T10:30:00"),
        new Set()
      )
    ).toBeNull();
  });

  it("does not retrigger an already used break window", () => {
    expect(
      getSpecialBreakTrigger(
        { firstBreak: specialBreak },
        new Date("2026-07-02T10:12:00"),
        new Set(["2026-07-02:firstBreak:10:00-10:30"])
      )
    ).toBeNull();
  });

  it("restores only today's persisted triggers so a restart does not retrigger", () => {
    const now = new Date("2026-07-02T10:12:00");
    const restoredKeys = new Set(
      keepSpecialBreakKeysForDate(
        [
          "2026-07-01:firstBreak:10:00-10:30",
          "2026-07-02:firstBreak:10:00-10:30",
          42,
        ],
        now
      )
    );

    expect([...restoredKeys]).toEqual([
      "2026-07-02:firstBreak:10:00-10:30",
    ]);
    expect(
      getSpecialBreakTrigger(
        { firstBreak: specialBreak },
        now,
        restoredKeys
      )
    ).toBeNull();
  });
});
