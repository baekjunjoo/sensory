import React, { useMemo, useState } from "react";
import { Archive as ArchiveIcon, ArrowLeft, ArrowRight, BookOpenCheck, Check, Clock3, Eye, House, RotateCcw, Sparkles } from "lucide-react";
import { characters, dailyLessons, type DailyLesson } from "@/lib/dailyContent";
import { loadLearningRoutine, markLessonForReview, saveLearningRoutine } from "@/lib/dailyRoutine";

type StatusFilter = "all" | "completed" | "review";

function lessonHref(lessonId: string) { return `/?lesson=${lessonId}#today`; }

export default function Archive() {
  const isGitHubPagesBuild = import.meta.env.VITE_GITHUB_PAGES === "true";
  const base = import.meta.env.BASE_URL;
  const homeHref = isGitHubPagesBuild ? base : "/";
  const [routine, setRoutine] = useState(() => loadLearningRoutine());
  const [subject, setSubject] = useState<DailyLesson["subject"] | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const archive = useMemo(() => dailyLessons.filter((lesson) => {
    const matchesSubject = subject === "all" || lesson.subject === subject;
    const matchesStatus = status === "all" || (status === "completed" ? routine.completedIds.includes(lesson.id) : routine.reviewIds.includes(lesson.id));
    return matchesSubject && matchesStatus;
  }), [routine, status, subject]);
  const completedCount = routine.completedIds.length;
  const markForReview = (lessonId: string) => setRoutine((current) => {
    const next = markLessonForReview(current, lessonId);
    saveLearningRoutine(next);
    return next;
  });

  return <div className="archive-page">
    <header className="report-header"><div className="report-width report-nav"><a href={homeHref} className="report-brand"><span className="report-mark">⠿</span><b>sensory</b><small>MY SHEETS</small></a><a className="report-back" href={homeHref}><ArrowLeft size={15} />학습지로 돌아가기</a></div></header>
    <main className="report-width archive-main">
      <section className="archive-intro" aria-labelledby="archive-title"><div><span className="report-label">MY WORKSHEET ARCHIVE</span><h1 id="archive-title">내가 푼 한 장들이<br /><em>차곡차곡</em> 쌓여요.</h1><p>매일의 작은 발견을 날짜와 감각 영역별로 다시 만나 보세요. 필요하면 한 장을 골라 처음부터 천천히 다시 풀 수 있어요.</p></div><div className="archive-counter"><ArchiveIcon size={29} /><strong>{completedCount}</strong><span>완료한 학습지</span><small>/ 7 SHEETS</small></div></section>
      <section className="archive-controls" aria-label="학습지 보관함 필터"><fieldset><legend>영역</legend><div>{(["all", "점자 문해", "수학", "영어", "촉각 그림"] as const).map((item) => <button key={item} type="button" className={subject === item ? "active" : ""} aria-pressed={subject === item} onClick={() => setSubject(item)}>{item === "all" ? "전체" : item}</button>)}</div></fieldset><fieldset><legend>상태</legend><div>{(["all", "completed", "review"] as const).map((item) => <button key={item} type="button" className={status === item ? "active" : ""} aria-pressed={status === item} onClick={() => setStatus(item)}>{item === "all" ? "전체" : item === "completed" ? "완료" : "다시 만나기"}</button>)}</div></fieldset></section>
      <section className="archive-grid" aria-live="polite" aria-label="보관된 학습지 목록">{archive.map((lesson) => {
        const done = routine.completedIds.includes(lesson.id);
        const review = routine.reviewIds.includes(lesson.id);
        const opened = routine.openedIds.includes(lesson.id);
        const character = characters[lesson.character];
        const dayNumber = dailyLessons.findIndex((item) => item.id === lesson.id) + 1;
        return <article className={`archive-card ${lesson.accent} ${done ? "done" : ""}`} key={lesson.id}><div className="archive-card-head"><span>DAY {String(dayNumber).padStart(2, "0")} · {lesson.weekday}요일</span>{done ? <b><Check size={13} />완료</b> : opened ? <b className="opened"><Eye size={13} />열어 봄</b> : <b className="waiting"><Clock3 size={13} />도착 대기</b>}</div><h2>{lesson.title}</h2><p>{lesson.subject} · {character.name}와 함께</p><small className="archive-goal">{lesson.tactileGoal.action} · {lesson.tactileGoal.concept}</small><div className="archive-card-foot"><span>{review ? <><Sparkles size={14} />다시 만져 보기 · {lesson.tactileGoal.concept}</> : "약 10분의 촉각 미션"}</span><div><button type="button" onClick={() => markForReview(lesson.id)} aria-pressed={review}><Sparkles size={14} />{review ? "목록에 담김" : "다시 만나기"}</button><a href={isGitHubPagesBuild ? `${base}?lesson=${lesson.id}#today` : lessonHref(lesson.id)}><RotateCcw size={14} />학습지 열기</a></div></div></article>;
      })}</section>
      {!archive.length ? <section className="archive-empty"><BookOpenCheck size={25} /><h2>선택한 조건의 학습지가 없어요.</h2><p>다른 영역 또는 상태를 골라 보세요.</p></section> : null}
      <section className="archive-next"><div><span className="report-label">NEXT SHEET TICKET</span><h2>다음 한 장도<br />보관함에서 기다려요.</h2></div><a href={`${homeHref}#today`}>오늘의 학습지 만나기 <ArrowRight size={16} /></a></section>
    </main>
  </div>;
}
