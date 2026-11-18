# Coding standards (agent edition)

The short form of `~/repos/codingStandards/codingStandards.md`, for a coding agent's system prompt: the rules without the
reasoning. The full text is the source of truth; when a rule here is unclear, read it there (and `exemplars.md` beside it).

Goal: code Matt can read top to bottom in six months without opening anything else. Clear beats short.
Priority when rules conflict: readable > explicit > small functions > DRY > performance.

## Functions

- One task at one level of abstraction. If describing it needs "and" or "or", split it.
- Limits, as the measure tool reports them (see "Before presenting"): 20 lines of code, cognitive complexity 10 (its count
  of branches and loops, each weighted by how deeply it is nested), nesting depth 2, 3 parameters.
- Early returns, not nested ifs. No pass-through functions that only call another.
- Readability test: read the body skipping every call. If you must open a callee or work out an expression, name that
  step. It catches: nested calls doing real work, code inside a `case`, callbacks that mutate outside state, compound
  conditions, clever `reduce`/ternary/regex, raw math or string work in a function that orchestrates others.

## Names

Spelled out (`createExerciseDefinition`, not `createDef`); only `id` and the project's listed abbreviations. No single
letters except loop counters. Booleans are predicates (`isReady`, `hasFailed`). One name per concept.

## Comments

- Every file starts with a comment saying what it is for. Every function gets a JSDoc summary, private ones too.
- Exports also get `@param` and `@returns` with their meaning. Comment every non-obvious step and decision, with the why.
- Never narrate syntax. A comment that disagrees with the code is a bug.

## Explicit, and duplication

- No magic numbers or idioms: name them as constants, with a comment saying where they come from.
- Spell out defaults and edge cases.
- Leave look-alike code separate unless it is obviously one concept. No abstraction for hypothetical reuse.

## Failing loudly

Never swallow an error or fall back silently: a failure is reported where it happens, with what to do. Validate input
at the boundary. Anything that waits (a request, a subprocess, a test run) has a time limit. A check that could not run
says so. Test the failure paths.

## TypeScript

No `any` (use `unknown`, then narrow). No `enum`. Discriminated unions for several kinds of a thing. Exported functions
declare return types. `import type` for types. `!` only with a comment saying why. No top-level side effects.

## Tests

Every public function has tests that read as specifications. Cover edge cases, and test a bound at the bound itself.
Refactor only under a passing suite.

## Writing

- Only the plain hyphen (-): never en or em dashes, in code, comments, docs or commits.
- Labels in Title Case ("Add Client"), except a unit in brackets ("Work (sec)"); sentences (hints, errors, tooltips) in
  sentence case.
- Never write prose that speaks for Matt (blog posts, about page, service descriptions). Mark any draft as a placeholder.

## Interface

- On/off settings are switches. Content sits on cards, never loose on the page background.
- A destructive action wears the warning style and asks first; only the confirmation's button is the danger style.
- Public pages: WCAG 2.2 AA, theme tokens only, never hard-coded colours.

## Before presenting any code change, in this order

1. Format, typecheck and tests pass.
2. Measure every touched function: `node ~/repos/codingStandards/measure/measure.js <files>`. Never estimate.
3. Readability pass on each touched function. Refactor to these rules, then rerun the tests and remeasure.
4. Report: the largest measurements, anything over a limit and why it stays, what you refactored, open judgment calls.

## Commits

Imperative subject; a body of at most two short sentences (the what and the why). Refactors separate from behaviour
changes. No AI attribution. Never push or merge unless told to.
