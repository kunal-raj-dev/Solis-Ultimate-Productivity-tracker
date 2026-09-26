import { CardRating } from '../../types/learning';

export interface FeynmanEvaluationResult {
  /** 0 - 100 comprehension score based on semantic concept coverage & causal depth */
  comprehensionScore: number;
  /** Qualitative tier for UI feedback */
  verdict: 'mastery' | 'solid' | 'partial' | 'incomplete';
  /** Key domain terms / concepts from the canonical answer captured in the user's explanation */
  capturedConcepts: string[];
  /** Key domain terms / mechanisms omitted from the user's explanation */
  missingMechanisms: string[];
  /** Targeted Socratic question that probes the gap without simply giving away the whole answer */
  socraticFollowUp: string;
  /** Suggested FSRS / SM-2 difficulty rating based on first-principles articulation */
  recommendedRating: CardRating;
  /** Encouraging, non-punitive coaching summary */
  summaryFeedback: string;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'your', 'have', 'has', 'had',
  'are', 'was', 'were', 'been', 'being', 'will', 'would', 'could', 'should', 'can',
  'may', 'might', 'must', 'into', 'onto', 'upon', 'about', 'above', 'below', 'between',
  'through', 'during', 'before', 'after', 'under', 'over', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same', 'than', 'too',
  'very', 'just', 'also', 'which', 'what', 'who', 'whom', 'whose', 'because', 'while',
  'does', 'did', 'doing', 'done', 'make', 'makes', 'made', 'used', 'using', 'uses',
  'within', 'without', 'they', 'them', 'their', 'theirs', 'itself', 'these', 'those',
  'against', 'reduces', 'reduce', 'sets', 'enters', 'enter', 'actively', 'always',
  'increases', 'increase', 'decreases', 'decrease', 'over', 'time', 'total', 'produce',
  'produces', 'deliver', 'delivers', 'inside'
]);

/**
 * Unwraps Anki/Solis cloze syntax `{{c1::answer::hint}}` into plain text
 * and also returns the explicit cloze target phrases.
 */
export function unwrapClozeText(rawText: string): { plainText: string; clozeTargets: string[] } {
  const clozeTargets: string[] = [];
  const plainText = rawText.replace(/\{\{c\d+::([^}:]+)(?:::[^}]*)?\}\}/gi, (_, answer: string) => {
    const cleaned = answer.trim();
    if (cleaned) clozeTargets.push(cleaned);
    return cleaned;
  });
  return { plainText, clozeTargets };
}

/**
 * Lightweight deterministic stemmer so "mitochondria" / "mitochondrial" or
 * "oxidizes" / "oxidation" match cleanly offline without external LLM latency.
 */
export function normalizeConceptStem(word: string): string {
  const clean = word
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .trim();

  if (clean.length <= 4) return clean;

  return clean
    .replace(/(ations|ation|izing|izes|ized|ingly|ments|ment|ities|ity|ness|able|ible|ally|ical|al|ed|es|er|ing|ly|s)$/, '')
    .slice(0, 10);
}

/**
 * Extracts salient domain concepts from a canonical answer string.
 */
export function extractCanonicalConcepts(frontPrompt: string, backAnswer: string, noteContext?: string): string[] {
  const { plainText: frontPlain, clozeTargets } = unwrapClozeText(frontPrompt);
  const { plainText: backPlain } = unwrapClozeText(backAnswer);

  // Combine canonical answer + any explicit cloze targets
  const sourceText = `${ clozeTargets.join(' ') } ${ backPlain }`.trim();
  const promptWords = new Set(
    frontPlain
      .toLowerCase()
      .split(/[^a-z0-9-]+/)
      .filter((w) => w.length >= 4)
      .map(normalizeConceptStem)
  );

  const tokens = sourceText
    .split(/[^a-zA-Z0-9-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);

  const seenStems = new Set<string>();
  const concepts: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (STOP_WORDS.has(lower)) continue;
    // Allow numbers or technical acronyms (ATP, DNA, TCP, O(n), etc.)
    const isAcronymOrNumber = /^[A-Z0-9]{2,}$/.test(token) || /\d/.test(token);
    if (!isAcronymOrNumber && lower.length < 4) continue;

    const stem = normalizeConceptStem(lower);
    if (!stem || seenStems.has(stem)) continue;

    seenStems.add(stem);
    concepts.push(lower);
  }

  // If the answer was very short and yielded nothing after filtering, fall back to non-empty tokens
  if (concepts.length === 0) {
    const fallback = sourceText
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ''))
      .filter(Boolean);
    return Array.from(new Set(fallback)).slice(0, 5);
  }

  // Prioritize concepts that aren't already trivially repeated in the question prompt,
  // unless all concepts were in the prompt (e.g., cloze cards).
  const novelConcepts = concepts.filter((c) => !promptWords.has(normalizeConceptStem(c)));
  const selected = novelConcepts.length >= 2 ? novelConcepts : concepts;

  // Optionally enrich with up to 2 high-signal domain terms from linked note context if canonical answer is tiny
  if (selected.length < 3 && noteContext) {
    const noteTokens = noteContext
      .split(/[^a-zA-Z0-9-]+/)
      .map((t) => t.toLowerCase().trim())
      .filter((t) => t.length >= 5 && !STOP_WORDS.has(t));
    for (const nt of noteTokens) {
      const stem = normalizeConceptStem(nt);
      if (stem && !seenStems.has(stem) && !promptWords.has(stem)) {
        seenStems.add(stem);
        selected.push(nt);
        if (selected.length >= 5) break;
      }
    }
  }

  return selected.slice(0, 12);
}

