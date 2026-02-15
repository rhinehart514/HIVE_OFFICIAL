type InterestSignal = {
  tags: string[];
  orgTypes: string[];
  keywords: string[];
};

export const INTEREST_SIGNALS: Record<string, InterestSignal> = {
  academic_identity: {
    tags: ['academics', 'stem-innovation', 'school-of-management'],
    orgTypes: ['Dept-Recognized Student Organizations', 'Academic Affairs'],
    keywords: [],
  },
  builders_and_hustle: {
    tags: ['stem-innovation', 'school-of-management'],
    orgTypes: ['Dept-Recognized Student Organizations'],
    keywords: ['entrepreneur', 'hack', 'startup', 'innovation', 'venture', 'developer'],
  },
  gaming_and_game_night: {
    tags: ['recreational-sport'],
    orgTypes: [],
    keywords: ['game', 'gaming', 'esport', 'chess', 'board game'],
  },
  creative_scene: {
    tags: ['performances'],
    orgTypes: [],
    keywords: ['art', 'music', 'dance', 'theatre', 'theater', 'film', 'design', 'photo', 'choir', 'acapella', 'a cappella'],
  },
  campus_events: {
    tags: [],
    orgTypes: ['Student Life Division'],
    keywords: ['programming board', 'event planning'],
  },
  health_wellness: {
    tags: ['health-and-wellness', 'recreational-sport'],
    orgTypes: [],
    keywords: ['health', 'wellness', 'fitness', 'yoga', 'mental health'],
  },
  social_energy: {
    tags: ['fraternity-and-sorority'],
    orgTypes: [],
    keywords: ['fraternity', 'sorority', 'greek'],
  },
  identity_background: {
    tags: ['international', 'social-justice', 'spirituality', 'spiritual-religion'],
    orgTypes: ['Campus Ministry Association'],
    keywords: ['international', 'women', 'african', 'asian', 'latin', 'hispanic', 'lgbtq', 'pride', 'muslim', 'jewish', 'christian', 'cultural'],
  },
  food_behaviors: {
    tags: ['food-culinary'],
    orgTypes: [],
    keywords: ['food', 'culinary', 'dining', 'cooking'],
  },
  study_style: {
    tags: ['academics'],
    orgTypes: [],
    keywords: ['study', 'tutor', 'honors', 'library'],
  },
  housing_history: {
    tags: ['campus-living'],
    orgTypes: [],
    keywords: [],
  },
  cold_weather: {
    tags: ['outdoor-adventure'],
    orgTypes: [],
    keywords: ['outdoor', 'hiking', 'ski'],
  },
  getting_around: {
    tags: [],
    orgTypes: [],
    keywords: ['transit', 'bike', 'commuter', 'cycling'],
  },
  media_and_content: {
    tags: ['media-communications'],
    orgTypes: [],
    keywords: ['media', 'podcast', 'radio', 'newspaper', 'journal', 'film'],
  },
  micro_lore: {
    tags: [],
    orgTypes: [],
    keywords: [],
  },
};

/**
 * Individual interest item signals — provides more precise matching than
 * category-level IDs. Each item maps to additional keywords and tag boosts.
 * When an item ID is passed, its signals are merged with the parent category
 * signals for higher-precision scoring.
 *
 * Keys are individual item IDs from the interest picker catalog.
 * Falls back to category-level matching for unknown IDs.
 */
