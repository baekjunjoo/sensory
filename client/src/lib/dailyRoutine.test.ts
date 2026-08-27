import { describe, expect, it } from "vitest";
import { getCurrentStreak, markDotPadFrameSent, markLessonCompleted, markLessonForReview, markLessonOpened, markTactileExplored, type LearningRoutine } from "./dailyRoutine";

const emptyRoutine: LearningRoutine = { openedIds: [], completedIds: [], completedAt: {}, tactileExploredIds: [], dotpadFrameIds: [], reviewIds: [] };

describe("daily learning routine", () => {
  it("records an opened worksheet only once", () => {
    const opened = markLessonOpened(emptyRoutine, "d3");
    expect(markLessonOpened(opened, "d3").openedIds).toEqual(["d3"]);
  });

  it("records a completed worksheet, completion time, DotPad frame and review without duplicates", () => {
    const completed = markLessonCompleted(emptyRoutine, "d3", 1_700_000_000_000);
    const explored = markTactileExplored(completed, "d3");
    const withFrame = markDotPadFrameSent(explored, "d3");
    const reviewed = markLessonForReview(withFrame, "d3");
    expect(reviewed).toMatchObject({
      openedIds: ["d3"],
      completedIds: ["d3"],
      completedAt: { d3: 1_700_000_000_000 },
      tactileExploredIds: ["d3"],
      dotpadFrameIds: ["d3"],
      reviewIds: ["d3"],
    });
    expect(markLessonCompleted(reviewed, "d3", 1_800_000_000_000).completedAt.d3).toBe(1_700_000_000_000);
  });

  it("counts only consecutive worksheets from the first daily sheet", () => {
    expect(getCurrentStreak(["d1", "d2", "d3"], ["d1", "d2", "d3", "d4"])).toBe(3);
    expect(getCurrentStreak(["d1", "d3"], ["d1", "d2", "d3", "d4"])).toBe(1);
    expect(getCurrentStreak(["d2"], ["d1", "d2", "d3", "d4"])).toBe(0);
  });
});
