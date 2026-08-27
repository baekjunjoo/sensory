import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const heroSceneCss = readFileSync(new URL("../hero-scene-layout.css", import.meta.url), "utf8");
const mainEntry = readFileSync(new URL("../main.tsx", import.meta.url), "utf8");

describe("background-first hero layout", () => {
  it("keeps copy directly on the island without a backing panel", () => {
    expect(heroSceneCss).toContain("padding: 0 !important");
    expect(heroSceneCss).toContain("background: transparent !important");
    expect(heroSceneCss).toContain("backdrop-filter: none !important");
  });

  it("loads the final scene layout after global poster styles and preserves mobile dock clearance", () => {
    expect(mainEntry.indexOf('import "./index.css"')).toBeLessThan(mainEntry.indexOf('import "./hero-scene-layout.css"'));
    expect(heroSceneCss).toContain("bottom: 152px");
    expect(heroSceneCss).toContain("margin-top: 8px");
  });
});
