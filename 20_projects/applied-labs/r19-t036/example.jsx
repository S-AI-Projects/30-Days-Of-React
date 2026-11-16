// R19-T036 applied lab: cat-gallery failure recovery (Day 20).
// A fixture-backed cat gallery with pagination, retry and a
// stale-response guard. Changing page replaces the records; a failed
// page shows an error with a Retry button; a slow page's late response
// can never overwrite a newer page.
//
// The page loading itself is not done here — it lives in
// catPageLoader.js as loadCatPage(page), the one responsibility
// extracted in this refactor. This component only owns UI state and
// one request id: every load bumps the id, and a resolving promise
// whose id is no longer the latest is ignored. That is the whole
// stale-response guard, and the check proves it by clicking page 1
// (slow, 700 ms) and then page 2 (fast, 80 ms) immediately after.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadCatPage } from './catPageLoader.js';
import { PAGE_COUNT } from './fixture.mjs';

export default function Example() {
  const [page, setPage] = useState(1);
  const [cats, setCats] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  const started = useRef(false);

  const loadPage = useCallback((nextPage) => {
    const id = ++requestId.current;
    setStatus('loading');
    setError(null);
    loadCatPage(nextPage).then(
      (names) => {
        if (id !== requestId.current) return; // stale response: ignore
        setCats(names);
        setPage(nextPage);
        setStatus('ready');
      },
      () => {
        if (id !== requestId.current) return; // stale failure: ignore
        setCats([]);
        setPage(nextPage);
        setError(`Failed to load page ${nextPage}.`);
        setStatus('error');
      }
    );
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    loadPage(1);
  }, [loadPage]);

  const statusText =
    status === 'loading'
      ? 'Loading…'
      : status === 'error'
        ? error
        : `Page ${page} of ${PAGE_COUNT}`;

  return (
    <main>
      <h1>Cat gallery</h1>
      <p>
        Three pages of cats from a local fixture. Page 3 fails on its
        first load — retry it. Page 1 is slow on purpose: click it and
        then page 2 straight away, and the late page 1 response must
        not overwrite page 2.
      </p>
      <p data-testid="status">{statusText}</p>
      {status === 'error' && (
        <button type="button" data-testid="retry" onClick={() => loadPage(page)}>
          Retry
        </button>
      )}
      <ul>
        {cats.map((name) => (
          <li key={name} data-testid="cat">
            {name}
          </li>
        ))}
      </ul>
      <div>
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            data-testid={`page-${n}`}
            disabled={n === page && status === 'ready'}
            onClick={() => loadPage(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </main>
  );
}
