# Coding Standards

These apply to every project; a project's CLAUDE.md adds only its specifics (commands, layers, abbreviations).
`exemplars.md` shows these rules on real code: when a rule is unclear, the exemplars are what it means.

## The goal

**Code that reads like prose to Matt, coming back to it in six months.** He should be able to read a function top to bottom
and know what it does and why, without opening anything else. When clear and short disagree, clear wins.

When standards conflict, the earlier wins: (1) reads like prose, (2) explicit, (3) small functions, (4) DRY only when the
abstraction is obviously right, (5) performance only where measured to matter.

## The readability test

**Read a function's body top to bottom, skipping every call. If you have to open a callee or stop to work out an expression,
the steps are not named at the right level.** It catches, among others:

- **Nested calls doing real work.** `if (isWithin(toPounds(weight, isMetric), RANGE))` becomes
  `const weightInPounds = toPounds(weight, isMetric); if (isWithin(weightInPounds, RANGE))`. Short obvious chains are fine.
- **Code inside a `case`.** A switch is a table of named handlers, one call per case.
- **Hidden state.** A `map`/`filter` callback that mutates outside state; use a `for…of` with the state named and commented.
- **A compound condition doing two jobs.** Name each part: `const closesOnSameLine = …; const loadsFromAnotherFile = …;`.
- **Cleverness**: a `reduce` that picks a winner, chained ternaries, a regex doing three jobs. Write the plain loop or named steps.
- **Raw detail in an orchestrating body** (math, string work, `user.address.city`, iteration): move it to a named helper below.

## Functions

- **One thing = one task at one level of abstraction.** A body made entirely of well-named calls is the goal, not a smell.
- **And/or test:** if the simplest description needs "and" or "or", split it. **Question test:** ask it a question named after
  it; "what is your tire?" means the tire belongs elsewhere.
- No pass-through middlemen. A "call" that is raw code in disguise (`db.query(...)`) is not a named step.
- **Deep, not shallow:** a small interface compared with what it does. Early returns over nested `if`s.

## Naming

- Name what a thing is or does, spelled out: `createExerciseDefinition`, not `createDef`. Abbreviations only `id` plus the
  project's whitelist, added one word at a time.
- No single letters except trivial loop counters. One name per concept per project.
- Booleans are predicates: `isLoadPR`, `hasFailed`, `canAdd`. Exported names together describe the module's responsibilities.

## Comments and JSDoc

- **Explain the what and why of steps and decisions; never narrate syntax.** Comment every non-trivial step and decision,
  especially surprising ones, including why the alternative wasn't taken.
- **Every function gets a JSDoc summary, private helpers included, and writing it tests the function:**
  - It just restates the name: good, keep it.
  - It adds a fact the name or signature could hold (format, unit, default): move the fact there (`dateToIsoString`, a default
    parameter).
  - It needs "and"/"or" or more than two sentences: the function does too much.
  - Worth writing: output examples ("Apr 5, 2026"), edge cases, the why behind non-obvious choices.
- Exports also get `@param` per parameter and `@returns` with its meaning ("undefined when the week has no plan"), never empty tags.
- Every file starts with a comment saying what it is for and how it fits with its neighbors.
- A comment that disagrees with its code is a bug.

## Explicit over implicit

- Prefer the spelled-out form whenever the short one requires the reader to know something. If the name and JSDoc don't tell
  what a function does, that is a design bug.
- Spell out defaults and edge cases.
- **Outside knowledge gets a name and a source.** Magic numbers, protocol constants, idioms (`>>> 0`, bit masks) and published
  algorithms become named constants or helpers whose comment says where they come from.

## Duplication

Duplication is far cheaper than the wrong abstraction (Metz).

- Look-alike code serving different purposes stays separate.
- Extract only when it is obviously one concept, with one name that fits every caller, changing for the same reason. A helper
  that needs a parameter saying which caller it serves fails this.
- No abstraction for hypothetical reuse: wait for the second real use.

## Modules and types

