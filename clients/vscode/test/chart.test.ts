import { describe, expect, it } from "vitest";
import type { LedgerEntry } from "@budgetary/sdk";

import { renderCalibrationChart } from "../src/webview/chart";

function entry(
  estimateId: string,
  scenario: string,
  predictedP50: number,
  actualTotal: number | null,
): LedgerEntry {
  return {
    estimateId,
    createdAt: "2026-05-27T10:14:00Z",
    queryExcerpt: "q",
    model: "claude-opus-4-7",
    host: "claude-code",
    projectId: "p",
    scenario,
    predicted: {
      p10: predictedP50 / 4,
      p50: predictedP50,
      p90: predictedP50 * 4,
    },
    actual:
      actualTotal === null
        ? null
        : {
            tokensIn: Math.floor(actualTotal / 2),
            tokensOut: Math.ceil(actualTotal / 2),
            total: actualTotal,
            durationMs: 10000,
            success: true,
          },
  };
}

function countCircles(svg: string): number {
  const matches = svg.match(/<circle\b/g);
  return matches ? matches.length : 0;
}

describe("renderCalibrationChart", () => {
  it("renders one <circle> per plottable entry", () => {
    const entries = [
      entry("e1", "confident", 1_000, 1_200),
      entry("e2", "uncertain", 5_000, 12_000),
      entry("e3", "sparse_evidence", 20_000, 18_000),
      entry("e4", "confident", 80_000, 75_000),
    ];
    const svg = renderCalibrationChart(entries);
    expect(countCircles(svg)).toBe(4);
  });

  it("drops entries with no actuals or with zero/negative tokens", () => {
    const entries = [
      entry("e1", "confident", 1_000, 1_200),
      entry("e2", "confident", 5_000, null),
      entry("e3", "confident", 0, 1_000),
      entry("e4", "confident", 1_000, -10),
      entry("e5", "confident", 1_000, 1_500),
    ];
    const svg = renderCalibrationChart(entries);
    expect(countCircles(svg)).toBe(2);
  });

  it("includes a y=x reference line on log-log scale", () => {
    const entries = [
      entry("e1", "confident", 1_000, 1_200),
      entry("e2", "uncertain", 10_000, 12_000),
    ];
    const svg = renderCalibrationChart(entries);
    expect(svg).toMatch(/stroke-dasharray="4 4"/);
  });

  it("renders the empty-state message when fewer than 2 points are plottable", () => {
    const empty = renderCalibrationChart([]);
    expect(empty).toContain("No calibration data yet");
    expect(countCircles(empty)).toBe(0);

    const onePoint = renderCalibrationChart([
      entry("e1", "confident", 1_000, 1_200),
    ]);
    expect(onePoint).toContain("No calibration data yet");
    expect(countCircles(onePoint)).toBe(0);
  });

  it("colors points per scenario", () => {
    const svg = renderCalibrationChart([
      entry("e1", "confident", 1_000, 1_200),
      entry("e2", "uncertain", 1_000, 1_200),
      entry("e3", "sparse_evidence", 1_000, 1_200),
      entry("e4", "future_label", 1_000, 1_200),
    ]);
    expect(svg).toContain("var(--vscode-charts-blue)");
    expect(svg).toContain("var(--vscode-charts-yellow)");
    expect(svg).toContain("var(--vscode-charts-orange)");
    expect(svg).toContain("var(--vscode-foreground)");
  });

  it("places points within the chart viewport", () => {
    const entries = [
      entry("e1", "confident", 1_000, 1_200),
      entry("e2", "uncertain", 50_000, 60_000),
    ];
    const svg = renderCalibrationChart(entries);
    const xs = Array.from(svg.matchAll(/cx="(\d+(?:\.\d+)?)"/g)).map((m) =>
      Number(m[1]),
    );
    const ys = Array.from(svg.matchAll(/cy="(\d+(?:\.\d+)?)"/g)).map((m) =>
      Number(m[1]),
    );
    expect(xs.length).toBe(2);
    expect(ys.length).toBe(2);
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(600);
    }
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(400);
    }
  });

  it("returns valid-looking SVG (root element + viewBox)", () => {
    const svg = renderCalibrationChart([]);
    expect(svg).toMatch(/^<svg\b/);
    expect(svg).toContain('viewBox="0 0 600 400"');
  });
});
