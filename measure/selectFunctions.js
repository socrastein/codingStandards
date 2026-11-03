/**
 * Picks the functions the code review gate looks at: those that a change touches. A function counts as touched when any
 * changed line falls between its first and last line, so an outer function counts when a callback inside it changed.
 *
 * A test file's `describe` callbacks are left out: they only group tests, so their length is how many tests they hold, not
 * how hard anything is to read. The tests inside them (`it` and `test` callbacks) are measured like any other function.
 */

/** @typedef {import("./functionMeasures.js").FunctionMeasures} FunctionMeasures */
/** @typedef {import("./changedLines.js").ChangedLines} ChangedLines */

/** The names functionNames.js gives a test file's grouping callbacks. */
const TEST_GROUP_NAMES = ["describe callback"];

/**
 * The functions that the changes touch, apart from a test file's groups.
 *
 * @param {FunctionMeasures[]} rows Every measured function.
 * @param {ChangedLines} changes The changed lines by file.
 * @returns {FunctionMeasures[]}
 */
export function touchedFunctions(rows, changes) {
  return rows.filter((row) => {
    const isTestGroup = TEST_GROUP_NAMES.includes(row.record.name);
    const fileChanges = changes.get(row.record.file);
    return !isTestGroup && isTouched(row, fileChanges);
  });
}

/**
 * Whether one function is touched by its file's changes.
 *
 * @param {FunctionMeasures} row The function.
 * @param {number[] | "all" | undefined} changedLines Its file's changed lines; "all" for a new file, undefined for none.
 * @returns {boolean}
 */
function isTouched(row, changedLines) {
  if (changedLines === undefined) return false;
  if (changedLines === "all") return true;
  const { start, end } = row.record;
  return changedLines.some((line) => line >= start.line && line <= end.line);
}
