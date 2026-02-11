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

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function resolveSpaceId(space: any): string {
  return String(space?.spaceId || space?.id || '');
}

export function scoreSpaceForInterest(space: any, interestId: string): number {
  const signal = INTEREST_SIGNALS[interestId];
  if (!signal || !space) {
    return 0;
  }

  let score = 0;

  const rawTags = Array.isArray(space.tags) ? space.tags : [];
  const normalizedTags = new Set(rawTags.map((tag: any) => normalize(String(tag))));
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
  if (name && signal.keywords.some((keyword) => name.includes(normalize(keyword)))) {
    score += 1;
  }

  return score;
}

export function matchSpacesForInterests(spaces: any[], interestIds: string[], limit = 10): Array<{
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
