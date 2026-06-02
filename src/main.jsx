import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AethermindApp from './aethermind.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AethermindApp />
  </StrictMode>
);
