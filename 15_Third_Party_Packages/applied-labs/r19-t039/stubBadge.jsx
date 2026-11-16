// Test stub for the third-party component. It renders the props it
// received as JSON, so the check can assert exactly what the adapter
// handed over — without the real vendor component in the way.
export default function StubBadge(props) {
  return <pre>{JSON.stringify(props)}</pre>;
}
