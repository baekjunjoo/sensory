import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "client/src/arrival-letter-section.css"), "utf8");
const accessibilityCss = readFileSync(resolve(process.cwd(), "client/src/accessibility-aa.css"), "utf8");
const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("한 장의 편지를 여는 도착 장면", () => {
  it("uses a full-height clay beach instead of a small independent envelope card", () => {
    expect(css).toContain("var(--arrival-scene)");
    expect(css).toContain("min-height: 500px");
    expect(css).toContain("background:");
    expect(css).toContain("center / cover no-repeat !important");
    expect(css).toContain("border: 0 !important");
    expect(css).toContain("border-radius: 0 !important");
    expect(css).toContain(".arrival-envelope.clay-envelope");
    expect(css).toContain("@media (min-width: 651px)");
  });

  it("keeps the arrival scene full height on a mobile screen and removes character display frames", () => {
    expect(css).toContain("min-height: 620px");
    expect(css).toContain("scroll-margin-top: 82px");
    expect(css).toContain("scroll-margin-bottom: 86px");
    expect(css).toContain("padding-bottom: 86px");
    expect(css).toContain(".featured-character");
    expect(css).toContain("border-radius: 0 !important");
  });

  it("extends the same letter beach behind the weekly introduction and preserves the accessible tab controls", () => {
    expect(home).toContain('id="today" className="daily-section"');
    expect(home).toContain('"--arrival-scene": `url(${CLAY_ENVELOPE})`');
    expect(css).toContain(".garden-site .daily-section {");
    expect(css).toContain(".garden-site .daily-section .week-picker");
    expect(css).toContain('[role="tab"].active');
    expect(css).toContain("background: transparent !important");
  });

  it("uses a matching card grid and brighter sea overlays for the introduction and tactile garden", () => {
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(css).toContain("min-height: clamp(338px, 31vw, 390px)");
    expect(css).toContain("aspect-ratio: 4 / 3");
    expect(css).toContain("rgba(54, 166, 192, 0.88)");
    expect(css).toContain("rgba(255, 255, 255, 0.62)");
    expect(css).toContain(".garden-site .how-section .how-copy");
    expect(css).toContain("rgba(247, 255, 250, 0.94)");
    expect(css).toContain("rgba(4, 65, 88, 0.82)");
    expect(css).toContain("height: 384px");
    expect(css).toContain("height: 366px");
  });

  it("places delivery copy beside a dedicated wide clay-envelope beach and changes to a tall beach on mobile", () => {
    expect(home).toContain("ARRIVAL_ENVELOPE_BEACH_WIDE");
    expect(home).toContain("ARRIVAL_ENVELOPE_BEACH_TALL");
    expect(css).toContain("var(--arrival-wide-scene) center / cover no-repeat !important");
    expect(css).toContain("var(--arrival-tall-scene) center / cover no-repeat !important");
    expect(css).toContain("grid-template-columns: minmax(270px, 0.86fr) minmax(0, 1.14fr)");
    expect(css).toContain("grid-column: 2");
    expect(css).toContain("width: min(100%, 470px)");
    expect(css).toContain("min-height: 820px");
  });

  it("does not let the later accessibility stylesheet restore dark copy boxes over the bright sections", () => {
    expect(accessibilityCss).not.toContain(".how-section .how-copy");
    expect(accessibilityCss).not.toContain(".curriculum-section .curriculum-header");
    expect(accessibilityCss).not.toContain(".daily-section::after,");
  });
});
