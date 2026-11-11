import { describe, expect, it } from "vitest";
import { formatReport } from "../measure/report.js";

/** A measured function in /project/src/a.js with the given measures. */
const measured = (/** @type {string} */ name, /** @type {Partial<Record<string, number>>} */ values) => ({
  record: {
    file: "/project/src/a.js",
    name,
    start: { line: 3, column: 0 },
    bodyStart: { line: 3, column: 9 },
    end: { line: 9, column: 1 },
  },
  lines: 5,
  cognitive: 0,
  cyclomatic: 1,
  depth: 0,
  params: 1,
  magic: 0,
  ...values,
});

describe("formatReport", () => {
  it("says so when there is nothing to measure", () => {
    expect(formatReport([], "/project")).toBe("No changed functions to measure.");
  });

  it("lists the hardest function first, with its place relative to the project", () => {
    const report = formatReport([measured("simple", { cognitive: 1 }), measured("hard", { cognitive: 7 })], "/project");
    const lines = report.split("\n");
    expect(lines[0]).toMatch(/^Function\s+Where\s+Lines\s+Cognitive\s+Cyclomatic\s+Depth\s+Params\s+Magic$/);
    expect(lines[2]).toMatch(/^hard\s+src\/a\.js:3\s/);
    expect(lines[3]).toMatch(/^simple\s/);
  });

  it("shows the Magic count without ever marking it, since it has no threshold", () => {
    const report = formatReport([measured("bitTwiddler", { magic: 12 })], "/project");
    expect(report).toMatch(/bitTwiddler .* 12$/m);
    expect(report).toContain("0 over a threshold");
  });

  it("marks each value over its threshold with '!' and counts the functions over one", () => {
    const report = formatReport([measured("long", { lines: 21, params: 4 }), measured("fine", {})], "/project");
    expect(report).toMatch(/long .* 21! .* 4!\s+0$/m);
    expect(report).toContain("2 function(s), 1 over a threshold");
  });
});
