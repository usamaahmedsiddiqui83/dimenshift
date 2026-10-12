import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css';
import App from './App';

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Pages are pre-rendered at build time (scripts/prerender.mjs): adopt that markup instead of redrawing it,
// so nothing flashes or replays its entrance animation. A page without markup (dev server) renders fresh.
if (container.hasChildNodes()) hydrateRoot(container, app);
else createRoot(container).render(app);
