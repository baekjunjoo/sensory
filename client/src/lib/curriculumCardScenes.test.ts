import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
const cardLayoutStyles = readFileSync(resolve(process.cwd(), "client/src/arrival-letter-section.css"), "utf8");

describe("개별 3D 캐릭터 카드 장면", () => {
  it("네 카드에 과목별 장면과 개별 3D 자산을 함께 연결한다", () => {
    expect(home).toContain("const CURRICULUM_SCENES");
    expect(home).toContain('CURRICULUM_SCENES.momo');
    expect(home).toContain('CURRICULUM_SCENES.pio');
    expect(home).toContain('CURRICULUM_SCENES.lulu');
    expect(home).toContain('CURRICULUM_SCENES.nabi');
    expect(home).toContain('CURRICULUM_CHARACTERS.momo');
    expect(home).toContain('CURRICULUM_CHARACTERS.pio');
    expect(home).toContain('CURRICULUM_CHARACTERS.lulu');
    expect(home).toContain('CURRICULUM_CHARACTERS.nabi');
  });

  it("장면 배경과 좌측 텍스트 안전 오버레이를 명시한다", () => {
    expect(styles).toContain("var(--card-scene) center/cover no-repeat!important");
    expect(styles).toContain(".curriculum-card.purple");
    expect(styles).toContain(".curriculum-card.yellow");
    expect(styles).toContain(".curriculum-card.pink");
    expect(styles).toContain(".curriculum-card.lime");
    expect(styles).toContain(".curriculum-card::after");
  });

  it("데스크톱 hover에서 3D 캐릭터를 부드럽게 움직이고 모션 감소에서는 정지한다", () => {
    expect(styles).toContain("@media(hover:hover) and (pointer:fine)");
    expect(styles).toContain(".curriculum-card:hover>img.card-character-image");
    expect(styles).toContain("filter:drop-shadow(0 23px 20px rgba(0,35,58,.32)) brightness(1.04)");
    expect(styles).toContain("@media(prefers-reduced-motion:reduce)");
    expect(styles).toContain(".growth-poster .featured-character,.curriculum-card>.card-character{animation:none!important;transition:none!important}");
  });

  it("주인공 캐릭터를 카드 시선 중심에서 확대하고 하단 문구 안전 영역을 유지한다", () => {
    expect(cardLayoutStyles).toContain("top: 39%");
    expect(cardLayoutStyles).toContain("width: clamp(170px, 46%, 290px) !important");
    expect(cardLayoutStyles).toContain("height: auto !important");
    expect(cardLayoutStyles).toContain("max-height: 55%");
    expect(cardLayoutStyles).toContain("transform: translate(-50%, -50%) !important");
    expect(cardLayoutStyles).toContain("width: clamp(184px, 55vw, 240px) !important");
    expect(cardLayoutStyles).toContain("right: 24px");
    expect(cardLayoutStyles).toContain("bottom: 22px");
  });
});
