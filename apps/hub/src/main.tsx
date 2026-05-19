import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// @ts-ignore
import './index.css'

// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker
registerSW({ immediate: true });

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
