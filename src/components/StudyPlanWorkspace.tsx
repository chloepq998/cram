"use client";

import { useEffect, useState } from "react";
import type { PlanDay, PlanSubjectInput, StudyPlan } from "@/lib/types";
import { getStudyPlan, saveStudyPlan, updatePlanTask } from "@/lib/storage";

type Phase = "form" | "loading" | "error";

export function StudyPlanWorkspace() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [examDate, setExamDate] = useState("");
  const [subjects, setSubjects] = useState<PlanSubjectInput[]>([
    { name: "", volume: "" },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // localStorage isn't available during SSR, so load it after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlan(getStudyPlan());
  }, []);

  function handleSubjectChange(
    index: number,
    field: keyof PlanSubjectInput,
    value: string,
  ) {
    setSubjects((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  function handleAddSubject() {
    setSubjects((prev) => [...prev, { name: "", volume: "" }]);
  }

  function handleRemoveSubject(index: number) {
    setSubjects((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  }

  async function handleGenerate() {
    const validSubjects = subjects
      .map((s) => ({ name: s.name.trim(), volume: s.volume.trim() }))
      .filter((s) => s.name && s.volume);

    if (!examDate) {
      setErrorMessage("시험 날짜를 선택해주세요.");
      return;
    }
    if (validSubjects.length === 0) {
      setErrorMessage("과목명과 분량을 1개 이상 입력해주세요.");
      return;
    }

    setPhase("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate, subjects: validSubjects }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "학습 계획을 생성하지 못했습니다.");
      }

      const days: PlanDay[] = data.days.map(
        (day: { date: string; tasks: { subject: string; task: string }[] }) => ({
          date: day.date,
          tasks: day.tasks.map((task) => ({
            id: crypto.randomUUID(),
            subject: task.subject,
            task: task.task,
            done: false,
          })),
        }),
      );

      const newPlan: StudyPlan = {
        examDate,
        subjects: validSubjects,
        days,
        createdAt: new Date().toISOString(),
      };
      saveStudyPlan(newPlan);
      setPlan(newPlan);
      setPhase("form");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      );
      setPhase("error");
    }
  }

  function handleToggleTask(date: string, taskId: string, done: boolean) {
    updatePlanTask(date, taskId, done);
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            days: prev.days.map((day) =>
              day.date === date
                ? {
                    ...day,
                    tasks: day.tasks.map((task) =>
                      task.id === taskId ? { ...task, done } : task,
                    ),
                  }
                : day,
            ),
          }
        : prev,
    );
  }

  function handleNewPlan() {
    setPlan(null);
    setExamDate("");
    setSubjects([{ name: "", volume: "" }]);
    setPhase("form");
    setErrorMessage(null);
  }

  if (plan) {
    const totalTasks = plan.days.reduce((sum, day) => sum + day.tasks.length, 0);
    const doneTasks = plan.days.reduce(
      (sum, day) => sum + day.tasks.filter((t) => t.done).length,
      0,
    );
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 p-4">
          <p className="text-sm text-zinc-600">
            시험일: <span className="font-medium">{plan.examDate}</span>
            {" · "}
            완료 {doneTasks} / {totalTasks}
          </p>
          <button
            type="button"
            onClick={handleNewPlan}
            className="text-sm text-blue-600 underline"
          >
            새 계획 만들기
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {plan.days.map((day) => (
            <div key={day.date} className="rounded-lg border border-zinc-200 p-3">
              <p className="text-sm font-semibold text-zinc-900">{day.date}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {day.tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={(e) =>
                        handleToggleTask(day.date, task.id, e.target.checked)
                      }
                    />
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                      {task.subject}
                    </span>
                    <span
                      className={
                        task.done ? "text-zinc-400 line-through" : "text-zinc-700"
                      }
                    >
                      {task.task}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-4">
      <label className="flex flex-col gap-1 text-sm text-zinc-600">
        시험 날짜
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="w-48 rounded border border-zinc-300 px-2 py-1"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-zinc-600">과목 및 분량</span>
        {subjects.map((subject, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={subject.name}
              onChange={(e) =>
                handleSubjectChange(index, "name", e.target.value)
              }
              placeholder="과목명 (예: 수학)"
              className="w-32 rounded border border-zinc-300 px-2 py-1 text-sm"
            />
            <input
              type="text"
              value={subject.volume}
              onChange={(e) =>
                handleSubjectChange(index, "volume", e.target.value)
              }
              placeholder="분량 (예: 3단원~5단원)"
              className="w-48 rounded border border-zinc-300 px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => handleRemoveSubject(index)}
              disabled={subjects.length === 1}
              className="text-sm text-zinc-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              삭제
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddSubject}
          className="self-start text-sm text-blue-600 underline"
        >
          과목 추가
        </button>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={phase === "loading"}
        className="self-start rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {phase === "loading" ? "계획 생성 중..." : "학습 계획 생성"}
      </button>
    </div>
  );
}
