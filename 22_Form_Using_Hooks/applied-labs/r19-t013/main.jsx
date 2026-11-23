import React from 'react'
import { createRoot } from 'react-dom/client'
import App, { bus } from './example.jsx'

// Exposed only so the Playwright check can count active listeners.
window.__bus = bus

createRoot(document.getElementById('root')).render(<App />)
