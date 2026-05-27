import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  formatTimestamp,
  formatTokens,
  truncateEstimateId,
} from "../src/format";

describe("formatTokens", () => {
  it("renders with thousands separators", () => {
    expect(formatTokens(48000)).toBe("48,000");
    expect(formatTokens(1_234_567)).toBe("1,234,567");
  });

  it("renders zero", () => {
    expect(formatTokens(0)).toBe("0");
  });

  it("returns em-dash for null, undefined, NaN, Infinity", () => {
    expect(formatTokens(null)).toBe("—");
    expect(formatTokens(undefined)).toBe("—");
    expect(formatTokens(NaN)).toBe("—");
    expect(formatTokens(Infinity)).toBe("—");
  });
});

describe("truncateEstimateId", () => {
  it("appends an ellipsis when longer than the limit", () => {
    expect(truncateEstimateId("est_01HXXXXXXXXXXXXXXX", 12)).toBe("est_01HXXXXX…");
  });

  it("leaves short ids unchanged", () => {
    expect(truncateEstimateId("est_short")).toBe("est_short");
  });

  it("uses 12 as default max", () => {
    const out = truncateEstimateId("est_01HXXXXXXXXXXXXXXX");
    expect(out.length).toBe(13); // 12 chars + ellipsis
  });
});

describe("formatTimestamp", () => {
  it("formats an ISO string in local time without a timezone tag", () => {
    const out = formatTimestamp("2026-05-27T10:14:00Z");
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it("passes invalid input through unchanged", () => {
    expect(formatTimestamp("not a date")).toBe("not a date");
  });
});

describe("escapeHtml", () => {
  it("escapes &, <, >, \", '", () => {
    expect(escapeHtml(`<a href="x">'y'&z</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;y&#39;&amp;z&lt;/a&gt;",
    );
  });
});
