import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initPwaSync } from './services/offline/pwaSync';
import { telemetryService } from './services/telemetry/telemetry.service';
import { aiTelemetry } from './utils/ai/telemetry';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found in DOM');
}

// Plan §8.4: boot the offline-first layer (service worker + IndexedDB
// write-ahead mutation queue) before the app renders so mutations are
// covered from the first interaction.
initPwaSync();

// Phase 0 (P0-08): install the error sink + window handlers, and give the
// previously-unconsumed AI latency telemetry its consumer (X5 sink-or-delete).
// Opt-in is respected: nothing is recorded for users who have not opted in,
// and prompt/completion text never enters the sink.
telemetryService.init();
aiTelemetry.subscribe((record) => {
  telemetryService.consumeAiRecord({
    operation: record.operation,
    durationMs: record.totalDurationMs,
    promptTokens: record.promptTokens,
    completionTokens: record.completionTokens,
    estimatedCostUsd: record.estimatedCostUsd
  });
});

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
