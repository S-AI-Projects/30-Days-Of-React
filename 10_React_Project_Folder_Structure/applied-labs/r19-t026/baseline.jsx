import { useCallback, useEffect, useState } from 'react';

// Baseline: the working version. Keyboard handling is written inline in the component.
export const SHORTCUT_KEY = '+';

export default function App() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((c) => c + 1), []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.repeat) return;
      if (event.key === SHORTCUT_KEY) increment();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [increment]);

  return (
    <main data-version="baseline">
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