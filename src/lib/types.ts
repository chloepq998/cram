export type QuizQuestionType = "short" | "mcq";

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface StudySession {
  id: string;
  subject: string;
  fileName: string;
  summary: string;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  sessionId: string;
  subject: string;
  questions: QuizQuestion[];
  userAnswers: string[];
  score: number;
  createdAt: string;
}

export interface WrongNote {
  id: string;
  subject: string;
  question: QuizQuestion;
  userAnswer: string;
  relatedSummary: string;
  reviewed: boolean;
  createdAt: string;
}

export interface PlanSubjectInput {
  name: string;
  volume: string;
}

export interface PlanTask {
  id: string;
  subject: string;
  task: string;
  done: boolean;
}

export interface PlanDay {
  date: string;
  tasks: PlanTask[];
}

export interface StudyPlan {
  examDate: string;
  subjects: PlanSubjectInput[];
  days: PlanDay[];
  createdAt: string;
}
