import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "client/src/daily-arrival-scene.css"), "utf8");

describe("3D 봉투 장면 프레임", () => {
  it("keeps the clay envelope as a full beach-scene panel instead of a small masked object", () => {
    expect(css).toContain("minmax(350px, 1.16fr)");
    expect(css).toContain("min-height: 334px !important");
    expect(css).toContain("width: 100% !important");
    expect(css).toContain("object-fit: cover");
    expect(css).toContain("mask-image: none");
    expect(css).toContain("min-height: 260px !important");
  });
});
