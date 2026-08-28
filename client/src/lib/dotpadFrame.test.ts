import { describe, expect, it } from "vitest";
import { DOTPAD_GRAPHIC_HEX_LENGTH, makeBrailleGraphicFrame, makeDotPadDiagnosticFrame } from "./dotpadFrame";

describe("makeBrailleGraphicFrame", () => {
  it("creates a 60 by 40 DotPad graphic payload", () => {
    const frame = makeBrailleGraphicFrame([[1, 2, 4, 5], [1, 3, 6]]);
    expect(frame).toHaveLength(DOTPAD_GRAPHIC_HEX_LENGTH);
    expect(frame).toMatch(/^[0-9A-F]+$/);
    expect(frame).not.toEqual("00".repeat(DOTPAD_GRAPHIC_HEX_LENGTH / 2));
  });

  it("uses the official 2 by 4 pin bit order in row-major 30-cell lines", () => {
    const frame = makeBrailleGraphicFrame([[1], [2, 4, 6], [3, 5], [7, 8]]);
    const frameBytes = frame.match(/.{2}/g)!;
    const startIndex = 4 * 30 + 13;

    expect(frameBytes.slice(startIndex, startIndex + 4)).toEqual(["01", "52", "24", "88"]);
  });

  it("creates a centered physical dot 1–8 diagnostic row for hardware checks", () => {
    const frameBytes = makeDotPadDiagnosticFrame().match(/.{2}/g)!;
    const startIndex = 4 * 30 + 11;

    expect(frameBytes.slice(startIndex, startIndex + 8)).toEqual(["01", "02", "04", "10", "20", "40", "08", "80"]);
  });

  it("ignores unsupported braille dot numbers", () => {
    expect(makeBrailleGraphicFrame([[0, 9]])).toEqual("00".repeat(DOTPAD_GRAPHIC_HEX_LENGTH / 2));
  });
});
