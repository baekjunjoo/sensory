// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessibilityTts } from "./AccessibilityTts";

const mutate = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    accessibilityTts: {
      synthesize: {
        useMutation: () => ({ mutate }),
      },
    },
  },
}));

class FakeAudio {
  paused = false;
  playbackRate = 1;
  onended: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
}

const content = {
  site: { "ko-KR": "센서리 소개. 매일 한 장을 읽어요.", "en-US": "Sensory introduction.", "es-ES": "Introducción a Sensory." },
  today: { "ko-KR": "오늘의 학습", "en-US": "Today's lesson", "es-ES": "La lección de hoy" },
  studio: { "ko-KR": "점자 실험실", "en-US": "Braille studio", "es-ES": "Laboratorio braille" },
};

describe("AccessibilityTts fallback status", () => {
  let player: FakeAudio;

  beforeEach(() => {
    mutate.mockReset();
    vi.stubGlobal("Audio", class extends FakeAudio {
      constructor() {
        super();
        player = this;
      }
    });
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:tts"), revokeObjectURL: vi.fn() });
    vi.stubGlobal("SpeechSynthesisUtterance", class { lang = ""; rate = 1; onend: (() => void) | null = null; });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speak: vi.fn(), cancel: vi.fn() } });
    mutate.mockImplementation((_input, handlers) => handlers.onSuccess({ audioBase64: "UklGRg==", cache: "miss" }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, "speechSynthesis");
  });

  it("shows the browser-voice status after Piper audio playback errors", async () => {
    render(<AccessibilityTts content={content} />);
    fireEvent.click(screen.getByRole("button", { name: "읽기" }));

    await act(async () => { player.onerror?.(new Event("error")); });
    expect(screen.getByText("Piper 연결을 기다리는 동안 브라우저 음성으로 읽고 있어요.")).toBeTruthy();
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it("shows the text-only guidance when browser speech is unavailable", async () => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
    render(<AccessibilityTts content={content} />);
    fireEvent.click(screen.getByRole("button", { name: "읽기" }));

    await act(async () => { player.onerror?.(new Event("error")); });
    expect(screen.getByText("자연 음성과 브라우저 음성을 사용할 수 없어요. 화면의 텍스트를 계속 읽어 주세요.")).toBeTruthy();
  });

  it("exposes a live status and labelled controls while supporting Space and Escape shortcuts", async () => {
    render(<AccessibilityTts content={content} />);
    const reader = screen.getByLabelText("다국어 접근성 음성 읽기");
    const liveStatus = reader.querySelector("[aria-live='polite']");

    expect(liveStatus).toBeTruthy();
    expect(screen.getByRole("button", { name: "읽기" }).getAttribute("aria-keyshortcuts")).toBe("Space");
    expect(screen.getByRole("button", { name: "정지" }).getAttribute("aria-keyshortcuts")).toBe("Escape");

    fireEvent.keyDown(window, { code: "Space" });
    expect(mutate).toHaveBeenCalledTimes(1);
    await act(async () => { fireEvent.keyDown(window, { key: "Escape" }); });
    expect(screen.getByText("음성 읽기를 멈췄어요.")).toBeTruthy();
  });

  it("plays Piper audio first and does not call browser speech when synthesis succeeds", () => {
    render(<AccessibilityTts content={content} />);
    fireEvent.click(screen.getByRole("button", { name: "읽기" }));

    expect(player.play).toHaveBeenCalledTimes(1);
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    expect(screen.getByText("1/2번째 문장을 자연 음성으로 읽어요.")).toBeTruthy();
  });

  it("exposes Spanish and pitch controls while highlighting the active sentence", () => {
    render(<AccessibilityTts content={content} />);
    expect(screen.getByRole("option", { name: "Español" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "낮게" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "읽기" }));
    expect(screen.getByText("센서리 소개.").className).toContain("is-reading");
  });

  it("applies user-selected speed and pitch to Piper audio playback", () => {
    render(<AccessibilityTts content={content} />);
    fireEvent.change(screen.getByLabelText("속도"), { target: { value: "1.15" } });
    fireEvent.change(screen.getByLabelText("피치"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "읽기" }));

    expect(player.playbackRate).toBeCloseTo(1.15 * 2 ** (3 / 12));
  });

  it("retries a cold Piper server before using browser speech", async () => {
    vi.useFakeTimers();
    mutate.mockReset();
    mutate.mockImplementation((_input, handlers) => handlers.onError());
    render(<AccessibilityTts content={content} />);

    fireEvent.click(screen.getByRole("button", { name: "읽기" }));
    expect(screen.getByText("자연 음성 서버에 연결하고 있어요. 1번째로 다시 시도할게요.")).toBeTruthy();
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();

    await act(async () => { vi.advanceTimersByTime(800); });
    expect(mutate).toHaveBeenCalledTimes(2);
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1200); });
    expect(mutate).toHaveBeenCalledTimes(3);
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1800); });
    expect(mutate).toHaveBeenCalledTimes(4);
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("uses Piper after a retry succeeds without starting browser speech", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    mutate.mockReset();
    mutate.mockImplementation((_input, handlers) => {
      attempts += 1;
      if (attempts === 1) handlers.onError();
      else handlers.onSuccess({ audioBase64: "UklGRg==", cache: "miss" });
    });
    render(<AccessibilityTts content={content} />);

    fireEvent.click(screen.getByRole("button", { name: "읽기" }));
    await act(async () => { vi.advanceTimersByTime(800); });

    expect(mutate).toHaveBeenCalledTimes(2);
    expect(player.play).toHaveBeenCalledTimes(1);
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    expect(screen.getByText("1/2번째 문장을 자연 음성으로 읽어요.")).toBeTruthy();
    vi.useRealTimers();
  });

  it("cancels a pending Piper retry when the reader is stopped", async () => {
    vi.useFakeTimers();
    mutate.mockReset();
    mutate.mockImplementation((_input, handlers) => handlers.onError());
    render(<AccessibilityTts content={content} />);

    fireEvent.click(screen.getByRole("button", { name: "읽기" }));
    fireEvent.click(screen.getByRole("button", { name: "정지" }));
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
