export function resolveHeightDomain(values: number[]): [number, number] {
  const max = Math.max(0, ...values.filter(Number.isFinite));
  return [0, Math.max(1, max)];
}
