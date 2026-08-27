import { Pause, Play, RotateCcw, SkipBack, SkipForward, Square, Volume2 } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { readLocalTextFile } from "@/lib/localTextFile";
import { speakWithSuperDot, stopSuperDot } from "@/lib/superDotSpeech";
import { DEFAULT_TTS_PREFERENCES, loadTtsPreferences, saveTtsPreferences, type HighlightBackground, type HighlightSize, type HighlightText, type TtsLocale } from "@/lib/ttsPreferences";

type ReadingScope = "site" | "today" | "studio" | "file";
type ReaderLocale = TtsLocale;
type ReaderContent = Record<Exclude<ReadingScope, "file">, Record<ReaderLocale, string>>;

function splitSentences(text: string) {
  return text.match(/[^.!?。！？]+[.!?。！？]*/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [text];
}

export function AccessibilityTts({ content }: { content: ReaderContent }) {
  const [preferences] = useState(loadTtsPreferences);
  const [scope, setScope] = useState<ReadingScope>("site");
  const [locale, setLocale] = useState<ReaderLocale>(preferences.locale);
  const [rate, setRate] = useState(preferences.rate);
  const [pitch, setPitch] = useState(preferences.pitch);
  const [highlightText, setHighlightText] = useState<HighlightText>(preferences.highlightText);
  const [highlightSize, setHighlightSize] = useState<HighlightSize>(preferences.highlightSize);
  const [highlightBackground, setHighlightBackground] = useState<HighlightBackground>(preferences.highlightBackground);
  const [uploadedText, setUploadedText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [status, setStatus] = useState("기기 음성 읽기를 준비했어요.");
  const [playing, setPlaying] = useState(false);
  const [readingSentences, setReadingSentences] = useState<string[]>([]);
  const [sentenceIndex, setSentenceIndex] = useState(-1);
  const speechToken = useRef(0);
  const activeSentence = useRef<HTMLSpanElement | null>(null);
  const selectedText = useMemo(() => scope === "file" ? uploadedText : content[scope][locale], [content, locale, scope, uploadedText]);
  const transcript = readingSentences.length > 0 ? readingSentences : splitSentences(selectedText);

  const stop = (message = "음성 읽기를 멈췄어요.") => {
    speechToken.current += 1;
    stopSuperDot();
    setPlaying(false);
    setSentenceIndex(-1);
    setStatus(message);
  };

  const requestSentence = (sentences: string[], index: number, token: number) => {
    const sentence = sentences[index];
    if (!sentence || token !== speechToken.current) return;
    setSentenceIndex(index);
    setPlaying(true);
    setStatus(`${index + 1}/${sentences.length}번째 문장을 기기에서 선택한 음성으로 읽어요.`);
    const result = speakWithSuperDot({
      text: sentence,
      locale,
      rate,
      pitch,
      onEnd: () => {
        if (token !== speechToken.current) return;
        if (index + 1 < sentences.length) requestSentence(sentences, index + 1, token);
        else { setPlaying(false); setSentenceIndex(-1); setStatus("기기 음성 읽기가 끝났어요."); }
      },
      onError: () => {
        if (token !== speechToken.current) return;
        setPlaying(false);
        setSentenceIndex(-1);
        setStatus("기기 음성 재생에 실패했어요. 화면의 텍스트를 계속 읽어 주세요.");
      },
    });
    if (!result.started) {
      setPlaying(false);
      setSentenceIndex(-1);
      setStatus("이 브라우저에서 기기 음성을 사용할 수 없어요. 화면의 텍스트를 계속 읽어 주세요.");
    }
  };

  const play = (requestedText = selectedText) => {
    if (playing) { stop("음성 읽기를 멈췄어요. 다시 읽기를 누르면 처음부터 시작해요."); return; }
    const sentences = splitSentences(requestedText);
    const token = ++speechToken.current;
    setReadingSentences(sentences);
    requestSentence(sentences, 0, token);
  };

  const moveToSentence = (targetIndex: number) => {
    const sentences = readingSentences.length > 0 ? readingSentences : splitSentences(selectedText);
    if (targetIndex < 0 || targetIndex >= sentences.length) return;
    stopSuperDot();
    const token = ++speechToken.current;
    setReadingSentences(sentences);
    requestSentence(sentences, targetIndex, token);
  };

  const resetPreferences = () => {
    stop(); setReadingSentences([]); setLocale(DEFAULT_TTS_PREFERENCES.locale); setRate(DEFAULT_TTS_PREFERENCES.rate); setPitch(DEFAULT_TTS_PREFERENCES.pitch); setHighlightText(DEFAULT_TTS_PREFERENCES.highlightText); setHighlightSize(DEFAULT_TTS_PREFERENCES.highlightSize); setHighlightBackground(DEFAULT_TTS_PREFERENCES.highlightBackground); setStatus("음성·하이라이트 설정을 기본값으로 되돌렸어요.");
  };

  const applyHighlightPreset = (preset: "light" | "dark" | "large") => {
    if (preset === "light") { setHighlightText("black"); setHighlightSize("large"); setHighlightBackground("contrast"); setStatus("밝은 고대비 프리셋을 적용했어요."); return; }
    if (preset === "dark") { setHighlightText("navy"); setHighlightSize("large"); setHighlightBackground("night"); setStatus("어두운 고대비 프리셋을 적용했어요."); return; }
    setHighlightText("black"); setHighlightSize("xlarge"); setHighlightBackground("contrast"); setStatus("큰 글자 고대비 프리셋을 적용했어요.");
  };

  const loadTextFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    stop(); setReadingSentences([]);
    try { const text = await readLocalTextFile(file); setUploadedText(text); setUploadedFileName(file.name); setScope("file"); setStatus(`${file.name}을(를) 기기에서 불러왔어요. 서버로 전송되지 않아요.`); }
    catch (error) { setStatus(error instanceof Error ? error.message : "텍스트 파일을 불러오지 못했어요."); }
    finally { event.target.value = ""; }
  };

  const playSelection = () => {
    const selection = window.getSelection()?.toString().replace(/\s+/g, " ").trim();
    if (!selection) { setStatus("먼저 화면에서 읽을 문장을 선택해 주세요."); return; }
    play(selection.slice(0, 560));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { const target = event.target; if (target instanceof HTMLElement && target.closest("input, textarea, select, button, a, [contenteditable='true']")) return; if (event.code === "Space") { event.preventDefault(); play(); } if (event.key === "Escape") stop(); };
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  });
  useEffect(() => () => stopSuperDot(), []);
  useEffect(() => { saveTtsPreferences({ locale, rate, pitch, highlightText, highlightSize, highlightBackground }); }, [highlightBackground, highlightSize, highlightText, locale, pitch, rate]);
  useEffect(() => { if (sentenceIndex < 0 || !activeSentence.current) return; const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches; activeSentence.current.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "nearest" }); }, [sentenceIndex]);

  return <aside className="accessibility-tts" aria-label="다국어 접근성 음성 읽기">
    <div className="accessibility-tts__intro"><Volume2 size={18} aria-hidden="true" /><div><b>기기 음성으로 읽기</b><span>설치된 음성 중 가장 적합한 한국어·영어·스페인어 음성을 문장별로 선택해요.</span></div></div>
    <div className="accessibility-tts__controls">
      <label className="accessibility-tts__file">텍스트 파일<input type="file" accept=".txt,text/plain" onChange={loadTextFile} aria-label="텍스트 파일 불러오기" /></label>
      <label>읽을 영역<select value={scope} onChange={(event) => { stop(); setReadingSentences([]); setScope(event.target.value as ReadingScope); }}><option value="site">이 페이지 소개</option><option value="today">오늘의 학습</option><option value="studio">점자 실험실</option>{uploadedText && <option value="file">업로드한 텍스트</option>}</select></label>
      <label>언어<select value={locale} onChange={(event) => { stop(); setReadingSentences([]); setLocale(event.target.value as ReaderLocale); }}><option value="ko-KR">한국어</option><option value="en-US">English</option><option value="es-ES">Español</option></select></label>
      <label>속도<select value={rate} onChange={(event) => { stop(); setRate(Number(event.target.value)); }}><option value={0.85}>0.85×</option><option value={1}>1.0×</option><option value={1.15}>1.15×</option><option value={1.3}>1.3×</option></select></label>
      <label>피치<select value={pitch} onChange={(event) => { stop(); setPitch(Number(event.target.value)); }}><option value={-3}>낮게</option><option value={0}>기본</option><option value={3}>높게</option></select></label>
      <button className="accessibility-tts__play" onClick={() => play()} aria-pressed={playing} aria-keyshortcuts="Space">{playing ? <Pause size={17} /> : <Play size={17} />}{playing ? "멈추기" : "읽기"}</button>
      <button className="accessibility-tts__stop" onClick={() => stop()} aria-keyshortcuts="Escape"><Square size={15} />정지</button><button className="accessibility-tts__selection" onClick={playSelection}>선택한 글 읽기</button>
      <button className="accessibility-tts__sentence-control" onClick={() => moveToSentence(sentenceIndex)} disabled={sentenceIndex < 0} aria-label="현재 문장 다시 듣기"><RotateCcw size={15} />다시 듣기</button><button className="accessibility-tts__sentence-control" onClick={() => moveToSentence(sentenceIndex - 1)} disabled={sentenceIndex <= 0} aria-label="이전 문장"><SkipBack size={15} />이전</button><button className="accessibility-tts__sentence-control" onClick={() => moveToSentence(sentenceIndex + 1)} disabled={sentenceIndex < 0 || sentenceIndex >= transcript.length - 1} aria-label="다음 문장"><SkipForward size={15} />다음</button><button className="accessibility-tts__reset" onClick={resetPreferences}><RotateCcw size={15} />기본값으로 초기화</button>
      <div className="accessibility-tts__presets" aria-label="저시력 하이라이트 프리셋"><span>고대비 빠른 선택</span><button type="button" onClick={() => applyHighlightPreset("light")} aria-pressed={highlightText === "black" && highlightSize === "large" && highlightBackground === "contrast"}>밝은 고대비</button><button type="button" onClick={() => applyHighlightPreset("dark")} aria-pressed={highlightSize === "large" && highlightBackground === "night"}>어두운 고대비</button><button type="button" onClick={() => applyHighlightPreset("large")} aria-pressed={highlightText === "black" && highlightSize === "xlarge" && highlightBackground === "contrast"}>큰 글자 고대비</button></div>
      <label>하이라이트 글자색<select value={highlightText} onChange={(event) => setHighlightText(event.target.value as HighlightText)}><option value="navy">진한 남색</option><option value="black">검정</option><option value="blue">선명한 파랑</option></select></label><label>하이라이트 크기<select value={highlightSize} onChange={(event) => setHighlightSize(event.target.value as HighlightSize)}><option value="normal">기본</option><option value="large">크게</option><option value="xlarge">매우 크게</option></select></label><label>하이라이트 배경<select value={highlightBackground} onChange={(event) => setHighlightBackground(event.target.value as HighlightBackground)}><option value="soft">부드러운 크림</option><option value="contrast">고대비 밝게</option><option value="night">고대비 어둡게</option></select></label>
    </div>
    {uploadedText && <div className="accessibility-tts__file-preview" aria-label="불러온 텍스트 미리보기"><b>{uploadedFileName}</b><p>{uploadedText}</p></div>}
    <div className="accessibility-tts__transcript" data-highlight-text={highlightText} data-highlight-size={highlightSize} data-highlight-background={highlightBackground} aria-label="문장별 읽기 진행"><b>읽는 문장</b><p>{transcript.map((sentence, index) => <span ref={index === sentenceIndex ? activeSentence : undefined} className={index === sentenceIndex ? "is-reading" : ""} key={`${index}-${sentence}`}>{sentence}</span>)}</p></div><p aria-live="polite" className="accessibility-tts__status">{status}</p>
  </aside>;
}
