import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

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
const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');

initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
  projectId
});

const db = getFirestore();

async function getSummary() {
  const snapshot = await db.collection('spaces').get();
  
  console.log('='.repeat(60));
  console.log('FIRESTORE SPACES SUMMARY');
  console.log('='.repeat(60));
  console.log('Total spaces:', snapshot.size);
  
  // Categorize by type
  const byType = {};
  const withPosts = [];
  const withMembers = [];
  let totalPosts = 0;
  let totalMembers = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const type = data.type || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
    
    // Check subcollections
    const subcollections = await doc.ref.listCollections();
    for (const subcol of subcollections) {
      const count = (await subcol.count().get()).data().count;
      if (subcol.id === 'posts' && count > 0) {
        withPosts.push({ id: doc.id, name: data.name, count });
        totalPosts += count;
      }
      if (subcol.id === 'members' && count > 0) {
        withMembers.push({ id: doc.id, name: data.name, count });
        totalMembers += count;
      }
    }
  }
  
  console.log('\n--- BY TYPE ---');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  console.log('\n--- CONTENT STATS ---');
  console.log(`Total posts across all spaces: ${totalPosts}`);
  console.log(`Total member records: ${totalMembers}`);
  console.log(`Spaces with posts: ${withPosts.length}`);
  console.log(`Spaces with members: ${withMembers.length}`);
  
  console.log('\n--- TOP 10 SPACES BY POST COUNT ---');
  withPosts.sort((a, b) => b.count - a.count).slice(0, 10).forEach((s, i) => {
    console.log(`  ${i+1}. ${s.name} (${s.count} posts)`);
  });
  
  console.log('\n--- ALL SPACE NAMES ---');
  const names = snapshot.docs.map(d => d.data().name).sort();
  names.forEach(n => console.log(`  - ${n}`));
}

getSummary().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
