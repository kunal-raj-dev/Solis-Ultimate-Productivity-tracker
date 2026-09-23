/**
 * Solis Creative Intelligence — Circadian Knowledge Compounding & Synthesis Engine
 * 
 * Synthesizes biological solar chronobiology with empirical spaced retention (Ebbinghaus decay),
 * Bloom's taxonomy topic mastery, and daily cognitive capacity limits.
 * 
 * Developed via the 6-Phase Creative Intelligence Engine.
 */

import { Task } from '../../types/task';
import { StudyPlanItem, StudySubject } from '../../types/study';
import {
  ExplainableRecommendation,
  LearningIntelligenceSnapshot
} from '../../types/learningIntelligence';

export type CircadianPhase = 'dawn' | 'zenith' | 'dusk' | 'night';

export type CircadianCognitiveArchetype =
  | 'intentional_grounding' // Dawn: planning, horizon calibration, conceptual outlines
  | 'deep_breakthrough'    // Zenith: peak prefrontal bandwidth, complex proofs, high-difficulty mastery
  | 'spaced_consolidation' // Dusk: memory schema stabilization, active flashcard retrieval
  | 'archival_reflection'; // Night: low-arousal consolidation, journaling, ritual closure

export interface CircadianResonanceResult {
  phase: CircadianPhase;
  solarTimestamp: string;
  solarElevationDegrees: number;
  archetype: CircadianCognitiveArchetype;
  archetitle: string;
  advice: string;
  biologicalContext: string;
  capacityRemainingMinutes: number;
  capacityPercentUsed: number;
  isCeilingReached: boolean;
  primaryAction: ExplainableRecommendation | null;
  secondaryActions: ExplainableRecommendation[];
  resonanceMetrics: {
    circadianFitScore: number;     // 0 - 100
    retentionDecayUrgency: number;  // 0 - 100
    prefrontalBandwidth: number;   // 0 - 100
  };
}

export interface CircadianSynthesisInput {
  currentDate?: Date;
  workload: {
    totalPlannedMinutes?: number;
    totalEstimatedMinutes?: number;
    dailyCapacityMinutes?: number;
    remainingCapacityMinutes?: number;
  };
  snapshot?: LearningIntelligenceSnapshot | null;
  tasks?: Task[];
  studyPlan?: StudyPlanItem[];
  subjects?: StudySubject[];
}

/**
 * Calculates current solar phase and angular elevation.
 */
