import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const rootElement = document.getElementById('root');
if (rootElement) {
  // Read initial properties from data attributes if present
  const initialView = rootElement.getAttribute('data-view');
  const initialAuthType = rootElement.getAttribute('data-auth-type');
  
  createRoot(rootElement).render(
    <StrictMode>
      <App initialView={initialView} initialAuthType={initialAuthType} />
    </StrictMode>,
  );
}

