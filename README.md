# Cram — 벼락치기 학습 도우미

An AI study helper for high-school students cramming for exams.

Features:

- **요약 (`/`)** — Upload study materials (PDF or photos of notes/textbook
  pages) and get an AI-generated summary you can review side-by-side with the
  original.
- **퀴즈** — Generate short-answer/multiple-choice quizzes from a summary,
  take them, and get them graded instantly.
- **오답 노트 (`/notes`)** — Wrong quiz answers are collected automatically;
  filter by subject, retry questions, and track review status.
- **학습 계획 (`/plan`)** — Enter an exam date and per-subject volume to get
  an AI-generated day-by-day study plan with trackable tasks.
- **대시보드 (`/dashboard`)** — Overview of summarized materials, quiz
  accuracy, wrong-note review rate, and study plan progress.

All data is stored locally in the browser (`localStorage`) — there is no
backend database or user accounts.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
| --- | --- |
| `ANTHROPIC_API_KEY` | API key for the Claude API, used to summarize study materials and generate quizzes/study plans. |

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Claude API (`@anthropic-ai/sdk`) for summarization of PDFs/images, quiz
  generation, and study plan generation (via tool use)
- Browser `localStorage` for persistence (sessions, quiz attempts, wrong
  notes, study plan)
