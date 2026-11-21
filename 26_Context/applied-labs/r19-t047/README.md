# Day 26 Applied Lab: Theme Context & Nested Consumer (R19-T047)

This applied lab demonstrates state propagation and encapsulation in React using **React Context** (`createContext`, `useContext`, and `Provider`), featuring nested consumers, independently provided subtree isolation, and recovery from stated error/empty states.

> **Note:** This is an explicitly specified applied lab added to Day 26 (Context). It does not replace or modify any original numbered exercises.

---

## 1. Goal & Contract Specification

### Primary Contract
1. **Theme Context Propagation:**
   `ThemeContext` provides `{ theme, config, toggleTheme, setCustomTheme, clearTheme, error, isEmpty }` to descendant components without manual prop-drilling through intermediate levels.
2. **Toggle Synchronization Across Consumers:**
   Toggling changes all consumers inside the provider simultaneously. Both direct consumers (`DirectConsumer`) and deeply nested consumers (`DeepNestedConsumer`) update synchronously.
3. **Subtree Isolation:**
   An independently provided subtree wrapped in its own separate `ThemeProvider` keeps its own state. Toggling the main provider does not alter the independent subtree, and toggling the independent subtree does not alter the outer provider.

### Mathematical Invariants
- **Synchronized Propagation Invariant:**
  $$\forall C \in \text{Consumers}(\text{Provider}_A), \quad \text{Theme}(C) = \text{State}(\text{Provider}_A)$$
- **Subtree Orthogonality Invariant:**
  $$\text{State}(\text{Provider}_{\text{main}}) \perp \text{State}(\text{Provider}_{\text{independent}})$$
- **Error & Recovery Invariant:**
  $$\text{Input} = \text{Invalid} \implies \text{Error} \neq \emptyset \land \text{State} = \text{Fallback}$$
  $$\text{Input}_{t+1} = \text{Valid} \implies \text{Error} = \emptyset \land \text{State} = \text{Input}_{t+1} \quad (\text{without process restart})$$

---

## 2. Contribution Focus

**"Demonstrate the stated error or empty state, then a successful recovery on the next valid input without restarting the example."**

1. **Demonstrating Stated Empty & Error States:**
   - When the theme is cleared or an empty string (`""` or whitespace) is submitted, the provider transitions into the stated **Empty State** and displays the **Error Banner**:
     ```
     Error: Theme name cannot be empty. Enter a valid theme (light, dark, solarized, ocean).
     ```
   - When an unsupported theme key is submitted (e.g. `'cyberpunk-neon-invalid'`), the provider displays the **Invalid Input Error Banner**:
     ```
     Error: Unknown theme 'cyberpunk-neon-invalid'. Supported themes: light, dark, solarized, ocean.
     ```
   - Consumers safely render fallback indicators without crashing or throwing unhandled exceptions.
2. **In-Place Recovery Without Restarting:**
   - Without refreshing the page, remounting the root, or restarting the server, the user provides the next valid theme input (e.g. `'solarized'` or `'ocean'`).
   - The provider automatically clears the error banner, dismisses the empty state indicator, and updates all active consumers inside the provider to the new valid theme.
   - Normal toggle functionality continues seamlessly post-recovery.

---

## 3. Directory Layout

```
26_Context/applied-labs/r19-t047/
├── README.md           # Lab documentation and specifications
├── example.jsx         # Theme context provider, consumers, and recovery controls
├── check.mjs           # Automated Playwright verification suite
├── main.jsx            # React 18 DOM mount entrypoint
├── index.html          # HTML harness
├── package.json        # Dependencies & scripts
├── package-lock.json   # Deterministic lockfile
├── vite.config.js      # Vite build configuration
└── .gitignore          # Ignores node_modules and build artifacts
```

---

## 4. Verification & Testing

Run the automated verification suite from the repository root:

```bash
node 26_Context/applied-labs/r19-t047/check.mjs
```

The check script:
- Spins up an isolated local Vite development server on port 5177.
- Launches a headless Playwright Chromium instance.
- Exercises the contract:
  - Step 1: Initial mount state (main = `light`, independent = `dark`, orphan = safe fallback).
  - Step 2: Main provider toggle (`light` $\to$ `dark`) synchronizes direct and nested consumers while independent subtree remains `dark`.
  - Step 3: Independent subtree toggle (`dark` $\to$ `light`) updates only independent consumers; main provider remains `dark`.
  - Step 4: Toggle main provider back to `light` independently.
  - Step 5: Demonstrates stated empty state on empty/cleared input.
  - Step 6: Demonstrates stated invalid input error on unsupported theme name.
  - Step 7: Verifies successful in-place recovery on next valid input (`solarized`) without restarting.
  - Step 8: Verifies second error demonstration and recovery cycle (`ocean`).
  - Step 9: Confirms normal toggle functionality resumes seamlessly post-recovery.
  - Step 10: Asserts zero console errors, zero page errors, and zero failed network requests.
- Writes comprehensive results to `work/R19-T047/results.json` and `work/R19-T047/evidence.md`.