- One file, one concern (the same and/or and question tests). Exports are a small, documented contract.
- Composition over inheritance: plain data, factories, functions; classes only where a framework requires them.
- A unit knows just enough to do its job; dependencies point one way (layers are in the project's CLAUDE.md).

## TypeScript

- No `any` (use `unknown`, then narrow). No `enum` (`as const` arrays and unions).
- **Several kinds of a thing get a discriminated union** (a `kind` field, each kind its own exact fields), not optional fields
  and flags. liftingApp's `PlannedExercise` is the model.
- Exported functions declare return types. `import type` for type-only imports.
- `!` only where an invariant guarantees the value, with a comment saying why.
- No module top-level side effects beyond `const` definitions.
- Plain JavaScript that must run without a build is typed with JSDoc and checked with `checkJs`, same rules.

## Tests

- Every public function has tests; `describe`/`it` read as specifications.
- Pin down the why and the edge cases, not only the happy path. Refactor only under a passing suite.
- Test a documented bound at the bound itself, constructing the input that reaches it; random sampling does not test a bound.
- Run in tiers: format, typecheck and unit tests on every commit; the area's browser specs while working, the full suite
  before merging to `main`. CI is at most a nightly backstop, never a per-push gate. Commands are in the project's CLAUDE.md.

## Formatting

Prettier, in every JS/TS/Vue/CSS/JSON/Markdown project. Where it is missing, set it up: `printWidth` matched to the existing
code, `proseWrap: "preserve"`, `format` and `format:check` scripts, a CI check; the one-time reformat is its own commit.
Other languages get a formatter only when Matt asks.

## Writing

- **Only the plain hyphen (-)**, in code, comments, docs and commits: no en or em dashes. Use a colon, comma, parentheses or a
  new sentence.
- **Matt's writing is his.** Prose people would expect him to have written personally (blog posts, about page, service
  descriptions, quotes) is never LLM text: drafts are marked placeholders (liftingApp: `placeholderCopy()`; elsewhere an
  equivalent marker), never unmarked until he rewrites them. Interface text (labels, hints, errors, empty states,
  how-a-tool-works explanations) is written directly.

## Public-facing sites and apps

Private tools are exempt.

- **WCAG 2.2 AA**, verified with axe. Theme color tokens, never hard-coded colors; a contrast regression is a bug. Semantic
  HTML, labeled controls, fieldset + legend for groups, errors tied to fields and announced, keyboard + visible focus, focus
  moves on content change, correct autocomplete/inputmode, not color alone, reduced motion, real alt text.
- **Usability per Krug's "Don't Make Me Think"**: self-evident, scannable, obvious clicks, one main action per page, visible
  navigation, conventions over novelty. Check with the trunk test. Suggest copy cuts; the words stay Matt's.
- Accessibility or usability gaps in UI you touch are flagged, with fixes offered as cleanups.

## Code you touch

Bring touched code up to these standards, whoever wrote it. Small nearby cleanups go in their own behavior-neutral commit;
anything big, risky or needing a design decision is parked and raised.

## Review before presenting

Code is not finished when the tests pass. Before presenting any change that touches code (a commit proposal, a handoff, a
task's final report), in this order:

1. Format, typecheck and tests pass.
2. Measure every touched function with `node ~/repos/codingStandards/measure/measure.js` (see its README); never estimate.
   Thresholds: 20 lines of code (no blanks or comments), cognitive complexity 10, nesting depth 2, 3 parameters. Over a
   threshold is not automatically wrong, but never silent: refactor it or justify it in the report.
3. Readability pass: read each touched function as the readability test describes, checking Explicit over implicit and
   Duplication. A clean measure only means small, not readable; the `Magic` column (bare numbers, bitwise operators) shows
   where to look first.
4. Refactor to these standards, then rerun the tests and remeasure.
5. Report with the change: the largest measurements and anything over a threshold (with why it stays), the readability
   pass's findings, what was refactored and why, and open judgment calls.

A change with no code says so and skips the review.

## Commits

- Imperative subject; a body of at most two short sentences (the what and the why). Implementation detail belongs in the
  review's report, not the commit, and never details of Matt's machines, network or servers.
- Atomic: refactors separate from behavior changes.
- No AI attribution (Co-Authored-By or similar), in commits or pull requests.

## Sources

Ousterhout, _A Philosophy of Software Design_; Fowler, _Refactoring_; Metz, _Practical Object-Oriented Design_ and "The Wrong
Abstraction"; Martin, _Clean Code_; _The Zen of Python_.
