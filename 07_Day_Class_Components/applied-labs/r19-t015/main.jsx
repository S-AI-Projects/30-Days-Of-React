import React from 'react'
import { createRoot } from 'react-dom/client'
import App, { createEventSource } from './example.jsx'

// The event source is created here and INJECTED into the app as a prop.
// It is also exposed so the Playwright check can emit fixture events and count listeners.
const source = createEventSource()
window.__source = source

createRoot(document.getElementById('root')).render(<App source={source} />)