export const ITEM_SIGNALS: Record<string, { parentCategory: string; keywords: string[]; tags: string[]; boost: number }> = {
  // academic_identity items
  cs: { parentCategory: 'academic_identity', keywords: ['computer science', 'programming', 'software', 'developer', 'algorithm', 'data structure', 'hackathon'], tags: ['stem-innovation'], boost: 2 },
  engineering: { parentCategory: 'academic_identity', keywords: ['engineering', 'mechanical', 'civil', 'electrical', 'biomedical'], tags: ['stem-innovation'], boost: 2 },
  pre_med: { parentCategory: 'academic_identity', keywords: ['pre-med', 'medical', 'biology', 'anatomy', 'mcat', 'health'], tags: ['health-and-wellness'], boost: 2 },
  pre_law: { parentCategory: 'academic_identity', keywords: ['pre-law', 'legal', 'law', 'mock trial', 'debate', 'policy'], tags: [], boost: 2 },
  business: { parentCategory: 'academic_identity', keywords: ['business', 'management', 'finance', 'accounting', 'marketing', 'mba'], tags: ['school-of-management'], boost: 2 },
  research: { parentCategory: 'academic_identity', keywords: ['research', 'lab', 'thesis', 'publication', 'scholar'], tags: ['academics'], boost: 2 },
  arts_humanities: { parentCategory: 'academic_identity', keywords: ['art', 'humanities', 'philosophy', 'history', 'literature', 'english'], tags: ['performances'], boost: 1 },
  social_sciences: { parentCategory: 'academic_identity', keywords: ['psychology', 'sociology', 'political science', 'economics', 'anthropology'], tags: [], boost: 1 },
  education: { parentCategory: 'academic_identity', keywords: ['education', 'teaching', 'pedagogy', 'tutor'], tags: ['academics'], boost: 1 },
  nursing: { parentCategory: 'academic_identity', keywords: ['nursing', 'nurse', 'clinical', 'patient care', 'health'], tags: ['health-and-wellness'], boost: 2 },
  architecture: { parentCategory: 'academic_identity', keywords: ['architecture', 'design', 'urban planning', 'building'], tags: [], boost: 1 },
  pharmacy: { parentCategory: 'academic_identity', keywords: ['pharmacy', 'pharmaceutical', 'drug', 'pharmacology'], tags: ['health-and-wellness'], boost: 2 },

  // builders_and_hustle items
  startup_founder: { parentCategory: 'builders_and_hustle', keywords: ['startup', 'founder', 'entrepreneur', 'venture', 'pitch'], tags: ['stem-innovation', 'school-of-management'], boost: 3 },
  hackathon_junkie: { parentCategory: 'builders_and_hustle', keywords: ['hackathon', 'hack', 'build', 'prototype', 'demo day'], tags: ['stem-innovation'], boost: 2 },
  side_projects: { parentCategory: 'builders_and_hustle', keywords: ['project', 'side hustle', 'freelance', 'portfolio', 'developer'], tags: ['stem-innovation'], boost: 1 },
  stock_trader: { parentCategory: 'builders_and_hustle', keywords: ['stock', 'trading', 'investment', 'finance', 'market', 'portfolio'], tags: ['school-of-management'], boost: 2 },

  // gaming_and_game_night items
  esports: { parentCategory: 'gaming_and_game_night', keywords: ['esport', 'competitive gaming', 'league', 'valorant', 'overwatch'], tags: ['recreational-sport'], boost: 2 },
  board_games: { parentCategory: 'gaming_and_game_night', keywords: ['board game', 'tabletop', 'dungeons', 'dnd', 'card game'], tags: [], boost: 1 },
  casual_gamer: { parentCategory: 'gaming_and_game_night', keywords: ['game', 'gaming', 'casual', 'nintendo', 'playstation', 'xbox'], tags: [], boost: 1 },

  // creative_scene items
  music: { parentCategory: 'creative_scene', keywords: ['music', 'band', 'instrument', 'choir', 'acapella', 'orchestra', 'concert'], tags: ['performances'], boost: 2 },
  visual_arts: { parentCategory: 'creative_scene', keywords: ['art', 'painting', 'drawing', 'sculpture', 'gallery', 'exhibition'], tags: ['performances'], boost: 2 },
  film_photo: { parentCategory: 'creative_scene', keywords: ['film', 'photo', 'photography', 'cinema', 'video', 'documentary'], tags: ['media-communications'], boost: 2 },
  dance: { parentCategory: 'creative_scene', keywords: ['dance', 'choreography', 'ballet', 'hip hop', 'contemporary'], tags: ['performances'], boost: 2 },
  theater: { parentCategory: 'creative_scene', keywords: ['theatre', 'theater', 'acting', 'drama', 'improv', 'musical'], tags: ['performances'], boost: 2 },
  writing: { parentCategory: 'creative_scene', keywords: ['writing', 'creative writing', 'poetry', 'fiction', 'literary'], tags: ['media-communications'], boost: 1 },

  // health_wellness items
  gym_rat: { parentCategory: 'health_wellness', keywords: ['gym', 'fitness', 'weightlifting', 'powerlifting', 'crossfit'], tags: ['recreational-sport'], boost: 2 },
  yoga_meditation: { parentCategory: 'health_wellness', keywords: ['yoga', 'meditation', 'mindfulness', 'wellness', 'zen'], tags: ['health-and-wellness'], boost: 2 },
  mental_health: { parentCategory: 'health_wellness', keywords: ['mental health', 'counseling', 'therapy', 'self-care', 'stress'], tags: ['health-and-wellness'], boost: 2 },
  running: { parentCategory: 'health_wellness', keywords: ['running', 'marathon', 'track', 'cross country', 'jogging'], tags: ['recreational-sport'], boost: 1 },
  intramurals: { parentCategory: 'health_wellness', keywords: ['intramural', 'sports', 'basketball', 'soccer', 'volleyball', 'flag football'], tags: ['recreational-sport'], boost: 2 },
  club_sports: { parentCategory: 'health_wellness', keywords: ['club sport', 'rugby', 'lacrosse', 'ultimate frisbee', 'rowing'], tags: ['recreational-sport'], boost: 2 },

  // social_energy items
  greek_life: { parentCategory: 'social_energy', keywords: ['fraternity', 'sorority', 'greek', 'rush', 'bid'], tags: ['fraternity-and-sorority'], boost: 3 },
  party_scene: { parentCategory: 'social_energy', keywords: ['party', 'social', 'nightlife', 'mixer'], tags: [], boost: 1 },

  // identity_background items
  international: { parentCategory: 'identity_background', keywords: ['international', 'global', 'exchange', 'study abroad'], tags: ['international'], boost: 2 },
  lgbtq: { parentCategory: 'identity_background', keywords: ['lgbtq', 'pride', 'queer', 'ally', 'rainbow'], tags: ['social-justice'], boost: 2 },
  religious: { parentCategory: 'identity_background', keywords: ['religious', 'faith', 'church', 'mosque', 'temple', 'spiritual'], tags: ['spirituality', 'spiritual-religion'], boost: 2 },
  cultural: { parentCategory: 'identity_background', keywords: ['cultural', 'heritage', 'diaspora', 'multicultural'], tags: ['international', 'social-justice'], boost: 2 },
  first_gen: { parentCategory: 'identity_background', keywords: ['first generation', 'first-gen', 'first gen'], tags: [], boost: 1 },

  // food_behaviors items
  foodie: { parentCategory: 'food_behaviors', keywords: ['food', 'restaurant', 'culinary', 'cooking', 'baking', 'chef'], tags: ['food-culinary'], boost: 2 },

  // cold_weather items
  outdoor_adventure: { parentCategory: 'cold_weather', keywords: ['outdoor', 'hiking', 'camping', 'climbing', 'ski', 'snowboard', 'kayak'], tags: ['outdoor-adventure'], boost: 2 },

  // media_and_content items
  podcast: { parentCategory: 'media_and_content', keywords: ['podcast', 'audio', 'broadcast', 'radio', 'host'], tags: ['media-communications'], boost: 2 },
  journalism: { parentCategory: 'media_and_content', keywords: ['journalism', 'news', 'newspaper', 'reporter', 'editor'], tags: ['media-communications'], boost: 2 },
  content_creator: { parentCategory: 'media_and_content', keywords: ['content', 'youtube', 'tiktok', 'creator', 'influencer', 'social media'], tags: ['media-communications'], boost: 2 },
};

