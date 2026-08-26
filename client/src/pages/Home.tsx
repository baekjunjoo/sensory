/* Tactile Postroom: each interface element reinforces the daily worksheet journey—arrive, touch, understand, complete. */
import { useMemo, useState } from "react";
import {
  Accessibility,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Headphones,
  Menu,
  PenLine,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Waves,
  X,
} from "lucide-react";

type BrailleCell = number[];

declare global {
  interface Window {
    KB?: {
      brailleCells: (text: string) => BrailleCell[];
      toUnicodeBraille: (text: string) => string;
    };
  }
}

const ASSETS = {
  hero: "/manus-storage/sensory-hero-dotpad_7d9a4adb.jpg",
  daily: "/manus-storage/sensory-daily-sheet_07d1aef1.jpg",
  journey: "/manus-storage/sensory-progress-path_ccae9de5.jpg",
  mascot: "/manus-storage/sensory-mascot-stamp_5e3ca720.png",
  logo: "/manus-storage/sensory-dot-mark_f7702fad.png",
};

const FALLBACK_CELLS: Record<string, BrailleCell[]> = {
  "바": [[1, 2, 4, 5]],
  "마": [[1, 3, 4]],
  "다": [[1, 4, 5]],
  "가": [[1, 2, 4, 6]],
  "점자": [[1, 2, 4, 5], [1, 2, 3, 5]],
  "센서리": [[2, 3, 4], [1, 2, 3, 5], [2, 3, 4], [1, 2, 3, 5], [2, 4]],
};

const DEFAULT_TEXT = "센서리";

function getCells(text: string): BrailleCell[] {
  if (typeof window !== "undefined" && window.KB) return window.KB.brailleCells(text);
  return FALLBACK_CELLS[text] ?? text.slice(0, 8).split("").map((_, index) => [1, 2 + (index % 3)]);
}

function toBraille(text: string): string {
  if (typeof window !== "undefined" && window.KB) return window.KB.toUnicodeBraille(text);
  return getCells(text)
    .map((dots) => String.fromCodePoint(0x2800 + dots.reduce((value, dot) => value | (1 << (dot - 1)), 0)))
    .join("");
}

function DotGrid({ dots, compact = false }: { dots: BrailleCell; compact?: boolean }) {
  const order = [1, 4, 2, 5, 3, 6];
  if (compact) {
    return (
      <span className="multi-cell" aria-hidden="true">
        {order.map((dot) => <i key={dot} className={dots.includes(dot) ? "up" : ""} />)}
      </span>
    );
  }
  return (
    <span className="tactile-grid" aria-hidden="true">
      {order.map((dot) => <i key={dot} className={`tactile-dot ${dots.includes(dot) ? "is-up" : ""}`} />)}
    </span>
  );
}

