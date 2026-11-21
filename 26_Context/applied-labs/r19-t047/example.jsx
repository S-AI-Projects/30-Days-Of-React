import React, { createContext, useContext, useState, useRef } from 'react';

/**
 * Predefined theme color schemes and visual definitions.
 * All data is kept local and self-contained within this applied lab.
 */
export const THEME_CONFIGS = {
  light: {
    name: 'light',
    label: 'Light Mode',
    background: '#ffffff',
    text: '#1f2937',
    cardBg: '#f3f4f6',
    border: '#e5e7eb',
    accent: '#2563eb',
    tagBg: '#dbeafe',
    tagText: '#1e40af',
  },
  dark: {
    name: 'dark',
    label: 'Dark Mode',
    background: '#111827',
    text: '#f9fafb',
    cardBg: '#1f2937',
    border: '#374151',
    accent: '#60a5fa',
    tagBg: '#1e3a8a',
    tagText: '#93c5fd',
  },
  solarized: {
    name: 'solarized',
    label: 'Solarized Sand',
    background: '#fdf6e3',
    text: '#657b83',
    cardBg: '#eee8d5',
    border: '#cb4b16',
    accent: '#b58900',
    tagBg: '#fdf0cd',
    tagText: '#859900',
  },
  ocean: {
    name: 'ocean',
    label: 'Ocean Breeze',
    background: '#0b192c',
    text: '#e0f2fe',
    cardBg: '#1e3e62',
    border: '#0284c7',
    accent: '#38bdf8',
    tagBg: '#0c4a6e',
    tagText: '#7dd3fc',
  },
};

export const SUPPORTED_THEMES = Object.keys(THEME_CONFIGS);
export const DEFAULT_MAIN_THEME = 'light';
export const DEFAULT_INDEPENDENT_THEME = 'dark';

export const FALLBACK_THEME_CONFIG = {
  name: 'fallback-empty',
  label: 'Empty State Fallback',
  background: '#fffbeb',
  text: '#92400e',
  cardBg: '#fef3c7',
  border: '#f59e0b',
  accent: '#d97706',
  tagBg: '#fde68a',
  tagText: '#78350f',
};

/**
 * ThemeContext creation
 * Context allow us to pass theme data through the component tree
 * without having to pass props down manually at every level.
 */
export const ThemeContext = createContext(null);

/**
 * useTheme Custom Hook
 * Provides safe consumption of the ThemeContext.
 * If accessed outside a ThemeProvider, returns a deterministic unprovided fallback
 * so the application remains crash-free while exposing its unconfigured boundary.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'unprovided-fallback',
      config: THEME_CONFIGS.light,
      toggleTheme: () => {},
      setCustomTheme: () => ({ success: false, error: 'Outside provider' }),
      clearTheme: () => {},
      error: 'Unprovided: Component rendered outside any ThemeProvider boundary.',
      isEmpty: false,
      isOutsideProvider: true,
      providerId: 'none',
      renderCount: 0,
    };
  }
  return context;
};

/**
 * ThemeProvider Component
 * Manages theme state, validation, toggling, and contribution focus
 * (demonstrating empty/error states and recovery on next valid input).
 */
