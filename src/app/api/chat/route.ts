export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { getKnowledgeBase } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  console.log(`[CHAT] User Message: ${message}`);

  try {
    let fileDataList: { mimeType: string, fileUri: string }[] = [];
    
    // Fetch knowledge base from Firestore
    const entries = await getKnowledgeBase();
    const managedFiles = entries.filter((e: any) => e.type === "managed");
    fileDataList = managedFiles.map((e: any) => ({
      mimeType: e.mimeType || "text/plain",
      fileUri: e.fileUri
    }));
    
    console.log(`[CHAT] Using ${fileDataList.length} files for context`);

    const model = await getGeminiModel();
    const contents = [
      ...fileDataList.map(fd => ({
        fileData: {
          mimeType: fd.mimeType,
          fileUri: fd.fileUri
        }
      })),
      {
        text: `
당신은 교회 설교 준비와 행정 업무를 돕는 전문 AI 비서 'CEUM AI Assistant'입니다. 
제공된 파일들을 바탕으로 사용자의 질문에 친절하고 전문적으로 답변해 주세요. 혼란을 주지 않기 위해, 자신을 소개할 때는 반드시 'CEUM AI Assistant'라고 하세요.

[사용자 질문]
${message}
`
      }
    ];

    console.log(`[CHAT] Starting streaming generation...`);
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: contents }]
    }, { signal: req.signal });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (err: any) {
          console.error("[CHAT STREAM] Stream error:", err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
        }
    });

  } catch (error: any) {
    console.error("[CHAT] Error during chat:", error.message || error);
    return NextResponse.json({ reply: `죄송합니다. 오류가 발생했습니다: ${error.message}` }, { status: 500 });
  }
}
