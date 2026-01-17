#!/usr/bin/env ts-node

/**
 * Dev/Staging Database Seed Script
 * Seeds essential data for development and staging environments
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();
const auth = getAuth();

interface SeedSchool {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'waitlist';
  waitlistCount: number;
  location: {
    city: string;
    state: string;
    country: string;
  };
  colors: {
    primary: string;
    secondary: string;
  };
}

interface SeedUser {
  uid: string;
  email: string;
  fullName: string;
  handle: string;
  major: string;
  schoolId: string;
  isBuilder: boolean;
}

const SEED_SCHOOLS: SeedSchool[] = [
  {
    id: 'ub',
    name: 'University at Buffalo',
    domain: 'buffalo.edu',
    status: 'active',
    waitlistCount: 0,
    location: {
      city: 'Buffalo',
      state: 'NY',
      country: 'USA'
    },
    colors: {
      primary: '#005BBB',
      secondary: '#FFD700'
    }
  },
  {
    id: 'cornell',
    name: 'Cornell University',
    domain: 'cornell.edu',
    status: 'waitlist',
    waitlistCount: 127,
    location: {
      city: 'Ithaca',
      state: 'NY',
      country: 'USA'
    },
    colors: {
      primary: '#B31B1B',
      secondary: '#FFFFFF'
    }
  },
  {
    id: 'columbia',
    name: 'Columbia University',
    domain: 'columbia.edu',
    status: 'waitlist',
    waitlistCount: 89,
    location: {
      city: 'New York',
      state: 'NY',
      country: 'USA'
    },
    colors: {
      primary: '#B9D9EB',
      secondary: '#FFFFFF'
    }
  },
  {
    id: 'nyu',
    name: 'New York University',
    domain: 'nyu.edu',
    status: 'waitlist',
    waitlistCount: 156,
    location: {
      city: 'New York',
      state: 'NY',
      country: 'USA'
    },
    colors: {
      primary: '#57068C',
      secondary: '#FFFFFF'
    }
  },
  {
    id: 'rit',
    name: 'Rochester Institute of Technology',
    domain: 'rit.edu',
    status: 'waitlist',
    waitlistCount: 73,
    location: {
      city: 'Rochester',
      state: 'NY',
      country: 'USA'
    },
    colors: {
      primary: '#F76902',
      secondary: '#513127'
    }
  }
];

const SEED_USERS: SeedUser[] = [
  {
    uid: 'dev-admin-001',
    email: 'admin@buffalo.edu',
    fullName: 'Admin User',
    handle: 'admin',
    major: 'Computer Science',
    schoolId: 'ub',
    isBuilder: true
  },
  {
    uid: 'dev-builder-001',
    email: 'builder@buffalo.edu',
    fullName: 'Builder Demo',
    handle: 'builder_demo',
    major: 'Engineering Physics',
    schoolId: 'ub',
    isBuilder: true
  },
  {
    uid: 'dev-user-001',
    email: 'student1@buffalo.edu',
    fullName: 'Jane Smith',
    handle: 'jane_smith',
    major: 'Psychology',
    schoolId: 'ub',
    isBuilder: false
  },
  {
    uid: 'dev-user-002',
    email: 'student2@buffalo.edu',
    fullName: 'Mike Johnson',
    handle: 'mike_j',
    major: 'Business Administration',
    schoolId: 'ub',
    isBuilder: false
  }
];

async function seedSchools() {
  console.log('🏫 Seeding schools...');
  
  for (const school of SEED_SCHOOLS) {
    await db.collection('schools').doc(school.id).set({
      name: school.name,
      domain: school.domain,
      status: school.status,
      waitlistCount: school.waitlistCount,
      location: school.location,
      colors: school.colors,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`  ✓ Created school: ${school.name}`);
  }
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  for (const user of SEED_USERS) {
    try {
      // Create Auth user
      await auth.createUser({
        uid: user.uid,
        email: user.email,
        displayName: user.fullName,
        emailVerified: true
      });
      
      // Set custom claims for admin/builder roles
      const customClaims: any = {};
      if (user.handle === 'admin') {
        customClaims.admin = true;
      }
      if (user.isBuilder) {
        customClaims.builder = true;
      }
      
      if (Object.keys(customClaims).length > 0) {
        await auth.setCustomUserClaims(user.uid, customClaims);
      }
      
      // Create Firestore user document
      await db.collection('users').doc(user.uid).set({
        id: user.uid,
        uid: user.uid,
        email: user.email,
        fullName: user.fullName,
        handle: user.handle,
        major: user.major,
        schoolId: user.schoolId,
        isPublic: true,
        consentGiven: true,
        builderOptIn: user.isBuilder,
        isBuilder: user.isBuilder,
        onboardingCompleted: true,
        isVerified: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date()
      });
      
      // Reserve handle
      await db.collection('handles').doc(user.handle).set({
        handle: user.handle,
        userId: user.uid,
        reservedAt: new Date()
      });
      
      console.log(`  ✓ Created user: ${user.fullName} (${user.email})`);
      
    } catch (error: any) {
      if (error.code === 'auth/uid-already-exists') {
        console.log(`  ⚠ User ${user.email} already exists, skipping...`);
      } else {
        console.error(`  ✗ Error creating user ${user.email}:`, error.message);
      }
    }
  }
}

async function seedSpaces() {
  console.log('🏠 Seeding default spaces...');

  const spaces = [
    {
      id: 'ub-computer-science',
      name: 'Computer Science Majors',
      slug: 'cs-majors',
      description: 'Connect with fellow CS students, share projects, and discuss the latest in tech.',
      type: 'academic',
      category: 'academic',
      subType: 'major',
      schoolId: 'ub',
      campusId: 'ub-buffalo',
      memberCount: 2,
      isPublic: true,
      isActive: true,
      status: 'active'
    },
    {
      id: 'ub-psychology',
      name: 'Psychology Majors',
      slug: 'psych-majors',
      description: 'A space for psychology students to discuss research, career paths, and mental health.',
      type: 'academic',
      category: 'academic',
      subType: 'major',
      schoolId: 'ub',
      campusId: 'ub-buffalo',
      memberCount: 1,
      isPublic: true,
      isActive: true,
      status: 'active'
    },
    {
      id: 'ub-business',
      name: 'Business Administration',
      slug: 'business-admin',
      description: 'Network with business students, share internship opportunities, and discuss entrepreneurship.',
      type: 'academic',
      category: 'academic',
      subType: 'major',
      schoolId: 'ub',
      campusId: 'ub-buffalo',
      memberCount: 1,
      isPublic: true,
      isActive: true,
      status: 'active'
    },
    {
      id: 'ub-study-group',
      name: 'Late Night Study Group',
      slug: 'late-night-study',
      description: 'For night owls who prefer studying after hours. Share tips and motivate each other!',
      type: 'interest',
      category: 'interest',
      subType: 'study',
      schoolId: 'ub',
      campusId: 'ub-buffalo',
      memberCount: 0,
      isPublic: true,
      isActive: true,
      status: 'active'
    },
    // Demo Entrepreneurship Club for HiveLab testing
    {
      id: 'ub-entrepreneurship-club',
      name: 'Entrepreneurship Club',
      slug: 'entrepreneurship-club',
      description: 'Where student founders connect, pitch ideas, and build startups. Demo space for HiveLab testing.',
      type: 'student_org',
      category: 'student_org',
      schoolId: 'ub',
      campusId: 'ub-buffalo',
      memberCount: 5,
      isPublic: true,
      visibility: 'public',
      status: 'active',
      publishStatus: 'live',
      source: 'user-created',
      tags: ['entrepreneurship', 'startups', 'business', 'innovation', 'demo'],
      governanceModel: 'hierarchical',
      spaceType: 'student',
      setupProgress: {
        welcomeMessagePosted: true,
        firstToolDeployed: true,
        coLeaderInvited: false,
        minimumMembersTarget: 10,
        isComplete: false
      },
      placedTools: [],  // Will be populated by seedDemoTools()
      tabs: [
        { id: 'general', name: 'General', type: 'chat', order: 0 },
        { id: 'pitch-practice', name: 'Pitch Practice', type: 'chat', order: 1 },
        { id: 'resources', name: 'Resources', type: 'resources', order: 2 },
        { id: 'events', name: 'Events', type: 'events', order: 3 }
      ],
      widgets: [],
      leaderRequests: [],
      members: [
        { profileId: 'dev-admin-001', role: 'owner', joinedAt: new Date() },
        { profileId: 'dev-builder-001', role: 'admin', joinedAt: new Date() },
        { profileId: 'dev-user-001', role: 'member', joinedAt: new Date() },
        { profileId: 'dev-user-002', role: 'member', joinedAt: new Date() }
      ]
    }
  ];
  
  for (const space of spaces) {
    await db.collection('spaces').doc(space.id).set({
      ...space,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`  ✓ Created space: ${space.name}`);
  }
}

async function seedDemoTools() {
  console.log('🔧 Seeding demo tools for Entrepreneurship Club...');

  const spaceId = 'ub-entrepreneurship-club';

  // Demo tools for testing HiveLab
  const demoTools = [
    {
      id: 'demo-pitch-timer',
      name: 'Pitch Timer',
      description: 'A 2-minute countdown timer for elevator pitch practice',
      type: 'visual',
      status: 'published',
      visibility: 'campus',
      category: 'productivity',
      creatorId: 'dev-builder-001',
      creatorName: 'Builder Demo',
      campusId: 'ub-buffalo',
      currentVersion: 1,
      elements: [
        {
          elementId: 'countdown-timer',
          instanceId: 'pitch-timer',
          config: {
            duration: 120,
            showControls: true,
            autoStart: false,
            celebrateOnComplete: true
          },
          position: { x: 50, y: 50 },
          size: { width: 300, height: 200 }
        },
        {
          elementId: 'heading',
          instanceId: 'title',
          config: {
            text: 'Elevator Pitch Timer',
            level: 1,
            align: 'center'
          },
          position: { x: 50, y: 10 },
          size: { width: 300, height: 40 }
        }
      ],
      connections: [],
      config: { layout: 'stack' },
      tags: ['timer', 'pitch', 'practice'],
      stats: { views: 45, uses: 23, deployments: 3 }
    },
    {
      id: 'demo-idea-poll',
      name: 'Startup Idea Vote',
      description: 'Vote on which startup ideas the club should explore this semester',
      type: 'visual',
      status: 'published',
      visibility: 'campus',
      category: 'engagement',
      creatorId: 'dev-builder-001',
      creatorName: 'Builder Demo',
      campusId: 'ub-buffalo',
      currentVersion: 1,
      elements: [
        {
          elementId: 'poll-element',
          instanceId: 'idea-vote',
          config: {
            question: 'Which startup idea should we explore?',
            options: [
              { id: 'opt1', text: 'AI Study Assistant' },
              { id: 'opt2', text: 'Campus Food Delivery' },
              { id: 'opt3', text: 'Student Housing Finder' },
              { id: 'opt4', text: 'Club Event Planner' }
            ],
            allowMultiple: false,
            showResults: true,
            anonymous: false
          },
          position: { x: 50, y: 50 },
          size: { width: 400, height: 300 }
        }
      ],
      connections: [],
      config: { layout: 'stack' },
      tags: ['poll', 'voting', 'ideas'],
      stats: { views: 120, uses: 89, deployments: 1 }
    },
    {
      id: 'demo-member-counter',
      name: 'Membership Goal Tracker',
      description: 'Track progress toward our 100 member goal',
      type: 'visual',
      status: 'published',
      visibility: 'campus',
      category: 'productivity',
      creatorId: 'dev-admin-001',
      creatorName: 'Admin User',
      campusId: 'ub-buffalo',
      currentVersion: 1,
      elements: [
        {
          elementId: 'counter',
          instanceId: 'member-count',
          config: {
            label: 'Members',
            value: 47,
            target: 100,
            showProgress: true,
            showPercentage: true,
            color: '#FFD700'
          },
          position: { x: 50, y: 50 },
          size: { width: 250, height: 180 }
        }
      ],
      connections: [],
      config: { layout: 'stack' },
      tags: ['counter', 'goals', 'membership'],
      stats: { views: 67, uses: 12, deployments: 2 }
    }
  ];

  // Create tools
  for (const tool of demoTools) {
    await db.collection('tools').doc(tool.id).set({
      ...tool,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`  ✓ Created tool: ${tool.name}`);
  }

  // Deploy tools to the Entrepreneurship Club space
  const placements = [
    {
      id: `${spaceId}_pitch-timer`,
      toolId: 'demo-pitch-timer',
      spaceId,
      placement: 'sidebar',
      visibility: 'all',
      isActive: true,
      order: 0,
      source: 'leader',
      placedBy: 'dev-admin-001'
    },
    {
      id: `${spaceId}_idea-poll`,
      toolId: 'demo-idea-poll',
      spaceId,
      placement: 'inline',
      visibility: 'members',
      isActive: true,
      order: 1,
      source: 'leader',
      placedBy: 'dev-admin-001'
    },
    {
      id: `${spaceId}_member-counter`,
      toolId: 'demo-member-counter',
      spaceId,
      placement: 'sidebar',
      visibility: 'all',
      isActive: true,
      order: 2,
      source: 'leader',
      placedBy: 'dev-admin-001'
    }
  ];

  for (const placement of placements) {
    await db.collection('tool_placements').doc(placement.id).set({
      ...placement,
      deployedAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`  ✓ Deployed ${placement.toolId} to ${spaceId}`);
  }

  // Update space with placed tools reference
  await db.collection('spaces').doc(spaceId).update({
    placedTools: placements.map(p => ({
      toolId: p.toolId,
      placementId: p.id,
      placement: p.placement,
      visibility: p.visibility,
      isActive: p.isActive
    }))
  });

  console.log(`  ✓ Updated space with ${placements.length} tool placements`);
}

async function main() {
  try {
    console.log('🌱 Starting database seed...\n');

    await seedSchools();
    console.log('');

    await seedUsers();
    console.log('');

    await seedSpaces();
    console.log('');

    await seedDemoTools();
    console.log('');

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📝 Seeded data:');
    console.log(`   • ${SEED_SCHOOLS.length} schools`);
    console.log(`   • ${SEED_USERS.length} users`);
    console.log('   • 5 spaces (including Entrepreneurship Club demo)');
    console.log('   • 3 demo tools deployed to Entrepreneurship Club');
    console.log('\n🔐 Admin credentials:');
    console.log('   Email: admin@buffalo.edu');
    console.log('   (Use magic link to sign in)');
    console.log('\n🚀 Demo space:');
    console.log('   /spaces/ub-entrepreneurship-club');
    console.log('   Has 3 HiveLab tools deployed for testing');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 