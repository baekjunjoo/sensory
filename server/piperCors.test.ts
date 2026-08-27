import { describe, expect, it } from "vitest";
import { piperCorsHeaders } from "./piperCors";

describe("Piper CORS", () => {
  it("allows the configured GitHub Pages origin", () => {
    expect(piperCorsHeaders("https://baekjunjoo.github.io")).toMatchObject({
      "Access-Control-Allow-Origin": "https://baekjunjoo.github.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    });
  });

  it("does not reflect unknown origins", () => {
    expect(piperCorsHeaders("https://untrusted.example")).toEqual({});
  });
});
