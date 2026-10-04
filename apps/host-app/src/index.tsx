import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyRuntimeConfig } from './remote/applyRuntimeConfig';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

// Apply the runtime config first, so the remote is registered before Step 1 asks for it.
void applyRuntimeConfig().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
