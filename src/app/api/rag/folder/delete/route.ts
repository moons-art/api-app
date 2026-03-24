export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeBase, saveToKnowledgeBase, deleteFromKnowledgeBase } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  const { folderId } = await req.json();

  try {
    const config = await getKnowledgeBase();
    // We only delete the folder entry itself here. 
    // Usually, we might want to delete all files in it, but for now we follow old logic.
    await deleteFromKnowledgeBase(folderId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Folder deletion error:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
