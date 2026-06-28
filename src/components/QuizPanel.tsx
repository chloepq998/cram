"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/types";
import { addQuizAttempt, addWrongNotes } from "@/lib/storage";

const DIFFICULTIES = ["쉬움", "보통", "어려움"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

type Phase = "config" | "loading" | "answering" | "graded" | "error";

function isCorrect(question: QuizQuestion, userAnswer: string): boolean {
  return (
    question.answer.trim().toLowerCase() === userAnswer.trim().toLowerCase()
  );
}

export function QuizPanel({
  sessionId,
  subject,
  summary,
}: {
  sessionId: string;
  subject: string;
  summary: string;
}) {
  const [phase, setPhase] = useState<Phase>("config");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("보통");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  async function handleGenerate() {
    setPhase("loading");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, questionCount, difficulty, subject }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "퀴즈를 생성하지 못했습니다.");
      }
      const generated: QuizQuestion[] = data.questions.map(
        (q: Omit<QuizQuestion, "id">) => ({ ...q, id: crypto.randomUUID() }),
      );
      setQuestions(generated);
      setUserAnswers(new Array(generated.length).fill(""));
      setPhase("answering");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      );
      setPhase("error");
    }
  }

  function handleGrade() {
    const correctCount = questions.filter((q, i) =>
      isCorrect(q, userAnswers[i] ?? ""),
    ).length;
    setScore(correctCount);

    addQuizAttempt({
      id: crypto.randomUUID(),
      sessionId,
      subject,
      questions,
      userAnswers,
      score: correctCount,
      createdAt: new Date().toISOString(),
    });

    const wrongNotes = questions
      .map((question, i) => ({ question, userAnswer: userAnswers[i] ?? "" }))
      .filter(({ question, userAnswer }) => !isCorrect(question, userAnswer))
      .map(({ question, userAnswer }) => ({
        id: crypto.randomUUID(),
        subject,
        question,
        userAnswer,
        relatedSummary: summary,
        reviewed: false,
        createdAt: new Date().toISOString(),
      }));
    addWrongNotes(wrongNotes);

    setPhase("graded");
  }

  function handleReset() {
    setPhase("config");
    setQuestions([]);
    setUserAnswers([]);
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4">
      <h2 className="text-sm font-semibold text-zinc-500">핵심 개념 단기 퀴즈</h2>

      {phase === "config" && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            문제 수
            <input
              type="number"
              min={1}
              max={10}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-16 rounded border border-zinc-300 px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            난이도
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="rounded border border-zinc-300 px-2 py-1"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            className="ml-auto rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            퀴즈 생성
          </button>
        </div>
      )}

      {phase === "loading" && (
        <p className="text-sm text-zinc-400">퀴즈를 생성하고 있어요...</p>
      )}

      {phase === "error" && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-red-600">{errorMessage}</p>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-blue-600 underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {(phase === "answering" || phase === "graded") && (
        <div className="flex flex-col gap-4">
          {questions.map((question, index) => {
            const graded = phase === "graded";
            const correct = graded && isCorrect(question, userAnswers[index]);
            return (
              <div
                key={question.id}
                className={`rounded-lg border p-3 ${
                  graded
                    ? correct
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-red-300 bg-red-50"
                    : "border-zinc-200"
                }`}
              >
                <p className="text-sm font-medium text-zinc-900">
                  {index + 1}. {question.question}
                </p>
                {question.type === "mcq" ? (
                  <div className="mt-2 flex flex-col gap-1">
                    {question.options?.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 text-sm text-zinc-700"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          disabled={graded}
                          checked={userAnswers[index] === option}
                          onChange={() =>
                            setUserAnswers((prev) =>
                              prev.map((a, i) => (i === index ? option : a)),
                            )
                          }
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    disabled={graded}
                    value={userAnswers[index] ?? ""}
                    onChange={(e) =>
                      setUserAnswers((prev) =>
                        prev.map((a, i) =>
                          i === index ? e.target.value : a,
                        ),
                      )
                    }
                    placeholder="답을 입력하세요"
                    className="mt-2 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                  />
                )}
                {graded && (
                  <p className="mt-2 text-sm text-zinc-600">
                    정답: <span className="font-medium">{question.answer}</span>
                    {" — "}
                    {question.explanation}
                  </p>
                )}
              </div>
            );
          })}

          {phase === "answering" && (
            <button
              type="button"
              onClick={handleGrade}
              className="self-start rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              채점하기
            </button>
          )}

          {phase === "graded" && (
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-zinc-900">
                {score} / {questions.length} 정답
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-blue-600 underline"
              >
                새 퀴즈 만들기
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
