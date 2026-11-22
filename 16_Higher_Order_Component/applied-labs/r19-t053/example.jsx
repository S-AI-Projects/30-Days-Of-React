import React from 'react';

// Class component for detail panel
export class DetailPanel extends React.Component {
  render() {
    const { record } = this.props;
    if (!record) {
      return (
        <div data-testid="detail-empty" style={{ padding: '16px', color: '#666', border: '1px dashed #ccc' }}>
          No record selected. Please select a record from the list.
        </div>
      );
    }
    return (
      <div data-testid="detail-content" style={{ padding: '16px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
        <h3 data-testid="detail-title">{record.title}</h3>
        <p data-testid="detail-desc">{record.content}</p>
      </div>
    );
  }
}

// Class component for list
export class RecordList extends React.Component {
  render() {
    const { records, selectedId, onSelect } = this.props;
    return (
      <ul data-testid="record-list" style={{ listStyle: 'none', padding: 0 }}>
        {records.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <li
              key={item.id}
              data-testid={`item-${item.id}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                marginBottom: '6px',
                border: isSelected ? '2px solid #0070f3' : '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <span>{item.title}</span>
              <button
                data-testid={`btn-select-${item.id}`}
                onClick={() => onSelect(item.id)}
                style={{ padding: '4px 10px' }}
              >
                {isSelected ? 'Selected' : 'Select'}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }
}

// Main class component with explicit state ownership
export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      records: [
        { id: 'rec-a', title: 'Record Alpha', content: 'Details for record Alpha.' },
        { id: 'rec-b', title: 'Record Beta', content: 'Details for record Beta.' },
      ],
      selectedId: null,
    };
  }

  handleSelect = (id) => {
    this.setState({ selectedId: id });
  };

  handleClear = () => {
    this.setState({ selectedId: null });
  };

  render() {
    const { records, selectedId } = this.state;
    const selectedRecord = records.find((r) => r.id === selectedId) || null;

    return (
      <div style={{ fontFamily: 'sans-serif', padding: '24px', maxWidth: '600px' }}>
        <h1>Day 16: List / Detail Integration (R19-T053)</h1>
        <p>Contract: Class patterns with explicit state ownership. Selecting updates detail; clearing shows empty state.</p>

        <div style={{ marginBottom: '16px' }}>
          <button data-testid="btn-clear-selection" onClick={this.handleClear}>
            Clear Selection
          </button>
        </div>

        <h2>Records</h2>
        <RecordList records={records} selectedId={selectedId} onSelect={this.handleSelect} />

        <h2>Detail Panel</h2>
        <DetailPanel record={selectedRecord} />
      </div>
    );
  }
}
