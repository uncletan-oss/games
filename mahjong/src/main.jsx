import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

async function mulai() {
  // Saat `npm run dev` (di luar Apps Script) server dijalankan langsung di browser
  if (import.meta.env.DEV && !(window.google && window.google.script)) await import('./dev/gasMock.js');
  createRoot(document.getElementById('root')).render(<App />);
}
mulai();
