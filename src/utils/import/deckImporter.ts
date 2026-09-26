/**
 * Solis Client-Side Deck Importer — plan §4.4
 *
 * Parses external flashcard decks into Solis Flashcard payloads, entirely in
 * the browser (no server round-trip):
 *   - Anki `.apkg` packages: a ZIP archive containing a SQLite collection
 *     (`collection.anki2` / `collection.anki21`) whose `notes` rows hold the
 *     card fields. This module ships a minimal read-only ZIP reader (stored +
 *     deflate entries) and a minimal read-only SQLite b-tree walker — no
 *     external dependency.
 *   - Quizlet-style text exports: rows of `term<sep>definition` (tab, comma,
 *     or semicolon separated; quoted CSV fields supported).
 *
 * Anki cloze markers `{{c1::term}}` (and hinted `{{c1::term::hint}}`) are
 * extracted and mapped to the Solis cloze format `{{term}}`, matching the
 * convention of `parseClozeSyntax` in src/utils/learning/spacedRepetition.ts.
 *
 * Pure, deterministic functions (master.md §18): no React state, no DOM or
 * network side effects. The only async work is the standard
 * `DecompressionStream('deflate-raw')` inflation of compressed ZIP entries.
 */

import { CardType } from '../../types/learning';

// ── Result contracts ─────────────────────────────────────────────────────────

export type DeckImportSourceFormat = 'anki_apkg' | 'quizlet_text';

export interface ImportedDeckCard {
  frontPrompt: string;
  backAnswer: string;
  cardType: CardType;
}

export interface DeckImportResult {
  sourceFormat: DeckImportSourceFormat;
  /** Best-effort deck title from the Anki collection, when discoverable. */
  deckName?: string;
  cards: ImportedDeckCard[];
  /** Non-fatal notes about cards or content that were skipped. */
  warnings: string[];
}

// ── Anki cloze → Solis cloze mapping (plan §4.4) ─────────────────────────────

const ANKI_CLOZE_RE = /\{\{c\d+::(.*?)(?:::.*?)?\}\}/g;
const ANKI_SOUND_RE = /\[sound:[^\]]*\]/g;
const ANKI_HTML_RE = /<[^>]*>/g;

const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'"
};

/**
 * Maps Anki cloze markers to the Solis cloze format:
 *   `{{c1::term}}`        → `{{term}}`
 *   `{{c1::term::hint}}`  → `{{term}}` (hints are dropped)
 * Returns the mapped text plus the extracted terms in order of appearance.
 */
export function mapAnkiClozeToSolis(text: string): { text: string; terms: string[] } {
  if (!text) return { text: text || '', terms: [] };
  const terms: string[] = [];
  const mapped = text.replace(ANKI_CLOZE_RE, (_match, term: string) => {
    const clean = term.trim();
    terms.push(clean);
    return `{{${clean}}}`;
  });
  return { text: mapped, terms };
}

/** Strips Anki media tags, HTML tags, and entities into clean plain text. */
export function stripAnkiMarkup(text: string): string {
  const withoutSounds = text.replace(ANKI_SOUND_RE, '');
  const withBreaks = withoutSounds
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:div|p|li|tr|h[1-6])>/gi, '\n')
    .replace(ANKI_HTML_RE, '');
  const decoded = withBreaks.replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/gi, (entity) => {
    return HTML_ENTITIES[entity.toLowerCase()] ?? entity;
  });
  return decoded
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

// ── Minimal read-only ZIP reader (.apkg container) ───────────────────────────

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIR_SIGNATURE = 0x02014b50;
const STORED_METHOD = 0;
const DEFLATE_METHOD = 8;

/**
 * Extracts every entry of a ZIP archive (the `.apkg` container) into a map of
 * name → bytes. Supports stored (method 0) and deflate (method 8) entries via
 * the standard `DecompressionStream('deflate-raw')`. ZIP64 archives are
 * rejected with an honest error.
 */
