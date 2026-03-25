import { getKnowledgeBase } from "./firestore";

const COLLECTION_NAME = "settings";
const DOC_NAME = "app";

export interface AppSettings {
  isMasterSwitchOn: boolean;
  updatedAt: number;
}

const getDb = async () => {
  const admin = await import("firebase-admin");
  if (!admin.apps.length) {
     // Expecting initialization has already happened elsewhere or will here
     // Firestore.ts already handles the check and init.
  }
  return admin.firestore();
};

export const getAppSettings = async (): Promise<AppSettings> => {
  try {
    const db = await getDb();
    const doc = await db.collection(COLLECTION_NAME).doc(DOC_NAME).get();
    if (doc.exists) {
      return doc.data() as AppSettings;
    }
    // Default setting
    return { isMasterSwitchOn: true, updatedAt: Date.now() };
  } catch (error) {
    console.error("Error fetching app settings:", error);
    return { isMasterSwitchOn: true, updatedAt: Date.now() };
  }
};

export const updateAppSettings = async (settings: Partial<AppSettings>) => {
  try {
    const db = await getDb();
    await db.collection(COLLECTION_NAME).doc(DOC_NAME).set({
      ...settings,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating app settings:", error);
    throw error;
  }
};
