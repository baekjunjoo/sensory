import { describe, expect, it } from "vitest";
import { attachPiperAudioErrorFallback, runBrowserSpeechFallback, startBrowserSpeechFallback, type BrowserSpeechUtterance } from "./browserSpeech";

describe("browser speech fallback", () => {
  it("reports an explicit unsupported state when no browser voice is available", () => {
    const result = startBrowserSpeechFallback({
      driver: { supported: false, createUtterance: () => ({ lang: "", rate: 1, onend: null }), speak: () => undefined },
      text: "fallback",
      locale: "ko-KR",
      rate: 1,
      onEnd: () => undefined,
    });

    expect(result).toBe("unsupported");
  });

  it("passes locale and speed to the browser voice and reports completion", () => {
    let spoken: BrowserSpeechUtterance | undefined;
    let ended = false;
    const result = startBrowserSpeechFallback({
      driver: { supported: true, createUtterance: () => ({ lang: "", rate: 1, onend: null }), speak: (utterance) => { spoken = utterance; } },
      text: "fallback",
      locale: "en-US",
      rate: 1.15,
      onEnd: () => { ended = true; },
    });

    spoken?.onend?.();
    expect(result).toBe("started");
    expect(spoken).toMatchObject({ lang: "en-US", rate: 1.15 });
    expect(ended).toBe(true);
  });

  it("routes a Piper audio playback error to the browser-voice fallback callback", () => {
    let fallbackCalls = 0;
    const player = { onerror: null as (() => void) | null };
    attachPiperAudioErrorFallback(player, () => { fallbackCalls += 1; });

    player.onerror?.();
    expect(fallbackCalls).toBe(1);
  });

  it("reports the accessible browser-voice status after a Piper playback error", () => {
    let state: ReturnType<typeof runBrowserSpeechFallback> | undefined;
    const player = { onerror: null as (() => void) | null };
    attachPiperAudioErrorFallback(player, () => {
      state = runBrowserSpeechFallback({
        driver: { supported: true, createUtterance: () => ({ lang: "", rate: 1, onend: null }), speak: () => undefined },
        text: "fallback",
        locale: "ko-KR",
        rate: 1,
        onEnd: () => undefined,
      });
    });

    player.onerror?.();
    expect(state).toEqual({ playing: true, status: "Piper 연결을 기다리는 동안 브라우저 음성으로 읽고 있어요." });
  });

  it("reports an explicit text-only status when browser speech is unavailable", () => {
    const state = runBrowserSpeechFallback({
      driver: { supported: false, createUtterance: () => ({ lang: "", rate: 1, onend: null }), speak: () => undefined },
      text: "fallback",
      locale: "ko-KR",
      rate: 1,
      onEnd: () => undefined,
    });

    expect(state).toEqual({ playing: false, status: "자연 음성과 브라우저 음성을 사용할 수 없어요. 화면의 텍스트를 계속 읽어 주세요." });
  });
});
