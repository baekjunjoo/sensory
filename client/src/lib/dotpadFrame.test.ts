import { describe, expect, it } from "vitest";
import { DOTPAD_GRAPHIC_HEX_LENGTH, makeBrailleGraphicFrame } from "./dotpadFrame";

describe("makeBrailleGraphicFrame", () => {
  it("creates a 60 by 40 DotPad graphic payload", () => {
    const frame = makeBrailleGraphicFrame([[1, 2, 4, 5], [1, 3, 6]]);
    expect(frame).toHaveLength(DOTPAD_GRAPHIC_HEX_LENGTH);
    expect(frame).toMatch(/^[0-9A-F]+$/);
    expect(frame).not.toEqual("00".repeat(DOTPAD_GRAPHIC_HEX_LENGTH / 2));
  });

  it("ignores unsupported braille dot numbers", () => {
    expect(makeBrailleGraphicFrame([[0, 7]])).toEqual("00".repeat(DOTPAD_GRAPHIC_HEX_LENGTH / 2));
  });
});
