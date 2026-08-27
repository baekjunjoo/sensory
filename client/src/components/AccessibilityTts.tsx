import { Pause, Play, Square, Volume2 } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { attachPiperAudioErrorFallback, runBrowserSpeechFallback } from "@/lib/browserSpeech";

type ReadingScope = "site" | "today" | "studio";
type ReaderLocale = "ko-KR" | "en-US" | "es-ES";
type ReaderContent = Record<ReadingScope, Record<ReaderLocale, string>>;

function decodeAudio(base64: string) {
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
}

function splitSentences(text: string) {
  return text.match(/[^.!?。！？]+[.!?。！？]*/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [text];
}

function effectivePlaybackRate(rate: number, pitch: number) {
  return Math.max(0.7, Math.min(1.5, rate * 2 ** (pitch / 12)));
}

export function AccessibilityTts({ content }: { content: ReaderContent }) {
  const [scope, setScope] = useState<ReadingScope>("site");
  const [locale, setLocale] = useState<ReaderLocale>("ko-KR");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [status, setStatus] = useState("접근성 음성 읽기를 준비했어요.");
  const [playing, setPlaying] = useState(false);
  const [readingSentences, setReadingSentences] = useState<string[]>([]);
  const [sentenceIndex, setSentenceIndex] = useState(-1);
  const audio = useRef<HTMLAudioElement | null>(null);
  const objectUrl = useRef<string | null>(null);
  const speechToken = useRef(0);
  const selectedText = useMemo(() => content[scope][locale], [content, locale, scope]);
  const transcript = readingSentences.length > 0 ? readingSentences : splitSentences(selectedText);
  const tts = trpc.accessibilityTts.synthesize.useMutation();

  const stop = () => {
    speechToken.current += 1;
    audio.current?.pause();
    audio.current = null;
    window.speechSynthesis?.cancel();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    setPlaying(false);
    setSentenceIndex(-1);
    setStatus("음성 읽기를 멈췄어요.");
  };

  const browserFallback = (text: string) => {
    const fallback = runBrowserSpeechFallback({
      driver: {
        supported: typeof window.speechSynthesis !== "undefined",
        createUtterance: () => new SpeechSynthesisUtterance(text) as unknown as { lang: string; rate: number; pitch: number; onend: (() => void) | null },
        speak: (utterance) => window.speechSynthesis.speak(utterance as SpeechSynthesisUtterance),
      },
      text,
      locale,
      rate,
      pitch: Math.max(0.5, Math.min(2, 1 + pitch / 12)),
      onEnd: () => { setPlaying(false); setSentenceIndex(-1); setStatus("브라우저 음성 읽기가 끝났어요."); },
    });
    setPlaying(fallback.playing);
    setStatus(fallback.status);
  };

  const requestSentence = (sentences: string[], index: number, token: number) => {
    const sentence = sentences[index];
    if (!sentence || token !== speechToken.current) return;
    setSentenceIndex(index);
    setStatus(`${index + 1}/${sentences.length}번째 문장을 자연 음성으로 준비해요.`);
    tts.mutate({ text: sentence, locale, rate: 1 }, {
      onSuccess: ({ audioBase64, cache }) => {
        if (token !== speechToken.current) return;
        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
        objectUrl.current = decodeAudio(audioBase64);
        const player = new Audio(objectUrl.current);
        player.playbackRate = effectivePlaybackRate(rate, pitch);
        player.preservesPitch = false;
        player.onended = () => {
          if (token !== speechToken.current) return;
          if (index + 1 < sentences.length) requestSentence(sentences, index + 1, token);
          else { setPlaying(false); setSentenceIndex(-1); setStatus("음성 읽기가 끝났어요."); }
        };
        attachPiperAudioErrorFallback(player as unknown as { onerror: (() => void) | null }, () => browserFallback(sentence));
        audio.current = player;
        void player.play();
        setPlaying(true);
        setStatus(cache === "hit" ? `${index + 1}/${sentences.length}번째 문장을 바로 재생해요.` : `${index + 1}/${sentences.length}번째 문장을 자연 음성으로 읽어요.`);
      },
      onError: () => browserFallback(sentence),
    });
  };

  const play = (requestedText = selectedText) => {
    if (audio.current && !audio.current.paused) {
      audio.current.pause();
      setPlaying(false);
      setStatus("음성 읽기를 일시정지했어요.");
      return;
    }
    if (audio.current?.paused) {
      void audio.current.play();
      setPlaying(true);
      setStatus("음성 읽기를 이어서 재생해요.");
      return;
    }
    const sentences = splitSentences(requestedText);
    const token = ++speechToken.current;
    setReadingSentences(sentences);
    requestSentence(sentences, 0, token);
  };

  const playSelection = () => {
    const selection = window.getSelection()?.toString().replace(/\s+/g, " ").trim();
    if (!selection) {
      setStatus("먼저 화면에서 읽을 문장을 선택해 주세요.");
      return;
    }
    play(selection.slice(0, 560));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, button, a, [contenteditable='true']")) return;
      if (event.code === "Space") { event.preventDefault(); play(); }
      if (event.key === "Escape") stop();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => () => {
    audio.current?.pause();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  return <aside className="accessibility-tts" aria-label="다국어 접근성 음성 읽기">
    <div className="accessibility-tts__intro"><Volume2 size={18} aria-hidden="true" /><div><b>자연 음성으로 읽기</b><span>한국어·영어·스페인어 안내를 문장별로 들을 수 있어요.</span></div></div>
    <div className="accessibility-tts__controls">
      <label>읽을 영역<select value={scope} onChange={(event) => { stop(); setReadingSentences([]); setScope(event.target.value as ReadingScope); }}><option value="site">이 페이지 소개</option><option value="today">오늘의 학습</option><option value="studio">점자 실험실</option></select></label>
      <label>언어<select value={locale} onChange={(event) => { stop(); setReadingSentences([]); setLocale(event.target.value as ReaderLocale); }}><option value="ko-KR">한국어</option><option value="en-US">English</option><option value="es-ES">Español</option></select></label>
      <label>속도<select value={rate} onChange={(event) => { stop(); setRate(Number(event.target.value)); }}><option value={0.85}>0.85×</option><option value={1}>1.0×</option><option value={1.15}>1.15×</option><option value={1.3}>1.3×</option></select></label>
      <label>피치<select value={pitch} onChange={(event) => { stop(); setPitch(Number(event.target.value)); }}><option value={-3}>낮게</option><option value={0}>기본</option><option value={3}>높게</option></select></label>
      <button className="accessibility-tts__play" onClick={() => play()} aria-pressed={playing} aria-keyshortcuts="Space">{playing ? <Pause size={17} /> : <Play size={17} />}{playing ? "일시정지" : "읽기"}</button>
      <button className="accessibility-tts__stop" onClick={stop} aria-keyshortcuts="Escape"><Square size={15} />정지</button>
      <button className="accessibility-tts__selection" onClick={playSelection}>선택한 글 읽기</button>
    </div>
    <div className="accessibility-tts__transcript" aria-label="문장별 읽기 진행"><b>읽는 문장</b><p>{transcript.map((sentence, index) => <span className={index === sentenceIndex ? "is-reading" : ""} key={`${index}-${sentence}`}>{sentence}</span>)}</p></div>
    <p aria-live="polite" className="accessibility-tts__status">{status}</p>
  </aside>;
}
