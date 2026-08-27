import { describe, expect, it } from "vitest";
import { createPiperTtsService } from "./piperTts";

describe("Piper TTS cache", () => {
  it("reuses identical audio without calling the synthesizer again", async () => {
    let calls = 0;
    const service = createPiperTtsService(async () => {
      calls += 1;
      return new Uint8Array([82, 73, 70, 70]);
    });

    const request = { text: "오늘의 학습지를 읽어요.", locale: "ko-KR" as const, rate: 1 };
    const first = await service.synthesize(request);
    const second = await service.synthesize(request);

    expect(first.audioBase64).toBe(second.audioBase64);
    expect(calls).toBe(1);
  });

  it("preserves synthesis failures so the client can use its browser-voice fallback", async () => {
    const service = createPiperTtsService(async () => {
      throw new Error("voice unavailable");
    });

    await expect(service.synthesize({ text: "fallback", locale: "en-US", rate: 1 })).rejects.toThrow("voice unavailable");
  });
});
