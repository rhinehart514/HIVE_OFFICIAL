/**
 * Intent Detection System
 *
 * Detects user intent from natural language prompts.
 * Rather than matching to templates, this system detects WHAT THE USER WANTS TO ACHIEVE.
 */

export type Intent =
  | 'collect-input'      // gather information from people
  | 'show-results'       // display aggregated data
  | 'track-time'         // countdown, deadline, timer
  | 'rank-items'         // leaderboard, standings
  | 'enable-voting'      // poll, decision-making
  | 'search-filter'      // find, browse, filter
  | 'coordinate-people'  // rsvp, match, connect
  | 'broadcast'          // announce, notify
  | 'visualize-data'     // chart, graph, metrics
  // Campus-specific intents (higher priority when detected)
  | 'discover-events'    // find events, what's happening
  | 'find-food'          // dining, eating, food decisions
  | 'find-study-spot'    // libraries, study spaces, quiet places
  // App-level intents (multi-element compositions)
  | 'photo-challenge'    // photo contest with voting and winners
  | 'attendance-tracking' // track attendance with points
  | 'resource-management' // equipment, room booking
  | 'multi-vote'         // board meetings, group decisions
  | 'event-series'       // recurring events, series management
  | 'suggestion-triage'  // feedback with filtering and trends
  | 'group-matching'     // study groups, project teams
  | 'competition-goals' // fundraising, challenges with targets
  | 'custom-visual'     // bingo, games, drag-and-drop, interactive widgets
  // Infrastructure intents (use new campus elements)
  | 'exchange-items'    // marketplace, buy/sell/trade, listing board
  | 'match-people'      // preference-based matching, pairing
  | 'run-approval'      // workflow pipeline, multi-step approval
  | 'track-data';       // structured data, spreadsheet, CRUD table

export interface DetectedIntent {
  primary: Intent;
  secondary: Intent[];
  confidence: number;
  keywords: string[];
}

