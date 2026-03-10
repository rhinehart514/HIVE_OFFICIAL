/**
 * Campus Context Provider
 *
 * Returns campus-specific data (dining, buildings, orgs) for a given campusId.
 * Used to inject real campus names into AI generation prompts so polls,
 * brackets, and examples use actual campus locations instead of generic
 * placeholders.
 *
 * Currently hardcodes UB data. Structured so other schools can be added
 * by adding entries to CAMPUS_CONTEXTS.
 */

// ============================================================================
// Types
// ============================================================================

export interface CampusContext {
  campusId: string;
  campusName: string;
  shortName: string;
  dining: string[];
  buildings: string[];
  studySpots: string[];
  landmarks: string[];
  commonOrgs: string[];
}

// ============================================================================
// Campus Data
// ============================================================================

const UB_CONTEXT: CampusContext = {
  campusId: 'ub-buffalo',
  campusName: 'University at Buffalo',
  shortName: 'UB',
  dining: [
    'Crossroads',
    'C3',
    "Governor's",
    'Sizzles',
    'Tikka House',
    "Moe's",
    'Tim Hortons',
    'Au Bon Pain',
    "Hubie's",
    'Starbucks (Student Union)',
    'Starbucks (Lockwood)',
    'Harriman Cafe',
    'Perks Cafe',
  ],
  buildings: [
    'Lockwood Library',
    'Silverman Library',
    'Capen Hall',
    'Natural Sciences Complex',
    'Student Union',
    'Ellicott Complex',
    'Center for Tomorrow',
    'Governors Complex',
    'Harriman Hall',
    'Knox Hall',
    'Baldy Hall',
    'Clemens Hall',
    'Fronczak Hall',
    'Davis Hall',
    'Jacobs School of Medicine',
  ],
  studySpots: [
    'Lockwood 2nd floor quiet zone',
    'Lockwood 3rd floor silent study',
    'Silverman Library',
    'Capen Atrium (near Tim Hortons)',
    'NSC study alcoves',
    'Student Union upper lounges',
    'Ellicott 24hr study lounges',
  ],
  landmarks: [
    'Student Union',
    'Ellicott Complex',
    'Center for Tomorrow',
    'Lake LaSalle',
    'Alumni Arena',
    'UB Stadium',
    'The Spine',
    'Flint Loop',
  ],
  commonOrgs: [
    'Student Association (SA)',
    'Sub-Board I',
    'Spectrum (student newspaper)',
    'WRUB Radio',
    'UB Late Night',
    'Greek Life orgs',
    'Club Sports',
    'Cultural student associations',
  ],
};

/**
 * Registry of all campus contexts, keyed by campusId.
 * Add new campuses here as they onboard.
 */
const CAMPUS_CONTEXTS: Record<string, CampusContext> = {
  'ub-buffalo': UB_CONTEXT,
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Get campus context for a given campusId.
 * Returns null if the campus is not recognized.
 */
export function getCampusContext(campusId: string): CampusContext | null {
  return CAMPUS_CONTEXTS[campusId] ?? null;
}

/**
 * Build a prompt-ready string of campus context for AI injection.
 * Returns null if campusId is not recognized (caller should skip injection).
 */
export function buildCampusContextPrompt(campusId: string): string | null {
  const ctx = getCampusContext(campusId);
  if (!ctx) return null;

  return `Campus context for ${ctx.shortName}:
Dining locations include ${ctx.dining.slice(0, 8).join(', ')}.
Buildings include ${ctx.buildings.slice(0, 8).join(', ')}.
Study spots include ${ctx.studySpots.slice(0, 5).join(', ')}.
Landmarks include ${ctx.landmarks.slice(0, 5).join(', ')}.
Common orgs include ${ctx.commonOrgs.slice(0, 5).join(', ')}.
When generating poll options, bracket entries, or examples, prefer these real campus names over generic placeholders.`;
}
