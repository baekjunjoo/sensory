export type CharacterKey = "momo" | "pio" | "lulu" | "nabi";

export const CHARACTER_THEME_KEY = "sensory-character-theme";

export type DailyLesson = {
  id: string;
  weekday: string;
  title: string;
  subject: "점자 문해" | "수학" | "영어" | "촉각 그림";
  accent: "coral" | "sky" | "pink" | "lime" | "yellow" | "purple";
  prompt: string;
  description: string;
  answer: string;
  options: string[];
  hint: string;
  character: CharacterKey;
};

export const characters: Record<CharacterKey, { name: string; role: string; accent: string; shape: "round" | "arch" | "drop" | "triangle"; greeting: string; correct: string; retry: string }> = {
  momo: { name: "모모", role: "용기 담당", accent: "coral", shape: "round", greeting: "안녕! 나는 모모야. 오늘의 점을 먼저 만져 볼까?", correct: "짜잔! 손끝이 정답을 찾았어. 오늘의 점이 반짝 올라왔어!", retry: "괜찮아. 모모와 함께 한 점씩 다시 따라가 보자." },
  pio: { name: "피오", role: "탐험 담당", accent: "sky", shape: "arch", greeting: "피오가 길을 밝혀 줄게. 손끝으로 천천히 탐험해 봐!", correct: "좋아! 손끝이 길을 정확히 찾았어. 피오가 박수 짝짝!", retry: "앗, 아직은 아니야. 위쪽부터 다시 만져 보자." },
  lulu: { name: "루루", role: "응원 담당", accent: "pink", shape: "drop", greeting: "루루랑 천천히 해 보자. 서두르지 않아도 괜찮아!", correct: "와, 맞았어! 루루의 볼처럼 자신감이 활짝 피었어!", retry: "살짝 헷갈렸구나. 루루가 힌트를 들려줄게." },
  nabi: { name: "나비", role: "호기심 담당", accent: "lime", shape: "triangle", greeting: "새로운 모양을 찾는 시간이야. 나비를 따라 손끝을 움직여 봐!", correct: "정답! 오늘의 발견을 나비가 기록해 뒀어!", retry: "좋은 시도야. 점 사이의 간격을 다시 느껴 볼까?" },
};

export function loadCharacterTheme(): CharacterKey {
  try { const saved = localStorage.getItem(CHARACTER_THEME_KEY); return saved && saved in characters ? saved as CharacterKey : "momo"; } catch { return "momo"; }
}

export function applyCharacterTheme(theme: CharacterKey) {
  document.documentElement.dataset.sensoryTheme = theme;
  try { localStorage.setItem(CHARACTER_THEME_KEY, theme); } catch { /* Browser privacy mode keeps the visual selection in memory. */ }
}

export const dailyLessons: DailyLesson[] = [
  { id: "d1", weekday: "월", title: "첫 글자 찾기", subject: "점자 문해", accent: "coral", prompt: "닷패드 위 점자를 만져 보고, 알맞은 글자를 골라 보세요.", description: "점 하나하나의 자리를 느끼며 읽기의 첫 감각을 만들어요.", answer: "바", options: ["바", "다", "마"], hint: "왼쪽 윗점과 오른쪽 가운데·아랫점의 위치를 천천히 확인해 보세요.", character: "momo" },
  { id: "d2", weekday: "화", title: "점자 두 칸", subject: "점자 문해", accent: "sky", prompt: "이어진 두 칸의 점자를 읽고, 알맞은 글자를 골라 보세요.", description: "한 칸씩 읽은 다음, 두 점자 칸의 흐름을 연결해요.", answer: "가", options: ["가", "나", "다"], hint: "첫 칸의 왼쪽 위 점과 마지막 칸의 아래 점을 순서대로 느껴 보세요.", character: "pio" },
  { id: "d3", weekday: "수", title: "촉각 덧셈", subject: "수학", accent: "yellow", prompt: "닷패드 위에 올라온 3과 2를 더하면 얼마일까요?", description: "수와 수를 만져 보고, 답을 손끝의 리듬으로 찾아요.", answer: "5", options: ["5", "4", "6"], hint: "3에서 두 칸을 더 앞으로 세어 보세요.", character: "lulu" },
  { id: "d4", weekday: "목", title: "첫 영어 점자", subject: "영어", accent: "pink", prompt: "영어 점자 C를 만져 보고, 알맞은 알파벳을 골라 보세요.", description: "소리와 글자, 점자의 모양을 한 번에 연결해요.", answer: "C", options: ["C", "B", "D"], hint: "왼쪽 위 점과 오른쪽 위 점이 함께 올라왔는지 확인해 보세요.", character: "nabi" },
  { id: "d5", weekday: "금", title: "네 꼭짓점", subject: "촉각 그림", accent: "purple", prompt: "닷패드의 네 모서리를 만져 보고, 도형의 이름을 골라 보세요.", description: "촉각 그림 속 모양과 이름을 이어 보는 시간이예요.", answer: "사각형", options: ["사각형", "삼각형", "원"], hint: "끝점이 네 번 만나면 어떤 모양이 될까요?", character: "momo" },
  { id: "d6", weekday: "토", title: "위쪽 길 찾기", subject: "촉각 그림", accent: "lime", prompt: "점선 길을 따라 위쪽으로 가면 만나는 방향을 골라 보세요.", description: "지도와 방향을 손끝의 선으로 알아가요.", answer: "위", options: ["위", "아래", "오른쪽"], hint: "점선이 시작한 곳보다 높은 쪽을 찾아 보세요.", character: "pio" },
  { id: "d7", weekday: "일", title: "내 이름의 점", subject: "점자 문해", accent: "coral", prompt: "이번 주에 익힌 점으로, 오늘의 단어를 골라 보세요.", description: "익숙한 단어를 점자로 읽으며 한 주를 마무리해요.", answer: "센서리", options: ["센서리", "점자", "소리"], hint: "처음의 두 점자 칸을 천천히 연결해 보세요.", character: "lulu" },
];

export const PROGRESS_KEY = "sensory-demo-week-progress";
export const DEFAULT_COMPLETED = ["d1", "d2"];

export function loadProgress(): string[] {
  try { const stored = localStorage.getItem(PROGRESS_KEY); return stored ? JSON.parse(stored) : DEFAULT_COMPLETED; } catch { return DEFAULT_COMPLETED; }
}

export function saveProgress(days: string[]) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(days)); }
