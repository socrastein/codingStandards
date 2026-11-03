import { relative } from "node:path";
import { THRESHOLDS } from "./thresholds.js";

/**
 * The measures as a table for the terminal (and for a commit proposal): one row per function, the hardest to read first, with
 * every value over its threshold marked with "!", and a closing line that counts them.
 */

/** @typedef {import("./functionMeasures.js").FunctionMeasures} FunctionMeasures */
/** @typedef {import("./thresholds.js").ThresholdName} ThresholdName */

/** The table's columns, in order: the heading, and how to get each cell from a row. */
const COLUMNS = [
  { heading: "Function", cell: (/** @type {Row} */ row) => row.record.name },
  { heading: "Where", cell: (/** @type {Row} */ row) => row.where },
  { heading: "Lines", cell: (/** @type {Row} */ row) => measureCell(row, "lines") },
  { heading: "Cognitive", cell: (/** @type {Row} */ row) => measureCell(row, "cognitive") },
  { heading: "Cyclomatic", cell: (/** @type {Row} */ row) => String(row.cyclomatic) },
  { heading: "Depth", cell: (/** @type {Row} */ row) => measureCell(row, "depth") },
  { heading: "Params", cell: (/** @type {Row} */ row) => measureCell(row, "params") },
];

/** @typedef {FunctionMeasures & { where: string }} Row A function's measures with its place written for the table. */

/**
 * The report for a set of measured functions.
 *
 * @param {FunctionMeasures[]} measures The functions to report.
 * @param {string} projectRoot Paths in the table are written relative to this folder.
 * @returns {string} The table and its closing line, or a line saying there was nothing to measure.
 */
export function formatReport(measures, projectRoot) {
  if (measures.length === 0) return "No changed functions to measure.";

  const rows = measures.map((measure) => ({ ...measure, where: placeOf(measure, projectRoot) }));
  const sortedRows = rows.toSorted(hardestFirst);
  const table = formatTable(sortedRows);
  const summary = summaryLine(sortedRows);
  return `${table}\n\n${summary}`;
}

/**
 * The rows as aligned columns, under a heading row and a rule.
 *
 * @param {Row[]} rows The rows, in order.
 * @returns {string}
 */
function formatTable(rows) {
  const headings = COLUMNS.map((column) => column.heading);
  const cells = rows.map((row) => COLUMNS.map((column) => column.cell(row)));
  const widths = columnWidths(headings, cells);
  const rule = widths.map((width) => "-".repeat(width));
  const lines = [headings, rule, ...cells].map((cellRow) => alignedLine(cellRow, widths));
  return lines.join("\n");
}

/**
 * Each column's width: that of its widest cell or its heading, whichever is wider.
 *
 * @param {string[]} headings The column headings.
 * @param {string[][]} cells The body's cells, row by row.
 * @returns {number[]}
 */
function columnWidths(headings, cells) {
  return headings.map((heading, index) => {
    const cellLengths = cells.map((cellRow) => cellRow[index]?.length ?? 0);
    return Math.max(heading.length, ...cellLengths);
  });
}

/**
 * One line of the table: each cell padded to its column's width, names and places to the left, numbers to the right.
 *
 * @param {string[]} cellRow The line's cells.
 * @param {number[]} widths Each column's width.
 * @returns {string}
 */
function alignedLine(cellRow, widths) {
  const padded = cellRow.map((cell, index) => {
    const width = widths[index] ?? 0;
    const isTextColumn = index < 2;
    return isTextColumn ? cell.padEnd(width) : cell.padStart(width);
  });
  return padded.join("  ").trimEnd();
}

/**
 * A measure's cell: its value, with "!" when it is over its threshold.
 *
 * @param {Row} row The function.
 * @param {ThresholdName} measure Which measure.
 * @returns {string}
 */
function measureCell(row, measure) {
  const value = row[measure];
  const isOver = value > THRESHOLDS[measure];
  return isOver ? `${value}!` : String(value);
}

/**
 * The closing line: the thresholds, and how many functions are over one of them.
 *
 * @param {Row[]} rows Every reported function.
 * @returns {string}
 */
function summaryLine(rows) {
  const overCount = rows.filter(isOverAnyThreshold).length;
  const thresholds = Object.entries(THRESHOLDS).map(([name, value]) => `${name} ${value}`);
  const counts = `${rows.length} function(s), ${overCount} over a threshold`;
  return `${counts} (thresholds: ${thresholds.join(", ")}; "!" marks a value over its threshold).`;
}

/**
 * Whether any of a function's measures is over its threshold.
 *
 * @param {Row} row The function.
 * @returns {boolean}
 */
function isOverAnyThreshold(row) {
  const names = /** @type {ThresholdName[]} */ (Object.keys(THRESHOLDS));
  return names.some((name) => row[name] > THRESHOLDS[name]);
}

/**
 * The order of the table: the most cognitively complex first, and of equal ones the longest.
 *
 * @param {Row} first
 * @param {Row} second
 * @returns {number}
 */
function hardestFirst(first, second) {
  const byCognitive = second.cognitive - first.cognitive;
  return byCognitive !== 0 ? byCognitive : second.lines - first.lines;
}

/**
 * Where a function is, as "path:line", relative to the project.
 *
 * @param {FunctionMeasures} measure The function.
 * @param {string} projectRoot The project's folder.
 * @returns {string}
 */
function placeOf(measure, projectRoot) {
  const path = relative(projectRoot, measure.record.file);
  return `${path}:${measure.record.start.line}`;
}
