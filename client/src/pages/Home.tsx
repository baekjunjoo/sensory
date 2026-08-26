/* Playful Sensory Shapes: original bold geometric characters, primary-color contrast, and tactile dots as the shared learning language. */
import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronRight, Headphones, Menu, PenLine, Send, Sparkles, Volume2, VolumeX, X, Zap } from "lucide-react";

type BrailleCell = number[];

declare global {
  interface Window {
    KB?: { brailleCells: (text: string) => BrailleCell[]; toUnicodeBraille: (text: string) => string };
  }
}

const ASSETS = {
  hero: "/manus-storage/sensory-shapes-hero_0547a39e.jpg",
  dotpad: "/manus-storage/sensory-shapes-dotpad_36d76221.jpg",
  path: "/manus-storage/sensory-shapes-path_0218e6e0.jpg",
  stickers: "/manus-storage/sensory-shape-stickers_a2114a67.png",
  logo: "/manus-storage/sensory-shapes-mark_9fe4b055.png",
};

const FALLBACK_CELLS: Record<string, BrailleCell[]> = { "바": [[1, 2, 4, 5]], "다": [[1, 4, 5]], "마": [[1, 3, 4]], "센서리": [[2, 3, 4], [1, 2, 3, 5], [2, 3, 4], [1, 2, 3, 5], [2, 4]] };
const DEFAULT_TEXT = "센서리";
const DOT_ORDER = [1, 4, 2, 5, 3, 6];

function getCells(text: string): BrailleCell[] {
  if (typeof window !== "undefined" && window.KB) return window.KB.brailleCells(text);
  return FALLBACK_CELLS[text] ?? text.slice(0, 8).split("").map((_, index) => [1, 2 + (index % 3)]);
}
function toBraille(text: string) {
  if (typeof window !== "undefined" && window.KB) return window.KB.toUnicodeBraille(text);
  return getCells(text).map((dots) => String.fromCodePoint(0x2800 + dots.reduce((value, dot) => value | (1 << (dot - 1)), 0))).join("");
}
function Dots({ dots, compact = false }: { dots: BrailleCell; compact?: boolean }) {
  return <span className={compact ? "small-dot-cell" : "big-dot-cell"} aria-hidden="true">{DOT_ORDER.map((dot) => <i key={dot} className={dots.includes(dot) ? "up" : ""} />)}</span>;
}

