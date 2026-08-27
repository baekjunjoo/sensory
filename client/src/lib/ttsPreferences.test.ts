import { describe, expect, it, vi } from "vitest";
import { DEFAULT_TTS_PREFERENCES, loadTtsPreferences, saveTtsPreferences } from "./ttsPreferences";

describe("TTS preferences", () => {
  it("restores only supported language, rate, and pitch combinations", () => {
    const storage = { getItem: vi.fn(() => JSON.stringify({ locale: "es-ES", rate: 1.15, pitch: 3, highlightText: "black", highlightSize: "xlarge", highlightBackground: "night" })) };
    expect(loadTtsPreferences(storage)).toEqual({ locale: "es-ES", rate: 1.15, pitch: 3, highlightText: "black", highlightSize: "xlarge", highlightBackground: "night" });
  });

  it("returns safe defaults when saved values are invalid or unavailable", () => {
    expect(loadTtsPreferences({ getItem: vi.fn(() => "not-json") })).toEqual(DEFAULT_TTS_PREFERENCES);
    expect(loadTtsPreferences({ getItem: vi.fn(() => JSON.stringify({ locale: "fr-FR", rate: 9, pitch: 4 })) })).toEqual(DEFAULT_TTS_PREFERENCES);
  });

  it("writes a reusable preference set without exposing failures", () => {
    const storage = { setItem: vi.fn() };
    const preferences = { locale: "en-US" as const, rate: 0.85, pitch: -3, highlightText: "blue" as const, highlightSize: "large" as const, highlightBackground: "contrast" as const };
    saveTtsPreferences(preferences, storage);
    expect(storage.setItem).toHaveBeenCalledWith("sensory-accessibility-tts-preferences", JSON.stringify(preferences));
  });
});
