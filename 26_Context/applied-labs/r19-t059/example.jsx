import React, { createContext, useContext, useState, useRef } from 'react';

export const ThemeContext = createContext({
  theme: 'light',
  toggle: () => {},
});

export function ThemeProvider({ initialTheme = 'light', children }) {
  const [theme, setTheme] = useState(initialTheme);
  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggleButton({ testId, label }) {
  const { theme, toggle } = useContext(ThemeContext);
  return (
    <button data-testid={testId} onClick={toggle} style={{ padding: '6px 12px', margin: '4px' }}>
      {label} (Current: {theme})
    </button>
  );
}

export function ConsumerCard({ id, label }) {
  const { theme } = useContext(ThemeContext);
  const renders = useRef(0);
  renders.current += 1;

  return (
    <div
      data-testid={`consumer-${id}`}
      data-theme={theme}
      style={{
        padding: '10px 14px',
        margin: '6px 0',
        borderRadius: '4px',
        border: '1px solid #ccc',
        backgroundColor: theme === 'light' ? '#ffffff' : '#222222',
        color: theme === 'light' ? '#222222' : '#ffffff',
      }}
    >
      <span>{label}: </span>
      <strong data-testid={`theme-val-${id}`}>{theme}</strong>
      <span data-testid={`renders-${id}`} style={{ marginLeft: '12px', fontSize: '12px', opacity: 0.8 }}>
        renders:{renders.current}
      </span>
    </div>
  );
}

export function SubtreeContainer() {
  return (
    <div style={{ marginTop: '16px', padding: '16px', border: '2px dashed #ff9800', borderRadius: '4px' }}>
      <h3>Independently Provided Subtree</h3>
      <p>This subtree provides its own ThemeProvider (defaults to 'dark').</p>
      <ThemeProvider initialTheme="dark">
        <ThemeToggleButton testId="btn-toggle-sub" label="Toggle Subtree Theme" />
        <ConsumerCard id="sub-1" label="Subtree Consumer" />
      </ThemeProvider>
    </div>
  );
}

export default function App() {
  const [scale, setScale] = useState(3); // Bounded sizes: 1, 3, 5

  const consumers = Array.from({ length: scale }, (_, i) => ({
    id: `root-${i + 1}`,
    label: `Root Consumer ${i + 1}`,
  }));

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', maxWidth: '680px' }}>
      <h1>Day 26: Context Scope & Input-Scale Experiment (R19-T059)</h1>
      <p>Contract: Context propagation inside provider vs isolation of independently provided subtree.</p>

      {/* Input Scale Controls: 3 Bounded Input Sizes */}
      <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
        <strong>Scale Consumer Count (3 Bounded Sizes): </strong>
        <button data-testid="btn-scale-1" onClick={() => setScale(1)} style={{ fontWeight: scale === 1 ? 'bold' : 'normal' }}>
          Scale 1 (1 Consumer)
        </button>
        <button data-testid="btn-scale-3" onClick={() => setScale(3)} style={{ fontWeight: scale === 3 ? 'bold' : 'normal', margin: '0 8px' }}>
          Scale 3 (3 Consumers)
        </button>
        <button data-testid="btn-scale-5" onClick={() => setScale(5)} style={{ fontWeight: scale === 5 ? 'bold' : 'normal' }}>
          Scale 5 (5 Consumers)
        </button>
      </div>

      <ThemeProvider initialTheme="light">
        <div style={{ border: '2px solid #0070f3', padding: '16px', borderRadius: '4px' }}>
          <h3>Root Provider Scope</h3>
          <ThemeToggleButton testId="btn-toggle-root" label="Toggle Root Theme" />

          <div data-testid="root-consumers-container">
            {consumers.map((c) => (
              <ConsumerCard key={c.id} id={c.id} label={c.label} />
            ))}
          </div>

          {/* Nested Independent Subtree */}
          <SubtreeContainer />
        </div>
      </ThemeProvider>
    </div>
  );
}
