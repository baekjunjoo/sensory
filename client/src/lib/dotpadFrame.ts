export type BrailleDots = number[];

/** DotPad graphic area: 30 braille cells × 10 braille cells = 60 × 40 pins. */
const FRAME_CELL_COLUMNS = 30;
const FRAME_CELL_ROWS = 10;
const DOTPAD_PIN_BIT: Record<number, number> = {
  // Official Web SDK 3.0.2 PIN_BIT_TABLE: (x, y) => cell-byte bit.
  1: 0x01,
  2: 0x02,
  3: 0x04,
  4: 0x10,
  5: 0x20,
  6: 0x40,
  7: 0x08,
  8: 0x80,
};

function makeDotPadCellByte(dots: BrailleDots): number {
  return dots.reduce((cellByte, dot) => cellByte | (DOTPAD_PIN_BIT[dot] ?? 0), 0);
}

function makeRowMajorGraphicFrame(cells: BrailleDots[]): string {
  const frame = new Uint8Array(FRAME_CELL_COLUMNS * FRAME_CELL_ROWS);
  const visibleCells = cells.slice(0, FRAME_CELL_COLUMNS);
  const startColumn = Math.floor((FRAME_CELL_COLUMNS - visibleCells.length) / 2);
  const startRow = Math.floor(FRAME_CELL_ROWS / 2) - 1;

  visibleCells.forEach((cell, cellIndex) => {
    frame[startRow * FRAME_CELL_COLUMNS + startColumn + cellIndex] = makeDotPadCellByte(cell);
  });

  return Array.from(frame, (byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join("");
}

/**
 * Builds the 300-cell (600 hex character) row-major graphic payload expected by
 * DotPad Web SDK 3.0.2. Each byte is one physical 2×4 pin braille cell, not an
 * arbitrary 8-bit slice of a 60×40 pixel bitmap.
 */
export function makeBrailleGraphicFrame(cells: BrailleDots[]): string {
  return makeRowMajorGraphicFrame(cells);
}

/** One centered row of physical dots 1–8, left to right, for hardware mapping checks. */
export function makeDotPadDiagnosticFrame(): string {
  return makeRowMajorGraphicFrame([[1], [2], [3], [4], [5], [6], [7], [8]]);
}

export const DOTPAD_GRAPHIC_HEX_LENGTH = FRAME_CELL_COLUMNS * FRAME_CELL_ROWS * 2;
