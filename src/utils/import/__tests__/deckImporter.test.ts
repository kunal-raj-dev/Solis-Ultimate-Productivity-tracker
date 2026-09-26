import { describe, it, expect } from 'vitest';
import {
  mapAnkiClozeToSolis,
  parseAnkiApkg,
  parseDeckFile,
  parseDelimitedDeck,
  stripAnkiMarkup,
  unzipArchive
} from '../deckImporter';
import {
  buildCollectionDb,
  buildZip,
  deflateRawOptional,
  toBuffer
} from './apkgFixture';

/**
 * Phase 4.4 — Anki (.apkg) & Quizlet deck importer harness (plan §4.4).
 *
 * The .apkg fixtures are hand-built ZIP archives (apkgFixture.ts) containing a
 * minimal SQLite collection (collection.anki2) with a `notes` table and a
 * `col` metadata row large enough to exercise the overflow-page reassembly
 * path of the read-only SQLite parser.
 */

// ── Cloze mapping ────────────────────────────────────────────────────────────

describe('mapAnkiClozeToSolis (plan §4.4)', () => {
  it('maps {{c1::term}} markers to the Solis {{term}} format', () => {
    const mapped = mapAnkiClozeToSolis('{{c1::hippocampus}} is needed for {{c2::memory}}');
    expect(mapped.text).toBe('{{hippocampus}} is needed for {{memory}}');
    expect(mapped.terms).toEqual(['hippocampus', 'memory']);
  });

  it('drops cloze hints and tolerates text without markers', () => {
    const hinted = mapAnkiClozeToSolis('{{c1::term::the hint}}');
    expect(hinted.text).toBe('{{term}}');
    expect(hinted.terms).toEqual(['term']);

    const plain = mapAnkiClozeToSolis('no markers here');
    expect(plain.text).toBe('no markers here');
    expect(plain.terms).toEqual([]);
  });
});

describe('stripAnkiMarkup', () => {
  it('removes HTML, sound tags, and entities', () => {
    expect(stripAnkiMarkup('<b>Neuron</b><br>Basic unit [sound:neuron.mp3] &amp; more')).toBe(
      'Neuron\nBasic unit & more'
    );
  });
});

// ── Quizlet-style text exports ───────────────────────────────────────────────

describe('parseDelimitedDeck (Quizlet text exports)', () => {
  it('parses tab-separated rows (Quizlet default)', () => {
    const result = parseDelimitedDeck(
      'Mitochondria\tPowerhouse of the cell\nRibosome\tProtein factory\n'
    );
    expect(result.sourceFormat).toBe('quizlet_text');
    expect(result.cards).toEqual([
      { frontPrompt: 'Mitochondria', backAnswer: 'Powerhouse of the cell', cardType: 'standard' },
      { frontPrompt: 'Ribosome', backAnswer: 'Protein factory', cardType: 'standard' }
    ]);
    expect(result.warnings).toEqual([]);
  });

  it('auto-detects comma separation and honors quoted CSV fields', () => {
    const result = parseDelimitedDeck('"Term, with comma","Definition, also quoted"\nPlain,A definition');
    expect(result.cards).toHaveLength(2);
    expect(result.cards[0]).toEqual({
      frontPrompt: 'Term, with comma',
      backAnswer: 'Definition, also quoted',
      cardType: 'standard'
    });
  });

  it('maps embedded Anki cloze markers in text exports', () => {
    const result = parseDelimitedDeck('The {{c1::hippocampus}} forms memories\tA neuroscience fact');
    expect(result.cards).toEqual([
      { frontPrompt: 'The {{hippocampus}} forms memories', backAnswer: 'hippocampus', cardType: 'cloze' }
    ]);
  });

  it('skips incomplete rows with a warning', () => {
    const result = parseDelimitedDeck('Only a term\n\nTerm\tDef');
    expect(result.cards).toHaveLength(1);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

// ── ZIP container (.apkg) ────────────────────────────────────────────────────

describe('unzipArchive', () => {
  it('reads stored entries from a hand-built ZIP', async () => {
    const zip = buildZip([
      { name: 'collection.anki2', data: buildCollectionDb() },
      { name: 'media', data: new TextEncoder().encode('{}') }
    ]);
    const entries = await unzipArchive(toBuffer(zip));
    expect([...entries.keys()].sort()).toEqual(['collection.anki2', 'media']);
    expect(entries.get('media')!.length).toBe(2);
  });

  it.skipIf(!deflateRawOptional.available)('inflates deflate-compressed entries', async () => {
    const payload = new TextEncoder().encode('{"1": {"name": "Default"}}');
    const zip = buildZip([{ name: 'media', data: await deflateRawOptional.compress(payload), method: 8 }]);
    const entries = await unzipArchive(toBuffer(zip));
    expect(new TextDecoder().decode(entries.get('media')!)).toBe('{"1": {"name": "Default"}}');
  });
});

// ── Full .apkg parse ─────────────────────────────────────────────────────────

describe('parseAnkiApkg (plan §4.4)', () => {
  it('extracts cards, maps cloze markers, strips markup, and names the deck', async () => {
    const zip = buildZip([{ name: 'collection.anki2', data: buildCollectionDb() }]);
    const result = await parseAnkiApkg(toBuffer(zip));

    expect(result.sourceFormat).toBe('anki_apkg');
    expect(result.deckName).toBe('Neuroanatomy 101');
    expect(result.warnings).toEqual([]);
    expect(result.cards).toEqual([
      {
        frontPrompt: 'What is the hippocampus?',
        backAnswer: 'A memory structure in the temporal lobe',
        cardType: 'standard'
      },
      {
        frontPrompt: '{{hippocampus}} is needed for {{memory}}',
        backAnswer: 'hippocampus, memory',
        cardType: 'cloze'
      },
      {
        frontPrompt: 'Neuron\nBasic unit',
        backAnswer: 'Chapter 3',
        cardType: 'standard'
      }
    ]);
  });

  it('rejects packages without a collection database with an honest error', async () => {
    const zip = buildZip([{ name: 'media', data: new TextEncoder().encode('{}') }]);
    await expect(parseAnkiApkg(toBuffer(zip))).rejects.toThrow(/no collection database/);
  });

  it('rejects non-ZIP input with an honest error', async () => {
    const notZip = new TextEncoder().encode('plain text, not a deck');
    await expect(parseAnkiApkg(toBuffer(notZip))).rejects.toThrow(/ZIP central directory/);
  });
});

describe('parseDeckFile router', () => {
  it('routes .apkg files to the Anki parser', async () => {
    const zip = buildZip([{ name: 'collection.anki2', data: buildCollectionDb() }]);
    const result = await parseDeckFile('deck.apkg', toBuffer(zip));
    expect(result.sourceFormat).toBe('anki_apkg');
    expect(result.cards.length).toBe(3);
  });

  it('routes .txt files to the Quizlet text parser', async () => {
    const text = new TextEncoder().encode('Term\tDefinition');
    const result = await parseDeckFile('quizlet-export.txt', toBuffer(text));
    expect(result.sourceFormat).toBe('quizlet_text');
    expect(result.cards).toHaveLength(1);
  });
});
