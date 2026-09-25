import {
  sanitizeAndDelimitUserInput,
  buildHardenedSystemPrompt,
  redactSensitiveOutput,
  detectPromptInjection
} from '../../utils/ai/guardrails';
import {
  chunkMarkdownDocument,
  BM25Index,
  DenseSemanticIndex,
  reciprocalRankFusion,
  rerankCandidates,
  RankedChunk,
  DocumentChunk
} from '../../utils/ai/ragPipeline';
import { evaluateFaithfulness } from '../../utils/ai/evaluations';
import { aiTelemetry } from '../../utils/ai/telemetry';

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

export class AIService {
  private getApiKey(): string | null {
    return localStorage.getItem('solis_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || null;
  }

  private async generateContent(
    prompt: string,
    systemInstruction?: string,
    model: 'gemini-2.5-flash' = 'gemini-2.5-flash'
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('AI features require a Gemini API Key. Please add one in Settings.');
    }

    const startTime = performance.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

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
      const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
