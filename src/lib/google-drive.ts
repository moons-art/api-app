import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export const createOAuthClient = () => {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
};

export const getDriveClient = (auth: OAuth2Client) => {
  return google.drive({ version: "v3", auth });
};

/**
 * 드라이브에서 특정 폴더나 파일의 텍스트를 가져오는 함수 (예시)
 */
export const fetchFileContent = async (drive: any, fileId: string) => {
  try {
    const response = await drive.files.get({
      fileId,
      alt: "media",
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching file content:", error);
    throw error;
  }
};

/**
 * 드라이브 파일 목록 가져오기
 */
export const listFiles = async (drive: any, folderId?: string) => {
  const q = folderId ? `'${folderId}' in parents` : "mimeType != 'application/vnd.google-apps.folder'";
  const response = await drive.files.list({
    q,
    fields: "files(id, name, mimeType)",
  });
  return response.data.files;
};
