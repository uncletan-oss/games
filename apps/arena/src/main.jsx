import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Tinggi layar yang benar-benar terlihat (100vh di HP ikut menghitung area di balik bilah browser)
function aturTinggiLayar() {
  document.documentElement.style.setProperty('--tinggi-layar', window.innerHeight + 'px');
}
aturTinggiLayar();
window.addEventListener('resize', aturTinggiLayar);
window.addEventListener('orientationchange', () => setTimeout(aturTinggiLayar, 300));

createRoot(document.getElementById('root')).render(<App />);

// PWA: bisa dipasang ke layar utama HP dan dibuka tanpa internet (lawan BOT)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
