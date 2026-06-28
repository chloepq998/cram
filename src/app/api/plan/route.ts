import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, SUMMARIZE_MODEL } from "@/lib/anthropic";
import type { PlanSubjectInput } from "@/lib/types";

const PLAN_TOOL: Anthropic.Messages.Tool = {
  name: "submit_plan",
  description: "생성된 일별 학습 계획을 제출합니다.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string", description: "YYYY-MM-DD 형식의 날짜" },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  subject: { type: "string" },
                  task: {
                    type: "string",
                    description: "해당 날짜에 해야 할 구체적인 학습 작업",
                  },
                },
                required: ["subject", "task"],
              },
            },
          },
          required: ["date", "tasks"],
        },
      },
    },
    required: ["days"],
  },
};

export async function POST(request: Request) {
  const body = await request.json();
  const { examDate, subjects } = body as {
    examDate?: string;
    subjects?: PlanSubjectInput[];
  };

  if (!examDate || typeof examDate !== "string") {
    return NextResponse.json(
      { error: "시험 날짜가 필요합니다." },
      { status: 400 },
    );
  }
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return NextResponse.json(
      { error: "과목을 1개 이상 입력해주세요." },
      { status: 400 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const subjectLines = subjects
    .map((s) => `- ${s.name}: ${s.volume}`)
    .join("\n");

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: SUMMARIZE_MODEL,
      max_tokens: 4096,
      tools: [PLAN_TOOL],
      tool_choice: { type: "tool", name: "submit_plan" },
      system:
        "너는 고등학생의 벼락치기 시험 준비를 돕는 AI야. 시험 날짜와 과목별 학습 분량을 바탕으로 오늘부터 시험 전날까지 매일 무엇을 공부할지 구체적인 일별 계획을 세워. 과목별 분량을 날짜에 적절히 배분하고, 시험 직전 하루는 전체 복습 위주로 구성해.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `오늘 날짜: ${today}` },
            { type: "text", text: `시험 날짜: ${examDate}` },
            { type: "text", text: `과목별 분량:\n${subjectLines}` },
            {
              type: "text",
              text: "오늘부터 시험 전날까지 날짜별 학습 계획을 세워서 submit_plan 도구로 제출해.",
            },
          ],
        },
      ],
    });

    const toolUse = message.content.find(
      (block) => block.type === "tool_use" && block.name === "submit_plan",
    );

    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Model did not return a tool_use block");
    }

    return NextResponse.json(toolUse.input);
  } catch (error) {
    console.error("Plan generation failed", error);
    return NextResponse.json(
      { error: "학습 계획을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 502 },
    );
  }
}
