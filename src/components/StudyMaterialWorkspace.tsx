"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isAllowedMimeType, MAX_FILE_SIZE_BYTES } from "@/lib/study-material";
import { SummaryMarkdown } from "@/components/SummaryMarkdown";
import { QuizPanel } from "@/components/QuizPanel";
import { addSession } from "@/lib/storage";

type Status = "idle" | "summarizing" | "done" | "error";

export function StudyMaterialWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(selected: File | null) {
    setSummary(null);
    setErrorMessage(null);
    setStatus("idle");
    setSessionId(null);

    if (!selected) {
      setFile(null);
      return;
    }
    if (!isAllowedMimeType(selected.type)) {
      setErrorMessage("PDF, JPG, PNG 파일만 업로드할 수 있습니다.");
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("파일 크기는 20MB를 초과할 수 없습니다.");
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleSummarize() {
    if (!file) return;
    setStatus("summarizing");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/summarize", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "요약을 생성하지 못했습니다.");
      }

      const newSessionId = crypto.randomUUID();
      addSession({
        id: newSessionId,
        subject: subject.trim() || "기타",
        fileName: file.name,
        summary: data.summary,
        createdAt: new Date().toISOString(),
      });
      setSessionId(newSessionId);
      setSummary(data.summary);
      setStatus("done");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      );
      setStatus("error");
    }
  }

  const isPdf = file?.type === "application/pdf";

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900">
          벼락치기 학습 도우미
        </h1>
        <p className="text-sm text-zinc-500">
          학습 자료를 업로드하면 AI가 핵심 내용을 요약해드려요.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(event) =>
            handleFileChange(event.target.files?.[0] ?? null)
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            학습 자료 선택
          </button>
          <span className="text-sm text-zinc-500">
            {file ? file.name : "PDF, JPG, PNG 파일 (최대 20MB)"}
          </span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="과목 (예: 수학)"
            className="w-32 rounded border border-zinc-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={handleSummarize}
            disabled={!file || status === "summarizing"}
            className="ml-auto rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {status === "summarizing" ? "요약 생성 중..." : "요약 생성"}
          </button>
        </div>
        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </div>

      {file && (
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          <section className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4">
            <h2 className="text-sm font-semibold text-zinc-500">원문</h2>
            <div className="flex-1 overflow-auto rounded-lg bg-zinc-100">
              {previewUrl && isPdf && (
                <iframe
                  src={previewUrl}
                  title="원문 PDF 미리보기"
                  className="h-[600px] w-full"
                />
              )}
              {previewUrl && !isPdf && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="업로드한 학습 자료 미리보기"
                  className="w-full object-contain"
                />
              )}
            </div>
          </section>

          <section className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4">
            <h2 className="text-sm font-semibold text-zinc-500">AI 요약</h2>
            <div className="flex-1 overflow-auto rounded-lg bg-white">
              {status === "summarizing" && (
                <p className="text-sm text-zinc-400">
                  AI가 핵심 내용을 요약하고 있어요...
                </p>
              )}
              {status === "done" && summary && (
                <SummaryMarkdown text={summary} />
              )}
              {status === "idle" && (
                <p className="text-sm text-zinc-400">
                  요약 생성 버튼을 누르면 결과가 여기에 표시됩니다.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {status === "done" && summary && sessionId && (
        <QuizPanel
          sessionId={sessionId}
          subject={subject.trim() || "기타"}
          summary={summary}
        />
      )}
    </div>
  );
}
