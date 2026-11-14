import React, { useState, useEffect } from 'react'

/**
 * Local items fixture
 */
export const ITEMS = [
  { id: '1', title: 'React Basics', description: 'Core components and props fundamentals.' },
  { id: '2', title: 'State Management', description: 'Interactive hooks and state updates.' },
  { id: '3', title: 'Routing Patterns', description: 'Declarative routing and navigation history.' },
]

/**
 * Independent Reference Route Resolver Table
 * Contribution Focus: Provides an independent reference model for expected route behavior.
 */
export const ROUTE_REFERENCE_TABLE = [
  {
    path: '/',
    view: 'home',
    heading: 'Course Topics',
    content: 'Select a course topic to view details.',
  },
  {
    path: '/item/1',
    view: 'detail',
    heading: 'React Basics',
    content: 'Core components and props fundamentals.',
  },
  {
    path: '/item/2',
    view: 'detail',
    heading: 'State Management',
    content: 'Interactive hooks and state updates.',
  },
  {
    path: '/item/3',
    view: 'detail',
    heading: 'Routing Patterns',
    content: 'Declarative routing and navigation history.',
  },
  {
    path: '/item/999',
    view: 'not-found',
    heading: 'Not Found',
    content: 'Topic with ID "999" was not found.',
  },
  {
    path: '/unknown',
    view: 'not-found',
    heading: 'Not Found',
    content: 'The requested route does not exist.',
  },
]

/**
 * Pure reference resolution function
 */
export function referenceResolve(path) {
  const match = ROUTE_REFERENCE_TABLE.find((entry) => entry.path === path)
  if (match) return match

  if (path.startsWith('/item/')) {
    const id = path.replace('/item/', '')
    const item = ITEMS.find((i) => i.id === id)
    if (item) {
      return { view: 'detail', heading: item.title, content: item.description }
    }
    return { view: 'not-found', heading: 'Not Found', content: `Topic with ID "${id}" was not found.` }
  }

  return { view: 'not-found', heading: 'Not Found', content: 'The requested route does not exist.' }
}

/**
 * Custom accessible Link component that intercepts click and uses History API
 */
export function Link({ to, children, ...props }) {
  const handleClick = (e) => {
    e.preventDefault()
    if (window.location.pathname !== to) {
      window.history.pushState({}, '', to)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}

/**
 * Main Router App
 */
export function App() {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  )

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Resolve active view
  let view = 'home'
  let activeItem = null
  let requestedId = null

  if (currentPath === '/' || currentPath === '') {
    view = 'home'
  } else if (currentPath.startsWith('/item/')) {
    requestedId = currentPath.replace('/item/', '')
    activeItem = ITEMS.find((item) => item.id === requestedId)
    view = activeItem ? 'detail' : 'not-found'
  } else {
    view = 'not-found'
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '30px auto' }}>
      <header>
        <h1>React Router Lab (R19-T003)</h1>
        <nav aria-label="Main Navigation" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <Link to="/" data-testid="nav-home">Home</Link>
          <Link to="/item/1" data-testid="nav-item-1">Topic 1</Link>
          <Link to="/item/2" data-testid="nav-item-2">Topic 2</Link>
          <Link to="/item/999" data-testid="nav-unknown">Unknown ID</Link>
        </nav>
      </header>

      <main data-testid="route-container" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px' }}>
        {view === 'home' && (
          <section data-testid="view-home">
            <h2 data-testid="view-title">Course Topics</h2>
            <p data-testid="view-description">Select a course topic to view details.</p>
            <ul>
              {ITEMS.map((item) => (
                <li key={item.id}>
                  <Link to={`/item/${item.id}`} data-testid={`item-link-${item.id}`}>
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {view === 'detail' && activeItem && (
          <section data-testid="view-detail">
            <h2 data-testid="view-title">{activeItem.title}</h2>
            <p data-testid="view-description">{activeItem.description}</p>
            <p>
              <small>Topic ID: <code data-testid="item-id">{activeItem.id}</code></small>
            </p>
            <Link to="/" data-testid="back-to-home">← Back to Topics</Link>
          </section>
        )}

        {view === 'not-found' && (
          <section data-testid="view-not-found">
            <h2 data-testid="view-title" style={{ color: '#d32f2f' }}>Not Found</h2>
            <p data-testid="view-description">
              {requestedId
                ? `Topic with ID "${requestedId}" was not found.`
                : 'The requested route does not exist.'}
            </p>
            <Link to="/" data-testid="not-found-home-link">Return to Home</Link>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