/**
 * Year-based weight boosts for space categories.
 * Applied additively to scores when year context is provided.
 */
export const YEAR_BOOSTS: Record<string, Record<string, number>> = {
  freshman: { campus_living: 3, student_org: 2 },
  sophomore: { student_org: 2, greek_life: 1 },
  junior: { student_org: 2, greek_life: 1 },
  senior: { university_org: 3 },
  grad: { university_org: 3 },
};

/**
 * Normalize a year string to a canonical key.
 */
export function normalizeYear(year?: string | null): string | null {
  if (!year) return null;
  const y = year.toLowerCase().trim();
  if (y.includes('fresh') || y === '1' || y === 'first') return 'freshman';
  if (y.includes('soph') || y === '2' || y === 'second') return 'sophomore';
  if (y.includes('jun') || y === '3' || y === 'third') return 'junior';
  if (y.includes('sen') || y === '4' || y === 'fourth') return 'senior';
  if (y.includes('grad') || y.includes('master') || y.includes('phd') || y.includes('doctoral')) return 'grad';
  return null;
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

/** A space document with fields used during matching */
interface MatchableSpace {
  spaceId?: string;
  id?: string;
  tags?: string[];
  orgTypeName?: string;
  name?: string;
  description?: string;
  category?: string;
  identityType?: string;
}
function resolveSpaceId(space: MatchableSpace): string {
  return String(space?.spaceId || space?.id || '');
}

export function scoreSpaceForInterest(space: MatchableSpace, interestId: string): number {
  if (!space) return 0;

  // Check if this is an individual item ID
  const itemSignal = ITEM_SIGNALS[interestId];
  const categoryId = itemSignal?.parentCategory ?? interestId;
  const signal = INTEREST_SIGNALS[categoryId];

  if (!signal) return 0;

  let score = 0;

  const rawTags = Array.isArray(space.tags) ? space.tags : [];
  const normalizedTags = new Set(rawTags.map((tag: string) => normalize(String(tag))));

  // Score from category-level tags
  for (const tag of signal.tags) {
    const normalizedTag = normalize(tag);
    if (normalizedTags.has(`raw:${normalizedTag}`) || normalizedTags.has(normalizedTag)) {
      score += 3;
    }
  }

  const orgTypeName = normalize(String(space.orgTypeName || ''));
  if (orgTypeName && signal.orgTypes.some((orgType) => normalize(orgType) === orgTypeName)) {
    score += 2;
  }

  const name = normalize(String(space.name || ''));
  const description = normalize(String(space.description || ''));
  const searchText = `${name} ${description}`;

  // Category-level keyword matching
  if (name && signal.keywords.some((keyword) => name.includes(normalize(keyword)))) {
    score += 1;
  }

  // Item-level precision boost — if an individual item ID was provided,
  // apply its extra keywords and tags for more precise matching
  if (itemSignal) {
    for (const tag of itemSignal.tags) {
      const normalizedTag = normalize(tag);
      if (normalizedTags.has(`raw:${normalizedTag}`) || normalizedTags.has(normalizedTag)) {
        score += itemSignal.boost;
      }
    }

    for (const keyword of itemSignal.keywords) {
      if (searchText.includes(normalize(keyword))) {
        score += itemSignal.boost;
      }
    }
  }

  return score;
}

export interface MatchOptions {
  year?: string | null;
  housing?: string | null;
}

export function matchSpacesForInterests(spaces: MatchableSpace[], interestIds: string[], limit = 10, options?: MatchOptions): Array<{
  spaceId: string;
  score: number;
  matchedInterests: string[];
}> {
  if (!Array.isArray(spaces) || !Array.isArray(interestIds) || spaces.length === 0 || interestIds.length === 0 || limit <= 0) {
    return [];
  }

  const uniqueInterestIds = Array.from(new Set(interestIds.filter((interestId): interestId is string => typeof interestId === 'string')));
  if (uniqueInterestIds.length === 0) {
    return [];
  }

  // Resolve year-based boosts
  const yearKey = normalizeYear(options?.year);
  const yearBoosts = yearKey ? (YEAR_BOOSTS[yearKey] || {}) : {};

  const matches: Array<{ spaceId: string; score: number; matchedInterests: string[] }> = [];

  for (const space of spaces) {
    const spaceId = resolveSpaceId(space);
    if (!spaceId) {
      continue;
    }

    let totalScore = 0;
    const matchedInterests: string[] = [];

    for (const interestId of uniqueInterestIds) {
      const interestScore = scoreSpaceForInterest(space, interestId);
      if (interestScore > 0) {
        totalScore += interestScore;
        matchedInterests.push(interestId);
      }
    }

    // Apply year-based category boosts
    const spaceCategory = normalize(String(space.category || ''));
    for (const [catPattern, boost] of Object.entries(yearBoosts)) {
      if (spaceCategory.includes(catPattern)) {
        totalScore += boost;
      }
    }

    // Housing boost: if the space is a residential space matching the user's housing selection,
    // give it high priority
    if (options?.housing && space.identityType) {
      const identityType = normalize(String(space.identityType));
      if (identityType === 'residential' || identityType === 'residential-offcampus') {
        if (spaceId === options.housing) {
          totalScore += 10; // High priority for exact housing match
        }
      }
    }

    if (totalScore > 0) {
      matches.push({
        spaceId,
        score: totalScore,
        matchedInterests,
      });
    }
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.matchedInterests.length !== a.matchedInterests.length) return b.matchedInterests.length - a.matchedInterests.length;
    return a.spaceId.localeCompare(b.spaceId);
  });

  return matches.slice(0, limit);
}
