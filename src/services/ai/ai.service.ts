import {
  sanitizeAndDelimitUserInput,
  buildHardenedSystemPrompt,
  redactSensitiveOutput,
  detectPromptInjection
} from '../../utils/ai/guardrails';
import {
  chunkMarkdownDocument,
  getChunkSourceLineIndex,
  BM25Index,
  DenseSemanticIndex,
  reciprocalRankFusion,
  rerankCandidates,
  RankedChunk,
  DocumentChunk
} from '../../utils/ai/ragPipeline';
import { evaluateFaithfulness } from '../../utils/ai/evaluations';
import { aiTelemetry } from '../../utils/ai/telemetry';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/supabaseClient';

export interface AskSolisResponse {
  answer: string;
  sources: Array<{
    title: string;
    breadcrumb: string;
    score: number;
    chunkId: string;
  }>;
  telemetry?: {
    totalDurationMs: number;
    promptTokens: number;
    completionTokens: number;
  };
  faithfulnessScore?: number;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/** Name of the authenticated Supabase Edge Function used as the AI proxy (plan §8.2). */
export const GENERATE_CARDS_EDGE_FUNCTION = 'generate-cards';

export type GroundedCardType = 'standard' | 'cloze' | 'concept';

export type GroundedGenerationSource =
  | 'solis_edge_proxy'   // Server-side Gemini via the authenticated Edge Function
  | 'gemini_direct'      // Direct Gemini call with the user's own session key
  | 'deterministic';     // Strictly local, chunk-grounded extraction (no key)

/**
 * A flashcard synthesized strictly from a note chunk, carrying the citation
 * lineage needed to link the card back to the exact note paragraph (plan §8.2).
 */
export interface GroundedFlashcard {
  front: string;
  back: string;
  type: GroundedCardType;
  sourceChunkId: string;
  /** 0-based line index into the source note — powers the clickable citation. */
  sourceLineIndex?: number;
  /** Short excerpt of the grounding chunk shown as the citation tooltip. */
  sourceExcerpt?: string;
}

export interface GroundedFlashcardResult {
  cards: GroundedFlashcard[];
  source: GroundedGenerationSource;
}

/** Wire format for chunks sent to the AI proxy — never raw note markdown. */
export interface GroundedChunkPayload {
  id: string;
  title: string;
  breadcrumb: string;
  content: string;
  sourceLineIndex: number;
}

/** Pure mapper: chunked note → proxy-ready payloads with citation lineage. */
export function toGroundedChunkPayloads(chunks: DocumentChunk[]): GroundedChunkPayload[] {
  return chunks
    .filter((chunk) => chunk.content.trim().length > 0)
    .map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      breadcrumb: chunk.breadcrumb,
      content: chunk.content,
      sourceLineIndex: getChunkSourceLineIndex(chunk)
    }));
}

const GROUNDED_CARD_TYPES: GroundedCardType[] = ['standard', 'cloze', 'concept'];

/**
 * Pure grounding gate (plan §8.2): accepts raw model/proxy output and keeps
 * ONLY cards whose `sourceChunkId` points at a chunk we actually provided.
 * Everything else is treated as a hallucination and dropped, so a generated
 * card can never cite a paragraph that does not exist in the student's note.
 */
export function validateGroundedCards(
  raw: unknown,
  validChunks: GroundedChunkPayload[],
  maxCount = 10
): GroundedFlashcard[] {
  const validById = new Map(validChunks.map((chunk) => [chunk.id, chunk]));
  if (!Array.isArray(raw)) return [];

  const grounded: GroundedFlashcard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const front = typeof record.front === 'string' ? record.front.trim() : '';
    const back = typeof record.back === 'string' ? record.back.trim() : '';
    const sourceChunkId = typeof record.sourceChunkId === 'string' ? record.sourceChunkId : '';
    if (!front || !back || !sourceChunkId) continue;

    const sourceChunk = validById.get(sourceChunkId);
    if (!sourceChunk) continue; // ungrounded — drop

    const rawType = typeof record.type === 'string' ? (record.type as GroundedCardType) : 'standard';
    const type = GROUNDED_CARD_TYPES.includes(rawType) ? rawType : 'standard';

    grounded.push({
      front: front.slice(0, 500),
      back: back.slice(0, 1000),
      type,
      sourceChunkId: sourceChunk.id,
      sourceLineIndex: sourceChunk.sourceLineIndex,
      sourceExcerpt: sourceChunk.content.slice(0, 160)
    });
    if (grounded.length >= maxCount) break;
  }
  return grounded;
}

