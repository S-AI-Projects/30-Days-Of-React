import React, { useState } from 'react'

// Local, deterministic event source: no timers, no randomness, no network.
export function createEventSource() {
  const listeners = new Set()
  return {
    addListener(fn) { listeners.add(fn) },
    removeListener(fn) { listeners.delete(fn) },
    emit(payload) { [...listeners].forEach((fn) => fn(payload)) },
    listenerCount() { return listeners.size },
  }
}

// CONTRIBUTION FOCUS: the event source is injected through props (not imported),
// so tests can supply a repeatable local fixture and count listeners.
class Notifier extends React.Component {
  state = { received: [] }

  // One stable handler, so removeListener removes exactly what addListener added.
  handleEvent = (event) => {
    this.setState((s) => ({ received: [...s.received, event] }))
  }

  componentDidMount() {
    this.props.source.addListener(this.handleEvent)
  }

  componentWillUnmount() {
    this.props.source.removeListener(this.handleEvent)
  }

  render() {
    const { received } = this.state
    return (
      <div>
        <ul data-testid="received">
          {received.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
        <p data-testid="count">Notifications: {received.length}</p>
      </div>
    )
  }
}

export default function App({ source }) {
  const [mounted, setMounted] = useState(true)
  return (
    <div>
      <h1>Class lifecycle cleanup lab</h1>
      <button onClick={() => setMounted((m) => !m)}>
        {mounted ? 'Unmount notifier' : 'Mount notifier'}
      </button>
      {mounted && <Notifier source={source} />}
    </div>
  )
}
