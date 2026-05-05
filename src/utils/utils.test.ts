import { describe, expect, it } from "vitest";

import { padNum } from "./padNumber";
import { parseTime } from "./parseTime";
import { sanitizeMarkdownLinkUri } from "./sanitizeMarkdownLinkUri";

describe("utils", () => {
  it("formats numbers with a leading zero only when needed", () => {
    expect(padNum(0)).toBe("00");
    expect(padNum(9)).toBe("09");
    expect(padNum(10)).toBe("10");
  });

  it("parses timer values into seconds", () => {
    expect(parseTime("00:00")).toBe(0);
    expect(parseTime("01:30")).toBe(90);
    expect(parseTime("25:00")).toBe(1500);
  });

  it("keeps safe markdown link URIs and blocks unsafe ones", () => {
    expect(sanitizeMarkdownLinkUri("https://example.com")).toBe(
      "https://example.com"
    );
    expect(sanitizeMarkdownLinkUri("mailto:user@example.com")).toBe(
      "mailto:user@example.com"
    );
    expect(sanitizeMarkdownLinkUri("#section")).toBe("#section");
    expect(sanitizeMarkdownLinkUri("javascript:alert(1)")).toBe("#");
    expect(sanitizeMarkdownLinkUri("/relative/path")).toBe("#");
  });
});
