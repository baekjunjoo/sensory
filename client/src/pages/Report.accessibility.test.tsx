// @vitest-environment jsdom
import axe from "axe-core";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Report from "./Report";

describe("보호자 리포트 접근성", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "ko";
    document.title = "Sensory — 보호자 리포트";
  });

  afterEach(() => cleanup());

  it("진행률을 이름과 현재값을 갖춘 ARIA 진행 표시줄로 제공한다", () => {
    render(<Report />);
    const progressBars = screen.getAllByRole("progressbar");
    const weeklyProgress = progressBars[0];
    const completed = Number(weeklyProgress.getAttribute("aria-valuenow"));
    expect(progressBars.length).toBeGreaterThan(1);
    expect(weeklyProgress.getAttribute("aria-valuemin")).toBe("0");
    expect(weeklyProgress.getAttribute("aria-valuemax")).toBe("7");
    expect(completed).toBeGreaterThanOrEqual(0);
    expect(completed).toBeLessThanOrEqual(7);
    expect(weeklyProgress.getAttribute("aria-label")).toBe(`7개 중 ${completed}개 완료`);
  });

  it("일일 루틴과 DotPad 기록을 보호자용 요약과 다음 학습지 제안에 반영한다", () => {
    window.localStorage.setItem("sensory-daily-routine", JSON.stringify({
      openedIds: ["d1", "d2", "d3", "d4"],
      completedIds: ["d1", "d2", "d3"],
      completedAt: { d1: 1, d2: 2, d3: 3 },
      tactileExploredIds: ["d2", "d3"],
      dotpadFrameIds: ["d2", "d3"],
      reviewIds: ["d1"],
    }));
    render(<Report />);

    expect(screen.getByText("봉투를 연 학습지").parentElement?.textContent).toContain("4장");
    expect(screen.getByText("화면·DotPad로 점을 탐색").parentElement?.textContent).toContain("2장");
    expect(screen.getByText("다시 만나기로 담은 한 장").parentElement?.textContent).toContain("1장");
    expect(screen.getByText(/DotPad에도/)).toBeTruthy();
    expect(screen.getByText(/2개 학습지의 촉각 프레임 전송/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /첫 영어 점자/ })).toBeTruthy();
  });

  it("리포트에서 구조·이름·ARIA 자동 검사 위반을 만들지 않는다", async () => {
    render(<Report />);
    const result = await axe.run(document, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.map((violation) => violation.id)).toEqual([]);
  });
});
