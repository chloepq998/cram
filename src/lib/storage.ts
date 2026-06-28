import type {
  QuizAttempt,
  StudyPlan,
  StudySession,
  WrongNote,
} from "@/lib/types";

const KEYS = {
  sessions: "cram:sessions",
  quizzes: "cram:quizzes",
  wrongNotes: "cram:wrong-notes",
  plan: "cram:plan",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function listSessions(): StudySession[] {
  return read<StudySession[]>(KEYS.sessions, []);
}

export function addSession(session: StudySession) {
  const sessions = listSessions();
  sessions.unshift(session);
  write(KEYS.sessions, sessions);
}

export function listQuizAttempts(): QuizAttempt[] {
  return read<QuizAttempt[]>(KEYS.quizzes, []);
}

export function addQuizAttempt(attempt: QuizAttempt) {
  const attempts = listQuizAttempts();
  attempts.unshift(attempt);
  write(KEYS.quizzes, attempts);
}

export function listWrongNotes(): WrongNote[] {
  return read<WrongNote[]>(KEYS.wrongNotes, []);
}

export function addWrongNotes(notes: WrongNote[]) {
  if (notes.length === 0) return;
  const existing = listWrongNotes();
  write(KEYS.wrongNotes, [...notes, ...existing]);
}

export function setWrongNoteReviewed(id: string, reviewed: boolean) {
  const notes = listWrongNotes().map((note) =>
    note.id === id ? { ...note, reviewed } : note,
  );
  write(KEYS.wrongNotes, notes);
}

export function getStudyPlan(): StudyPlan | null {
  return read<StudyPlan | null>(KEYS.plan, null);
}

export function saveStudyPlan(plan: StudyPlan) {
  write(KEYS.plan, plan);
}

export function updatePlanTask(date: string, taskId: string, done: boolean) {
  const plan = getStudyPlan();
  if (!plan) return;
  const days = plan.days.map((day) =>
    day.date === date
      ? {
          ...day,
          tasks: day.tasks.map((task) =>
            task.id === taskId ? { ...task, done } : task,
          ),
        }
      : day,
  );
  saveStudyPlan({ ...plan, days });
}
