import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const spacingStyles = readFileSync(
  resolve(process.cwd(), "client/src/headline-spacing.css"),
  "utf8",
);

describe("홈 굵은 제목 자간", () => {
  it("모든 대상 제목에 덮어쓰기 방지용 양수 자간을 적용한다", () => {
    [
      ".hero-copy h1",
      ".section-copy h2",
      ".how-copy h2",
      ".growth-poster p",
      ".ribbon-grid p",
      ".curriculum-header h2",
      ".studio-copy h2",
      ".garden-footer h2",
      ".question-block h3",
    ].forEach((selector) => expect(spacingStyles).toContain(selector));

    expect(spacingStyles).toContain("letter-spacing: 0.04em !important;");
  });
});
