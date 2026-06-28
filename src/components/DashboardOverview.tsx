"use client";

import { useEffect, useMemo, useState } from "react";
import type { QuizAttempt, StudyPlan, StudySession, WrongNote } from "@/lib/types";
import {
  getStudyPlan,
  listQuizAttempts,
  listSessions,
  listWrongNotes,
} from "@/lib/storage";

function formatPercent(numerator: number, denominator: number): string {
  if (denominator === 0) return "-";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function DashboardOverview() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [quizzes, setQuizzes] = useState<QuizAttempt[]>([]);
  const [wrongNotes, setWrongNotes] = useState<WrongNote[]>([]);
  const [plan, setPlan] = useState<StudyPlan | null>(null);

  useEffect(() => {
    // localStorage isn't available during SSR, so load it after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(listSessions());
    setQuizzes(listQuizAttempts());
    setWrongNotes(listWrongNotes());
    setPlan(getStudyPlan());
  }, []);

  const totalQuestions = quizzes.reduce((sum, q) => sum + q.questions.length, 0);
  const totalCorrect = quizzes.reduce((sum, q) => sum + q.score, 0);
  const reviewedNotes = wrongNotes.filter((n) => n.reviewed).length;

  const planProgress = useMemo(() => {
    if (!plan) return null;
    const totalTasks = plan.days.reduce((sum, day) => sum + day.tasks.length, 0);
    const doneTasks = plan.days.reduce(
      (sum, day) => sum + day.tasks.filter((t) => t.done).length,
      0,
    );
    return { totalTasks, doneTasks };
  }, [plan]);

  const subjectStats = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>();
    for (const attempt of quizzes) {
      const entry = map.get(attempt.subject) ?? { correct: 0, total: 0 };
      entry.correct += attempt.score;
      entry.total += attempt.questions.length;
      map.set(attempt.subject, entry);
    }
    return Array.from(map.entries()).map(([subject, stat]) => ({
      subject,
      ...stat,
    }));
  }, [quizzes]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">요약한 학습 자료</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {sessions.length}건
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">응시한 퀴즈</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {quizzes.length}회
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">전체 정답률</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {formatPercent(totalCorrect, totalQuestions)}
          </p>
          <p className="text-xs text-zinc-400">
            {totalCorrect} / {totalQuestions} 문제
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">오답 노트 복습률</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {formatPercent(reviewedNotes, wrongNotes.length)}
          </p>
          <p className="text-xs text-zinc-400">
            {reviewedNotes} / {wrongNotes.length} 문제
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-500">학습 계획 진행률</h2>
        {planProgress ? (
          <div className="mt-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full bg-emerald-500"
                style={{
                  width:
                    planProgress.totalTasks === 0
                      ? "0%"
                      : `${(planProgress.doneTasks / planProgress.totalTasks) * 100}%`,
                }}
              />
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              {planProgress.doneTasks} / {planProgress.totalTasks} 완료 (
              {formatPercent(planProgress.doneTasks, planProgress.totalTasks)})
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-400">
            아직 학습 계획이 없어요. 학습 계획 페이지에서 만들어보세요.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-500">과목별 정답률</h2>
        {subjectStats.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">
            아직 퀴즈 기록이 없어요.
          </p>
        ) : (
          <table className="mt-2 w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-zinc-400">
                <th className="py-1">과목</th>
                <th className="py-1">정답률</th>
                <th className="py-1">맞은 문제</th>
              </tr>
            </thead>
            <tbody>
              {subjectStats.map((stat) => (
                <tr key={stat.subject} className="border-t border-zinc-100">
                  <td className="py-1.5 text-zinc-900">{stat.subject}</td>
                  <td className="py-1.5 text-zinc-700">
                    {formatPercent(stat.correct, stat.total)}
                  </td>
                  <td className="py-1.5 text-zinc-500">
                    {stat.correct} / {stat.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
