// The explicit prop adapter — the whole third-party boundary lives here.
// App props come in ({ label, level }); third-party props go out
// ({ text, tone }). The wrapper never touches the vendor component's
// props directly, and the vendor component never sees app props.
//
// The call counter is the operation count the check reports: how many
// times the adapter ran while rendering a list. It is a count, not a
// timer — no speed threshold is imposed anywhere.
let adapterCalls = 0;

export function adaptBadgeProps({ label, level }) {
  adapterCalls += 1;
  const text = label.trim() === '' ? 'No label' : label.trim();
  const tone =
    level === 'error' ? 'error' : level === 'success' ? 'success' : 'info';
  return { text, tone };
}

export function getAdapterCalls() {
  return adapterCalls;
}

export function resetAdapterCalls() {
  adapterCalls = 0;
}
