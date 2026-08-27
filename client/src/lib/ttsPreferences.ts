export type TtsLocale = "ko-KR" | "en-US" | "es-ES";
export type HighlightText = "navy" | "black" | "blue";
export type HighlightSize = "normal" | "large" | "xlarge";
export type HighlightBackground = "soft" | "contrast" | "night";

export type TtsPreferences = {
  locale: TtsLocale;
  rate: number;
  pitch: number;
  highlightText: HighlightText;
  highlightSize: HighlightSize;
  highlightBackground: HighlightBackground;
};

export const DEFAULT_TTS_PREFERENCES: TtsPreferences = {
  locale: "ko-KR",
  rate: 1,
  pitch: 0,
  highlightText: "navy",
  highlightSize: "normal",
  highlightBackground: "soft",
};

const STORAGE_KEY = "sensory-accessibility-tts-preferences";
const locales: TtsLocale[] = ["ko-KR", "en-US", "es-ES"];
const rates = [0.85, 1, 1.15, 1.3];
const pitches = [-3, 0, 3];
const highlightTexts: HighlightText[] = ["navy", "black", "blue"];
const highlightSizes: HighlightSize[] = ["normal", "large", "xlarge"];
const highlightBackgrounds: HighlightBackground[] = ["soft", "contrast", "night"];

function validPreferences(value: unknown): value is Partial<TtsPreferences> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TtsPreferences>;
  return locales.includes(candidate.locale as TtsLocale) && rates.includes(candidate.rate ?? NaN) && pitches.includes(candidate.pitch ?? NaN);
}

export function loadTtsPreferences(storage: Pick<Storage, "getItem"> | undefined = typeof window === "undefined" ? undefined : window.localStorage): TtsPreferences {
  try {
    const value = storage?.getItem(STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : undefined;
    if (!validPreferences(parsed)) return DEFAULT_TTS_PREFERENCES;
    return {
      locale: parsed.locale as TtsLocale,
      rate: parsed.rate as number,
      pitch: parsed.pitch as number,
      highlightText: highlightTexts.includes(parsed.highlightText as HighlightText) ? parsed.highlightText as HighlightText : DEFAULT_TTS_PREFERENCES.highlightText,
      highlightSize: highlightSizes.includes(parsed.highlightSize as HighlightSize) ? parsed.highlightSize as HighlightSize : DEFAULT_TTS_PREFERENCES.highlightSize,
      highlightBackground: highlightBackgrounds.includes(parsed.highlightBackground as HighlightBackground) ? parsed.highlightBackground as HighlightBackground : DEFAULT_TTS_PREFERENCES.highlightBackground,
    };
  } catch {
    return DEFAULT_TTS_PREFERENCES;
  }
}

export function saveTtsPreferences(preferences: TtsPreferences, storage: Pick<Storage, "setItem"> | undefined = typeof window === "undefined" ? undefined : window.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Reading preferences must remain usable when storage is unavailable.
  }
}
