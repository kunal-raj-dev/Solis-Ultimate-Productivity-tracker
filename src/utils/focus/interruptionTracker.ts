/**
 * Solis — Attentional Friction & Interruption Tracking Engine (Feature 2.5)
 *
 * Implements a non-punitive, metacognitive distraction tracking model that distinguishes
 * internal cognitive wandering (impulses, daydreams, urge to check notifications) from
 * external environment intrusions (knocks, phone calls, loud interruptions).
 */

import { InterruptionEvent, InterruptionType } from '../../types/focus';

export interface DistractionSummary {
  internalCount: number;
  externalCount: number;
  totalCount: number;
  focusScore: number; // 0..100
  frictionTier: 'pristine' | 'mild' | 'moderate' | 'high';
  frictionLabel: string;
  reflectionPrompt: string;
  cognitiveInsight: string;
}

/**
 * Creates a normalized InterruptionEvent object.
 */
export function createInterruptionEvent(
  type: InterruptionType,
  note?: string,
  now: Date = new Date()
): InterruptionEvent {
  return {
    id: `intr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    timestamp: now.toISOString(),
    note: note?.trim() || undefined
  };
}

/**
 * Computes attentional friction metrics and non-punitive metacognitive guidance.
 */
export function calculateDistractionSummary(
  interruptions: InterruptionEvent[] | { internal: number; external: number } | number,
  sessionMinutes: number = 25
): DistractionSummary {
  let internalCount = 0;
  let externalCount = 0;

  if (Array.isArray(interruptions)) {
    internalCount = interruptions.filter((i) => i.type === 'internal').length;
    externalCount = interruptions.filter((i) => i.type === 'external').length;
  } else if (typeof interruptions === 'object' && interruptions !== null) {
    internalCount = Math.max(0, interruptions.internal || 0);
    externalCount = Math.max(0, interruptions.external || 0);
  } else if (typeof interruptions === 'number') {
    // If only a flat number was provided, split evenly or attribute to internal
    internalCount = Math.max(0, interruptions);
    externalCount = 0;
  }

  const totalCount = internalCount + externalCount;

  // Scale deduction relative to session length: a 90m session tolerates more interruptions than a 25m session
  const safeSessionMinutes = Math.max(15, sessionMinutes);
  const penaltyPerInterruption = Math.max(6, Math.min(15, 250 / safeSessionMinutes));
  const rawScore = 100 - totalCount * penaltyPerInterruption;
  const focusScore = Math.max(15, Math.min(100, Math.round(rawScore)));

  let frictionTier: DistractionSummary['frictionTier'] = 'pristine';
  let frictionLabel = 'Pristine Flow';
  let reflectionPrompt = 'Flawless attentional absorption — zero friction observed.';

  if (totalCount === 0) {
    frictionTier = 'pristine';
    frictionLabel = 'Pristine Flow';
    reflectionPrompt = 'Uninterrupted immersion. Your neural rhythm was locked into the material.';
  } else if (totalCount <= 2) {
    frictionTier = 'mild';
    frictionLabel = 'Mild Turbulence';
    reflectionPrompt = 'Normal cognitive recalibration. You caught the distraction and returned smoothly.';
  } else if (totalCount <= 4) {
    frictionTier = 'moderate';
    frictionLabel = 'Noticeable Friction';
    reflectionPrompt = 'Distractions competed for working memory. Consider testing pink noise or a 2-minute centering pause.';
  } else {
    frictionTier = 'high';
    frictionLabel = 'Fragmented Attention';
    reflectionPrompt = 'High friction session. Treat this with curiosity, not frustration — take a true break before resuming.';
  }

  let cognitiveInsight = '';
  if (totalCount === 0) {
    cognitiveInsight = 'Deep absorption state achieved. Retain this environment configuration for future deep work.';
  } else if (internalCount > externalCount) {
    cognitiveInsight = `${internalCount} of ${totalCount} distractions were internal mind drift. Using the Cognitive Drift Pad to park stray thoughts prevents intrusive loop exhaustion.`;
  } else if (externalCount > internalCount) {
    cognitiveInsight = `${externalCount} of ${totalCount} distractions came from external surroundings. Consider muting alerts or establishing a dedicated study boundary.`;
  } else {
    cognitiveInsight = `Balanced mix of internal impulses and external triggers. Brief centering breaths help stabilize neural readiness.`;
  }

  return {
    internalCount,
    externalCount,
    totalCount,
    focusScore,
    frictionTier,
    frictionLabel,
    reflectionPrompt,
    cognitiveInsight
  };
}
