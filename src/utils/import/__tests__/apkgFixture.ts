/**
 * Hand-built .apkg fixtures for the deck importer harness (test-only).
 *
 * Constructs a minimal but valid SQLite collection (`collection.anki2`) with a
 * `notes` table and an oversized `col` metadata row that exercises the
 * overflow-page reassembly path, wrapped in a hand-built ZIP container.
 */

export const PAGE_SIZE = 4096;
export const FIELD_SEPARATOR = '\x1f';

/** SQLite varints are big-endian 7-bit groups; only the last group lacks the high bit. */
export function encodeVarint(value: number): number[] {
  const groups: number[] = [];
  let current = value;
  do {
    groups.unshift(current & 0x7f);
    current = Math.floor(current / 128);
  } while (current > 0);
  return groups.map((group, i) => (i < groups.length - 1 ? group | 0x80 : group));
}

const SERIAL_INT_WIDTHS = [0, 1, 2, 3, 4, 6, 8]; // serial type 1..6 → byte width

export function encodeInt(value: number): { serialType: number; bytes: number[] } {
  if (value === 0) return { serialType: 8, bytes: [] };
  if (value === 1) return { serialType: 9, bytes: [] };
  for (let serialType = 1; serialType <= 6; serialType += 1) {
    const width = SERIAL_INT_WIDTHS[serialType];
    if (value >= 0 && value < 2 ** (8 * width - 1)) {
      const bytes: number[] = [];
      for (let i = width - 1; i >= 0; i -= 1) {
        // Large ints need division-based extraction (bitwise ops cap at 32 bits).
        bytes.unshift(Math.floor(value / 2 ** (8 * i)) & 0xff);
      }
      return { serialType, bytes };
    }
  }
  throw new Error(`Cannot encode ${value} in the fixture`);
}

export function encodeRecord(values: Array<string | number | null>): Uint8Array {
  const serialTypes: number[] = [];
  const bodyChunks: number[] = [];
  for (const value of values) {
    if (value === null) {
      serialTypes.push(0);
    } else if (typeof value === 'number') {
      const { serialType, bytes } = encodeInt(value);
      serialTypes.push(serialType);
      bodyChunks.push(...bytes);
    } else {
      const encoded = Array.from(new TextEncoder().encode(value));
      serialTypes.push(13 + 2 * encoded.length);
      bodyChunks.push(...encoded);
    }
  }
  const headerTypes = serialTypes.flatMap((t) => encodeVarint(t));
  const headerLength = encodeVarint(headerTypes.length).length + headerTypes.length;
  const header = [...encodeVarint(headerLength), ...headerTypes];
  return new Uint8Array([...header, ...bodyChunks]);
}

interface BuiltCell {
  bytes: number[];
  overflowPages: number[][];
  pagesUsed: number;
}

/** Builds one leaf-table cell, chaining overflow pages for oversized payloads. */
export function buildCell(
  rowid: number,
  payload: Uint8Array,
  firstOverflowPageNumber: number
): BuiltCell {
  const usable = PAGE_SIZE; // reserved = 0
  const maxLocal = usable - 35;
  let localSize = payload.length;
  let overflow: Uint8Array[] = [];

  if (payload.length > maxLocal) {
    const minLocal = Math.floor(((usable - 12) * 32) / 255) - 23;
    const k = minLocal + ((payload.length - minLocal) % (usable - 4));
    localSize = k <= maxLocal ? k : minLocal;
    let remaining = payload.length - localSize;
    let cursor = localSize;
    while (remaining > 0) {
      const chunkSize = Math.min(remaining, usable - 4);
      overflow.push(payload.subarray(cursor, cursor + chunkSize));
      cursor += chunkSize;
      remaining -= chunkSize;
    }
  }

  const bytes = [
    ...encodeVarint(payload.length),
    ...encodeVarint(rowid),
    ...Array.from(payload.subarray(0, localSize))
  ];
  if (overflow.length > 0) {
    // u32 BIG-endian overflow-chain pointer (SQLite stores page pointers big-endian).
    bytes.push(
      (firstOverflowPageNumber >> 24) & 0xff,
      (firstOverflowPageNumber >> 16) & 0xff,
      (firstOverflowPageNumber >> 8) & 0xff,
      firstOverflowPageNumber & 0xff
    );
  }

  const overflowPageArrays = overflow.map((chunk, i) => {
    const next = i + 1 < overflow.length ? firstOverflowPageNumber + i + 1 : 0;
    const page = new Array<number>(PAGE_SIZE).fill(0);
    page[0] = next & 0xff;
    page[1] = (next >> 8) & 0xff;
    page[2] = (next >> 16) & 0xff;
    page[3] = (next >> 24) & 0xff;
    for (let j = 0; j < chunk.length; j += 1) page[4 + j] = chunk[j];
    return page;
  });

  return { bytes, overflowPages: overflowPageArrays, pagesUsed: overflow.length };
}

