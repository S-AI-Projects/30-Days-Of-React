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

## Added activity: context scope — input-scale experiment (R19-T059)

This is an added activity, not an original numbered exercise.

- Lab: [applied-labs/r19-t059](./applied-labs/r19-t059/README.md)
- Inputs: root theme toggles, independent subtree theme toggles, and three bounded input sizes (1, 3, 5 consumers).
- Expected result: toggling changes all consumers inside the provider; an independently provided subtree keeps its own state. Operation and render counts are reported.
- Check: `node 26_Context/applied-labs/r19-t059/check.mjs`

🎉 CONGRATULATIONS ! 🎉
[<< Day 25](../25_Custom_Hooks/25_custom_hooks.md) | [Day 27>>](../27_Ref/27_ref.md)
