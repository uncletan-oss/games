import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { MODE_LOKAL } from './api.js';

async function mulai() {
  if (MODE_LOKAL) await import('./dev/gasMock.js');
  createRoot(document.getElementById('root')).render(<App />);
}
mulai();
