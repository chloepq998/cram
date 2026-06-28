import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, SUMMARIZE_MODEL } from "@/lib/anthropic";
import {
  isAllowedMimeType,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/study-material";

const SYSTEM_PROMPT = `너는 고등학생의 벼락치기 시험 준비를 돕는 AI 학습 도우미야.
사용자가 업로드한 학습 자료(교과서, 참고서, 필기 등)를 분석해서 핵심 내용을 요약해줘.

요약 시 다음 원칙을 반드시 지켜:
1. 원문의 핵심 키워드와 문장을 빠짐없이 반영하고, 중요한 정보를 누락하지 않는다.
2. 수학 공식, 과학 원리, 문제 풀이 과정처럼 복잡한 내용은 단계를 살려서 정확하게 정리한다.
3. 한국 고등학생이 짧은 시간에 훑어볼 수 있도록 간결한 불릿 포인트와 소제목을 사용한다.
4. 군더더기 설명 없이 시험에 나올 핵심만 담는다.

마크다운 형식(소제목 ##, 불릿 -)으로 한국어 요약을 작성해.`;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "파일이 첨부되지 않았습니다." },
      { status: 400 },
    );
  }

  if (!isAllowedMimeType(file.type)) {
    return NextResponse.json(
      { error: "PDF, JPG, PNG 파일만 업로드할 수 있습니다." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "파일 크기는 20MB를 초과할 수 없습니다." },
      { status: 400 },
    );
  }

  const buffer = await file.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString("base64");

  const sourceBlock: Anthropic.Messages.ContentBlockParam =
    file.type === "application/pdf"
      ? {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64Data,
          },
        }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: file.type as "image/jpeg" | "image/png",
            data: base64Data,
          },
        };

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: SUMMARIZE_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            sourceBlock,
            {
              type: "text",
              text: "이 학습 자료를 위 지침에 따라 한국어로 요약해줘.",
            },
          ],
        },
      ],
    });

    const summary = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n\n");

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarization failed", error);
    return NextResponse.json(
      { error: "요약을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 502 },
    );
  }
}
