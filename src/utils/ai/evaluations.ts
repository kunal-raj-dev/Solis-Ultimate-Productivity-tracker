/**
 * Solis AI/ML Engineering — RAG Evaluation & Triad Benchmarking Suite
 *
 * Implements mathematical definitions from references/rag-evaluation.md:
 * 1. Context Precision@K
 * 2. Context Recall
 * 3. Faithfulness / Groundedness (Hallucination detection)
 * 4. Answer Relevancy
 * 5. Golden evaluation benchmark dataset
 */

import { DocumentChunk, RankedChunk, tokenizeText } from './ragPipeline';

export interface EvaluationResult {
  contextPrecisionAtK: number;
  contextRecall: number;
  faithfulness: number;
  answerRelevancy: number;
  hallucinationsDetected: string[];
}

export interface GoldenRagItem {
  id: string;
  query: string;
  groundTruthDocId: string;
  groundTruthClaims: string[];
  referenceAnswer: string;
}

/**
 * 1. Context Precision@K
 * Formula: Precision@K = |Relevant Chunks in Top K| / K
 */
export function evaluateContextPrecision(
  retrievedChunks: RankedChunk[],
  relevantDocIds: string[],
  k = 3
): number {
  if (k <= 0) return 0;
  const topK = retrievedChunks.slice(0, k);
  if (topK.length === 0) return 0;

  const relevantCount = topK.filter(item => relevantDocIds.includes(item.chunk.docId)).length;
  return relevantCount / k;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'via'
]);

function extractContentTokens(text: string): string[] {
  return tokenizeText(text).filter(t => !STOP_WORDS.has(t) && t.length > 2);
}

/**
 * 2. Context Recall
 * Formula: Recall = |Retrieved Ground Truth Claims| / |Total Ground Truth Claims|
 */
export function evaluateContextRecall(
  retrievedChunks: RankedChunk[],
  groundTruthClaims: string[]
): number {
  if (groundTruthClaims.length === 0) return 1.0;
  if (retrievedChunks.length === 0) return 0.0;

  const combinedRetrievedText = retrievedChunks
    .map(c => `${c.chunk.title} ${c.chunk.breadcrumb} ${c.chunk.content}`.toLowerCase())
    .join(' ');

  let coveredClaims = 0;

  for (const claim of groundTruthClaims) {
    const claimTokens = extractContentTokens(claim);
    if (claimTokens.length === 0) {
      coveredClaims++;
      continue;
    }

    // A claim is considered retrieved if at least 50% of its content terms are in the retrieved context
    const matchedTokens = claimTokens.filter(token => combinedRetrievedText.includes(token));
    if (matchedTokens.length / claimTokens.length >= 0.5) {
      coveredClaims++;
    }
  }

  return coveredClaims / groundTruthClaims.length;
}

/**
 * 3. Faithfulness / Groundedness (Hallucination Detection)
 * Formula: Faithfulness = |Verified Claims in Output derived from Context| / |Total Claims in Output|
 * A score < 1.0 flags potential hallucination.
 */
export function evaluateFaithfulness(
  outputAnswer: string,
  contextChunks: DocumentChunk[]
): { score: number; ungroundedClaims: string[] } {
  if (!outputAnswer.trim()) return { score: 1.0, ungroundedClaims: [] };

  const contextText = contextChunks
    .map(c => `${c.title} ${c.breadcrumb} ${c.content}`.toLowerCase())
    .join(' ');

  // Split response into discrete claim sentences
  const sentenceClaims = outputAnswer
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && !s.startsWith('#'));

  if (sentenceClaims.length === 0) return { score: 1.0, ungroundedClaims: [] };

  const ungroundedClaims: string[] = [];
  let groundedCount = 0;

  for (const sentence of sentenceClaims) {
    const contentTokens = extractContentTokens(sentence);
    // Ignore conversational connectors or short phrases
    if (contentTokens.length <= 2) {
      groundedCount++;
      continue;
    }

    const matchedTokens = contentTokens.filter(t => contextText.includes(t));
    const tokenSupportRatio = matchedTokens.length / contentTokens.length;

    // Standard threshold: a claim must be at least 50% supported by context vocabulary
    if (tokenSupportRatio >= 0.5) {
      groundedCount++;
    } else {
      ungroundedClaims.push(sentence);
    }
  }

  const score = groundedCount / sentenceClaims.length;
  return {
    score: Math.round(score * 100) / 100,
    ungroundedClaims
  };
}

/**
 * 4. Answer Relevancy
 * Evaluates semantic alignment between query content terms and generated answer.
 */
export function evaluateAnswerRelevancy(query: string, answer: string): number {
  const queryTokens = extractContentTokens(query);
  const answerLower = answer.toLowerCase();

  if (queryTokens.length === 0) return 1.0;
  if (!answer.trim()) return 0.0;

  let matched = 0;
  for (const token of queryTokens) {
    if (answerLower.includes(token)) {
      matched++;
    }
  }

  return Math.min(1.0, Math.round((matched / queryTokens.length) * 100) / 100);
}

/**
 * Golden evaluation dataset for continuous benchmarking
 */
export const GOLDEN_RAG_DATASET: GoldenRagItem[] = [
  {
    id: 'eval-cs-01',
    query: 'What is the consensus invariant in Raft algorithm?',
    groundTruthDocId: 'note-raft-consensus',
    groundTruthClaims: [
      'leader election election safety at most one leader per term',
      'log matching invariant entries with identical index and term have identical commands',
      'leader completeness committed entries present in higher term leaders'
    ],
    referenceAnswer: 'In Raft, Election Safety ensures at most one leader per term, and Leader Completeness guarantees committed entries appear in all future leaders.'
  },
  {
    id: 'eval-bio-01',
    query: 'What happens during Metaphase in mitosis?',
    groundTruthDocId: 'note-biology-mitosis',
    groundTruthClaims: [
      'chromosomes align along equatorial metaphase plate',
      'microtubules attach to kinetochores of sister chromatids',
      'spindle checkpoint verifies tension before anaphase'
    ],
    referenceAnswer: 'During metaphase, chromosomes align along the equatorial metaphase plate and spindle fibers attach to the kinetochores.'
  },
  {
    id: 'eval-hist-01',
    query: 'When was the Treaty of Westphalia signed and what did it establish?',
    groundTruthDocId: 'note-history-westphalia',
    groundTruthClaims: [
      'signed in 1648 ending thirty years war',
      'established sovereign statehood and territorial sovereignty',
      'principles of non-intervention in internal affairs'
    ],
    referenceAnswer: 'The Treaty of Westphalia was signed in 1648, ending the Thirty Years War and establishing the modern doctrine of sovereign statehood.'
  }
];
