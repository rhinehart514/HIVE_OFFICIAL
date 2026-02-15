/**
 * Curated Featured Spaces
 * 
 * These ~25 spaces are shown by default in browse/discover views.
 * The rest of the ~698 spaces are still findable via search or "Show all".
 * 
 * Criteria: Biggest/most recognizable UB organizations that give
 * new students immediate value and social proof.
 */

/**
 * Slugs (handles) of spaces that should appear in the default browse view.
 * These are the most recognizable UB organizations.
 * 
 * To update: add/remove slugs here. No deploy needed for Firestore flag changes
 * if using the admin endpoint, but this list is the source of truth for
 * which spaces get the `isFeatured` flag.
 */
export const FEATURED_SPACE_SLUGS: string[] = [
  // Student Government & Campus Programming
  'student-association',           // SA / SGA
  'sub-board-inc',                 // UPC equivalent - campus programming
  
  // Major Academic Clubs
  'ub-computer-science',
  'association-for-computing-machinery', // ACM
  'ub-engineering-hub',
  'society-of-women-engineers',
  'pre-medical-society',
  'ub-pre-med-society',
  'american-institute-of-chemical-engineers',
  'school-of-management-student-association',
  'ub-business-network',
  
  // Greek Life (major councils + visible orgs)
  'interfraternity-council',
  'panhellenic-association',
  'multicultural-greek-council',
  
  // Residential / Campus Living
  'governors-residence-hall',
  'ellicott-complex',
  
  // Cultural & Identity Organizations
  'black-student-union',
  'latin-american-student-association',
  'indian-students-association',
  'chinese-students-and-scholars-association',
  'korean-student-association',
  
  // Interest / Recreation
  'ub-gaming-community',
  'club-running',
  'spectrum',                      // LGBTQ+ org
  
  // HIVE Platform
  'hive-official',
];

/**
 * Normalize a slug for comparison (lowercase, trim)
 */
function normalizeSlug(slug: string): string {
  return slug.toLowerCase().trim();
}

const FEATURED_SET = new Set(FEATURED_SPACE_SLUGS.map(normalizeSlug));

/**
 * Check if a space slug is in the featured list
 */
export function isFeaturedSpace(slug: string | undefined): boolean {
  if (!slug) return false;
  return FEATURED_SET.has(normalizeSlug(slug));
}

/**
 * Get the full set of featured slugs (for batch operations)
 */
export function getFeaturedSlugs(): ReadonlySet<string> {
  return FEATURED_SET;
}
