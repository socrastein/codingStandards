#!/usr/bin/env node
/**
 * Measures the functions a change touches, for the code review gate: lines, cognitive and cyclomatic complexity, nesting depth
 * and parameters, with the values over a threshold marked. Run it from anywhere inside the project to measure:
 *
 *   node ~/repos/codingStandards/measure/measure.js                 the uncommitted work (staged, unstaged, untracked)
 *   node ~/repos/codingStandards/measure/measure.js --base main     everything the branch changed since it left main
 *   node ~/repos/codingStandards/measure/measure.js src/a.ts …      every function in the given files
 *   node ~/repos/codingStandards/measure/measure.js --all           every function in every tracked source file
 *
 * It always exits 0: the numbers are information for the review, not a pass or fail.
 */

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { changedLinesSince, isSourceFile } from "./changedLines.js";
import { measureFunctions } from "./functionMeasures.js";
import { formatReport } from "./report.js";
import { runEslint } from "./runEslint.js";
import { touchedFunctions } from "./selectFunctions.js";

/**
 * What to measure, from the command line.
 * @typedef {object} Options
 * @property {string} base The commit the changes are measured from ("HEAD" unless --base says otherwise).
 * @property {boolean} all Whether to measure every tracked source file whole.
 * @property {string[]} paths Files named on the command line, to measure whole.
 */

const options = parseArguments(process.argv.slice(2));
const projectRoot = gitOutput(process.cwd(), ["rev-parse", "--show-toplevel"]);
const changes = changesToMeasure(projectRoot, options);
const files = [...changes.keys()];
const { records, messages } = await runEslint(projectRoot, files);
const measures = measureFunctions(records, messages);
const touched = touchedFunctions(measures, changes);
console.log(formatReport(touched, projectRoot));

/**
 * The options given on the command line.
 *
 * @param {string[]} args The arguments after the script's name.
 * @returns {Options}
 */
function parseArguments(args) {
  /** @type {Options} */
  const parsed = { base: "HEAD", all: false, paths: [] };
  for (let index = 0; index < args.length; index++) {
    const arg = /** @type {string} */ (args[index]);
    if (arg === "--all") parsed.all = true;
    else if (arg === "--base") parsed.base = args[++index] ?? "HEAD";
    else if (arg.startsWith("--")) throw new Error(`unknown option: ${arg}`);
    else parsed.paths.push(arg);
  }
  return parsed;
}

/**
 * The files to measure and which of their lines count: whole files for named paths or --all, otherwise the lines changed since
 * the point where the current work left the base commit (so --base main measures only the branch's own changes).
 *
 * @param {string} projectRoot The repository's root.
 * @param {Options} options What to measure.
 * @returns {import("./changedLines.js").ChangedLines}
 */
function changesToMeasure(projectRoot, options) {
  const namesFiles = options.paths.length > 0;
  if (namesFiles) {
    const namedFiles = options.paths.map((path) => resolve(path));
    return wholeFiles(namedFiles);
  }
  if (options.all) {
    const trackedFiles = trackedSourceFiles(projectRoot);
    return wholeFiles(trackedFiles);
  }
  const forkPoint = gitOutput(projectRoot, ["merge-base", options.base, "HEAD"]);
  return changedLinesSince(projectRoot, forkPoint);
}

/**
 * Every tracked source file of the repository (git's own list, so installed and generated files are never included).
 *
 * @param {string} projectRoot The repository's root.
 * @returns {string[]} The files' absolute paths.
 */
function trackedSourceFiles(projectRoot) {
  const listing = gitOutput(projectRoot, ["ls-files"]);
  const sourcePaths = listing.split("\n").filter(isSourceFile);
  return sourcePaths.map((path) => resolve(projectRoot, path));
}

/**
 * Files to measure from top to bottom.
 *
 * @param {string[]} paths The files' absolute paths.
 * @returns {import("./changedLines.js").ChangedLines}
 */
function wholeFiles(paths) {
  /** @type {import("./changedLines.js").ChangedLines} */
  const changes = new Map();
  for (const path of paths) changes.set(path, "all");
  return changes;
}

/**
 * What a git command printed, without the final line break.
 *
 * @param {string} folder Where to run git.
 * @param {string[]} args git's arguments.
 * @returns {string}
 */
function gitOutput(folder, args) {
  return execFileSync("git", ["-C", folder, ...args], { encoding: "utf8" }).trim();
}
