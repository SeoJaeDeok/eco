import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testSdk() {
  console.log(`Testing Firestore SDK Connection to database: ${firebaseConfig.firestoreDatabaseId}...`);
  try {
    const snapshot = await getDocs(collection(db, 'observations'));
    console.log(`Success! Fetched ${snapshot.size} documents.`);
    snapshot.forEach(doc => {
      console.log(`- Document ID: ${doc.id}`, doc.data());
    });
  } catch (error: any) {
    console.error('SDK Fetch Error:', error);
  }
}

testSdk();
