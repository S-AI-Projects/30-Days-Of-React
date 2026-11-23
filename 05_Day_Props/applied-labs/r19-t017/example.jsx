import React from 'react'

// Step 1 (input -> intermediate state): normalize the props into an explicit state.
// Rules, checked in this order:
//   1. max (default 5) must be a whole number >= 1, else status "invalid".
//   2. a missing value (undefined/null) means status "empty".
//   3. value must be a number, else "invalid".
//   4. value must be between 0 and max, else "invalid".
//   5. otherwise status "rated".
export function normalizeRating(value, max = 5) {
  if (!Number.isInteger(max) || max < 1) {
    return { status: 'invalid', reason: 'max must be a whole number of at least 1' }
  }
  if (value === undefined || value === null) return { status: 'empty', max }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return { status: 'invalid', reason: 'value must be a number' }
  }
  if (value < 0 || value > max) {
    return { status: 'invalid', reason: 'value must be between 0 and max' }
  }
  return { status: 'rated', value, max }
}

// Step 2 (intermediate state -> output text).
export function ratingText(state) {
  if (state.status === 'empty') return 'Not rated'
  if (state.status === 'invalid') return `Invalid rating: ${state.reason}`
  return `${state.value}/${state.max}`
}

export function Rating({ value, max }) {
  const state = normalizeRating(value, max)
  return (
    <span data-testid="rating" data-status={state.status}>
      {ratingText(state)}
    </span>
  )
}

// CONTRIBUTION FOCUS: the published worked examples (input -> state -> output).
// The same examples are listed in README.md, and the Playwright check runs them.
export const examples = [
  { label: 'value=3, max=5', props: { value: 3, max: 5 } },
  { label: 'value missing, max=5', props: { max: 5 } },
  { label: 'value=0, max=5', props: { value: 0, max: 5 } },
  { label: 'value=5, max=5', props: { value: 5, max: 5 } },
  { label: 'value=6, max=5', props: { value: 6, max: 5 } },
  { label: 'value=-1, max=5', props: { value: -1, max: 5 } },
  { label: 'value=3, max=0', props: { value: 3, max: 0 } },
  { label: 'value=3, max=2.5', props: { value: 3, max: 2.5 } },
  { label: 'value=3, max missing (defaults to 5)', props: { value: 3 } },
  { label: 'value="abc", max=5', props: { value: 'abc', max: 5 } },
]

export default function App() {
  return (
    <div>
      <h1>Rating props contract</h1>
      <table>
        <thead>
          <tr><th>Input</th><th>State</th><th>Output</th></tr>
        </thead>
        <tbody>
          {examples.map((ex) => {
            const state = normalizeRating(ex.props.value, ex.props.max)
            return (
              <tr key={ex.label} data-testid="example-row">
                <td data-testid="example-input">{ex.label}</td>
                <td data-testid="example-state">status={state.status}</td>
                <td><Rating {...ex.props} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
