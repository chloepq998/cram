import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, SUMMARIZE_MODEL } from "@/lib/anthropic";

const DIFFICULTIES = ["쉬움", "보통", "어려움"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

const QUIZ_TOOL: Anthropic.Messages.Tool = {
  name: "submit_quiz",
  description: "생성된 퀴즈 문제 목록을 제출합니다.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["short", "mcq"],
              description: "short: 단답형, mcq: 4지선다 객관식",
            },
            question: { type: "string" },
            options: {
              type: "array",
              items: { type: "string" },
              description: "mcq 유형일 때만 4개의 선택지를 제공",
            },
            answer: {
              type: "string",
              description: "정답 (mcq의 경우 선택지 중 하나와 정확히 동일한 텍스트)",
            },
            explanation: { type: "string", description: "정답에 대한 간단한 해설" },
          },
          required: ["type", "question", "answer", "explanation"],
        },
      },
    },
    required: ["questions"],
  },
};

export async function POST(request: Request) {
  const body = await request.json();
  const { summary, questionCount, difficulty, subject } = body as {
    summary?: string;
    questionCount?: number;
    difficulty?: Difficulty;
    subject?: string;
  };

  if (!summary || typeof summary !== "string") {
    return NextResponse.json(
      { error: "요약 내용이 필요합니다." },
      { status: 400 },
    );
  }

  const count = Math.min(Math.max(Math.trunc(questionCount ?? 5), 1), 10);
  const level = DIFFICULTIES.includes(difficulty as Difficulty)
    ? difficulty
    : "보통";

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: SUMMARIZE_MODEL,
      max_tokens: 4096,
      tools: [QUIZ_TOOL],
      tool_choice: { type: "tool", name: "submit_quiz" },
      system:
        "너는 고등학생의 벼락치기 시험 준비를 돕는 AI야. 주어진 학습 요약 내용을 바탕으로 단기 복습용 퀴즈를 생성해.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `과목: ${subject ?? "기타"}` },
            { type: "text", text: `난이도: ${level}` },
            {
              type: "text",
              text: `다음 학습 요약 내용을 바탕으로 단답형과 4지선다 객관식을 섞어서 총 ${count}개의 퀴즈 문제를 만들어줘. submit_quiz 도구로 결과를 제출해.\n\n---\n${summary}`,
            },
          ],
        },
      ],
    });

    const toolUse = message.content.find(
      (block) => block.type === "tool_use" && block.name === "submit_quiz",
    );

    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Model did not return a tool_use block");
    }

    return NextResponse.json(toolUse.input);
  } catch (error) {
    console.error("Quiz generation failed", error);
    return NextResponse.json(
      { error: "퀴즈를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 502 },
    );
  }
}
