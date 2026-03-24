import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
export const fileManager = new GoogleAIFileManager(apiKey);

// 2026년 기준 가장 안정적인 표준 모델인 'gemini-1.5-flash'를 사용합니다.
export const getGeminiModel = (modelName: string = "gemini-1.5-flash") => {
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Gemini File API에 파일을 업로드하고 핸들을 반환합니다.
 */
export const uploadToGemini = async (filePath: string, displayName: string, mimeType: string) => {
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName,
  });
  return uploadResult.file;
};

/**
 * 업로드된 파일들을 기반으로 답변 생성
 */
export const chatWithFiles = async (message: string, fileDataList: { mimeType: string, fileUri: string }[]) => {
  const model = getGeminiModel();
  const parts = [
    ...fileDataList.map(fd => ({ fileData: { mimeType: fd.mimeType, fileUri: fd.fileUri } })),
    { text: message }
  ];

  const result = await model.generateContent(parts);
  return result.response.text();
};

/**
 * 현재 사용 중인 총 파일 용량 확인
 */
export const getStorageUsage = async () => {
  const result = await fileManager.listFiles();
  const totalBytes = (result.files || []).reduce((acc, file) => acc + (parseInt(file.sizeBytes) || 0), 0);
  return {
    totalBytes,
    fileCount: result.files?.length || 0,
    limitBytes: 20 * 1024 * 1024 * 1024 // 20GB
  };
};

export const deleteGeminiFile = async (fileUri: string) => {
  const fileName = fileUri.split("/").pop();
  if (fileName) {
    await fileManager.deleteFile(`files/${fileName}`);
  }
};