/**
 * Evaluates a user's first-principles Feynman explanation against the card's canonical answer.
 */
export function evaluateFeynmanExplanation(
  frontPrompt: string,
  backAnswer: string,
  userExplanation: string,
  noteContext?: string
): FeynmanEvaluationResult {
  const trimmedExplanation = userExplanation.trim();

  if (!trimmedExplanation) {
    const canonical = extractCanonicalConcepts(frontPrompt, backAnswer, noteContext);
    return {
      comprehensionScore: 0,
      verdict: 'incomplete',
      capturedConcepts: [],
      missingMechanisms: canonical,
      socraticFollowUp: canonical.length > 0
        ? `To start from first principles, how does "${canonical[0]}" relate to this question?`
        : 'Try explaining the core mechanism in one simple sentence as if teaching a peer.',
      recommendedRating: 'again',
      summaryFeedback: 'Write a brief explanation in your own words before evaluating.'
    };
  }

  const canonicalConcepts = extractCanonicalConcepts(frontPrompt, backAnswer, noteContext);
  const userWords = trimmedExplanation
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter(Boolean);
  const userStems = new Set(userWords.map(normalizeConceptStem).filter(Boolean));
  const userLowerText = trimmedExplanation.toLowerCase();

  const capturedConcepts: string[] = [];
  const missingMechanisms: string[] = [];

  for (const concept of canonicalConcepts) {
    const stem = normalizeConceptStem(concept);
    const isMatched =
      userLowerText.includes(concept.toLowerCase()) ||
      (stem.length >= 3 && userStems.has(stem)) ||
      userWords.some((w) => {
        const wStem = normalizeConceptStem(w);
        return (
          wStem.length >= 4 &&
          stem.length >= 4 &&
          (wStem.startsWith(stem.slice(0, 5)) || stem.startsWith(wStem.slice(0, 5)))
        );
      });

    if (isMatched) {
      capturedConcepts.push(concept);
    } else {
      missingMechanisms.push(concept);
    }
  }

  // Calculate base concept coverage ratio
  const coverageRatio =
    canonicalConcepts.length > 0 ? capturedConcepts.length / canonicalConcepts.length : 1;

  // Bonus for causal/explanatory connectors ("because", "therefore", "causes", "leads to", "due to", "by", "when")
  const hasCausalReasoning = /\b(because|therefore|thus|causes|causing|leads|results|due to|allows|enables|through|by which|when|since)\b/i.test(
    trimmedExplanation
  );
  const wordCount = userWords.length;
  const depthBonus = hasCausalReasoning && wordCount >= 6 && capturedConcepts.length > 0 ? 0.08 : 0;

  // Penalty if the explanation is a single-word guess when the canonical answer has multiple concepts
  const brevityPenalty = wordCount < 3 && canonicalConcepts.length > 1 ? 0.15 : 0;

  const rawScore = Math.round(Math.max(0, Math.min(1, coverageRatio + depthBonus - brevityPenalty)) * 100);

  let verdict: FeynmanEvaluationResult['verdict'];
  let recommendedRating: CardRating;
  let summaryFeedback: string;

  if (rawScore >= 85) {
    verdict = 'mastery';
    recommendedRating = 'easy';
    summaryFeedback = 'First-principles mastery! You articulated the core mechanisms clearly and accurately.';
  } else if (rawScore >= 65) {
    verdict = 'solid';
    recommendedRating = 'good';
    summaryFeedback = 'Solid conceptual grasp. You captured the primary idea with minor nuance remaining.';
  } else if (rawScore >= 40) {
    verdict = 'partial';
    recommendedRating = 'hard';
    summaryFeedback = 'Partial intuition. You touched on the surface concept, but key underlying mechanisms were omitted.';
  } else {
    verdict = 'incomplete';
    recommendedRating = 'again';
    summaryFeedback = 'Core mechanism gap detected. Review the missing concepts below and refine your mental model.';
  }

  // Generate a Socratic follow-up question
  let socraticFollowUp: string;
  if (missingMechanisms.length >= 2) {
    socraticFollowUp = `How do "${missingMechanisms[0]}" and "${missingMechanisms[1]}" interact to drive this outcome?`;
  } else if (missingMechanisms.length === 1) {
    socraticFollowUp = `Your explanation is close—what specific role does "${missingMechanisms[0]}" play in this mechanism?`;
  } else if (!hasCausalReasoning) {
    socraticFollowUp = `You named the right components! Can you state the "why" or causal link that connects ${capturedConcepts.slice(0, 2).join(' and ') || 'them'}?`;
  } else {
    socraticFollowUp = `To stress-test your intuition: what would happen to this system if "${capturedConcepts[0] || 'the primary condition'}" were inhibited or reversed?`;
  }

  return {
    comprehensionScore: rawScore,
    verdict,
    capturedConcepts,
    missingMechanisms,
    socraticFollowUp,
    recommendedRating,
    summaryFeedback
  };
}
