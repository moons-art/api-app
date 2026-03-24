export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { deleteGeminiFile } from "@/lib/gemini";
import { getKnowledgeBase, deleteFromKnowledgeBase } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  const { fileId } = await req.json();

  try {
    const data = await getKnowledgeBase();
    const fileEntry = data.find((e: any) => e.fileId === fileId);

    if (fileEntry && fileEntry.fileUri) {
      // 1. Gemini File API에서 삭제
      await deleteGeminiFile(fileEntry.fileUri);

      // 2. Firestore에서 삭제
      await deleteFromKnowledgeBase(fileId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "File entry not found" }, { status: 404 });
  } catch (error) {
    console.error("Deletion error:", error);
    return NextResponse.json({ error: "Failed to delete from Gemini" }, { status: 500 });
  }
}
