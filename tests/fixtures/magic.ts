// Fixture for the Magic count: bare numbers and bitwise operators, counted by hand.
//   scale: 4 (bare number) + & + 0xff + >>> = 4. Not counted: LIMIT (outside any function), the default value 3,
//     the array index [0], the ignored 0, 1 and 2, and 6.2 (named by its object key).
//   plain: nothing, so 0.
const LIMIT = 100;

export function scale(value: number, factor = 3): number {
  const halved = value / 2;
  const quartered = halved / 4;
  const masked = quartered & 0xff;
  const canopy = { radius: 6.2 };
  const items = [value, factor];
  return items[0] + masked * 1 + LIMIT + 0 + canopy.radius + (masked >>> 0);
}

export function plain(value: number): number {
  return value + 1;
}
