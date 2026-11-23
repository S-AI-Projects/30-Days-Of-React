import React from 'react'

// Local fixture: no API calls.
export const records = [
    { id: 1, title: 'Record A', body: 'Details for A' },
    { id: 2, title: 'Record B', body: 'Details for B' },
    { id: 3, title: 'Record C', body: 'Details for C' },
]

// CONTRIBUTION FOCUS (boundary): valid ids are whole numbers from 1 to records.length.
// Anything else (empty, text, 0, 4, 1.5) is invalid and means "no selection".
export function parseId(input, list = records) {
    const text = String(input).trim()
    if (!/^\d+$/.test(text)) return null
    const n = Number(text)
    return n >= 1 && n <= list.length ? n : null
}

// Presentational list. PureComponent: it re-renders only if its props change.
class RecordList extends React.PureComponent {
    renders = 0
    render() {
        this.renders += 1
        return (
            <ul data-testid="record-list" data-renders={this.renders}>
                {this.props.records.map((r) => (
                    <li key={r.id}>
                        <button onClick={() => this.props.onSelect(r.id)}>{r.title}</button>
                    </li>
                ))}
            </ul>
        )
    }
}

// Presentational detail panel with an empty state.
class RecordDetail extends React.Component {
    render() {
        const { record } = this.props
        if (!record) return <p data-testid="empty-state">No record selected.</p>
        return (
            <div data-testid="detail">
                <h2>{record.title}</h2>
                <p>{record.body}</p>
            </div>
        )
    }
}

// The parent owns the state (selectedId, jumpText). Children only receive props.
export default class RecordsApp extends React.Component {
    state = { selectedId: null, jumpText: '' }

    handleSelect = (id) => this.setState({ selectedId: id })
    handleClear = () => this.setState({ selectedId: null, jumpText: '' })
    handleJumpChange = (e) => this.setState({ jumpText: e.target.value })
    handleJump = () => this.setState({ selectedId: parseId(this.state.jumpText) })

    render() {
        const record = records.find((r) => r.id === this.state.selectedId) ?? null
        return (
            <div>
                <h1>Records</h1>
                <RecordList records={records} onSelect={this.handleSelect} />
                <input
                    aria-label="Jump to record id"
                    value={this.state.jumpText}
                    onChange={this.handleJumpChange}
                />
                <button onClick={this.handleJump}>Go</button>
                <button onClick={this.handleClear}>Clear selection</button>
                <RecordDetail record={record} />
            </div>
        )
    }
}