import { loadProgress, saveProgress } from "@/lib/dailyContent";

export type LearningRoutine = {
  openedIds: string[];
  completedIds: string[];
  completedAt: Record<string, number>;
  tactileExploredIds: string[];
  dotpadFrameIds: string[];
  reviewIds: string[];
};

const ROUTINE_KEY = "sensory-daily-routine";

const unique = (items: string[]) => Array.from(new Set(items));

export function loadLearningRoutine(): LearningRoutine {
  const fallback = loadProgress();
  try {
    const saved = localStorage.getItem(ROUTINE_KEY);
    if (!saved) {
      return { openedIds: fallback, completedIds: fallback, completedAt: {}, tactileExploredIds: [], dotpadFrameIds: [], reviewIds: [] };
    }
    const parsed = JSON.parse(saved) as Partial<LearningRoutine>;
    const completedIds = unique([...(parsed.completedIds ?? []), ...fallback]);
    return {
      openedIds: unique([...(parsed.openedIds ?? []), ...completedIds]),
      completedIds,
      completedAt: parsed.completedAt ?? {},
      tactileExploredIds: unique(parsed.tactileExploredIds ?? []),
      dotpadFrameIds: unique(parsed.dotpadFrameIds ?? []),
      reviewIds: unique(parsed.reviewIds ?? []),
    };
  } catch {
    return { openedIds: fallback, completedIds: fallback, completedAt: {}, tactileExploredIds: [], dotpadFrameIds: [], reviewIds: [] };
  }
}

export function saveLearningRoutine(routine: LearningRoutine) {
  try { localStorage.setItem(ROUTINE_KEY, JSON.stringify(routine)); } catch { /* Privacy mode keeps the session state only. */ }
  saveProgress(routine.completedIds);
}

export function markLessonOpened(routine: LearningRoutine, lessonId: string): LearningRoutine {
  return { ...routine, openedIds: unique([...routine.openedIds, lessonId]) };
}

export function markLessonCompleted(routine: LearningRoutine, lessonId: string, timestamp = Date.now()): LearningRoutine {
  return {
    ...routine,
    openedIds: unique([...routine.openedIds, lessonId]),
    completedIds: unique([...routine.completedIds, lessonId]),
    completedAt: routine.completedAt[lessonId] ? routine.completedAt : { ...routine.completedAt, [lessonId]: timestamp },
  };
}

export function markDotPadFrameSent(routine: LearningRoutine, lessonId: string): LearningRoutine {
  return { ...routine, tactileExploredIds: unique([...routine.tactileExploredIds, lessonId]), dotpadFrameIds: unique([...routine.dotpadFrameIds, lessonId]) };
}

export function markTactileExplored(routine: LearningRoutine, lessonId: string): LearningRoutine {
  return { ...routine, tactileExploredIds: unique([...routine.tactileExploredIds, lessonId]) };
}

export function markLessonForReview(routine: LearningRoutine, lessonId: string): LearningRoutine {
  return { ...routine, reviewIds: unique([...routine.reviewIds, lessonId]) };
}

export function getCurrentStreak(completedIds: string[], orderedLessonIds: string[]) {
  let streak = 0;
  for (const lessonId of orderedLessonIds) {
    if (!completedIds.includes(lessonId)) break;
    streak += 1;
  }
  return streak;
}
