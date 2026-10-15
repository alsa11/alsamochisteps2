import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore with specified database ID
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);


// Connection test as required by Firebase integration guidelines
export async function testConnection(): Promise<boolean> {
  try {
    const testRef = doc(db, 'test', 'connection');
    await setDoc(testRef, {
      status: 'online',
      connectedAt: new Date().toISOString(),
      store: 'Mochi Steps Luxury Footwear'
    }, { merge: true });
    await getDocFromServer(testRef);
    console.log('[Firestore] Successfully verified connection to Google Cloud Firestore!');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[Firestore] Client is offline or Firestore config issue:', error);
    } else {
      console.warn('[Firestore] Connection probe warning:', error);
    }
    return false;
  }
}

// Test connection on boot
testConnection();
