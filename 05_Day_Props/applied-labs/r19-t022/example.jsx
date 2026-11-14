// Rating props contract: value and max.
// Valid when max is a whole number >= 1 and 0 <= value <= max (both ends inclusive).

export function describeRating(value, max = 5) {
  // 1. Bounds first: max must be a whole number of at least 1.
  if (!Number.isInteger(max) || max < 1) {
    return { status: 'invalid-max', text: 'Invalid max' };
  }
  // 2. Empty input: a missing value is a normal state, not an error.
  if (value === undefined || value === null || value === '') {
    return { status: 'empty', text: 'Not rated' };
  }
  // 3. The value must be a finite number (rejects NaN, Infinity and strings).
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { status: 'invalid-value', text: 'Invalid value' };
  }
  // 4. Boundary: 0 and max themselves are allowed.
  if (value < 0 || value>max) {
    return { status: 'out-of-range', text: 'Out of range' };
  }
  return { status: 'ok', text: `${value}/${max}` };
}

export function Rating({ value, max = 5 }) {
  const { status, text } = describeRating(value, max);
  return (
    <span data-testid="rating" data-status={status}>
      {text}
    </span>
  );
}

// Local fixtures: no network calls.
const CASES = [
  { id: 'basic', label: 'value=3, max=5', props: { value: 3, max: 5 } },
  { id: 'default-max', label: 'value=4 (default max)', props: { value: 4 } },
  { id: 'missing', label: 'no value', props: {} },
  { id: 'null', label: 'value=null', props: { value: null } },
  { id: 'empty-string', label: 'value=""', props: { value: '' } },
  { id: 'zero', label: 'value=0, max=5', props: { value: 0, max: 5 } },
  { id: 'at-max', label: 'value=5, max=5', props: { value: 5, max: 5 } },
  { id: 'max-one', label: 'value=1, max=1', props: { value: 1, max: 1 } },
  { id: 'just-above', label: 'value=5.1, max=5', props: { value: 5.1, max: 5 } },
  { id: 'above-max', label: 'value=6, max=5', props: { value: 6, max: 5 } },
  { id: 'negative', label: 'value=-1, max=5', props: { value: -1, max: 5 } },
  { id: 'nan', label: 'value=NaN', props: { value: NaN } },
  { id: 'string', label: 'value="3"', props: { value: '3' } },
  { id: 'max-zero', label: 'value=3, max=0', props: { value: 3, max: 0 } },
  { id: 'max-fraction', label: 'value=1, max=2.5', props: { value: 1, max: 2.5 } },
];

export default function App() {
  return (
    <main>
      <h1>Rating props lab</h1>
      <ul>
        {CASES.map(({ id, label, props }) => (
          <li key={id} data-testid={`case-${id}`}>
            <code>{label}</code>
            {' → '}
            <Rating {...props} />
          </li>
        ))}
      </ul>
    </main>
  );
}