import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Decisive condition: Base path configuration for non-root deployments
export const BASE_PATH = '/course';

export function Navigation() {
  return (
    <nav style={{ marginBottom: '16px', padding: '8px', background: '#eee', borderRadius: '4px' }}>
      <Link to="/" data-testid="link-home" style={{ marginRight: '12px' }}>
        Home
      </Link>
      <Link to="/lessons" data-testid="link-lessons" style={{ marginRight: '12px' }}>
        Lessons
      </Link>
      <Link to="/about" data-testid="link-about" style={{ marginRight: '12px' }}>
        About
      </Link>
      <Link to="/nonexistent" data-testid="link-unknown">
        Unknown Page
      </Link>
    </nav>
  );
}

export function Home() {
  return (
    <div data-testid="page-home">
      <h2>Course Home</h2>
      <p>Welcome to 30 Days Of React deployed under base path <code>/course/</code>.</p>
      <img
        src={`${BASE_PATH}/logo.svg`}
        alt="Course Logo"
        data-testid="asset-logo"
        style={{ width: '80px', height: '80px', display: 'block', margin: '12px 0' }}
      />
    </div>
  );
}

export function Lessons() {
  return (
    <div data-testid="page-lessons">
      <h2>Course Lessons</h2>
      <p>All 30 Days of React curriculum modules are accessible here.</p>
    </div>
  );
}

export function About() {
  return (
    <div data-testid="page-about">
      <h2>About This Course</h2>
      <p>Practical React instruction and applied lab activities.</p>
    </div>
  );
}

export function NotFound() {
  return (
    <div data-testid="not-found" style={{ color: '#c00', padding: '16px', background: '#fff0f0' }}>
      <h3>404 Not Found</h3>
      <p>The requested page under {BASE_PATH} does not exist.</p>
    </div>
  );
}

export function AppContent() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', maxWidth: '640px' }}>
      <h1>Day 28: Non-Root Base Path Deployment (R19-T060)</h1>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default function App({ customBase = BASE_PATH }) {
  return (
    <BrowserRouter basename={customBase}>
      <AppContent />
    </BrowserRouter>
  );
}
