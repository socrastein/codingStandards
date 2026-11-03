import { execFileSync } from "node:child_process";
import { join } from "node:path";

/**
 * Which lines of which source files have changed since a base commit, from git: the code a commit adds or changes, which is
 * what the code review gate measures. A new file that git does not track yet counts as changed throughout.
 */

/**
 * Changed lines by file (absolute path): a list of line numbers, or "all" for a file that is new as a whole.
 * @typedef {Map<string, number[] | "all">} ChangedLines
 */

/** Files the measuring can read: JavaScript, TypeScript and Vue components. Type declarations (.d.ts) have no functions. */
const SOURCE_FILE = /\.(js|mjs|cjs|ts|mts|vue)$/;
const DECLARATION_FILE = /\.d\.m?ts$/;

/**
 * The changed lines of every source file since the base: committed, staged and unstaged changes, and untracked files.
 *
 * @param {string} projectRoot The git repository's root folder.
 * @param {string} base The commit to compare with, such as "HEAD" (the uncommitted work) or "main" (the whole branch).
 * @returns {ChangedLines}
 */
export function changedLinesSince(projectRoot, base) {
  const diff = git(projectRoot, ["diff", "--unified=0", "--no-color", "--no-ext-diff", base, "--"]);
  const untracked = git(projectRoot, ["ls-files", "--others", "--exclude-standard"]);

  /** @type {ChangedLines} */
  const changes = new Map();
  for (const [path, lines] of parseDiff(diff)) {
    if (isSourceFile(path)) changes.set(join(projectRoot, path), lines);
  }
  for (const path of untracked.split("\n")) {
    if (isSourceFile(path)) changes.set(join(projectRoot, path), "all");
  }
  return changes;
}

/**
 * The lines each file has in the new version that a `git diff --unified=0` adds or changes. Where lines were only deleted,
 * the lines on either side of the gap count as changed, since the code around them changed.
 *
 * @param {string} diff The diff's text.
 * @returns {Map<string, number[]>} Changed line numbers by file path, as the diff writes it (relative to the repository).
 */
export function parseDiff(diff) {
  /** @type {Map<string, number[]>} */
  const changes = new Map();
  /** @type {number[] | null} */
  let currentLines = null;

  for (const line of diff.split("\n")) {
    const newFile = /^\+\+\+ b\/(.+)$/.exec(line);
    if (newFile?.[1]) currentLines = linesOf(changes, newFile[1]);
    else if (line.startsWith("+++ "))
      currentLines = null; // "+++ /dev/null": the file was deleted
    else if (line.startsWith("@@") && currentLines) currentLines.push(...hunkLines(line));
  }
  return changes;
}

/**
 * The line list of a file in the result, created empty the first time the file appears.
 *
 * @param {Map<string, number[]>} changes The result so far.
 * @param {string} path The file's path.
 * @returns {number[]}
 */
function linesOf(changes, path) {
  const lines = changes.get(path) ?? [];
  changes.set(path, lines);
  return lines;
}

/**
 * The new-version lines one hunk header covers. A header whose new side reads `+14,5` covers lines 14 to 18; one that reads
 * `+14,0` means lines were only deleted after line 14, so 14 and 15 (either side of the gap) count. A missing count means 1.
 *
 * @param {string} header The hunk's header line.
 * @returns {number[]}
 */
function hunkLines(header) {
  const match = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(header);
  if (!match) throw new Error(`not a hunk header: ${header}`);
  const start = Number(match[1]);
  const count = match[2] === undefined ? 1 : Number(match[2]);
  const isDeletionOnly = count === 0;
  if (isDeletionOnly) return [start, start + 1];
  return Array.from({ length: count }, (_, offset) => start + offset);
}

/**
 * Whether a path is a source file the measuring can read: JavaScript, TypeScript or a Vue component, but not a type
 * declaration file.
 *
 * @param {string} path The file's path.
 * @returns {boolean}
 */
export function isSourceFile(path) {
  return SOURCE_FILE.test(path) && !DECLARATION_FILE.test(path);
}

/**
 * Runs git in the project and returns what it printed.
 *
 * @param {string} projectRoot The repository's root.
 * @param {string[]} args git's arguments.
 * @returns {string}
 */
function git(projectRoot, args) {
  return execFileSync("git", ["-C", projectRoot, ...args], { encoding: "utf8" });
}
