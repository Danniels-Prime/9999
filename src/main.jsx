import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import LucidApp from './LucidApp.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LucidApp />
  </StrictMode>
);
