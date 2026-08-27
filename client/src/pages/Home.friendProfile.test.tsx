// @vitest-environment jsdom
import React from "react";
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

  it("LIVE DOTPAD PREVIEW에는 중복 유니코드 점자 문자열 없이 촉각 격자만 남긴다", () => {
    render(<Home />);
    expect(document.querySelector(".studio-braille")).toBeNull();
    expect(document.querySelectorAll(".studio-dotpad .cell-small").length).toBeGreaterThan(0);
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toContain("Liblouis 표준 점역 결과가 준비됐어요.");
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
});
