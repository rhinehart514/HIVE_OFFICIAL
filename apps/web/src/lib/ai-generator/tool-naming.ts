/**
 * Tool Name Generation
 *
 * Extracts meaningful names from user prompts.
 * Falls back to intent-based names when no clear subject is found.
 */

import type { Intent, DetectedIntent } from './intent-detection';

// Intent-based fallback names
const INTENT_NAMES: Record<Intent, string> = {
  'collect-input': 'Input Collector',
  'show-results': 'Results Display',
  'track-time': 'Countdown',
  'rank-items': 'Leaderboard',
  'enable-voting': 'Poll',
  'search-filter': 'Finder',
  'coordinate-people': 'Coordinator',
  'broadcast': 'Announcements',
  'visualize-data': 'Data Dashboard',
  // Campus-specific
  'discover-events': 'Event Finder',
  'find-food': 'What Should I Eat',
  'find-study-spot': 'Study Spot Finder',
  // App-level
  'photo-challenge': 'Photo Challenge',
  'attendance-tracking': 'Attendance Tracker',
  'resource-management': 'Resource Signup',
  'multi-vote': 'Multi-Poll Dashboard',
  'event-series': 'Event Series Hub',
  'suggestion-triage': 'Suggestion Box',
  'group-matching': 'Study Group Matcher',
  'competition-goals': 'Competition Tracker',
};

/**
 * Capitalize each word in a string
 */
export function capitalize(str: string): string {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate a meaningful tool name from the user's prompt
 */
export function generateToolName(prompt: string, intent: DetectedIntent): string {
  const words = prompt.toLowerCase().split(/\s+/);

  // Remove common verbs and articles
  const stopWords = ['i', 'want', 'to', 'create', 'make', 'build', 'a', 'an', 'the', 'for', 'that', 'which', 'can', 'will'];
  const meaningful = words.filter(w => w.length > 2 && !stopWords.includes(w));

  // Try to find a subject (what this is about)
  const forIndex = words.indexOf('for');
  if (forIndex !== -1 && words[forIndex + 1]) {
    const subject = words.slice(forIndex + 1, forIndex + 3).join(' ');
    return capitalize(subject);
  }

  // Use first 2-3 meaningful words
  if (meaningful.length >= 2) {
    return capitalize(meaningful.slice(0, 3).join(' '));
  }

  // Fall back to intent-based name
  return INTENT_NAMES[intent.primary];
}
