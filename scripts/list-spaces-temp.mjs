import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Load env file
const envPath = './apps/web/.env.local';
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const projectId = envVars.FIREBASE_PROJECT_ID;
const clientEmail = envVars.FIREBASE_CLIENT_EMAIL;
const privateKeyBase64 = envVars.FIREBASE_PRIVATE_KEY_BASE64;

if (!projectId || !clientEmail || !privateKeyBase64) {
  console.error('Missing Firebase credentials');
  process.exit(1);
}

const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');

initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey
  }),
  projectId
});

const db = getFirestore();

async function getSpaces() {
  const snapshot = await db.collection('spaces').get();
  console.log('Total spaces:', snapshot.size);
  console.log('\n--- SPACES DATA ---\n');
  
  for (const doc of snapshot.docs) {
    console.log('='.repeat(80));
    console.log('ID:', doc.id);
    const data = doc.data();
    console.log(JSON.stringify(data, null, 2));
    
    // Check for subcollections
    const subcollections = await doc.ref.listCollections();
    if (subcollections.length > 0) {
      console.log('\nSubcollections:', subcollections.map(c => c.id).join(', '));
      for (const subcol of subcollections) {
        const subDocs = await subcol.get();
        console.log('  ' + subcol.id + ':', subDocs.size, 'documents');
        
        // Show first few docs from each subcollection
        if (subDocs.size > 0 && subDocs.size <= 20) {
          for (const subDoc of subDocs.docs) {
            console.log('    -', subDoc.id + ':', JSON.stringify(subDoc.data()).substring(0, 300));
          }
        }
      }
    }
    console.log('');
  }
}

getSpaces().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
