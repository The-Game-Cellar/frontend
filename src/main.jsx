import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

let scrollTimer;

document.addEventListener('scroll', () => {
  document.documentElement.classList.add('is-scrolling');
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => document.documentElement.classList.remove('is-scrolling'), 800);
}, { capture: true, passive: true });

createRoot(document.getElementById('root')).render(<App />)
