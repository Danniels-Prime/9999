import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PhonicsApp from './PhonicsApp.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PhonicsApp />
  </StrictMode>
);
