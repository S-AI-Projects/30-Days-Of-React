// Deterministic local fixture for the R19-T039 lab.
// Three bounded input sizes for the input-scale experiment. The items
// are generated, not fetched — no live API is involved.
export const SIZES = [1, 10, 100];

export function makeItems(n) {
  return Array.from({ length: n }, (_, i) => ({
    label: `Item ${i + 1}`,
    level: 'info',
  }));
}
