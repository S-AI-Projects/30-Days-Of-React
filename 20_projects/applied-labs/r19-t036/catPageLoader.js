// The extracted responsibility for the R19-T036 refactor lab:
// loading one page of the cat gallery.
//
// Before the refactor this lived inline in example.jsx, mixed in with
// the rendering and the request bookkeeping. It is now one clearly
// named function, loadCatPage(page), and example.jsx only owns UI state
// plus the request id that guards against stale responses. The
// contract is unchanged: same pages, same cats, same failure — the
// check in check.mjs is the captured behaviour that proves it.
//
// loadCatPage returns a promise of the cat names for that page. It
// simulates the real gallery's behaviour against the local fixture:
// each page has its own latency, and page 3 rejects on its first
// attempt so the retry path can be exercised. It never touches the
// DOM and never decides what the UI shows — that stays with the
// component, which is what makes the stale-response guard testable:
// a late promise resolving must not overwrite a newer page.
import { CAT_PAGES } from './fixture.mjs';

const failedOnce = new Set();

export function loadCatPage(page) {
  const spec = CAT_PAGES[page];
  if (!spec) {
    return Promise.reject(new Error(`Unknown page ${page}`));
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (spec.failFirstAttempt && !failedOnce.has(page)) {
        failedOnce.add(page);
        reject(new Error(`Failed to load page ${page}`));
        return;
      }
      resolve([...spec.cats]);
    }, spec.delayMs);
  });
}
