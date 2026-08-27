// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DotPadConnection } from "./DotPadConnection";

describe("DotPadConnection", () => {
  it("explains the supported browser and disables unavailable transports", () => {
    render(<DotPadConnection dots={[[1, 2, 4, 5]]} lessonLabel="수요일 학습" />);
    expect(screen.getByText(/Chrome 또는 Chromium/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "블루투스 연결" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "USB 연결" })).toHaveProperty("disabled", true);
  });
});
