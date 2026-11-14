<div align="center">
  <h1> 30 Days Of React: useRef</h1>
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

[<< Day 25](../25_Custom_Hooks/25_custom_hooks.md) | [Day 27>>]()

![30 Days of React banner](../images/30_days_of_react_banner_day_27.jpg)

# useRef

In this challenge we have covered, how to handle uncontrolled input data. In this section, we will use the useRef hooks to get input data or to access any DOM element in your React application.

The useRef returns a mutable ref object whose .current property is initialized to the passed argument (initialValue). The returned object will persist for the full lifetime of the component.

In the following example, we see how to get data from input and access elements from the DOM tree using useRef hook.

## Getting Data from input

Let's get data from uncontrolled input element.

```js
import React, { useRef } from 'react'
import ReactDOM from 'react-dom'

const App = (props) => {
  const ref = useRef(null)
  const onClick = () => {
    let value = ref.current.value
    alert(value)
  }
  return (
    <div className='App'>
      <h1>How to use data from uncontrolled input using useRef</h1>
      <input type='text' ref={ref} />
      <br />
      <button onClick={onClick}>Get Input Data</button>
    </div>
  )
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)
```

## Focus

Using the useRef we can trigger the focus event on input.

```js
import React, { useRef } from 'react'
import ReactDOM from 'react-dom'

const App = (props) => {
  const ref = useRef(null)
  const onClick = () => {
    ref.current.focus()
  }
  return (
    <div className='App'>
      <h1>How to focus on input element useRef</h1>
      <input type='text' ref={ref} />
      <br />
      <button onClick={onClick}>Click to Focus on input</button>
    </div>
  )
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)
```

## Getting Content from DOM tree

Don't touch the DOM when you develop a React application because React has its own way to manipulate the DOM using the virtual DOM. In case, we get interested to get some content from the DOM tree we can use the useRef hook. See the example:

```js
import React, { useRef } from 'react'
import ReactDOM from 'react-dom'

const App = (props) => {
  const ref = useRef(null)
  const onClick = () => {
    let content = ref.current.textContent
    alert(content)
    console.log(content)
  }
  return (
    <div className='App'>
      <h1 ref={ref}>How to getting content from the DOM tree</h1>
      <button onClick={onClick}>Getting Content</button>
    </div>
  )
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)
```

## Accessing and Styling a DOM element

We can access and style an element from the DOM tree. See the example below:

```js
import React, { useRef } from 'react'
import ReactDOM from 'react-dom'

const App = (props) => {
  const ref = useRef(null)
  const onClick = () => {
    ref.current.style.backgroundColor = '#61dbfb'
    ref.current.style.padding = '50px'
    ref.current.style.textAlign = 'center'
  }
  return (
    <div className='App'>
      <h1 ref={ref}>How to style HTML from the DOM tree using useRef</h1>
      <button onClick={onClick}>Style it</button>
    </div>
  )
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement
```

# Exercises

1. Develop the following [application](https://www.30daysofreact.com/day-27/hexadecimal-colors). The application generates 27 hexadecimal colors by default. If the generate button get clicked it will generate another new 27 hexadecimal colors.

### Added Activity: Applied Lab R19-T002 — Ref Focus Management & Boundary Lab
- **Lab Location:** [applied-labs/r19-t002](./applied-labs/r19-t002/)
- **Description:** Demonstrates DOM ref focus transitions in an accessible dialog workflow. Uses `useRef` to programmatically focus a labelled input on open, and restores focus to the invoking trigger button on dismissal. Uncontrolled text entry guarantees zero re-renders.
- **Boundary Condition:** The submission handler validates against empty and whitespace-only entries (`trimmed.length === 0`). When this boundary condition is breached, the dialog stays open, displays an inline validation alert (`Input cannot be empty. Please provide valid text.`), and re-focuses the input element via ref so the user can immediately correct the input.
- **Inputs:** Trigger click events, modal close requests, typing into the uncontrolled input field, and form submissions (both invalid empty inputs and valid strings).
- **Expected Result:** Dialog open moves focus to `#feedback-input`. Normal typing increments 0 re-renders. Empty submission triggers boundary error without closing dialog and retains input focus. Valid submission commits text, closes dialog, and restores focus to `#trigger-btn`.

🎉 CONGRATULATIONS ! 🎉

[<< Day 25](../25_Custom_Hooks/25_custom_hooks.md) | [Day 27>>]()
