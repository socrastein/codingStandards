# Coding Standards

These apply to every project; a project's CLAUDE.md adds only its specifics (domain abbreviations, layers). Formatting is
Prettier's job. `exemplars.md` shows these rules on real code: when a rule is unclear, the exemplars are what it means.

## The goal

**Code that reads like prose to Matt, coming back to it in six months.** He should be able to read a function top to bottom
and know what it does and why, without opening anything else. Source is written for its reader; the build tools handle
efficiency. When clear and short disagree, clear wins.

## Priorities

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
- No pass-through middlemen that add nothing. A "call" that is raw code in disguise (`db.query(...)`) is not a named step.
- **Deep, not shallow:** a small interface compared with what it does.
- Early returns over nested `if`s.

## Naming

- Name what a thing is or does, spelled out: `createExerciseDefinition`, not `createDef`. Abbreviations only `id` plus the
  project's whitelist in its CLAUDE.md, added one word at a time deliberately.
- No single letters except trivial loop counters. One name per concept per project.
- Booleans are predicates: `isLoadPR`, `hasFailed`, `canAdd`. Exported names together describe the module's responsibilities.

## Comments and JSDoc

- **Explain the what and why of steps and decisions; never narrate syntax.** Comment every non-trivial step and every decision,
  especially surprising ones, including why the alternative wasn't taken. Six months from now, nothing is obvious.
- **Every function gets a JSDoc summary, private helpers included, and writing it tests the function:**
  - It just restates the name: good, keep it.
  - It adds a fact the name or signature could hold (format, unit, default): move the fact there (`dateToIsoString`, a default
    parameter).
  - It needs "and"/"or" or more than two sentences: the function does too much.
  - Worth writing: output examples ("Apr 5, 2026"), edge cases, the why behind non-obvious choices.
- Exports also get `@param` per parameter and `@returns` with its meaning ("undefined when the week has no plan"), never empty tags.
- Every file starts with a comment saying what it is for and how it fits with its neighbors.
- A comment that disagrees with its code is a bug: keep them in sync and flag mismatches.

## Explicit over implicit

- Prefer the spelled-out form whenever the short one requires the reader to know something.
- No hidden behavior: if the name and JSDoc don't tell what it does, that is a design bug.
- Spell out defaults and edge cases. Magic numbers become named constants with a comment on their source.
- Outside knowledge gets a name and a source. A constant, idiom or algorithm the reader can't work out from the code (a protocol
  constant, `>>> 0`, bit masks, a published algorithm) is named, and its comment says where it comes from.

## Duplication

Duplication is far cheaper than the wrong abstraction (Metz).

- Look-alike code serving different purposes stays separate.
- Extract only when it is obviously one concept, with one name that fits every caller, changing for the same reason. A helper
  that needs a parameter saying which caller it serves fails this.
- No abstraction for hypothetical reuse: wait for the second real use.

## Modules and types

- One file, one concern (same and/or and question tests). Exports are a small, documented contract.
- Composition over inheritance: plain data, factories, functions; classes only where a framework requires them.
- A unit knows just enough to do its job; dependencies point one way (layers listed in the project's CLAUDE.md).

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
- Test a documented bound at the bound itself, constructing the input that reaches it. Sampling random inputs does not test a
  bound.

## Measured

`measure/` checks every function a change touches (see its README). Thresholds: 20 lines of code (no blanks/comments),
cognitive complexity 10, nesting depth 2, 3 parameters. Over a threshold is not automatically wrong, but never silent: refactor
or justify it in the commit proposal. Its `Magic` column (bare numbers and bitwise operators) has no threshold: it shows the
readability pass where to look first.

## Code you touch

Bring touched code up to these standards, whoever wrote it. Small nearby cleanups go in their own behavior-neutral commit;
anything big, risky or needing a design decision is parked and raised.

## Sources

Ousterhout, _A Philosophy of Software Design_; Fowler, _Refactoring_; Metz, _Practical Object-Oriented Design_ and "The Wrong
Abstraction"; Martin, _Clean Code_; _The Zen of Python_.
