import React from 'react'

const BADGES = {
  pending: { text: 'Pending', color: 'orange' },
  success: { text: 'Success', color: 'green' },
  error: { text: 'Error', color: 'red' },
}
const FALLBACK = { text: 'Unknown status', color: 'gray' }

// One reusable badge for every status.
export function StatusBadge({ status }) {
  // DECISIVE CONDITION: only the badge's OWN keys count as known statuses.
  // (`status in BADGES` would wrongly accept names like "constructor".)
  const known = Object.hasOwn(BADGES, status)
  const badge = known ? BADGES[status] : FALLBACK
  return (
    <span data-testid="badge" data-known={String(known)} style={{ color: badge.color, fontWeight: 'bold' }}>
      {badge.text}
    </span>
  )
}

export const cases = [
  { label: 'pending', status: 'pending' },
  { label: 'success', status: 'success' },
  { label: 'error', status: 'error' },
  { label: 'banana', status: 'banana' },
  { label: 'constructor', status: 'constructor' },
  { label: 'toString', status: 'toString' },
  { label: '(missing)', status: undefined },
]

export default function App() {
  return (
    <div>
      <h1>Status badge</h1>
      <ul>
        {cases.map((c) => (
          <li key={c.label} data-testid="row">
            <code>{c.label}</code> <StatusBadge status={c.status} />
          </li>
        ))}
      </ul>
    </div>
  )
}
