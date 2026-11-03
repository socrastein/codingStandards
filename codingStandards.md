# Coding Standards

These apply to every project. A project's own CLAUDE.md adds only what is specific to it (domain abbreviations, its layers).
Formatting is Prettier's job and is not covered here.

## The goal

**Code that reads like prose to the person who comes back to it in six months.** That reader is Matt, and he would rather
read a clear summary than parse code. He should be able to read a function top to bottom and know what it does and why,
without opening anything else and without reconstructing context. Every rule below is a way of getting there.

Source code is written for its reader, not for the machine. Vite and the other build tools already turn it into condensed,
efficient output, so the source has no reason to be clever or terse. When clear and short disagree, clear wins.

## Priorities

When two standards pull in different directions, the earlier one wins:

1. **Reads like prose**: the readability test below passes.
2. **Explicit**: nothing has to be known or inferred; defaults, edge cases and intent are spelled out.
3. **Small functions**: within the thresholds (see Measured).
4. **DRY**: only when the shared abstraction is obviously right (see Duplication).
5. **Performance**: only where it is measured to matter.

## The readability test

**Read a function's body top to bottom and skip every call it makes. If you have to open a callee, or stop and work out what
an expression does, the steps are not named at the right level.**

This is the principle behind most of the rules below, and it covers shapes no rule lists. Some of what it catches:

- **A call nested as another call's argument.** `if (isWithin(toPounds(weight, isMetric), RANGE))` makes the reader evaluate
  inside out. Name each step: `const weightInPounds = toPounds(weight, isMetric); if (isWithin(weightInPounds, RANGE))`. Short
  obvious chains (`value.trim()`) are fine; a call that does real work, or a lambda wrapping another call, gets a name.
- **Code inside a `case`.** A switch should read as a table of named handlers: `case 'cardio': return cardioSummary(placement)`,
  one call per case, never a block of code.
- **Hidden state.** A `map` or `filter` callback that changes a variable outside itself looks like each item is handled on its
  own when it is not. A loop that carries state should look like one: a `for…of` with the state named and commented.
- **A compound condition doing two jobs.** `!/<\/style>/.test(line) && !/\bsrc=/.test(line)` hides two different cases. Name
  each: `const closesOnSameLine = …; const loadsFromAnotherFile = …;`.
- **Cleverness.** A `reduce` that picks a winner, a chained ternary, a regex doing three jobs, an object literal full of computed
  calls: if a plain loop or a few named steps say the same thing, write those.
- **Raw detail in an orchestrating body.** Math, string manipulation, drilling into data (`user.address.city`) or iterating over
  data belongs in a well-named helper below, so the body stays at one level.

## Functions

_Clean Code_ ch. 3; Ousterhout (deep modules, one level of abstraction); POODR (single responsibility).

- **"One thing" means one task at one level of abstraction**, not one operation. A body that is entirely well-named calls is the
  goal, not a smell: `loadUserData()` calling `loadUserSettings()`, `loadUserHistory()`, `loadUserProfile()` reads top to bottom,
  big picture first, details below. Some readers flag "a function that only calls functions"; this is deliberate.
- **The and/or test** (POODR): if the simplest description of what it does needs "and" or "or", it does too much.
- **The question test** (POODR): imagine it is sentient and ask it a question named after it. "What is your ratio?" is
  reasonable; "what is your tire?" is not: the tire belongs to a Wheel.
