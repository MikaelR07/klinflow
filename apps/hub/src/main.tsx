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


// Remove the HTML splash screen only AFTER React has painted.
// Double rAF ensures the browser has committed at least one frame
// with the React LoadingScreen visible before we remove the HTML one.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const loader = document.getElementById("initial-loader");
    if (loader) {
      loader.remove();
    }
  });
});
