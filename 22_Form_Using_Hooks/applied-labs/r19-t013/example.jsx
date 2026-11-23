import React, { useEffect, useState } from 'react'

// Local event source (no network). Tracks active listeners per channel.
export function createBus() {
  const listeners = { A: new Set(), B: new Set() }
  return {
    subscribe(channel, fn) {
      listeners[channel].add(fn)
      return () => { listeners[channel].delete(fn) }
    },
    publish(channel, message) {
      ;[...listeners[channel]].forEach((fn) => fn(message))
    },
    counts() {
      return { A: listeners.A.size, B: listeners.B.size }
    },
  }
}

export const bus = createBus()

function Subscriber({ channel }) {
  const [last, setLast] = useState('none')

  useEffect(() => {
    setLast('none')
    const unsubscribe = bus.subscribe(channel, setLast)
    // CONTRIBUTION FOCUS: cleanup removes the old subscription when `channel`
    // changes, and removes the last one on unmount (zero listeners left).
    return () => { unsubscribe() }
  }, [channel])

  return <p data-testid="last-message">Last message: {last}</p>
}

export default function App() {
  const [channel, setChannel] = useState('A')
  const [mounted, setMounted] = useState(true)

  return (
    <div>
      <h1>Effect cleanup lab</h1>
      <button onClick={() => setChannel('A')}>Subscribe to A</button>
      <button onClick={() => setChannel('B')}>Subscribe to B</button>
      <button onClick={() => setMounted((m) => !m)}>
        {mounted ? 'Unmount subscriber' : 'Mount subscriber'}
      </button>
      <button onClick={() => bus.publish('A', 'msg-A')}>Publish to A</button>
      <button onClick={() => bus.publish('B', 'msg-B')}>Publish to B</button>
      {mounted && <Subscriber channel={channel} />}
    </div>
  )
}
