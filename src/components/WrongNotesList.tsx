"use client";

import { useEffect, useMemo, useState } from "react";
import type { WrongNote } from "@/lib/types";
import { listWrongNotes, setWrongNoteReviewed } from "@/lib/storage";
import { SummaryMarkdown } from "@/components/SummaryMarkdown";

function isCorrect(note: WrongNote, retryAnswer: string): boolean {
  return (
    note.question.answer.trim().toLowerCase() ===
    retryAnswer.trim().toLowerCase()
  );
}

type SubjectFilter = "all" | string;
type SortOrder = "newest" | "oldest";

export function WrongNotesList() {
  const [notes, setNotes] = useState<WrongNote[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(
    null,
  );
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryAnswer, setRetryAnswer] = useState("");
  const [retryResult, setRetryResult] = useState<
    Record<string, "correct" | "incorrect">
  >({});

  useEffect(() => {
    // localStorage isn't available during SSR, so load it after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotes(listWrongNotes());
  }, []);

  const subjects = useMemo(
    () => Array.from(new Set(notes.map((note) => note.subject))),
    [notes],
  );

  const visibleNotes = useMemo(() => {
    const filtered =
      subjectFilter === "all"
        ? notes
        : notes.filter((note) => note.subject === subjectFilter);
    const sorted = [...filtered].sort((a, b) => {
      const diff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });
    return sorted;
  }, [notes, subjectFilter, sortOrder]);

  function handleToggleReviewed(note: WrongNote) {
    setWrongNoteReviewed(note.id, !note.reviewed);
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, reviewed: !n.reviewed } : n)),
    );
  }

  function handleStartRetry(note: WrongNote) {
    setRetryingId(note.id);
    setRetryAnswer("");
    setRetryResult((prev) => {
      const next = { ...prev };
      delete next[note.id];
      return next;
    });
  }

  function handleSubmitRetry(note: WrongNote) {
    const correct = isCorrect(note, retryAnswer);
    setRetryResult((prev) => ({
      ...prev,
      [note.id]: correct ? "correct" : "incorrect",
    }));
    if (correct && !note.reviewed) {
      setWrongNoteReviewed(note.id, true);
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, reviewed: true } : n)),
      );
    }
  }

  if (notes.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        아직 오답 노트가 없어요. 퀴즈를 풀면 틀린 문제가 여기에 모여요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          과목
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1"
          >
            <option value="all">전체</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          정렬
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="rounded border border-zinc-300 px-2 py-1"
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {visibleNotes.map((note) => {
          const isExpanded = expandedSummaryId === note.id;
          const isRetrying = retryingId === note.id;
          const result = retryResult[note.id];
          return (
            <div
              key={note.id}
              className={`rounded-lg border p-3 ${
                note.reviewed
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-zinc-200"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  {note.subject}
                </span>
                <span className="text-xs text-zinc-400">
                  {new Date(note.createdAt).toLocaleString()}
                </span>
              </div>

              <p className="mt-2 text-sm font-medium text-zinc-900">
                {note.question.question}
              </p>
              <p className="mt-1 text-sm text-red-600">
                내 답: {note.userAnswer || "(무응답)"}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                정답: <span className="font-medium">{note.question.answer}</span>
                {" — "}
                {note.question.explanation}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleStartRetry(note)}
                  className="text-sm text-blue-600 underline"
                >
                  다시 풀기
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSummaryId(isExpanded ? null : note.id)
                  }
                  className="text-sm text-blue-600 underline"
                >
                  관련 요약 {isExpanded ? "숨기기" : "보기"}
                </button>
                <label className="flex items-center gap-1 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    checked={note.reviewed}
                    onChange={() => handleToggleReviewed(note)}
                  />
                  복습 완료
                </label>
              </div>

              {isRetrying && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {note.question.type === "mcq" ? (
                    <div className="flex flex-col gap-1">
                      {note.question.options?.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 text-sm text-zinc-700"
                        >
                          <input
                            type="radio"
                            name={`retry-${note.id}`}
                            value={option}
                            checked={retryAnswer === option}
                            onChange={() => setRetryAnswer(option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={retryAnswer}
                      onChange={(e) => setRetryAnswer(e.target.value)}
                      placeholder="답을 입력하세요"
                      className="rounded border border-zinc-300 px-2 py-1 text-sm"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleSubmitRetry(note)}
                    className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
                  >
                    확인
                  </button>
                  {result && (
                    <span
                      className={`text-sm font-medium ${
                        result === "correct" ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {result === "correct" ? "정답이에요!" : "다시 틀렸어요"}
                    </span>
                  )}
                </div>
              )}

              {isExpanded && (
                <div className="mt-2 rounded-lg bg-white p-3">
                  <SummaryMarkdown text={note.relatedSummary} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
