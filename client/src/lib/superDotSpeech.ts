import "./vendor/superdot-tts.js";

type SuperDotUtterance = { onend?: (() => void) | null; onerror?: (() => void) | null };
type SuperDotEngine = {
  configure: (settings: { uiLang: "ko" | "en" | "es"; rate: number; pitch: number; mute: boolean }) => void;
  speak: (text: string) => SuperDotUtterance | undefined;
  stop: () => void;
};

declare global { interface Window { SDTTS?: SuperDotEngine; } }

function languageCode(locale: string): "ko" | "en" | "es" {
  if (locale.startsWith("es")) return "es";
  if (locale.startsWith("en")) return "en";
  return "ko";
}

export function speakWithSuperDot({ text, locale, rate, pitch, onEnd, onError }: {
  text: string; locale: string; rate: number; pitch: number; onEnd: () => void; onError: () => void;
}) {
  if (typeof window === "undefined" || !window.SDTTS || !window.speechSynthesis) return { started: false } as const;
  try {
    window.SDTTS.configure({ uiLang: languageCode(locale), rate: Math.round(rate * 100), pitch: Math.max(0.5, Math.min(2, 1 + pitch / 12)), mute: false });
    const utterance = window.SDTTS.speak(text);
    if (!utterance) return { started: false } as const;
    utterance.onend = onEnd;
    utterance.onerror = onError;
    return { started: true } as const;
  } catch { return { started: false } as const; }
}

export function stopSuperDot() {
  if (typeof window !== "undefined") window.SDTTS?.stop();
}
