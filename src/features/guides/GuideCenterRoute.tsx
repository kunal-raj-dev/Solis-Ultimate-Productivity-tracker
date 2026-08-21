/**
 * GuideCenterRoute V2 — Dedicated Guide Center Route Component
 *
 * Renders the full GuideCenterPage as a real routed page within the AppShell.
 * Supports:
 *   /app/guides          → Guide directory (no guide selected)
 *   /app/guides/:guideId → Specific guide with step navigation
 */
import React from 'react';
import { GuideCenterPage } from './GuideCenterPage';

export const GuideCenterRoute: React.FC = () => {
  return <GuideCenterPage />;
};
