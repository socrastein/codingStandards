import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { measureFunctions } from "../measure/functionMeasures.js";
import { runEslint } from "../measure/runEslint.js";

/** The fixture files, measured end to end with the real ESLint and plugins. */
const fixtures = fileURLToPath(new URL("./fixtures/", import.meta.url));

/**
 * Every function in a fixture file, by name.
 * @param {string} fileName The fixture's name.
 */
async function measuredFixture(fileName) {
  const file = `${fixtures}${fileName}`;
  const { records, messages } = await runEslint(fixtures, [file]);
  const measures = measureFunctions(records, messages);
  return new Map(measures.map((measure) => [measure.record.name, measure]));
}

describe("measuring real files", () => {
  it("measures a JavaScript function's lines, both complexities, nesting and parameters", async () => {
    const functions = await measuredFixture("nested.js");
    expect(functions.get("countLongWords")).toMatchObject({ lines: 9, cognitive: 3, cyclomatic: 3, depth: 2, params: 2 });
    expect(functions.get("double")).toMatchObject({ lines: 1, cognitive: 0, cyclomatic: 1, depth: 0, params: 1 });
  });

  it("measures a TypeScript class method, whose measures are reported at its name", async () => {
    const functions = await measuredFixture("typed.ts");
    expect(functions.get("label")).toMatchObject({ cognitive: 2, cyclomatic: 2, depth: 1, params: 1 });
  });

  it("measures a function that is a property's value, which is also reported at the property's name", async () => {
    const functions = await measuredFixture("typed.ts");
    expect(functions.get("format")).toMatchObject({ lines: 1, cyclomatic: 1, params: 1 });
  });

  it("counts bare numbers and bitwise operators, leaving out ignored numbers and ones a name explains", async () => {
    const functions = await measuredFixture("magic.ts");
    expect(functions.get("scale")).toMatchObject({ magic: 4 });
    expect(functions.get("plain")).toMatchObject({ magic: 0 });
  });

  it("counts nothing in a test file, where literal expected values are the specification", async () => {
    const functions = await measuredFixture("magic.test.ts");
    expect(functions.get("expectDouble")).toMatchObject({ magic: 0 });
  });

  it("measures a Vue component's <script setup>, naming callbacks after their calls", async () => {
    const functions = await measuredFixture("Component.vue");
    expect([...functions.keys()]).toEqual(["computed callback", "reduce callback"]);
    expect(functions.get("reduce callback")).toMatchObject({ cognitive: 1, cyclomatic: 2, params: 2 });
  });
});
