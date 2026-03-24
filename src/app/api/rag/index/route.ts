export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { google } from "googleapis";
import { fileManager } from "@/lib/gemini";
import { saveToKnowledgeBase } from "@/lib/firestore";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
  const session = await auth();
  const { fileId } = await req.json();

  console.log(`[INDEX] Starting indexing for fileId: ${fileId}`);

  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: (session as any).accessToken });
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    const file = await drive.files.get({ fileId, fields: "id, name, mimeType" });
    const mimeType = file.data.mimeType;
    let dataBuffer: Buffer;

    if (mimeType === "application/vnd.google-apps.document") {
      console.log(`[INDEX] Exporting Google Doc as text...`);
      const exportRes = await drive.files.export({ fileId, mimeType: "text/plain" }, { responseType: "arraybuffer" });
      dataBuffer = Buffer.from(exportRes.data as ArrayBuffer);
    } else if (mimeType === "text/plain" || mimeType === "application/pdf") {
      console.log(`[INDEX] Downloading file as arraybuffer...`);
      const getRes = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
      dataBuffer = Buffer.from(getRes.data as ArrayBuffer);
    } else {
      return NextResponse.json({ error: "지원되지 않는 파일 형식입니다." }, { status: 400 });
    }

    // 1. 임시 파일 저장 (Firebase Functions /tmp is writable)
    const tempDir = os.tmpdir();
    const ext = mimeType === "application/pdf" ? "pdf" : "txt";
    const tempFilePath = path.join(tempDir, `${fileId}.${ext}`);
    
    console.log(`[INDEX] Saving buffer to temp file: ${tempFilePath}`);
    fs.writeFileSync(tempFilePath, dataBuffer);

    // 2. Gemini File API로 업로드
    const uploadMimeType = mimeType === "application/pdf" ? "application/pdf" : "text/plain";
    console.log(`[INDEX] Uploading ${uploadMimeType} to Gemini File API...`);
    
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: uploadMimeType,
      displayName: file.data.name!,
    });

    // 3. Firestore에 저장
    await saveToKnowledgeBase({
      fileId,
      name: file.data.name!,
      fileUri: uploadResult.file.uri,
      mimeType: uploadMimeType,
      type: "managed"
    });
    
    fs.unlinkSync(tempFilePath);
    console.log(`[INDEX] Finished indexing successfully: ${uploadResult.file.uri}`);

    return NextResponse.json({ success: true, fileUri: uploadResult.file.uri });
  } catch (error: any) {
    console.error("[INDEX] Error during indexing:", error.message || error);
    return NextResponse.json({ error: error.message || "학습 중 오류가 발생했습니다." }, { status: 500 });
  }
}
