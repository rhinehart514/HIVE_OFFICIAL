/**
 * CampusLabs School Registry
 *
 * Configuration for known CampusLabs/Engage instances.
 * Each school needs branch ID → HIVE category mappings.
 *
 * To add a new school:
 * 1. Visit https://{subdomain}.campuslabs.com/engage/organizations
 * 2. Open Network tab, find the search/organizations API call
 * 3. Note the BranchId values in the response
 * 4. Add entry below with appropriate mappings
 */

export type HiveSpaceCategory = 'student_org' | 'university_org' | 'greek_life' | 'residential';

export interface SchoolConfig {
  /** CampusLabs subdomain (e.g., "buffalo" for buffalo.campuslabs.com) */
  subdomain: string;
  /** HIVE campus ID */
  campusId: string;
  /** Human-readable name */
  name: string;
  /** School abbreviation */
  abbreviation: string;
  /** Branch ID → HIVE category mapping */
  branchMapping: Record<number, HiveSpaceCategory>;
  /** Estimated org count (for progress reporting) */
  estimatedOrgs?: number;
  /** Notes about this school's setup */
  notes?: string;
}

/**
 * Registry of known CampusLabs schools
 *
 * To discover branch IDs for a new school:
 * 1. Open browser dev tools
 * 2. Go to https://{school}.campuslabs.com/engage/organizations
 * 3. Watch Network tab for: /api/discovery/search/organizations?top=0&facets...
 * 4. Response contains BranchId facets with counts
 */
export const CAMPUSLABS_SCHOOLS: Record<string, SchoolConfig> = {
  // ============================================
  // NEW YORK STATE
  // ============================================

  buffalo: {
    subdomain: 'buffalo',
    campusId: 'ub-buffalo',
    name: 'University at Buffalo',
    abbreviation: 'UB',
    branchMapping: {
      1419: 'student_org',      // Student Organizations (555)
      360210: 'university_org', // University Departments (73)
      360211: 'greek_life',     // Fraternity & Sorority Life (18)
      360212: 'residential',    // Campus Living (21)
    },
    estimatedOrgs: 667,
    notes: 'Primary pilot school. Full branch mapping verified Jan 2026.',
  },

  // ============================================
  // TEMPLATE FOR NEW SCHOOLS
  // ============================================

  /*
  example: {
    subdomain: 'example',
    campusId: 'example-main',
    name: 'Example University',
    abbreviation: 'EU',
    branchMapping: {
      // Discover these by checking the API facets:
      // GET /engage/api/discovery/search/organizations?top=0&facets[0]=BranchId,count:100
      // 12345: 'student_org',
      // 12346: 'university_org',
      // 12347: 'greek_life',
      // 12348: 'residential',
    },
    estimatedOrgs: 0,
    notes: 'TODO: Verify branch mappings',
  },
  */
};

/**
 * Get school config by subdomain or campus ID
 */
export function getSchoolConfig(identifier: string): SchoolConfig | undefined {
  // Try subdomain first
  if (CAMPUSLABS_SCHOOLS[identifier]) {
    return CAMPUSLABS_SCHOOLS[identifier];
  }

  // Try campus ID
  return Object.values(CAMPUSLABS_SCHOOLS).find(
    school => school.campusId === identifier
  );
}

/**
 * List all configured schools
 */
export function listSchools(): SchoolConfig[] {
  return Object.values(CAMPUSLABS_SCHOOLS);
}

/**
 * Check if a subdomain is likely a CampusLabs instance
 * (Does a quick API probe)
 */
