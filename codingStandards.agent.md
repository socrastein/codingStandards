# Coding standards (agent edition)

The short form of `~/repos/codingStandards/codingStandards.md`, for a coding agent's system prompt: the rules without the
reasoning. The full text is the source of truth; when a rule here is unclear, read it there (and `exemplars.md` beside it).

Goal: code Matt can read top to bottom in six months without opening anything else. Clear beats short.
Priority when rules conflict: readable > explicit > small functions > DRY > performance.
The reader: fluent in JS/TS, Vue, Node, SQL and Python, knows the business, has forgotten this code's decisions. Explain
decisions, business rules, outside knowledge and surprises; never the language, common idioms or what a name already says.

## Functions

- One task at one level of abstraction. If describing it needs "and" or "or", split it. Split only when the pieces get
  names that say more than their code; a short sequence that reads straight through stays together.
- Limits, as the measure tool reports them (see "Before presenting"): 20 lines of code, cognitive complexity 10 (its count
  of branches and loops, each weighted by how deeply it is nested), nesting depth 2, 3 parameters.
- Early returns, not nested ifs. No pass-through functions that only call another.
- Readability test: read the body skipping every call. If you must open a callee or work out an expression, name that
  step. It catches: nested calls doing real work, a `case` doing more than one short thing (a value or one call),
  callbacks that mutate outside state, a condition whose meaning isn't plain (a short comment on the `if`, or a name when
  used more than once), clever `reduce`/ternary/regex or a lookup object with `??` where a small `switch` reads plainer.

## Names

Spelled out (`createExerciseDefinition`, not `createDef`); only `id` and the project's listed abbreviations. No single
letters except loop counters. Booleans are predicates (`isReady`, `hasFailed`). One name per concept. A name says what
kind of thing it is (`isMarkedGapSlot`) and stays true for every value it can hold (`isTeen` for 11 to 13 is wrong).

## Comments

- Every file starts with a comment saying what it is for. Exported functions get a JSDoc with `@param` and `@returns`
  with their meaning. A private helper gets one only for an example, an edge case or the why; never one that restates
  the name or adds an unclear phrase.
- Comment every non-obvious step and decision, with the why, and behaviour that comes from outside the code (a browser
  convention, a protocol rule). Gloss uncommon APIs in a few words, never common ones.
- Never narrate syntax, never say what something is not called. A comment that disagrees with the code is a bug.

## Explicit, and duplication

- Outside knowledge (a protocol value, a tuning choice, a business rule, an idiom) gets a named constant with a comment
  saying where it comes from. A number plain from its line stays a number (`* 60` beside minutes, `404` in a response).
- Spell out defaults and edge cases.
- Leave look-alike code separate unless it is obviously one concept. No abstraction for hypothetical reuse.

## Failing loudly

Failures come from a person's input, files and saved data, the network and other programs, configuration, and time.
Between your own typed functions, trust the types.

- Check input once, at the boundary, with a message naming the field and the rule. On a public boundary, hostile input
  (NUL bytes, huge bodies, `../`) is normal use.
- Guard only what normal use can hit, or what is rare but serious (client data, money, sign-in). Rare and harmless: no
  code. An impossible case gets the shortest form the type checker accepts (`!` or `?? x`), never a throw or a test.
- Damaged or older saved data is contained: keep the original, set aside the smallest unreadable part, say so once,
  carry on.
- Never swallow an error that happens: it is reported where it happens, with what to do. Anything that waits has a time
  limit. A check that could not run says so. Test the failure paths that can happen.

## TypeScript

No `any` (use `unknown`, then narrow). No `enum`. Discriminated unions for several kinds of a thing. Exported functions
declare return types. `import type` for types. `!` only where an invariant guarantees it, with a comment unless the
reason is visible nearby. No top-level side effects.

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
- A search bar is the library's `SearchCard`: on a card, "Showing X of Y things" at its top, then the bar with a magnifying
  glass, "Search" placeholder, no visible label, and an x on the right to clear it.
- A destructive action wears the warning style and asks first; only the confirmation's button is the danger style.
- Public pages: WCAG 2.2 AA, theme tokens only, never hard-coded colours.

## Before presenting any code change, in this order

1. Format, typecheck and tests pass.
2. Measure every touched function: `node ~/repos/codingStandards/measure/measure.js <files>`. Never estimate.
3. Readability pass on each touched function. Refactor to these rules, then rerun the tests and remeasure. Never split
   code into something harder to read just to meet a limit.
4. Report: the largest measurements, anything over a limit and why it stays, what you refactored, open judgment calls.

## Commits

Imperative subject; a body of at most two short sentences (the what and the why). Refactors separate from behaviour
changes. No AI attribution. Never push or merge unless told to.
