/**
 * Solis Learning Intelligence — Heuristics & Policy Configuration
 * 
 * IMPORTANT: These are initial heuristic thresholds based on early domain modeling.
 * They are deliberately isolated in this configuration module so they can be tuned,
 * calibrated, and extended as empirical learning telemetry matures.
 */

export const LEARNING_HEURISTICS_CONFIG = {
  // --------------------------------------------------------------------------
  // 1. EVIDENCE SUFFICIENCY THRESHOLDS (Quantity / Volume of data)
  // --------------------------------------------------------------------------
  SUFFICIENCY: {
    MINIMAL_SESSIONS: 1,
    MINIMAL_FLASHCARDS: 1,
    SUFFICIENT_SESSIONS: 2,
    SUFFICIENT_REVIEWS: 3,
    HIGH_DATA_SESSIONS: 4,
    HIGH_DATA_REVIEWS: 5,
  },

  // --------------------------------------------------------------------------
  // 2. EVIDENCE QUALITY & CONFIDENCE THRESHOLDS (Spacing & Consistency)
  // --------------------------------------------------------------------------
  CONFIDENCE: {
    // Days between first and last study to qualify as temporally spaced
    MIN_SPACED_DAYS: 2,
    // Minimum recall attempts to establish high confidence in accuracy rate
    MIN_RECALL_ATTEMPTS_FOR_CONFIDENCE: 4,
    // Minimum sessions needed for high confidence in retention score
    MIN_SESSIONS_FOR_CONFIDENCE: 3,
  },

  // --------------------------------------------------------------------------
  // 3. MASTERY EVALUATION HEURISTICS (Initial Heuristic Thresholds)
  // --------------------------------------------------------------------------
  MASTERY: {
    // STRONG Mastery: high exposure, high retention rating, high recall rate, spaced
    STRONG_MIN_MINUTES: 60,
    STRONG_MIN_SESSIONS: 3,
    STRONG_MIN_RETENTION: 4.2,
    STRONG_MIN_RECALL_ACCURACY: 0.80, // 80%

    // STABLE Mastery: solid exposure, good retention, consistent recall
    STABLE_MIN_MINUTES: 30,
    STABLE_MIN_SESSIONS: 2,
    STABLE_MIN_RETENTION: 3.4,
    STABLE_MIN_RECALL_ACCURACY: 0.65, // 65%

    // DEVELOPING Mastery: ongoing engagement with room for consolidation
    DEVELOPING_MIN_MINUTES: 15,
    DEVELOPING_MIN_SESSIONS: 1,
  },

  // --------------------------------------------------------------------------
  // 4. RETENTION HEALTH POLICY (Single Source of Truth)
  // --------------------------------------------------------------------------
  RETENTION_POLICY: {
    FRESH_MAX_DAYS: 3,        // 0–3 days
    DUE_FOR_REVIEW_MIN_DAYS: 4,
    DUE_FOR_REVIEW_MAX_DAYS: 7, // 4–7 days
    NEEDS_ATTENTION_MIN_DAYS: 8,
    NEEDS_ATTENTION_MAX_DAYS: 14, // 8–14 days
    OVERDUE_MIN_DAYS: 15,     // > 14 days
    
    // Retention rating threshold that immediately flags topic as NEEDS_ATTENTION
    POOR_RETENTION_THRESHOLD: 2, // Rating <= 2 out of 5
  },

  // --------------------------------------------------------------------------
  // 5. RECOMMENDATION WEIGHTING & RANKING
  // --------------------------------------------------------------------------
  RECOMMENDATION: {
    BASE_SPACED_REVIEW_WEIGHT: 100,
    BASE_RETENTION_INTERVENTION_WEIGHT: 90,
    BASE_SYLLABUS_CONTINUATION_WEIGHT: 60,
    BASE_SUBJECT_REBALANCE_WEIGHT: 75,
    MAX_RECOMMENDATIONS: 3,
  }
} as const;
