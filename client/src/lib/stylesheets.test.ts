import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const html = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

describe("GitHub Pages stylesheet recovery", () => {
  it("retries a failed built stylesheet once with a cache-busting URL", () => {
    expect(html).toContain("new MutationObserver(watchExisting)");
    expect(html).toContain('link.addEventListener("error"');
    expect(html).toContain('retryUrl.searchParams.set("css-retry"');
    expect(html).toContain("{ once: true }");
  });
});
