export class AIService {
  private getApiKey(): string | null {
    return localStorage.getItem('solis_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || null;
  }

  private async generateContent(prompt: string, systemInstruction?: string, model: 'gemini-1.5-flash' | 'gemini-1.5-pro' = 'gemini-1.5-flash'): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('AI features require a Gemini API Key. Please add one in Settings.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

  // 1. AI Flashcard Generation
  async generateFlashcards(textContext: string, count: number = 3): Promise<Array<{ front: string, back: string, type: 'standard' | 'cloze' | 'concept' }>> {
    const systemPrompt = `You are a learning assistant for Solis. Generate ${count} high-quality flashcards based ONLY on the provided text.
Avoid duplicating facts. Keep atomic facts per card. 
Types can be:
- 'standard': Question on front, answer on back.
- 'concept': Concept name on front, explanation on back.
- 'cloze': A sentence with a missing word on front like "The capital of France is {{Paris}}", and "Paris" on back.

Format your output STRICTLY as a JSON array of objects with 'front', 'back', and 'type' keys. 
No preamble, no explanation, only the JSON block.`;

    const responseText = await this.generateContent(textContext, systemPrompt);
    return this.parseJsonFromLLM<Array<{ front: string, back: string, type: 'standard' | 'cloze' | 'concept' }>>(responseText);
  }

  // 2. AI Quiz Generation
  async generateQuiz(textContext: string, count: number = 3): Promise<Array<{ question: string, options: string[], correctAnswerIndex: number, explanation: string }>> {
    const systemPrompt = `You are a rigorous academic assessor. Generate ${count} multiple choice questions based ONLY on the provided text.
Questions should test understanding, not just trivia. Ensure exactly 4 options per question.
Format your output STRICTLY as a JSON array of objects. Each object must have:
- 'question': string
- 'options': string[] (length 4)
- 'correctAnswerIndex': number (0-3)
- 'explanation': string (why the answer is correct and others are wrong)

No preamble, no explanation, only the JSON block.`;

    const responseText = await this.generateContent(textContext, systemPrompt);
    return this.parseJsonFromLLM<Array<{ question: string, options: string[], correctAnswerIndex: number, explanation: string }>>(responseText);
  }

  // 3. AI Weekly Synthesis
  async synthesizeWeek(studyData: any): Promise<{ summary: string, observations: string[], suggestions: string[] }> {
    const systemPrompt = `You are the Solis Intelligence engine. You analyze weekly study data and provide a grounded, objective synthesis.
DO NOT use overly motivational fluff or emojis. Use a calm, analytical tone.
Output MUST be a JSON object with:
- 'summary': A concise 2-3 sentence summary of the week's effort.
- 'observations': Array of 2-4 strings highlighting key patterns (e.g. "Focus duration dropped on Thursday").
- 'suggestions': Array of 2-3 actionable recommendations based on the data (e.g. "Consider a review block for weak topics").

Here is the JSON data of the week's activity:
${JSON.stringify(studyData, null, 2)}`;

    const responseText = await this.generateContent('Synthesize my week.', systemPrompt);
    return this.parseJsonFromLLM(responseText);
  }

  // 4. Ask Solis / Semantic Search
  async askSolis(query: string, knowledgeContext: any[]): Promise<string> {
    const systemPrompt = `You are Solis, an integrated learning assistant. Answer the user's question based ONLY on the provided knowledge context. 
If the information is not in the context, explicitly say you don't have enough data to answer. Do not hallucinate.
Cite the source notes or topics where appropriate.
Context data:
${JSON.stringify(knowledgeContext, null, 2)}`;

    return this.generateContent(query, systemPrompt);
  }

  // 5. Adaptive Study Plan Suggester
  async suggestNextStudyActions(contextData: any): Promise<Array<{ type: string, title: string, reason: string, actionPayload: any }>> {
    const systemPrompt = `You are the Solis Learning Intelligence engine. Your job is to suggest the "Next Best Study Actions" for the user.
Analyze their due flashcards, weak mastery topics, upcoming exams, and recent activity.
Suggest exactly 3 actionable items.

Output MUST be a JSON array of objects with:
- 'type': 'review_flashcards' | 'study_topic' | 'take_quiz' | 'review_note'
- 'title': Short descriptive title
- 'reason': Concise, evidence-based reason (e.g., "Retention has dropped to 62%")
- 'actionPayload': JSON object with required IDs (e.g., { subjectId, topicId })

Context Data:
${JSON.stringify(contextData, null, 2)}
`;

    const responseText = await this.generateContent('Suggest my next study actions.', systemPrompt);
    return this.parseJsonFromLLM(responseText);
  }
}

export const aiService = new AIService();
