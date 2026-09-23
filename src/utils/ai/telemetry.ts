/**
 * Solis AI/ML Engineering — Telemetry & Observability Engine
 *
 * Implements:
 * 1. Time-to-First-Token (TTFT) and end-to-end latency tracking
 * 2. Token consumption estimation (prompt vs completion)
 * 3. Gemini 1.5 Flash inference cost calculation ($0.075/1M input, $0.30/1M output)
 * 4. Telemetry event bus for UI performance badges
 */

export interface LatencyRecord {
  requestId: string;
  operation: 'ask_solis' | 'flashcards' | 'quiz' | 'synthesis' | 'study_plan';
  startTimeMs: number;
  endTimeMs: number;
  ttftMs?: number;
  totalDurationMs: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  timestamp: string;
}

type TelemetryListener = (record: LatencyRecord) => void;

class AITelemetryTracker {
  private history: LatencyRecord[] = [];
  private listeners: Set<TelemetryListener> = new Set();

  // Gemini 1.5 Flash pricing (USD per 1 Million tokens)
  private readonly INPUT_COST_PER_MILLION = 0.075;
  private readonly OUTPUT_COST_PER_MILLION = 0.30;

  /**
   * Records a completed AI operation with latency and token metrics
   */
  public record(params: {
    requestId?: string;
    operation: LatencyRecord['operation'];
    startTimeMs: number;
    endTimeMs?: number;
    ttftMs?: number;
    promptText?: string;
    completionText?: string;
    promptTokens?: number;
    completionTokens?: number;
  }): LatencyRecord {
    const end = params.endTimeMs || performance.now();
    const duration = Math.max(1, Math.round(end - params.startTimeMs));

    // Calculate or estimate tokens
    const promptTokens = params.promptTokens ?? (params.promptText ? Math.ceil(params.promptText.split(/\s+/).length * 1.3) : 0);
    const completionTokens = params.completionTokens ?? (params.completionText ? Math.ceil(params.completionText.split(/\s+/).length * 1.3) : 0);

    // Compute cost in USD
    const inputCost = (promptTokens / 1_000_000) * this.INPUT_COST_PER_MILLION;
    const outputCost = (completionTokens / 1_000_000) * this.OUTPUT_COST_PER_MILLION;
    const estimatedCostUsd = Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;

    const record: LatencyRecord = {
      requestId: params.requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      operation: params.operation,
      startTimeMs: params.startTimeMs,
      endTimeMs: end,
      ttftMs: params.ttftMs,
      totalDurationMs: duration,
      promptTokens,
      completionTokens,
      estimatedCostUsd,
      timestamp: new Date().toISOString()
    };

    this.history.push(record);
    if (this.history.length > 100) {
      this.history.shift(); // Keep latest 100 records
    }

    this.listeners.forEach(fn => {
      try {
        fn(record);
      } catch (err) {
        console.error('Error in telemetry listener:', err);
      }
    });

    return record;
  }

  /**
   * Subscribe to new telemetry events
   */
  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get latest record
   */
  public getLatestRecord(): LatencyRecord | null {
    return this.history[this.history.length - 1] || null;
  }

  /**
   * Get aggregated summary statistics
   */
  public getSummary(): {
    totalRequests: number;
    avgLatencyMs: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalEstimatedCostUsd: number;
  } {
    if (this.history.length === 0) {
      return {
        totalRequests: 0,
        avgLatencyMs: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalEstimatedCostUsd: 0
      };
    }

    let totalDuration = 0;
    let totalPrompt = 0;
    let totalCompletion = 0;
    let totalCost = 0;

    for (const r of this.history) {
      totalDuration += r.totalDurationMs;
      totalPrompt += r.promptTokens;
      totalCompletion += r.completionTokens;
      totalCost += r.estimatedCostUsd;
    }

    return {
      totalRequests: this.history.length,
      avgLatencyMs: Math.round(totalDuration / this.history.length),
      totalPromptTokens: totalPrompt,
      totalCompletionTokens: totalCompletion,
      totalEstimatedCostUsd: Math.round(totalCost * 1_000_000) / 1_000_000
    };
  }

  /**
   * Clear all telemetry history (e.g. for testing)
   */
  public clear(): void {
    this.history = [];
  }
}

export const aiTelemetry = new AITelemetryTracker();
