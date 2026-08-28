// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/AccessibilityTts", () => ({
  AccessibilityTts: () => <div data-testid="accessibility-tts" />,
}));

vi.mock("@/components/DotPadConnection", () => ({
  DotPadConnection: () => <div data-testid="dotpad-connection" />,
}));

vi.mock("@/lib/publicAsset", () => ({
  publicAsset: (path: string) => path,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    braille: {
      translate: {
        useMutation: () => ({
          mutate: (_input: unknown, callbacks?: { onSuccess?: (result: { braille: string; cells: number[][]; engine: "liblouis"; table: string }) => void }) => {
            callbacks?.onSuccess?.({ braille: "⠠⠝", cells: [[6], [1, 3, 4, 5]], engine: "liblouis", table: "ko-g2.ctb" });
          },
        }),
      },
    },
  },
}));

import Home from "./Home";

describe("오늘의 친구 프로필", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "ko";
    document.title = "Sensory — 오늘의 촉각 학습지";
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
  });

  it("데스크톱 폭에서 친구 선택 시 이름, aria-pressed, 히어로 장면 라벨을 함께 바꾼다", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
    render(<Home />);

    const picker = screen.getByLabelText("Sensory 친구와 색상 테마 선택");
    const pio = within(picker).getByRole("button", { name: "피오" });
    fireEvent.click(pio);

    expect(pio.getAttribute("aria-pressed")).toBe("true");
    expect(pio.textContent).toBe("피오");
    expect(screen.getByTestId("hero-scene-label").textContent).toContain("피오 · 촉각 우편 만");
  });

  it("모바일 폭에서도 친구 선택 시 이름, aria-pressed, 히어로 장면 라벨을 함께 바꾼다", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    render(<Home />);

    const picker = screen.getByLabelText("Sensory 친구와 색상 테마 선택");
    const nabi = within(picker).getByRole("button", { name: "나비" });
    fireEvent.click(nabi);

    expect(nabi.getAttribute("aria-pressed")).toBe("true");
    expect(nabi.textContent).toBe("나비");
    expect(nabi.firstElementChild?.className).toContain("friend-avatar");
    expect(nabi.lastElementChild?.textContent).toBe("나비");
    expect(screen.getByTestId("hero-scene-label").textContent).toContain("나비 · 알파벳 구름 정원");
  });

  it("오늘의 친구는 각 원형 프레임 안에 개별 3D 포트레이트를 렌더링한다", () => {
    render(<Home />);
    const picker = screen.getByLabelText("Sensory 친구와 색상 테마 선택");

    (["모모", "피오", "루루", "나비"] as const).forEach((name) => {
      const button = within(picker).getByRole("button", { name });
      const portrait = button.querySelector<HTMLImageElement>(".friend-avatar > img");
      expect(portrait).not.toBeNull();
      expect(portrait?.getAttribute("alt")).toBe("");
      expect(button.querySelector(".friend-avatar")?.getAttribute("data-character")).toBeTruthy();
    });
  });

  it("홈에는 별도의 기기 음성으로 읽기 패널을 렌더링하지 않는다", () => {
    render(<Home />);
    expect(screen.queryByTestId("accessibility-tts")).toBeNull();
    expect(screen.queryByRole("heading", { name: "기기 음성으로 읽기" })).toBeNull();
  });

  it("학습 정원 카드마다 요일·제목·설명이 하나의 문구 묶음으로 렌더링된다", () => {
    render(<Home />);
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".curriculum-card"));

    expect(cards).toHaveLength(4);
    cards.forEach((card) => {
      const copy = card.querySelector(":scope > .curriculum-copy");
      expect(copy?.querySelector(":scope > span")?.textContent).toBeTruthy();
      expect(copy?.querySelector(":scope > h3")?.textContent).toBeTruthy();
      expect(copy?.querySelector(":scope > p")?.textContent).toBeTruthy();
    });
  });

  it("LIVE DOTPAD PREVIEW에는 중복 유니코드 점자 문자열 없이 촉각 격자만 남긴다", () => {
    render(<Home />);
    expect(document.querySelector(".studio-braille")).toBeNull();
    expect(document.querySelectorAll(".studio-dotpad .cell-small").length).toBeGreaterThan(0);
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toContain("Liblouis 표준 점역 결과가 준비됐어요.");
  });

  it("점자 실험실과 마지막 영역의 장식 캐릭터 없이 DotPad 공식 문의 영역을 제공한다", () => {
    render(<Home />);

    expect(document.querySelector(".studio-face")).toBeNull();
    expect(document.querySelector(".footer-plant")).toBeNull();
    const inquiry = screen.getByRole("region", { name: /DotPad를 만나 보세요/ });
    const inquiryLink = within(inquiry).getByRole("link", { name: /DotPad 렌탈·구매 문의하기/ });
    inquiryLink.focus();
    expect(document.activeElement).toBe(inquiryLink);
    expect(inquiryLink.getAttribute("href")).toBe("https://www.dotincorp.com/en/contact");
    expect(inquiryLink.getAttribute("target")).toBe("_blank");
    expect(inquiryLink.getAttribute("rel")).toBe("noreferrer");
    expect(within(inquiry).getByRole("link", { name: /Dot Pad X 자세히 보기/ }).getAttribute("href")).toBe("https://www.dotincorp.com/en/product/dotpadx");
  });

  it("헤더와 푸터 브랜드에는 Sensory 워드마크만 남긴다", () => {
    render(<Home />);
    expect(screen.getByLabelText("Sensory 홈").textContent).toBe("sensory");
    expect(document.querySelectorAll(".brand-mark")).toHaveLength(0);
    expect(screen.queryByText("TOUCH & GROW")).toBeNull();
  });

  it("모바일 메뉴는 제어 관계를 알리고 Escape로 닫힌 뒤 메뉴 버튼에 초점을 돌린다", () => {
    render(<Home />);
    const menuButton = screen.getByLabelText("메뉴 열기");
    fireEvent.click(menuButton);

    const menu = screen.getByLabelText("모바일 메뉴");
    expect(menuButton.getAttribute("aria-controls")).toBe("mobile-navigation");
    expect(menuButton.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(within(menu).getByRole("link", { name: "오늘의 한 장" }));

    fireEvent.keyDown(window, { key: "Escape" });
    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(menuButton);
  });

  it("봉투를 열고 정답을 확인하면 완료 도장과 보관함 진입을 보여 준다", () => {
    render(<Home />);
    const arrival = screen.getByRole("tabpanel");
    fireEvent.click(within(arrival).getByRole("button", { name: /학습지 열기/ }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /정답 확인/ }));

    expect(screen.getByRole("heading", { name: /오늘의 한 장을\s*완성했어요/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /보관함에서 보기/ }).getAttribute("href")).toBe("/archive");
    expect(screen.getByText("촉각 스티커 +1")).toBeTruthy();
  });

  it("도착한 한 장에는 촉각 목표와 사용자 제공 3D 점토 봉투를 함께 보여 준다", () => {
    render(<Home />);
    const arrival = screen.getByRole("tabpanel");

    expect(within(arrival).getByText("오늘의 촉각 목표")).toBeTruthy();
    expect(within(arrival).getByText("세어 보기 · 3 더하기 2")).toBeTruthy();
    expect(arrival.querySelector<HTMLImageElement>(".clay-envelope img")?.getAttribute("src")).toBe("/manus-storage/sensory-arrival-envelope-transparent_709fdfca.png");
    expect(arrival.querySelector(".arrival-envelope-paper")).toBeNull();
  });

  it("정답이 아니면 학습지를 다시 만져 보기 목록에 담는다", () => {
    render(<Home />);
    fireEvent.click(within(screen.getByRole("tabpanel")).getByRole("button", { name: /학습지 열기/ }));
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: /정답 확인/ }));

    expect(screen.getByText(/다시 만져 보기 목록에 담았어요/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("sensory-daily-routine") ?? "{}").reviewIds).toContain("d3");
  });

  it("DotPad가 없어도 화면 점자 대체 경로로 촉각 미션 2단계를 이어 갈 수 있다", () => {
    render(<Home />);
    fireEvent.click(within(screen.getByRole("tabpanel")).getByRole("button", { name: /학습지 열기/ }));
    expect(screen.getByRole("button", { name: "화면 점자로 계속하기" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "화면 점자로 계속하기" }));
    expect(screen.queryByRole("button", { name: "화면 점자로 계속하기" })).toBeNull();
    expect(screen.getByText("점을 만져 보기").parentElement?.className).toContain("done");
  });

  it("완료 도장의 내일 미리 보기는 다음 학습지 봉투로 전환한다", () => {
    render(<Home />);
    fireEvent.click(within(screen.getByRole("tabpanel")).getByRole("button", { name: /학습지 열기/ }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /정답 확인/ }));
    fireEvent.click(screen.getByRole("button", { name: /내일의 한 장 미리 보기/ }));

    expect(screen.getByRole("tab", { name: /목.*영어/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toContain("목요일의 영어 학습지");
    expect(within(screen.getByRole("tabpanel")).getByRole("button", { name: /학습지 열기/ })).toBeTruthy();
  });

  it("7일 학습지 탭은 화살표·Home·End 키로 선택과 초점을 함께 옮기고 탭패널을 연결한다", () => {
    render(<Home />);
    const tabs = within(screen.getByRole("tablist", { name: "7일 학습지 선택" })).getAllByRole("tab");

    expect(tabs[2].getAttribute("aria-controls")).toBe("daily-task-panel");
    fireEvent.keyDown(tabs[2], { key: "ArrowRight" });
    expect(tabs[3].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[3]);
    fireEvent.click(within(screen.getByRole("tabpanel")).getByRole("button", { name: /학습지 열기/ }));
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(tabs[3].id);

    fireEvent.keyDown(tabs[3], { key: "End" });
    expect(tabs[6].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(tabs[6], { key: "Home" });
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  });

  it("건너뛰기 링크와 보호자 리포트 링크가 접근 가능한 이름과 현재 배포 기본 경로를 유지한다", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "오늘의 학습지로 바로가기" }).getAttribute("href")).toBe("#today");
    expect(screen.getAllByRole("link", { name: "보호자 리포트 보기" }).every((link) => link.getAttribute("href") === "/report")).toBe(true);
  });

  it("홈의 자동 WCAG 규칙 검사에서 구조·이름·ARIA 위반을 만들지 않는다", async () => {
    render(<Home />);
    const result = await axe.run(document, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
