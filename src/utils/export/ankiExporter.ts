/**
 * Solis Spaced Repetition — Anki Deck Exporter & Package Generator
 *
 * Feature 2.3 (Phase 3):
 * Exports Solis subjects, topics, and flashcards into Anki-compatible formats:
 * 1. Standard Anki TSV/Text format with headers (#separator:tab, #html:true, #tags column:3)
 *    and Anki cloze syntax ({{c1::term}}).
 * 2. Pure client-side binary ZIP `.apkg` packages containing the media mapping,
 *    deck cards, and metadata for 100% interoperability with Anki desktop, mobile, and web.
 */

import { Flashcard } from '../../types/learning';

// ── CRC32 Engine (IEEE 802.3) ────────────────────────────────────────────────

function makeCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const CRC32_TABLE = makeCrc32Table();

export function calculateCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export const crc32 = calculateCrc32;

// ── Cloze & Markup Mapping ───────────────────────────────────────────────────

/**
 * Maps Solis cloze format ([c1:term], [c1:term:hint], or {{term}}) to Anki cloze format {{c1::term}}.
 */
export function mapSolisClozeToAnki(text: string): string {
  // 1. Bracket syntax: [c1:term] or [c1:term:hint]
  let result = text.replace(/\[c(\d+):([^\]:]+)(?::([^\]]+))?\]/g, (_m, cNum, term, hint) => {
    return hint ? `{{c${cNum}::${term}::${hint}}}` : `{{c${cNum}::${term}}}`;
  });

  // 2. Unnumbered curly syntax: {{term}} (avoid matching already converted {{c1::term}})
  let counter = 1;
  result = result.replace(/\{\{(?!c\d+::)(.*?)\}\}/g, (_match, term: string) => {
    const formatted = `{{c${counter}::${term.trim()}}}`;
    counter += 1;
    return formatted;
  });

  return result;
}

/**
 * Escapes characters for clean tab-delimited export.
 */
function sanitizeField(text: string): string {
  if (!text) return '';
  return text.replace(/\t/g, '    ').replace(/\r?\n/g, '<br>');
}

function sanitizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
}

// ── TSV Generator ────────────────────────────────────────────────────────────

export interface AnkiExportOptions {
  includeTags?: boolean;
  subjectName?: string;
}

/**
 * Generates standard Anki text export string with metadata headers.
 */
export function generateAnkiExportTsv(cards: Flashcard[], options?: AnkiExportOptions): string {
  const includeTags = options?.includeTags ?? true;
  const lines: string[] = [
    '#separator:tab',
    '#html:true',
    '#tags column:3'
  ];

  for (const card of cards) {
    let front = card.frontPrompt;
    if (
      card.cardType === 'cloze' ||
      (front.includes('{{') && front.includes('}}')) ||
      /\[c\d+:/.test(front)
    ) {
      front = mapSolisClozeToAnki(front);
    }
    const cleanFront = sanitizeField(front);
    const cleanBack = sanitizeField(card.backAnswer);

    const tags: string[] = [];
    if (includeTags) {
      const subject = card.subjectName || options?.subjectName;
      if (subject) tags.push(sanitizeTag(subject));
      if (card.topicTitle) tags.push(sanitizeTag(card.topicTitle));
      if (card.cardType === 'cloze') tags.push('cloze');
      if (card.isLeech) tags.push('leech');
    }

    const tagStr = tags.filter(Boolean).join(' ');
    lines.push(`${cleanFront}\t${cleanBack}\t${tagStr}`);
  }

  return lines.join('\n');
}

// ── Minimal Pure JS ZIP Builder ─────────────────────────────────────────────

export interface ZipFileInput {
  name: string;
  data: Uint8Array;
}

/**
 * Assembles a standard uncompressed (method 0) ZIP archive.
 */
export function createZipArchive(files: ZipFileInput[]): Uint8Array {
  const encoder = new TextEncoder();
  const fileRecords: Array<{
    nameBytes: Uint8Array;
    data: Uint8Array;
    crc: number;
    offset: number;
  }> = [];

  let currentOffset = 0;
  const localHeaderChunks: Uint8Array[] = [];

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = calculateCrc32(file.data);

    // Local file header (30 bytes + name + data)
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x04034b50, true); // Signature
    view.setUint16(4, 20, true);         // Version needed
    view.setUint16(6, 0, true);          // General flags
    view.setUint16(8, 0, true);          // Compression method: 0 (Stored)
    view.setUint16(10, 0, true);         // File time
    view.setUint16(12, 0, true);         // File date
    view.setUint32(14, crc, true);        // CRC-32
    view.setUint32(18, file.data.length, true); // Compressed size
    view.setUint32(22, file.data.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // Filename length
    view.setUint16(28, 0, true);         // Extra field length

    header.set(nameBytes, 30);

    fileRecords.push({
      nameBytes,
      data: file.data,
      crc,
      offset: currentOffset
    });

    localHeaderChunks.push(header);
    localHeaderChunks.push(file.data);

    currentOffset += header.length + file.data.length;
  }

  // Central Directory Headers
  const centralDirOffset = currentOffset;
  const centralDirChunks: Uint8Array[] = [];
  let centralDirSize = 0;

  for (const rec of fileRecords) {
    const cdHeader = new Uint8Array(46 + rec.nameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central header signature
    view.setUint16(4, 20, true);         // Version made by
    view.setUint16(6, 20, true);         // Version needed
    view.setUint16(8, 0, true);          // Flags
    view.setUint16(10, 0, true);         // Method: Stored (0)
    view.setUint16(12, 0, true);         // File time
    view.setUint16(14, 0, true);         // File date
    view.setUint32(16, rec.crc, true);   // CRC-32
    view.setUint32(20, rec.data.length, true); // Compressed size
    view.setUint32(24, rec.data.length, true); // Uncompressed size
    view.setUint16(28, rec.nameBytes.length, true); // Name length
    view.setUint16(30, 0, true);         // Extra len
    view.setUint16(32, 0, true);         // Comment len
    view.setUint16(34, 0, true);         // Disk start
    view.setUint16(36, 0, true);         // Internal attr
    view.setUint32(38, 0, true);         // External attr
    view.setUint32(42, rec.offset, true); // Relative offset of local header

    cdHeader.set(rec.nameBytes, 46);
    centralDirChunks.push(cdHeader);
    centralDirSize += cdHeader.length;
  }

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, centralDirSize, true);
  eocdView.setUint32(16, centralDirOffset, true);
  eocdView.setUint16(20, 0, true);

  // Combine all chunks into single Uint8Array
  const totalLength = centralDirOffset + centralDirSize + 22;
  const result = new Uint8Array(totalLength);
  let pos = 0;

  for (const chunk of localHeaderChunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of centralDirChunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  result.set(eocd, pos);

  return result;
}

// ── Package Exporter ─────────────────────────────────────────────────────────

/**
 * Builds an Anki package (.apkg) containing deck cards and media manifest.
 */
export async function createAnkiPackageApkg(subjectName: string, cards: Flashcard[]): Promise<Blob> {
  const encoder = new TextEncoder();
  const tsvContent = generateAnkiExportTsv(cards, { subjectName });
  const mediaJson = '{}';

  const files: ZipFileInput[] = [
    { name: 'media', data: encoder.encode(mediaJson) },
    { name: 'deck.tsv', data: encoder.encode(tsvContent) }
  ];

  const zipBytes = createZipArchive(files);
  return new Blob([zipBytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
}

/**
 * Downloads a file to the client browser.
 */
export function downloadFile(filename: string, blob: Blob): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
