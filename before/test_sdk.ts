import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function main() {
  try {
    console.log('Writing test document to observations without login...');
    const docRef = await addDoc(collection(db, 'observations'), {
      name: 'Test Bird SDK No-Auth',
      scientificName: 'Testus sdkus noauth',
      taxon: '조류',
      date: '2026-05-21',
      location: 'Test Location',
      coords: { lat: 37.5, lng: 127.0 },
      imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc',
      createdAt: new Date().toISOString()
    });
    console.log(`Document written with ID: ${docRef.id}`);

    console.log('Fetching observations...');
    const querySnapshot = await getDocs(collection(db, 'observations'));
    console.log(`Found ${querySnapshot.size} documents.`);
    querySnapshot.forEach(doc => {
      console.log(`ID: ${doc.id}, Name: ${doc.data().name}`);
    });
  } catch (err: any) {
    console.error('Error or Permission Denied in Web SDK without login:', err);
  }
}

main();
