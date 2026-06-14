import firebaseConfig from './firebase-applet-config.json';

const projectId = firebaseConfig.projectId;
const customDbId = firebaseConfig.firestoreDatabaseId;

async function fetchDb() {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${customDbId}/documents/observations?key=${firebaseConfig.apiKey}`;
  console.log(`Fetching from: ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`--- Result for ${customDbId} ---`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error fetching:`, err);
  }
}

fetchDb();
