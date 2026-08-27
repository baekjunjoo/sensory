import { describe, expect, it } from "vitest";
import { resolveTtsEndpoint, usesRemoteTts } from "./ttsEndpoint";

describe("GitHub Pages Piper endpoint", () => {
  it("uses the relative tRPC path while the full-stack site hosts its own API", () => {
    expect(resolveTtsEndpoint()).toBe("/api/trpc");
    expect(usesRemoteTts()).toBe(false);
  });

  it("uses the configured public Piper server without a doubled slash", () => {
    expect(resolveTtsEndpoint("https://sensory.manus.space/")).toBe("https://sensory.manus.space/api/trpc");
    expect(usesRemoteTts("https://sensory.manus.space/")).toBe(true);
  });
});
