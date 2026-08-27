import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const heroCopyCss = readFileSync(new URL("../hero-copy-layout.css", import.meta.url), "utf8");

describe("hero supporting-copy layout", () => {
  it("keeps supporting copy as a wider balanced text block", () => {
    expect(heroCopyCss).toContain("width: min(550px, calc(100vw - 64px))");
    expect(heroCopyCss).toContain("max-width: none");
    expect(heroCopyCss).toContain("line-height: 1.56");
    expect(heroCopyCss).toContain("text-wrap: balance");
  });
});
