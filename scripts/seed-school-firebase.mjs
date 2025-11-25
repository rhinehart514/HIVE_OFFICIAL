/**
 * Seed script using Firebase Client SDK (rules now allow writes)
 * Run with: node scripts/seed-school-firebase.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDMDHXJ8LcWGXz05ipPTNvA-fRi9nfdzbQ",
  authDomain: "hive-9265c.firebaseapp.com",
  databaseURL: "https://hive-9265c-default-rtdb.firebaseio.com",
  projectId: "hive-9265c",
  storageBucket: "hive-9265c.appspot.com",
  messagingSenderId: "573191826528",
  appId: "1:573191826528:web:1d5eaeb8531276e4c1a705",
  measurementId: "G-NK3E12MSFD"
};

console.log('Initializing Firebase with project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedSchool() {
  console.log('\nSeeding UB Buffalo school document...\n');

  const schoolData = {
    id: 'ub-buffalo',
    name: 'University at Buffalo',
    domain: 'buffalo.edu',
    active: true,
    campusId: 'ub-buffalo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      allowedEmailDomains: ['buffalo.edu'],
      features: {
        spaces: true,
        rituals: true,
        hiveLab: true
      }
    }
  };

  try {
    const schoolRef = doc(db, 'schools', 'ub-buffalo');
    await setDoc(schoolRef, schoolData, { merge: true });
    console.log('✅ Created school: ub-buffalo');
    console.log(JSON.stringify(schoolData, null, 2));
    console.log('\n✅ School seeding complete!');
    console.log('\n⚠️  IMPORTANT: Remember to revert the Firestore rules!');
    console.log('   Run: mv firestore.rules.backup firestore.rules');
    console.log('   Then: firebase deploy --only firestore:rules');
  } catch (error) {
    console.error('❌ Failed to create school:', error);
    process.exit(1);
  }
}

seedSchool()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
