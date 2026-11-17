/**
 * The measures as a JSON document for another tool to read: an array with one object per measured function, in the same
 * order the table uses (hardest first). The field names are spelled out because a different project reads them, so they
 * are a promise, not a detail.
 */

import { relative, sep } from "node:path";
import { hardestFirst } from "./report.js";
import { THRESHOLDS } from "./thresholds.js";

/** @typedef {import("./functionMeasures.js").FunctionMeasures} FunctionMeasures */

/**
 * The report for a set of measured functions, as one JSON document.
 *
 * @param {FunctionMeasures[]} measures The functions to report.
 * @param {string} projectRoot Files' paths are written relative to this folder.
 * @returns {string} The JSON document, or "[]" when there is nothing to measure.
 */
export function formatJsonReport(measures, projectRoot) {
  const rows = measures.toSorted(hardestFirst).map((measure) => rowOf(measure, projectRoot));
  return JSON.stringify(rows, null, 2);
}

/**
 * One measured function's object, with exactly the fields the reader expects: its name and place, each measure under its
 * JSON name, and the measures that are over their thresholds.
 *
 * @param {FunctionMeasures} measure The function.
 * @param {string} projectRoot Files' paths are written relative to this folder.
 * @returns {object}
 */
function rowOf(measure, projectRoot) {
  const { record } = measure;
  return {
    name: record.name,
    file: relativePath(record.file, projectRoot),
    startLine: record.start.line,
    startColumn: record.start.column,
    endLine: record.end.line,
    endColumn: record.end.column,
    linesOfCode: measure.lines,
    cognitiveComplexity: measure.cognitive,
    cyclomaticComplexity: measure.cyclomatic,
    nestingDepth: measure.depth,
    parameterCount: measure.params,
    magicCount: measure.magic,
    overThreshold: overThreshold(measure),
  };
}

/**
 * A file's path relative to the project root, with forward slashes (the platform's own separator would not be portable).
 *
 * @param {string} file The file's absolute path.
 * @param {string} projectRoot The project's folder.
 * @returns {string}
 */
function relativePath(file, projectRoot) {
  return relative(projectRoot, file).split(sep).join("/");
}

/**
 * The names, from the JSON's field list, of the measures that are over their thresholds in thresholds.js (empty when none
 * are). Cyclomatic complexity and the Magic count have no threshold, so they never appear.
 *
 * @param {FunctionMeasures} measure The function.
 * @returns {string[]}
 */
function overThreshold(measure) {
  /** @type {string[]} */
  const over = [];
  if (measure.lines > THRESHOLDS.lines) over.push("linesOfCode");
  if (measure.cognitive > THRESHOLDS.cognitive) over.push("cognitiveComplexity");
  if (measure.depth > THRESHOLDS.depth) over.push("nestingDepth");
  if (measure.params > THRESHOLDS.params) over.push("parameterCount");
  return over;
}
