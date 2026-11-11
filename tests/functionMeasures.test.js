import { describe, expect, it } from "vitest";
import { measureFunctions } from "../measure/functionMeasures.js";

/** @typedef {import("../measure/functionRecorder.js").FunctionRecord} FunctionRecord */

/** An outer function on lines 1-20 (head on line 1) holding an inner callback on lines 5-9 (head on line 5). */
/** @type {FunctionRecord[]} */
const RECORDS = [
  {
    file: "/a.js",
    name: "outer",
    start: { line: 1, column: 0 },
    bodyStart: { line: 1, column: 20 },
    end: { line: 20, column: 1 },
  },
  {
    file: "/a.js",
    name: "forEach callback",
    start: { line: 5, column: 10 },
    bodyStart: { line: 5, column: 20 },
    end: { line: 9, column: 3 },
  },
];

/** A measuring report at a position (its column counted from 1, as ESLint's messages count it). */
const report = (
  /** @type {string} */ ruleId,
  /** @type {string} */ message,
  /** @type {{ line: number, column: number }} */ { line, column },
) => ({ file: "/a.js", ruleId, message, line, column });

describe("measureFunctions", () => {
  it("reads each head report's value into the function whose head it is made at", () => {
    const messages = [
      report("max-lines-per-function", "Function 'outer' has too many lines (18). Maximum allowed is 0.", { line: 1, column: 1 }),
      report(
        "sonarjs/cognitive-complexity",
        "Refactor this function to reduce its Cognitive Complexity from 4 to the 0 allowed.",
        { line: 1, column: 10 },
      ),
      report("complexity", "Arrow function has a complexity of 3. Maximum allowed is 0.", { line: 5, column: 15 }),
      report("max-params", "Arrow function has too many parameters (2). Maximum allowed is 0.", { line: 5, column: 15 }),
    ];
    const [outer, callback] = measureFunctions(RECORDS, messages);
    expect(outer).toMatchObject({ lines: 18, cognitive: 4, cyclomatic: 0, params: 0 });
    expect(callback).toMatchObject({ lines: 0, cognitive: 0, cyclomatic: 3, params: 2 });
  });

  it("gives a nesting depth to the innermost function around the block, keeping its deepest", () => {
    const messages = [
      report("max-depth", "Blocks are nested too deeply (1). Maximum allowed is 0.", { line: 6, column: 5 }),
      report("max-depth", "Blocks are nested too deeply (2). Maximum allowed is 0.", { line: 7, column: 7 }),
      report("max-depth", "Blocks are nested too deeply (1). Maximum allowed is 0.", { line: 12, column: 3 }),
    ];
    const [outer, callback] = measureFunctions(RECORDS, messages);
    expect(callback?.depth).toBe(2);
    expect(outer?.depth).toBe(1);
  });

  it("counts each magic number and bitwise report toward the innermost function around it", () => {
    const messages = [
      report("@typescript-eslint/no-magic-numbers", "No magic number: 42.", { line: 2, column: 5 }),
      report("@typescript-eslint/no-magic-numbers", "No magic number: 7.", { line: 6, column: 9 }),
      report("no-bitwise", "Unexpected use of '&'.", { line: 8, column: 9 }),
    ];
    const [outer, callback] = measureFunctions(RECORDS, messages);
    expect(outer?.magic).toBe(1);
    expect(callback?.magic).toBe(2);
  });

  it("leaves out reports from rules that do not measure, and from other files", () => {
    const otherFile = { ...report("complexity", "has a complexity of 9.", { line: 1, column: 1 }), file: "/b.js" };
    const messages = [report("no-unused-vars", "'x' is unused.", { line: 1, column: 1 }), otherFile];
    const [outer] = measureFunctions(RECORDS, messages);
    expect(outer).toMatchObject({ lines: 0, cognitive: 0, cyclomatic: 0, depth: 0, params: 0, magic: 0 });
  });

  it("stops when a measuring report's text has no value, rather than reading it as 0", () => {
    const messages = [report("complexity", "a message in a new wording", { line: 1, column: 1 })];
    expect(() => measureFunctions(RECORDS, messages)).toThrow(/no measured value/);
  });
});
