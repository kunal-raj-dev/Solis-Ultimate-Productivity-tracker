/**
 * Solis AI/ML Engineering — Production RAG Pipeline Engine
 *
 * Implements:
 * 1. Hierarchy-preserving Markdown document chunking (300-600 tokens with 15% overlap)
 * 2. Sparse BM25 indexer (k1=1.5, b=0.75) with IDF calculation
 * 3. Dense semantic vector indexer with L2-normalized cosine similarity
 * 4. Reciprocal Rank Fusion (RRF, k=60)
 * 5. Cross-feature precision reranker
 */

export interface DocumentChunk {
  id: string;
  docId: string;
  title: string;
  breadcrumb: string;
  content: string;
  tokenCount: number;
  /**
   * Plan §8.2 grounded citations: `sourceLineIndex` records the 0-based line
   * in the original markdown where this chunk's first paragraph begins, so
   * generated flashcards can cite (and link back to) the exact note paragraph.
   */
  metadata?: {
    sourceLineIndex?: number;
  } & Record<string, any>;
}

/** Typed accessor for the chunk's source-line lineage (defaults to 0). */
export function getChunkSourceLineIndex(chunk: DocumentChunk): number {
  const idx = chunk.metadata?.sourceLineIndex;
  return typeof idx === 'number' && Number.isFinite(idx) && idx >= 0 ? idx : 0;
}

export interface RankedChunk {
  chunk: DocumentChunk;
  score: number;
  rank: number;
  retriever: 'bm25' | 'dense' | 'rrf';
}

/**
 * Approximate token count based on standard English word/subword heuristic (~1.3 tokens per word)
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words * 1.3));
}

/**
 * Standard tokenization helper for BM25 and keyword search
 */
export function tokenizeText(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1);
}

/**
 * 1. Hierarchy-Preserving Markdown Chunker
 * Retains heading breadcrumbs (# Subject > ## Topic > ### Section),
 * targets 300-600 tokens, with 15% overlap window.
 */
export function chunkMarkdownDocument(
  docId: string,
  title: string,
  markdown: string,
  options: { targetTokens?: number; overlapTokens?: number } = {}
): DocumentChunk[] {
  const targetTokens = options.targetTokens || 450;
  const overlapTokens = options.overlapTokens || Math.round(targetTokens * 0.15); // ~67 tokens (15%)

  if (!markdown || !markdown.trim()) {
    return [{
      id: `${docId}-chunk-0`,
      docId,
      title,
      breadcrumb: title,
      content: '',
      tokenCount: 0,
      metadata: { sourceLineIndex: 0 }
    }];
  }

  const lines = markdown.split('\n');

  // Pass 1: collect paragraphs with their source line so every chunk can cite
  // the exact paragraph it was grounded in (plan §8.2).
  interface SourceParagraph {
    text: string;
    startLine: number;
  }
  const sections: Array<{ headingPath: string[]; paragraphs: SourceParagraph[] }> = [];
  let currentHeadings: string[] = [title];
  let currentParagraphLines: string[] = [];
  let currentParagraphStartLine = 0;
  sections.push({ headingPath: [...currentHeadings], paragraphs: [] });

  const flushParagraph = (): void => {
    const text = currentParagraphLines.join('\n').trim();
    if (text.length > 0) {
      sections[sections.length - 1].paragraphs.push({
        text,
        startLine: currentParagraphStartLine
      });
    }
    currentParagraphLines = [];
  };

  lines.forEach((line, lineIndex) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      currentHeadings = currentHeadings.slice(0, level);
      currentHeadings[level - 1] = headingText;
      sections.push({ headingPath: [...currentHeadings], paragraphs: [] });
    } else if (line.trim() === '') {
      flushParagraph();
    } else {
      if (currentParagraphLines.length === 0) {
        currentParagraphStartLine = lineIndex;
      }
      currentParagraphLines.push(line);
    }
  });
  flushParagraph();

  // Pass 2: same token-budget chunking as before, now carrying lineage.
  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const breadcrumb = section.headingPath.filter(Boolean).join(' > ');

    let activeTokens: string[] = [];
    let chunkStartLine: number | null = null;
    let lastParagraphLine: number | null = null;

    const emitChunk = (): void => {
      chunks.push({
        id: `${docId}-chunk-${chunkIndex++}`,
        docId,
        title,
        breadcrumb,
        content: activeTokens.join(' '),
        tokenCount: Math.ceil(activeTokens.length * 1.3),
        metadata: { sourceLineIndex: chunkStartLine ?? 0 }
      });
    };

    for (const para of section.paragraphs) {
      const paraWords = para.text.trim().split(/\s+/);
      const estTokens = Math.ceil(paraWords.length * 1.3);

      if (activeTokens.length > 0 && (activeTokens.length * 1.3 + estTokens) > targetTokens) {
        // Emit current chunk
        emitChunk();

        // 15% sliding window overlap — the tail belongs to the previous paragraph.
        const overlapWordCount = Math.max(0, Math.floor(overlapTokens / 1.3));
        activeTokens = activeTokens.slice(-overlapWordCount);
        chunkStartLine = lastParagraphLine;
      }

      if (activeTokens.length === 0) {
        chunkStartLine = para.startLine;
      }

      activeTokens.push(...paraWords);
      lastParagraphLine = para.startLine;
    }

    if (activeTokens.length > 0) {
      emitChunk();
    }
  }

  return chunks.length > 0 ? chunks : [{
    id: `${docId}-chunk-0`,
    docId,
    title,
    breadcrumb: title,
    content: markdown.trim(),
    tokenCount: estimateTokenCount(markdown),
    metadata: { sourceLineIndex: 0 }
  }];
}