/**
 * Builds a leaf table b-tree page holding the given cells.
 * `pageHeaderOffset` is 100 for page 1 (which embeds the database header) and
 * 0 for every other page. Cell pointers stay page-relative either way.
 */
export function buildLeafPage(
  cells: Array<{ bytes: number[] }>,
  pageHeaderOffset = 0
): Uint8Array {
  const page = new Array<number>(PAGE_SIZE).fill(0);
  page[pageHeaderOffset] = 0x0d; // leaf table b-tree
  const pointers: number[] = [];
  let contentEnd = PAGE_SIZE;
  for (const cell of cells) {
    contentEnd -= cell.bytes.length;
    for (let i = 0; i < cell.bytes.length; i += 1) page[contentEnd + i] = cell.bytes[i];
    pointers.push(contentEnd);
  }
  page[pageHeaderOffset + 1] = 0;
  page[pageHeaderOffset + 2] = 0;
  page[pageHeaderOffset + 3] = (cells.length >> 8) & 0xff;
  page[pageHeaderOffset + 4] = cells.length & 0xff;
  page[pageHeaderOffset + 5] = (contentEnd >> 8) & 0xff;
  page[pageHeaderOffset + 6] = contentEnd & 0xff;
  page[pageHeaderOffset + 7] = 0;
  pointers.forEach((pointer, i) => {
    const offset = pageHeaderOffset + 8 + i * 2;
    page[offset] = (pointer >> 8) & 0xff;
    page[offset + 1] = pointer & 0xff;
  });
  return new Uint8Array(page);
}

export function buildSqliteDatabase(pages: Uint8Array[]): Uint8Array {
  const db = new Uint8Array(pages.length * PAGE_SIZE);
  pages.forEach((page, i) => db.set(page, i * PAGE_SIZE));
  // Page 1 embeds the database header before its b-tree content, so it is
  // written on top of (the zeroed first 100 bytes of) page 1.
  const header = new Uint8Array(100);
  const magic = new TextEncoder().encode('SQLite format 3\u0000');
  header.set(magic, 0);
  header[16] = (PAGE_SIZE >> 8) & 0xff;
  header[17] = PAGE_SIZE & 0xff;
  header[20] = 0; // reserved bytes per page
  header[28] = (pages.length >> 24) & 0xff;
  header[29] = (pages.length >> 16) & 0xff;
  header[30] = (pages.length >> 8) & 0xff;
  header[31] = pages.length & 0xff; // database size in pages
  header[59] = 1; // UTF-8 text encoding
  db.set(header, 0);
  return db;
}

// ── ZIP container ────────────────────────────────────────────────────────────

function u16(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff];
}

function u32(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff];
}

export function buildZip(entries: Array<{ name: string; data: Uint8Array; method?: 0 | 8 }>): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: number[] = [];
  const centralParts: number[] = [];

  for (const entry of entries) {
    const method = entry.method ?? 0;
    const nameBytes = Array.from(encoder.encode(entry.name));
    const localOffset = localParts.length;
    localParts.push(
      ...u32(0x04034b50),
      ...u16(20),
      ...u16(0),
      ...u16(method),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(entry.data.length),
      ...u32(entry.data.length),
      ...u16(nameBytes.length),
      ...u16(0),
      ...nameBytes,
      ...Array.from(entry.data)
    );
    centralParts.push(
      ...u32(0x02014b50),
      ...u16(20),
      ...u16(20),
      ...u16(0),
      ...u16(method),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(entry.data.length),
      ...u32(entry.data.length),
      ...u16(nameBytes.length),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(localOffset),
      ...nameBytes
    );
  }

  const eocd = [
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(entries.length),
    ...u16(entries.length),
    ...u32(centralParts.length),
    ...u32(localParts.length),
    ...u16(0)
  ];

  return new Uint8Array([...localParts, ...centralParts, ...eocd]);
}

