import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

// Get the service account JSON from environment variable
const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJSON) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing in environment variables");
}

try {
  // Parse the JSON string from environment variable
  const serviceAccount = JSON.parse(serviceAccountJSON);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  console.log("Firebase Admin initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
  throw error;
}

export const firebaseAdmin = admin;