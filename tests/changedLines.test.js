import { describe, expect, it } from "vitest";
import { isSourceFile, parseDiff } from "../measure/changedLines.js";

describe("parseDiff", () => {
  it("lists the new-version lines each hunk adds or changes, file by file", () => {
    const diff = [
      "diff --git a/src/a.ts b/src/a.ts",
      "--- a/src/a.ts",
      "+++ b/src/a.ts",
      "@@ -10,2 +12,3 @@ function a() {",
      "@@ -40 +43 @@",
      "diff --git a/src/b.vue b/src/b.vue",
      "--- a/src/b.vue",
      "+++ b/src/b.vue",
      "@@ -1,0 +2,2 @@",
    ].join("\n");
    const changes = parseDiff(diff);
    expect(changes.get("src/a.ts")).toEqual([12, 13, 14, 43]);
    expect(changes.get("src/b.vue")).toEqual([2, 3]);
  });

  it("counts the lines either side of a gap where lines were only deleted", () => {
    const diff = ["--- a/a.js", "+++ b/a.js", "@@ -5,3 +4,0 @@"].join("\n");
    expect(parseDiff(diff).get("a.js")).toEqual([4, 5]);
  });

  it("leaves out a deleted file, which has no new version to measure", () => {
    const diff = ["--- a/gone.js", "+++ /dev/null", "@@ -1,3 +0,0 @@"].join("\n");
    expect(parseDiff(diff).size).toBe(0);
  });
});

describe("isSourceFile", () => {
  it("accepts JavaScript, TypeScript and Vue files", () => {
    for (const path of ["a.js", "a.mjs", "a.cjs", "a.ts", "a.mts", "src/A.vue"]) {
      expect(isSourceFile(path)).toBe(true);
    }
  });

  it("rejects type declarations and anything else", () => {
    for (const path of ["a.d.ts", "a.d.mts", "a.css", "README.md", ""]) {
      expect(isSourceFile(path)).toBe(false);
    }
  });
});
