import { useCallback, useEffect, useState } from 'react';

// Documented shortcut: the "+" key.
export const SHORTCUT_KEY = '+';

export default function App() {
  const [count, setCount] = useState(0);

  // One state transition, shared by the button and the keyboard shortcut.
  const increment = useCallback(() => setCount((c) => c + 1), []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.repeat) return; // holding the key down counts once
      if (event.key === SHORTCUT_KEY) increment(); // every other key is ignored
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [increment]);

  return (
    <main>
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