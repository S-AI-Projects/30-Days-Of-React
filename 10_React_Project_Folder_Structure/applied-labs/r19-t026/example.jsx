import { useCallback, useEffect, useState } from 'react';

// Documented shortcut: the "+" key.
export const SHORTCUT_KEY = '+';

// Extracted responsibility: call onTrigger once per press of one exact key.
// Held-down auto-repeat is ignored, and every other key is ignored.
export function useKeyboardShortcut(key, onTrigger) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.repeat) return;
      if (event.key === key) onTrigger();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, onTrigger]);
}

export default function App() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((c) => c + 1), []);

  useKeyboardShortcut(SHORTCUT_KEY, increment);

  return (
    <main data-version="refactored">
      <h1>Button and shortcut lab</h1>
      <p>
        Count: <output data-testid="count">{count}</output>
      </p>
      <button type="button" onClick={increment}>
        Increment (press {SHORTCUT_KEY})
      </button>
    </main>
  );
}