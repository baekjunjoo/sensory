// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DotPadConnection } from "./DotPadConnection";

describe("DotPadConnection", () => {
  it("explains the supported browser and disables unavailable transports", () => {
    render(<DotPadConnection dots={[[1, 2, 4, 5]]} lessonLabel="수요일 학습" />);
    const supportNote = screen.getByText(/Chrome 또는 Chromium/);
    const bluetoothButton = screen.getByRole("button", { name: "블루투스 연결" });
    const usbButton = screen.getByRole("button", { name: "USB 연결" });
    expect(supportNote).toBeTruthy();
    expect(bluetoothButton).toHaveProperty("disabled", true);
    expect(usbButton).toHaveProperty("disabled", true);
    expect(bluetoothButton.getAttribute("aria-describedby")).toBe("dotpad-support-note");
    expect(usbButton.getAttribute("aria-describedby")).toBe("dotpad-support-note");
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
  });
});
