export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeBase, saveToKnowledgeBase } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  const { folderId, name } = await req.json();

  try {
    const config = await getKnowledgeBase();

    // 폴더 등록 정보는 type: "folder"로 저장
    const exists = config.find((e: any) => e.fileId === folderId && e.type === "folder");
    if (!exists) {
      await saveToKnowledgeBase({
        fileId: folderId,
        name,
        fileUri: "", // 폴더는 URI가 없음
        mimeType: "application/vnd.google-apps.folder",
        type: "folder"
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Folder registration error:", error);
    return NextResponse.json({ error: "Failed to register folder" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const config = await getKnowledgeBase();
    const folders = config.filter((e: any) => e.type === "folder");
    return NextResponse.json({ folders });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
  }
}
