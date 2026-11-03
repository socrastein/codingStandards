import { functionName } from "./functionNames.js";

/**
 * An ESLint plugin that reports nothing and only records where every function is: its name, its head (where ESLint's own
 * rules report a function's measures) and its whole range (which the nesting depth reports fall inside). ESLint's rules say
 * how big a function is but not where it ends, so this fills that gap. Each recorder keeps its own list, so two runs never mix.
 */

/**
 * A line and column in a file, both counted the way ESLint's nodes count them: lines from 1, columns from 0.
 * @typedef {{ line: number, column: number }} Position
 */

/**
 * Where one function is in its file.
 * @typedef {object} FunctionRecord
 * @property {string} file The file's absolute path.
 * @property {string} name The function's name for the report (see functionNames.js).
 * @property {Position} start Where the function starts, including a method's name.
 * @property {Position} bodyStart Where its body starts; ESLint reports the function's measures between `start` and this.
 * @property {Position} end Where the function ends.
 */

/** The node types that are functions. */
const FUNCTION_TYPES = ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"];

/** The plugin's name, as the ESLint config refers to it ("functionRecorder/record"). */
export const RECORDER_PLUGIN_NAME = "functionRecorder";

/**
 * A new recorder: the plugin to give ESLint, and the list it fills while ESLint runs.
 *
 * @returns {{ plugin: object, records: FunctionRecord[] }}
 */
export function createFunctionRecorder() {
  /** @type {FunctionRecord[]} */
  const records = [];
  const recordRule = {
    meta: { type: "suggestion", schema: [] },
    create(/** @type {any} */ context) {
      const recordFunction = (/** @type {any} */ node) => records.push(recordOf(context.filename, node));
      return Object.fromEntries(FUNCTION_TYPES.map((type) => [type, recordFunction]));
    },
  };
  const plugin = { rules: { record: recordRule } };
  return { plugin, records };
}

/**
 * The record of one function node.
 *
 * @param {string} file The file it is in.
 * @param {any} node The function node, as ESLint gives it.
 * @returns {FunctionRecord}
 */
function recordOf(file, node) {
  const outerNode = isPropertyValue(node) ? node.parent : node;
  return {
    file,
    name: functionName(node),
    start: outerNode.loc.start,
    bodyStart: node.body.loc.start,
    end: node.loc.end,
  };
}

/** The nodes whose function value has its head start at the node's name (a method, getter, setter, or `key: () => …`). */
const PROPERTY_TYPES = ["Property", "MethodDefinition", "PropertyDefinition"];

/**
 * Whether a function is the value of a property, method, getter or setter. ESLint then starts the function's head (where it
 * reports the function's measures) at the property's name, before the function node itself.
 *
 * @param {any} node The function node.
 * @returns {boolean}
 */
function isPropertyValue(node) {
  const parentType = node.parent?.type;
  return PROPERTY_TYPES.includes(parentType);
}
