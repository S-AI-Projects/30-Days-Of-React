// R19-T032 applied lab: one reusable StatusBadge component (Day 4: Components).
// The lesson's point is that a component is a small, reusable piece of UI:
// the same StatusBadge is rendered eight times below with a different status
// prop each time, and the page never repeats the badge markup itself.
import React from 'react';

// The badge knows exactly three statuses. The match is exact and
// case-sensitive: no trimming, no lower-casing. Anything else — another
// word, a capitalised word, a word with a space, an empty string, or no
// status at all — is unknown and renders the explicit fallback text.
const STATUS_TEXT = {
  pending: 'Pending…',
  success: 'Success',
  error: 'Error',
};

export function StatusBadge({ status, testId }) {
  const text = STATUS_TEXT[status] ?? 'Unknown status';
  return <span data-testid={testId}>{text}</span>;
}

export default function Example() {
  return (
    <main>
      <h1>Status badge</h1>
      <p>
        One component, eight uses — each badge below is the same StatusBadge
        with a different status.
      </p>
      <ul data-testid="status-list">
        <li>
          pending: <StatusBadge status="pending" testId="badge-pending" />
        </li>
        <li>
          success: <StatusBadge status="success" testId="badge-success" />
        </li>
        <li>
          error: <StatusBadge status="error" testId="badge-error" />
        </li>
        <li>
          archived (unknown word):{' '}
          <StatusBadge status="archived" testId="badge-unknown" />
        </li>
        <li>
          Pending (capitalised):{' '}
          <StatusBadge status="Pending" testId="badge-capitalised" />
        </li>
        <li>
          space before pending:{' '}
          <StatusBadge status=" pending" testId="badge-spaced" />
        </li>
        <li>
          empty string: <StatusBadge status="" testId="badge-empty" />
        </li>
        <li>
          no status given: <StatusBadge testId="badge-missing" />
        </li>
      </ul>
    </main>
  );
}
