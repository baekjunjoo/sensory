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
  site: { "ko-KR": "센서리 소개", "en-US": "Sensory introduction" },
  today: { "ko-KR": "오늘의 학습", "en-US": "Today's lesson" },
  studio: { "ko-KR": "점자 실험실", "en-US": "Braille studio" },
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
});