export async function unzipArchive(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Locate the End Of Central Directory record (scanning back past any
  // trailing comment, up to the maximum 64 KiB comment span).
  let eocdOffset = -1;
  const scanFloor = Math.max(0, bytes.length - 22 - 65535);
  for (let i = bytes.length - 22; i >= scanFloor; i -= 1) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw new Error('Not a valid .apkg package: ZIP central directory not found.');
  }

  const entryCount = view.getUint16(eocdOffset + 10, true);
  let cursor = view.getUint32(eocdOffset + 16, true);
  const entries = new Map<string, Uint8Array>();

  for (let i = 0; i < entryCount; i += 1) {
    if (cursor + 46 > bytes.length || view.getUint32(cursor, true) !== CENTRAL_DIR_SIGNATURE) {
      throw new Error('Not a valid .apkg package: ZIP central directory is corrupted.');
    }
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);

    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    cursor += 46 + nameLength + extraLength + commentLength;

    if (compressedSize === 0xffffffff || localHeaderOffset === 0xffffffff) {
      throw new Error('This .apkg uses ZIP64 extensions, which are not supported. Please re-export a smaller deck.');
    }

    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const raw = bytes.subarray(dataStart, dataStart + compressedSize);

    if (method === STORED_METHOD) {
      entries.set(name, raw);
    } else if (method === DEFLATE_METHOD) {
      entries.set(name, await inflateRaw(raw));
    } else {
      throw new Error(`Unsupported ZIP compression method ${method} inside the .apkg package.`);
    }
  }

  return entries;
}