- An all-calls function is still wrong when its name fails the and/or test, when a "step" is raw code in disguise
  (`db.query(...)`), or when it is a pass-through that adds nothing (Fowler's _Middle Man_: delete it).
- **Deep, not shallow** (Ousterhout): a function or module's interface should be small compared with what it does. Hide the
  details; expose the intent.
- **Prefer early returns** over nested `if`s.

## Naming

_Clean Code_ ch. 2; _Refactoring_ (renaming is a refactoring); POODR (Transparent).

- Name what a thing **is** or **does**: `createExerciseDefinition`, not `createDef`. Long and clear beats short and cryptic.
- Spell words out. Abbreviations only from the whitelist: `id`, plus a project's domain units and vocabulary listed in its own
  CLAUDE.md (liftingApp: `kg`, `lbs`, `pr`). Add to a whitelist deliberately, one word at a time.
- Searchable names: no single letters except trivial loop counters.
- One name per concept across a project; no synonyms.
- Booleans read as predicates: `isLoadPR`, `hasFailed`, `canAdd`, `shouldRetry`.
- Exported functions read as a description of the module's responsibilities (POODR).

## Comments and JSDoc

_Clean Code_ ch. 4; Ousterhout (comments describe what the code cannot).

- **Explain the what and the why at the level of steps and decisions; never narrate syntax.** "Skips node_modules, whose files
  are installed rather than written here" is a good comment; `// loop over the entries` is narration.
- **Be thorough, including the "obvious"**: a step that is obvious today is not obvious in six months. Comment every
  non-trivial step and every decision, especially a surprising one, and say why the alternative was not taken.
- **Every function gets a JSDoc summary, private helpers included, and writing it is a test of the function:**
  - If it only restates the name in a sentence or two, the function is right. Keep it; the redundancy is the proof.
  - If it adds a fact the name or signature could hold (a format, a unit, a default), move the fact there: a `dateToString`
    that returns ISO becomes `dateToIsoString`, and "uses today if no date is given" becomes a default parameter.
  - If describing what it does needs "and" or "or", or more than two sentences, the function does too much: split it.
  - What a name can never hold is what is most worth writing: an example of the output ("Apr 5, 2026"), an edge case
    ("January 31 plus one month is February 28"), and the why behind a non-obvious choice.

  Exported functions also get `@param` for each parameter and `@returns` with its meaning, not just its type ("undefined when
  the week has no plan", not "number | undefined"). A tag with nothing to say is left out rather than left empty. An export's
  JSDoc is its interface: what it does, without opening it.

- **Every file starts with a comment** saying what it is for and how it fits with the files around it.
- **Keep comments in sync** when editing code, and flag any mismatch noticed. A comment that disagrees with its code is a bug.

## Explicit over implicit

Zen of Python; POODR (Transparent).

- Prefer the longer, spelled-out form whenever the shorter one requires the reader to _know_ something.
- No hidden behavior: if what something does cannot be told from its name and JSDoc, that is a design bug.
- Spell out defaults, constants and edge cases; do not leave them to inference. A magic number gets a named constant with a
  comment saying where it comes from.

## Duplication

Sandi Metz, "The Wrong Abstraction": duplication is far cheaper than the wrong abstraction.

- Two functions that look alike but serve different purposes stay separate. Merging them couples things that will change for
  different reasons, and the shared version grows flags and branches to serve both.
- Extract shared code when the abstraction is **obvious**: the same concept, with one name that fits every caller, that would
  change for the same reason everywhere. A small helper like `isBefore(first, second)` qualifies; a "generic" function that
  needs a parameter to say which caller it is serving does not.
- No abstractions for hypothetical reuse (Fowler's _Speculative Generality_): add one when the second real use appears, and
  only if it passes the test above.

## Modules and types

Ousterhout (information hiding, depth); POODR (single responsibility, managing dependencies).

- **One file, one concern**, by the same and/or and question tests as functions.
- A module's exports are its interface: small compared with what it does, documented, treated as a contract.
- **Composition over inheritance.** Plain data, factories and functions; classes only where a framework requires them.
- A unit knows just enough to do its job (POODR). Dependencies point one way; a project with layers lists them in its CLAUDE.md.

## TypeScript

- No `any`: `unknown` for truly unknown input, then narrow.
- No `enum`: `as const` arrays and union types.
- **When something comes in several kinds, give each kind a `kind` field and its own exact set of fields** (a discriminated
  union), rather than one shape full of optional fields and boolean flags saying which apply. Impossible combinations then
  cannot be written, TypeScript knows each kind's fields once `kind` is checked, and a `switch` on `kind` becomes a table of
  handlers. liftingApp's `PlannedExercise` (lift, cardio, interval) is the model.
- Exported functions declare their return types, so the signature is readable without the body.
- `!` (non-null assertion) only where an invariant makes the value certain, with a comment saying why; never to silence doubt.
- `import type` for type-only imports.
- No side effects at a module's top level beyond `const` definitions.
- Plain JavaScript that must run without a build (a git-installed library, a script) is typed with JSDoc and checked with
  `checkJs`, to the same rules.

## Tests

_Refactoring_ (the safety net); POODR (tests are indispensable).

- Every public function has tests. Test names read as specifications: `describe` and `it` as sentences.
- Pin down the _why_ and the edge cases, not only the happy path.
- Refactor only under a passing suite.

## Measured

`~/repos/codingStandards/measure/` measures every function a change touches (see its README). The thresholds:

| Measure                                              | Threshold |
| ---------------------------------------------------- | --------- |
| Lines of code (blank lines and comments not counted) | 20        |
| Cognitive complexity (SonarSource's definition)      | 10        |
| Nesting depth                                        | 2         |
| Parameters                                           | 3         |

A value over its threshold is not automatically wrong, but it is never let through silently: refactor it, or justify it in the
commit proposal. What a tool can check is left to the tool; the prose above is for what needs judgment.

## Code you touch

Bring the code you touch up to these standards, whoever wrote it and however old it is: much existing code was written by
weaker models, so expect to find room for improvement. Small cleanups noticed nearby go in their own behavior-neutral commit;
anything big, risky or needing a design decision is parked and raised instead.

## Exemplars

`exemplars.md` shows these standards on real code, before and after. When a rule here is unclear, the exemplars are what it means.

## Sources

In order of influence: _A Philosophy of Software Design_ (John Ousterhout: deep modules, simple interfaces), _Refactoring_
(Martin Fowler), _Practical Object-Oriented Design_ (Sandi Metz), _Clean Code_ (Robert C. Martin), and _The Zen of Python_
(Tim Peters).
