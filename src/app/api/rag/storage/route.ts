import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStorageUsage } from "@/lib/gemini";
import { getAppSettings } from "@/lib/settings";

export async function GET(req: NextRequest) {
  const session = await auth();
  const settings = await getAppSettings();

  // Admin always has access. Public users only when Master Switch is on.
  if (!session && !settings.isMasterSwitchOn) {
    return NextResponse.json({ totalBytes: 0, fileCount: 0, limitBytes: 0, disabled: true }, { status: 503 });
  }

  try {
    const usage = await getStorageUsage();
    return NextResponse.json(usage);
  } catch (error) {
    console.error("Storage usage error:", error);
    return NextResponse.json({ error: "Failed to fetch storage usage" }, { status: 500 });
  }
}
