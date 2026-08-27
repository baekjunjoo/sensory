import { spawn } from "node:child_process";

export const BRAILLE_LOCALES = ["ko-KR", "en-US"] as const;
export type BrailleLocale = (typeof BRAILLE_LOCALES)[number];
export type BrailleDots = number[];

type TranslateRequest = { text: string; locale: BrailleLocale };
type Translator = (request: TranslateRequest) => Promise<string>;

const tableFor = (locale: BrailleLocale) => locale === "ko-KR" ? "ko-g2.ctb" : "en-ueb-g2.ctb";

function unicodeBrailleToCells(output: string): BrailleDots[] {
  return Array.from(output).flatMap((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint < 0x2800 || codePoint > 0x28ff) return [];
    const bits = codePoint - 0x2800;
    return [Array.from({ length: 8 }, (_, index) => index + 1).filter((dot) => (bits & (1 << (dot - 1))) !== 0)];
  });
}

async function translateWithLiblouis({ text, locale }: TranslateRequest): Promise<string> {
  const table = `unicode.dis,${tableFor(locale)}`;
  return new Promise((resolve, reject) => {
    const process = spawn("lou_translate", ["--forward", table], {
      env: globalThis.process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    let errorOutput = "";
    process.stdout.setEncoding("utf8");
    process.stderr.setEncoding("utf8");
    process.stdout.on("data", (chunk) => { output += chunk; });
    process.stderr.on("data", (chunk) => { errorOutput += chunk; });
    process.once("error", () => reject(new Error("Liblouis 점역 엔진을 실행하지 못했습니다.")));
    process.once("close", (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput.trim() || "Liblouis 점역에 실패했습니다."));
        return;
      }
      resolve(output.replace(/\r?\n$/, ""));
    });
    process.stdin.end(text);
  });
}

export function createLiblouisService(translator: Translator = translateWithLiblouis) {
  return {
    async translate(request: TranslateRequest) {
      const braille = await translator(request);
      const cells = unicodeBrailleToCells(braille);
      if (!cells.length) throw new Error("Liblouis가 점자 셀을 만들지 못했습니다.");
      return { braille, cells, locale: request.locale, table: tableFor(request.locale), engine: "liblouis" as const };
    },
  };
}

export const liblouis = createLiblouisService();
