<div align="center">
  <h1> 30 Days Of React: Context</h1>
  <a class="header-badge" target="_blank" href="https://www.linkedin.com/in/asabeneh/">
  <img src="https://img.shields.io/badge/style--5eba00.svg?label=LinkedIn&logo=linkedin&style=social">
  </a>
  <a class="header-badge" target="_blank" href="https://twitter.com/Asabeneh">
  <img alt="Twitter Follow" src="https://img.shields.io/twitter/follow/asabeneh?style=social">
  </a>

<sub>Author:
<a href="https://www.linkedin.com/in/asabeneh/" target="_blank">Asabeneh Yetayeh</a><br>
<small> October, 2020</small>
</sub>

</div>

[<< Day 25](../25_Custom_Hooks/25_custom_hooks.md) | [Day 27>>](../27_Ref/27_ref.md)

![30 Days of React banner](../images/30_days_of_react_banner_day_26.jpg)

# Context

Context allow as to pass data through the component tree without having to pass props down manually to every child component at every level.

In React, data is passed top-down (parent to child) via props, but this can be cumbersome for certain types of props (e.g. locale preference, UI theme) that are required by many components within an application. Context provides a way to share values like these between components without having to explicitly pass a prop through every level of the tree.

## When to Use Context

Context is designed to share data that can be considered “global” for a tree of React components, such as the current authenticated user, theme, or preferred language. For example, in the code below we manually thread through a “theme” prop in order to style the Button component:

The above text has been taken from [react documentation](https://reactjs.org/docs/context.html) without any change.

It seems the react documentation has pretty good information about context, you can go through the [react documentation](https://reactjs.org/docs/context.html).

# Exercises

## Added activity: Theme context with nested consumers and subtree isolation (R19-T047)

This is an added activity, not an original numbered exercise.

- Lab: [applied-labs/r19-t047](./applied-labs/r19-t047/README.md)
- Topic & Structure: Demonstrates Day 26 `createContext` and `useContext` propagation across component hierarchies without prop-drilling, multi-consumer synchronization, isolated subtrees maintaining independent context states, and resilience to empty/error states.
- Contract: Toggling changes all consumers (direct and deeply nested) inside the provider; an independently provided subtree keeps its own state.
- Contribution Focus: Demonstrate the stated error or empty state, then a successful recovery on the next valid input without restarting the example.
- Inputs: Actions `Toggle Main Theme`, `Toggle Independent Theme`, empty theme input submission `""` (or `Trigger Empty State`), invalid theme input `'cyberpunk-neon-invalid'`, and recovery input `'solarized'` (and `'ocean'`).
- Expected result: Toggling main provider switches all main consumers between `light` and `dark` while independent subtree retains its own theme (`dark`); toggling independent subtree switches its consumers between `dark` and `light` while main consumers remain unaffected; submitting empty or invalid inputs triggers the stated error banner and empty state view; submitting the next valid input immediately clears error states and updates consumers in-place without restarting the application.
- Check: `node 26_Context/applied-labs/r19-t047/check.mjs`

🎉 CONGRATULATIONS ! 🎉
[<< Day 25](../25_Custom_Hooks/25_custom_hooks.md) | [Day 27>>](../27_Ref/27_ref.md)
