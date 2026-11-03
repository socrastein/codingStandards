# codingStandards

Matt's coding standards for every project, the exemplars that show them, and the tools that check them. What it holds and how
the tools are used is in `README.md`; read it first.

General workflow, commit style and comment style come from the global CLAUDE.md. This file only covers what is specific to this
repo.

## Commands

- `npm test`: Vitest, single run (`npm run test:watch` to watch). Tests live in `tests/`; `tests/measure.test.js` measures the
  fixture files in `tests/fixtures/` with the real ESLint, against values counted by hand (the counts are in each fixture's
  header comment).
- `npm run typecheck`: type-checks the tools and tests from their JSDoc (`tsconfig.json`, `checkJs`). Must pass.
- `npm run format`: formats every file with Prettier; `npm run format:check` only reports. Format before proposing a commit.
- `npm run measure -- <args>`: the measuring tool on this repo itself (or run `node measure/measure.js` from any project).

## Rules that are easy to break

- **The tools hold themselves to the standards.** Measure this repo's own changes before every commit, like any project's.
- **Plain JavaScript typed with JSDoc**, like liftingSchoolUI: the tools run straight from this folder with Node, with no build.
- **The measuring depends on ESLint's wording.** It reads each value out of a rule's message text, and stops with an error when a
  message no longer holds one, rather than reading it as 0. After upgrading ESLint or `eslint-plugin-sonarjs`, run the tests:
  the fixtures fail if a rule's wording or the place it reports at changed.