/** Pure helper: strips markdown emphasis/bullets from a candidate term. */
function cleanTermFragment(term: string): string {
  return term.replace(/^[*_\-\s]+|[*_\s]+$/g, '').trim();
}

/**
 * Pure deterministic fallback (master.md §4 "Deterministic First"): mines
 * candidate flashcards STRICTLY from the provided note chunks. Every card
 * cites the chunk it was extracted from. No network, no DOM, no key.
 */
export function extractDeterministicGroundedCards(
  chunks: GroundedChunkPayload[],
  count: number
): GroundedFlashcard[] {
  const cards: GroundedFlashcard[] = [];
  const seenFronts = new Set<string>();

  const pushCard = (card: Omit<GroundedFlashcard, 'sourceExcerpt'> & { sourceExcerpt?: string }) => {
    const key = card.front.trim().toLowerCase();
    if (!key || seenFronts.has(key) || cards.length >= count) return;
    seenFronts.add(key);
    const sourceChunk = chunks.find((chunk) => chunk.id === card.sourceChunkId);
    cards.push({ ...card, sourceExcerpt: sourceChunk ? sourceChunk.content.slice(0, 160) : undefined });
  };

  for (const chunk of chunks) {
    if (cards.length >= count) break;
    let cardsFromChunk = 0;

    // Sentence-level candidate mining (chunk content is space-joined words).
    const sentences = chunk.content.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    for (const sentence of sentences) {
      if (cards.length >= count || cardsFromChunk >= 2) break;

      // Pattern A — "Term: definition" statements.
      const colonMatch = sentence.match(/^(?:[-*]\s*)?\*{0,2}([^:*]{3,60})\*{0,2}:\s+(.{10,})$/);
      if (colonMatch) {
        const term = cleanTermFragment(colonMatch[1]);
        if (term.length >= 3) {
          pushCard({
            front: `What is ${term}?`,
            back: colonMatch[2].trim(),
            type: 'concept',
            sourceChunkId: chunk.id,
            sourceLineIndex: chunk.sourceLineIndex
          });
          cardsFromChunk++;
          continue;
        }
      }

      // Pattern B — "X is/are Y" definitional sentences.
      const isMatch = sentence.match(/^(.{4,80}?)\s+(is|are)\s+(.{10,})$/i);
      if (isMatch) {
        const subject = cleanTermFragment(isMatch[1]);
        if (subject.length >= 4) {
          pushCard({
            front: `What ${isMatch[2].toLowerCase()} ${subject}?`,
            back: sentence,
            type: 'standard',
            sourceChunkId: chunk.id,
            sourceLineIndex: chunk.sourceLineIndex
          });
          cardsFromChunk++;
        }
      }
    }

    // Pattern C — section fallback: explain the section this chunk grounds.
    if (cardsFromChunk === 0) {
      const breadcrumbTail = chunk.breadcrumb.split(' > ').pop() || chunk.title;
      pushCard({
        front: `Explain: ${breadcrumbTail}`,
        back: chunk.content.slice(0, 220),
        type: 'standard',
        sourceChunkId: chunk.id,
        sourceLineIndex: chunk.sourceLineIndex
      });
    }
  }

  return cards;
}

export class AIService {
  private getApiKey(): string | null {
    // Secrets hygiene (plan §1.6): the key lives in sessionStorage for the
    // current browser session only. The localStorage read is a legacy
    // fallback for keys saved before the storage change.
    const sessionKey =
      typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('solis_gemini_api_key') : null;
    const legacyKey =
      typeof localStorage !== 'undefined' ? localStorage.getItem('solis_gemini_api_key') : null;
    return sessionKey || legacyKey || import.meta.env.VITE_GEMINI_API_KEY || null;
  }

