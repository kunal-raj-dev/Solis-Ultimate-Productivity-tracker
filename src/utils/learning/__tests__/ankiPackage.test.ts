import { describe, it, expect } from 'vitest';
import {
  crc32,
  mapSolisClozeToAnki,
  generateAnkiExportTsv,
  createZipArchive,
  createAnkiPackageApkg
} from '../../export/ankiExporter';
import { unzipArchive } from '../../import/deckImporter';
import { Flashcard } from '../../../types/learning';

describe('Feature 2.3: Anki Package Exporter & Format Bridge', () => {
  describe('crc32 calculation', () => {
    it('computes expected CRC-32 checksums for sample data', () => {
      const encoder = new TextEncoder();
      const empty = encoder.encode('');
      expect(crc32(empty)).toBe(0);

      const hello = encoder.encode('123456789');
      // Standard check value for "123456789" is 0xcbf43926 (3421780262)
      expect(crc32(hello)).toBe(0xcbf43926);
    });
  });

  describe('mapSolisClozeToAnki', () => {
    it('converts basic Solis cloze syntax [c1:term] to {{c1::term}}', () => {
      const input = 'Photosynthesis occurs in the [c1:chloroplast].';
      const output = mapSolisClozeToAnki(input);
      expect(output).toBe('Photosynthesis occurs in the {{c1::chloroplast}}.');
    });

    it('converts Solis cloze syntax with hints [c1:term:hint] to {{c1::term::hint}}', () => {
      const input = 'Mitochondria produces [c1:ATP:cellular energy currency].';
      const output = mapSolisClozeToAnki(input);
      expect(output).toBe('Mitochondria produces {{c1::ATP::cellular energy currency}}.');
    });

    it('converts multiple numbered clozes in one text', () => {
      const input = 'The capital of [c1:France] is [c2:Paris].';
      const output = mapSolisClozeToAnki(input);
      expect(output).toBe('The capital of {{c1::France}} is {{c2::Paris}}.');
    });

    it('leaves text without cloze markers intact', () => {
      const input = 'What is Newton’s Second Law?';
      expect(mapSolisClozeToAnki(input)).toBe(input);
    });
  });

  describe('generateAnkiExportTsv', () => {
    const mockCards: Flashcard[] = [
      {
        id: 'fc-1',
        subjectId: 'sub-1',
        topicTitle: 'Thermodynamics',
        frontPrompt: 'What is entropy?',
        backAnswer: 'A measure of microscopic disorder.',
        cardType: 'standard',
        difficultyRating: 'good',
        repetitionCount: 3,
        intervalDays: 7,
        easeFactor: 2.5,
        nextReviewDate: '2026-10-01',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z'
      },
      {
        id: 'fc-2',
        subjectId: 'sub-1',
        topicTitle: 'Kinematics',
        frontPrompt: 'Acceleration is the derivative of [c1:velocity] with respect to [c2:time].',
        backAnswer: 'a = dv/dt',
        cardType: 'cloze',
        difficultyRating: 'easy',
        repetitionCount: 5,
        intervalDays: 14,
        easeFactor: 2.7,
        nextReviewDate: '2026-10-05',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z'
      }
    ];

    it('generates compliant TSV headers and data rows', () => {
      const tsv = generateAnkiExportTsv(mockCards, { subjectName: 'Physics' });
      const lines = tsv.trim().split('\n');

      expect(lines[0]).toBe('#separator:tab');
      expect(lines[1]).toBe('#html:true');
      expect(lines[2]).toBe('#tags column:3');

      // First card
      const card1 = lines[3].split('\t');
      expect(card1[0]).toBe('What is entropy?');
      expect(card1[1]).toBe('A measure of microscopic disorder.');
      expect(card1[2]).toContain('Physics');
      expect(card1[2]).toContain('Thermodynamics');

      // Second card (cloze converted)
      const card2 = lines[4].split('\t');
      expect(card2[0]).toBe('Acceleration is the derivative of {{c1::velocity}} with respect to {{c2::time}}.');
      expect(card2[1]).toBe('a = dv/dt');
      expect(card2[2]).toContain('Kinematics');
      expect(card2[2]).toContain('cloze');
    });

    it('escapes newlines and carriage returns inside TSV cells', () => {
      const multilineCards: Flashcard[] = [
        {
          id: 'fc-3',
          subjectId: 'sub-1',
          frontPrompt: 'Step 1\nStep 2',
          backAnswer: 'Result A\nResult B',
          cardType: 'standard',
          difficultyRating: 'good',
          repetitionCount: 1,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewDate: '2026-10-01',
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z'
        }
      ];

      const tsv = generateAnkiExportTsv(multilineCards, { subjectName: 'Math' });
      const lines = tsv.trim().split('\n');
      expect(lines.length).toBe(4); // 3 headers + 1 row
      expect(lines[3]).toContain('Step 1<br>Step 2');
      expect(lines[3]).toContain('Result A<br>Result B');
    });
  });

  describe('createZipArchive and createAnkiPackageApkg', () => {
    it('creates a valid ZIP archive unpackable by unzipArchive', async () => {
      const encoder = new TextEncoder();
      const files = [
        { name: 'hello.txt', data: encoder.encode('Hello, world!') },
        { name: 'folder/nested.txt', data: encoder.encode('Nested file content.') }
      ];

      const zipBytes = createZipArchive(files);
      expect(zipBytes.byteLength).toBeGreaterThan(0);

      // Verify ZIP magic bytes (PK\x03\x04)
      expect(zipBytes[0]).toBe(0x50);
      expect(zipBytes[1]).toBe(0x4b);
      expect(zipBytes[2]).toBe(0x03);
      expect(zipBytes[3]).toBe(0x04);

      // Unpack using Solis unzipArchive
      const entries = await unzipArchive(zipBytes.buffer as ArrayBuffer);
      expect(entries.size).toBe(2);
      expect(entries.has('hello.txt')).toBe(true);
      expect(entries.has('folder/nested.txt')).toBe(true);

      const decoder = new TextDecoder();
      expect(decoder.decode(entries.get('hello.txt'))).toBe('Hello, world!');
      expect(decoder.decode(entries.get('folder/nested.txt'))).toBe('Nested file content.');
    });

    it('generates an Anki .apkg package containing media manifest and deck.tsv', async () => {
      const mockCards: Flashcard[] = [
        {
          id: 'card-1',
          subjectId: 'sub-bio',
          frontPrompt: 'What is DNA?',
          backAnswer: 'Deoxyribonucleic acid',
          cardType: 'standard',
          difficultyRating: 'good',
          repetitionCount: 1,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewDate: '2026-10-01',
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z'
        }
      ];

      const apkgBlob = await createAnkiPackageApkg('Biology', mockCards);
      expect(apkgBlob).toBeInstanceOf(Blob);
      expect(apkgBlob.type).toBe('application/octet-stream');
      expect(apkgBlob.size).toBeGreaterThan(0);

      const buffer = await apkgBlob.arrayBuffer();
      const entries = await unzipArchive(buffer);

      expect(entries.has('media')).toBe(true);
      expect(entries.has('deck.tsv')).toBe(true);

      const decoder = new TextDecoder();
      expect(decoder.decode(entries.get('media'))).toBe('{}');
      const tsv = decoder.decode(entries.get('deck.tsv'));
      expect(tsv).toContain('What is DNA?');
      expect(tsv).toContain('Deoxyribonucleic acid');
      expect(tsv).toContain('Biology');
    });
  });
});
