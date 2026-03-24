import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId") || "root";

  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: (session as any).accessToken });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    const response = await drive.files.list({
      pageSize: 50,
      fields: "nextPageToken, files(id, name, mimeType)",
      q: `'${folderId}' in parents and (mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain' or mimeType = 'application/pdf') and trashed = false`,
    });

    return NextResponse.json({ files: response.data.files });
  } catch (error: any) {
    console.error("Error fetching drive files:", error?.response?.data || error.message);
    
    // Check if the error is due to an invalid/expired token.
    if (error?.response?.status === 401) {
      return NextResponse.json({ error: "Google OAuth 만료. 로그아웃 후 다시 로그인하세요." }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Failed to fetch files. 권한이나 토큰을 확인하세요." }, { status: 500 });
  }
}
