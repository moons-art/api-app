export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getKnowledgeBase } from "@/lib/firestore";
import { getAppSettings } from "@/lib/settings";

export async function GET() {
  const session = await auth();
  const settings = await getAppSettings();

  // Admin always has access. Public users only when Master Switch is on.
  if (!session && !settings.isMasterSwitchOn) {
    return NextResponse.json({ folders: [], files: [], disabled: true }, { status: 503 });
  }

  try {
    const config = await getKnowledgeBase();
    
    const folders = config
      .filter((e: any) => e.type === "folder")
      .map((f: any) => ({ name: f.name, fileId: f.fileId, fileUri: f.fileUri }));
      
    const files = config
      .filter((e: any) => e.type === "managed")
      .map((f: any) => ({ name: f.name, fileId: f.fileId, fileUri: f.fileUri }));
      
    return NextResponse.json({ folders, files });
  } catch (error) {
    console.error("Failed to fetch knowledge base from Firestore:", error);
    return NextResponse.json({ error: "Failed to fetch rag info" }, { status: 500 });
  }
}