  public getModel(): string {
    const stored = localStorage.getItem('solis_gemini_model');
    // If a user has a deprecated model stored, migrate it forward
    if (stored && (stored === 'gemini-2.5-flash' || stored.startsWith('gemini-1.5') || stored.startsWith('gemini-2.0'))) {
      localStorage.setItem('solis_gemini_model', DEFAULT_GEMINI_MODEL);
      return DEFAULT_GEMINI_MODEL;
    }
    if (stored === 'gemini-3.8-pro' || stored === 'gemini-3.1-pro') {
      localStorage.setItem('solis_gemini_model', 'gemini-3.1-pro-preview');
      return 'gemini-3.1-pro-preview';
    }
    return stored || import.meta.env.VITE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  }

  public async testConnection(apiKey?: string, model?: string): Promise<{ success: boolean; message: string }> {
    const key = (apiKey !== undefined ? apiKey : this.getApiKey())?.trim();
    if (!key) {
      return { success: false, message: 'Please provide a valid Gemini API key first.' };
    }
    let activeModel = model || this.getModel();
    if (activeModel === 'gemini-3.8-pro' || activeModel === 'gemini-3.1-pro') {
      activeModel = 'gemini-3.1-pro-preview';
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }]
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        return {
          success: false,
          message: errData?.error?.message || `API error (${response.status} ${response.statusText})`
        };
      }

      return {
        success: true,
        message: `Successfully connected to ${activeModel}!`
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Network error connecting to Gemini API.'
      };
    }
  }

  private async generateContent(
    prompt: string,
    systemInstruction?: string,
    model?: string
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('AI features require a Gemini API Key. Please add one in Settings.');
    }

    let activeModel = model || this.getModel();
    if (activeModel === 'gemini-3.8-pro' || activeModel === 'gemini-3.1-pro') {
      activeModel = 'gemini-3.1-pro-preview';
    }
    const startTime = performance.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent`;

    const payload: any = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const nonThoughtParts = parts.filter((p: any) => !p.thought && p.text);
      const rawOutput = nonThoughtParts.length > 0
        ? nonThoughtParts.map((p: any) => p.text).join('')
        : (parts.find((p: any) => p.text)?.text || data.candidates?.[0]?.content?.parts?.[0]?.text || '');
      const sanitizedOutput = redactSensitiveOutput(rawOutput);

      aiTelemetry.record({
        operation: 'ask_solis',
        startTimeMs: startTime,
        endTimeMs: performance.now(),
        promptText: prompt,
        completionText: sanitizedOutput
      });

      return sanitizedOutput;
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      throw new Error(`AI request failed: ${err.message}`);
    }
  }

  // Robust multi-strategy JSON parser for LLM output (fenced, conversational, or bare)
  private parseJsonFromLLM<T>(text: string): T {
    if (!text || typeof text !== 'string') {
      throw new Error('AI returned an invalid data format.');
    }

    // Strategy 1: Extract from markdown code fence anywhere in text (e.g. ```json ... ```)
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        return JSON.parse(codeBlockMatch[1].trim()) as T;
      } catch {
        // Continue to next strategy if code fence content is invalid
      }
    }

    // Strategy 2: Direct parse of trimmed text
    try {
      return JSON.parse(text.trim()) as T;
    } catch {
      // Continue to next strategy
    }

    // Strategy 3: Slice outermost JSON array [...] or object {...} from conversational text
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    const candidateSlices: string[] = [];
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      candidateSlices.push(text.slice(firstBracket, lastBracket + 1).trim());
    }
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      candidateSlices.push(text.slice(firstBrace, lastBrace + 1).trim());
    }

    for (const slice of candidateSlices) {
      try {
        return JSON.parse(slice) as T;
      } catch {
        // Try next slice
      }
    }

    console.error('Failed to parse LLM JSON:', text);
    throw new Error('AI returned an invalid data format.');
  }

  /**
   * Deterministic local retrieval: BM25 keyword scoring plus hashed token/trigram
   * similarity, fused with Reciprocal Rank Fusion (k=60). No embeddings involved.
   */
  public retrieveRelevantNotes(
    query: string,
    knowledgeContext: any[],
    topK = 5
  ): RankedChunk[] {
    if (!knowledgeContext || knowledgeContext.length === 0 || !query.trim()) {
      return [];
    }

    // 1. Chunk all input notes with hierarchy preservation
    const allChunks: DocumentChunk[] = [];
    knowledgeContext.forEach((item, idx) => {
      const docId = item.id || `doc-${idx}`;
      const title = item.title || item.subject || `Document ${idx + 1}`;
      const content = item.content || (typeof item === 'string' ? item : JSON.stringify(item));
      const chunks = chunkMarkdownDocument(docId, title, content);
      allChunks.push(...chunks);
    });

    if (allChunks.length === 0) return [];

    // 2. Index into BM25 and deterministic hashed token/trigram similarity stores
    const bm25 = new BM25Index(1.5, 0.75);
    bm25.indexChunks(allChunks);
    const bm25Results = bm25.search(query, 15);

    const ngram = new DenseSemanticIndex();
    ngram.indexChunks(allChunks);
    const ngramResults = ngram.search(query, 15);

    // 3. Reciprocal Rank Fusion (k=60)
    const fused = reciprocalRankFusion([ngramResults, bm25Results], 60, 15);

    // 4. Precision Reranker (boosts title exact matches & query density)
    return rerankCandidates(query, fused, topK);
  }

  // 1. AI Flashcard Generation
  async generateFlashcards(textContext: string, count: number = 3): Promise<Array<{ front: string, back: string, type: 'standard' | 'cloze' | 'concept' }>> {
    const guardedInput = sanitizeAndDelimitUserInput(textContext, 'user_notes');

    const basePrompt = `You are a learning assistant for Solis. Generate ${count} high-quality flashcards based ONLY on the provided text in <user_notes>.
