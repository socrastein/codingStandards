# Exemplars

The standards in `codingStandards.md`, shown on real code. Each entry is a before and after from an actual review, with the rule it
shows and why the after is better. When a rule is unclear, these are what it means. New entries come from the code review gate:
whenever a refactor makes a good example, it is added here.

## Visible state, and conditions with names

**Shows:** the readability test (hidden state, a compound condition doing two jobs); explaining variables.
**From:** liftingSchoolUI `js/styleRules.js`, `styleBlocksOf`, ported from the business site (2026-11-02).

Before: the `map` callback changes `insideStyle`, a variable outside itself, so the function is a state machine that looks like a
line-by-line transform. One expression packs two different cases.

```js
export function styleBlocksOf(vueSource) {
  const lines = vueSource.split("\n");
  let insideStyle = false;

  const kept = lines.map((line) => {
    if (/<style\b/.test(line)) {
      insideStyle = !/<\/style>/.test(line) && !/\bsrc=/.test(line);
      return "";
    }
    if (/<\/style>/.test(line)) {
      insideStyle = false;
      return "";
    }
    return insideStyle ? line : "";
  });

  return kept.join("\n");
}
```

After: a loop that carries state looks like one, the state is named and commented, and each case in the condition has a name.

```js
export function styleBlocksOf(vueSource) {
  const lines = vueSource.split("\n");
  const kept = [];
  // Whether the line being read is inside a <style> block: the state carried from one line to the next
  let insideStyle = false;

  for (const line of lines) {
    const opensStyle = /<style\b/.test(line);
    const closesStyle = /<\/style>/.test(line);

    if (opensStyle) {
      // A block opened and closed on one line holds nothing to check, and one with src= loads its CSS from another file
      const loadsFromAnotherFile = /\bsrc=/.test(line);
      insideStyle = !closesStyle && !loadsFromAnotherFile;
      kept.push("");
    } else if (closesStyle) {
      insideStyle = false;
      kept.push("");
    } else {
      const keptLine = insideStyle ? line : "";
      kept.push(keptLine);
    }
  }

  return kept.join("\n");
}
```

Note: the after is 21 lines, one over the threshold. Spelling out every step made it longer, which is the right trade (reads like
prose comes before small functions). The next step, if it grows, is to move the three branches into a helper that classifies a
line.

## A plain loop instead of a clever reduce

**Shows:** the readability test (cleverness); priority 1 over brevity.
**From:** codingStandards `measure/functionMeasures.js`, `innermostAround`, a first draft caught in review (2026-11-02).

Before: correct, and short, but the reader has to work out what the `reduce` returns, what `around[0]` is doing as its start
value, and which way round `startsLast` compares.

```js
function innermostAround(rows, position) {
  const around = rows.filter((row) => !isBefore(position, row.record.start) && !isBefore(row.record.end, position));
  const startsLast = (first, second) => (isBefore(first.record.start, second.record.start) ? second : first);
  return around.reduce(startsLast, around[0]);
}
```

After: the filter's condition is a named helper (`contains`), and choosing the innermost is a loop that says what it keeps.

```js
function innermostAround(rows, position) {
  const around = rows.filter((row) => contains(row.record, position));
  let innermost;
  for (const row of around) {
    const startsLater = innermost === undefined || isBefore(innermost.record.start, row.record.start);
    if (startsLater) innermost = row;
  }
  return innermost;
}
```

## Name the step instead of nesting it

**Shows:** the readability test (calls nested as arguments); one level of abstraction per body.
**From:** codingStandards `measure/report.js`, `formatTable`, a first draft caught in review (2026-11-02).

Before: the widths are a `map` inside `Math.max` inside a `map`, on one line, in the middle of a function that is otherwise a
list of steps.

```js
function formatTable(rows) {
  const headings = COLUMNS.map((column) => column.heading);
  const cells = rows.map((row) => COLUMNS.map((column) => column.cell(row)));
  const widths = headings.map((heading, index) =>
    Math.max(heading.length, ...cells.map((cellRow) => cellRow[index]?.length ?? 0)),
  );
  const rule = widths.map((width) => "-".repeat(width));
  const lines = [headings, rule, ...cells].map((cellRow) => alignedLine(cellRow, widths));
  return lines.join("\n");
}
```

After: the body reads as five steps, and the detail of measuring a column lives in a function named for it, with its own
explaining variable.

```js
function formatTable(rows) {
  const headings = COLUMNS.map((column) => column.heading);
  const cells = rows.map((row) => COLUMNS.map((column) => column.cell(row)));
  const widths = columnWidths(headings, cells);
  const rule = widths.map((width) => "-".repeat(width));
  const lines = [headings, rule, ...cells].map((cellRow) => alignedLine(cellRow, widths));
  return lines.join("\n");
}

/** Each column's width: that of its widest cell or its heading, whichever is wider. */
function columnWidths(headings, cells) {
  return headings.map((heading, index) => {
    const cellLengths = cells.map((cellRow) => cellRow[index]?.length ?? 0);
    return Math.max(heading.length, ...cellLengths);
  });
}
```
