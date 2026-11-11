// Fixture for the Magic count: a test file, whose literal expected values are the specification, so nothing is counted.
//   expectDouble: 42 and 84 would count anywhere else; here, 0.
export function expectDouble(double: (value: number) => number): boolean {
  return double(42) === 84;
}
