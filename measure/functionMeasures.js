/**
 * Puts ESLint's measuring reports together into one row per function: each report is matched to the function it is about,
 * and its value read out of the rule's text. A function's own measures are reported at its head (between its start and its
 * body); a nesting depth is reported at the nested block, and each magic number or bitwise operator where it appears, so
 * those belong to the innermost function around them.
 */

/** @typedef {import("./functionRecorder.js").FunctionRecord} FunctionRecord */
/** @typedef {import("./functionRecorder.js").Position} Position */
/** @typedef {import("./runEslint.js").MeasureMessage} MeasureMessage */

/**
 * Every measure of one function.
 * @typedef {object} FunctionMeasures
 * @property {FunctionRecord} record Where the function is.
 * @property {number} lines Lines of code in it, without blank lines and comments.
 * @property {number} cognitive Its cognitive complexity.
 * @property {number} cyclomatic Its cyclomatic complexity.
 * @property {number} depth The deepest nesting of blocks in it (0 for none).
 * @property {number} params How many parameters it takes.
 * @property {number} magic How many bare numbers and bitwise operators it uses: a prompt for the readability pass.
 */

/** @typedef {"lines" | "cognitive" | "cyclomatic" | "params"} HeadMeasure The measures ESLint reports at a function's head. */

/** Which measure each rule reports at a function's head, and how to read the value out of its text. */
const HEAD_RULES = /** @type {const} */ ({
  "max-lines-per-function": { measure: "lines", pattern: /too many lines \((\d+)\)/ },
  "sonarjs/cognitive-complexity": { measure: "cognitive", pattern: /from (\d+) to/ },
  complexity: { measure: "cyclomatic", pattern: /complexity of (\d+)/ },
  "max-params": { measure: "params", pattern: /too many parameters \((\d+)\)/ },
});

/** The rules whose every report counts once toward the Magic count of the function it appears in. */
const MAGIC_RULES = ["@typescript-eslint/no-magic-numbers", "no-bitwise"];

/** How to read the depth out of max-depth's text. */
const DEPTH_PATTERN = /nested too deeply \((\d+)\)/;

/**
 * One row of measures per recorded function. A measure with no report is 0: the rules report nothing for a function with no
 * parameters, no nesting or no cognitive complexity.
 *
 * @param {FunctionRecord[]} records Where every function is.
 * @param {MeasureMessage[]} messages ESLint's measuring reports.
 * @returns {FunctionMeasures[]}
 */
export function measureFunctions(records, messages) {
  const rows = records.map((record) => ({ record, lines: 0, cognitive: 0, cyclomatic: 0, depth: 0, params: 0, magic: 0 }));
  for (const message of messages) {
    addMessage(rows, message);
  }
  return rows;
}

/**
 * Adds one report's value to the row of the function it is about.
 *
 * @param {FunctionMeasures[]} rows Every function's row.
 * @param {MeasureMessage} message The report.
 */
function addMessage(rows, message) {
  const sameFileRows = rows.filter((row) => row.record.file === message.file);
  const isDepthReport = message.ruleId === "max-depth";
  const isMagicReport = MAGIC_RULES.includes(message.ruleId);
  if (isDepthReport) addDepth(sameFileRows, message);
  else if (isMagicReport) addMagic(sameFileRows, message);
  else addHeadMeasure(sameFileRows, message);
}

/**
 * Counts one magic number or bitwise operator toward the innermost function around it. One outside every function (at the
 * module's top level) belongs to no row and is left out.
 *
 * @param {FunctionMeasures[]} rows The functions of the report's file.
 * @param {MeasureMessage} message A no-magic-numbers or no-bitwise report, made where the number or operator is.
 */
function addMagic(rows, message) {
  const row = innermostAround(rows, positionOf(message));
  if (row) row.magic += 1;
}

/**
 * Raises the depth of the innermost function around a nested block to that block's depth, if it is deeper than any before.
 *
 * @param {FunctionMeasures[]} rows The functions of the report's file.
 * @param {MeasureMessage} message A max-depth report, made at the nested block.
 */
function addDepth(rows, message) {
  const position = positionOf(message);
  const row = innermostAround(rows, position);
  if (!row) return;
  const depth = valueIn(message.message, DEPTH_PATTERN);
  row.depth = Math.max(row.depth, depth);
}

/**
 * Sets the measure a head report gives (lines, cognitive or cyclomatic complexity, parameters) on the function whose head it
 * is made at. A report from a rule that is not a measuring rule is left out.
 *
 * @param {FunctionMeasures[]} rows The functions of the report's file.
 * @param {MeasureMessage} message The report.
 */
function addHeadMeasure(rows, message) {
  const headRule = HEAD_RULES[/** @type {keyof typeof HEAD_RULES} */ (message.ruleId)];
  if (!headRule) return;
  const position = positionOf(message);
  const row = rows.find((candidate) => isInHead(candidate.record, position));
  if (!row) return;
  row[headRule.measure] = valueIn(message.message, headRule.pattern);
}

/**
 * Whether a position is in a function's head: from its start up to its body, where ESLint reports the function's measures.
 * Heads never overlap, so a position is in at most one.
 *
 * @param {FunctionRecord} record The function.
 * @param {Position} position The report's position.
 * @returns {boolean}
 */
function isInHead(record, position) {
  const isAfterStart = !isBefore(position, record.start);
  const isBeforeBody = isBefore(position, record.bodyStart);
  return isAfterStart && isBeforeBody;
}

/**
 * The innermost function around a position: of the functions that contain it, the one that starts last.
 *
 * @param {FunctionMeasures[]} rows The functions of the report's file.
 * @param {Position} position The report's position.
 * @returns {FunctionMeasures | undefined}
 */
function innermostAround(rows, position) {
  const around = rows.filter((row) => contains(row.record, position));
  /** @type {FunctionMeasures | undefined} */
  let innermost;
  for (const row of around) {
    const startsLater = innermost === undefined || isBefore(innermost.record.start, row.record.start);
    if (startsLater) innermost = row;
  }
  return innermost;
}

/**
 * Whether a position is anywhere inside a function, from its start to its end.
 *
 * @param {FunctionRecord} record The function.
 * @param {Position} position The position.
 * @returns {boolean}
 */
function contains(record, position) {
  const isAfterStart = !isBefore(position, record.start);
  const isBeforeEnd = !isBefore(record.end, position);
  return isAfterStart && isBeforeEnd;
}

/**
 * Whether one position comes before another in the file.
 *
 * @param {Position} first
 * @param {Position} second
 * @returns {boolean}
 */
function isBefore(first, second) {
  if (first.line !== second.line) return first.line < second.line;
  return first.column < second.column;
}

/**
 * A report's position, with its column counted from 0 like the nodes' (ESLint's messages count from 1).
 *
 * @param {MeasureMessage} message The report.
 * @returns {Position}
 */
function positionOf(message) {
  return { line: message.line, column: message.column - 1 };
}

/**
 * The number a rule's text holds, such as 21 in "has too many lines (21)".
 *
 * @param {string} text The rule's text.
 * @param {RegExp} pattern Where the number is, as the pattern's first group.
 * @returns {number}
 */
function valueIn(text, pattern) {
  const match = pattern.exec(text);
  if (!match?.[1]) throw new Error(`no measured value in "${text}"`);
  return Number(match[1]);
}
