import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.resolve(import.meta.dirname, "../studio-inquiry.css"), "utf8");
const accessibilityCss = fs.readFileSync(path.resolve(import.meta.dirname, "../accessibility-aa.css"), "utf8");

describe("하단 문의 마감 레이아웃", () => {
  it("데스크톱과 모바일의 내일 안내에 화면 가장자리 안전 여백을 둔다", () => {
    expect(css).toContain("box-sizing: border-box");
    expect(css).toContain("padding: 0 clamp(24px, 5vw, 64px) 28px !important");
    expect(css).toContain("padding: 0 21px 24px !important");
    expect(accessibilityCss).not.toContain(".studio-section .studio-copy,\n.garden-footer .footer-row");
  });
});
