import { describe, expect, it } from "vitest";
import { friendHeroSceneIndex } from "./dailyContent";

describe("친구별 메인 장면", () => {
  it("각 친구를 유효한 전용 히어로 장면에 연결한다", () => {
    expect(friendHeroSceneIndex).toEqual({
      momo: 0,
      pio: 1,
      lulu: 2,
      nabi: 3,
    });
  });
});
