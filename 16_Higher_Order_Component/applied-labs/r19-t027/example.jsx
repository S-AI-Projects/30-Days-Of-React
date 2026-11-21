import { Component, PureComponent } from 'react';

// Higher-order component: wraps a component and shows how many times it has rendered.
// The wrapper is a PureComponent, so it re-renders only when its props change.
function withRenderCount(Wrapped, name) {
  class WithRenderCount extends PureComponent {
    renders = 0;

    render() {
      this.renders += 1;
      return (
        <div data-testid={`${name}-panel`} data-renders={this.renders}>
          <small>Renders: {this.renders}</small>
          <Wrapped {...this.props} />
        </div>
      );
    }
  }
  WithRenderCount.displayName = `withRenderCount(${name})`;
  return WithRenderCount;
}

// Presentational class components: they own no state.
class RecordList extends Component {
  render() {
    const { records, onSelect } = this.props;
    return (
      <ul>
        {records.map((record) => (
          <li key={record.id}>
            <button type="button" data-testid={`select-${record.id}`} onClick={() => onSelect(record.id)}>
              {record.name}
            </button>
          </li>
        ))}
      </ul>
    );
  }
}

class RecordDetail extends Component {
  render() {
    const { record } = this.props;
    if (!record) return <p data-testid="detail-output">No record selected</p>;
    return (
      <div>
        <h2 data-testid="detail-output">{record.name}</h2>
        <p data-testid="detail-body">{record.summary}</p>
      </div>
    );
  }
}

const CountedList = withRenderCount(RecordList, 'list');
const CountedDetail = withRenderCount(RecordDetail, 'detail');

// Local fixtures: no network calls.
const RECORDS = [
  { id: 'A', name: 'Record A', summary: 'First record: alpha notes.' },
  { id: 'B', name: 'Record B', summary: 'Second record: beta notes.' },
  { id: 'C', name: 'Record C', summary: 'Third record: gamma notes.' },
];

// Explicit state ownership: App owns selectedId. Nothing else holds state.
export default class App extends Component {
  state = { selectedId: null };

  // Stable references, so the list receives identical props on every render.
  select = (id) => this.setState({ selectedId: id });
  clear = () => this.setState({ selectedId: null });

  render() {
    // Intermediate state -> output: the selected record, or null for the empty state.
    const record = RECORDS.find((r) => r.id === this.state.selectedId) ?? null;
    return (
      <main>
        <h1>List and detail lab</h1>
        <p>
          <button type="button" data-testid="clear" onClick={this.clear}>
            Clear selection
          </button>
        </p>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <CountedList records={RECORDS} onSelect={this.select} />
          <CountedDetail record={record} />
        </div>
        <h2>State owned by App</h2>
        <pre data-testid="state">{JSON.stringify(this.state)}</pre>
      </main>
    );
  }
}