const lesson = {
  prompt: "닷패드 위에 올라온 점자를 만져 보고, 알맞은 글자를 골라 보세요.",
  hint: "왼쪽 위부터 아래로 이어지는 점의 위치를 천천히 확인해 보세요.",
  answer: "바",
  options: ["바", "다", "마"],
};

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [studioText, setStudioText] = useState(DEFAULT_TEXT);
  const [liveMessage, setLiveMessage] = useState("오늘의 촉각 학습지가 도착했어요.");

  const lessonDots = useMemo(() => getCells(lesson.answer)[0] ?? [], []);
  const studioCells = useMemo(() => getCells(studioText).slice(0, 14), [studioText]);

  const speak = (message: string) => {
    setLiveMessage(message);
    if (voiceOn && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "ko-KR";
      utterance.rate = 1.02;
      window.speechSynthesis.speak(utterance);
    }
  };

  const chooseAnswer = (option: string) => {
    if (completed) return;
    setSelected(option);
    setChecked(false);
    speak(`${option}을 선택했어요. 정답 확인을 눌러 보세요.`);
  };

  const checkAnswer = () => {
    if (!selected) {
      speak("먼저 글자 하나를 선택해 보세요.");
      return;
    }
    setChecked(true);
    if (selected === lesson.answer) {
      setCompleted(true);
      speak("정답이에요. 바, 라는 글자가 닷패드 위에 올라왔어요. 오늘의 첫 문제를 완료했어요.");
    } else {
      speak("다시 만져 보세요. 음성 힌트를 들으면 점의 위치를 다시 확인할 수 있어요.");
    }
  };

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="site-shell">
      <a className="sr-only" href="#today">오늘의 학습지로 바로가기</a>
      <div className="sr-only" aria-live="polite">{liveMessage}</div>

      <header className="site-header">
        <div className="page-shell header-inner">
          <a className="brand" href="#top" aria-label="Sensory 홈">
            <span className="brand-mark"><img src={ASSETS.logo} alt="" /><i aria-hidden="true" /></span>
            <span className="brand-lockup"><span className="brand-word"><em>Sen</em><span>sory</span></span><span className="brand-sub">tactile learning</span></span>
          </a>
          <nav className="desktop-nav" aria-label="주 메뉴">
            <a href="#today">오늘의 학습지</a>
            <a href="#how">어떻게 배우나요</a>
            <a href="#curriculum">학습 영역</a>
            <a href="#studio">점자 스튜디오</a>
          </nav>
          <button className="header-cta" onClick={() => scrollTo("today")}>
            오늘의 한 장 <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button className="menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="mobile-navigation" aria-label="메뉴 열기">
            {mobileOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
        <nav id="mobile-navigation" className="mobile-nav" aria-label="모바일 주 메뉴" hidden={!mobileOpen}>
          <a href="#today" onClick={() => setMobileOpen(false)}>오늘의 학습지</a>
          <a href="#how" onClick={() => setMobileOpen(false)}>어떻게 배우나요</a>
          <a href="#curriculum" onClick={() => setMobileOpen(false)}>학습 영역</a>
          <a href="#studio" onClick={() => setMobileOpen(false)}>점자 스튜디오</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="page-shell hero-grid">
            <div className="hero-copy reveal">
              <span className="eyebrow"><span className="mini-dot" aria-hidden="true" />Daily tactile paper</span>
              <h1 id="hero-title" className="display hero-title">매일 한 장,<br />손끝에서 <span className="highlight">공부가 시작돼요.</span></h1>
              <p>센서리는 닷패드로 오늘의 촉각 학습지를 받아, 읽고·듣고·풀어 보는 에듀테크입니다. 화면을 보기보다 손끝의 반응으로 스스로 다음 문제를 알아가요.</p>
              <div className="hero-actions">
                <button className="button-primary" onClick={() => scrollTo("today")}>오늘의 학습지 열기 <ArrowRight size={17} /></button>
                <button className="button-secondary" onClick={() => scrollTo("how")}>작동 방식 보기</button>
              </div>
              <div className="hero-meta"><strong>하루 10분</strong><span className="meta-rule" /><span>문해 · 수학 · 영어 · 촉각 그림</span></div>
            </div>
            <div className="hero-art reveal delay-1" aria-label="닷패드와 매일의 촉각 학습지를 보여주는 일러스트">
              <div className="hero-frame"><img src={ASSETS.hero} alt="따뜻한 책상 위 닷패드에 촉각 점과 학습 카드가 놓인 모습" /></div>
              <div className="arrival-note" aria-hidden="true"><span className="envelope"><Send size={14} /></span><span><strong>오늘의 학습지 도착</strong><span>08:20 AM · READY</span></span></div>
              <div className="hero-device-badge" aria-hidden="true"><span className="signal"><i /><i /><i /></span><span><small>DOTPAD</small><b>촉각 출력 준비됨</b></span></div>
            </div>
          </div>
        </section>

        <section className="story-band" aria-labelledby="story-heading">
          <div className="page-shell story-panel">
            <div className="story-figure"><img src={ASSETS.journey} alt="학습지가 도착하고 닷패드를 거쳐 완료 배지로 이어지는 감각 학습 여정" /></div>
            <div className="story-copy">
              <div>
                <span className="eyebrow"><Sparkles size={14} aria-hidden="true" /> A new small ritual</span>
                <h2 id="story-heading">학습은 ‘해야 할 일’이 아니라, 내게 도착한 한 장의 편지가 됩니다.</h2>
                <p>오늘 할 일이 명료할수록 시작은 가벼워집니다. Sensory는 레벨과 경쟁을 앞세우기보다, 닷패드에 도착한 과제를 끝까지 만져 보는 일상의 리듬을 설계합니다.</p>
                <div className="route-mark"><span /> RECEIVE · TOUCH · COMPLETE</div>
              </div>
            </div>
          </div>
        </section>

        <section id="today" className="today-section" aria-labelledby="today-heading">
          <div className="page-shell">
            <div className="today-intro">
              <div className="section-heading">
                <span className="eyebrow"><span className="mini-dot" aria-hidden="true" />Today’s tactile sheet</span>
                <h2 id="today-heading">오늘의 학습지가<br />닷패드에 도착했어요.</h2>
                <p>아래 데모에서는 점자를 만지고, 음성으로 힌트를 듣고, 선택 결과가 닷패드에 어떻게 출력되는지 확인할 수 있어요.</p>
              </div>
              <div className="connection-status"><span className="status-dot" aria-hidden="true" />닷패드 출력 미리보기 준비됨</div>
            </div>

            <div className="daily-workspace">
              <aside className="delivery-rail" aria-label="오늘의 학습 진행 경로">
                <div className="date-block"><span>Tue / 08·26</span><strong>오늘의 한 장</strong></div>
                <article className="lesson-card">
                  <span className="tiny-label">SENSORY DAILY 01</span>
                  <h3>손끝으로<br />첫 글자 읽기</h3>
                  <p>점 하나하나의 위치를 느끼며, 내가 읽은 글자를 소리와 함께 확인해요.</p>
                  <div className="lesson-tags"><span>점자 문해</span><span>약 10분</span></div>
                </article>
                <ol className="daily-steps">
                  <li className="done"><i><Check size={11} /></i><strong>학습지 도착</strong><span>오늘의 과제를 열었어요.</span></li>
                  <li><i>2</i><strong>촉각으로 확인</strong><span>닷패드 위 점자의 모양을 만져요.</span></li>
                  <li><i>3</i><strong>오늘 완료</strong><span>내일의 한 장으로 이어져요.</span></li>
                </ol>
                <div className="mini-mascot"><img src={ASSETS.mascot} alt="" /><p><b>지우가 배달했어요.</b><br />모르면 음성 힌트를 눌러도 괜찮아요.</p></div>
              </aside>

              <div className="worksheet">
                <div className="worksheet-top">
                  <div><span className="worksheet-index">01</span><span><b className="worksheet-title">오늘의 첫 문제</b><span className="worksheet-sub">BRAILLE · READ WITH TOUCH</span></span></div>
                  <button className="voice-button" onClick={() => { const next = !voiceOn; setVoiceOn(next); setLiveMessage(next ? "음성 안내를 켰어요." : "음성 안내를 껐어요."); }} aria-pressed={voiceOn}>
                    {voiceOn ? <Volume2 size={15} /> : <VolumeX size={15} />}{voiceOn ? "음성 안내" : "음성 꺼짐"}
                  </button>
                </div>
                <div className="question-copy">
                  <span>STEP 01 · FEEL THE DOTS</span>
                  <h3>{lesson.prompt}</h3>
                  <p>도트를 눌러 보는 대신, 실제 닷패드에서는 해당 점이 손끝으로 올라옵니다.</p>
                </div>
                <div className="tactile-preview" aria-label="닷패드에 표시될 점자 미리보기">
                  <span className="preview-copy"><small>DOTPAD · 6 DOT CELL</small><b>지금 올라온 촉각 점</b></span>
                  <DotGrid dots={lessonDots} />
                </div>
                <div className="choices" role="group" aria-label="글자 선택지">
                  {lesson.options.map((option) => {
                    const isSelected = selected === option;
                    const state = checked ? (option === lesson.answer ? "is-correct" : isSelected ? "is-wrong" : "") : isSelected ? "is-selected" : "";
                    return <button key={option} className={`choice ${state}`} onClick={() => chooseAnswer(option)} aria-pressed={isSelected} disabled={completed}><b>{option}</b><small>{toBraille(option)}</small></button>;
                  })}
                </div>
                {!completed ? (
                  <div className="answer-row">
                    <p className={`answer-message ${checked ? (selected === lesson.answer ? "is-success" : "is-error") : ""}`}>{checked ? selected === lesson.answer ? "정답이에요. 손끝의 점을 다시 한번 느껴 보세요." : "아직 아니에요. 힌트를 듣고 점의 위치를 다시 확인해 보세요." : "글자를 고른 뒤 정답을 확인해 보세요."}</p>
                    {checked && selected !== lesson.answer ? <button className="text-action" onClick={() => speak(lesson.hint)}><Headphones size={15} />힌트 듣기</button> : <button className="text-action" onClick={checkAnswer}>정답 확인 <ChevronRight size={15} /></button>}
                  </div>
                ) : (
                  <div className="done-card"><span className="done-stamp"><Check size={21} /></span><span><h4>오늘의 첫 문제를 풀었어요.</h4><p>작은 확인이 쌓이면, 닷패드 위 글자가 내 언어가 됩니다.</p></span></div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="how-section" aria-labelledby="how-heading">
          <div className="page-shell how-layout">
            <div className="how-sticky">
              <div className="section-heading">
                <span className="eyebrow"><span className="mini-dot" aria-hidden="true" />Designed for self-led learning</span>
                <h2 id="how-heading">눈으로만 배우지 않아도, 스스로 다음을 알 수 있도록.</h2>
                <p>학습의 단서는 하나가 아닙니다. Sensory는 촉각·음성·간결한 화면 정보를 함께 제공해, 각자의 방식으로 문제를 풀 수 있게 합니다.</p>
              </div>
              <figure className="mascot-figure"><img src={ASSETS.mascot} alt="학습지 배달을 돕는 레서판다 마스코트" /></figure>
            </div>
            <div className="info-list">
              <article className="info-item"><span className="info-no">01 / ARRIVE</span><div><h3>수준에 맞춘 학습지가 매일 도착해요.</h3><p>한 번에 많은 것을 보여주지 않습니다. 오늘의 주제와 필요한 단서만 담긴 한 장의 과제로, 시작의 부담을 낮춥니다.</p><span className="info-detail"><i />오늘 할 일은 한 가지</span></div></article>
              <article className="info-item"><span className="info-no">02 / TOUCH</span><div><h3>문제의 핵심을 닷패드에서 먼저 느껴요.</h3><p>글자, 수식, 도형의 관계를 손끝으로 탐색한 뒤 음성 힌트로 다시 확인합니다. 화면은 그 경험을 돕는 보조 안내입니다.</p><span className="info-detail"><i />촉각 · 음성 · 화면의 중복 단서</span></div></article>
              <article className="info-item"><span className="info-no">03 / CONTINUE</span><div><h3>오늘의 완료가 내일의 한 장으로 이어져요.</h3><p>순위 대신 어제의 나와 이어지는 리듬을 기록합니다. 보호자와 교사는 아이가 어느 지점에서 자신감을 얻었는지 읽을 수 있어요.</p><span className="info-detail"><i />작지만 꾸준한 학습 습관</span></div></article>
            </div>
          </div>
        </section>

        <section id="curriculum" className="curriculum-section" aria-labelledby="curriculum-heading">
          <div className="page-shell">
            <div className="curriculum-head"><div className="section-heading"><span className="eyebrow"><span className="mini-dot" aria-hidden="true" />Learning by fingertips</span><h2 id="curriculum-heading">한 장씩 쌓여<br />넓어지는 감각의 배움.</h2><p>문해부터 교과 촉각 그림까지, 매일의 학습지는 아이의 속도와 학교의 배움을 자연스럽게 연결합니다.</p></div><p className="curriculum-note">모든 활동은 촉각 출력과 음성 안내를 함께 고려해 설계되는 경험을 목표로 합니다.</p></div>
            <div className="curriculum-grid">
              <article className="subject-card"><span className="subject-no">01 / LITERACY</span><span className="subject-icon"><BookOpen size={21} /></span><h3>점자 문해</h3><p>자모, 약자, 문장을 차례로 만지며 읽기의 리듬을 만들어요.</p><span className="subject-braille">⠨⠎⠢⠨</span></article>
              <article className="subject-card"><span className="subject-no">02 / MATH</span><span className="subject-icon"><Accessibility size={21} /></span><h3>수학</h3><p>수 개념과 연산, 도형의 관계를 촉각 그래픽으로 살펴봐요.</p><span className="subject-braille">⠠⠍⠚⠁</span></article>
              <article className="subject-card"><span className="subject-no">03 / ENGLISH</span><span className="subject-icon"><Waves size={21} /></span><h3>영어</h3><p>소리와 철자를 함께 익히며, 점자로 정확하게 써 봐요.</p><span className="subject-braille">⠻⠎</span></article>
              <article className="subject-card"><span className="subject-no">04 / GRAPHICS</span><span className="subject-icon"><PenLine size={21} /></span><h3>촉각 그림</h3><p>과학 구조도와 지리 지도를 손끝의 정보로 만나 봐요.</p><span className="subject-braille">⠰⠭⠫⠁</span></article>
            </div>
          </div>
        </section>

        <section id="studio" className="studio-section" aria-labelledby="studio-heading">
          <div className="page-shell">
            <div className="section-heading"><span className="eyebrow"><span className="mini-dot" aria-hidden="true" />Braille studio</span><h2 id="studio-heading">내가 쓴 말이<br />바로 손끝의 점이 되도록.</h2><p>이름이나 좋아하는 낱말을 입력해 보세요. 점역 결과와 닷패드 텍스트 라인 미리보기를 함께 확인할 수 있습니다.</p></div>
            <div className="studio-panel">
              <div className="studio-copy"><span className="eyebrow"><Sparkles size={13} /> MAKE IT YOURS</span><h3>배운 점자를<br />내 이야기로 바꿔 보세요.</h3><p>낯선 점을 외우는 것에서 멈추지 않고, 아이가 익숙한 이름과 문장을 직접 읽고 만지는 순간을 만듭니다.</p><div className="studio-image"><img src={ASSETS.daily} alt="촉각 점과 단순 도형이 올라온 닷패드와 학습지" /></div></div>
              <div className="studio-tool">
                <div className="tool-top"><div><small>TEXT TO TACTILE PREVIEW</small><h3>점자 출력 미리보기</h3></div><span className="connection-status"><span className="status-dot" aria-hidden="true" />READY</span></div>
                <label className="sr-only" htmlFor="studio-input">점자로 바꿀 한글, 영어 또는 숫자 입력</label>
                <div className="tool-field"><input id="studio-input" value={studioText} maxLength={20} onChange={(event) => { setStudioText(event.target.value); setLiveMessage("점자 출력 미리보기를 갱신했어요."); }} placeholder="예: 나의 이름" /><button onClick={() => speak(studioText || "입력된 텍스트가 없습니다.")} aria-label="입력한 문장 음성으로 듣기"><Volume2 size={20} /></button></div>
                <div className="unicode-output" aria-live="polite">{toBraille(studioText || "점자")}</div>
                <div className="multi-pad" aria-label={`${studioText || "점자"}의 닷패드 텍스트 라인 미리보기`}>{studioCells.map((cell, index) => <DotGrid dots={cell} compact key={`${index}-${cell.join("-")}`} />)}</div>
                <div className="studio-meta"><span>DOTPAD · {Math.min(studioCells.length, 14)} / 20 CELLS</span><button onClick={() => { setStudioText(DEFAULT_TEXT); speak("센서리로 다시 바꿨어요."); }}><ChevronRight size={14} />예시로 되돌리기</button></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="page-shell">
          <div className="footer-cta"><div><span className="eyebrow"><span className="mini-dot" aria-hidden="true" />A tactile habit, every day</span><h2>내일도 한 장,<br />손끝으로 이어가요.</h2><p>센서리는 화면을 대신하는 기기가 아니라, 스스로 배우는 감각을 매일의 습관으로 만드는 경험입니다.</p></div><button className="button-primary" onClick={() => scrollTo("today")}>오늘의 학습지 다시 보기 <ArrowRight size={17} /></button></div>
          <div className="footer-bottom"><span className="footer-brand"><span className="brand-mark footer-mark"><img src={ASSETS.logo} alt="" /><i aria-hidden="true" /></span><span className="brand-word"><em>Sen</em><span>sory</span></span></span><span>DotPad 연동 학습 경험을 위한 컨셉 데모 · 실제 하드웨어 출력은 연결 환경에 따라 달라질 수 있습니다.</span></div>
        </div>
      </footer>
    </div>
  );
}
