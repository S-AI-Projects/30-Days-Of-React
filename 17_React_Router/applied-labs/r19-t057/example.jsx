import React from 'react';
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';

export const ITEMS_DATABASE = [
  { id: 'item-1', title: 'Product Alpha', desc: 'High performance productivity tool.' },
  { id: 'item-2', title: 'Product Beta', desc: 'Advanced real-time analytics suite.' },
];

export function Navigation() {
  return (
    <nav aria-label="Main Navigation" style={{ marginBottom: '16px', padding: '8px', background: '#eee', borderRadius: '4px' }}>
      <Link to="/" data-testid="link-home" style={{ marginRight: '12px' }}>
        Home
      </Link>
      <Link to="/items/item-1" data-testid="link-item-1" style={{ marginRight: '12px' }}>
        Product Alpha
      </Link>
      <Link to="/items/item-2" data-testid="link-item-2" style={{ marginRight: '12px' }}>
        Product Beta
      </Link>
      <Link to="/items/unknown-999" data-testid="link-unknown">
        Unknown Record
      </Link>
    </nav>
  );
}

export function Home() {
  return (
    <div data-testid="home-view">
      <h2>Catalog Home</h2>
      <p>Welcome to the store catalog. Select an item above or from the list below:</p>
      <ul>
        {ITEMS_DATABASE.map((item) => (
          <li key={item.id} style={{ marginBottom: '6px' }}>
            <Link to={`/items/${item.id}`} data-testid={`catalog-link-${item.id}`}>
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DetailView() {
  const { id } = useParams();
  const item = ITEMS_DATABASE.find((entry) => entry.id === id);

  if (!item) {
    return (
      <div data-testid="not-found" style={{ color: '#c00', padding: '16px', background: '#fff0f0', borderRadius: '4px' }}>
        <h3>Not found</h3>
        <p>The requested record ID "{id}" could not be found.</p>
        <Link to="/" data-testid="back-to-home">Back to Home</Link>
      </div>
    );
  }

  return (
    <div data-testid="detail-view" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '4px', background: '#f9f9f9' }}>
      <h3 data-testid="detail-title">{item.title}</h3>
      <p data-testid="detail-desc">{item.desc}</p>
      <Link to="/" data-testid="back-to-home">Back to Home</Link>
    </div>
  );
}

export function NotFound() {
  return (
    <div data-testid="not-found" style={{ color: '#c00', padding: '16px', background: '#fff0f0', borderRadius: '4px' }}>
      <h3>Not found</h3>
      <p>The requested route does not exist.</p>
      <Link to="/">Back to Home</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'sans-serif', padding: '24px', maxWidth: '640px' }}>
        <h1>Day 17: Route Behavior Lab (R19-T057)</h1>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/items/:id" element={<DetailView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
