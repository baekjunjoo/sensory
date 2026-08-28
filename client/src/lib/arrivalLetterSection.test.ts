import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "client/src/arrival-letter-section.css"), "utf8");

describe("한 장의 편지를 여는 도착 장면", () => {
  it("uses the clay beach image as the complete arrival section rather than a separate small envelope object", () => {
    expect(css).toContain("var(--arrival-scene)");
    expect(css).toContain("min-height: 500px");
    expect(css).toContain("background:");
    expect(css).toContain("center / cover no-repeat !important");
    expect(css).toContain("border: 0 !important");
    expect(css).toContain("border-radius: 0 !important");
    expect(css).toContain(".arrival-envelope.clay-envelope");
    expect(css).toContain("display: none !important");
  });

  it("keeps the arrival scene full height on a mobile screen and removes character display frames", () => {
    expect(css).toContain("min-height: 620px");
    expect(css).toContain("scroll-margin-top: 82px");
    expect(css).toContain("scroll-margin-bottom: 86px");
    expect(css).toContain("padding-bottom: 86px");
    expect(css).toContain(".featured-character");
    expect(css).toContain("border-radius: 0 !important");
  });
});
