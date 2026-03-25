export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { getKnowledgeBase } from "@/lib/firestore";
import { auth } from "@/auth";
import { getAppSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const { message, history = [] } = await req.json();
  const session = await auth();
  const settings = await getAppSettings();

  // Admin always has access. Public users only when Master Switch is on.
  if (!session && !settings.isMasterSwitchOn) {
    return NextResponse.json({ reply: "현재 서비스 점검 중입니다. 잠시 후 다시 이용해 주세요." }, { status: 503 });
  }

  try {
    // 1. Fetch knowledge base
    const entries = await getKnowledgeBase();
    const managedFiles = entries.filter((e: any) => e.type === "managed");
    const fileDataList = managedFiles.map((e: any) => ({
      mimeType: e.mimeType || "text/plain",
      fileUri: e.fileUri
    }));

    // 2. Prepare System Instruction (Persona + Knowledge)
    const systemInstruction = `
당신은 교회 설교 준비와 행정 업무를 돕는 전문 AI 비서 'CEUM AI Assistant'입니다. 
제공된 파일들을 바탕으로 사용자의 질문에 친절하고 전문적으로 답변해 주세요. 
자신을 소개할 때는 반드시 'CEUM AI Assistant'라고 하세요.

[중요 지침]
- 대화의 맥락이 바뀌어도 이전 대화 내용을 기억하고 답변하세요.
- 제공된 지식 베이스 파일들에 근거하여 답변하세요.
`;

    // 3. Initialize Model with System Instruction
    const model = await getGeminiModel("gemini-2.5-flash", systemInstruction);

    // 4. Prepare Conversation Contents
    // history should be an array of { role: "user" | "assistant", content: string }
    // We map it to Gemini's format: { role: "user" | "model", parts: [{ text: string }] }
    // Only include managed files in the very first user message for efficiency
    
    const contents: any[] = [];
    
    // Process history
    history.forEach((msg: any, index: number) => {
        const role = msg.role === "assistant" ? "model" : "user";
        const parts: any[] = [{ text: msg.content }];
        
        // Attach files only to the first user message to establish context efficiently
        if (index === 0 && role === "user") {
            fileDataList.forEach(fd => {
                parts.unshift({ fileData: { mimeType: fd.mimeType, fileUri: fd.fileUri } });
            });
        }
        
        contents.push({ role, parts });
    });

    // If history is empty or didn't include the current message, add it
    if (contents.length === 0 || contents[contents.length-1].parts[0].text !== message) {
        const parts: any[] = [{ text: message }];
        if (contents.length === 0) {
            fileDataList.forEach(fd => {
                parts.unshift({ fileData: { mimeType: fd.mimeType, fileUri: fd.fileUri } });
            });
        }
        contents.push({ role: "user", parts });
    }

    console.log(`[CHAT] Starting generation with ${contents.length} messages and ${fileDataList.length} files...`);

    const result = await model.generateContentStream({ contents }, { signal: req.signal });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (err: any) {
          if (err.name === 'AbortError') {
              console.log("[CHAT STREAM] Stream aborted by user");
          } else {
              console.error("[CHAT STREAM] Stream error:", err);
          }
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
