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
});
