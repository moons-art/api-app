import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateAppSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { isMasterSwitchOn } = await req.json();
    await updateAppSettings({ isMasterSwitchOn });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
