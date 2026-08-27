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

  it("리포트에서 구조·이름·ARIA 자동 검사 위반을 만들지 않는다", async () => {
    render(<Report />);
    const result = await axe.run(document, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.map((violation) => violation.id)).toEqual([]);
  });
});