Avoid duplicating facts. Keep atomic facts per card.
Types can be:
- 'standard': Question on front, answer on back.
- 'concept': Concept name on front, explanation on back.
- 'cloze': A sentence with a missing word on front like "The capital of France is {{Paris}}", and "Paris" on back.`;

    const systemPrompt = buildHardenedSystemPrompt(basePrompt, {
      requiredSchemaDescription: 'JSON array of objects with "front", "back", and "type" keys. No preamble, no explanation, only the JSON block.'
    });

    const responseText = await this.generateContent(guardedInput.sanitized, systemPrompt);
    return this.parseJsonFromLLM<Array<{ front: string, back: string, type: 'standard' | 'cloze' | 'concept' }>>(responseText);
  }

  // 1b. Grounded RAG Flashcard Generation with citation lineage (plan §8.2)
  //
  // Chain of custody, per master.md §1.2 rule 5 ("no fake integrations") and
  // §4 principle 4 ("deterministic first, AI optional"):
  //   1. Authenticated Supabase Edge Function proxy (GEMINI_API_KEY lives
  //      server-side; the client key never has to exist).
  //   2. Direct Gemini call with the user's own session key (optional accelerator).
  //   3. Deterministic extraction strictly from the note chunks — always works.
  // Every returned card cites the chunk (and note line) it was grounded in;
  // anything else is dropped by `validateGroundedCards`. No simulated success.
  async generateGroundedFlashcards(
    noteId: string,
    noteTitle: string,
    markdown: string,
    count: number = 3
  ): Promise<GroundedFlashcardResult> {
    const chunks = chunkMarkdownDocument(noteId, noteTitle || 'Knowledge Note', markdown)
      .filter((chunk) => chunk.content.trim().length > 0);
    if (chunks.length === 0) {
      return { cards: [], source: 'deterministic' };
    }
    const payloads = toGroundedChunkPayloads(chunks);

    // Tier 1 — authenticated server-side proxy.
    try {
      const rawCards = await this.generateCardsViaEdgeFunction(payloads, count);
      const grounded = validateGroundedCards(rawCards, payloads, count);
      if (grounded.length > 0) {
        return { cards: grounded, source: 'solis_edge_proxy' };
      }
      console.warn('[AIService] Edge proxy returned no chunk-grounded cards; falling back.');
    } catch (err: any) {
      console.warn('[AIService] Edge proxy unavailable, falling back:', err?.message || err);
    }

    // Tier 2 — direct Gemini with the user's own session key.
    if (this.getApiKey()) {
      try {
        const contextBlock = payloads
          .map((chunk) => `[chunk:${chunk.id} | note line ${chunk.sourceLineIndex + 1} | ${chunk.breadcrumb}]\n${chunk.content}`)
          .join('\n\n');
        const guardedInput = sanitizeAndDelimitUserInput(contextBlock, 'user_notes');
        const basePrompt = `You are a learning assistant for Solis. Generate ${count} flashcards grounded STRICTLY in the note chunks inside <user_notes>.
