// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { speakWithSuperDot, stopSuperDot } from "./superDotSpeech";

describe("Super Dot speech bridge", () => {
  afterEach(() => { vi.restoreAllMocks(); Reflect.deleteProperty(window, "SDTTS"); });

  it("maps Sensory Spanish, speed, and pitch settings to the supplied engine", () => {
    const configure = vi.fn();
    const speak = vi.fn(() => ({}));
    Object.defineProperty(window, "SDTTS", { configurable: true, value: { configure, speak, stop: vi.fn() } });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {} });
    const result = speakWithSuperDot({ text: "Hola mundo", locale: "es-ES", rate: 1.15, pitch: 3, onEnd: vi.fn(), onError: vi.fn() });
    expect(result).toEqual({ started: true });
    expect(configure).toHaveBeenCalledWith({ uiLang: "es", rate: 115, pitch: 1.25, mute: false });
  });

  it("reports an unavailable engine and stops an available engine safely", () => {
    expect(speakWithSuperDot({ text: "안녕", locale: "ko-KR", rate: 1, pitch: 0, onEnd: vi.fn(), onError: vi.fn() })).toEqual({ started: false });
    const stop = vi.fn();
    Object.defineProperty(window, "SDTTS", { configurable: true, value: { stop } });
    stopSuperDot();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("does not require the speech synthesis API just to stop safely", () => {
    const stop = vi.fn();
    Object.defineProperty(window, "SDTTS", { configurable: true, value: { stop } });
    stopSuperDot();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
