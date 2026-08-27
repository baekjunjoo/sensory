import { createHash } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";

export const PIPER_LOCALES = ["ko-KR", "en-US"] as const;
export type PiperLocale = (typeof PIPER_LOCALES)[number];

type SynthesisRequest = { text: string; locale: PiperLocale; rate: number };
type SynthesizeBytes = (request: SynthesisRequest) => Promise<Uint8Array>;

const DEFAULT_PORT = 5001;
const cache = new Map<string, Uint8Array>();
const inFlight = new Map<string, Promise<Uint8Array>>();
let piperProcess: ChildProcessWithoutNullStreams | undefined;
let startup: Promise<void> | undefined;

function voiceFor(locale: PiperLocale) {
  return locale === "ko-KR" ? "ko_KR-kss-medium" : "en_US-lessac-low";
}

function cacheKey({ text, locale, rate }: SynthesisRequest) {
  return createHash("sha256").update(`${locale}\u0000${rate}\u0000${text}`).digest("hex");
}

function cacheAudio(key: string, audio: Uint8Array) {
  cache.set(key, audio);
  if (cache.size > 48) cache.delete(cache.keys().next().value as string);
}

async function waitForPiper() {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/info`);
      if (response.ok) return;
    } catch {
      // Piper is still loading its onnx voice into memory.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Piper 음성 엔진을 시작하지 못했습니다.");
}

async function ensurePiper() {
  if (startup) return startup;
  const voiceDirectory = process.env.PIPER_DATA_DIR ?? path.resolve(process.cwd(), "vendor", "piper");
  startup = (async () => {
    piperProcess = spawn(
      "python3",
      ["-m", "piper.http_server", "-m", "ko_KR-kss-medium", "--data-dir", voiceDirectory, "--host", "127.0.0.1", "--port", String(DEFAULT_PORT)],
      { stdio: "pipe" },
    );
    piperProcess.once("exit", () => {
      piperProcess = undefined;
      startup = undefined;
    });
    await waitForPiper();
  })();
  return startup;
}

async function synthesizeWithPiper({ text, locale, rate }: SynthesisRequest) {
  await ensurePiper();
  const response = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice: voiceFor(locale),
      length_scale: Math.min(1.28, Math.max(0.72, 1 / rate)),
      noise_scale: 0.62,
      noise_w_scale: 0.72,
    }),
  });
  if (!response.ok) throw new Error("Piper 음성 합성에 실패했습니다.");
  return new Uint8Array(await response.arrayBuffer());
}

export function createPiperTtsService(synthesizer: SynthesizeBytes = synthesizeWithPiper) {
  return {
    async synthesize(request: SynthesisRequest) {
      const key = cacheKey(request);
      const existing = cache.get(key);
      if (existing) return { audioBase64: Buffer.from(existing).toString("base64"), cache: "hit" as const };

      let work = inFlight.get(key);
      if (!work) {
        work = synthesizer(request).then((audio) => {
          cacheAudio(key, audio);
          return audio;
        }).finally(() => inFlight.delete(key));
        inFlight.set(key, work);
      }

      const audio = await work;
      return { audioBase64: Buffer.from(audio).toString("base64"), cache: "miss" as const };
    },
  };
}

export const piperTts = createPiperTtsService();

if (process.env.NODE_ENV === "production") {
  void ensurePiper().catch(() => undefined);
}
