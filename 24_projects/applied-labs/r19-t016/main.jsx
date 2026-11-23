import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './example.jsx'

// ?version=original or ?version=refactored (default: refactored)
const version = new URLSearchParams(window.location.search).get('version') ?? 'refactored'

createRoot(document.getElementById('root')).render(<App version={version} />)
