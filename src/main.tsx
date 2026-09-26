import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initPwaSync } from './services/offline/pwaSync';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found in DOM');
}

// Plan §8.4: boot the offline-first layer (service worker + IndexedDB
// write-ahead mutation queue) before the app renders so mutations are
// covered from the first interaction.
initPwaSync();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
