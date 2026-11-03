/**
 * The thresholds of the code review gate: the most a function may have of each measure before it must be refactored or its
 * size justified in the commit proposal. A value over its threshold is not automatically wrong, but it is never let through
 * silently. Cyclomatic complexity is reported for information only; cognitive complexity is the one that judges readability.
 */

/** @typedef {"lines" | "cognitive" | "depth" | "params"} ThresholdName The measures that have a threshold. */

/** @type {Record<ThresholdName, number>} */
export const THRESHOLDS = {
  // Lines of code in the function's body, not counting blank lines or comments (so thorough comments never cost anything)
  lines: 20,
  // SonarSource's cognitive complexity: how hard the function is to follow, charging extra for every level of nesting
  cognitive: 10,
  // The deepest nesting of blocks (if, for, while, switch, try) inside the function
  depth: 2,
  // How many parameters the function takes
  params: 3,
};
