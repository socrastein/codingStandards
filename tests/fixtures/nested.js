// Fixture for the measuring test. Hand-counted measures (SonarSource cognitive complexity, ESLint's other rules):
//   countLongWords: for +1, if nested once +2 = cognitive 3; cyclomatic 1 + for + if = 3; depth 2; 2 params; 9 code lines (ESLint counts the signature line and the closing brace).
//   double: an arrow function with an expression body, 1 line, nothing else.
export function countLongWords(words, minimum) {
  let count = 0;
  for (const word of words) {
    if (word.length >= minimum) {
      count += 1;
    }
  }
  return count;
}

export const double = (value) => value * 2;
