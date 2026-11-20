import { createRoot } from 'react-dom/client';
import Baseline from './baseline.jsx';
import Refactored from './example.jsx';

const version = new URLSearchParams(window.location.search).get('version');
const App = version === 'baseline' ? Baseline : Refactored;

createRoot(document.getElementById('root')).render(<App />);