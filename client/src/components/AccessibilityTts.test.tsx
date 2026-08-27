// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ttsMock = vi.hoisted(() => ({ speak: vi.fn(), stop: vi.fn() }));

vi.mock("@/lib/superDotSpeech", () => ({
  speakWithSuperDot: ttsMock.speak,
  stopSuperDot: ttsMock.stop,
}));

import { AccessibilityTts } from "./AccessibilityTts";

const content = {
  site: { "ko-KR": "센서리 소개. 매일 한 장을 읽어요.", "en-US": "Sensory introduction.", "es-ES": "Introducción a Sensory." },
  today: { "ko-KR": "오늘의 학습", "en-US": "Today's lesson", "es-ES": "La lección de hoy" },
  studio: { "ko-KR": "점자 실험실", "en-US": "Braille studio", "es-ES": "Laboratorio braille" },
};

describe("AccessibilityTts with Super Dot", () => {
  let callbacks: { onEnd: () => void; onError: () => void };

  beforeEach(() => {
    document.documentElement.lang = "ko";
    document.title = "Sensory — 오늘의 촉각 학습지";
    callbacks = { onEnd: vi.fn(), onError: vi.fn() };
    ttsMock.speak.mockReset();
    ttsMock.stop.mockReset();
    ttsMock.speak.mockImplementation((options) => {
      callbacks = { onEnd: options.onEnd, onError: options.onError };
      return { started: true };
    });
    window.localStorage.clear();
    Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: false })) });
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => cleanup());

  it("starts sentence reading with the saved language, speed, and pitch", () => {
    render(<AccessibilityTts content={content} />);
    fireEvent.change(screen.getByLabelText("언어"), { target: { value: "es-ES" } });
    fireEvent.change(screen.getByLabelText("속도"), { target: { value: "1.15" } });
    fireEvent.change(screen.getByLabelText("피치"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "읽기" }));
    expect(ttsMock.speak).toHaveBeenLastCalledWith(expect.objectContaining({ locale: "es-ES", rate: 1.15, pitch: 3 }));
    expect(screen.getByText("Introducción a Sensory.").className).toContain("is-reading");
  });

  it("moves to the next sentence after a successful utterance", async () => {
    render(<AccessibilityTts content={content} />);
    fireEvent.click(screen.getByRole("button", { name: "읽기" }));
    await act(async () => callbacks.onEnd());
    expect(ttsMock.speak).toHaveBeenCalledTimes(2);
    expect(screen.getByText("매일 한 장을 읽어요.").className).toContain("is-reading");
  });

  it("shows text-reading guidance when the engine is unavailable", () => {
    ttsMock.speak.mockReturnValue({ started: false });
    render(<AccessibilityTts content={content} />);
    fireEvent.click(screen.getByRole("button", { name: "읽기" }));
    expect(screen.getByText("이 브라우저에서 기기 음성을 사용할 수 없어요. 화면의 텍스트를 계속 읽어 주세요.")).toBeTruthy();
  });

  it("shows text-reading guidance after a playback error", async () => {
    render(<AccessibilityTts content={content} />);
    fireEvent.click(screen.getByRole("button", { name: "읽기" }));
    await act(async () => callbacks.onError());
    expect(screen.getByText("기기 음성 재생에 실패했어요. 화면의 텍스트를 계속 읽어 주세요.")).toBeTruthy();
  });

  it("stops Super Dot playback with the stop button and Escape", () => {
    render(<AccessibilityTts content={content} />);
    fireEvent.click(screen.getByRole("button", { name: "읽기" }));
    fireEvent.click(screen.getByRole("button", { name: "정지" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(ttsMock.stop).toHaveBeenCalledTimes(2);
    expect(screen.getByText("음성 읽기를 멈췄어요.")).toBeTruthy();
  });

  it("keeps Spanish, pitch, low-vision controls, and live status exposed", () => {
    render(<AccessibilityTts content={content} />);
    expect(screen.getByRole("option", { name: "Español" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "낮게" })).toBeTruthy();
    expect(screen.getByLabelText("다국어 접근성 음성 읽기").querySelector("[aria-live='polite']")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "큰 글자 고대비" }));
    expect(screen.getByLabelText("문장별 읽기 진행").getAttribute("data-highlight-size")).toBe("xlarge");
  });

  it("groups low-vision controls and exposes reading status through semantic regions", () => {
    render(<AccessibilityTts content={content} />);
    expect(screen.getByRole("group", { name: "저시력 하이라이트 프리셋" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "문장별 읽기 진행" })).toBeTruthy();
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
  });

  it("does not introduce structural, naming, or ARIA violations in the reader panel", async () => {
    render(<AccessibilityTts content={content} />);
    const result = await axe.run(document, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.map((violation) => violation.id)).toEqual([]);
  });

  it("restores and resets local reader preferences", () => {
    const { unmount } = render(<AccessibilityTts content={content} />);
    fireEvent.change(screen.getByLabelText("언어"), { target: { value: "es-ES" } });
    fireEvent.change(screen.getByLabelText("속도"), { target: { value: "1.3" } });
    unmount();
    render(<AccessibilityTts content={content} />);
    expect((screen.getByLabelText("언어") as HTMLSelectElement).value).toBe("es-ES");
    fireEvent.click(screen.getByRole("button", { name: "기본값으로 초기화" }));
    expect((screen.getByLabelText("언어") as HTMLSelectElement).value).toBe("ko-KR");
  });

  it("reads a local text file without uploading its text", async () => {
    render(<AccessibilityTts content={content} />);
    const file = new File(["파일 첫 문장."], "my-lesson.txt", { type: "text/plain" });
    Object.defineProperty(file, "text", { value: async () => "파일 첫 문장." });
    fireEvent.change(screen.getByLabelText("텍스트 파일 불러오기"), { target: { files: [file] } });
    await screen.findByText("my-lesson.txt");
    fireEvent.click(screen.getByRole("button", { name: "읽기" }));
    expect(ttsMock.speak).toHaveBeenLastCalledWith(expect.objectContaining({ text: "파일 첫 문장." }));
  });
});