Each chunk is labeled with its id, note line number, and breadcrumb. Copy the exact chunk id into each card's "sourceChunkId" field.
Never invent facts that are not present in the chunks. Types: 'standard', 'concept', 'cloze'.`;
        const systemPrompt = buildHardenedSystemPrompt(basePrompt, {
          requiredSchemaDescription: 'JSON array of objects with "front" (string), "back" (string), "type" (standard|concept|cloze), and "sourceChunkId" (the exact chunk id the card was derived from). No preamble, only the JSON block.'
        });
        const responseText = await this.generateContent(guardedInput.sanitized, systemPrompt);
        const grounded = validateGroundedCards(this.parseJsonFromLLM<unknown>(responseText), payloads, count);
        if (grounded.length > 0) {
          return { cards: grounded, source: 'gemini_direct' };
        }
        console.warn('[AIService] Direct Gemini returned no chunk-grounded cards; using deterministic extraction.');
      } catch (err: any) {
        console.warn('[AIService] Direct Gemini generation failed, using deterministic extraction:', err?.message || err);
      }
    }

    // Tier 3 — deterministic, chunk-grounded extraction (no key required).
    return {
      cards: extractDeterministicGroundedCards(payloads, count),
      source: 'deterministic'
    };
  }

  /**
   * Calls the authenticated Supabase Edge Function proxy (plan §8.2). The
   * user's Supabase access token is attached automatically by
   * `functions.invoke`; the Gemini key itself never leaves the server.
   */
  private async generateCardsViaEdgeFunction(
    chunks: GroundedChunkPayload[],
    count: number
  ): Promise<unknown[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase edge runtime is not configured.');
    }
    const client = getSupabaseClient();
    const { data, error } = await client.functions.invoke(GENERATE_CARDS_EDGE_FUNCTION, {
      body: { chunks, count, modelName: this.getModel() }
    });
    if (error) {
      throw new Error(error.message || 'The Solis AI proxy rejected the request.');
    }
    const cards = (data as { cards?: unknown } | null)?.cards;
    if (!Array.isArray(cards)) {
      throw new Error('The Solis AI proxy returned an invalid payload.');
    }
    return cards;
  }

  // 2. AI Quiz Generation
  async generateQuiz(textContext: string, count: number = 3): Promise<Array<{ question: string, options: string[], correctAnswerIndex: number, explanation: string }>> {
    const guardedInput = sanitizeAndDelimitUserInput(textContext, 'user_notes');

    const basePrompt = `You are a rigorous academic assessor. Generate ${count} multiple choice questions based ONLY on the provided text in <user_notes>.
Questions should test understanding, not just trivia. Ensure exactly 4 options per question.`;

    const systemPrompt = buildHardenedSystemPrompt(basePrompt, {
      requiredSchemaDescription: 'JSON array of objects with "question" (string), "options" (string[] length 4), "correctAnswerIndex" (number 0-3), "explanation" (string). No preamble, no explanation, only the JSON block.'
    });

    const responseText = await this.generateContent(guardedInput.sanitized, systemPrompt);
    return this.parseJsonFromLLM<Array<{ question: string, options: string[], correctAnswerIndex: number, explanation: string }>>(responseText);
  }

  // 3. AI Weekly Synthesis
  async synthesizeWeek(studyData: any): Promise<{ summary: string, observations: string[], suggestions: string[] }> {
    const basePrompt = `You are the Solis Intelligence engine. You analyze weekly study data and provide a grounded, objective synthesis.
