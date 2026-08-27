export type TtsLocale = "ko-KR" | "en-US" | "es-ES";

export type TtsPreferences = {
  locale: TtsLocale;
  rate: number;
  pitch: number;
};

export const DEFAULT_TTS_PREFERENCES: TtsPreferences = {
  locale: "ko-KR",
  rate: 1,
  pitch: 0,
};

const STORAGE_KEY = "sensory-accessibility-tts-preferences";
const locales: TtsLocale[] = ["ko-KR", "en-US", "es-ES"];
const rates = [0.85, 1, 1.15, 1.3];
const pitches = [-3, 0, 3];

function validPreferences(value: unknown): value is TtsPreferences {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TtsPreferences>;
  return locales.includes(candidate.locale as TtsLocale) && rates.includes(candidate.rate ?? NaN) && pitches.includes(candidate.pitch ?? NaN);
}

export function loadTtsPreferences(storage: Pick<Storage, "getItem"> | undefined = typeof window === "undefined" ? undefined : window.localStorage): TtsPreferences {
  try {
    const value = storage?.getItem(STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : undefined;
    return validPreferences(parsed) ? parsed : DEFAULT_TTS_PREFERENCES;
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
