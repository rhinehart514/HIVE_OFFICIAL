import { withAdminAuthAndErrors } from "@/lib/middleware";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { addSecureCampusMetadata } from "@/lib/secure-firebase-queries";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Space category type - the 4 official HIVE categories
 * Maps 1:1 with CampusLabs branch IDs
 */
type SpaceCategory = 'student_org' | 'university_org' | 'greek_life' | 'residential';

interface SeedSpace {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: SpaceCategory;
  isPrivate: boolean;
  tags: string[];
}

/**
 * Seed sample spaces for development
 * POST /api/spaces/seed
 *
 * - Development-only endpoint to quickly populate demo spaces
 * - Requires admin authentication
 * - Uses the 4 official HIVE categories: student_org, university_org, greek_life, residential
 */
export const POST = withAdminAuthAndErrors(async (_request, _context, respond) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return respond.error('Seeding is disabled in production', 'FORBIDDEN', { status: 403 });
    }

    const sampleSpaces: SeedSpace[] = [
      // Student Organizations
      {
        id: 'ub-computer-science',
        name: 'UB Computer Science Club',
        slug: 'ub-cs',
        description: 'Connect with CS majors, share projects, get study tips, and network with fellow programmers at UB. From algorithms to internships, we cover it all.',
        category: 'student_org',
        isPrivate: false,
        tags: ['cs', 'programming', 'stem']
      },
      {
        id: 'ub-engineering-hub',
        name: 'UB Engineering Society',
        slug: 'ub-engineering',
        description: 'All engineering disciplines unite! Share resources, discuss projects, find lab partners, and get career advice from fellow UB engineers.',
        category: 'student_org',
        isPrivate: false,
        tags: ['engineering', 'stem', 'projects']
      },
      {
        id: 'ub-pre-med-society',
        name: 'UB Pre-Med Society',
        slug: 'ub-premed',
        description: 'Future doctors assemble! Study together for the MCAT, share volunteer opportunities, discuss med school applications, and support each other.',
        category: 'student_org',
        isPrivate: false,
        tags: ['pre-med', 'healthcare', 'mcat']
      },
      {
        id: 'ub-business-network',
        name: 'UB Business Network',
        slug: 'ub-business',
        description: 'Business majors and entrepreneurs unite! Share internship opportunities, discuss case studies, network for future careers.',
        category: 'student_org',
        isPrivate: false,
        tags: ['business', 'networking', 'internships']
      },
      {
        id: 'ub-gaming-community',
        name: 'UB Gaming Community',
        slug: 'ub-gaming',
        description: 'Gamers of UB unite! Organize tournaments, find teammates, discuss new releases, and plan LAN parties.',
        category: 'student_org',
        isPrivate: false,
        tags: ['gaming', 'esports', 'social']
      },
      // Residential
      {
        id: 'governors-residence-hall',
        name: 'Governors Residence Hall',
        slug: 'governors-hall',
        description: 'For residents of Governors! Plan floor events, coordinate study sessions, share dining hall reviews, and stay connected with your neighbors.',
        category: 'residential',
        isPrivate: false,
        tags: ['dorms', 'governors', 'north-campus']
      },
      {
        id: 'ellicott-complex',
        name: 'Ellicott Complex',
        slug: 'ellicott',
        description: 'Home to thousands of UB students. Connect with your Ellicott neighbors, find study buddies, and stay in the loop on complex events.',
        category: 'residential',
        isPrivate: false,
        tags: ['dorms', 'ellicott', 'north-campus']
      },
      // Greek Life
      {
        id: 'ub-panhellenic',
        name: 'UB Panhellenic Council',
        slug: 'ub-panhel',
        description: 'The governing body for UB sororities. Stay updated on rush events, Greek Week, philanthropy, and sisterhood.',
        category: 'greek_life',
        isPrivate: false,
        tags: ['greek', 'sorority', 'panhellenic']
      },
      {
        id: 'ub-ifc',
        name: 'UB Interfraternity Council',
        slug: 'ub-ifc',
        description: 'The governing body for UB fraternities. Brotherhood, leadership, and service - find your chapter here.',
        category: 'greek_life',
        isPrivate: false,
        tags: ['greek', 'fraternity', 'ifc']
      },
      // University Organizations
      {
        id: 'ub-career-services',
        name: 'UB Career Services',
        slug: 'ub-careers',
        description: 'Official UB Career Services. Find internships, schedule resume reviews, attend career fairs, and prepare for your future.',
        category: 'university_org',
        isPrivate: false,
        tags: ['careers', 'internships', 'university']
      },
      {
        id: 'ub-student-affairs',
        name: 'UB Student Affairs',
        slug: 'ub-student-affairs',
        description: 'Official updates from UB Student Affairs. Campus resources, student support, and university announcements.',
        category: 'university_org',
        isPrivate: false,
        tags: ['university', 'official', 'support']
      }
    ];

    const batch = dbAdmin.batch();
    let created = 0;

    for (const space of sampleSpaces) {
      const ref = dbAdmin.collection('spaces').doc(space.id);
      const snap = await ref.get();
      if (!snap.exists) {
        batch.set(
          ref,
          addSecureCampusMetadata({
            // Core fields
            name: space.name,
            name_lowercase: space.name.toLowerCase(),
            slug: space.slug,
            description: space.description,
            category: space.category,

            // Status
            status: 'active',
            isActive: true,
            visibility: space.isPrivate ? 'private' : 'public',
            claimStatus: 'unclaimed', // Ready for real org to claim
            publishStatus: 'live', // Make visible in browse

            // Tags for discovery
            tags: space.tags,

            // Metadata
            createdBy: 'system',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),

            // Metrics (will be calculated from real data)
            metrics: {
              memberCount: 0,
              postCount: 0,
              eventCount: 0,
              toolCount: 0,
            },

            // No banner until claimed
            bannerUrl: null,
            logoUrl: null,
          })
        );
        created += 1;
      }
    }

    if (created > 0) {
      await batch.commit();
    }

    logger.info('Seeded spaces', { created, categories: { student_org: 5, residential: 2, greek_life: 2, university_org: 2 } });
    return respond.success({ created }, { message: `Seeded ${created} spaces across 4 categories` });
  } catch (error) {
    logger.error('Error seeding spaces', { error });
    return respond.error('Failed to seed spaces', 'INTERNAL_ERROR', { status: 500 });
  }
});

