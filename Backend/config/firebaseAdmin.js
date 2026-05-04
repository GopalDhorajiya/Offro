import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    // Fallback to a file if env var not set
    // serviceAccount = JSON.parse(fs.readFileSync('./firebase-service-account.json', 'utf8'));
    console.warn("FIREBASE_SERVICE_ACCOUNT_JSON not found in environment variables. Firebase Admin might not work correctly.");
  }
} catch (error) {
  console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:", error);
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  // If no service account provided, try default credentials (useful for some environments)
  try {
    admin.initializeApp();
  } catch (e) {
    console.error("Failed to initialize Firebase Admin:", e.message);
  }
}

export default admin;
