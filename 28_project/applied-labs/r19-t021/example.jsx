import { useEffect, useState } from 'react';

// Vite fills this in from `base` in vite.config.js ("/course/").
const BASE = import.meta.env.BASE_URL;

const ROUTES = {
  '/': 'Home',
  '/about': 'About',
  '/countries': 'Countries',
};

// Local fixture data, no network calls.
const COUNTRIES = ['Finland', 'India', 'Japan'];

// "/course/about" -> "/about"
function toRoute(pathname) {
  let path = pathname;
  if (path.startsWith(BASE)) path = '/' + path.slice(BASE.length);
  else if (path + '/' === BASE) path = '/';
  return path.replace(/\/+$/, '') || '/';
}

// "/about" -> "/course/about"
function toHref(route) {
  return BASE.replace(/\/$/, '') + route;
}

export default function App() {
  const [route, setRoute] = useState(() => toRoute(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(toRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function go(event, next) {
    event.preventDefault();
    window.history.pushState({}, '', toHref(next));
    setRoute(next);
  }

  return (
    <main>
      <img src={`${BASE}logo.svg`} alt="Course logo" width="48" height="48" data-testid="logo" />
      <nav style={{ display: 'flex', gap: '1rem' }}>
        {Object.entries(ROUTES).map(([path, label]) => (
          <a key={path} href={toHref(path)} onClick={(e) => go(e, path)}>
            {label}
          </a>
        ))}
      </nav>
      <h1 data-testid="page-title">{ROUTES[route] ?? 'Not found'}</h1>
      {route === '/countries' && (
        <ul data-testid="country-list">
          {COUNTRIES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
    </main>
  );
}