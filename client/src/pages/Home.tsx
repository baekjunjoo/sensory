/* Sensory Garden Print: daily sheets, character-tapped speech feedback, and parent-report-ready local progress. */
import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, BookOpenCheck, ChartNoAxesCombined, Check, ChevronRight, Headphones, House, Menu, PanelsTopLeft, Send, Volume2, VolumeX, X } from "lucide-react";
import { AccessibilityTts } from "@/components/AccessibilityTts";
import { DotPadConnection } from "@/components/DotPadConnection";
import { applyCharacterTheme, characters, dailyLessons, friendHeroSceneIndex, loadCharacterTheme, loadProgress, saveProgress, type CharacterKey, type DailyLesson } from "@/lib/dailyContent";
import { publicAsset } from "@/lib/publicAsset";
import { trpc } from "@/lib/trpc";

type BrailleCell = number[];
const DOT_ORDER = [1, 4, 2, 5, 3, 6];
const WEEK_SCENES = [
  { label: "조개 글자 해변", src: publicAsset("/manus-storage/monday-literacy_de47c94d.png", "monday-literacy.webp") },
  { label: "촉각 우편 만", src: publicAsset("/manus-storage/tuesday-words_fab7d8e3.png", "tuesday-words.webp") },
  { label: "숫자 산호 공방", src: publicAsset("/manus-storage/wednesday-math_691a03b2.png", "wednesday-math.webp") },
  { label: "알파벳 구름 정원", src: publicAsset("/manus-storage/thursday-english_f21b46ab.png", "thursday-english.webp") },
  { label: "입체 지도 모래섬", src: publicAsset("/manus-storage/friday-map_10904ff4.png", "friday-map.webp") },
  { label: "도형 퍼즐 만", src: publicAsset("/manus-storage/saturday-shapes_bf5c583f.png", "saturday-shapes.webp") },
  { label: "별빛 이야기 해안", src: publicAsset("/manus-storage/sunday-story_b794ea20.png", "sunday-story.webp") },
];
const CURRICULUM_CHARACTERS = {
  momo: publicAsset("/manus-storage/momo-literacy-3d_8d992ff3.png", "momo-literacy-3d.webp"),
  pio: publicAsset("/manus-storage/pio-math-3d_1f8bfd2c.png", "pio-math-3d.webp"),
  lulu: publicAsset("/manus-storage/lulu-english-3d_e3740a54.png", "lulu-english-3d.webp"),
  nabi: publicAsset("/manus-storage/nabi-tactile-map-3d_3dba16f2.png", "nabi-tactile-map-3d.webp"),
};
const CURRICULUM_SCENES = {
  momo: WEEK_SCENES[0].src,
  pio: WEEK_SCENES[2].src,
  lulu: WEEK_SCENES[3].src,
  nabi: WEEK_SCENES[4].src,
};
const SPEECH_PROFILES: Record<CharacterKey, { rate: number; pitch: number; volume: number }> = {
  momo: { rate: 0.94, pitch: 1.06, volume: 0.96 },
  pio: { rate: 0.9, pitch: 0.98, volume: 0.94 },
  lulu: { rate: 0.98, pitch: 1.12, volume: 0.96 },
  nabi: { rate: 0.92, pitch: 1.01, volume: 0.95 },
};
function chooseKoreanVoice(voices: SpeechSynthesisVoice[]) {
  const koreanVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("ko"));
  const voiceScore = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase();
    return (name.includes("google") ? 40 : 0) + (name.includes("microsoft") ? 30 : 0) + (name.includes("natural") ? 25 : 0) + (name.includes("sunhi") || name.includes("heami") ? 18 : 0) + (voice.localService ? 4 : 0);
  };
  return koreanVoices.sort((first, second) => voiceScore(second) - voiceScore(first))[0];
}
function localeForBraille(text: string) { return /[가-힣]/.test(text) ? "ko-KR" as const : "en-US" as const; }
function DotGrid({ dots, compact = false }: { dots: BrailleCell; compact?: boolean }) { return <span className={compact ? "cell-small" : "cell-large"} aria-hidden="true">{DOT_ORDER.map((dot) => <i key={dot} className={dots.includes(dot) ? "up" : ""} />)}</span>; }
function ShapeFace({ color = "coral", kind = "round", className = "", character, sparkle = false }: { color?: string; kind?: string; className?: string; character?: CharacterKey; sparkle?: boolean }) { const characterByColor: Record<string, CharacterKey> = { coral: "momo", sky: "pio", pink: "lulu", lime: "nabi", yellow: "lulu", purple: "nabi" }; const identity = character ?? characterByColor[color] ?? "momo"; return <span className={`shape-face sensory-blob character-breathe ${color} ${kind} ${className} ${sparkle ? "eye-sparkle" : ""}`} data-character={identity} aria-hidden="true"><span className="face-eyes"><span className="googly-eye"><i className="googly-pupil" data-googly-pupil /><i className="blink-lid" /></span><span className="googly-eye"><i className="googly-pupil" data-googly-pupil /><i className="blink-lid" /></span></span><span className="cheek cheek-left" /><span className="cheek cheek-right" /><span className="face-mouth" /></span>; }
function PlantFriend({ color = "sky", className = "" }: { color?: string; className?: string }) { return <ShapeFace color={color} kind="arch" className={className} />; }

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [lessonIndex, setLessonIndex] = useState(2);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [theme, setTheme] = useState<CharacterKey>(dailyLessons[2].character);
  const [celebrating, setCelebrating] = useState<CharacterKey | null>(null);
  const [studioText, setStudioText] = useState("센서리");
  const [lessonDots, setLessonDots] = useState<BrailleCell[]>([]);
  const [studioCells, setStudioCells] = useState<BrailleCell[]>([]);
  const [brailleNotice, setBrailleNotice] = useState("Liblouis 표준 점역을 준비하고 있어요.");
  const [heroSceneIndex, setHeroSceneIndex] = useState(2);
  const [previousSceneIndex, setPreviousSceneIndex] = useState<number | null>(null);
  const [scenePhase, setScenePhase] = useState<"idle" | "crossfade">("idle");
  const sceneTimer = useRef<number | null>(null);
  const speechToken = useRef(0);
  const brailleRequest = useRef(0);
  const koreanVoice = useRef<SpeechSynthesisVoice | undefined>(undefined);
  const mobileMenuButton = useRef<HTMLButtonElement | null>(null);
  const mobileNav = useRef<HTMLElement | null>(null);
  const [liveMessage, setLiveMessage] = useState("수요일 학습지가 도착했어요.");
  const lesson = dailyLessons[lessonIndex];
  const scene = WEEK_SCENES[lessonIndex];
  const heroScene = WEEK_SCENES[heroSceneIndex];
  const sharedSceneVariables = { "--toy-island": `url(${publicAsset("/manus-storage/sensory-3d-toy-island_077dd413.png", "sensory-3d-toy-island.webp")})`, "--neon-stage": `url(${publicAsset("/manus-storage/sensory-neon-character-stage_744636b3.png", "sensory-neon-character-stage.webp")})`, "--friend-momo": `url(${CURRICULUM_CHARACTERS.momo})`, "--friend-pio": `url(${CURRICULUM_CHARACTERS.pio})`, "--friend-lulu": `url(${CURRICULUM_CHARACTERS.lulu})`, "--friend-nabi": `url(${CURRICULUM_CHARACTERS.nabi})` } as CSSProperties;
  const pageSceneStyle = { ...sharedSceneVariables, "--daily-scene": `url(${scene.src})` } as CSSProperties;
  const heroSceneStyle = { ...sharedSceneVariables, "--daily-scene": `url(${heroScene.src})`, "--previous-scene": previousSceneIndex === null ? "none" : `url(${WEEK_SCENES[previousSceneIndex].src})` } as CSSProperties;
  const lessonSceneStyle = { ...sharedSceneVariables, "--daily-scene": `url(${scene.src})` } as CSSProperties;
  const character = characters[lesson.character];
  const lessonTranslation = trpc.braille.translate.useMutation();
  const studioTranslation = trpc.braille.translate.useMutation();
  const accessibleContent = useMemo(() => ({
    site: {
      "ko-KR": "Sensory는 닷패드와 함께 매일 새로운 촉각 학습지를 만나는 감각 학습 경험입니다. 오늘의 학습, 학습 정원, 점자 실험실과 보호자 리포트를 이용할 수 있습니다.",
      "en-US": "Sensory is a tactile learning experience with a new daily worksheet for DotPad. You can explore today's activity, the learning garden, the braille studio, and the caregiver report.",
      "es-ES": "Sensory es una experiencia de aprendizaje táctil con una nueva hoja diaria para DotPad. Puedes explorar la actividad de hoy, el jardín de aprendizaje, el laboratorio braille y el informe para cuidadores.",
    },
    today: {
      "ko-KR": `${lesson.weekday}요일 ${lesson.title} 학습입니다. ${lesson.description} 질문은 ${lesson.prompt}입니다. 선택지는 ${lesson.options.join(", ")}입니다.`,
      "en-US": `${lesson.weekday} lesson: ${lesson.subject}. Today's tactile prompt is ${lesson.prompt}.`,
      "es-ES": `Lección del ${lesson.weekday}: ${lesson.subject}. La actividad táctil de hoy es ${lesson.prompt}.`,
    },
    studio: {
      "ko-KR": "점자 실험실입니다. 내 이름이나 좋아하는 단어를 입력하면 Sensory가 점자로 바꿔 닷패드 한 줄에 보여 줍니다.",
      "en-US": "Welcome to the Braille Studio. Type a name or favorite word and Sensory converts it into braille for a DotPad preview.",
      "es-ES": "Bienvenido al laboratorio braille. Escribe un nombre o una palabra favorita y Sensory la convierte a braille para la vista previa de DotPad.",
    },
  }), [lesson]);
  useEffect(() => { const savedTheme = loadCharacterTheme(); setCompleted(loadProgress()); setTheme(savedTheme); setHeroSceneIndex(friendHeroSceneIndex[savedTheme]); return () => { if (sceneTimer.current) window.clearTimeout(sceneTimer.current); }; }, []);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const refreshVoices = () => { koreanVoice.current = chooseKoreanVoice(window.speechSynthesis.getVoices()); };
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
  }, []);
  useEffect(() => { applyCharacterTheme(theme); }, [theme]);
  useEffect(() => {
    if (!mobileOpen) return;
    mobileNav.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      mobileMenuButton.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);
  useEffect(() => {
    let active = true;
    lessonTranslation.mutate({ text: lesson.answer, locale: localeForBraille(lesson.answer) }, {
      onSuccess: (result) => { if (active) setLessonDots(result.cells.slice(0, 12)); },
      onError: () => { if (active) { setLessonDots([]); setBrailleNotice("표준 점역을 불러오지 못했어요. 연결을 확인해 주세요."); } },
    });
    return () => { active = false; };
  }, [lesson.answer]);
  useEffect(() => {
    const text = studioText.trim() || "점자";
    const request = ++brailleRequest.current;
    studioTranslation.mutate({ text, locale: localeForBraille(text) }, {
      onSuccess: (result) => {
        if (request !== brailleRequest.current) return;
        setStudioCells(result.cells.slice(0, 20));
        setBrailleNotice(`${result.engine} ${result.table} 표준 점역 결과예요.`);
        setLiveMessage("Liblouis 표준 점역 결과가 준비됐어요.");
      },
      onError: () => {
        if (request !== brailleRequest.current) return;
        setStudioCells([]);
        setBrailleNotice("표준 점역을 불러오지 못했어요. 연결을 확인해 주세요.");
        setLiveMessage("Liblouis 표준 점역을 불러오지 못했어요. 연결을 확인해 주세요.");
      },
    });
  }, [studioText]);
  const goTo = (id: string) => { setMobileOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const speak = (message: string, fallbackCharacter: CharacterKey = lesson.character) => {
    setLiveMessage(message);
    if (!voiceOn || !("speechSynthesis" in window)) return;
    const matchedCharacter = (Object.keys(characters) as CharacterKey[]).find((key) => [characters[key].greeting, characters[key].correct, characters[key].retry].includes(message)) ?? fallbackCharacter;
    const profile = SPEECH_PROFILES[matchedCharacter];
    const token = ++speechToken.current;
    const pacedMessage = message.replace(/([.!?])\s*/g, "$1 ").replace(/\s{2,}/g, " ").trim();
    window.speechSynthesis.cancel();
    window.setTimeout(() => {
      if (token !== speechToken.current) return;
      const utterance = new SpeechSynthesisUtterance(pacedMessage);
      utterance.lang = "ko-KR";
      utterance.voice = koreanVoice.current ?? null;
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      utterance.volume = profile.volume;
      window.speechSynthesis.speak(utterance);
    }, 38);
  };
  const transitionHeroScene = (index: number) => {
    if (index === heroSceneIndex || scenePhase !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setHeroSceneIndex(index); return; }
    setPreviousSceneIndex(heroSceneIndex);
    setScenePhase("crossfade");
    setHeroSceneIndex(index);
    sceneTimer.current = window.setTimeout(() => { setScenePhase("idle"); setPreviousSceneIndex(null); }, 720);
  };
  const selectLesson = (index: number) => {
    if (index === lessonIndex) return;
    const next = dailyLessons[index];
    const updateLesson = () => { setLessonIndex(index); setSelected(null); setChecked(false); speak(`${next.weekday}요일 ${next.title} 학습지가 열렸어요. ${characters[next.character].greeting}`, next.character); };
    updateLesson();
  };
  const selectFriend = (key: CharacterKey) => { const item = characters[key]; setTheme(key); transitionHeroScene(friendHeroSceneIndex[key]); speak(`${item.name} 친구와 함께해요. ${item.greeting}`, key); };
  const choose = (option: string) => { if (!completed.includes(lesson.id)) { setSelected(option); setChecked(false); speak(`${option}을 골랐어요. 정답을 확인해 보세요.`); } };
  const check = () => { if (!selected) return speak("먼저 답 하나를 골라 보세요."); setChecked(true); if (selected === lesson.answer) { const next = completed.includes(lesson.id) ? completed : [...completed, lesson.id]; setCompleted(next); saveProgress(next); setCelebrating(lesson.character); window.setTimeout(() => setCelebrating(null), 760); speak(characters[lesson.character].correct); } else speak(characters[lesson.character].retry); };
  const isDone = completed.includes(lesson.id);
  return <div className="garden-site" id="top" style={pageSceneStyle}><a className="sr-only" href="#today">오늘의 학습지로 바로가기</a><div className="sr-only" aria-live="polite">{liveMessage}</div>
    <header className="garden-header"><div className="page-width garden-nav-row"><a href="#top" className="garden-brand" aria-label="Sensory 홈"><span>sensory</span></a><nav className="garden-nav" aria-label="주 메뉴"><a href="#today">오늘의 한 장</a><a href="#how">왜 Sensory?</a><a href="#curriculum">학습 정원</a><a href="#studio">점자 실험실</a><a href="/report">보호자 리포트</a></nav><button className="header-action" onClick={() => goTo("today")}>시작하기 <ArrowRight size={15} /></button><button ref={mobileMenuButton} className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"} aria-controls="mobile-navigation" aria-expanded={mobileOpen}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button></div><nav ref={mobileNav} id="mobile-navigation" className="mobile-nav" aria-label="모바일 메뉴" hidden={!mobileOpen}><a href="#today" onClick={() => setMobileOpen(false)}>오늘의 한 장</a><a href="#how" onClick={() => setMobileOpen(false)}>왜 Sensory?</a><a href="#curriculum" onClick={() => setMobileOpen(false)}>학습 정원</a><a href="#studio" onClick={() => setMobileOpen(false)}>점자 실험실</a><a href="/report">보호자 리포트</a></nav></header>
    <main><section className="garden-hero" aria-labelledby="hero-title"><div className={`page-width hero-grid scene-${scenePhase} ${isDone ? "is-complete" : ""}`} style={heroSceneStyle}><span className="scene-fade-layer" aria-hidden="true" /><span className="daylight-layer" aria-hidden="true" /><span className="night-stars" aria-hidden="true"><i /><i /><i /><i /></span><div className="hero-copy"><span className="capsule-label"><i /><i /><i /> TODAY'S SHEET <b>{String(lessonIndex + 1).padStart(2, "0")}</b></span><h1 id="hero-title">매일 한 장,<br /><em>피어나는</em><br />오늘의 공부.</h1><p>오늘의 학습지가 닷패드에 도착해요. 만지고, 듣고, 답을 찾으며 내 감각으로 한 걸음씩 자라요.</p><div className="hero-actions"><button className="ink-button" onClick={() => goTo("today")}>오늘의 학습지 열기 <ArrowRight size={17} /></button><a className="paper-button" href="/report">보호자 리포트 보기</a></div><div className="theme-picker" aria-label="Sensory 친구와 색상 테마 선택"><span>오늘의 친구</span><div>{(Object.keys(characters) as CharacterKey[]).map((key) => { const item = characters[key]; return <button key={key} className={theme === key ? "selected" : ""} onClick={() => selectFriend(key)} aria-pressed={theme === key}><span className="friend-avatar" aria-hidden="true"><ShapeFace color={item.accent} kind={item.shape} character={key} /></span><b>{item.name}</b></button>; })}</div></div><span className="micro-copy">7 DAYS · 7 NEW TACTILE MOMENTS</span></div><div className="hero-garden" aria-label={`${characters[theme].name} 친구의 3D 장면: ${heroScene.label}`}><span className="hero-scene-label" data-testid="hero-scene-label">{isDone ? "SUNSET COMPLETE · " : ""}{characters[theme].name} · {heroScene.label}</span><div className="garden-sun" /><button className="character-tap hero-char one" onClick={() => speak(characters.pio.greeting)} aria-label="피오의 안내 듣기"><ShapeFace color="sky" kind="arch" /></button><button className="character-tap hero-char two" onClick={() => speak(characters.lulu.greeting)} aria-label="루루의 안내 듣기"><ShapeFace color="pink" kind="drop" /></button><button className="character-tap hero-face" onClick={() => speak(characters.momo.greeting)} aria-label="모모의 안내 듣기"><ShapeFace color="coral" kind="round" /></button><div className="hero-pad"><span className="pad-label">THIS WEEK · 7 NEW SHEETS</span><span className="pad-line"><i /><i /><i /><i /><i /><i /><i /></span><span className="pad-line short"><i /><i /><i /><i /></span></div></div></div></section><div className="page-width"><AccessibilityTts content={accessibleContent} /></div>
      <section className="black-ribbon" aria-label="Sensory의 학습 가치"><div className="page-width ribbon-grid"><button className="character-tap ribbon-face" onClick={() => speak(characters.lulu.greeting)} aria-label="루루의 안내 듣기"><ShapeFace color="pink" kind="round" /></button><p>매일 다른<br /><strong>작은 발견</strong>이 와요.</p><span className="ribbon-route"><i />●<i />●<i />●</span><p className="ribbon-small">7일의 학습지가<br />나를 키우니까!</p></div></section>
      <section id="today" className="daily-section" aria-labelledby="today-title"><div className="page-width"><div className="section-copy"><span className="capsule-label"><i /><i /><i /> THIS WEEK'S SHEETS <b>7</b></span><h2 id="today-title">매일 새로운 한 장을<br />손끝에 받아 보세요.</h2><p>월요일부터 일요일까지, 문해·수학·영어·촉각 그림을 번갈아 만나며 매일 다른 감각 경험을 이어가요.</p></div><div className="week-picker" role="tablist" aria-label="7일 학습지 선택">{dailyLessons.map((item, index) => <button key={item.id} role="tab" aria-selected={lessonIndex === index} className={`${lessonIndex === index ? "active" : ""} ${completed.includes(item.id) ? "done" : ""}`} onClick={() => selectLesson(index)} style={{ "--week-scene": `url(${WEEK_SCENES[index].src})` } as CSSProperties}><span>{item.weekday}</span><b>{completed.includes(item.id) ? <Check size={13} /> : String(index + 1)}</b><small>{item.subject}</small></button>)}</div><div className="daily-layout" style={lessonSceneStyle}><aside className={`daily-intro ${lesson.accent}`}><span>{lesson.weekday}요일 · DAY {lessonIndex + 1}</span><small className="daily-scene-label">3D SCENE · {scene.label}</small><button className={`character-tap daily-face ${celebrating === lesson.character ? "celebrate" : ""}`} onClick={() => speak(character.greeting, lesson.character)} aria-label={`${character.name}의 안내 듣기`}><ShapeFace color={character.accent} kind={character.shape} character={lesson.character} sparkle={celebrating === lesson.character} /></button><h3>{lesson.title}</h3><p>{lesson.subject} · 오늘의 감각 미션</p><ol><li className="done"><b>1</b> 새 학습지가 도착했어요</li><li className={selected ? "done" : ""}><b>2</b> 손끝으로 점을 확인해요</li><li className={isDone ? "done" : ""}><b>3</b> 오늘의 “아하!”를 모아요</li></ol><button className="character-message" onClick={() => speak(character.greeting, lesson.character)}><Volume2 size={14} /><span><b>{character.name}</b> {character.role}<small>눌러서 안내 듣기</small></span></button></aside><div className="daily-task"><div className="task-bar"><span><b>{String(lessonIndex + 1).padStart(2, "0")}</b> {lesson.subject.toUpperCase()} · DAILY QUIZ</span><button onClick={() => { const next = !voiceOn; setVoiceOn(next); if (!next && "speechSynthesis" in window) { speechToken.current += 1; window.speechSynthesis.cancel(); } setLiveMessage(next ? "음성 안내를 켰어요." : "음성 안내를 껐어요."); }} aria-pressed={voiceOn}>{voiceOn ? <Volume2 size={15} /> : <VolumeX size={15} />}{voiceOn ? "소리 켜짐" : "소리 꺼짐"}</button></div><div className="question-block"><span>{lessonIndex === 2 ? "COUNT THE DOTS" : "FEEL THE DOTS"}</span><h3>{lesson.prompt}</h3><p>{lesson.description}</p></div><div className="dotpad-preview"><span><small>DOTPAD · TACTILE PREVIEW</small><b>Liblouis 표준 점역 결과</b></span><div className="multi-dot-line">{lessonDots.map((dots, index) => <DotGrid dots={dots} key={`${lesson.id}-${index}`} />)}</div></div><DotPadConnection dots={lessonDots} lessonLabel={`${lesson.weekday}요일 ${lesson.title}`} /><div className="answer-options" role="group" aria-label="답 선택지">{lesson.options.map((option, index) => { const picked = option === selected; const state = checked ? option === lesson.answer ? "correct" : picked ? "wrong" : "" : picked ? "picked" : ""; const colors = ["yellow", "pink", "sky"]; return <button className={`answer-option ${state}`} key={option} onClick={() => choose(option)} disabled={isDone} aria-pressed={picked}><ShapeFace color={colors[index]} kind="mini" /><b>{option}</b></button>; })}</div>{isDone ? <div className="success-note"><span>✦</span><div><b>{character.name}와 오늘의 학습지를 완료했어요.</b><p>{character.correct}</p></div></div> : <div className="answer-footer"><p className={checked ? selected === lesson.answer ? "yes" : "no" : ""}>{checked ? selected === lesson.answer ? "맞았어요. 캐릭터의 응원을 들어 보세요!" : "아직 아니에요. 손끝의 점을 다시 따라가 볼까요?" : "글자를 고른 뒤 정답을 확인해 보세요."}</p>{checked && selected !== lesson.answer ? <button onClick={() => speak(lesson.hint, lesson.character)}><Headphones size={15} />힌트 듣기</button> : <button onClick={check}>정답 확인 <ChevronRight size={15} /></button>}</div>}</div></div></div></section>
      <section id="how" className="how-section" aria-labelledby="how-title"><div className="page-width how-grid"><div className="how-copy"><span className="capsule-label"><i /><i /><i /> WHY SENSORY? <b>?</b></span><h2 id="how-title">보고, 듣고,<br />만지며<br /><em>매일 자라요.</em></h2><p>문제를 풀 때마다 캐릭터가 나에게 맞는 말로 반응하고, 완료 기록은 다음 학습지와 보호자 리포트로 이어집니다.</p><a className="paper-dark-button" href="/report">보호자 리포트 보기 <ArrowRight size={16} /></a></div><div className="growth-poster" style={{ "--card-scene": `url(${CURRICULUM_SCENES.nabi})` } as CSSProperties}><button className="character-tap poster-face featured-character" onClick={() => speak(characters.nabi.greeting)} aria-label="나비의 안내 듣기"><img className="featured-character-image" src={CURRICULUM_CHARACTERS.nabi} alt="촉각 지도를 살피는 나비" /></button><p>TOUCH,<br />THEN GROW!</p></div></div></section>
      <section id="curriculum" className="curriculum-section" aria-labelledby="curriculum-title"><div className="page-width"><div className="curriculum-header"><div><span className="capsule-label"><i /><i /><i /> TACTILE GARDEN <b>04</b></span><h2 id="curriculum-title">7일 동안 만나는<br />작은 학습 정원.</h2></div><p>문해·수학·영어·촉각 그림이 매일의 한 장 안에서 자연스럽게 이어집니다.</p></div><div className="curriculum-grid"><article className="curriculum-card purple" style={{ "--card-scene": `url(${CURRICULUM_SCENES.momo})` } as CSSProperties}><img className="card-character card-character-image" src={CURRICULUM_CHARACTERS.momo} alt="점자 타일을 든 모모" /><span>MON · TUE · SUN</span><h3>점자 문해</h3><p>점자 칸과 친해지고 익숙한 단어를 읽어요.</p></article><article className="curriculum-card yellow" style={{ "--card-scene": `url(${CURRICULUM_SCENES.pio})` } as CSSProperties}><img className="card-character card-character-image" src={CURRICULUM_CHARACTERS.pio} alt="수 세기 블록을 살피는 피오" /><span>WED</span><h3>수학</h3><p>수와 연산의 관계를 손끝으로 세어 봐요.</p></article><article className="curriculum-card pink" style={{ "--card-scene": `url(${CURRICULUM_SCENES.lulu})` } as CSSProperties}><img className="card-character card-character-image" src={CURRICULUM_CHARACTERS.lulu} alt="알파벳 책을 든 루루" /><span>THU</span><h3>영어</h3><p>소리와 철자를 함께 점자로 연결해요.</p></article><article className="curriculum-card lime" style={{ "--card-scene": `url(${CURRICULUM_SCENES.nabi})` } as CSSProperties}><img className="card-character card-character-image" src={CURRICULUM_CHARACTERS.nabi} alt="촉각 지도를 살피는 나비" /><span>FRI · SAT</span><h3>촉각 그림</h3><p>도형과 지도 속 정보를 손끝으로 읽어요.</p></article></div></div></section>
      <section id="studio" className="studio-section" aria-labelledby="studio-title"><div className="page-width studio-grid"><div className="studio-copy"><span className="capsule-label"><i /><i /><i /> BRAILLE LAB <b>+ +</b></span><h2 id="studio-title">내가 쓴 말이<br /><em>점점점</em> 하고<br />올라와요.</h2><p>내 이름이나 좋아하는 단어를 적어 보세요. Sensory가 Liblouis 표준 점역으로 바꿔 닷패드 한 줄에 보여 줍니다.</p><button className="character-tap studio-face" onClick={() => speak(characters.nabi.greeting)} aria-label="나비의 안내 듣기"><ShapeFace color="sky" kind="round" /></button></div><div className="studio-console"><div className="console-title"><span><Send size={15} /> LIVE DOTPAD PREVIEW</span><b>LIBLOUIS</b></div><label className="sr-only" htmlFor="studio-input">점자로 바꿀 한글, 영어, 숫자를 입력</label><div className="console-input"><input id="studio-input" value={studioText} maxLength={20} onChange={(event) => { setStudioText(event.target.value); setLiveMessage("Liblouis 점역 미리보기를 갱신하고 있어요."); }} placeholder="예: 내 이름" /><button onClick={() => speak(studioText || "입력한 글자가 없습니다.")} aria-label="입력한 글자 듣기"><Volume2 size={18} /></button></div><div className="studio-dotpad" aria-label={`${studioText || "점자"} 표준 점역 촉각 미리보기`}>{studioCells.map((cell, index) => <DotGrid compact dots={cell} key={`${index}-${cell.join("-")}`} />)}</div><div className="console-footer"><span>{brailleNotice}</span><button onClick={() => { setStudioText("센서리"); speak("센서리 예시로 되돌렸어요."); }}>예시로 돌아가기 <ChevronRight size={14} /></button></div></div></div></section></main>
    <nav className="mobile-dock" aria-label="모바일 빠른 탐색"><a href="#top"><House size={18} /><span>홈</span></a><button onClick={() => goTo("today")}><BookOpenCheck size={18} /><span>학습</span></button><button onClick={() => goTo("studio")}><PanelsTopLeft size={18} /><span>점자</span></button><a href="/report"><ChartNoAxesCombined size={18} /><span>리포트</span></a></nav>
    <footer className="garden-footer"><div className="page-width footer-row"><div><span className="capsule-label"><i /><i /><i /> SEE YOU TOMORROW <b>✦</b></span><h2>내일도<br />새로운 한 장을 만나.</h2></div><button className="character-tap footer-plant" onClick={() => speak(characters.lulu.greeting)} aria-label="루루의 안내 듣기"><PlantFriend color="pink" /></button><a className="footer-button" href="/report">보호자 리포트 보기 <ArrowRight size={16} /></a></div><div className="page-width footer-bottom"><span className="garden-brand"><b>sensory</b></span><span>닷패드 연동 촉각 학습 경험 컨셉 데모</span></div></footer></div>;
}