const lesson = { answer: "바", options: ["바", "다", "마"], prompt: "닷패드 위 점자를 만져 보고, 알맞은 글자를 골라 보세요.", hint: "왼쪽 윗점과 오른쪽 가운데·아랫점의 위치를 천천히 확인해 보세요." };

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [studioText, setStudioText] = useState(DEFAULT_TEXT);
  const [liveMessage, setLiveMessage] = useState("오늘의 촉각 학습지가 도착했어요.");
  const lessonDots = useMemo(() => getCells(lesson.answer)[0] ?? [], []);
  const studioCells = useMemo(() => getCells(studioText || "점자").slice(0, 14), [studioText]);

  const speak = (message: string) => {
    setLiveMessage(message);
    if (voiceOn && "speechSynthesis" in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(message); utterance.lang = "ko-KR"; utterance.rate = 1.02; window.speechSynthesis.speak(utterance); }
  };
  const goTo = (id: string) => { setMobileOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const choose = (option: string) => { if (!completed) { setSelected(option); setChecked(false); speak(`${option}을 골랐어요. 이제 정답을 확인해 보세요.`); } };
  const check = () => {
    if (!selected) return speak("먼저 글자 하나를 골라 보세요.");
    setChecked(true);
    if (selected === lesson.answer) { setCompleted(true); speak("맞았어요! 바가 닷패드에 또렷하게 올라왔어요. 오늘의 첫 문제를 완료했어요."); }
    else speak("조금 아쉬워요. 힌트를 듣고 손끝의 점을 다시 확인해 보세요.");
  };

  return <div className="shape-site" id="top">
    <a href="#today" className="sr-only">오늘의 학습지로 바로가기</a><div className="sr-only" aria-live="polite">{liveMessage}</div>
    <header className="shape-header">
      <div className="shell nav-row">
        <a href="#top" className="shape-brand" aria-label="Sensory 홈"><img src={ASSETS.logo} alt="" /><span>sen<span>so</span>ry</span><small>TOUCH! LEARN! WOW!</small></a>
        <nav className="shape-nav" aria-label="주 메뉴"><a href="#today">오늘의 한 장</a><a href="#how">왜 Sensory?</a><a href="#curriculum">학습 놀이터</a><a href="#studio">점자 실험실</a></nav>
        <button className="nav-bubble" onClick={() => goTo("today")}>시작! <ArrowRight size={15} /></button>
        <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="메뉴 열기" aria-expanded={mobileOpen}>{mobileOpen ? <X /> : <Menu />}</button>
      </div>
      <nav className="mobile-shape-nav" aria-label="모바일 메뉴" hidden={!mobileOpen}><a href="#today" onClick={() => setMobileOpen(false)}>오늘의 한 장</a><a href="#how" onClick={() => setMobileOpen(false)}>왜 Sensory?</a><a href="#curriculum" onClick={() => setMobileOpen(false)}>학습 놀이터</a><a href="#studio" onClick={() => setMobileOpen(false)}>점자 실험실</a></nav>
    </header>

    <main>
      <section className="shape-hero" aria-labelledby="hero-title">
        <div className="shell hero-shape-grid">
          <div className="hero-shape-copy"><span className="sticker-label"><i />SENSORY DAILY! <b>●●</b></span><h1 id="hero-title">손끝이<br /><em>“아하!”</em> 하는<br />매일의 공부.</h1><p>오늘의 학습지가 닷패드에 통통 도착해요. 만지고, 듣고, 맞혀 보면서 내 감각으로 한 걸음씩 배워요.</p><div className="shape-actions"><button className="black-action" onClick={() => goTo("today")}>오늘의 학습지 열기 <ArrowRight size={18} /></button><button className="outline-action" onClick={() => goTo("how")}>어떻게 배우나요?</button></div><div className="hero-strap"><span>⠿</span> 10 MINUTES A DAY <i /> TOUCH · LISTEN · SMILE</div></div>
          <figure className="hero-shape-art"><img src={ASSETS.hero} alt="닷패드와 보라, 노랑, 빨강 감정 도형 캐릭터가 함께 있는 촉각 학습 장면" /><span className="giggle-glyph glyph-one">●<i /></span><span className="giggle-glyph glyph-two">●<i /></span><figcaption>DOTPAD READY! <b>● ● ●</b></figcaption></figure>
        </div>
      </section>

      <section className="fun-banner" aria-label="Sensory 학습 방식"><div className="shell fun-banner-grid"><div className="fun-face purple-face"><i /><i /><b /></div><p>공부가<br /><strong>재미있게</strong><br />느껴지는 이유는?</p><div className="fun-dot-route"><span>●</span><i /><span>●</span><i /><span>●</span></div><p className="fun-small">내 손끝이<br />바로 반응하니까!</p></div></section>

      <section id="today" className="today-shapes" aria-labelledby="today-title">
        <div className="shell"><div className="shape-section-head"><span className="sticker-label"><i />TODAY'S SHEET <b>01</b></span><h2 id="today-title">오늘의 한 장이<br />도착했어요! <span>✦</span></h2><p>하나의 문제부터 가볍게 시작해요. 닷패드에서 올라온 점을 느끼고, 맞는 글자를 골라 보세요.</p></div>
          <div className="daily-shape-board">
            <aside className="delivery-side"><span className="side-date">TUE 08/26</span><div className="red-shape-face"><i /><i /><b /></div><h3>두근두근<br />첫 글자 찾기</h3><p>오늘의 감각 미션이에요!</p><ol><li className="is-done"><b>1</b><span>학습지가 도착했어요</span></li><li><b>2</b><span>점자를 손끝으로 확인해요</span></li><li><b>3</b><span>오늘의 “아하!”를 모아요</span></li></ol><div className="side-cheer">YOU CAN DO IT!<span>★</span></div></aside>
            <div className="task-side"><div className="task-top"><span><b>01</b> BRAILLE POP QUIZ</span><button onClick={() => { const next = !voiceOn; setVoiceOn(next); setLiveMessage(next ? "음성 안내를 켰어요." : "음성 안내를 껐어요."); }} aria-pressed={voiceOn}>{voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}{voiceOn ? "소리 켜짐" : "소리 꺼짐"}</button></div><div className="task-question"><span>FEEL THE DOTS!</span><h3>{lesson.prompt}</h3><p>화면의 점 미리보기는 실제 닷패드에서 손끝으로 느끼는 핀의 위치를 보여 줍니다.</p></div>
              <div className="black-dotpad"><div><small>DOTPAD · 6 DOT CELL</small><b>지금 손끝에 올라온 점!</b></div><Dots dots={lessonDots} /></div>
              <div className="shape-choices" role="group" aria-label="글자 선택지">{lesson.options.map((option, index) => { const picked = option === selected; const state = checked ? option === lesson.answer ? "correct" : picked ? "wrong" : "" : picked ? "picked" : ""; return <button className={`shape-choice ${state}`} onClick={() => choose(option)} aria-pressed={picked} disabled={completed} key={option}><span className={`tiny-face face-${index}`}><i /><i /><b /></span><strong>{option}</strong><small>{toBraille(option)}</small></button>; })}</div>
              {completed ? <div className="yay-message"><span>★</span><div><b>짜잔! 오늘의 첫 문제 완료!</b><p>바가 닷패드 위에서 반짝반짝 올라왔어요.</p></div></div> : <div className="answer-strip"><p className={checked ? selected === lesson.answer ? "okay" : "nope" : ""}>{checked ? selected === lesson.answer ? "맞았어요. 도트를 다시 느껴 보세요!" : "아직 아니에요. 손끝을 다시 따라가 볼까요?" : "글자를 고르고 정답을 확인해 보세요."}</p>{checked && selected !== lesson.answer ? <button onClick={() => speak(lesson.hint)}><Headphones size={15} />힌트 듣기</button> : <button onClick={check}>정답 확인 <ChevronRight size={16} /></button>}</div>}
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="why-shapes" aria-labelledby="why-title"><div className="shell why-grid"><div className="why-copy"><span className="sticker-label"><i />WHY SENSORY? <b>?</b></span><h2 id="why-title">눈으로만<br />배우지 않아도<br /><em>괜찮아!</em></h2><p>Sensory는 촉각, 음성, 화면 정보를 함께 연결해요. 그래서 다음에 뭘 해야 할지, 내가 맞혔는지 스스로 알 수 있어요.</p><button className="black-action" onClick={() => goTo("studio")}>내 글자도 점자로! <ArrowRight size={18} /></button></div><figure className="why-figure"><img src={ASSETS.path} alt="도트 경로를 따라 감정 도형 캐릭터와 닷패드가 연결된 학습 여정" /><span className="yellow-burst">!</span></figure></div></section>

      <section id="curriculum" className="playground-section" aria-labelledby="playground-title"><div className="shell"><div className="playground-head"><div><span className="sticker-label"><i />LEARNING PLAYGROUND <b>●</b></span><h2 id="playground-title">손끝으로 푸는<br />알록달록 공부 놀이터.</h2></div><p>매일의 작은 과제가 이어져, 읽기부터 지도와 도형까지 나만의 감각 언어가 됩니다.</p></div><div className="playground-layout"><img src={ASSETS.stickers} alt="빨강, 보라, 초록, 노랑의 감정 도형 학습 친구들" /><div className="play-list"><article><span className="color-number purple">01</span><div><h3>점자 문해</h3><p>자모부터 문장까지, 읽기의 리듬을 손끝에 익혀요.</p></div><b>⠨⠎⠢⠨</b></article><article><span className="color-number yellow">02</span><div><h3>수학</h3><p>수와 연산, 도형의 관계를 촉각 그래픽으로 만나요.</p></div><b>⠠⠍⠚⠁</b></article><article><span className="color-number pink">03</span><div><h3>영어</h3><p>소리와 철자를 함께 익히며 점자로 정확하게 써 봐요.</p></div><b>⠻⠎</b></article><article><span className="color-number green">04</span><div><h3>촉각 그림</h3><p>과학 구조도와 지리 지도를 손끝의 정보로 바꿔요.</p></div><b>⠰⠭⠫⠁</b></article></div></div></div></section>

      <section id="studio" className="studio-shapes" aria-labelledby="studio-title"><div className="shell studio-shape-grid"><div className="studio-copy"><span className="sticker-label"><i />BRAILLE LAB <b>+ +</b></span><h2 id="studio-title">내가 쓴 말이<br /><em>점점점</em> 하고<br />올라와요.</h2><p>내 이름이나 좋아하는 단어를 적어 보세요. Sensory가 바로 점자로 바꿔 닷패드의 한 줄에 보여 줍니다.</p><div className="blue-bubble-face"><i /><i /><b /></div></div><div className="studio-console"><div className="console-top"><span><Zap size={16} /> LIVE DOTPAD PREVIEW</span><b>READY!</b></div><label className="sr-only" htmlFor="studio-input">점자로 바꿀 한글, 영어, 숫자를 입력</label><div className="console-input"><input id="studio-input" value={studioText} maxLength={20} onChange={(event) => { setStudioText(event.target.value); setLiveMessage("닷패드 미리보기를 갱신했어요."); }} placeholder="예: 내 이름" /><button onClick={() => speak(studioText || "입력된 글자가 없습니다.")} aria-label="입력한 글자 듣기"><Volume2 size={19} /></button></div><p className="braille-output">{toBraille(studioText || "점자")}</p><div className="wide-dotpad" aria-label={`${studioText || "점자"} 점자 출력 미리보기`}>{studioCells.map((cell, index) => <Dots dots={cell} compact key={`${index}-${cell.join("-")}`} />)}</div><div className="console-bottom"><span>DOTPAD · {studioCells.length} / 20 CELLS</span><button onClick={() => { setStudioText(DEFAULT_TEXT); speak("센서리 예시로 되돌렸어요."); }}>예시로 돌아가기 <ChevronRight size={14} /></button></div></div></div></section>
    </main>
    <footer className="shape-footer"><div className="shell footer-shape-row"><div><span className="sticker-label"><i />ONE MORE DAY <b>★</b></span><h2>내일도<br />손끝에서 만나!</h2></div><div className="footer-face green-footer-face"><i /><i /><b /></div><button className="yellow-action" onClick={() => goTo("today")}>오늘의 한 장 다시 보기 <ArrowRight size={17} /></button></div><div className="shell footer-meta"><span className="shape-brand"><img src={ASSETS.logo} alt="" /><span>sen<span>so</span>ry</span></span><span>닷패드 연동 촉각 학습 경험 컨셉 데모</span></div></footer>
  </div>;
}
