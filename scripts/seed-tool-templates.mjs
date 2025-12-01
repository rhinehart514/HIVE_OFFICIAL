#!/usr/bin/env node
/**
 * Seed Hero Tool Templates
 *
 * Creates featured tool templates that all space leaders can deploy.
 * Run with: node scripts/seed-tool-templates.mjs
 *
 * Templates:
 * 1. Weekly Poll - Engagement poll for spaces
 * 2. Event Registration - RSVP collection with capacity
 * 3. Study Group Finder - Match students for study sessions
 * 4. Quick Survey - Multi-question survey with results
 * 5. Resource Library - Curated links/resources for spaces
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

const CAMPUS_ID = 'ub-buffalo';
const SYSTEM_OWNER = 'system-templates';

// Define hero tool templates
const TOOL_TEMPLATES = [
  {
    id: 'template-weekly-poll',
    name: 'Weekly Poll',
    description: 'Engage your community with a quick poll. Great for gathering opinions and sparking discussion.',
    category: 'engagement',
    tags: ['polls', 'voting', 'engagement', 'weekly'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'poll-header',
        config: {
          fields: [
            { name: 'question', type: 'text', required: true, label: 'This week\'s question', defaultValue: 'What should we focus on this week?' }
          ]
        },
        position: { x: 0, y: 0 },
        size: { width: 12, height: 1 }
      },
      {
        elementId: 'poll-element',
        instanceId: 'poll-votes',
        config: {
          options: [
            { id: 'opt1', label: 'Option 1', votes: 0 },
            { id: 'opt2', label: 'Option 2', votes: 0 },
            { id: 'opt3', label: 'Option 3', votes: 0 },
            { id: 'opt4', label: 'Option 4', votes: 0 }
          ],
          allowMultiple: false,
          showResults: true,
          closesAt: null
        },
        position: { x: 0, y: 1 },
        size: { width: 12, height: 4 }
      },
      {
        elementId: 'result-list',
        instanceId: 'recent-voters',
        config: {
          title: 'Recent Votes',
          maxItems: 5,
          showTimestamp: true,
          emptyMessage: 'No votes yet - be the first!'
        },
        position: { x: 0, y: 5 },
        size: { width: 12, height: 3 }
      }
    ],
    config: { layout: 'stack', theme: 'dark' }
  },

  {
    id: 'template-event-registration',
    name: 'Event Registration',
    description: 'Collect RSVPs for your next event. Track attendees, dietary restrictions, and more.',
    category: 'events',
    tags: ['events', 'rsvp', 'registration', 'attendance'],
    elements: [
      {
        elementId: 'countdown-timer',
        instanceId: 'event-countdown',
        config: {
          title: 'Event starts in',
          targetDate: null, // Set when deployed
          showDays: true,
          showHours: true,
          showMinutes: true,
          showSeconds: false,
          completedMessage: 'Event has started!'
        },
        position: { x: 0, y: 0 },
        size: { width: 12, height: 2 }
      },
      {
        elementId: 'form-builder',
        instanceId: 'registration-form',
        config: {
          fields: [
            { name: 'name', type: 'text', required: true, label: 'Your Name' },
            { name: 'email', type: 'text', required: true, label: 'Email' },
            { name: 'dietary', type: 'select', required: false, label: 'Dietary Restrictions', options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Other'] },
            { name: 'plusOne', type: 'checkbox', required: false, label: 'Bringing a +1?' }
          ],
          submitLabel: 'Register Now',
          successMessage: 'You\'re registered!'
        },
        position: { x: 0, y: 2 },
        size: { width: 12, height: 5 }
      },
      {
        elementId: 'leaderboard',
        instanceId: 'attendee-count',
        config: {
          title: 'Registered Attendees',
          showRank: false,
          showScore: true,
          maxEntries: 50,
          emptyMessage: 'Be the first to register!'
        },
        position: { x: 0, y: 7 },
        size: { width: 12, height: 3 }
      }
    ],
    config: { layout: 'stack', theme: 'dark' }
  },

  {
    id: 'template-study-group-finder',
    name: 'Study Group Finder',
    description: 'Help members find study partners. Match by course, availability, and study style.',
    category: 'academic',
    tags: ['study', 'groups', 'academic', 'collaboration', 'matching'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'study-preferences',
        config: {
          fields: [
            { name: 'course', type: 'text', required: true, label: 'Course/Subject' },
            { name: 'availability', type: 'select', required: true, label: 'Best Time', options: ['Mornings', 'Afternoons', 'Evenings', 'Weekends', 'Flexible'] },
            { name: 'style', type: 'select', required: true, label: 'Study Style', options: ['Quiet Individual', 'Discussion-Based', 'Problem Solving', 'Teaching Others'] },
            { name: 'location', type: 'select', required: false, label: 'Preferred Location', options: ['Library', 'Student Union', 'Online/Zoom', 'Coffee Shop', 'Anywhere'] }
          ],
          submitLabel: 'Find Study Partners',
          successMessage: 'Added to study group matcher!'
        },
        position: { x: 0, y: 0 },
        size: { width: 12, height: 5 }
      },
      {
        elementId: 'user-selector',
        instanceId: 'potential-partners',
        config: {
          title: 'Potential Study Partners',
          allowMultiple: true,
          showStatus: true,
          maxSelections: 5,
          emptyMessage: 'No matches yet - be the first to sign up!'
        },
        position: { x: 0, y: 5 },
        size: { width: 12, height: 4 }
      },
      {
        elementId: 'result-list',
        instanceId: 'active-groups',
        config: {
          title: 'Active Study Groups',
          maxItems: 10,
          showTimestamp: true,
          emptyMessage: 'No active groups yet'
        },
        position: { x: 0, y: 9 },
        size: { width: 12, height: 3 }
      }
    ],
    config: { layout: 'stack', theme: 'dark' }
  },

  {
    id: 'template-quick-survey',
    name: 'Quick Survey',
    description: 'Gather structured feedback from your community. Multiple question types supported.',
    category: 'feedback',
    tags: ['survey', 'feedback', 'questions', 'data'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'survey-questions',
        config: {
          fields: [
            { name: 'q1', type: 'select', required: true, label: 'How satisfied are you with our events?', options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] },
            { name: 'q2', type: 'select', required: true, label: 'How often do you participate?', options: ['Weekly', 'Monthly', 'Occasionally', 'Rarely', 'First Time'] },
            { name: 'q3', type: 'textarea', required: false, label: 'What could we improve?' },
            { name: 'q4', type: 'text', required: false, label: 'Any event ideas?' }
          ],
          submitLabel: 'Submit Feedback',
          successMessage: 'Thanks for your feedback!'
        },
        position: { x: 0, y: 0 },
        size: { width: 12, height: 6 }
      },
      {
        elementId: 'chart-display',
        instanceId: 'survey-results',
        config: {
          chartType: 'pie',
          title: 'Satisfaction Overview',
          showLegend: true,
          animate: true
        },
        position: { x: 0, y: 6 },
        size: { width: 6, height: 4 }
      },
      {
        elementId: 'chart-display',
        instanceId: 'participation-chart',
        config: {
          chartType: 'bar',
          title: 'Participation Frequency',
          showLegend: false,
          animate: true
        },
        position: { x: 6, y: 6 },
        size: { width: 6, height: 4 }
      }
    ],
    config: { layout: 'grid', theme: 'dark' }
  },

  {
    id: 'template-resource-library',
    name: 'Resource Library',
    description: 'Curate and share useful resources. Perfect for study materials, links, and guides.',
    category: 'resources',
    tags: ['resources', 'links', 'library', 'materials', 'guides'],
    elements: [
      {
        elementId: 'search-input',
        instanceId: 'resource-search',
        config: {
          placeholder: 'Search resources...',
          searchType: 'instant',
          showIcon: true
        },
        position: { x: 0, y: 0 },
        size: { width: 12, height: 1 }
      },
      {
        elementId: 'filter-selector',
        instanceId: 'category-filter',
        config: {
          options: [
            { value: 'all', label: 'All' },
            { value: 'guides', label: 'Guides' },
            { value: 'videos', label: 'Videos' },
            { value: 'articles', label: 'Articles' },
            { value: 'tools', label: 'Tools' }
          ],
          allowMultiple: false,
          showCounts: true
        },
        position: { x: 0, y: 1 },
        size: { width: 12, height: 1 }
      },
      {
        elementId: 'result-list',
        instanceId: 'resource-list',
        config: {
          title: 'Resources',
          maxItems: 20,
          showTimestamp: true,
          showAuthor: true,
          emptyMessage: 'No resources added yet'
        },
        position: { x: 0, y: 2 },
        size: { width: 12, height: 6 }
      },
      {
        elementId: 'form-builder',
        instanceId: 'add-resource',
        config: {
          fields: [
            { name: 'title', type: 'text', required: true, label: 'Resource Title' },
            { name: 'url', type: 'text', required: true, label: 'Link (URL)' },
            { name: 'category', type: 'select', required: true, label: 'Category', options: ['Guides', 'Videos', 'Articles', 'Tools'] },
            { name: 'description', type: 'textarea', required: false, label: 'Description' }
          ],
          submitLabel: 'Add Resource',
          successMessage: 'Resource added!'
        },
        position: { x: 0, y: 8 },
        size: { width: 12, height: 4 }
      }
    ],
    config: { layout: 'stack', theme: 'dark' }
  }
];

async function seedToolTemplates() {
  console.log('=== Seeding Hero Tool Templates ===\n');

  const now = new Date().toISOString();
  let created = 0;
  let updated = 0;

  for (const template of TOOL_TEMPLATES) {
    console.log(`Processing: ${template.name}...`);

    const toolData = {
      name: template.name,
      description: template.description,
      status: 'published',
      type: 'visual',
      category: template.category,
      ownerId: SYSTEM_OWNER,
      campusId: CAMPUS_ID,
      currentVersion: '1.0.0',
      isPublic: true,
      elements: template.elements,
      config: template.config,
      metadata: {
        featured: true,
        isTemplate: true,
        templateOrder: TOOL_TEMPLATES.indexOf(template) + 1,
        tags: template.tags,
        rating: 5.0,
        useCount: 0,
        viewCount: 0,
        difficulty: 'beginner'
      },
      tags: template.tags,
      stats: {
        views: 0,
        uses: 0,
        likes: 0,
        installs: 0,
        shares: 0
      },
      createdAt: now,
      updatedAt: now
    };

    // Check if tool already exists
    const existing = await db.collection('tools').doc(template.id).get();

    if (existing.exists) {
      // Update existing
      await db.collection('tools').doc(template.id).update({
        ...toolData,
        createdAt: existing.data().createdAt // Preserve original creation date
      });
      updated++;
      console.log(`   Updated: ${template.id}`);
    } else {
      // Create new
      await db.collection('tools').doc(template.id).set(toolData);
      created++;
      console.log(`   Created: ${template.id}`);
    }
  }

  console.log('\n=== Done! ===');
  console.log(`Created: ${created} templates`);
  console.log(`Updated: ${updated} templates`);
  console.log('\nTemplates are now available in the tool marketplace.');
  console.log('Space leaders can find them by browsing tools with featured=true filter.');
  console.log('\nTo test:');
  console.log('1. Start dev server: pnpm --filter=@hive/web dev');
  console.log('2. Go to /tools and look for "Featured" templates');
  console.log('3. Deploy any template to a space');
}

seedToolTemplates().catch(console.error);
