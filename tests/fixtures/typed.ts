// Fixture for the measuring test: TypeScript, with a class method (whose head starts at the method's name).
//   Shelf.label: if/else = cognitive 2 (if +1, else +1); cyclomatic 2; depth 1; 1 param.
export class Shelf {
  label(count: number): string {
    if (count === 1) {
      return "one item";
    } else {
      return `${count} items`;
    }
  }
}

// A function that is a property's value: ESLint reports it at the property's name, as for a method.
//   format: 1 param, cyclomatic 1.
export const formatters = {
  format: (value: number) => value.toFixed(1),
};
