#!/usr/bin/env npx tsx
/**
 * CampusLabs Data Probe
 *
 * Exploratory script to see EXACTLY what data is available from CampusLabs.
 * Fetches full detail for organizations and events, outputs to JSON for review.
 *
 * Usage:
 *   pnpm exec tsx scripts/scrapers/campuslabs-probe.ts
 *   pnpm exec tsx scripts/scrapers/campuslabs-probe.ts --school nyu
 *   pnpm exec tsx scripts/scrapers/campuslabs-probe.ts --orgs-only
 *   pnpm exec tsx scripts/scrapers/campuslabs-probe.ts --events-only
 *   pnpm exec tsx scripts/scrapers/campuslabs-probe.ts --sample 5
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================
// CONFIGURATION
// ============================================

interface ProbeConfig {
  school: string;
  sampleSize: number;
  orgsOnly: boolean;
  eventsOnly: boolean;
  outputDir: string;
}

function parseArgs(): ProbeConfig {
  const args = process.argv.slice(2);

  const getArg = (name: string, defaultValue: string): string => {
    const index = args.indexOf(`--${name}`);
    if (index !== -1 && args[index + 1]) {
      return args[index + 1];
    }
    return defaultValue;
  };

  return {
    school: getArg('school', 'buffalo'),
    sampleSize: parseInt(getArg('sample', '3'), 10),
    orgsOnly: args.includes('--orgs-only'),
    eventsOnly: args.includes('--events-only'),
    outputDir: join(process.cwd(), 'scripts/scrapers/probe-output'),
  };
}

// ============================================
// API CLIENT
// ============================================

class CampusLabsProbe {
  private baseUrl: string;

  constructor(private school: string) {
    this.baseUrl = `https://${school}.campuslabs.com/engage/api/discovery`;
  }

  /**
   * Search organizations (returns minimal data)
   */
  async searchOrganizations(take: number = 10): Promise<any> {
    const url = `${this.baseUrl}/search/organizations?top=${take}&orderBy[0]=UpperName%20asc`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    return res.json();
  }

  /**
   * Get FULL organization detail (the good stuff)
   */
  async getOrganizationDetail(orgId: string): Promise<any> {
    const url = `${this.baseUrl}/organization/${orgId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Org detail failed: ${res.status}`);
    return res.json();
  }

  /**
   * Search events (returns minimal data)
   */
  async searchEvents(take: number = 10, upcomingOnly: boolean = true): Promise<any> {
    const url = new URL(`${this.baseUrl}/event/search`);
    url.searchParams.set('take', String(take));
    url.searchParams.set('status', 'Approved');
    url.searchParams.set('orderByField', 'startsOn');
    url.searchParams.set('orderByDirection', 'ascending');

    if (upcomingOnly) {
      url.searchParams.set('startsAfter', new Date().toISOString().split('T')[0]);
    }

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Event search failed: ${res.status}`);
    return res.json();
  }

  /**
   * Get FULL event detail
   */
  async getEventDetail(eventId: string): Promise<any> {
    const url = `${this.baseUrl}/event/${eventId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Event detail failed: ${res.status}`);
    return res.json();
  }

  /**
   * Get all branches (org types)
   */
  async getBranches(): Promise<any> {
    const url = `${this.baseUrl}/branch?take=100`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Branches failed: ${res.status}`);
    return res.json();
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<any> {
    const url = `${this.baseUrl}/organization/category?take=100`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Categories failed: ${res.status}`);
    return res.json();
  }

  /**
   * Get event categories (may not exist on all campuses)
   */
  async getEventCategories(): Promise<any> {
    const url = `${this.baseUrl}/event/category?take=100`;
    const res = await fetch(url);
    if (!res.ok) {
      // This endpoint doesn't exist on all campuses - return empty
      return { items: [] };
    }
    return res.json();
  }
}

// ============================================
// FIELD ANALYSIS
// ============================================

function analyzeFields(obj: any, prefix: string = ''): Map<string, { type: string; sample: any; hasValue: boolean }> {
  const fields = new Map<string, { type: string; sample: any; hasValue: boolean }>();

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const type = Array.isArray(value) ? 'array' : typeof value;
    const hasValue = value !== null && value !== undefined && value !== '' &&
                     !(Array.isArray(value) && value.length === 0);

    fields.set(path, { type, sample: value, hasValue });

    // Recurse into objects (but not arrays)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = analyzeFields(value, path);
      nested.forEach((v, k) => fields.set(k, v));
    }
  }

  return fields;
}

function printFieldAnalysis(fields: Map<string, { type: string; sample: any; hasValue: boolean }>) {
  const sorted = [...fields.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  console.log('\n   Fields with data:');
  for (const [path, info] of sorted) {
    if (info.hasValue) {
      let sampleStr = '';
      if (info.type === 'string') {
        sampleStr = ` = "${String(info.sample).slice(0, 50)}${String(info.sample).length > 50 ? '...' : ''}"`;
      } else if (info.type === 'number' || info.type === 'boolean') {
        sampleStr = ` = ${info.sample}`;
      } else if (info.type === 'array') {
        sampleStr = ` [${(info.sample as any[]).length} items]`;
      }
      console.log(`     ✓ ${path} (${info.type})${sampleStr}`);
    }
  }

  console.log('\n   Empty/null fields:');
  for (const [path, info] of sorted) {
    if (!info.hasValue) {
      console.log(`     ✗ ${path} (${info.type})`);
    }
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  const config = parseArgs();

  console.log('\n🔬 CampusLabs Data Probe\n');
  console.log(`School: ${config.school}.campuslabs.com`);
  console.log(`Sample size: ${config.sampleSize}`);
  console.log(`Output: ${config.outputDir}`);
  console.log('');

  // Create output directory
  mkdirSync(config.outputDir, { recursive: true });

  const probe = new CampusLabsProbe(config.school);
  const timestamp = new Date().toISOString().split('T')[0];

  // ============================================
  // METADATA
  // ============================================

  console.log('📋 Fetching metadata...\n');

  const [branches, orgCategories, eventCategories] = await Promise.all([
    probe.getBranches(),
    probe.getCategories(),
    probe.getEventCategories(),
  ]);

  console.log(`   Branches (org types): ${branches.items?.length || 0}`);
  branches.items?.forEach((b: any) => {
    console.log(`     - ${b.name} (ID: ${b.id})`);
  });

  console.log(`\n   Org Categories: ${orgCategories.items?.length || 0}`);
  orgCategories.items?.slice(0, 10).forEach((c: any) => {
    console.log(`     - ${c.name} (ID: ${c.id})`);
  });
  if (orgCategories.items?.length > 10) {
    console.log(`     ... and ${orgCategories.items.length - 10} more`);
  }

  console.log(`\n   Event Categories: ${eventCategories.items?.length || 0}`);
  eventCategories.items?.slice(0, 10).forEach((c: any) => {
    console.log(`     - ${c.name} (ID: ${c.id})`);
  });
  if (eventCategories.items?.length > 10) {
    console.log(`     ... and ${eventCategories.items.length - 10} more`);
  }

  // Save metadata
  writeFileSync(
    join(config.outputDir, `${config.school}-metadata-${timestamp}.json`),
    JSON.stringify({ branches, orgCategories, eventCategories }, null, 2)
  );

  // ============================================
  // ORGANIZATIONS
  // ============================================

  if (!config.eventsOnly) {
    console.log('\n' + '='.repeat(60));
    console.log('📍 ORGANIZATIONS');
    console.log('='.repeat(60));

    // Get org IDs from search
    const searchResult = await probe.searchOrganizations(config.sampleSize);
    console.log(`\nTotal orgs available: ${searchResult['@odata.count']}`);

    const orgDetails: any[] = [];

    for (const org of searchResult.value) {
      console.log(`\n--- ${org.Name} (ID: ${org.Id}) ---`);

      // Fetch FULL detail
      const detail = await probe.getOrganizationDetail(org.Id);
      orgDetails.push(detail);

      // Analyze fields
      const fields = analyzeFields(detail);
      printFieldAnalysis(fields);

      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    }

    // Save full org data
    writeFileSync(
      join(config.outputDir, `${config.school}-orgs-detail-${timestamp}.json`),
      JSON.stringify(orgDetails, null, 2)
    );

    // Generate field summary across all orgs
    const allOrgFields = new Map<string, number>();
    for (const org of orgDetails) {
      const fields = analyzeFields(org);
      fields.forEach((info, path) => {
        if (info.hasValue) {
          allOrgFields.set(path, (allOrgFields.get(path) || 0) + 1);
        }
      });
    }

    console.log('\n📊 Field coverage across all sampled orgs:');
    const sortedOrgFields = [...allOrgFields.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
    for (const [field, count] of sortedOrgFields) {
      const pct = Math.round((count / orgDetails.length) * 100);
      console.log(`   ${pct.toString().padStart(3)}% | ${field}`);
    }
  }

  // ============================================
  // EVENTS
  // ============================================

  if (!config.orgsOnly) {
    console.log('\n' + '='.repeat(60));
    console.log('📅 EVENTS');
    console.log('='.repeat(60));

    // Get event IDs from search
    const searchResult = await probe.searchEvents(config.sampleSize, true);
    console.log(`\nTotal upcoming events: ${searchResult['@odata.count']}`);

    // Show facets (benefits, themes)
    if (searchResult['@search.facets']) {
      const facets = searchResult['@search.facets'];
      if (facets.Theme) {
        console.log('\n   Themes:');
        facets.Theme.forEach((t: any) => console.log(`     - ${t.value}: ${t.count}`));
      }
      if (facets.BenefitNames) {
        console.log('\n   Benefits:');
        facets.BenefitNames.forEach((b: any) => console.log(`     - ${b.value}: ${b.count}`));
      }
    }

    const eventDetails: any[] = [];

    for (const event of searchResult.value) {
      console.log(`\n--- ${event.name} (ID: ${event.id}) ---`);
      console.log(`    Org: ${event.organizationName}`);
      console.log(`    When: ${event.startsOn}`);

      // Fetch FULL detail
      const detail = await probe.getEventDetail(event.id);
      eventDetails.push(detail);

      // Analyze fields
      const fields = analyzeFields(detail);
      printFieldAnalysis(fields);

      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    }

    // Save full event data
    writeFileSync(
      join(config.outputDir, `${config.school}-events-detail-${timestamp}.json`),
      JSON.stringify(eventDetails, null, 2)
    );

    // Generate field summary
    const allEventFields = new Map<string, number>();
    for (const event of eventDetails) {
      const fields = analyzeFields(event);
      fields.forEach((info, path) => {
        if (info.hasValue) {
          allEventFields.set(path, (allEventFields.get(path) || 0) + 1);
        }
      });
    }

    console.log('\n📊 Field coverage across all sampled events:');
    const sortedEventFields = [...allEventFields.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
    for (const [field, count] of sortedEventFields) {
      const pct = Math.round((count / eventDetails.length) * 100);
      console.log(`   ${pct.toString().padStart(3)}% | ${field}`);
    }
  }

  // ============================================
  // SUMMARY
  // ============================================

  console.log('\n' + '='.repeat(60));
  console.log('✅ PROBE COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nOutput files saved to: ${config.outputDir}/`);
  console.log(`  - ${config.school}-metadata-${timestamp}.json`);
  if (!config.eventsOnly) {
    console.log(`  - ${config.school}-orgs-detail-${timestamp}.json`);
  }
  if (!config.orgsOnly) {
    console.log(`  - ${config.school}-events-detail-${timestamp}.json`);
  }
  console.log('\nReview the JSON files to see the FULL data structure available.');
  console.log('Use this to design the final import schema.\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
