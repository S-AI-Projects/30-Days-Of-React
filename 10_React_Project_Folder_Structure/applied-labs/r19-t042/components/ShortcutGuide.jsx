import React from 'react';

export const ShortcutGuide = ({ documentedKey = 'ArrowUp', max = 10 }) => {
  return (
    <div
      data-testid="shortcut-guide"
      style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        fontSize: '13px',
      }}
    >
      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#343a40' }}>
        Shortcut Contract &amp; Boundary Rules
      </h3>
      <ul style={{ margin: '0', paddingLeft: '20px', color: '#495057' }}>
        <li>
          <strong>Documented Key:</strong> <code>{documentedKey}</code> increments count once per keypress (same state transition as the button).
        </li>
        <li>
          <strong>Irrelevant Keys:</strong> All other keys (e.g. <code>ArrowDown</code>, <code>a</code>, <code>x</code>, <code>Enter</code>, <code>Escape</code>, <code>Tab</code>, <code>Shift</code>) leave state completely unchanged.
        </li>
        <li>
          <strong>Boundary Condition:</strong> Count is clamped to maximum <code>{max}</code>. When <code>count === {max}</code>, further clicks and <code>{documentedKey}</code> keystrokes are ignored.
        </li>
        <li>
          <strong>Empty / Invalid Inputs:</strong> Submitting empty or non-numeric values in manual input leaves state unchanged and triggers descriptive validation errors.
        </li>
      </ul>
    </div>
  );
};

export default ShortcutGuide;