async function inflateRaw(raw: Uint8Array): Promise<Uint8Array> {
  const DecompressionStreamCtor = (globalThis as unknown as { DecompressionStream?: typeof DecompressionStream })
    .DecompressionStream;
  if (typeof DecompressionStreamCtor !== 'function') {
    throw new Error('This environment does not support DecompressionStream; compressed .apkg entries cannot be read.');
  }
  const stream = new Blob([raw as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStreamCtor('deflate-raw'));
  const inflated = await new Response(stream).arrayBuffer();
  return new Uint8Array(inflated);
}

// ── Minimal read-only SQLite reader (collection.anki2) ───────────────────────

const SQLITE_MAGIC = 'SQLite format 3\u0000';
const PAGE_INTERIOR_TABLE = 0x05;
const PAGE_LEAF_TABLE = 0x0d;
const TEXT_ENCODING_UTF8 = 1;

interface SqliteDatabase {
  bytes: Uint8Array;
  view: DataView;
  pageSize: number;
  usableSize: number;
  textDecoder: TextDecoder;
}

function openSqlite(bytes: Uint8Array): SqliteDatabase {
  const magic = new TextDecoder('utf-8').decode(bytes.subarray(0, 16));
  if (magic !== SQLITE_MAGIC) {
    throw new Error('Not a valid Anki collection: the embedded database is not SQLite.');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // SQLite file structures are big-endian throughout.
  const rawPageSize = view.getUint16(16, false);
  const pageSize = rawPageSize === 1 ? 65536 : rawPageSize;
  const reserved = view.getUint8(20);
  const textEncoding = view.getUint32(56, false);
  if (textEncoding !== TEXT_ENCODING_UTF8) {
    throw new Error('Only UTF-8 Anki collections are supported.');
  }
  return {
    bytes,
    view,
    pageSize,
    usableSize: pageSize - reserved,
    textDecoder: new TextDecoder('utf-8')
  };
}

function readVarint(bytes: Uint8Array, offset: number): { value: number; next: number } {
  let value = 0;
  for (let i = 0; i < 8; i += 1) {
    const byte = bytes[offset + i];
    value = value * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) {
      return { value, next: offset + i + 1 };
    }
  }
  const ninth = bytes[offset + 8];
  value = value * 256 + ninth;
  return { value, next: offset + 9 };
}

/** Big-endian, two's-complement signed integer (SQLite serial types 1–6). */
function readSignedInt(view: DataView, offset: number, size: number): number {
  const sizes = [0, 1, 2, 3, 4, 6, 8];
  const byteSize = sizes[size];
  let value = 0;
  for (let i = 0; i < byteSize; i += 1) {
    value = value * 256 + view.getUint8(offset + i);
  }
  const bits = byteSize * 8;
  if (bits < 53 && value >= 2 ** (bits - 1)) {
    value -= 2 ** bits;
  }
  return value;
}

type SqliteValue = string | number | Uint8Array | null;

/** Decodes a SQLite record payload (header of serial types + value body). */
function decodeSqliteRecord(db: SqliteDatabase, payload: Uint8Array): SqliteValue[] {
  const payloadView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const headerSize = readVarint(payload, 0);
  const serialTypes: number[] = [];
  let cursor = headerSize.next;
  while (cursor < headerSize.value) {
    const serialType = readVarint(payload, cursor);
    serialTypes.push(serialType.value);
    cursor = serialType.next;
  }

  const values: SqliteValue[] = [];
  let body = headerSize.value;
  for (const serialType of serialTypes) {
    if (serialType === 0) {
      values.push(null);
    } else if (serialType >= 1 && serialType <= 6) {
      values.push(readSignedInt(payloadView, body, serialType));
      body += [0, 1, 2, 3, 4, 6, 8][serialType];
    } else if (serialType === 7) {
      values.push(payloadView.getFloat64(body, false));
      body += 8;
    } else if (serialType === 8) {
      values.push(0);
    } else if (serialType === 9) {
      values.push(1);
    } else if (serialType >= 12 && serialType % 2 === 0) {
      const length = (serialType - 12) / 2;
      values.push(payload.slice(body, body + length));
      body += length;
    } else if (serialType >= 13) {
      const length = (serialType - 13) / 2;
      values.push(db.textDecoder.decode(payload.subarray(body, body + length)));
      body += length;
    } else {
      throw new Error(`Unsupported SQLite serial type ${serialType} in the Anki collection.`);
    }
  }
  return values;
}

/**
 * Collects every (rowid, payload) cell of a table b-tree, reassembling
 * overflow-page chains for payloads that spill past the page.
 */
function walkTableBtree(
  db: SqliteDatabase,
  pageNumber: number,
  visit: (rowid: number, payload: Uint8Array) => void,
  visited: Set<number> = new Set()
): void {
  if (pageNumber === 0 || visited.has(pageNumber)) return;
  visited.add(pageNumber);

  const pageOffset = (pageNumber - 1) * db.pageSize;
  // Page 1 embeds the 100-byte database header before the b-tree page header.
  const headerOffset = pageOffset + (pageNumber === 1 ? 100 : 0);
  const pageType = db.bytes[headerOffset];
  const cellCount = db.view.getUint16(headerOffset + 3, false);
  const pointerArrayOffset = headerOffset + (pageType === PAGE_INTERIOR_TABLE ? 12 : 8);

  const readCellPayload = (cellOffset: number): { rowid: number; payload: Uint8Array } => {
    const payloadLength = readVarint(db.bytes, cellOffset);
    const rowid = readVarint(db.bytes, payloadLength.next);
    const payloadStart = rowid.next;

    const maxLocal = db.usableSize - 35;
    let localSize = payloadLength.value;
    if (payloadLength.value > maxLocal) {
      const minLocal = Math.floor(((db.usableSize - 12) * 32) / 255) - 23;
      const k = minLocal + ((payloadLength.value - minLocal) % (db.usableSize - 4));
      localSize = k <= maxLocal ? k : minLocal;
    }

    const localPayload = db.bytes.subarray(payloadStart, payloadStart + localSize);
    if (localSize >= payloadLength.value) {
      return { rowid: rowid.value, payload: localPayload };
    }

    // Reassemble the overflow chain (page pointers are big-endian u32s).
    const chunks: Uint8Array[] = [localPayload];
    let remaining = payloadLength.value - localSize;
    let overflowPage = db.view.getUint32(payloadStart + localSize, false);
    while (overflowPage !== 0 && remaining > 0) {
      const overflowOffset = (overflowPage - 1) * db.pageSize;
      const nextOverflowPage = db.view.getUint32(overflowOffset, false);
      const chunkSize = Math.min(remaining, db.usableSize - 4);
      chunks.push(db.bytes.subarray(overflowOffset + 4, overflowOffset + 4 + chunkSize));
      remaining -= chunkSize;
      overflowPage = nextOverflowPage;
    }
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const payload = new Uint8Array(total);
    let written = 0;
    for (const chunk of chunks) {
      payload.set(chunk, written);
      written += chunk.length;
    }
    return { rowid: rowid.value, payload };
  };

  if (pageType === PAGE_LEAF_TABLE) {
    for (let i = 0; i < cellCount; i += 1) {
      const pointer = db.view.getUint16(pointerArrayOffset + i * 2, false);
      const cell = readCellPayload(pageOffset + pointer);
      visit(cell.rowid, cell.payload);
    }
  } else if (pageType === PAGE_INTERIOR_TABLE) {
    for (let i = 0; i < cellCount; i += 1) {
      const pointer = db.view.getUint16(pointerArrayOffset + i * 2, false);
      const childPage = db.view.getUint32(pageOffset + pointer, false);
      walkTableBtree(db, childPage, visit, visited);
    }
    const rightmostPage = db.view.getUint32(headerOffset + 8, false);
    walkTableBtree(db, rightmostPage, visit, visited);
  } else {
    throw new Error('Unexpected SQLite page layout inside the Anki collection.');
  }
}

/** Splits a CREATE TABLE body on top-level commas (quote- and paren-aware). */
function splitTopLevel(input: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';
  for (const char of input) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      current += char;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === separator && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/** Maps wanted column names to their 0-based record index from CREATE TABLE SQL. */
function mapColumnIndexes(createSql: string, wanted: string[]): Record<string, number> {
  const openParen = createSql.indexOf('(');
  const closeParen = createSql.lastIndexOf(')');
  if (openParen === -1 || closeParen === -1) return {};

  const tableConstraints = new Set(['primary', 'unique', 'check', 'foreign', 'constraint']);
  const indexes: Record<string, number> = {};
  let columnIndex = 0;

  for (const definition of splitTopLevel(createSql.slice(openParen + 1, closeParen), ',')) {
    const trimmed = definition.trim();
    if (!trimmed) continue;
    const firstToken = trimmed.split(/\s+/)[0].replace(/^["'`[]|["'`\]]$/g, '').toLowerCase();
    if (tableConstraints.has(firstToken)) continue;
    if (wanted.includes(firstToken)) {
      indexes[firstToken] = columnIndex;
    }
    columnIndex += 1;
  }
  return indexes;
}

function readTableRows(db: SqliteDatabase, rootPage: number): SqliteValue[][] {
  const rows: SqliteValue[][] = [];
  walkTableBtree(db, rootPage, (_rowid, payload) => {
    rows.push(decodeSqliteRecord(db, payload));
  });
  return rows;
}

// ── Anki collection interpretation ───────────────────────────────────────────

const FIELD_SEPARATOR = '\x1f'; // Anki joins note fields with \x1f

interface AnkiCollection {
  cards: ImportedDeckCard[];
  deckName?: string;
  warnings: string[];
}

export async function parseAnkiApkg(buffer: ArrayBuffer): Promise<DeckImportResult> {
  const entries = await unzipArchive(buffer);
  const collectionBytes =
    entries.get('collection.anki2') || entries.get('collection.anki21') || null;

  if (!collectionBytes) {
    if (entries.has('collection.anki21b')) {
      throw new Error(
        'This .apkg uses the newer compressed collection format (anki21b). Re-export it from Anki with "Support older Anki versions" enabled.'
      );
    }
    throw new Error('Not a valid Anki deck: no collection database found inside the .apkg package.');
  }

  const collection = extractAnkiCollection(collectionBytes);
  return {
    sourceFormat: 'anki_apkg',
    deckName: collection.deckName,
    cards: collection.cards,
    warnings: collection.warnings
  };
}

function extractAnkiCollection(dbBytes: Uint8Array): AnkiCollection {
  const db = openSqlite(dbBytes);
  const warnings: string[] = [];

  // sqlite_master (root: page 1) locates the `notes` and `col` tables.
  const masterRows = readTableRows(db, 1);
  let notesRootPage = 0;
  let colRootPage = 0;
  for (const row of masterRows) {
    const objectType = row[0];
    const name = typeof row[1] === 'string' ? row[1].toLowerCase() : '';
    const rootPage = typeof row[3] === 'number' ? row[3] : 0;
    if (objectType === 'table' && name === 'notes') notesRootPage = rootPage;
    if (objectType === 'table' && name === 'col') colRootPage = rootPage;
  }
  if (!notesRootPage) {
    throw new Error('Not a valid Anki collection: the notes table is missing.');
  }

  // Column positions come from the CREATE TABLE statement, not fixed offsets.
  const notesSqlRow = masterRows.find(
    (row) => row[0] === 'table' && typeof row[1] === 'string' && row[1].toLowerCase() === 'notes'
  );
  const notesColumns = mapColumnIndexes(
    typeof notesSqlRow?.[4] === 'string' ? notesSqlRow[4] : '',
    ['mid', 'flds']
  );
  const midIndex = notesColumns.mid ?? 2;
  const fldsIndex = notesColumns.flds ?? 6;

  // Model + deck metadata (best-effort — the deck still imports without it).
  let models: Record<string, { name?: string; type?: number }> = {};
  let deckName: string | undefined;
  if (colRootPage) {
    try {
      const colRows = readTableRows(db, colRootPage);
      const colRow = colRows[0] || [];
      if (typeof colRow[9] === 'string') {
        models = JSON.parse(colRow[9]);
      }
      if (typeof colRow[10] === 'string') {
        const decks = JSON.parse(colRow[10]) as Record<string, { name?: string }>;
        deckName = Object.values(decks)
          .map((deck) => deck.name)
          .find((name): name is string => Boolean(name) && name !== 'Default');
      }
    } catch (err) {
      warnings.push('Deck/model metadata could not be read; fields were imported as-is.');
      if (err instanceof Error) warnings[warnings.length - 1] += ` (${err.message})`;
    }
  }

  const cards: ImportedDeckCard[] = [];
  const noteRows = readTableRows(db, notesRootPage);
  for (const row of noteRows) {
    const mid = typeof row[midIndex] === 'number' ? String(row[midIndex]) : '';
    const flds = typeof row[fldsIndex] === 'string' ? row[fldsIndex] : '';
    if (!flds) {
      warnings.push('A note without fields was skipped.');
      continue;
    }
    const fields = flds.split(FIELD_SEPARATOR).map(stripAnkiMarkup);
    const front = fields[0] || '';

    // Cloze detection first: cloze-model notes carry {{cN::…}} in a field.
    const model = mid ? models[mid] : undefined;
    const isClozeModel = model?.type === 1 || (model?.name ?? '').toLowerCase().includes('cloze');
    const clozeField = fields.find((field) => /\{\{c\d+::/.test(field));

    if (isClozeModel || clozeField) {
      const mapped = clozeField ? mapAnkiClozeToSolis(clozeField) : { text: '', terms: [] as string[] };
      const terms = mapped.terms.filter(Boolean);
      if (!clozeField || !terms.length) {
        warnings.push('A cloze note without cloze deletions was skipped.');
        continue;
      }
      cards.push({
        frontPrompt: stripAnkiMarkup(mapped.text),
        backAnswer: terms.join(', '),
        cardType: 'cloze'
      });
      continue;
    }

    if (!front) {
      warnings.push('A note with an empty prompt was skipped.');
      continue;
    }
    const back = fields
      .slice(1)
      .filter(Boolean)
      .join(' — ');
    cards.push({ frontPrompt: front, backAnswer: back, cardType: 'standard' });
  }

  if (!cards.length) {
    warnings.push('No importable cards were found in this collection.');
  }

  return { cards, deckName, warnings };
}

// ── Quizlet-style text exports ───────────────────────────────────────────────

function detectFieldSeparator(content: string): string {
  if (content.includes('\t')) return '\t';
  if (content.includes(',')) return ',';
  if (content.includes(';')) return ';';
  return '\t';
}

/** Splits one delimited row, honoring double-quoted fields ("a,b" / "" escape). */
function splitDelimitedRow(row: string, separator: string): string[] {
  if (!row.includes('"')) return row.split(separator);
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i += 1) {
    const char = row[i];
    if (inQuotes) {
      if (char === '"') {
        if (row[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === separator) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Parses Quizlet-style text exports: one card per row, term and definition
 * separated by tab (default), comma, or semicolon. The separator is detected
 * automatically unless overridden. Rows missing a term or definition are
 * skipped with a warning.
 */
export function parseDelimitedDeck(
  content: string,
  options?: { fieldSeparator?: string; rowSeparator?: RegExp | string }
): DeckImportResult {
  const warnings: string[] = [];
  const fieldSeparator = options?.fieldSeparator ?? detectFieldSeparator(content);
  const rowSeparator = options?.rowSeparator ?? /\r\n|\r|\n/;
  const rows = content.split(rowSeparator);
  const cards: ImportedDeckCard[] = [];

  for (const row of rows) {
    if (!row.trim()) continue;
    const fields = splitDelimitedRow(row, fieldSeparator);
    const term = (fields[0] || '').trim();
    const definition = (fields[1] || '').trim();
    if (fields.length > 2 && warnings.length < 5) {
      warnings.push(`Extra columns after the definition were ignored (row: "${term.slice(0, 40)}").`);
    }
    if (!term || !definition) {
      if (warnings.length < 5) warnings.push('A row without both a term and a definition was skipped.');
      continue;
    }

    const mapped = mapAnkiClozeToSolis(term);
    if (mapped.terms.length > 0) {
      cards.push({
        frontPrompt: mapped.text.trim(),
        backAnswer: mapped.terms.join(', '),
        cardType: 'cloze'
      });
      continue;
    }

    cards.push({ frontPrompt: term, backAnswer: definition, cardType: 'standard' });
  }

  return { sourceFormat: 'quizlet_text', cards, warnings };
}

// ── Router ───────────────────────────────────────────────────────────────────

function looksLikeZip(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05) && (bytes[3] === 0x04 || bytes[3] === 0x06);
}

/**
 * Parses any supported deck file by extension and content sniffing:
 * `.apkg` (Anki), `.txt` / `.tsv` / `.csv` (Quizlet-style exports).
 */
export async function parseDeckFile(fileName: string, data: ArrayBuffer): Promise<DeckImportResult> {
  const bytes = new Uint8Array(data);
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.apkg') || lowerName.endsWith('.zip') || looksLikeZip(bytes)) {
    return parseAnkiApkg(data);
  }
  const text = new TextDecoder('utf-8').decode(bytes);
  return parseDelimitedDeck(text);
}
