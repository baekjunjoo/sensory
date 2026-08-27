import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("오늘의 친구 프로필 레이아웃", () => {
  it("원형 얼굴·하단 이름·모바일 크기를 명시한다", () => {
    expect(styles).toContain(".garden-site .friend-avatar");
    expect(styles).toContain("border-radius:50%");
    expect(styles).toContain("grid-template-rows:46px auto");
    expect(styles).toContain(".garden-hero+.page-width .accessibility-tts{margin-top:0}");
    expect(styles).toContain("@media(max-width:650px)");
    expect(styles).toContain(".garden-site .friend-avatar{width:48px;height:48px}");
  });
});