export function calculateSolarPhase(date: Date = new Date()): {
  phase: CircadianPhase;
  elevationDegrees: number;
  solarTimestamp: string;
} {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeDecimal = hours + minutes / 60;

  // Approximate solar elevation (-90° nadir to +90° zenith)
  // Solar noon centered at 13:00 (780 mins from midnight)
  const solarNoon = 13;
  const hourAngle = ((timeDecimal - solarNoon) / 12) * Math.PI; // -pi to +pi
  const elevation = Math.round(90 * Math.cos(hourAngle));

  const solarTimestamp = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} SOLAR TIME`;

  let phase: CircadianPhase;
  if (timeDecimal >= 5 && timeDecimal < 11) {
    phase = 'dawn';
  } else if (timeDecimal >= 11 && timeDecimal < 17) {
    phase = 'zenith';
  } else if (timeDecimal >= 17 && timeDecimal < 21) {
    phase = 'dusk';
  } else {
    phase = 'night';
  }

  return { phase, elevationDegrees: elevation, solarTimestamp };
}

/**
 * Maps circadian phase to cognitive demand multipliers.
 */
function getPhaseDemandMultiplier(
  phase: CircadianPhase,
  recommendationType: ExplainableRecommendation['type']
): number {
  switch (phase) {
    case 'zenith':
      // Peak analytical velocity: Boost deep study and complex synthesis
      if (recommendationType === 'syllabus_continuation' || recommendationType === 'concept_synthesis') return 1.45;
      if (recommendationType === 'routine_continuation') return 0.75;
      return 1.0;

    case 'dusk':
      // Memory consolidation window: Boost spaced retrieval and retention interventions
      if (recommendationType === 'spaced_retrieval' || recommendationType === 'retention_intervention') return 1.55;
      if (recommendationType === 'concept_synthesis') return 0.9;
      return 1.0;

    case 'dawn':
      // Intentional priming & horizon calibration
      if (recommendationType === 'syllabus_continuation') return 1.35;
      if (recommendationType === 'subject_rebalance') return 1.25;
      return 1.0;

    case 'night':
      // Low arousal, cognitive closure
      if (recommendationType === 'routine_continuation') return 1.5;
      if (recommendationType === 'concept_synthesis') return 0.55; // Discourage heavy analytical proofs before sleep
      return 0.8;
  }
}

/**
 * Synthesizes circadian biological state with learning recommendations.
 */
export function synthesizeCircadianResonance(
  input: CircadianSynthesisInput
): CircadianResonanceResult {
  const now = input.currentDate || new Date();
  const { phase, elevationDegrees, solarTimestamp } = calculateSolarPhase(now);

  const dailyCapacity = input.workload.dailyCapacityMinutes || 330; // 5.5 hours standard limit
  const totalPlanned = input.workload.totalPlannedMinutes ?? input.workload.totalEstimatedMinutes ?? 0;
  const remainingCapacity = Math.max(0, dailyCapacity - totalPlanned);
  const capacityPercentUsed = Math.min(100, Math.round((totalPlanned / dailyCapacity) * 100));
  const isCeilingReached = capacityPercentUsed >= 100;

  // Derive Phase Metas
  const archetypes: Record<CircadianPhase, {
    archetype: CircadianCognitiveArchetype;
    archetitle: string;
    advice: string;
    biologicalContext: string;
    prefrontalBandwidth: number;
  }> = {
    dawn: {
      archetype: 'intentional_grounding',
      archetitle: 'Dawn Intentional Grounding',
      advice: 'Cortisol rising. Anchor one primary intellectual commitment for the day before operational distractions bleed in.',
      biologicalContext: 'Optimal window for syllabus calibration, high-level concept mapping, and structural outlines.',
      prefrontalBandwidth: 78
    },
    zenith: {
      archetype: 'deep_breakthrough',
      archetitle: 'Solar Zenith • High-Demand Execution',
      advice: 'Prefrontal metabolic bandwidth is peaked. Engage the highest-friction proofs or synthesis challenges.',
      biologicalContext: 'Maximum neural plasticity and sustained attention velocity. Shield from multi-tasking.',
      prefrontalBandwidth: 95
    },
    dusk: {
      archetype: 'spaced_consolidation',
      archetitle: 'Dusk Schema Consolidation',
      advice: 'Memory consolidation window active. Intercept decaying synaptic traces with active spaced retrieval.',
      biologicalContext: 'Ideal for SM-2 flashcard drilling, topic review tests, and cementing daily intake.',
      prefrontalBandwidth: 65
    },
    night: {
      archetype: 'archival_reflection',
      archetitle: 'Night Archival Closure',
      advice: 'Melatonin priming active. Cease high-demand analytical problem sets to preserve sleep architecture.',
      biologicalContext: 'Solis enforces gentle closure: record daily wins, link wiki notes, and anchor tomorrow\'s horizon.',
      prefrontalBandwidth: 40
    }
  };

  const currentMeta = archetypes[phase];

  // Rank candidate recommendations by Circadian Resonance
  const candidateRecommendations: ExplainableRecommendation[] = input.snapshot?.recommendations
    ? [...input.snapshot.recommendations]
    : [];

  // If no snapshot recommendations exist, derive a sensible default from tasks/studyPlan
  if (candidateRecommendations.length === 0) {
    if (input.studyPlan && input.studyPlan.length > 0) {
      const pendingPlan = input.studyPlan.find((p) => !p.completed) || input.studyPlan[0];
      candidateRecommendations.push({
        id: `plan-${pendingPlan.id}`,
        type: 'syllabus_continuation',
        priority: 'primary',
        weight: 80,
        title: `Continue ${pendingPlan.title}`,
        signal: 'Uncompleted syllabus commitment',
        evidence: `${pendingPlan.subjectName} • ${pendingPlan.targetMinutes}m planned`,
        whyExplanation: 'Directly advances your curriculum milestone for this calendar week.',
        actionLabel: 'Open Study Plan',
        actionPayload: {
          type: 'open_study_plan',
          subjectId: pendingPlan.subjectId,
          topicId: pendingPlan.topicId,
          durationMinutes: pendingPlan.targetMinutes
        }
      });
    }

    if (input.tasks && input.tasks.length > 0) {
      const pendingTask = input.tasks.find((t) => t.status !== 'completed') || input.tasks[0];
      candidateRecommendations.push({
        id: `task-${pendingTask.id}`,
        type: 'concept_synthesis',
        priority: 'secondary',
        weight: 70,
        title: pendingTask.title,
        signal: 'Pending operational task',
        evidence: `Priority: ${pendingTask.priority} • ${pendingTask.estimatedMinutes || 30}m`,
        whyExplanation: 'Eliminates open loop in daily task queue.',
        actionLabel: 'Start Focus',
        actionPayload: {
          type: 'start_focus',
          durationMinutes: pendingTask.estimatedMinutes || 25
        }
      });
    }
  }

  // Calculate resonance score for each candidate
  const scoredCandidates = candidateRecommendations.map((rec) => {
    const multiplier = getPhaseDemandMultiplier(phase, rec.type);
    const resonanceScore = Math.round(rec.weight * multiplier);
    return {
      rec,
      resonanceScore
    };
  });

  scoredCandidates.sort((a, b) => b.resonanceScore - a.resonanceScore);

  const primaryAction = scoredCandidates.length > 0 ? scoredCandidates[0].rec : null;
  const secondaryActions = scoredCandidates.slice(1, 4).map((s) => s.rec);

  // Compute composite resonance metrics
  const circadianFitScore = Math.min(
    100,
    Math.round(
      (currentMeta.prefrontalBandwidth * 0.6) +
      ((100 - capacityPercentUsed) * 0.4)
    )
  );

  const retentionDecayUrgency = phase === 'dusk' ? 88 : phase === 'night' ? 62 : 45;

  return {
    phase,
    solarTimestamp,
    solarElevationDegrees: elevationDegrees,
    archetype: currentMeta.archetype,
    archetitle: currentMeta.archetitle,
    advice: currentMeta.advice,
    biologicalContext: currentMeta.biologicalContext,
    capacityRemainingMinutes: remainingCapacity,
    capacityPercentUsed,
    isCeilingReached,
    primaryAction,
    secondaryActions,
    resonanceMetrics: {
      circadianFitScore,
      retentionDecayUrgency,
      prefrontalBandwidth: currentMeta.prefrontalBandwidth
    }
  };
}
