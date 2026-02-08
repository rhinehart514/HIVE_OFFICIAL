/**
 * Template Matcher
 *
 * Simple keyword matching against template names and descriptions
 * to suggest existing templates before AI generation.
 */

import {
  getAvailableTemplates,
  type QuickTemplate,
} from '@hive/ui';

export interface TemplateMatch {
  template: QuickTemplate;
  score: number;
}

/**
 * Match a user prompt against available templates.
 * Returns the best match if score exceeds threshold.
 */
export function matchTemplate(prompt: string): TemplateMatch | null {
  const normalized = prompt.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  const templates = getAvailableTemplates();

  let bestMatch: TemplateMatch | null = null;

  for (const template of templates) {
    const nameLower = template.name.toLowerCase();
    const descLower = template.description.toLowerCase();
    let score = 0;

    // Exact name match
    if (normalized.includes(nameLower) || nameLower.includes(normalized)) {
      score += 10;
    }

    // Word-level matching against name + description
    for (const word of words) {
      if (word.length < 3) continue;
      if (nameLower.includes(word)) score += 3;
      if (descLower.includes(word)) score += 1;
    }

    // Boost for category keyword matches
    const categoryKeywords: Record<string, string[]> = {
      poll: ['poll', 'vote', 'voting', 'survey', 'opinion'],
      rsvp: ['rsvp', 'attend', 'going', 'event', 'signup'],
      countdown: ['countdown', 'timer', 'deadline'],
      leaderboard: ['leaderboard', 'ranking', 'top', 'scoreboard'],
      feedback: ['feedback', 'review', 'rate', 'rating'],
      agenda: ['agenda', 'meeting', 'minutes'],
      checkin: ['checkin', 'check-in', 'attendance', 'present'],
      budget: ['budget', 'money', 'finance', 'spending', 'expense'],
      signup: ['signup', 'sign-up', 'register', 'join'],
      study: ['study', 'group', 'partner', 'tutor'],
      office: ['office', 'hours', 'booking', 'appointment'],
      suggestion: ['suggestion', 'idea', 'submit', 'box'],
    };

    for (const [, keywords] of Object.entries(categoryKeywords)) {
      const promptHits = words.filter(w => keywords.includes(w)).length;
      const nameHits = keywords.filter(k => nameLower.includes(k)).length;
      if (promptHits > 0 && nameHits > 0) {
        score += promptHits * 2;
      }
    }

    if (score > (bestMatch?.score ?? 0)) {
      bestMatch = { template, score };
    }
  }

  // Only return if score is meaningful (at least partial word match)
  if (bestMatch && bestMatch.score >= 4) {
    return bestMatch;
  }

  return null;
}
