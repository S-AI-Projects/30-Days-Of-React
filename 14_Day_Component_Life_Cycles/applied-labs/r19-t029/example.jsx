import { Component, useState } from 'react';

// Local fixtures. Each scenario lists what the injected adapter returns on each call.
const makeItems = (count) => Array.from({ length: count }, (_, i) => `Item ${i + 1}`);

const SCENARIOS = {
  'size-1': { label: '200 response, 1 item', outcomes: [{ ok: true, count: 1 }] },
  'size-10': { label: '200 response, 10 items', outcomes: [{ ok: true, count: 10 }] },
  'size-100': { label: '200 response, 100 items', outcomes: [{ ok: true, count: 100 }] },
  'reject-retry': {
    label: 'Rejected request, then retry succeeds',
    outcomes: [{ ok: false, message: 'Network down' }, { ok: true, count: 3 }],
  },
};

// The injected adapter. It never touches the network, and it counts its own calls.
function createAdapter(scenario) {
  const stats = { calls: 0 };
  const adapter = () => {
    const outcome = scenario.outcomes[Math.min(stats.calls, scenario.outcomes.length - 1)];
    stats.calls += 1;
    return outcome.ok
      ? Promise.resolve(makeItems(outcome.count))
      : Promise.reject(new Error(outcome.message));
  };
  return { adapter, stats };
}

export class Loader extends Component {
  state = { status: 'loading', items: [], error: null };
  renders = 0; // render count, reported on the page instead of any timing
  unmounted = false;

  // Life cycle: load once when the component mounts.
  componentDidMount() {
    this.load();
  }

  // Life cycle: ignore a response that arrives after the component is gone.
  componentWillUnmount() {
    this.unmounted = true;
  }

  load = () => {
    this.props.adapter().then(
      (items) => {
        if (!this.unmounted) this.setState({ status: 'success', items, error: null });
      },
      (error) => {
        if (!this.unmounted) this.setState({ status: 'error', items: [], error: error.message });
      },
    );
  };

  retry = () => {
    this.setState({ status: 'loading', items: [], error: null });
    this.load();
  };

  render() {
    this.renders += 1;
    const { status, items, error } = this.state;
    const label = status === 'loading' ? 'Loading' : status === 'success' ? 'Loaded' : `Error: ${error}`;
    return (
      <section>
        <p>
          Status: <output data-testid="status">{label}</output>
        </p>
        {status === 'error' && (
          <button type="button" data-testid="retry" onClick={this.retry}>
            Retry
          </button>
        )}
        <ul data-testid="items">
          {items.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        <h2>Operation counts</h2>
        <p>
          Adapter calls: <output data-testid="calls">{this.props.stats.calls}</output>
        </p>
        <p>
          Loader renders: <output data-testid="renders">{this.renders}</output>
        </p>
      </section>
    );
  }
}

export default function App() {
  const [selection, setSelection] = useState(null);
  const [nonce, setNonce] = useState(0);

  // Every choice builds a fresh adapter and remounts the Loader.
  function choose(id) {
    setSelection({ id, ...createAdapter(SCENARIOS[id]) });
    setNonce((n) => n + 1);
  }

  return (
    <main>
      <h1>Adapter life cycle lab</h1>
      <p>
        {Object.entries(SCENARIOS).map(([id, scenario]) => (
          <button key={id} type="button" data-testid={`scenario-${id}`} onClick={() => choose(id)}>
            {scenario.label}
          </button>
        ))}
      </p>
      {selection ? (
        <Loader key={nonce} adapter={selection.adapter} stats={selection.stats} />
      ) : (
        <p data-testid="idle">No fixture selected</p>
      )}
    </main>
  );
}