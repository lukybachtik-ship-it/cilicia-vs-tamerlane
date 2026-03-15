/** Roll n six-sided dice and return the results as an array. */
export function rollDice(n: number): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 6) + 1);
}
