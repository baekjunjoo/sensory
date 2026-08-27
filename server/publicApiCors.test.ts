import { describe, expect, it } from "vitest";
import { publicApiCorsHeaders } from "./publicApiCors";

describe("공개 tRPC CORS", () => {
  it("allows the configured GitHub Pages origin", () => {
    expect(publicApiCorsHeaders("https://baekjunjoo.github.io")).toMatchObject({
      "Access-Control-Allow-Origin": "https://baekjunjoo.github.io",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    });
  });

  it("does not reflect unknown origins", () => {
    expect(publicApiCorsHeaders("https://untrusted.example")).toEqual({});
  });
});
