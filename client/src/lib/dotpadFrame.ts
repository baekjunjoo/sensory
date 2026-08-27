export type BrailleDots = number[];

const FRAME_COLUMNS = 60;
const FRAME_ROWS = 40;
const DOT_POSITIONS: Record<number, readonly [number, number]> = {
  1: [0, 0], 2: [0, 2], 3: [0, 4], 4: [2, 0], 5: [2, 2], 6: [2, 4],
};

function setDot(bits: Uint8Array, column: number, row: number) {
  if (column < 0 || column >= FRAME_COLUMNS || row < 0 || row >= FRAME_ROWS) return;
  const bitIndex = row * FRAME_COLUMNS + column;
  bits[Math.floor(bitIndex / 8)] |= 1 << (7 - (bitIndex % 8));
}

/** Builds the 60×40 DotPad graphic-area payload expected by SDK 3.0.2. */
export function makeBrailleGraphicFrame(cells: BrailleDots[]): string {
  const bits = new Uint8Array((FRAME_COLUMNS * FRAME_ROWS) / 8);
  const startColumn = Math.max(4, Math.floor((FRAME_COLUMNS - Math.min(cells.length, 6) * 8) / 2));
  const startRow = 17;

  cells.slice(0, 6).forEach((cell, cellIndex) => {
    cell.forEach((dot) => {
      const position = DOT_POSITIONS[dot];
      if (position) setDot(bits, startColumn + cellIndex * 8 + position[0], startRow + position[1]);
    });
  });

  return Array.from(bits, (byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join("");
}

export const DOTPAD_GRAPHIC_HEX_LENGTH = (FRAME_COLUMNS * FRAME_ROWS) / 4;