export async function probeCampusLabs(subdomain: string): Promise<{
  valid: boolean;
  orgCount?: number;
  branches?: Array<{ id: number; name: string; count: number }>;
  error?: string;
}> {
  try {
    const url = `https://${subdomain}.campuslabs.com/engage/api/discovery/search/organizations?top=0&facets[0]=BranchId,count:100`;
    const response = await fetch(url);

    if (!response.ok) {
      return { valid: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const orgCount = data['@odata.count'];
    const branchFacets = data['@search.facets']?.BranchId || [];

    // Fetch branch names
    const branchIds = branchFacets.map((f: { value: number }) => f.value);
    const branchUrl = new URL(`https://${subdomain}.campuslabs.com/engage/api/discovery/branch`);
    branchUrl.searchParams.set('take', '50');
    branchIds.forEach((id: number, i: number) => {
      branchUrl.searchParams.set(`orgIds[${i}]`, String(id));
    });

    const branchResponse = await fetch(branchUrl.toString());
    const branchData = await branchResponse.json();
    const branchMap = new Map(branchData.items?.map((b: { id: number; name: string }) => [b.id, b.name]) || []);

    const branches = branchFacets.map((f: { value: number; count: number }) => ({
      id: f.value,
      name: branchMap.get(f.value) || `Branch ${f.value}`,
      count: f.count,
    }));

    return { valid: true, orgCount, branches };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// CLI FOR DISCOVERY
// ============================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === 'list') {
    console.log('\n📚 Configured CampusLabs Schools:\n');
    listSchools().forEach(school => {
      console.log(`  ${school.abbreviation.padEnd(6)} ${school.name}`);
      console.log(`         Subdomain: ${school.subdomain}`);
      console.log(`         Campus ID: ${school.campusId}`);
      console.log(`         Branches: ${Object.keys(school.branchMapping).length}`);
      console.log(`         Est. Orgs: ${school.estimatedOrgs || 'Unknown'}`);
      console.log('');
    });
  } else if (args[0] === 'probe' && args[1]) {
    const subdomain = args[1];
    console.log(`\n🔍 Probing ${subdomain}.campuslabs.com...\n`);

    probeCampusLabs(subdomain).then(result => {
      if (result.valid) {
        console.log(`✅ Valid CampusLabs instance!`);
        console.log(`   Organizations: ${result.orgCount}`);
        console.log(`   Branches:`);
        result.branches?.forEach(b => {
          console.log(`     - ${b.name} (ID: ${b.id}, Count: ${b.count})`);
        });
        console.log('\n📝 Add to CAMPUSLABS_SCHOOLS with branch mappings:');
        console.log(`
  ${subdomain}: {
    subdomain: '${subdomain}',
    campusId: '${subdomain}-main', // Update this
    name: 'University Name', // Update this
    abbreviation: 'XX', // Update this
    branchMapping: {`);
        result.branches?.forEach(b => {
          const suggestedCategory = suggestCategory(b.name);
          console.log(`      ${b.id}: '${suggestedCategory}', // ${b.name} (${b.count})`);
        });
        console.log(`    },
    estimatedOrgs: ${result.orgCount},
  },`);
      } else {
        console.log(`❌ Not a valid CampusLabs instance: ${result.error}`);
      }
    });
  } else {
    console.log(`
Usage:
  npx ts-node scripts/scrapers/campuslabs-schools.ts list
  npx ts-node scripts/scrapers/campuslabs-schools.ts probe <subdomain>

Examples:
  npx ts-node scripts/scrapers/campuslabs-schools.ts probe nyu
  npx ts-node scripts/scrapers/campuslabs-schools.ts probe stanford
`);
  }
}

/**
 * Suggest HIVE category based on branch name
 */
function suggestCategory(branchName: string): HiveSpaceCategory {
  const name = branchName.toLowerCase();

  if (name.includes('greek') || name.includes('fraternity') || name.includes('sorority')) {
    return 'greek_life';
  }
  if (name.includes('residence') || name.includes('housing') || name.includes('living') || name.includes('dorm')) {
    return 'residential';
  }
  if (name.includes('department') || name.includes('office') || name.includes('university') || name.includes('admin')) {
    return 'university_org';
  }
  return 'student_org';
}
