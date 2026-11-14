import React from 'react';

const records = [
  { id: 1, name: 'Alpha', amount: 10, paid: true },
  { id: 2, name: 'Bravo', amount: 5, paid: true },
  { id: 3, name: 'Charlie', amount: 20, paid: false },
];

function derivePaidTotal(items) {
  return items
    .filter((item) => item.paid)
    .reduce((sum, item) => sum + item.amount, 0);
}

export default function FilteredTotalLab() {
  const paidTotal = derivePaidTotal(records);
  const originalSnapshot = JSON.stringify(records);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h2>Filtered total without mutating inputs</h2>

      <ul id="records-list" style={{ marginBottom: '1rem' }}>
        {records.map((record) => (
          <li key={record.id}>
            {record.name}: ${record.amount} ({record.paid ? 'Paid' : 'Unpaid'})
          </li>
        ))}
      </ul>

      <p id="total-line">
        Paid total: <strong id="total-value">{paidTotal}</strong>
      </p>

      <p id="immutability-status">
        Original records unchanged: <strong>{originalSnapshot === JSON.stringify(records) ? 'true' : 'false'}</strong>
      </p>
    </div>
  );
}