// ── The collection fixture ───────────────────────────────────────────────────

export const NOTES_SQL =
  'CREATE TABLE notes (id INTEGER PRIMARY KEY, guid TEXT, mid INTEGER, mod INTEGER, usn INTEGER, tags TEXT, flds TEXT, sfld INTEGER, csum INTEGER, flags INTEGER, data TEXT)';
export const COL_SQL =
  'CREATE TABLE col (id INTEGER PRIMARY KEY, crt INTEGER, mod INTEGER, scm INTEGER, ver INTEGER, dty INTEGER, usn INTEGER, ls INTEGER, conf TEXT, models TEXT, decks TEXT, dconf TEXT, tags TEXT)';

export const MODEL_ID = 1607392319001;

export function buildCollectionDb(): Uint8Array {
  // Page 1: sqlite_master leaf with the notes + col definitions.
  const masterCells = [
    { rowid: 1, values: ['table', 'notes', 'notes', 2, NOTES_SQL] },
    { rowid: 2, values: ['table', 'col', 'col', 3, COL_SQL] }
  ].map((row) => buildCell(row.rowid, encodeRecord(row.values), 100));
  const page1 = buildLeafPage(
    masterCells.map((c) => ({ bytes: c.bytes })),
    100 // page 1 embeds the database header before its b-tree content
  );

  // Page 2: notes leaf — standard, cloze, and HTML/sound fields.
  const noteRows = [
    { guid: 'guid_a', flds: `What is the hippocampus?${FIELD_SEPARATOR}A memory structure in the temporal lobe` },
    { guid: 'guid_b', flds: '{{c1::hippocampus}} is needed for {{c2::memory}}' },
    { guid: 'guid_c', flds: `<b>Neuron</b><br>Basic unit [sound:neuron.mp3]${FIELD_SEPARATOR}Chapter 3` }
  ].map((row, i) =>
    buildCell(
      i + 1,
      encodeRecord([null, row.guid, MODEL_ID, 1700000000, 0, null, row.flds, 0, 0, 0, null]),
      100
    )
  );
  const page2 = buildLeafPage(noteRows.map((c) => ({ bytes: c.bytes })));

  // Page 3: col leaf — models JSON exceeds maxLocal and exercises overflow.
  const modelsJson = JSON.stringify({
    [String(MODEL_ID)]: { name: `Basic (and reversed card) — ${'x'.repeat(6000)}`, type: 0 }
  });
  const decksJson = JSON.stringify({ '1': { name: 'Default' }, '1651445123456': { name: 'Neuroanatomy 101' } });
  const colCell = buildCell(
    1,
    encodeRecord([null, 1700000000, 1700000000, 42, 11, 0, 1, 0, null, modelsJson, decksJson, null, null]),
    4
  );
  const page3 = buildLeafPage([{ bytes: colCell.bytes }]);
  const overflowPages = colCell.overflowPages.map((page) => new Uint8Array(page));

  return buildSqliteDatabase([page1, page2, page3, ...overflowPages]);
}

export function toBuffer(bytes: Uint8Array): ArrayBuffer {
  // Fixture buffers are always plain ArrayBuffers (never SharedArrayBuffer).
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/**
 * Optional raw-deflate helper for exercising compressed ZIP entries. Available
 * wherever the runtime exposes `CompressionStream` (Node ≥ 18, modern browsers).
 */
export const deflateRawOptional: {
  available: boolean;
  compress: (data: Uint8Array) => Promise<Uint8Array>;
} = {
  available: typeof globalThis.CompressionStream === 'function',
  compress: async (data) => {
    const stream = new Blob([data as BlobPart])
      .stream()
      .pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
};
