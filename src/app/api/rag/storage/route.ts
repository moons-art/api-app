import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStorageUsage } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ totalBytes: 0, fileCount: 0, limitBytes: 0 }, { status: 401 });
  }

  try {
    const usage = await getStorageUsage();
    return NextResponse.json(usage);
  } catch (error) {
    console.error("Storage usage error:", error);
    return NextResponse.json({ error: "Failed to fetch storage usage" }, { status: 500 });
  }
}
