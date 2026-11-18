# Day 10 Applied Lab: Button and Keyboard Shortcut State Transition (R19-T042)

## Goal
Implement a button and keyboard shortcut that update the same state transition. Click and the documented key each increment once; irrelevant keys leave state unchanged.

## Contribution Focus: Boundary & Invalid/Empty-Input Behavior
This lab focuses explicitly on:
1. **The Stated Boundary Condition:**
   - State count is bounded within the closed interval `[0, 10]` (`MIN_COUNT = 0`, `MAX_COUNT = 10`).
   - Increments are allowed only while `count < 10`.
   - When `count === 10` (the exact boundary condition), further clicks on the Increment button and further presses of the documented `ArrowUp` shortcut key do NOT increment the count.
   - The Increment button is disabled (`disabled={count >= 10}`), and a prominent boundary alert (`data-testid="boundary-alert"`) informs the user that the maximum limit has been reached.
2. **Invalid & Empty-Input Behavior:**
   - **Keyboard Events:**
     - Only the documented shortcut key (`ArrowUp`) triggers the increment transition.
     - Irrelevant keys (such as `ArrowDown`, `a`, `x`, `Enter`, `Escape`, `Tab`, `Shift`, or empty key events) leave the state completely unchanged.
     - When focusing inside input fields, shortcut keypresses are ignored to prevent accidental increments while typing.
   - **Manual Input Form:**
     - **Empty-input behavior:** Submitting an empty input string `""` or whitespace is rejected with an explicit error message (`"Error: Input cannot be empty. Value must be an integer between 0 and 10."`), preserving state without producing `NaN`.
     - **Invalid-input behavior:** Submitting non-numeric strings (`"abc"`, `"foo"`), decimals (`"3.14"`), negative numbers (`"-5"`), or numbers exceeding the maximum boundary (`"15"`) is rejected with an explicit error message (`"Error: Invalid input '${val}'. Value must be an integer between 0 and 10."`), leaving state unchanged.
     - **Valid-input behavior:** Submitting a valid integer in `[0, 10]` (e.g., `8`) updates the counter to that value and clears validation errors.
   - **Reset Transition:**
     - The Reset button restores count to `MIN_COUNT` (`0`) and clears any errors.

## Folder Structure & Day 10 Alignment
Following Day 10 guidelines on **React Project Folder Structure and File Naming**:
```
10_React_Project_Folder_Structure/applied-labs/r19-t042/
├── components/
│   ├── BoundaryStatus.jsx    # Displays normal boundary state or boundary alert
│   ├── CounterDisplay.jsx    # Renders current count and boundary range with React Fragments
│   ├── IncrementButton.jsx   # Primary action button with shortcut hint
│   ├── ManualInput.jsx       # Validation sandbox for empty and invalid inputs
│   └── ShortcutGuide.jsx     # Documentation guide card for shortcut contract
├── example.jsx               # Main container component wiring state transitions and shortcuts
├── index.html                # Entry HTML with SVG favicon
├── main.jsx                  # React 18 DOM root mount
├── package.json              # Lab dependencies (react, react-dom, playwright, vite)
├── vite.config.js            # Vite configuration
├── check.mjs                 # Playwright test verification script
└── README.md                 # Lab documentation (this file)
```

## Running the Application Locally
To run the local Vite development server:
```bash
cd 10_React_Project_Folder_Structure/applied-labs/r19-t042
npm install
npm run dev
```

## Running Verification Checks
To run the automated Playwright checks from the repository root:
```bash
node 10_React_Project_Folder_Structure/applied-labs/r19-t042/check.mjs
```
The test runner:
- Starts the local Vite server.
- Launches headless Chromium (with fallback to installed Google Chrome).
- Tests initial state, button increments, shortcut increments, and irrelevant keys.
- Tests input isolation and empty/invalid input validation.
- Tests reaching the exact boundary condition (`10`) and verifies that further button clicks and keyboard shortcuts are blocked.
- Verifies zero console errors, page errors, and network request failures.
- Saves results and evidence in `work/R19-T042/`.
- Exits with `0` on success and `1` on failure (without using `console.assert`).
