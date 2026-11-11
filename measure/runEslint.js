import { ESLint } from "eslint";
import sonarjs from "eslint-plugin-sonarjs";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import { createFunctionRecorder, RECORDER_PLUGIN_NAME } from "./functionRecorder.js";

/**
 * Runs ESLint over files only to measure them: each measuring rule's maximum is 0, so it reports its value for every function
 * instead of only the ones over a limit. The measures use ESLint's and SonarSource's published definitions, so they mean the
 * same thing every time and in every project. The project's own ESLint config, if it has one, is ignored.
 */

/**
 * One measuring report from ESLint, with the file it is about.
 * @typedef {object} MeasureMessage
 * @property {string} file The file's absolute path.
 * @property {string} ruleId The rule that reported it, such as "complexity".
 * @property {string} message The rule's text, which holds the measured value.
 * @property {number} line Where it reports: the line, counted from 1.
 * @property {number} column The column, counted from 1 (ESLint's messages count columns from 1, its nodes from 0).
 */

/**
 * The rules that count unexplained knowledge: bare numbers and bitwise operators, each reported where it appears. They are a
 * prompt for the readability pass, not a judgment, so they have no threshold.
 *
 * Numbers that need no name are left out: 0, 1, -1 and 2 (halving is self-evident), array indexes, default parameter values, numbers given a name by an
 * object key (`{ radius: 6.2 }`), and TypeScript's numeric types, enums and readonly class fields. The TypeScript version of
 * the rule handles plain JavaScript too, so one rule serves every kind of file.
 */
const COUNTING_RULES = {
  "@typescript-eslint/no-magic-numbers": [
    "warn",
    {
      ignore: [0, 1, -1, 2],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true,
      detectObjects: false,
      ignoreNumericLiteralTypes: true,
      ignoreEnums: true,
      ignoreReadonlyClassProperties: true,
      ignoreTypeIndexes: true,
    },
  ],
  "no-bitwise": "warn",
};

/** Test files, where literal expected values are the specification, so the counting rules leave them out. */
const TEST_FILES = ["**/*.{test,spec}.{js,mjs,cjs,ts,mts}"];

/** The measuring rules, each with a maximum of 0 so that every function gets a report. */
const MEASURING_RULES = {
  "max-lines-per-function": ["warn", { max: 0, skipBlankLines: true, skipComments: true, IIFEs: true }],
  "sonarjs/cognitive-complexity": ["warn", 0],
  complexity: ["warn", 0],
  "max-depth": ["warn", 0],
  "max-params": ["warn", 0],
};

/**
 * Measures every function in the given files.
 *
 * @param {string} projectRoot The project the files belong to; ESLint runs from here.
 * @param {string[]} files The files' absolute paths (.js, .mjs, .cjs, .ts, .mts, .vue).
 * @returns {Promise<{ records: import("./functionRecorder.js").FunctionRecord[], messages: MeasureMessage[] }>}
 */
export async function runEslint(projectRoot, files) {
  const recorder = createFunctionRecorder();
  const overrideConfig = measuringConfig(recorder.plugin);
  const eslint = new ESLint({ cwd: projectRoot, overrideConfigFile: true, overrideConfig, ignore: false });
  const results = await eslint.lintFiles(files);
  const messages = results.flatMap((result) => messagesOf(result));
  return { records: recorder.records, messages };
}

/**
 * The flat ESLint config that measures: the rules for every kind of file, the counting rules for every file but tests, and
 * the parser each kind needs.
 *
 * @param {object} recorderPlugin The function recorder's plugin.
 * @returns {object[]}
 */
function measuringConfig(recorderPlugin) {
  const recordRule = `${RECORDER_PLUGIN_NAME}/record`;
  const rules = { ...MEASURING_RULES, [recordRule]: "warn" };
  const plugins = { sonarjs, "@typescript-eslint": tseslint.plugin, [RECORDER_PLUGIN_NAME]: recorderPlugin };
  return [
    { files: ["**/*.{js,mjs,cjs,ts,mts,vue}"], plugins, rules },
    { files: ["**/*.{js,mjs,cjs,ts,mts,vue}"], ignores: TEST_FILES, rules: COUNTING_RULES },
    { files: ["**/*.{ts,mts}"], languageOptions: { parser: tseslint.parser } },
    { files: ["**/*.vue"], languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser } } },
  ];
}

/**
 * One file's measuring reports. A file that could not be parsed stops the run, since its functions would silently go
 * unmeasured.
 *
 * @param {ESLint.LintResult} result ESLint's result for one file.
 * @returns {MeasureMessage[]}
 */
function messagesOf(result) {
  const parseError = result.messages.find((message) => message.fatal);
  if (parseError) throw new Error(`could not parse ${result.filePath}: ${parseError.message}`);

  const measures = result.messages.filter((message) => message.ruleId !== null);
  return measures.map((message) => ({
    file: result.filePath,
    ruleId: /** @type {string} */ (message.ruleId),
    message: message.message,
    line: message.line,
    column: message.column,
  }));
}
