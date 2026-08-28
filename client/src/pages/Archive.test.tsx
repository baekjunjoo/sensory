// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Archive from "./Archive";

describe("학습지 보관함", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "ko";
    document.title = "Sensory — 나의 학습지 보관함";
  });

  it("7일 학습지를 완료·열어 봄·도착 대기 상태와 다시 만나기 제어로 보여 준다", () => {
    render(<Archive />);
    const archive = screen.getByRole("region", { name: "보관된 학습지 목록" });
    expect(within(archive).getAllByRole("article")).toHaveLength(7);
    expect(within(archive).getAllByText("완료")).toHaveLength(2);
    expect(within(archive).getAllByRole("link", { name: "학습지 열기" }).some((link) => link.getAttribute("href") === "/?lesson=d4#today")).toBe(true);

    const review = within(archive).getAllByRole("button", { name: "다시 만나기" })[0];
    fireEvent.click(review);
    fireEvent.click(within(screen.getByRole("group", { name: "상태" })).getByRole("button", { name: "다시 만나기" }));
    expect(within(archive).getAllByRole("article")).toHaveLength(1);
    expect(within(archive).getByText(/다시 만져 보기/)).toBeTruthy();
  });

  it("완료 상태 필터는 완료한 학습지 카드만 남긴다", () => {
    render(<Archive />);
    fireEvent.click(screen.getByRole("button", { name: "완료" }));
    expect(within(screen.getByRole("region", { name: "보관된 학습지 목록" })).getAllByRole("article")).toHaveLength(2);
  });

  it("보관함은 구조·이름·ARIA 자동 접근성 규칙 위반을 만들지 않는다", async () => {
    render(<Archive />);
    const result = await axe.run(document, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
