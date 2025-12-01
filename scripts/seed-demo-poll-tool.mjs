#!/usr/bin/env node
/**
 * Seed script to create a demo Poll tool and deploy it to a space
 * Run with: node scripts/seed-demo-poll-tool.mjs
 *
 * This creates:
 * 1. A tool in the 'tools' collection with elements
 * 2. A deployment in 'deployedTools' collection
 * 3. A placement in 'placed_tools' collection (for space discovery)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env file
const envPath = join(__dirname, '..', 'apps', 'web', '.env.local');
let envContent;
try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (error) {
  console.error('Could not read .env.local file:', error.message);
  process.exit(1);
}

const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const privateKeyBase64 = envVars.FIREBASE_PRIVATE_KEY_BASE64;
const projectId = envVars.FIREBASE_PROJECT_ID || 'hive-9265c';
const clientEmail = envVars.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@hive-9265c.iam.gserviceaccount.com';

if (!privateKeyBase64) {
  console.error('FIREBASE_PRIVATE_KEY_BASE64 not found in .env.local');
  process.exit(1);
}

try {
  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId
  });
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  process.exit(1);
}

const db = getFirestore();

// Configuration - adjust these as needed
const CAMPUS_ID = 'ub-buffalo';
const TOOL_ID = 'demo-lunch-poll';
const SPACE_SLUG = 'entrepreneurship-club'; // or change to your test space

async function findSpace() {
  // Try to find space by slug
  const spacesSnapshot = await db
    .collection('spaces')
    .where('slug', '==', SPACE_SLUG)
    .where('campusId', '==', CAMPUS_ID)
    .limit(1)
    .get();

  if (!spacesSnapshot.empty) {
    return spacesSnapshot.docs[0];
  }

  // Fallback: find any active space
  const anySpaceSnapshot = await db
    .collection('spaces')
    .where('campusId', '==', CAMPUS_ID)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (!anySpaceSnapshot.empty) {
    return anySpaceSnapshot.docs[0];
  }

  return null;
}

async function findOwner(spaceDoc) {
  if (!spaceDoc) return null;

  const spaceData = spaceDoc.data();

  // Try to find the space leader
  const membersSnapshot = await db
    .collection('members')
    .where('spaceId', '==', spaceDoc.id)
    .where('role', 'in', ['owner', 'admin'])
    .limit(1)
    .get();

  if (!membersSnapshot.empty) {
    return membersSnapshot.docs[0].data().userId;
  }

  // Fallback to space creator
  return spaceData.createdBy || spaceData.ownerId || 'system';
}

async function seedDemoPollTool() {
  console.log('=== Seeding Demo Poll Tool ===\n');

  // Step 1: Find a space to deploy to
  console.log('1. Looking for a space to deploy to...');
  const spaceDoc = await findSpace();

  if (!spaceDoc) {
    console.error('   No space found. Please create a space first.');
    console.log('   You can run: node scripts/seed-entrepreneurship-club.mjs');
    process.exit(1);
  }

  const spaceId = spaceDoc.id;
  const spaceData = spaceDoc.data();
  console.log(`   Found space: ${spaceData.name} (${spaceId})`);

  // Step 2: Find tool owner
  console.log('\n2. Finding tool owner...');
  const ownerId = await findOwner(spaceDoc);
  console.log(`   Owner: ${ownerId}`);

  const now = new Date().toISOString();

  // Step 3: Create the tool document
  console.log('\n3. Creating tool document...');

  const toolData = {
    name: 'Lunch Poll',
    description: 'Vote on what to get for lunch today!',
    status: 'published',
    type: 'visual',
    category: 'polls',
    ownerId,
    campusId: CAMPUS_ID,
    currentVersion: '1.0.0',

    // Elements - these use the element IDs from element-system.ts
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'poll-question',
        config: {
          fields: [
            { name: 'question', type: 'text', required: true, label: 'Poll Question' }
          ]
        },
        position: { x: 0, y: 0 },
        size: { width: 12, height: 2 }
      },
      {
        elementId: 'filter-selector',
        instanceId: 'poll-options',
        config: {
          options: [
            { value: 'pizza', label: 'Pizza' },
            { value: 'sushi', label: 'Sushi' },
            { value: 'tacos', label: 'Tacos' },
            { value: 'salad', label: 'Salad' }
          ],
          allowMultiple: false,
          showCounts: true
        },
        position: { x: 0, y: 2 },
        size: { width: 12, height: 3 }
      },
      {
        elementId: 'chart-display',
        instanceId: 'poll-results',
        config: {
          chartType: 'bar',
          showLegend: true,
          animate: true
        },
        position: { x: 0, y: 5 },
        size: { width: 12, height: 4 }
      }
    ],

    // Tool configuration
    config: {
      layout: 'stack',
      theme: 'dark',
      backgroundColor: 'var(--hive-background-secondary)'
    },

    // Metadata
    metadata: {
      rating: 4.5,
      useCount: 0,
      viewCount: 0,
      tags: ['polls', 'voting', 'lunch', 'engagement']
    },

    createdAt: now,
    updatedAt: now
  };

  await db.collection('tools').doc(TOOL_ID).set(toolData);
  console.log(`   Created tool: ${TOOL_ID}`);

  // Step 4: Create deployment
  console.log('\n4. Creating deployment...');

  const deploymentId = `${TOOL_ID}_${spaceId}`;
  const deploymentData = {
    toolId: TOOL_ID,
    deployedBy: ownerId,
    deployedTo: 'space',
    targetType: 'space',
    targetId: spaceId,
    surface: 'tools',
    position: 1,
    config: {},
    permissions: {
      canInteract: true,
      canView: true,
      canEdit: false,
      allowedRoles: ['member', 'admin', 'owner']
    },
    status: 'active',
    deployedAt: now,
    usageCount: 0,
    settings: {
      showInDirectory: true,
      allowSharing: true,
      collectAnalytics: true,
      notifyOnInteraction: false
    },
    campusId: CAMPUS_ID
  };

  await db.collection('deployedTools').doc(deploymentId).set(deploymentData);
  console.log(`   Created deployment: ${deploymentId}`);

  // Step 5: Create placed_tools entry (for space widget discovery)
  console.log('\n5. Creating placed_tools entry...');

  const placedToolId = `space_${spaceId}_tools_${deploymentId}`;
  const placedToolData = {
    deploymentId,
    toolId: TOOL_ID,
    toolName: toolData.name,
    targetType: 'space',
    targetId: spaceId,
    surface: 'tools',
    position: 1,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    campusId: CAMPUS_ID
  };

  await db.collection('placed_tools').doc(placedToolId).set(placedToolData);
  console.log(`   Created placed_tools entry: ${placedToolId}`);

  // Summary
  console.log('\n=== Done! ===\n');
  console.log('To test the runtime:');
  console.log(`1. Start the dev server: pnpm dev`);
  console.log(`2. Go to the space: /spaces/${spaceId}`);
  console.log(`3. Click on "Lunch Poll" in the Tools widget`);
  console.log(`4. Or go directly to: /tools/${TOOL_ID}/run?spaceId=${spaceId}`);
  console.log('\nThe tool should render with:');
  console.log('- A form builder element');
  console.log('- A filter selector for voting');
  console.log('- A chart display for results');
}

seedDemoPollTool().catch(console.error);
