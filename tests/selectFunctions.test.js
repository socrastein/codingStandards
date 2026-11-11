import { describe, expect, it } from "vitest";
import { touchedFunctions } from "../measure/selectFunctions.js";

/** A measured function on the given lines of /a.js. */
const functionOn = (/** @type {string} */ name, /** @type {number} */ firstLine, /** @type {number} */ lastLine) => ({
  record: {
    file: "/a.js",
    name,
    start: { line: firstLine, column: 0 },
    bodyStart: { line: firstLine, column: 9 },
    end: { line: lastLine, column: 1 },
  },
  lines: 0,
  cognitive: 0,
  cyclomatic: 0,
  depth: 0,
  params: 0,
  magic: 0,
});

describe("touchedFunctions", () => {
  const outer = functionOn("outer", 1, 20);
  const inner = functionOn("inner", 5, 9);
  const later = functionOn("later", 30, 40);

  it("keeps the functions any changed line falls in, inner and outer alike", () => {
    const changes = new Map([["/a.js", [7]]]);
    expect(touchedFunctions([outer, inner, later], changes)).toEqual([outer, inner]);
  });

  it("keeps every function of a new file, and none of an unchanged one", () => {
    expect(touchedFunctions([outer, later], new Map([["/a.js", "all"]]))).toEqual([outer, later]);
    expect(touchedFunctions([outer, later], new Map())).toEqual([]);
  });

  it("leaves out a test file's describe callbacks, which only group tests", () => {
    const group = functionOn("describe callback", 1, 300);
    expect(touchedFunctions([group, inner], new Map([["/a.js", "all"]]))).toEqual([inner]);
  });
});
