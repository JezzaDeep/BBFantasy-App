import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// Use firestoreDatabaseId if it exists in the config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup, onAuthStateChanged };

async function testConnection() {
  try {
    // Test connection to Firestore
    const testRef = doc(db, "players", "test");
    await getDocFromServer(testRef);
    console.log("✅ Firestore connection OK");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("CRITICAL: Firestore is offline. This usually means the database ID or project ID is incorrect in firebase-applet-config.json.");
      console.error("Current Config:", JSON.stringify(firebaseConfig, null, 2));
    } else {
      console.warn('Firestore connection test failed (non-offline error):', error);
    }
  }
}

testConnection();