DO NOT use overly motivational fluff or emojis. Use a calm, analytical tone.
Here is the JSON data of the week's activity:
${JSON.stringify(studyData, null, 2)}`;

    const systemPrompt = buildHardenedSystemPrompt(basePrompt, {
      requiredSchemaDescription: 'JSON object with "summary" (2-3 sentences), "observations" (array of 2-4 strings), "suggestions" (array of 2-3 actionable strings).'
    });

    const responseText = await this.generateContent('Synthesize my week.', systemPrompt);
    return this.parseJsonFromLLM(responseText);
  }

  // 4. Ask Solis: deterministic local retrieval (BM25 + hashed trigram similarity, RRF fusion) with citations
  async askSolis(query: string, knowledgeContext: any[]): Promise<string> {
    // 1. Guardrail & Prompt Injection Gate
    const securityCheck = detectPromptInjection(query);
    if (securityCheck.isFlagged && securityCheck.score >= 0.8) {
      return `⚠️ **Solis Security Policy Enforced**: The query was intercepted by our safety guardrail due to an instruction override pattern (${securityCheck.violations.join(', ')}). Please ask a direct question about your academic notes and study materials.`;
    }

    // Sanitize input for log safety (result used implicitly by guardrail gate above)
    sanitizeAndDelimitUserInput(query, 'user_query');

    // 2. Deterministic Retrieval (BM25 + hashed n-gram similarity + RRF + Reranker)
    const rankedChunks = this.retrieveRelevantNotes(query, knowledgeContext, 5);

    // 3. Assemble Context & Citations
    let contextBlock = '';
    if (rankedChunks.length > 0) {
      contextBlock = rankedChunks.map((rc, i) => (
        `[Source ${i + 1}: ${rc.chunk.breadcrumb}] (Relevance Score: ${rc.score.toFixed(3)})\n${rc.chunk.content}`
      )).join('\n\n---\n\n');
    } else {
      contextBlock = JSON.stringify(knowledgeContext, null, 2);
    }

    const basePrompt = `You are Solis, an integrated learning assistant. Answer the user's question based ONLY on the provided knowledge context. 
If the information is not in the context, explicitly say you don't have enough data to answer. Do not hallucinate.
Cite the source notes or topics where appropriate using markdown bold citations e.g. **[Source: Biology > Mitosis]**.

Context data:
${contextBlock}`;

    const systemPrompt = buildHardenedSystemPrompt(basePrompt);
    const responseText = await this.generateContent(query, systemPrompt);

    // 4. Faithfulness & Groundedness Gate Check
    if (rankedChunks.length > 0) {
      const faithfulness = evaluateFaithfulness(responseText, rankedChunks.map(r => r.chunk));
      if (faithfulness.score < 0.4 && faithfulness.ungroundedClaims.length > 0) {
        console.warn('Potential hallucination detected in model output:', faithfulness.ungroundedClaims);
      }
    }

    return responseText;
  }

  // 5. Adaptive Study Plan Suggester
  async suggestNextStudyActions(contextData: any): Promise<Array<{ type: string, title: string, reason: string, actionPayload: any }>> {
    const basePrompt = `You are the Solis Learning Intelligence engine. Your job is to suggest the "Next Best Study Actions" for the user.
Analyze their due flashcards, weak mastery topics, upcoming exams, and recent activity.
Suggest exactly 3 actionable items.

Context Data:
${JSON.stringify(contextData, null, 2)}`;

    const systemPrompt = buildHardenedSystemPrompt(basePrompt, {
      requiredSchemaDescription: 'JSON array of objects with "type" (one of: review_flashcards, study_topic, take_quiz, review_note), "title" (string), "reason" (string), "actionPayload" (object with IDs).'
    });

    const responseText = await this.generateContent('Suggest my next study actions.', systemPrompt);
    return this.parseJsonFromLLM(responseText);
  }
}

export const aiService = new AIService();
