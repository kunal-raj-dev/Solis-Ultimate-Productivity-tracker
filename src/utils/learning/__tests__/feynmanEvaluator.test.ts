import { describe, it, expect } from 'vitest';
import {
  evaluateFeynmanExplanation,
  extractCanonicalConcepts,
  unwrapClozeText
} from '../feynmanEvaluator';

describe('Feature 3.2: Socratic Feynman Mode Active-Recall Evaluator', () => {
  it('unwraps Anki/Solis cloze syntax and extracts hidden target concepts', () => {
    const { plainText, clozeTargets } = unwrapClozeText(
      'Oxidative phosphorylation occurs in the {{c1::inner mitochondrial membrane::location}} and generates {{c2::ATP}}.'
    );
    expect(plainText).toBe(
      'Oxidative phosphorylation occurs in the inner mitochondrial membrane and generates ATP.'
    );
    expect(clozeTargets).toEqual(['inner mitochondrial membrane', 'ATP']);
  });

  it('extracts domain concepts while filtering out common stop words', () => {
    const concepts = extractCanonicalConcepts(
      'What is the role of the sodium-potassium pump?',
      'It uses ATP hydrolysis to actively transport 3 sodium ions out and 2 potassium ions into the cell against their electrochemical gradient.'
    );
    expect(concepts).toContain('hydrolysis');
    expect(concepts).toContain('electrochemical');
    expect(concepts).not.toContain('their');
    expect(concepts).not.toContain('into');
  });

  it('awards mastery (>= 85%) and recommends "easy" for comprehensive first-principles explanations', () => {
    const front = 'How does TCP congestion control react to a timeout?';
    const back =
      'TCP reduces the congestion window to 1 MSS, sets slow start threshold to half the flight size, and enters slow start.';
    const userExplanation =
      'Because a timeout signals severe packet loss, TCP resets its congestion window to 1 MSS and cuts the slow start threshold to half the flight size before entering slow start.';

    const result = evaluateFeynmanExplanation(front, back, userExplanation);

    expect(result.comprehensionScore).toBeGreaterThanOrEqual(85);
    expect(result.verdict).toBe('mastery');
    expect(result.recommendedRating).toBe('easy');
    expect(result.missingMechanisms).toHaveLength(0);
    expect(result.socraticFollowUp).toContain('stress-test your intuition');
  });

  it('identifies omitted mechanisms and generates a targeted Socratic follow-up question for partial explanations', () => {
    const front = 'Explain how mRNA vaccines trigger adaptive immunity.';
    const back =
      'Lipid nanoparticles deliver mRNA into host ribosomes, translating viral spike protein that dendritic cells present to T cells and B cells to produce neutralizing antibodies.';
    const userExplanation =
      'The vaccine delivers mRNA so ribosomes translate spike protein inside cells.';

    const result = evaluateFeynmanExplanation(front, back, userExplanation);

    expect(result.comprehensionScore).toBeGreaterThanOrEqual(35);
    expect(result.comprehensionScore).toBeLessThan(85);
    expect(result.capturedConcepts).toContain('ribosomes');
    expect(result.missingMechanisms.length).toBeGreaterThan(0);
    expect(result.socraticFollowUp).toMatch(/interact|role/i);
  });

  it('handles empty or unrelated explanations gracefully and recommends "again"', () => {
    const front = 'State the Second Law of Thermodynamics.';
    const back = 'Total entropy of an isolated system always increases over time during spontaneous processes.';

    const emptyRes = evaluateFeynmanExplanation(front, back, '   ');
    expect(emptyRes.comprehensionScore).toBe(0);
    expect(emptyRes.recommendedRating).toBe('again');
    expect(emptyRes.verdict).toBe('incomplete');

    const unrelatedRes = evaluateFeynmanExplanation(front, back, 'I am not sure, something about gravity.');
    expect(unrelatedRes.comprehensionScore).toBeLessThan(40);
    expect(unrelatedRes.recommendedRating).toBe('again');
    expect(unrelatedRes.missingMechanisms).toContain('entropy');
  });
});
