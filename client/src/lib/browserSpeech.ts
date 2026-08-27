export type BrowserSpeechUtterance = {
  lang: string;
  rate: number;
  pitch: number;
  onend: (() => void) | null;
};

export type BrowserSpeechDriver = {
  supported: boolean;
  createUtterance: (text: string) => BrowserSpeechUtterance;
  speak: (utterance: BrowserSpeechUtterance) => void;
};

export function startBrowserSpeechFallback({
  driver,
  text,
  locale,
  rate,
  pitch,
  onEnd,
}: {
  driver: BrowserSpeechDriver;
  text: string;
  locale: string;
  rate: number;
  pitch: number;
  onEnd: () => void;
}) {
  if (!driver.supported) return "unsupported" as const;
  const utterance = driver.createUtterance(text);
  utterance.lang = locale;
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.onend = onEnd;
  driver.speak(utterance);
  return "started" as const;
}

export function attachPiperAudioErrorFallback(
  player: { onerror: (() => void) | null },
  onFallback: () => void,
) {
  player.onerror = onFallback;
}

export function runBrowserSpeechFallback({
  driver,
  text,
  locale,
  rate,
  pitch,
  onEnd,
}: {
  driver: BrowserSpeechDriver;
  text: string;
  locale: string;
  rate: number;
  pitch: number;
  onEnd: () => void;
}) {
  const result = startBrowserSpeechFallback({ driver, text, locale, rate, pitch, onEnd });
  return result === "started"
    ? { playing: true, status: "Piper 연결을 기다리는 동안 브라우저 음성으로 읽고 있어요." }
    : { playing: false, status: "자연 음성과 브라우저 음성을 사용할 수 없어요. 화면의 텍스트를 계속 읽어 주세요." };
}
