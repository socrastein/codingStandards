# Coding Standards

These apply to every project; a project's CLAUDE.md adds only its specifics (commands, layers, abbreviations).
`exemplars.md` shows these rules on real code: when a rule is unclear, the exemplars are what it means.

## The goal

**Code that reads like prose to Matt, coming back to it in six months.** He should be able to read a function top to bottom
and know what it does and why, without opening anything else. When clear and short disagree, clear wins.

**The reader is Matt in six months:** fluent in JS/TS, Vue, Node, SQL and Python, knows the business, has forgotten this
code's decisions. Write for that reader, no lower. Explain what he doesn't know (decisions, business rules, outside
knowledge, surprises), never what he does (the language, the standard library, common idioms, what a name already says).

When standards conflict, the earlier wins: (1) reads like prose, (2) explicit, (3) small functions, (4) DRY only when the
abstraction is obviously right, (5) performance only where measured to matter.

## The readability test

**Read a function's body top to bottom, skipping every call. If you have to open a callee or stop to work out an expression,
the steps are not named at the right level.** It catches, among others:

- **Nested calls doing real work.** `if (isWithin(toPounds(weight, isMetric), RANGE))` becomes
  `const weightInPounds = toPounds(weight, isMetric); if (isWithin(weightInPounds, RANGE))`. Short obvious chains are fine.
- **A `case` does one short thing** (a value or one call); more than that becomes a named handler.
- **Hidden state.** A `map`/`filter` callback that mutates outside state; use a `for…of` with the state named and commented.
- **A condition whose meaning isn't plain** gets a short comment on its `if`, or a name when it's used more than once. A
  name must be true in its context: `isTeen` for 11 to 13 is wrong, because 14 is a teen too.
- **Cleverness**: a `reduce` that picks a winner, chained ternaries, a regex doing three jobs, a lookup object with a `??`
  fallback where a small `switch` reads plainer. Write the plain version.
- **Raw detail in an orchestrating body** (math, string work, `user.address.city`, iteration) moves to a named helper below
  when the helper's name says more than its code.

## Functions

- **One thing = one task at one level of abstraction.** Split when the pieces get names that say more than their code. A
  short sequence that reads straight through stays together.
- **And/or test:** if the simplest description needs "and" or "or", split it. **Question test:** ask it a question named after
  it; "what is your tire?" means the tire belongs elsewhere.
- No pass-through middlemen. A "call" that is raw code in disguise (`db.query(...)`) is not a named step.
- **Deep, not shallow:** a small interface compared with what it does. Early returns over nested `if`s.

## Naming

- Name what a thing is or does, spelled out: `createExerciseDefinition`, not `createDef`. Abbreviations only `id` plus the
  project's whitelist, added one word at a time.
- No single letters except trivial loop counters. One name per concept per project.
- Booleans are predicates: `isLoadPR`, `hasFailed`, `canAdd`. Exported names together describe the module's responsibilities.
- A name says what kind of thing it is (`isMarkedGapSlot`, not `isMarkedGap`) and must stay true for every value it can hold.

## Comments and JSDoc

- **Explain the what and why of steps and decisions; never narrate syntax.** Comment every non-trivial step and decision,
  especially surprising ones, including why the alternative wasn't taken.