// Intent signal keywords - not templates, just signals
// Campus-specific intents have bonus multiplier (2x) for stronger matching
export const INTENT_SIGNALS: Record<Intent, string[]> = {
  'collect-input': ['form', 'collect', 'gather', 'get', 'ask', 'submit', 'fill', 'enter', 'sign up', 'signup', 'register'],
  'show-results': ['show', 'display', 'list', 'view', 'see', 'results', 'responses', 'submissions'],
  'track-time': ['countdown', 'timer', 'deadline', 'until', 'remaining', 'days', 'hours'],
  'rank-items': ['leaderboard', 'ranking', 'top', 'best', 'score', 'points', 'standings', 'competition'],
  'enable-voting': ['poll', 'vote', 'voting', 'opinion', 'decide', 'choose', 'pick', 'preference'],
  'search-filter': ['search', 'find', 'filter', 'browse', 'look for', 'looking for', 'discover'],
  'coordinate-people': ['rsvp', 'attend', 'join', 'match', 'connect', 'coordinate', 'organize', 'who', 'people'],
  'broadcast': ['announce', 'broadcast', 'notify', 'alert', 'message', 'share', 'tell'],
  'visualize-data': ['chart', 'graph', 'visualize', 'data', 'analytics', 'metrics', 'stats', 'trends'],
  // Campus-specific intents - higher priority with richer keywords
  'discover-events': [
    'event', 'events', 'happening', 'tonight', 'today', 'this week', 'weekend',
    'party', 'parties', 'concert', 'show', 'talk', 'workshop', 'meeting',
    'go to', 'attend', 'whats happening', "what's happening", 'things to do',
    'should i go', 'fun', 'social', 'club event', 'campus event',
    'for me', 'personalized', 'recommend', 'suggested', 'friends going',
    'friends attending', 'what to do', 'bored', 'hang out', 'hangout',
    'this weekend', 'tomorrow', 'free tonight', 'activities', 'on campus',
  ],
  'find-food': [
    'eat', 'food', 'dining', 'hungry', 'lunch', 'dinner', 'breakfast', 'meal',
    'what should i eat', 'where to eat', 'dining hall', 'cafeteria', 'restaurant',
    'snack', 'coffee', 'cafe', 'grab food', 'open now', 'menu', 'vegan', 'vegetarian',
    'starving', 'craving', 'crossroads', 'c3', 'governors', 'sizzles', 'tikka',
    'moes', 'starbucks', 'tim hortons', 'hubies', 'late night food', 'quick bite',
    'decide for me', 'recommend food', 'whats good', 'what\'s good to eat',
  ],
  'find-study-spot': [
    'study', 'studying', 'library', 'quiet', 'focus', 'work', 'homework',
    'where to study', 'study spot', 'study space', 'study room', 'group study',
    'silent', 'noise', 'outlet', 'outlets', 'power', 'wifi', 'desk', 'seat',
    'lockwood', 'capen', 'silverman', 'student union', 'ellicott', 'nsc',
    'natural sciences', 'open now', 'open late', '24 hour', '24hr', '24/7',
    'good place to study', 'best study spot', 'empty spot', 'not crowded',
    'alone', 'with friends', 'group room', 'reserve room', 'reservable',
    'concentrate', 'cram', 'finals', 'midterms', 'exam', 'exam prep',
    'quiet zone', 'noisy', 'social study', 'reading room', 'computer lab',
  ],
  // App-level intents (higher complexity, 3x weight)
  'photo-challenge': [
    'photo challenge', 'photo contest', 'photo competition', 'picture contest',
    'best photo', 'photography contest', 'submit photos', 'vote on photos',
    'photo voting', 'image contest', 'snapshot challenge', 'pic of the week',
  ],
  'attendance-tracking': [
    'attendance tracker', 'track attendance', 'meeting attendance', 'check-in system',
    'attendance points', 'who showed up', 'attendance leaderboard', 'member engagement',
    'participation tracking', 'attendance record', 'sign-in sheet', 'roll call',
  ],
  'resource-management': [
    'resource signup', 'equipment checkout', 'room booking', 'borrow equipment',
    'reserve room', 'lending system', 'checkout system', 'resource booking',
    'equipment lending', 'item checkout', 'inventory management', 'asset tracking',
  ],
  'multi-vote': [
    'board vote', 'multiple votes', 'voting dashboard', 'decision board',
    'group decisions', 'multi-poll', 'several votes', 'meeting votes',
    'board meeting', 'vote on multiple', 'simultaneous voting', 'batch voting',
  ],
  'event-series': [
    'event series', 'recurring events', 'weekly meetup', 'series hub',
    'event collection', 'semester events', 'regular meetings', 'event program',
    'ongoing series', 'weekly series', 'monthly meetups', 'event lineup',
  ],
  'suggestion-triage': [
    'suggestion box', 'feedback system', 'idea box', 'feedback collection',
    'triage suggestions', 'filter feedback', 'feedback dashboard', 'ideas portal',
    'submit ideas', 'feedback tracker', 'request tracker', 'issue tracker',
  ],
  'group-matching': [
    'study group matcher', 'find study partners', 'group matching', 'partner finder',
    'team matching', 'project partners', 'match availability', 'group formation',
    'study buddy', 'pair up', 'find teammates', 'group finder',
  ],
  'competition-goals': [
    'competition tracker', 'fundraiser', 'challenge tracker', 'goal progress',
    'fundraising goal', 'donation tracker', 'competition leaderboard', 'target tracking',
    'goal tracking', 'challenge progress', 'fundraising tracker', 'donation goal',
  ],
  'custom-visual': [
    'bingo', 'bingo card', 'flip card', 'flip cards', 'flashcard', 'flashcards',
    'game', 'card game', 'matching game', 'trivia', 'trivia game', 'quiz game',
    'drag and drop', 'drag-and-drop', 'draggable', 'sortable',
    'spinner', 'wheel', 'spin wheel', 'random wheel', 'prize wheel',
    'animation', 'animated', 'interactive widget', 'custom widget',
    'interactive visualization', 'custom visualization', 'mini game', 'minigame',
    'memory game', 'word search', 'crossword', 'puzzle',
  ],
  // Infrastructure intents (3x weight — use new campus elements)
  'exchange-items': [
    'marketplace', 'buy sell', 'buy and sell', 'exchange', 'listing', 'listings',
    'textbook exchange', 'textbook marketplace', 'sell textbooks', 'free stuff',
    'free items', 'giveaway board', 'swap', 'trade', 'for sale', 'classifieds',
    'post listing', 'claim', 'ride board', 'ride share', 'rideshare',
    'subletting', 'sublet', 'furniture', 'ticket exchange', 'sell tickets',
    'campus marketplace', 'student marketplace', 'buy used',
  ],
  'match-people': [
    'match', 'matching', 'pair', 'pairing', 'match maker', 'matchmaker',
    'study partner', 'study partners', 'find partner', 'find partners',
    'mentorship', 'mentor match', 'mentor pairing', 'roommate match',
    'project team', 'project teams', 'team formation', 'compatibility',
    'preference matching', 'pair up', 'buddy system', 'accountability partner',
    'lab partner', 'language exchange', 'peer tutor', 'peer tutoring',
  ],
  'run-approval': [
    'approval', 'approve', 'approval workflow', 'approval pipeline',
    'budget request', 'budget approval', 'funding request', 'reimbursement',
    'event proposal', 'proposal review', 'submit for review', 'review process',
    'application', 'membership application', 'request system', 'intake form',
    'multi-step', 'pipeline', 'workflow', 'stage', 'stages',
    'pending approval', 'approve reject', 'request changes',
  ],
  'track-data': [
    'data table', 'spreadsheet', 'tracker', 'inventory', 'roster',
    'directory', 'equipment list', 'contact list', 'member roster',
    'resource directory', 'club roster', 'track items', 'crud',
    'add edit delete', 'sortable table', 'filterable table', 'csv export',
    'structured data', 'database', 'record keeping', 'log entries',
    'catalog', 'registry', 'index', 'master list',
  ],
};

