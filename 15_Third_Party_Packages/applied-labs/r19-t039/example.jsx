// R19-T039 applied lab: third-party boundary (Day 15).
// AppBadge is the application component: it takes app props
// ({ label, level }), runs them through the explicit adapter, and
// hands the result to a display component. The display component is
// injected (default: the third-party one), so the wrapper can be
// tested with the StubBadge instead.
import React from 'react';
import ThirdPartyBadge from './thirdPartyBadge.jsx';
import StubBadge from './stubBadge.jsx';
import {
  adaptBadgeProps,
  getAdapterCalls,
  resetAdapterCalls,
} from './adaptBadgeProps.js';
import { makeItems } from './fixture.mjs';

export function AppBadge({ label, level, DisplayComponent = ThirdPartyBadge }) {
  const props = adaptBadgeProps({ label, level });
  return <DisplayComponent {...props} />;
}

function BadgeList({ items, testId }) {
  // Clear the counter before this list renders. The AppBadge children
  // render after this function returns, so each of their adapter calls
  // lands after the reset — and the ListReport sibling after this list
  // reads the count once they have all rendered.
  resetAdapterCalls();
  const badges = items.map((item, i) => (
    <AppBadge key={i} label={item.label} level={item.level} />
  ));
  return (
    <div data-testid={testId}>
      {badges}
      <p data-testid={`${testId}-count`}>{items.length}</p>
    </div>
  );
}

// Reads the adapter-call count for the list just above it. Sibling
// order is render order, so this runs after that list's badges have
// rendered — the count is final by the time it is read.
function ListReport({ testId }) {
  const calls = getAdapterCalls();
  return <p data-testid={testId}>{calls}</p>;
}

export default function Example() {
  const items1 = makeItems(1);
  const items10 = makeItems(10);
  const items100 = makeItems(100);
  return (
    <main>
      <h1>Badges</h1>
      <section data-testid="badge-known">
        <AppBadge label="Ada Lovelace" level="success" />
      </section>
      <section data-testid="badge-empty">
        <AppBadge label="" level="error" />
      </section>
      <section data-testid="stub-known">
        <AppBadge label="Ada" level="success" DisplayComponent={StubBadge} />
      </section>
      <section data-testid="stub-empty">
        <AppBadge label="   " level="error" DisplayComponent={StubBadge} />
      </section>
      <BadgeList items={items1} testId="list-1" />
      <ListReport testId="list-1-calls" />
      <BadgeList items={items10} testId="list-10" />
      <ListReport testId="list-10-calls" />
      <BadgeList items={items100} testId="list-100" />
      <ListReport testId="list-100-calls" />
    </main>
  );
}
