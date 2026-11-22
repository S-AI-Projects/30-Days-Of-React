import React, { useState, useEffect } from 'react';

// Shared event emitter source with listener inspection
export class EventHub {
  constructor() {
    this.listeners = new Map();
    this.subscribers = new Set();
  }

  subscribe(channel, callback) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel).add(callback);
    this.notifySubscribers();

    return () => {
      const set = this.listeners.get(channel);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(channel);
        }
      }
      this.notifySubscribers();
    };
  }

  emit(channel, data) {
    const set = this.listeners.get(channel);
    if (set) {
      for (const cb of set) {
        cb(data);
      }
    }
  }

  getActiveCount() {
    let total = 0;
    for (const set of this.listeners.values()) {
      total += set.size;
    }
    return total;
  }

  onChange(subscriber) {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  notifySubscribers() {
    const count = this.getActiveCount();
    for (const sub of this.subscribers) {
      sub(count);
    }
  }
}

export const globalHub = new EventHub();

export function SubscriberChild({ channel, hub }) {
  const [lastMsg, setLastMsg] = useState(null);
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    // Subscription with cleanup function
    const unsubscribe = hub.subscribe(channel, (payload) => {
      setLastMsg(payload);
      setMsgCount((c) => c + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [channel, hub]);

  return (
    <div data-testid="subscriber-panel" style={{ border: '1px solid #0070f3', padding: '16px', borderRadius: '4px' }}>
      <h3>Active Subscriber</h3>
      <p>Subscribed Channel: <strong data-testid="subscribed-channel">{channel}</strong></p>
      <p>Received Count: <span data-testid="received-count">{msgCount}</span></p>
      <p>Last Message: <span data-testid="last-message">{lastMsg || '(none)'}</span></p>
    </div>
  );
}

export default function App() {
  const [channel, setChannel] = useState('channel-A');
  const [mounted, setMounted] = useState(true);
  const [activeCount, setActiveCount] = useState(globalHub.getActiveCount());

  useEffect(() => {
    const unsub = globalHub.onChange((count) => setActiveCount(count));
    setActiveCount(globalHub.getActiveCount());
    return unsub;
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', maxWidth: '640px' }}>
      <h1>Day 22: Effect Cleanup & State Invariant (R19-T054)</h1>
      <p>
        <strong>System Invariant:</strong> Active Listeners Count === (Mounted ? 1 : 0)
      </p>

      <div style={{ background: '#f0f0f0', padding: '12px', marginBottom: '16px', borderRadius: '4px' }}>
        Active Listeners Count: <strong data-testid="active-listeners-count">{activeCount}</strong>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          data-testid="btn-channel-a"
          onClick={() => setChannel('channel-A')}
          disabled={!mounted || channel === 'channel-A'}
        >
          Switch to Channel A
        </button>
        <button
          data-testid="btn-channel-b"
          onClick={() => setChannel('channel-B')}
          disabled={!mounted || channel === 'channel-B'}
        >
          Switch to Channel B
        </button>
        <button
          data-testid="btn-toggle-mount"
          onClick={() => setMounted((m) => !m)}
        >
          {mounted ? 'Unmount Subscriber' : 'Mount Subscriber'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          data-testid="btn-emit-a"
          onClick={() => globalHub.emit('channel-A', 'Event A message')}
        >
          Emit Event on Channel A
        </button>
        <button
          data-testid="btn-emit-b"
          onClick={() => globalHub.emit('channel-B', 'Event B message')}
        >
          Emit Event on Channel B
        </button>
      </div>

      {mounted ? (
        <SubscriberChild channel={channel} hub={globalHub} />
      ) : (
        <div data-testid="unmounted-msg" style={{ padding: '16px', color: '#666', border: '1px dashed #ccc' }}>
          Subscriber component is unmounted. Zero active listeners.
        </div>
      )}
    </div>
  );
}
