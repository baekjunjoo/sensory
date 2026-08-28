/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const html = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");
const recoveryScript = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1];

afterEach(() => {
  document.head.innerHTML = "";
});

describe("GitHub Pages stylesheet recovery", () => {
  it("retries a failed built stylesheet once with a cache-busting URL", () => {
    expect(html).toContain("new MutationObserver(watchExisting)");
    expect(html).toContain('link.addEventListener("error"');
    expect(html).toContain('retryUrl.searchParams.set("css-retry"');
    expect(html).toContain("{ once: true }");
  });

  it("applies one cache-busting retry URL after the stylesheet error event", () => {
    expect(recoveryScript).toBeTruthy();
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://baekjunjoo.github.io/sensory/assets/index.css";
    document.head.append(link);

    window.eval(recoveryScript!);
    link.dispatchEvent(new Event("error"));
    const retriedHref = link.href;

    expect(new URL(retriedHref).searchParams.has("css-retry")).toBe(true);
    link.dispatchEvent(new Event("error"));
    expect(link.href).toBe(retriedHref);
  });
});
