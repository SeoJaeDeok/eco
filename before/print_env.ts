console.log('Environment keys:');
for (const key of Object.keys(process.env)) {
  if (key.includes('GOOGLE') || key.includes('FIREBASE') || key.includes('GCP') || key.includes('CREDENTIALS') || key.includes('TOKEN')) {
    console.log(`${key}: ${process.env[key] ? 'PRESENT' : 'EMPTY'}`);
  }
}
