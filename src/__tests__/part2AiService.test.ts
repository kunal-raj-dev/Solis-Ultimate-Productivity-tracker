import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService, aiService } from '../services/ai/ai.service';

describe('SOLIS PART 2 — AI Service & Local Intelligence Suite (AIService)', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.restoreAllMocks();
    mockStorage = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /* =========================================================================
     1. API Key Resolution & Validation
     ========================================================================= */
  describe('API Key Configuration & Validation', () => {
    it('throws a descriptive error when no Gemini API key is configured', async () => {
      // Ensure storage is empty and import.meta.env fallback is absent
      mockStorage = {};
      const service = new AIService();

      await expect(service.generateFlashcards('Some note context')).rejects.toThrow(
        'AI features require a Gemini API Key. Please add one in Settings.'
      );
    });

    it('resolves key from localStorage solis_gemini_api_key when available', async () => {
      mockStorage['solis_gemini_api_key'] = 'AIzaSyTestApiKeyFromStorage';

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify([{ front: 'Q', back: 'A', type: 'standard' }]) }]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await aiService.generateFlashcards('Context about memory architectures');
      expect(result).toHaveLength(1);
      expect(result[0].front).toBe('Q');

      // Verify the key resolved from storage is sent via the x-goog-api-key header,
      // and is never exposed in the URL query string
      const resolvedKey = mockStorage['solis_gemini_api_key'] as string;
      expect(resolvedKey).toBeTruthy();
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.not.stringContaining('key='),
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-goog-api-key': resolvedKey })
        })
      );
    });

    it('uses the v1beta endpoint and gemini-3.8-flash model by default', async () => {
      mockStorage['solis_gemini_api_key'] = 'AIzaSyFlashKey';

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify([{ front: 'Q', back: 'A', type: 'concept' }]) }]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      await aiService.generateFlashcards('Sample note');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/v1beta/models/gemini-3.8-flash:generateContent'),
        expect.any(Object)
      );
    });

    it('respects custom model when configured in localStorage', async () => {
      mockStorage['solis_gemini_api_key'] = 'AIzaSyFlashKey';
      mockStorage['solis_gemini_model'] = 'gemini-3.1-pro-preview';

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify([{ front: 'Q', back: 'A', type: 'concept' }]) }]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      await aiService.generateFlashcards('Sample note');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/v1beta/models/gemini-3.1-pro-preview:generateContent'),
        expect.any(Object)
      );
    });

    it('auto-migrates deprecated or hallucinated gemini-3.8-pro model to gemini-3.1-pro-preview', async () => {
      mockStorage['solis_gemini_api_key'] = 'AIzaSyFlashKey';
      mockStorage['solis_gemini_model'] = 'gemini-3.8-pro';

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify([{ front: 'Q', back: 'A', type: 'concept' }]) }]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      await aiService.generateFlashcards('Sample note');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/v1beta/models/gemini-3.1-pro-preview:generateContent'),
        expect.any(Object)
      );
      expect(mockStorage['solis_gemini_model']).toBe('gemini-3.1-pro-preview');
    });

    it('auto-migrates deprecated gemini-2.5-flash model to gemini-3.8-flash', async () => {
      mockStorage['solis_gemini_api_key'] = 'AIzaSyFlashKey';
      mockStorage['solis_gemini_model'] = 'gemini-2.5-flash';

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify([{ front: 'Q', back: 'A', type: 'concept' }]) }]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      await aiService.generateFlashcards('Sample note');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/v1beta/models/gemini-3.8-flash:generateContent'),
        expect.any(Object)
      );
      expect(mockStorage['solis_gemini_model']).toBe('gemini-3.8-flash');
    });

    it('filters out thinking parts and extracts clean response text from gemini 3.8 models', async () => {
      mockStorage['solis_gemini_api_key'] = 'AIzaSyKey';

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    { text: 'Analyzing context and formulating questions...', thought: true },
                    { text: JSON.stringify([{ front: 'What is Raft?', back: 'Consensus', type: 'standard' }]) }
                  ]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await aiService.generateFlashcards('Note on Raft');
      expect(result).toHaveLength(1);
      expect(result[0].front).toBe('What is Raft?');
      expect(result[0].back).toBe('Consensus');
    });
  });

  /* =========================================================================
     2. JSON Extraction and Code Fence Stripping (parseJsonFromLLM)
     ========================================================================= */
  describe('LLM JSON Extraction & Code Fence Stripping', () => {
    it('parses bare JSON objects and arrays without code fences', () => {
      const bareJson = JSON.stringify([{ front: 'What is Raft?', back: 'A consensus algorithm', type: 'standard' }]);
      const parsed = (aiService as any).parseJsonFromLLM(bareJson);
      expect(parsed).toEqual([{ front: 'What is Raft?', back: 'A consensus algorithm', type: 'standard' }]);
    });

    it('parses JSON wrapped in ```json code fences with newlines', () => {
      const fenced = '```json\n[\n  {"front": "Paxos", "back": "Consensus", "type": "concept"}\n]\n```';
      const parsed = (aiService as any).parseJsonFromLLM(fenced);
      expect(parsed).toEqual([{ front: 'Paxos', back: 'Consensus', type: 'concept' }]);
    });

    it('parses JSON wrapped in generic ``` code fences', () => {
      const fenced = '```\n{"summary": "Clean study week", "observations": [], "suggestions": []}\n```';
      const parsed = (aiService as any).parseJsonFromLLM(fenced);
      expect(parsed.summary).toBe('Clean study week');
    });

    it('handles extra leading and trailing whitespace around code fences', () => {
      const messy = '   \n\n```json\n{"status": "ok"}\n```   \n\n';
      const parsed = (aiService as any).parseJsonFromLLM(messy);
      expect(parsed).toEqual({ status: 'ok' });
    });

    it('parses JSON wrapped in ```json with conversational preamble and postscript', () => {
      const conversational = `Here are the flashcards you requested for review:
\`\`\`json
[
  {"front": "What is Raft?", "back": "Consensus algorithm", "type": "standard"}
]
\`\`\`
I hope this helps your revision! Let me know if you need more.`;
      const parsed = (aiService as any).parseJsonFromLLM(conversational);
      expect(parsed).toEqual([{ front: 'What is Raft?', back: 'Consensus algorithm', type: 'standard' }]);
    });

    it('extracts bare JSON array embedded within conversational prose without code fences', () => {
      const unpromptedProse = `Certainly! Below is the raw data:
[{"front": "TLB", "back": "Translation Lookaside Buffer", "type": "concept"}]
Best of luck studying!`;
      const parsed = (aiService as any).parseJsonFromLLM(unpromptedProse);
      expect(parsed).toEqual([{ front: 'TLB', back: 'Translation Lookaside Buffer', type: 'concept' }]);
    });

    it('extracts bare JSON object embedded within conversational prose without code fences', () => {
      const unpromptedObj = `Here is your synthesis report:
{"summary": "Solid focus week", "observations": ["Morning velocity high"], "suggestions": ["Rest on Sunday"]}
Keep up the good work.`;
      const parsed = (aiService as any).parseJsonFromLLM(unpromptedObj);
      expect(parsed.summary).toBe('Solid focus week');
      expect(parsed.observations).toHaveLength(1);
    });

    it('throws "AI returned an invalid data format." on malformed JSON', () => {
      const broken = '```json\n{"unclosed": "brace"\n```';
      expect(() => (aiService as any).parseJsonFromLLM(broken)).toThrow(
        'AI returned an invalid data format.'
      );

      const pureGarbage = 'I apologize, but I cannot generate that right now.';
      expect(() => (aiService as any).parseJsonFromLLM(pureGarbage)).toThrow(
        'AI returned an invalid data format.'
      );
    });
  });

  /* =========================================================================
     3. Network & HTTP Error Handling
     ========================================================================= */
  describe('Network & HTTP Error Handling', () => {
    beforeEach(() => {
      mockStorage['solis_gemini_api_key'] = 'AIzaSyValidKeyForErrorTests';
    });

    it('throws descriptive message when network fetch fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(aiService.generateFlashcards('Context')).rejects.toThrow(
        'AI request failed: Failed to fetch'
      );
    });

    it('parses API error message from response JSON on 400 Bad Request', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: 400,
              message: 'API_KEY_INVALID: User key is not authorized'
            }
          }),
          { status: 400, statusText: 'Bad Request', headers: { 'Content-Type': 'application/json' } }
        )
      );

      await expect(aiService.generateFlashcards('Context')).rejects.toThrow(
        'AI request failed: API_KEY_INVALID: User key is not authorized'
      );
    });

    it('falls back to HTTP status text when error body is not valid JSON', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('<html><body>503 Service Unavailable</body></html>', {
          status: 503,
          statusText: 'Service Unavailable'
        })
      );

      await expect(aiService.generateFlashcards('Context')).rejects.toThrow(
        'AI request failed: API Error: 503 Service Unavailable'
      );
    });
  });

  /* =========================================================================
     4. AI Flashcard Generation (generateFlashcards)
     ========================================================================= */
  describe('AI Flashcard Generation (generateFlashcards)', () => {
    beforeEach(() => {
      mockStorage['solis_gemini_api_key'] = 'AIzaSyTestKey';
    });

    it('sends prompt specifying flashcard count and atomic fact requirements', async () => {
      let capturedBody: any = null;

      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
        capturedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify([
                        { front: 'Card 1', back: 'Ans 1', type: 'standard' },
                        { front: 'Card 2', back: 'Ans 2', type: 'cloze' },
                        { front: 'Card 3', back: 'Ans 3', type: 'concept' }
                      ])
                    }
                  ]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const cards = await aiService.generateFlashcards('Detailed notes on Virtual Memory and TLB miss handling.', 3);

      expect(cards).toHaveLength(3);
      expect(cards[0].type).toBe('standard');
      expect(cards[1].type).toBe('cloze');
      expect(cards[2].type).toBe('concept');

      // Verify systemInstruction contains count and Solis learning guidelines
      expect(capturedBody.systemInstruction.parts[0].text).toContain('Generate 3 high-quality flashcards');
      expect(capturedBody.systemInstruction.parts[0].text).toContain('Avoid duplicating facts');
      expect(capturedBody.contents[0].parts[0].text).toContain('Virtual Memory and TLB miss handling');
    });
  });

  /* =========================================================================
     5. AI Quiz Generation (generateQuiz)
     ========================================================================= */
  describe('AI Quiz Generation (generateQuiz)', () => {
    beforeEach(() => {
      mockStorage['solis_gemini_api_key'] = 'AIzaSyTestKey';
    });

    it('generates 4-option questions with correctAnswerIndex and explanations', async () => {
      let capturedBody: any = null;

      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
        capturedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify([
                        {
                          question: 'What is the primary role of the TLB?',
                          options: ['Cache disk pages', 'Cache virtual-to-physical address translations', 'Store kernel stack', 'Manage interrupts'],
                          correctAnswerIndex: 1,
                          explanation: 'The Translation Lookaside Buffer caches virtual-to-physical page mappings to speed up memory access.'
                        }
                      ])
                    }
                  ]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const quiz = await aiService.generateQuiz('Notes on memory management units.', 1);

      expect(quiz).toHaveLength(1);
      expect(quiz[0].question).toBe('What is the primary role of the TLB?');
      expect(quiz[0].options).toHaveLength(4);
      expect(quiz[0].correctAnswerIndex).toBe(1);
      expect(quiz[0].explanation).toContain('Translation Lookaside Buffer');

      expect(capturedBody.systemInstruction.parts[0].text).toContain('rigorous academic assessor');
      expect(capturedBody.systemInstruction.parts[0].text).toContain('Ensure exactly 4 options per question');
    });
  });

  /* =========================================================================
     6. AI Weekly Synthesis (synthesizeWeek)
     ========================================================================= */
  describe('AI Weekly Synthesis (synthesizeWeek)', () => {
    beforeEach(() => {
      mockStorage['solis_gemini_api_key'] = 'AIzaSyTestKey';
    });

    it('produces calm, objective synthesis without motivational fluff', async () => {
      let capturedBody: any = null;

      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
        capturedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        summary: 'You completed 14.5 hours across 3 core subjects with consistent morning velocity.',
                        observations: [
                          'Focus session length averaged 42 minutes, 15% above target.',
                          'Distributed Systems review was neglected on Wednesday.'
                        ],
                        suggestions: [
                          'Schedule an early 60m block for Distributed Systems.',
                          'Introduce active recall flashcards before the weekend.'
                        ]
                      })
                    }
                  ]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const weeklyData = { totalHours: 14.5, completedTasks: 18, subjectsCovered: ['OS', 'Networks'] };
      const synthesis = await aiService.synthesizeWeek(weeklyData);

      expect(synthesis.summary).toContain('14.5 hours');
      expect(synthesis.observations).toHaveLength(2);
      expect(synthesis.suggestions).toHaveLength(2);

      // Verify quiet intelligence instructions
      expect(capturedBody.systemInstruction.parts[0].text).toContain('DO NOT use overly motivational fluff or emojis');
      expect(capturedBody.systemInstruction.parts[0].text).toContain('calm, analytical tone');
      expect(capturedBody.systemInstruction.parts[0].text).toContain('"totalHours": 14.5');
    });
  });

  /* =========================================================================
     7. Ask Solis Grounded Query (askSolis)
     ========================================================================= */
  describe('Ask Solis Grounded Query (askSolis)', () => {
    beforeEach(() => {
      mockStorage['solis_gemini_api_key'] = 'AIzaSyTestKey';
    });

    it('enforces grounding on user knowledge and explicit lack of data fallback', async () => {
      let capturedBody: any = null;

      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
        capturedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: 'Based on your [[Operating Systems]] note, virtual memory utilizes page tables with multi-level hierarchies.'
                    }
                  ]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const notesContext = [
        { title: 'Operating Systems', content: 'Virtual memory uses paging with page tables.', subject: 'CS301' }
      ];

      const answer = await aiService.askSolis('How does virtual memory work?', notesContext);

      expect(answer).toContain('Based on your [[Operating Systems]] note');
      expect(capturedBody.systemInstruction.parts[0].text).toContain('Answer the user\'s question based ONLY on the provided knowledge context');
      expect(capturedBody.systemInstruction.parts[0].text).toContain('explicitly say you don\'t have enough data to answer. Do not hallucinate.');
      expect(capturedBody.contents[0].parts[0].text).toBe('How does virtual memory work?');
    });
  });

  /* =========================================================================
     8. Adaptive Study Plan Suggester (suggestNextStudyActions)
     ========================================================================= */
  describe('Adaptive Study Plan Suggester (suggestNextStudyActions)', () => {
    beforeEach(() => {
      mockStorage['solis_gemini_api_key'] = 'AIzaSyTestKey';
    });

    it('suggests 3 high-yield actionable study items with payload routing metadata', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify([
                        {
                          type: 'review_flashcards',
                          title: 'Review Overdue Flashcards',
                          reason: '12 cards have decayed past their optimal Ebbinghaus interval.',
                          actionPayload: { mode: 'due_only' }
                        },
                        {
                          type: 'study_topic',
                          title: 'Distributed Systems: Raft Consensus',
                          reason: 'Weekly study target is 3.5h behind schedule.',
                          actionPayload: { subjectId: 'sbj-dist-sys', topicId: 'top-raft' }
                        },
                        {
                          type: 'take_quiz',
                          title: 'Self-Quiz on Memory Hierarchy',
                          reason: 'Test retention before next lecture block.',
                          actionPayload: { subjectId: 'sbj-arch' }
                        }
                      ])
                    }
                  ]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const contextData = {
        subjects: [{ id: 'sbj-dist-sys', name: 'Distributed Systems', completedHoursThisWeek: 1, targetHoursPerWeek: 5 }],
        recentSessions: []
      };

      const suggestions = await aiService.suggestNextStudyActions(contextData);

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].type).toBe('review_flashcards');
      expect(suggestions[1].type).toBe('study_topic');
      expect(suggestions[1].actionPayload.subjectId).toBe('sbj-dist-sys');
      expect(suggestions[2].type).toBe('take_quiz');
    });
  });

  describe('Connection Verification (testConnection)', () => {
    it('returns error when no API key is provided', async () => {
      delete mockStorage['solis_gemini_api_key'];
      const res = await aiService.testConnection();
      expect(res.success).toBe(false);
      expect(res.message).toContain('valid Gemini API key');
    });

    it('returns success when API responds with 200 OK', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Hello!' }] } }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const res = await aiService.testConnection('AIzaSyValidKey', 'gemini-3.1-pro-preview');
      expect(res.success).toBe(true);
      expect(res.message).toContain('gemini-3.1-pro-preview');
    });

    it('returns error details when API responds with an error status', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { message: 'API_KEY_INVALID' } }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const res = await aiService.testConnection('AIzaSyInvalidKey');
      expect(res.success).toBe(false);
      expect(res.message).toContain('API_KEY_INVALID');
    });
  });
});
