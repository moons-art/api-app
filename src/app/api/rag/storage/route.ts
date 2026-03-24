export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getStorageUsage } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    const usage = await getStorageUsage();
    return NextResponse.json(usage);
  } catch (error) {
    console.error("Storage usage error:", error);
    return NextResponse.json({ error: "Failed to fetch storage usage" }, { status: 500 });
  }
}
