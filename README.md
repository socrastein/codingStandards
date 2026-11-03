# codingStandards

How Matt writes code, in every project: the standards themselves, the exemplars that show them, and the tools that check what
a tool can check. Every project's CLAUDE.md, and Matt's global one, point here instead of keeping their own copy.

## Measuring functions (the code review gate)

`measure/` measures every function a change touches: lines of code (without blank lines and comments), SonarSource's cognitive
complexity, cyclomatic complexity, nesting depth and parameters, with each value over its threshold marked `!`. It reads
JavaScript, TypeScript and Vue components, and runs from inside any project, with no setup in that project:

```sh
node ~/repos/codingStandards/measure/measure.js                 # the uncommitted work (staged, unstaged and untracked)
node ~/repos/codingStandards/measure/measure.js --base main     # everything the branch changed since it left main
node ~/repos/codingStandards/measure/measure.js src/a.ts        # every function in the named files
node ~/repos/codingStandards/measure/measure.js --all           # every function in every tracked source file
```

The thresholds are in `measure/thresholds.js`: 20 lines, cognitive complexity 10, nesting depth 2, 3 parameters. A value over
one is not automatically wrong, but it is never let through silently: it is refactored, or its size is justified in the commit
proposal. A test file's `describe` callbacks are left out, since they only group tests; the tests inside them are measured.

The measures come from ESLint's own rules and `eslint-plugin-sonarjs`, each set to a maximum of 0 so it reports a value for
every function, which `measure/` matches to the function it is about. The project's own ESLint config, if it has one, is not
used. First use on a machine: `npm install` in this repo.

## Planned

Standards that a tool could check, so the prose can drop them (roughly in order of value):

- **Function shape as lint**: the same measures as `measure/`, plus `no-nested-ternary`, as warnings in each project's editor.
- **A switch case is one call**: `no-restricted-syntax`, flagging a `case` whose body is more than a single `return` of a call.
- **No calls nested as arguments**: `no-restricted-syntax`, flagging a call argument that is itself a call with arguments. Only
  approximate (it cannot tell `value.trim()` from real work), so a warning that prompts a look.
- **Booleans read as predicates**: `@typescript-eslint/naming-convention` (`is`, `has`, `can`, `should`).
- **No cryptic abbreviations**: CSpell over identifiers, with the abbreviation whitelist as its dictionary.
- **JSDoc on every export**: `eslint-plugin-jsdoc` (`@param` and `@returns` present; whether they say something stays judgment).
- **TypeScript rules**: `typescript-eslint` (no `any`, explicit return types on exports, `import type`, no `enum`, `!` warned).
- **Dependency direction**: `dependency-cruiser`, for a project with layers (liftingApp's `types ← factories ← validate/derive ← UI`).
- **Dead code**: `knip` (unused exports, files and dependencies).
- **Every public function tested**: Vitest coverage thresholds (approximate: coverage shows code ran, not that its edge cases
  are pinned down).
