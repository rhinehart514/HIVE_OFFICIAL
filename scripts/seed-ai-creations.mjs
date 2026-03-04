#!/usr/bin/env node
/**
 * AI Space Seeding Script — Day 0 Launch Prep
 *
 * Generates 1-3 contextual creations (polls, brackets, RSVPs) for the
 * top spaces by member count. Makes the campus feel alive before any
 * student opens the app.
 *
 * Run with: node scripts/seed-ai-creations.mjs
 *
 * Options:
 *   --limit N     Max spaces to seed (default: 50)
 *   --per-space N Creations per space (default: 1, max: 3)
 *   --dry-run     Preview without creating
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse args
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
};
const LIMIT = parseInt(getArg('limit') || '50', 10);
const PER_SPACE = Math.min(parseInt(getArg('per-space') || '1', 10), 3);
const DRY_RUN = args.includes('--dry-run');

// Load env
const envPath = join(__dirname, '..', 'apps', 'web', '.env.local');
let envContent;
try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (error) {
  console.error('Could not read .env.local file:', error.message);
  process.exit(1);
}

const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

// Init Firebase Admin
const serviceAccountJson = env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);
const projectId = serviceAccount.project_id;

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`,
});

const db = getFirestore();
const rtdb = getDatabase();

// Groq API
const GROQ_API_KEY = env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('GROQ_API_KEY not found in .env.local');
  process.exit(1);
}

const SYSTEM_USER = 'hive-system';

// ============================================================================
// AI GENERATION (inline — no TS imports in .mjs)
// ============================================================================

async function generateCreation(space) {
  const spaceInfo = [
    `Space name: "${space.name}"`,
    space.description ? `Description: "${space.description}"` : null,
    space.type ? `Type: ${space.type}` : null,
    space.category ? `Category: ${space.category}` : null,
  ].filter(Boolean).join('\n');

  const prompt = `You are a creation generator for HIVE, a campus social platform. Given a student organization or space, generate ONE interactive creation.

Choose the BEST format:
- "poll": Question with 2-6 options. Best for opinions, preferences.
- "bracket": Tournament with 4-16 entries. Best for rankings, favorites.
- "rsvp": Event attendance tracker. Best for meetings, activities.

${spaceInfo}

RULES:
- Make it specific to the space
- Casual, fun language for college students
- For polls: debatable question
- For brackets: entries members have strong opinions about
- For RSVP: realistic event the space might host

Return JSON:
{
  "shellFormat": "poll" | "bracket" | "rsvp",
  "title": "short catchy name",
  "description": "one sentence",
  "config": { ... format-specific config }
}

For poll config: { "question": "...", "options": ["...", "..."] }
For bracket config: { "topic": "...", "entries": ["...", "...", "...", "..."] }
For rsvp config: { "title": "...", "location": "...", "description": "..." }`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Generate one creation for "${space.name}".` },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

// ============================================================================
// SHELL STATE BUILDERS
// ============================================================================

function buildInitialState(format, config) {
  switch (format) {
    case 'poll':
      return {
        votes: {},
        voteCounts: (config.options || []).map(() => 0),
        closed: false,
      };
    case 'bracket': {
      const entries = config.entries || [];
      const matchups = [];
      for (let i = 0; i < entries.length; i += 2) {
        if (i + 1 < entries.length) {
          matchups.push({
            id: `r1-m${Math.floor(i / 2)}`,
            round: 1,
            entryA: entries[i],
            entryB: entries[i + 1],
            votes: {},
          });
        }
      }
      return {
        matchups,
        currentRound: 1,
        totalRounds: Math.ceil(Math.log2(entries.length)),
        completed: false,
      };
    }
    case 'rsvp':
      return { attendees: {}, count: 0 };
    default:
      return {};
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(`\n🐝 HIVE AI Space Seeding`);
  console.log(`   Limit: ${LIMIT} spaces, ${PER_SPACE} creation(s) per space`);
  if (DRY_RUN) console.log('   🔍 DRY RUN — no data will be written\n');
  else console.log('');

  // 1. Get top spaces by member count
  const spacesSnapshot = await db
    .collection('spaces')
    .orderBy('memberCount', 'desc')
    .limit(LIMIT)
    .get();

  console.log(`Found ${spacesSnapshot.size} spaces\n`);

  let created = 0;
  let failed = 0;

  for (const spaceDoc of spacesSnapshot.docs) {
    const space = { id: spaceDoc.id, ...spaceDoc.data() };

    // Skip already-seeded spaces
    if (space.metadata?.autoSeededAt) {
      console.log(`⏭  ${space.name} — already seeded`);
      continue;
    }

    for (let i = 0; i < PER_SPACE; i++) {
      try {
        console.log(`🤖 Generating for "${space.name}"...`);
        const creation = await generateCreation(space);

        if (!creation || !creation.shellFormat || !creation.config) {
          console.log(`   ❌ Invalid response, skipping`);
          failed++;
          continue;
        }

        console.log(`   📋 ${creation.shellFormat}: "${creation.title}"`);

        if (DRY_RUN) {
          console.log(`   🔍 Would create: ${JSON.stringify(creation.config)}`);
          created++;
          continue;
        }

        const now = new Date();

        // Create tool doc
        const toolRef = await db.collection('tools').add({
          name: creation.title,
          description: creation.description || null,
          type: 'shell',
          shellFormat: creation.shellFormat,
          shellConfig: creation.config,
          status: 'published',
          visibility: 'public',
          ownerId: SYSTEM_USER,
          campusId: space.campusId || 'ub',
          elements: [],
          connections: [],
          createdAt: now,
          updatedAt: now,
          viewCount: 0,
          useCount: 0,
          metadata: {
            toolType: 'shell',
            aiGenerated: true,
            autoSeededAt: now.toISOString(),
          },
          provenance: {
            creatorId: SYSTEM_USER,
            createdAt: now.toISOString(),
            lineage: [],
            forkCount: 0,
            deploymentCount: 1,
            trustTier: 'system',
          },
        });

        // Write RTDB state
        await rtdb.ref(`shell_states/${toolRef.id}`).set(
          buildInitialState(creation.shellFormat, creation.config)
        );

        // Create placement
        const deploymentId = `ai_seed_${Date.now()}_${i}`;
        await db.collection('spaces').doc(space.id)
          .collection('placed_tools').doc(`${deploymentId}_${toolRef.id}`).set({
            toolId: toolRef.id,
            placement: 'sidebar',
            order: 0,
            isActive: true,
            source: 'ai_seed',
            placedBy: SYSTEM_USER,
            placedAt: now,
            visibility: 'all',
          });

        // Create deployedTools record
        await db.collection('deployedTools').doc(`${deploymentId}_${toolRef.id}`).set({
          toolId: toolRef.id,
          deployedBy: SYSTEM_USER,
          deployedTo: 'space',
          targetId: space.id,
          surface: 'tools',
          status: 'published',
          deployedAt: now.toISOString(),
          usageCount: 0,
          targetType: 'space',
          creatorId: SYSTEM_USER,
          spaceId: space.id,
          campusId: space.campusId || 'ub',
          shellFormat: creation.shellFormat,
        });

        // Mark space as seeded
        await db.collection('spaces').doc(space.id).update({
          'metadata.autoSeededAt': now.toISOString(),
        });

        console.log(`   ✅ Created: ${toolRef.id}`);
        created++;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failed++;
      }
    }
  }

  console.log(`\n✨ Done! Created: ${created}, Failed: ${failed}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
