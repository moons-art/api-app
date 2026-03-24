const getDb = async () => {
  const admin = await import("firebase-admin");
  if (!admin.apps.length) {
    try {
      if (process.env.NODE_ENV === "development") {
        const fs = await import("fs");
        const path = await import("path");
        const serviceAccountPath = path.resolve(process.cwd(), "service-account.json");
        
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
          // Replace escaped newlines with actual ones for OpenSSL
          if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
          }
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
        } else {
          admin.initializeApp();
        }
      } else {
        // In production (Firebase Hosting), initialize without args
        admin.initializeApp();
      }
    } catch (error) {
      console.warn("Firestore lazy init warning:", error);
    }
  }
  return admin.firestore();
};

const COLLECTION_NAME = "knowledge_base";

export interface KnowledgeBaseEntry {
  fileId: string;
  name: string;
  fileUri: string;
  mimeType: string;
  type: string;
  updatedAt: number;
}

export const getKnowledgeBase = async (): Promise<KnowledgeBaseEntry[]> => {
  try {
    const db = await getDb();
    const snapshot = await db.collection(COLLECTION_NAME).orderBy("updatedAt", "desc").get();
    return snapshot.docs.map(doc => doc.data() as KnowledgeBaseEntry);
  } catch (error) {
    console.error("Error fetching knowledge base from Firestore:", error);
    return [];
  }
};

export const saveToKnowledgeBase = async (entry: Omit<KnowledgeBaseEntry, "updatedAt">) => {
  try {
    const db = await getDb();
    const docRef = db.collection(COLLECTION_NAME).doc(entry.fileId);
    await docRef.set({
      ...entry,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error saving to Firestore:", error);
    throw error;
  }
};

export const deleteFromKnowledgeBase = async (fileId: string) => {
  try {
    const db = await getDb();
    await db.collection(COLLECTION_NAME).doc(fileId).delete();
  } catch (error) {
    console.error("Error deleting from Firestore:", error);
    throw error;
  }
};