// App-level intents get 3x weight for strongest matching (they're specific use cases)
export const APP_INTENTS: Intent[] = [
  'photo-challenge', 'attendance-tracking', 'resource-management', 'multi-vote',
  'event-series', 'suggestion-triage', 'group-matching', 'competition-goals',
  'custom-visual',
  // Infrastructure intents (use new campus elements)
  'exchange-items', 'match-people', 'run-approval', 'track-data',
];

// Campus-specific intents get 2x weight for stronger matching
export const CAMPUS_INTENTS: Intent[] = ['discover-events', 'find-food', 'find-study-spot'];

/**
 * Detect user intent from a natural language prompt
 */
export function detectIntent(prompt: string): DetectedIntent {
  const lower = prompt.toLowerCase();
  const scores: Record<Intent, number> = {
    'collect-input': 0,
    'show-results': 0,
    'track-time': 0,
    'rank-items': 0,
    'enable-voting': 0,
    'search-filter': 0,
    'coordinate-people': 0,
    'broadcast': 0,
    'visualize-data': 0,
    // Campus-specific intents
    'discover-events': 0,
    'find-food': 0,
    'find-study-spot': 0,
    // App-level intents
    'photo-challenge': 0,
    'attendance-tracking': 0,
    'resource-management': 0,
    'multi-vote': 0,
    'event-series': 0,
    'suggestion-triage': 0,
    'group-matching': 0,
    'competition-goals': 0,
    'custom-visual': 0,
    // Infrastructure intents
    'exchange-items': 0,
    'match-people': 0,
    'run-approval': 0,
    'track-data': 0,
  };

  const matchedKeywords: string[] = [];

  // Score each intent based on keyword matches
  for (const [intent, keywords] of Object.entries(INTENT_SIGNALS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        // Base score = keyword length (longer matches = higher confidence)
        let score = keyword.length;

        // App-level intents get 3x weight (most specific, highest priority)
        if (APP_INTENTS.includes(intent as Intent)) {
          score *= 3;
        }
        // Campus-specific intents get 2x weight for stronger matching
        else if (CAMPUS_INTENTS.includes(intent as Intent)) {
          score *= 2;
        }

        scores[intent as Intent] += score;
        if (!matchedKeywords.includes(keyword)) {
          matchedKeywords.push(keyword);
        }
      }
    }
  }

  // Sort by score
  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    // Default to collect-input + show-results if no clear intent
    return {
      primary: 'collect-input',
      secondary: ['show-results'],
      confidence: 0.3, // Lower confidence for default fallback
      keywords: [],
    };
  }

  const maxScore = sorted[0][1];
  // Confidence formula: higher for app/campus intents (more specific)
  const isAppIntent = APP_INTENTS.includes(sorted[0][0] as Intent);
  const isCampusIntent = CAMPUS_INTENTS.includes(sorted[0][0] as Intent);
  const baseConfidence = Math.min(maxScore / 20, 1);
  // App intents get highest confidence boost, then campus intents
  const confidence = isAppIntent
    ? Math.min(baseConfidence * 1.3, 1)
    : isCampusIntent
      ? Math.min(baseConfidence * 1.2, 1)
      : baseConfidence;

  return {
    primary: sorted[0][0] as Intent,
    secondary: sorted.slice(1, 3).map(s => s[0] as Intent),
    confidence,
    keywords: matchedKeywords,
  };
}