export const ThemeProvider = ({
  children,
  initialTheme = DEFAULT_MAIN_THEME,
  providerId = 'main-provider',
}) => {
  const [theme, setTheme] = useState(initialTheme);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [transitionHistory, setTransitionHistory] = useState([
    { action: 'mount', theme: initialTheme, timestamp: Date.now() },
  ]);

  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  /**
   * Toggles between 'light' and 'dark'.
   * If currently 'dark', toggles to 'light'; otherwise toggles to 'dark'.
   * Clears any active error or empty state on successful toggle.
   */
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === 'dark' ? 'light' : 'dark';
      setError(null);
      setIsEmpty(false);
      setTransitionHistory((hist) => [
        ...hist,
        { action: 'toggle', theme: nextTheme, timestamp: Date.now() },
      ]);
      return nextTheme;
    });
  };

  /**
   * Validates and applies a custom theme string.
   * If empty or whitespace -> sets stated empty/error state.
   * If unsupported string -> sets stated unknown theme error.
   * If valid -> updates theme cleanly and recovers immediately.
   */
  const setCustomTheme = (rawInput) => {
    if (rawInput === null || rawInput === undefined || String(rawInput).trim() === '') {
      setIsEmpty(true);
      setTheme('fallback-empty');
      const emptyError =
        'Error: Theme name cannot be empty. Enter a valid theme (light, dark, solarized, ocean).';
      setError(emptyError);
      setTransitionHistory((hist) => [
        ...hist,
        { action: 'empty-error', theme: 'fallback-empty', timestamp: Date.now() },
      ]);
      return { success: false, error: emptyError };
    }

    const normalized = String(rawInput).trim().toLowerCase();
    if (!THEME_CONFIGS[normalized]) {
      setIsEmpty(false);
      const invalidError = `Error: Unknown theme '${rawInput}'. Supported themes: ${SUPPORTED_THEMES.join(
        ', '
      )}.`;
      setError(invalidError);
      setTransitionHistory((hist) => [
        ...hist,
        { action: 'invalid-error', theme, timestamp: Date.now() },
      ]);
      return { success: false, error: invalidError };
    }

    // Valid input: immediate recovery without restart
    setTheme(normalized);
    setError(null);
    setIsEmpty(false);
    setTransitionHistory((hist) => [
      ...hist,
      { action: 'apply-valid', theme: normalized, timestamp: Date.now() },
    ]);
    return { success: true, theme: normalized };
  };

  /**
   * Explicitly triggers the empty state with fallback indicator.
   */
  const clearTheme = () => {
    setIsEmpty(true);
    setTheme('fallback-empty');
    setError(
      'Error: Theme name cannot be empty. Enter a valid theme (light, dark, solarized, ocean).'
    );
    setTransitionHistory((hist) => [
      ...hist,
      { action: 'clear', theme: 'fallback-empty', timestamp: Date.now() },
    ]);
  };

  const currentConfig =
    theme === 'fallback-empty'
      ? FALLBACK_THEME_CONFIG
      : THEME_CONFIGS[theme] || THEME_CONFIGS.light;

  const contextValue = {
    theme,
    config: currentConfig,
    toggleTheme,
    setCustomTheme,
    clearTheme,
    error,
    isEmpty,
    isOutsideProvider: false,
    providerId,
    renderCount: renderCountRef.current,
    transitionCount: transitionHistory.length,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <div
        id={providerId}
        data-testid={providerId}
        style={{
          border: `2px solid ${currentConfig.border}`,
          borderRadius: '8px',
          padding: '16px',
          margin: '12px 0',
          backgroundColor: currentConfig.background,
          color: currentConfig.text,
          transition: 'all 0.2s ease',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

/**
 * Direct Consumer: Consumes ThemeContext directly inside the provider
 */
export const DirectConsumer = ({ id = 'main-direct' }) => {
  const { theme, config, renderCount, providerId } = useTheme();

  return (
    <div
      data-testid={`${id}-consumer`}
      style={{
        padding: '12px',
        margin: '8px 0',
        borderRadius: '6px',
        backgroundColor: config.cardBg,
        border: `1px solid ${config.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong>Direct Consumer ({id})</strong>
        <span
          data-testid={`${id}-theme-value`}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: config.tagBg,
            color: config.tagText,
            fontWeight: 'bold',
            fontSize: '13px',
          }}
        >
          {theme}
        </span>
      </div>
      <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.85 }}>
        Bound to <code>{providerId}</code> | Render count: {renderCount}
      </p>
    </div>
  );
};

/**
 * Deeply Nested Consumer Components Hierarchy
 * Demonstrates passing data down through intermediate components
 * without manual prop drilling.
 */
export const IntermediateWrapper = ({ children, title = 'Nested Container' }) => (
  <div
    style={{
      padding: '10px',
      margin: '8px 0',
      borderLeft: '3px solid #6366f1',
      paddingLeft: '12px',
    }}
  >
    <small style={{ textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
      {title} (Intermediate level - no props drilled)
    </small>
    {children}
  </div>
);

export const DeepNestedConsumer = ({ id = 'main-nested' }) => {
  const { theme, config, renderCount, providerId } = useTheme();

  return (
    <div
      data-testid={`${id}-consumer`}
      style={{
        padding: '12px',
        margin: '8px 0',
        borderRadius: '6px',
        backgroundColor: config.cardBg,
        border: `1px dashed ${config.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong>Nested Consumer ({id})</strong>
        <span
          data-testid={`${id}-theme-value`}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: config.tagBg,
            color: config.tagText,
            fontWeight: 'bold',
            fontSize: '13px',
          }}
        >
          {theme}
        </span>
      </div>
      <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.85 }}>
        Deeply nested subscriber to <code>{providerId}</code> | Render count: {renderCount}
      </p>
    </div>
  );
};

/**
 * ProviderControls: Provides controls for toggling, input validation,
 * error/empty state demonstration, and recovery on valid input.
 */
export const ProviderControls = ({
  toggleTestId = 'toggle-main-theme',
  inputTestId = 'theme-input',
  applyTestId = 'apply-theme-btn',
  clearTestId = 'clear-theme-btn',
  invalidTestId = 'invalid-theme-btn',
  statusTestId = 'theme-status',
  errorBannerTestId = 'theme-error-banner',
  emptyStateTestId = 'theme-empty-state',
  showInputs = true,
}) => {
  const {
    theme,
    toggleTheme,
    setCustomTheme,
    clearTheme,
    error,
    isEmpty,
    config,
    providerId,
  } = useTheme();

  const [inputVal, setInputVal] = useState('');

  const handleApply = (e) => {
    e?.preventDefault();
    setCustomTheme(inputVal);
  };

  const handleApplyInvalid = () => {
    setInputVal('cyberpunk-invalid');
    setCustomTheme('cyberpunk-invalid');
  };

  const handleTriggerEmpty = () => {
    setInputVal('');
    clearTheme();
  };

  return (
    <div style={{ margin: '12px 0' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          data-testid={toggleTestId}
          onClick={toggleTheme}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            backgroundColor: config.accent,
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Toggle {providerId === 'main-provider' ? 'Main' : 'Independent'} Theme
        </button>

        {showInputs && (
          <>
            <form onSubmit={handleApply} style={{ display: 'inline-flex', gap: '6px' }}>
              <input
                type="text"
                data-testid={inputTestId}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter theme (e.g. solarized, ocean, dark, light)..."
                style={{
                  padding: '7px 10px',
                  borderRadius: '4px',
                  border: `1px solid ${config.border}`,
                  fontSize: '13px',
                  minWidth: '220px',
                }}
              />
              <button
                type="submit"
                data-testid={applyTestId}
                style={{
                  padding: '7px 12px',
                  borderRadius: '4px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Apply
              </button>
            </form>

            <button
              type="button"
              data-testid={clearTestId}
              onClick={handleTriggerEmpty}
              style={{
                padding: '7px 12px',
                borderRadius: '4px',
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Trigger Empty State
            </button>

            <button
              type="button"
              data-testid={invalidTestId}
              onClick={handleApplyInvalid}
              style={{
                padding: '7px 12px',
                borderRadius: '4px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Trigger Invalid State
            </button>
          </>
        )}
      </div>

      {/* Stated Error Banner */}
      {error && (
        <div
          data-testid={errorBannerTestId}
          role="alert"
          style={{
            marginTop: '10px',
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            color: '#b91c1c',
            fontWeight: '500',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* Stated Empty State View */}
      {isEmpty && (
        <div
          data-testid={emptyStateTestId}
          style={{
            marginTop: '10px',
            padding: '12px 14px',
            borderRadius: '6px',
            backgroundColor: '#fef3c7',
            border: '1px dashed #d97706',
            color: '#92400e',
            fontSize: '13px',
          }}
        >
          <strong>Empty State Active:</strong> No valid theme configured. Showing fallback baseline.
          Enter a valid theme (e.g., <code>solarized</code>, <code>ocean</code>, <code>dark</code>, or <code>light</code>) to recover.
        </div>
      )}

      {/* Live Context Status */}
      <div
        data-testid={statusTestId}
        style={{
          marginTop: '8px',
          fontSize: '13px',
          opacity: 0.9,
        }}
      >
        Active theme: <strong>{theme}</strong> ({config.label}) | State: {error ? 'error' : isEmpty ? 'empty' : 'healthy'}
      </div>
    </div>
  );
};

/**
 * OrphanConsumer: Renders outside of any provider
 * Confirms safe graceful fallback without crashing.
 */
export const OrphanConsumer = () => {
  const { theme, isOutsideProvider } = useTheme();

  return (
    <div
      data-testid="orphan-consumer"
      style={{
        padding: '10px 14px',
        margin: '12px 0',
        borderRadius: '6px',
        backgroundColor: '#f3f4f6',
        border: '1px dotted #9ca3af',
        color: '#374151',
        fontSize: '13px',
      }}
    >
      <strong>Provider Boundary Check:</strong>
      <span data-testid="orphan-consumer-status" style={{ marginLeft: '8px' }}>
        {isOutsideProvider
          ? `Outside Provider (Fallback: ${theme})`
          : `Inside Provider (${theme})`}
      </span>
    </div>
  );
};

/**
 * App: The main composition assembling:
 * 1. Main ThemeProvider with toggle and direct + nested consumers.
 * 2. Independent Subtree with its own isolated ThemeProvider and consumers.
 * 3. Orphan consumer verifying safe unprovided behavior.
 */
export default function App() {
  return (
    <div
      style={{
        maxWidth: '860px',
        margin: '20px auto',
        padding: '0 16px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <header style={{ marginBottom: '16px' }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '24px' }}>
          Day 26 Applied Lab: Theme Context & Nested Consumers (R19-T047)
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Demonstrates React Context propagation, isolated independent subtrees, and
          recovery from empty/error states without restarting.
        </p>
      </header>

      {/* Boundary Check: Outside any ThemeProvider */}
      <OrphanConsumer />

      {/* 1. MAIN THEME PROVIDER */}
      <ThemeProvider initialTheme={DEFAULT_MAIN_THEME} providerId="main-provider">
        <h2 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>1. Main Theme Provider</h2>
        <p style={{ fontSize: '13px', margin: '0 0 10px 0', opacity: 0.85 }}>
          Toggling changes all consumers inside this provider.
        </p>

        {/* Controls: Toggle, Custom Input, Error/Empty State triggers */}
        <ProviderControls
          toggleTestId="toggle-main-theme"
          inputTestId="theme-input"
          applyTestId="apply-theme-btn"
          clearTestId="clear-theme-btn"
          invalidTestId="invalid-theme-btn"
          statusTestId="theme-status"
          errorBannerTestId="theme-error-banner"
          emptyStateTestId="theme-empty-state"
          showInputs={true}
        />

        {/* Direct Consumer */}
        <DirectConsumer id="main-direct" />

        {/* Nested Consumer (deeply nested through intermediate component) */}
        <IntermediateWrapper title="Main Nested Intermediate Tree">
          <DeepNestedConsumer id="main-nested" />
        </IntermediateWrapper>

        {/* 2. INDEPENDENTLY PROVIDED SUBTREE */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 6px 0' }}>
            2. Independently Provided Subtree (Subtree Isolation)
          </h3>
          <p style={{ fontSize: '13px', margin: '0 0 8px 0', opacity: 0.85 }}>
            This subtree is wrapped in its own separate <code>ThemeProvider</code>. It maintains
            its own theme state independently when the outer provider toggles.
          </p>

          <ThemeProvider
            initialTheme={DEFAULT_INDEPENDENT_THEME}
            providerId="independent-subtree"
          >
            <ProviderControls
              toggleTestId="toggle-independent-theme"
              statusTestId="independent-theme-status"
              errorBannerTestId="independent-theme-error-banner"
              emptyStateTestId="independent-theme-empty-state"
              showInputs={false}
            />

            <DirectConsumer id="independent-direct" />

            <IntermediateWrapper title="Independent Nested Intermediate Tree">
              <DeepNestedConsumer id="independent-nested" />
            </IntermediateWrapper>
          </ThemeProvider>
        </div>
      </ThemeProvider>
    </div>
  );
}
