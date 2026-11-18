import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** The measuring script itself, run as a command the way a person runs it. */
const measureScript = fileURLToPath(new URL("../measure/measure.js", import.meta.url));

/** The repository's root, where git finds the project the script measures. */
const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

/**
 * Runs the measuring script with the given arguments, in the repository, and waits for it to finish (with a limit, so a hang
 * fails the test instead of stalling the run).
 *
 * @param {string[]} args The command-line arguments.
 * @returns {import("node:child_process").SpawnSyncReturns<string>}
 */
function runMeasure(args) {
  return spawnSync(process.execPath, [measureScript, ...args], {
    cwd: repositoryRoot,
    encoding: "utf8",
    timeout: 60_000,
  });
}

describe("measure command line", () => {
  it("stops with a message naming the option when --base has no value, rather than measuring against a default", () => {
    const result = runMeasure(["--base"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--base needs a value, such as --base main");
  });
});
