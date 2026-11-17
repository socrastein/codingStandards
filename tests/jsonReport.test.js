import { describe, expect, it } from "vitest";
import { formatJsonReport } from "../measure/jsonReport.js";

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

/** The rows of one report, parsed back so the test reads the document the way the reader will. */
const rows = (/** @type {ReturnType<typeof measured>[]} */ measures) => JSON.parse(formatJsonReport(measures, "/project"));

describe("formatJsonReport", () => {
  it("prints an empty array when there is nothing to measure", () => {
    expect(formatJsonReport([], "/project")).toBe("[]");
  });

  it("has exactly the fields the reader expects, one object per function", () => {
    const [row] = rows([measured("simple", {})]);
    expect(Object.keys(row)).toEqual([
      "name",
      "file",
      "startLine",
      "startColumn",
      "endLine",
      "endColumn",
      "linesOfCode",
      "cognitiveComplexity",
      "cyclomaticComplexity",
      "nestingDepth",
      "parameterCount",
      "magicCount",
      "overThreshold",
    ]);
  });

  it("carries the function's whole range through, with the file relative to the project root", () => {
    const [row] = rows([measured("simple", {})]);
    expect(row).toMatchObject({
      name: "simple",
      file: "src/a.js",
      startLine: 3,
      startColumn: 0,
      endLine: 9,
      endColumn: 1,
    });
  });

  it("carries each measure under its JSON name", () => {
    const [row] = rows([measured("measured", { lines: 7, cognitive: 3, cyclomatic: 2, depth: 1, params: 2, magic: 4 })]);
    expect(row).toMatchObject({
      linesOfCode: 7,
      cognitiveComplexity: 3,
      cyclomaticComplexity: 2,
      nestingDepth: 1,
      parameterCount: 2,
      magicCount: 4,
    });
  });

  it("names each measure that is over its threshold, and nothing else", () => {
    const [over] = rows([measured("long", { lines: 21, cognitive: 11, depth: 3, params: 4 })]);
    expect(over.overThreshold).toEqual(["linesOfCode", "cognitiveComplexity", "nestingDepth", "parameterCount"]);
    const [plain] = rows([measured("plain", {})]);
    expect(plain.overThreshold).toEqual([]);
  });

  it("leaves a value at its threshold out and names the one just over it", () => {
    const [at] = rows([measured("at", { lines: 20 })]);
    expect(at.overThreshold).toEqual([]);
    const [over] = rows([measured("over", { lines: 21 })]);
    expect(over.overThreshold).toEqual(["linesOfCode"]);
  });

  it("lists the hardest function first, like the table", () => {
    const report = rows([measured("simple", { cognitive: 1 }), measured("hard", { cognitive: 7 })]);
    const names = report.map((/** @type {{ name: string }} */ row) => row.name);
    expect(names).toEqual(["hard", "simple"]);
  });
});