/**
 * 2. Sparse BM25 Keyword Search Index
 * Mathematical parameters: k1 = 1.5, b = 0.75
 */
export class BM25Index {
  private chunks: DocumentChunk[] = [];
  private docLengths: number[] = [];
  private avgDocLength: number = 0;
  private docFreqs: Map<string, number> = new Map();
  private termFreqsPerDoc: Array<Map<string, number>> = [];
  private readonly k1: number;
  private readonly b: number;

  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  public indexChunks(chunks: DocumentChunk[]): void {
    this.chunks = chunks;
    this.docLengths = [];
    this.docFreqs.clear();
    this.termFreqsPerDoc = [];

    let totalLength = 0;

    for (let i = 0; i < chunks.length; i++) {
      const fullText = `${chunks[i].title} ${chunks[i].breadcrumb} ${chunks[i].content}`;
      const tokens = tokenizeText(fullText);
      const docLen = tokens.length;
      this.docLengths.push(docLen);
      totalLength += docLen;

      const tf = new Map<string, number>();
      const seenInDoc = new Set<string>();

      for (const token of tokens) {
        tf.set(token, (tf.get(token) || 0) + 1);
        if (!seenInDoc.has(token)) {
          seenInDoc.add(token);
          this.docFreqs.set(token, (this.docFreqs.get(token) || 0) + 1);
        }
      }
      this.termFreqsPerDoc.push(tf);
    }

    this.avgDocLength = chunks.length > 0 ? totalLength / chunks.length : 1;
  }

  public search(query: string, topK = 10): RankedChunk[] {
    const queryTokens = tokenizeText(query);
    if (queryTokens.length === 0 || this.chunks.length === 0) return [];

    const scores: Array<{ chunk: DocumentChunk; score: number }> = [];
    const N = this.chunks.length;

    for (let i = 0; i < N; i++) {
      let docScore = 0;
      const tfMap = this.termFreqsPerDoc[i];
      const docLen = this.docLengths[i];

      for (const token of queryTokens) {
        const df = this.docFreqs.get(token) || 0;
        if (df === 0) continue;

        // Robertson-Spärck Jones IDF formula with +0.5 smoothing
        const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
        const tf = tfMap.get(token) || 0;

        // BM25 term weighting
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength));
        docScore += idf * (numerator / denominator);
      }

      if (docScore > 0) {
        scores.push({ chunk: this.chunks[i], score: docScore });
      }
    }

    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK).map((res, idx) => ({
      chunk: res.chunk,
      score: res.score,
      rank: idx + 1,
      retriever: 'bm25'
    }));
  }
}

/**
 * 3. Dense Semantic Vector Index
 * Implements deterministic semantic vector embeddings using character/subword n-grams
 * and L2-normalized cosine similarity.
 */
export class DenseSemanticIndex {
  private chunks: DocumentChunk[] = [];
  private vectors: Float32Array[] = [];
  private readonly dimensions = 256;