- **Exported functions get a JSDoc** with `@param` per parameter and `@returns` with its meaning ("undefined when the week
  has no plan"), never empty tags: they are the module's contract. A private helper gets one only when it adds something the
  name can't: an example ("Apr 5, 2026"), an edge case, the why. A JSDoc that restates the name is deleted. One that adds an
  unclear phrase is worse than none.
- Writing a JSDoc tests the function: a fact the name or signature could hold (format, unit, default) moves there
  (`dateToIsoString`, a default parameter); a summary that needs "and"/"or" or more than two sentences means the function
  does too much.
- **Explain behaviour that comes from outside the code** (a browser convention, a protocol rule), even when the code is one
  line: `event.button !== 0` gets "leave modified and non-left clicks to the browser". Gloss uncommon APIs in a few words
  (`relatedTarget`: where focus goes next), never common ones.
- Examples of accepted and rejected input are worth a line.
- No comments about what something is _not_ called, or why.
- Every file starts with a comment saying what it is for and how it fits with its neighbors.
- A comment that disagrees with its code is a bug.

## Explicit over implicit

- Prefer the spelled-out form whenever the short one requires the reader to know something he doesn't. If the name and JSDoc don't tell
  what a function does, that is a design bug.
- Spell out defaults and edge cases.
- **Outside knowledge gets a name and a source:** a protocol value, a tuning choice, a business rule, an idiom (`>>> 0`, bit
  masks), a published algorithm. **A number whose meaning is plain from its line stays a number:** `* 60` beside minutes,
  `% 10` for a last digit, `404` next to a response.

## Failing loudly

**A failure nobody sees is worse than a crash, and a guard against a failure that cannot happen is complexity for nothing.**
Design so that when something goes wrong, the code says so, close to where it went wrong, in words that say what to do.

- **Failures come from:** a person's input, files and saved data, the network and other programs, configuration, and time
  (timeouts, races). Between your own typed functions, trust the types.
- **Check at the boundary, once.** Refuse bad input where it enters, with a message naming the field and the rule. Don't
  re-check inside what the boundary or the types already guarantee.
- **Weigh a guard by likelihood and harm.** If normal use hits it, handle it loudly. If it's rare but the harm is serious
  (client data lost or misattributed, money, sign-in), guard it anyway. If it's rare and harmless, write no code.
- **On a public boundary, hostile input is normal use.** Bots send NUL bytes, huge bodies and `../`: a public API checks
  for them.
- **An impossible case gets the shortest code the type checker accepts** (`!`, or `?? x`), never a throw or a test.
- **Damaged or older saved data is contained, not fatal:** keep the original, set aside the smallest part that can't be
  read, say so once, carry on. (The details wait for the sync design.)
- **Never swallow an error that happens.** No empty `catch`, and no `catch` that only logs and carries on as if it had
  worked. Catch what you can handle; let the rest travel.
- **Anything that waits has a limit.** A request, a subprocess, a lock, a poll: each has a timeout, and reaching it is
  reported as a failure.
- **Silence is not success.** A check that could not run says it did not run. A script reports what it did and exits
  non-zero when it did not do it.
- **Staying up is not the same as hiding it.** A service may log, retry and keep serving, but the failure must surface
  where someone will look: a status field, an alert, a non-zero exit.
- **Prefer designs with fewer ways to fail** (Ousterhout: define errors out of existence). Fewer cases, each one loud.
- **Test the failure paths that can happen:** the refused input, the timeout, the missing file, and the message each one
  gives.

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
- `!` only where an invariant guarantees the value; a comment says why only when the reason isn't visible in the
  surrounding lines.
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
  how-a-tool-works explanations) is written directly. Small spelling and grammar corrections to his prose are fine
  without asking; list each one in the report so he can confirm it.
- **Labels in Title Case**: buttons, menu items, switches, field labels, legends and headings ("Add Client", "Delete Set",
  "Sign In with Google"; short words like a, and, of, to, with stay lower case mid-label; a unit in brackets keeps its own
  case: "Work (sec)", "Weight (kg)"). Sentences stay sentence case: hints, errors, confirm questions, tooltips, status
  lines, and the choices inside a drop-down or radio group.

## Interface controls

Every project, private tools included.

- **On/off settings are switches, never a lone checkbox.** Checkboxes are for choosing several from a list (weeks,
  muscles), where each is one of a set.
- **Content sits on cards, never loose on the page background.** A page is a column of cards: every block of content (a
  section of prose, a form, a list, a table, a set of facts) sits on a card or the library's equivalent raised surface. Only
  the page title, one line of intro or status under it, and standalone actions or links sit directly on the background.
  Sub-sections inside a card use the library's layering (inner cards or panels), never just a heading over more loose text.
  A card of text has padding. Check a screenshot at phone and desktop width: if a paragraph, list or table touches the page
  background, it needs a card.
- **Destructive actions always ask first, in two colours.** A button that starts something that deletes, removes, signs out
  or otherwise ends something wears the library's warning style (orange) and opens a confirmation. The confirmation's button
  wears the danger style (red) and is the only place red appears on a button. A confirmation of something harmless (send,
  copy, apply) uses the primary style. One exception to asking: removing something inside a form that is not saved yet,
  which Cancel would discard anyway, is one click, and still wears the warning style. The label carries the meaning; colour
  is never the only cue.

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
   threshold is not automatically wrong, but never silent: refactor it or justify it in the report. A split that makes the
   code harder to read is not the fix for a threshold.
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
Abstraction"; Martin, _Clean Code_; Hunt and Thomas, _The Pragmatic Programmer_; Shore, "Fail Fast"; _The Zen of Python_.
