# Cram — 벼락치기 학습 도우미

An AI study helper for high-school students cramming for exams. Upload study
materials (PDF or photos of notes/textbook pages) and get an AI-generated
summary you can review side-by-side with the original.

This is an MVP slice of a larger PRD covering: AI summarization, short quiz
generation, a wrong-answer notebook, personalized study plans, and a progress
dashboard. Currently implemented: **AI-based summarization of uploaded study
materials**.

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
| `ANTHROPIC_API_KEY` | API key for the Claude API, used to summarize uploaded study materials. |

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Claude API (`@anthropic-ai/sdk`) for summarization of PDFs and images