  public indexChunks(chunks: DocumentChunk[]): void {
    this.chunks = chunks;
    this.vectors = chunks.map(chunk => {
      const text = `${chunk.title} ${chunk.breadcrumb} ${chunk.content}`;
      return this.computeEmbedding(text);
    });
  }

  /**
   * Deterministic L2-normalized semantic embedding representation
   */
  public computeEmbedding(text: string): Float32Array {
    const vec = new Float32Array(this.dimensions);
    const tokens = tokenizeText(text);

    // Hash tokens and character trigrams into dimensions with sign hashing
    for (const token of tokens) {
      this.hashStringToVector(token, vec, 1.0);
      for (let i = 0; i <= token.length - 3; i++) {
        const trigram = token.substring(i, i + 3);
        this.hashStringToVector(trigram, vec, 0.5);
      }
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      norm += vec[i] * vec[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vec[i] /= norm;
      }
    }

    return vec;
  }

  private hashStringToVector(str: string, vec: Float32Array, weight: number): void {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    const idx = Math.abs(hash) % this.dimensions;
    const sign = (hash & 1) === 0 ? 1 : -1;
    vec[idx] += sign * weight;
  }

  public search(query: string, topK = 10): RankedChunk[] {
    if (this.chunks.length === 0) return [];
    const queryVec = this.computeEmbedding(query);

    const scores: Array<{ chunk: DocumentChunk; score: number }> = [];

    for (let i = 0; i < this.chunks.length; i++) {
      const docVec = this.vectors[i];
      // Dot product of L2-normalized vectors is Cosine Similarity
      let dot = 0;
      for (let d = 0; d < this.dimensions; d++) {
        dot += queryVec[d] * docVec[d];
      }
      if (dot > 0.05) {
        scores.push({ chunk: this.chunks[i], score: dot });
      }
    }

    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK).map((res, idx) => ({
      chunk: res.chunk,
      score: res.score,
      rank: idx + 1,
      retriever: 'dense'
    }));
  }
}

/**
 * 4. Reciprocal Rank Fusion (RRF)
 * Standard formula from references/rag-evaluation.md:
 * RRF Score(d) = sum_{m in M} 1 / (k + r_m(d))
 * Where k is the smoothing constant (standard k = 60).
 */
export function reciprocalRankFusion(
  rankings: Array<RankedChunk[]>,
  k = 60,
  topK = 5
): RankedChunk[] {
  const rrfScores = new Map<string, { chunk: DocumentChunk; score: number }>();

  for (const ranking of rankings) {
    for (const item of ranking) {
      const existing = rrfScores.get(item.chunk.id);
      const scoreAddition = 1 / (k + item.rank);

      if (existing) {
        existing.score += scoreAddition;
      } else {
        rrfScores.set(item.chunk.id, {
          chunk: item.chunk,
          score: scoreAddition
        });
      }
    }
  }

  const fused = Array.from(rrfScores.values());
  fused.sort((a, b) => b.score - a.score);

  return fused.slice(0, topK).map((res, idx) => ({
    chunk: res.chunk,
    score: res.score,
    rank: idx + 1,
    retriever: 'rrf'
  }));
}

/**
 * 5. Cross-Feature Precision Reranker
 * Prioritizes title exact matches, heading proximity, and term coverage.
 */
export function rerankCandidates(query: string, candidates: RankedChunk[], topK = 5): RankedChunk[] {
  const queryTokens = tokenizeText(query);
  const qLower = query.toLowerCase();

  const scored = candidates.map(cand => {
    let boost = cand.score; // Base RRF score

    const titleLower = cand.chunk.title.toLowerCase();
    const breadcrumbLower = cand.chunk.breadcrumb.toLowerCase();
    const contentLower = cand.chunk.content.toLowerCase();

    // Boost exact phrase matches in title or breadcrumbs
    if (titleLower.includes(qLower) || breadcrumbLower.includes(qLower)) {
      boost += 0.25;
    }

    // Term coverage ratio
    let matchedTerms = 0;
    for (const token of queryTokens) {
      if (contentLower.includes(token) || titleLower.includes(token)) {
        matchedTerms++;
      }
    }
    const coverage = queryTokens.length > 0 ? matchedTerms / queryTokens.length : 0;
    boost += coverage * 0.15;

    return {
      chunk: cand.chunk,
      score: boost,
      rank: 0,
      retriever: 'rrf' as const
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}
