import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@klinflow/ui/src/index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker
registerSW({ immediate: true });


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);


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
