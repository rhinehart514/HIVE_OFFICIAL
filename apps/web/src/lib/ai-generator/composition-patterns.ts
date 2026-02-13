import type { Intent } from './intent-detection';

export interface CompositionPattern {
  id: string;
  name: string;
  description: string;
  intent: Intent;
  /** Keywords that boost this specific pattern within its intent */
  keywords: string[];
  elements: CompositionElement[];
  connections: CompositionConnection[];
  /** Optional: space types where this pattern is most relevant */
  spaceTypes?: string[];
}

export interface CompositionElement {
  elementId: string;
  instanceId: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface CompositionConnection {
  fromElement: string;
  fromPort: string;
  toElement: string;
  toPort: string;
}

interface ElementDraft {
  elementId: string;
  instanceId: string;
  config: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function cloneConfig(config: Record<string, unknown>): Record<string, unknown> {
  try {
    return JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
  } catch {
    return { ...config };
  }
}

function clonePattern(pattern: CompositionPattern): CompositionPattern {
  return {
    ...pattern,
    keywords: [...pattern.keywords],
    elements: pattern.elements.map((element) => ({
      ...element,
      config: cloneConfig(element.config),
      position: { ...element.position },
      size: { ...element.size },
    })),
    connections: pattern.connections.map((connection) => ({ ...connection })),
    spaceTypes: pattern.spaceTypes ? [...pattern.spaceTypes] : undefined,
  };
}

function buildElements(drafts: ElementDraft[]): CompositionElement[] {
  let nextY = 0;

  return drafts.map((draft) => {
    const width = draft.size?.width ?? 340;
    const height = draft.size?.height ?? 220;
    const position = draft.position ?? { x: 0, y: nextY };
    nextY = Math.max(nextY, position.y + height + 24);

    return {
      elementId: draft.elementId,
      instanceId: draft.instanceId,
      config: cloneConfig(draft.config),
      position,
      size: { width, height },
    };
  });
}

function link(
  fromElement: string,
  fromPort: string,
  toElement: string,
  toPort: string
): CompositionConnection {
  return { fromElement, fromPort, toElement, toPort };
}

function pollConfig(
  question: string,
  options: string[],
  allowMultiple = false
): Record<string, unknown> {
  return {
    question,
    options,
    allowMultiple,
    showResults: true,
    requireVoteToSeeResults: false,
  };
}

function formConfig(
  fields: Array<Record<string, unknown>>,
  submitButtonText = 'Submit'
): Record<string, unknown> {
  return {
    fields,
    submitButtonText,
    confirmationMessage: 'Thanks, your response was saved.',
  };
}

function chartConfig(
  title: string,
  chartType: 'bar' | 'line' | 'pie' = 'bar'
): Record<string, unknown> {
  return {
    title,
    chartType,
    showLegend: true,
    showSummary: false,
  };
}

function resultListConfig(title: string): Record<string, unknown> {
  return {
    title,
    emptyState: 'No entries yet',
    itemsPerPage: 10,
    showPagination: true,
  };
}

function countdownConfig(title: string, days = 7): Record<string, unknown> {
  return {
    title,
    targetDate: daysFromNow(days),
    showDays: true,
    showHours: true,
    showMinutes: false,
  };
}

function announcementConfig(title: string, body: string): Record<string, unknown> {
  return {
    title,
    body,
    pinned: true,
    tone: 'info',
  };
}

function leaderboardConfig(title: string, metric: string): Record<string, unknown> {
  return {
    title,
    metric,
    maxEntries: 10,
    showRank: true,
    highlightTop: 3,
  };
}

function searchConfig(placeholder: string): Record<string, unknown> {
  return {
    placeholder,
    showSuggestions: true,
    minCharacters: 1,
  };
}

function rsvpConfig(eventName: string, maxAttendees = 150): Record<string, unknown> {
  return {
    eventName,
    showAttendeeCount: true,
    enableWaitlist: true,
    maxAttendees,
  };
}

function pattern(definition: {
  id: string;
  name: string;
  description: string;
  intent: Intent;
  keywords: string[];
  elements: ElementDraft[];
  connections?: CompositionConnection[];
  spaceTypes?: string[];
}): CompositionPattern {
  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    intent: definition.intent,
    keywords: definition.keywords,
    elements: buildElements(definition.elements),
    connections: definition.connections ?? [],
    spaceTypes: definition.spaceTypes,
  };
}

const ALL_PATTERNS: CompositionPattern[] = [
  // Governance (8)
  pattern({
    id: 'club-election',
    name: 'Club Election',
    description: 'Run officer elections with a ballot, deadline, and live standings.',
    intent: 'multi-vote',
    keywords: ['club election', 'officer election', 'ballot', 'campaign', 'vote'],
    spaceTypes: ['student_org', 'greek_life', 'university_org'],
    elements: [
      {
        elementId: 'poll-element',
        instanceId: 'election_poll',
        config: pollConfig('Who should serve as next president?', ['Candidate A', 'Candidate B', 'Candidate C']),
      },
      {
        elementId: 'countdown-timer',
        instanceId: 'election_deadline',
        config: countdownConfig('Voting closes in', 5),
        size: { width: 340, height: 160 },
      },
      {
        elementId: 'result-list',
        instanceId: 'election_results',
        config: resultListConfig('Current vote totals'),
      },
    ],
    connections: [link('election_poll', 'results', 'election_results', 'items')],
  }),
  pattern({
    id: 'budget-vote',
    name: 'Budget Vote',
    description: 'Collect budget preferences and visualize allocation by category.',
    intent: 'multi-vote',
    keywords: ['budget vote', 'allocation', 'funding split', 'pie chart', 'finance vote'],
    spaceTypes: ['student_org', 'university_org'],
    elements: [
      {
        elementId: 'poll-element',
        instanceId: 'budget_poll',
        config: pollConfig('Which budget plan should we approve?', ['Plan A', 'Plan B', 'Plan C']),
      },
      {
        elementId: 'chart-display',
        instanceId: 'budget_chart',
        config: chartConfig('Budget preference distribution', 'pie'),
      },
    ],
    connections: [link('budget_poll', 'results', 'budget_chart', 'data')],
  }),
  pattern({
    id: 'constitutional-amendment',
    name: 'Constitutional Amendment',
    description: 'Publish amendment context and run a timed ratification vote.',
    intent: 'multi-vote',
    keywords: ['constitution', 'amendment', 'ratification', 'bylaws', 'approve amendment'],
    spaceTypes: ['student_org', 'university_org', 'greek_life'],
    elements: [
      {
        elementId: 'announcement',
        instanceId: 'amendment_context',
        config: announcementConfig('Amendment Proposal', 'Please review the updated bylaws before voting.'),
        size: { width: 340, height: 170 },
      },
      {
        elementId: 'poll-element',
        instanceId: 'amendment_poll',
        config: pollConfig('Do you approve this amendment?', ['Approve', 'Reject', 'Abstain']),
      },
      {
        elementId: 'countdown-timer',
        instanceId: 'amendment_deadline',
        config: countdownConfig('Ratification window ends in', 7),
        size: { width: 340, height: 160 },
      },
    ],
  }),
  pattern({
    id: 'officer-nominations',
    name: 'Officer Nominations',
    description: 'Collect nominations with rationale and list all submitted candidates.',
    intent: 'multi-vote',
    keywords: ['nominations', 'officer nominations', 'nominate', 'candidate form', 'elections'],
    spaceTypes: ['student_org', 'greek_life'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'nomination_form',
        config: formConfig(
          [
            { name: 'nominee_name', label: 'Nominee Name', type: 'text', required: true },
            { name: 'position', label: 'Position', type: 'select', required: true, options: ['President', 'Vice President', 'Treasurer', 'Secretary'] },
            { name: 'reason', label: 'Why this nominee?', type: 'textarea', required: true },
          ],
          'Submit Nomination'
        ),
      },
      {
        elementId: 'result-list',
        instanceId: 'nomination_list',
        config: resultListConfig('Submitted nominations'),
      },
    ],
    connections: [link('nomination_form', 'submissions', 'nomination_list', 'items')],
  }),
  pattern({
    id: 'motion-vote',
    name: 'Motion Vote',
    description: 'Publish motion text, keep a visible deadline, and run a formal vote.',
    intent: 'multi-vote',
    keywords: ['motion', 'meeting motion', 'parliamentary vote', 'approve motion', 'agenda vote'],
    spaceTypes: ['student_org', 'university_org'],
    elements: [
      {
        elementId: 'announcement',
        instanceId: 'motion_text',
        config: announcementConfig('Motion Under Consideration', 'Motion details are posted here for all voting members.'),
        size: { width: 340, height: 170 },
      },
      {
        elementId: 'poll-element',
        instanceId: 'motion_poll',
        config: pollConfig('How do you vote on this motion?', ['In Favor', 'Opposed', 'Abstain']),
      },
      {
        elementId: 'countdown-timer',
        instanceId: 'motion_deadline',
        config: countdownConfig('Motion closes in', 2),
        size: { width: 340, height: 160 },
      },
    ],
  }),
  pattern({
    id: 'board-decision-dashboard',
    name: 'Board Decision Dashboard',
    description: 'Run three board votes side-by-side with a central decision summary.',
    intent: 'multi-vote',
    keywords: ['board decisions', 'multi poll', 'board dashboard', 'meeting votes', 'simultaneous vote'],
    spaceTypes: ['student_org', 'university_org'],
    elements: [
      {
        elementId: 'poll-element',
        instanceId: 'board_vote_finance',
        config: pollConfig('Approve budget adjustment?', ['Approve', 'Reject']),
        position: { x: 0, y: 0 },
        size: { width: 320, height: 220 },
      },
      {
        elementId: 'poll-element',
        instanceId: 'board_vote_programming',
        config: pollConfig('Approve event plan?', ['Approve', 'Reject']),
        position: { x: 344, y: 0 },
        size: { width: 320, height: 220 },
      },
      {
        elementId: 'poll-element',
        instanceId: 'board_vote_policy',
        config: pollConfig('Adopt policy update?', ['Approve', 'Reject']),
        position: { x: 688, y: 0 },
        size: { width: 320, height: 220 },
      },
      {
        elementId: 'result-list',
        instanceId: 'board_summary',
        config: resultListConfig('Decision summary'),
        position: { x: 0, y: 244 },
        size: { width: 1008, height: 220 },
      },
    ],
    connections: [
      link('board_vote_finance', 'results', 'board_summary', 'items'),
      link('board_vote_programming', 'results', 'board_summary', 'items'),
      link('board_vote_policy', 'results', 'board_summary', 'items'),
    ],
  }),
  pattern({
    id: 'priority-ranking',
    name: 'Priority Ranking',
    description: 'Rank strategic priorities and publish the final ordering for execution.',
    intent: 'competition-goals',
    keywords: ['priority ranking', 'rank priorities', 'top priorities', 'roadmap vote', 'initiative ranking'],
    spaceTypes: ['student_org', 'university_org'],
    elements: [
      {
        elementId: 'poll-element',
        instanceId: 'priority_poll',
        config: pollConfig('Which initiatives should come first?', ['Recruitment', 'Fundraising', 'Programming', 'Partnerships'], true),
      },
      {
        elementId: 'leaderboard',
        instanceId: 'priority_board',
        config: leaderboardConfig('Priority order', 'votes'),
      },
      {
        elementId: 'result-list',
        instanceId: 'priority_notes',
        config: resultListConfig('Priority rationale'),
      },
    ],
    connections: [
      link('priority_poll', 'results', 'priority_board', 'entries'),
      link('priority_poll', 'results', 'priority_notes', 'items'),
    ],
  }),
  pattern({
    id: 'funding-request',
    name: 'Funding Request',
    description: 'Collect funding proposals, vote on them, and visualize support levels.',
    intent: 'competition-goals',
    keywords: ['funding request', 'budget request', 'grant vote', 'fund allocation', 'request funding'],
    spaceTypes: ['student_org', 'university_org'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'funding_form',
        config: formConfig(
          [
            { name: 'project_name', label: 'Project Name', type: 'text', required: true },
            { name: 'amount', label: 'Requested Amount', type: 'number', required: true },
            { name: 'impact', label: 'Expected Impact', type: 'textarea', required: true },
          ],
          'Submit Request'
        ),
      },
      {
        elementId: 'poll-element',
        instanceId: 'funding_vote',
        config: pollConfig('Should we fund this request?', ['Approve', 'Needs Revision', 'Decline']),
      },
      {
        elementId: 'chart-display',
        instanceId: 'funding_chart',
        config: chartConfig('Funding support breakdown', 'bar'),
      },
    ],
    connections: [link('funding_vote', 'results', 'funding_chart', 'data')],
  }),

  // Scheduling (6)
  pattern({
    id: 'office-hours',
    name: 'Office Hours Scheduler',
    description: 'Manage office-hour signups with a live deadline and quick broadcast notes.',
    intent: 'event-series',
    keywords: ['office hours', 'advisor hours', 'help session', 'drop-in', 'meeting slots'],
    spaceTypes: ['student_org', 'university_org', 'campus_living'],
    elements: [
      {
        elementId: 'rsvp-button',
        instanceId: 'hours_rsvp',
        config: rsvpConfig('Office Hours', 40),
        size: { width: 340, height: 140 },
      },
      {
        elementId: 'countdown-timer',
        instanceId: 'hours_countdown',
        config: countdownConfig('Next office hours start in', 3),
        size: { width: 340, height: 160 },
      },
      {
        elementId: 'announcement',
        instanceId: 'hours_note',
        config: announcementConfig('Bring Your Questions', 'Please submit topics in advance so we can prepare.'),
        size: { width: 340, height: 170 },
      },
    ],
  }),
  pattern({
    id: 'weekly-meeting',
    name: 'Weekly Meeting Planner',
    description: 'Coordinate attendance for recurring meetings and collect agenda topics.',
    intent: 'event-series',
    keywords: ['weekly meeting', 'recurring meeting', 'agenda', 'committee meeting', 'standing meeting'],
    spaceTypes: ['student_org', 'greek_life', 'university_org'],
    elements: [
      {
        elementId: 'rsvp-button',
        instanceId: 'meeting_rsvp',
        config: rsvpConfig('Weekly Meeting', 120),
        size: { width: 340, height: 140 },
      },
      {
        elementId: 'countdown-timer',
        instanceId: 'meeting_countdown',
        config: countdownConfig('Meeting starts in', 4),
        size: { width: 340, height: 160 },
      },
      {
        elementId: 'form-builder',
        instanceId: 'meeting_agenda',
        config: formConfig(
          [
            { name: 'topic', label: 'Agenda Topic', type: 'text', required: true },
            { name: 'owner', label: 'Topic Owner', type: 'text', required: true },
            { name: 'time_needed', label: 'Time Needed (minutes)', type: 'number', required: false },
          ],
          'Add Agenda Item'
        ),
      },
    ],
  }),
  pattern({
    id: 'study-group-finder',
    name: 'Study Group Finder',
    description: 'Capture availability and automatically list students with overlapping windows.',
    intent: 'group-matching',
    keywords: ['study group finder', 'study partners', 'availability match', 'find group', 'study buddy'],
    spaceTypes: ['student_org', 'campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'study_availability',
        config: formConfig(
          [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'course', label: 'Course', type: 'text', required: true },
            { name: 'availability', label: 'Availability', type: 'textarea', required: true },
            { name: 'preferred_location', label: 'Preferred Location', type: 'text', required: false },
          ],
          'Find Matches'
        ),
      },
      {
        elementId: 'result-list',
        instanceId: 'study_matches',
        config: resultListConfig('Matching study groups'),
      },
    ],
    connections: [link('study_availability', 'submissions', 'study_matches', 'items')],
  }),
  pattern({
    id: 'event-rsvp',
    name: 'Event RSVP',
    description: 'Track attendance commitments for a one-off event with live reminders.',
    intent: 'event-series',
    keywords: ['event rsvp', 'attendance list', 'who is coming', 'register event', 'headcount'],
    spaceTypes: ['student_org', 'greek_life', 'university_org'],
    elements: [
      {
        elementId: 'rsvp-button',
        instanceId: 'event_rsvp',
        config: rsvpConfig('Upcoming Event', 300),
        size: { width: 340, height: 140 },
      },
      {
        elementId: 'countdown-timer',
        instanceId: 'event_deadline',
        config: countdownConfig('RSVP closes in', 6),
        size: { width: 340, height: 160 },
      },
      {
        elementId: 'announcement',
        instanceId: 'event_reminder',
        config: announcementConfig('Event Reminder', 'Doors open 15 minutes early. Bring your student ID.'),
        size: { width: 340, height: 170 },
      },
    ],
  }),
  pattern({
    id: 'availability-grid',
    name: 'Availability Grid',
    description: 'Collect time-slot preferences and publish matches by time block.',
    intent: 'group-matching',
    keywords: ['availability grid', 'time slots', 'schedule matching', 'availability form', 'time matching'],
    spaceTypes: ['student_org', 'campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'availability_form',
        config: formConfig(
          [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'monday_slots', label: 'Monday Time Slots', type: 'text', required: false },
            { name: 'wednesday_slots', label: 'Wednesday Time Slots', type: 'text', required: false },
            { name: 'friday_slots', label: 'Friday Time Slots', type: 'text', required: false },
          ],
          'Save Availability'
        ),
      },
      {
        elementId: 'result-list',
        instanceId: 'availability_results',
        config: resultListConfig('Availability overlaps'),
      },
    ],
    connections: [link('availability_form', 'submissions', 'availability_results', 'items')],
  }),
  pattern({
    id: 'recurring-meetup',
    name: 'Recurring Meetup Tracker',
    description: 'Track recurring meetup attendance with countdowns and returning-member rankings.',
    intent: 'attendance-tracking',
    keywords: ['recurring meetup', 'weekly meetup', 'attendance streak', 'regular event', 'meetup tracker'],
    spaceTypes: ['student_org', 'greek_life', 'campus_living'],
    elements: [
      {
        elementId: 'rsvp-button',
        instanceId: 'meetup_rsvp',
        config: rsvpConfig('Weekly Meetup', 200),
        size: { width: 340, height: 140 },
      },
      {
        elementId: 'countdown-timer',
        instanceId: 'meetup_countdown',
        config: countdownConfig('Next meetup starts in', 7),
        size: { width: 340, height: 160 },
      },
      {
        elementId: 'leaderboard',
        instanceId: 'meetup_leaderboard',
        config: leaderboardConfig('Attendance streaks', 'sessions attended'),
      },
    ],
    connections: [link('meetup_rsvp', 'attendees', 'meetup_leaderboard', 'entries')],
  }),

  // Commerce (6)
  pattern({
    id: 'textbook-swap',
    name: 'Textbook Swap',
    description: 'Collect textbook listings and make them searchable for quick trades.',
    intent: 'resource-management',
    keywords: ['textbook swap', 'sell textbook', 'buy textbook', 'book exchange', 'course materials'],
    spaceTypes: ['student_org', 'campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'textbook_form',
        config: formConfig(
          [
            { name: 'course_code', label: 'Course Code', type: 'text', required: true },
            { name: 'book_title', label: 'Book Title', type: 'text', required: true },
            { name: 'price', label: 'Price', type: 'number', required: true },
            { name: 'condition', label: 'Condition', type: 'select', required: true, options: ['New', 'Good', 'Fair'] },
          ],
          'Post Listing'
        ),
      },
      {
        elementId: 'search-input',
        instanceId: 'textbook_search',
        config: searchConfig('Search by course code or title'),
        size: { width: 340, height: 120 },
      },
      {
        elementId: 'result-list',
        instanceId: 'textbook_results',
        config: resultListConfig('Available textbooks'),
      },
    ],
    connections: [
      link('textbook_form', 'submissions', 'textbook_results', 'items'),
      link('textbook_search', 'query', 'textbook_results', 'filter'),
    ],
  }),
  pattern({
    id: 'ticket-exchange',
    name: 'Ticket Exchange',
    description: 'List event tickets, search listings, and surface time-sensitive deadlines.',
    intent: 'resource-management',
    keywords: ['ticket exchange', 'sell tickets', 'buy tickets', 'event ticket', 'ticket board'],
    spaceTypes: ['student_org', 'campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'ticket_form',
        config: formConfig(
          [
            { name: 'event_name', label: 'Event Name', type: 'text', required: true },
            { name: 'ticket_count', label: 'Number of Tickets', type: 'number', required: true },
            { name: 'price', label: 'Price Per Ticket', type: 'number', required: true },
            { name: 'contact', label: 'Contact Info', type: 'text', required: true },
          ],
          'Post Ticket Listing'
        ),
      },
      {
        elementId: 'search-input',
        instanceId: 'ticket_search',
        config: searchConfig('Search tickets by event name'),
        size: { width: 340, height: 120 },
      },
      {
        elementId: 'countdown-timer',
        instanceId: 'ticket_cutoff',
        config: countdownConfig('Listing refresh in', 2),
        size: { width: 340, height: 160 },
      },
    ],
  }),
  pattern({
    id: 'services-board',
    name: 'Services Board',
    description: 'Collect student services and make providers discoverable by keyword.',
    intent: 'resource-management',
    keywords: ['services board', 'student services', 'offer service', 'hire student', 'gig board'],
    spaceTypes: ['student_org', 'campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'services_form',
        config: formConfig(
          [
            { name: 'service_name', label: 'Service', type: 'text', required: true },
            { name: 'provider', label: 'Provider Name', type: 'text', required: true },
            { name: 'rate', label: 'Rate', type: 'text', required: false },
            { name: 'details', label: 'Details', type: 'textarea', required: true },
          ],
          'Add Service'
        ),
      },
      {
        elementId: 'search-input',
        instanceId: 'services_search',
        config: searchConfig('Search tutoring, design, editing, and more'),
        size: { width: 340, height: 120 },
      },
      {
        elementId: 'result-list',
        instanceId: 'services_results',
        config: resultListConfig('Available services'),
      },
    ],
    connections: [
      link('services_form', 'submissions', 'services_results', 'items'),
      link('services_search', 'query', 'services_results', 'filter'),
    ],
  }),
  pattern({
    id: 'roommate-finder',
    name: 'Roommate Finder',
    description: 'Collect roommate preferences and search/filter matches quickly.',
    intent: 'group-matching',
    keywords: ['roommate finder', 'find roommate', 'housing match', 'roommate search', 'living preferences'],
    spaceTypes: ['campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'roommate_form',
        config: formConfig(
          [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'budget', label: 'Budget Range', type: 'text', required: true },
            { name: 'sleep_schedule', label: 'Sleep Schedule', type: 'select', required: true, options: ['Early', 'Flexible', 'Late'] },
            { name: 'preferences', label: 'Lifestyle Preferences', type: 'textarea', required: false },
          ],
          'Post Profile'
        ),
      },
      {
        elementId: 'search-input',
        instanceId: 'roommate_search',
        config: searchConfig('Search by budget, schedule, or interests'),
        size: { width: 340, height: 120 },
      },
      {
        elementId: 'result-list',
        instanceId: 'roommate_results',
        config: resultListConfig('Potential roommates'),
      },
    ],
    connections: [
      link('roommate_form', 'submissions', 'roommate_results', 'items'),
      link('roommate_search', 'query', 'roommate_results', 'filter'),
    ],
  }),
  pattern({
    id: 'sublet-board',
    name: 'Sublet Board',
    description: 'Post available sublets and allow students to search by term and location.',
    intent: 'resource-management',
    keywords: ['sublet', 'lease takeover', 'housing listing', 'apartment listing', 'rent takeover'],
    spaceTypes: ['campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'sublet_form',
        config: formConfig(
          [
            { name: 'location', label: 'Location', type: 'text', required: true },
            { name: 'rent', label: 'Monthly Rent', type: 'number', required: true },
            { name: 'term', label: 'Lease Term', type: 'text', required: true },
            { name: 'notes', label: 'Details', type: 'textarea', required: false },
          ],
          'Post Sublet'
        ),
      },
      {
        elementId: 'search-input',
        instanceId: 'sublet_search',
        config: searchConfig('Search by neighborhood, rent, or term'),
        size: { width: 340, height: 120 },
      },
      {
        elementId: 'result-list',
        instanceId: 'sublet_results',
        config: resultListConfig('Available sublets'),
      },
    ],
    connections: [
      link('sublet_form', 'submissions', 'sublet_results', 'items'),
      link('sublet_search', 'query', 'sublet_results', 'filter'),
    ],
  }),
  pattern({
    id: 'free-stuff',
    name: 'Free Stuff Board',
    description: 'Let members post free items and browse current giveaway inventory.',
    intent: 'resource-management',
    keywords: ['free stuff', 'giveaway', 'free items', 'curb alert', 'take it for free'],
    spaceTypes: ['campus_living', 'student_org'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'free_item_form',
        config: formConfig(
          [
            { name: 'item_name', label: 'Item Name', type: 'text', required: true },
            { name: 'pickup_location', label: 'Pickup Location', type: 'text', required: true },
            { name: 'pickup_window', label: 'Pickup Window', type: 'text', required: false },
          ],
          'Post Free Item'
        ),
      },
      {
        elementId: 'result-list',
        instanceId: 'free_item_results',
        config: resultListConfig('Available free items'),
      },
    ],
    connections: [link('free_item_form', 'submissions', 'free_item_results', 'items')],
  }),

  // Content (6)
  pattern({
    id: 'club-newsletter',
    name: 'Club Newsletter Signup',
    description: 'Publish newsletter highlights and collect new subscriber signups.',
    intent: 'suggestion-triage',
    keywords: ['club newsletter', 'email updates', 'subscribe', 'mailing list', 'weekly news'],
    spaceTypes: ['student_org', 'university_org', 'greek_life'],
    elements: [
      {
        elementId: 'announcement',
        instanceId: 'newsletter_intro',
        config: announcementConfig('This Week in the Club', 'Get updates on events, deadlines, and opportunities.'),
        size: { width: 340, height: 170 },
      },
      {
        elementId: 'form-builder',
        instanceId: 'newsletter_subscribe',
        config: formConfig(
          [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'interests', label: 'Topics You Care About', type: 'text', required: false },
          ],
          'Subscribe'
        ),
      },
    ],
  }),
  pattern({
    id: 'weekly-digest',
    name: 'Weekly Digest Dashboard',
    description: 'Summarize weekly activity with highlights, trend charts, and top items.',
    intent: 'suggestion-triage',
    keywords: ['weekly digest', 'weekly recap', 'summary dashboard', 'community highlights', 'weekly report'],
    spaceTypes: ['student_org', 'university_org'],
    elements: [
      {
        elementId: 'announcement',
        instanceId: 'digest_headline',
        config: announcementConfig('Weekly Highlights', 'Here is what happened this week across the space.'),
        size: { width: 340, height: 170 },
      },
      {
        elementId: 'chart-display',
        instanceId: 'digest_chart',
        config: chartConfig('Engagement trend', 'line'),
      },
      {
        elementId: 'result-list',
        instanceId: 'digest_items',
        config: resultListConfig('Top updates'),
      },
    ],
  }),
  pattern({
    id: 'meeting-minutes',
    name: 'Meeting Minutes Log',
    description: 'Capture meeting notes in a structured form and publish minutes immediately.',
    intent: 'suggestion-triage',
    keywords: ['meeting minutes', 'notes log', 'minutes tracker', 'meeting recap', 'action items'],
    spaceTypes: ['student_org', 'university_org'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'minutes_form',
        config: formConfig(
          [
            { name: 'meeting_date', label: 'Meeting Date', type: 'date', required: true },
            { name: 'attendees', label: 'Attendees', type: 'textarea', required: true },
            { name: 'decisions', label: 'Decisions Made', type: 'textarea', required: true },
            { name: 'next_steps', label: 'Next Steps', type: 'textarea', required: true },
          ],
          'Save Minutes'
        ),
      },
      {
        elementId: 'result-list',
        instanceId: 'minutes_list',
        config: resultListConfig('Published meeting minutes'),
      },
    ],
    connections: [link('minutes_form', 'submissions', 'minutes_list', 'items')],
  }),
  pattern({
    id: 'faq-board',
    name: 'FAQ Board',
    description: 'Capture recurring questions and keep searchable answers in one place.',
    intent: 'suggestion-triage',
    keywords: ['faq', 'questions board', 'common questions', 'help board', 'answers'],
    spaceTypes: ['student_org', 'university_org', 'campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'faq_form',
        config: formConfig(
          [
            { name: 'question', label: 'Question', type: 'textarea', required: true },
            { name: 'category', label: 'Category', type: 'select', required: true, options: ['General', 'Events', 'Membership', 'Finance'] },
          ],
          'Submit Question'
        ),
      },
      {
        elementId: 'result-list',
        instanceId: 'faq_results',
        config: resultListConfig('FAQ responses'),
      },
    ],
    connections: [link('faq_form', 'submissions', 'faq_results', 'items')],
  }),
  pattern({
    id: 'resource-library',
    name: 'Resource Library',
    description: 'Collect shared resources and enable fast keyword lookup across the library.',
    intent: 'resource-management',
    keywords: ['resource library', 'document hub', 'shared resources', 'materials library', 'knowledge base'],
    spaceTypes: ['student_org', 'university_org'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'resource_form',
        config: formConfig(
          [
            { name: 'title', label: 'Resource Title', type: 'text', required: true },
            { name: 'link', label: 'Resource Link', type: 'text', required: true },
            { name: 'topic', label: 'Topic', type: 'text', required: true },
          ],
          'Add Resource'
        ),
      },
      {
        elementId: 'search-input',
        instanceId: 'resource_search',
        config: searchConfig('Search resources by title, topic, or tag'),
        size: { width: 340, height: 120 },
      },
      {
        elementId: 'result-list',
        instanceId: 'resource_results',
        config: resultListConfig('Library resources'),
      },
    ],
    connections: [
      link('resource_form', 'submissions', 'resource_results', 'items'),
      link('resource_search', 'query', 'resource_results', 'filter'),
    ],
  }),
  pattern({
    id: 'announcements-feed',
    name: 'Announcements Feed',
    description: 'Broadcast updates with a rotating countdown for the next major deadline.',
    intent: 'event-series',
    keywords: ['announcements feed', 'bulletin', 'club updates', 'news feed', 'announcements'],
    spaceTypes: ['student_org', 'university_org', 'greek_life'],
    elements: [
      {
        elementId: 'announcement',
        instanceId: 'announcement_primary',
        config: announcementConfig('Latest Announcement', 'Pin urgent updates here so everyone sees them first.'),
        size: { width: 340, height: 170 },
      },
      {
        elementId: 'countdown-timer',
        instanceId: 'announcement_deadline',
        config: countdownConfig('Next major deadline in', 10),
        size: { width: 340, height: 160 },
      },
    ],
  }),

  // Social (6)
  pattern({
    id: 'icebreaker',
    name: 'Icebreaker Poll',
    description: 'Kick off meetings with a quick social question and visible responses.',
    intent: 'group-matching',
    keywords: ['icebreaker', 'warmup', 'intro question', 'get to know', 'social prompt'],
    spaceTypes: ['student_org', 'greek_life', 'campus_living'],
    elements: [
      {
        elementId: 'poll-element',
        instanceId: 'icebreaker_poll',
        config: pollConfig('What is your ideal weekend plan?', ['Outdoors', 'Game Night', 'Study Session', 'Food Crawl']),
      },
      {
        elementId: 'result-list',
        instanceId: 'icebreaker_results',
        config: resultListConfig('Icebreaker responses'),
      },
    ],
    connections: [link('icebreaker_poll', 'results', 'icebreaker_results', 'items')],
  }),
  pattern({
    id: 'two-truths-and-a-lie',
    name: 'Two Truths and a Lie',
    description: 'Collect entries, run guesses, and show answer outcomes in one board.',
    intent: 'photo-challenge',
    keywords: ['two truths and a lie', 'guessing game', 'icebreaker game', 'truth lie', 'party game'],
    spaceTypes: ['student_org', 'greek_life', 'campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'truth_lie_form',
        config: formConfig(
          [
            { name: 'name', label: 'Your Name', type: 'text', required: true },
            { name: 'statement_one', label: 'Statement 1', type: 'text', required: true },
            { name: 'statement_two', label: 'Statement 2', type: 'text', required: true },
            { name: 'statement_three', label: 'Statement 3', type: 'text', required: true },
          ],
          'Submit Entry'
        ),
      },
      {
        elementId: 'poll-element',
        instanceId: 'truth_lie_vote',
        config: pollConfig('Which statement is the lie?', ['Statement 1', 'Statement 2', 'Statement 3']),
      },
      {
        elementId: 'result-list',
        instanceId: 'truth_lie_results',
        config: resultListConfig('Game outcomes'),
      },
    ],
    connections: [link('truth_lie_vote', 'results', 'truth_lie_results', 'items')],
  }),
  pattern({
    id: 'this-or-that',
    name: 'This or That',
    description: 'Run fast binary polls and visualize split preferences instantly.',
    intent: 'multi-vote',
    keywords: ['this or that', 'either or', 'binary poll', 'versus', 'quick vote'],
    spaceTypes: ['student_org', 'greek_life', 'campus_living'],
    elements: [
      {
        elementId: 'poll-element',
        instanceId: 'this_that_poll',
        config: pollConfig('Which one do you prefer?', ['Option A', 'Option B']),
      },
      {
        elementId: 'chart-display',
        instanceId: 'this_that_chart',
        config: chartConfig('Preference split', 'bar'),
      },
    ],
    connections: [link('this_that_poll', 'results', 'this_that_chart', 'data')],
  }),
  pattern({
    id: 'superlatives',
    name: 'Superlatives Board',
    description: 'Vote on fun categories, show winners, and maintain a rolling leaderboard.',
    intent: 'competition-goals',
    keywords: ['superlatives', 'best of', 'awards vote', 'fun awards', 'class superlatives'],
    spaceTypes: ['student_org', 'greek_life'],
    elements: [
      {
        elementId: 'poll-element',
        instanceId: 'superlative_poll',
        config: pollConfig('Who deserves this superlative?', ['Nominee A', 'Nominee B', 'Nominee C']),
      },
      {
        elementId: 'result-list',
        instanceId: 'superlative_results',
        config: resultListConfig('Category winners'),
      },
      {
        elementId: 'leaderboard',
        instanceId: 'superlative_leaderboard',
        config: leaderboardConfig('Top nominees', 'wins'),
      },
    ],
    connections: [
      link('superlative_poll', 'results', 'superlative_results', 'items'),
      link('superlative_poll', 'results', 'superlative_leaderboard', 'entries'),
    ],
  }),
  pattern({
    id: 'shoutout-wall',
    name: 'Shoutout Wall',
    description: 'Collect member shoutouts and display them as a rolling recognition feed.',
    intent: 'photo-challenge',
    keywords: ['shoutout wall', 'kudos board', 'recognition wall', 'member shoutout', 'appreciation posts'],
    spaceTypes: ['student_org', 'greek_life', 'university_org'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'shoutout_form',
        config: formConfig(
          [
            { name: 'member_name', label: 'Who are you shouting out?', type: 'text', required: true },
            { name: 'reason', label: 'Why are they awesome?', type: 'textarea', required: true },
          ],
          'Post Shoutout'
        ),
      },
      {
        elementId: 'result-list',
        instanceId: 'shoutout_feed',
        config: resultListConfig('Latest shoutouts'),
      },
    ],
    connections: [link('shoutout_form', 'submissions', 'shoutout_feed', 'items')],
  }),
  pattern({
    id: 'hot-takes',
    name: 'Hot Takes Arena',
    description: 'Collect takes, rank winners, and chart vote momentum across debates.',
    intent: 'competition-goals',
    keywords: ['hot takes', 'debate poll', 'controversial opinions', 'rank takes', 'take battle'],
    spaceTypes: ['student_org', 'greek_life', 'campus_living'],
    elements: [
      {
        elementId: 'poll-element',
        instanceId: 'hot_takes_poll',
        config: pollConfig('Which take wins this round?', ['Take A', 'Take B', 'Take C']),
      },
      {
        elementId: 'chart-display',
        instanceId: 'hot_takes_chart',
        config: chartConfig('Round-by-round momentum', 'line'),
      },
      {
        elementId: 'leaderboard',
        instanceId: 'hot_takes_board',
        config: leaderboardConfig('Top takes', 'votes'),
      },
    ],
    connections: [
      link('hot_takes_poll', 'results', 'hot_takes_chart', 'data'),
      link('hot_takes_poll', 'results', 'hot_takes_board', 'entries'),
    ],
  }),

  // Events (6)
  pattern({
    id: 'event-countdown',
    name: 'Event Countdown Hub',
    description: 'Combine a countdown, RSVP capture, and event briefing in one launch screen.',
    intent: 'event-series',
    keywords: ['event countdown', 'launch countdown', 'event kickoff', 'countdown hub', 'registration countdown'],
    spaceTypes: ['student_org', 'greek_life', 'university_org'],
    elements: [
      {
        elementId: 'countdown-timer',
        instanceId: 'launch_countdown',
        config: countdownConfig('Event starts in', 12),
        size: { width: 340, height: 160 },
      },
      {
        elementId: 'rsvp-button',
        instanceId: 'launch_rsvp',
        config: rsvpConfig('Flagship Event', 500),
        size: { width: 340, height: 140 },
      },
      {
        elementId: 'announcement',
        instanceId: 'launch_details',
        config: announcementConfig('Event Details', 'Check-in opens 30 minutes early. Bring required materials.'),
        size: { width: 340, height: 170 },
      },
    ],
  }),
  pattern({
    id: 'event-feedback',
    name: 'Event Feedback Analyzer',
    description: 'Collect post-event feedback and surface sentiment trends with comments.',
    intent: 'suggestion-triage',
    keywords: ['event feedback', 'post event survey', 'event review', 'event retrospective', 'improvement feedback'],
    spaceTypes: ['student_org', 'university_org', 'greek_life'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'feedback_form',
        config: formConfig(
          [
            { name: 'overall_rating', label: 'Overall Rating (1-5)', type: 'number', required: true },
            { name: 'favorite_part', label: 'Favorite Part', type: 'textarea', required: false },
            { name: 'improvement', label: 'What should improve?', type: 'textarea', required: false },
          ],
          'Submit Feedback'
        ),
      },
      {
        elementId: 'chart-display',
        instanceId: 'feedback_chart',
        config: chartConfig('Average rating trend', 'line'),
      },
      {
        elementId: 'result-list',
        instanceId: 'feedback_comments',
        config: resultListConfig('Recent comments'),
      },
    ],
    connections: [
      link('feedback_form', 'submissions', 'feedback_comments', 'items'),
      link('feedback_form', 'submissions', 'feedback_chart', 'data'),
    ],
  }),
  pattern({
    id: 'event-leaderboard',
    name: 'Event Leaderboard',
    description: 'Track top event contributors with rank and performance trend charts.',
    intent: 'competition-goals',
    keywords: ['event leaderboard', 'event winners', 'top performers', 'competition board', 'event scores'],
    spaceTypes: ['student_org', 'greek_life'],
    elements: [
      {
        elementId: 'leaderboard',
        instanceId: 'event_rankings',
        config: leaderboardConfig('Event standings', 'points'),
      },
      {
        elementId: 'chart-display',
        instanceId: 'event_trends',
        config: chartConfig('Score trends', 'line'),
      },
    ],
    connections: [link('event_rankings', 'entries', 'event_trends', 'data')],
  }),
  pattern({
    id: 'event-checkin',
    name: 'Event Check-In',
    description: 'Capture check-ins and surface high-participation members live.',
    intent: 'attendance-tracking',
    keywords: ['event checkin', 'check in', 'attendance check', 'arrival log', 'sign in'],
    spaceTypes: ['student_org', 'greek_life', 'university_org'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'checkin_form',
        config: formConfig(
          [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'student_id', label: 'Student ID', type: 'text', required: false },
            { name: 'arrival_time', label: 'Arrival Time', type: 'time', required: false },
          ],
          'Check In'
        ),
      },
      {
        elementId: 'leaderboard',
        instanceId: 'checkin_leaderboard',
        config: leaderboardConfig('Most frequent attendees', 'check-ins'),
      },
    ],
    connections: [link('checkin_form', 'submissions', 'checkin_leaderboard', 'entries')],
  }),
  pattern({
    id: 'event-photo-wall',
    name: 'Event Photo Wall',
    description: 'Collect event captions and publish a moderated wall of submitted moments.',
    intent: 'photo-challenge',
    keywords: ['event photo wall', 'photo captions', 'event memories', 'share photos', 'photo board'],
    spaceTypes: ['student_org', 'greek_life', 'campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'photo_caption_form',
        config: formConfig(
          [
            { name: 'photo_link', label: 'Photo Link', type: 'text', required: true },
            { name: 'caption', label: 'Caption', type: 'textarea', required: true },
            { name: 'credit', label: 'Photo Credit', type: 'text', required: false },
          ],
          'Submit Photo'
        ),
      },
      {
        elementId: 'result-list',
        instanceId: 'photo_wall',
        config: resultListConfig('Submitted event photos'),
      },
    ],
    connections: [link('photo_caption_form', 'submissions', 'photo_wall', 'items')],
  }),
  pattern({
    id: 'event-agenda',
    name: 'Event Agenda Board',
    description: 'Publish agenda sequence with a live timer to keep events on schedule.',
    intent: 'event-series',
    keywords: ['event agenda', 'run of show', 'program schedule', 'agenda board', 'timeline'],
    spaceTypes: ['student_org', 'university_org', 'greek_life'],
    elements: [
      {
        elementId: 'result-list',
        instanceId: 'agenda_items',
        config: {
          ...resultListConfig('Agenda timeline'),
          emptyState: 'No agenda items yet',
        },
      },
      {
        elementId: 'countdown-timer',
        instanceId: 'agenda_timer',
        config: countdownConfig('Current segment ends in', 1),
        size: { width: 340, height: 160 },
      },
    ],
  }),

  // Org Management (6)
  pattern({
    id: 'attendance-tracker',
    name: 'Attendance Tracker',
    description: 'Capture attendance submissions and visualize participation by member.',
    intent: 'attendance-tracking',
    keywords: ['attendance tracker', 'participation tracking', 'attendance analytics', 'meeting attendance', 'engagement score'],
    spaceTypes: ['student_org', 'greek_life', 'university_org'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'attendance_form',
        config: formConfig(
          [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'event_name', label: 'Event', type: 'text', required: true },
            { name: 'status', label: 'Status', type: 'select', required: true, options: ['Present', 'Late', 'Excused', 'Absent'] },
          ],
          'Log Attendance'
        ),
      },
      {
        elementId: 'leaderboard',
        instanceId: 'attendance_leaderboard',
        config: leaderboardConfig('Attendance leaders', 'attendance points'),
      },
      {
        elementId: 'chart-display',
        instanceId: 'attendance_chart',
        config: chartConfig('Attendance by week', 'line'),
      },
    ],
    connections: [
      link('attendance_form', 'submissions', 'attendance_leaderboard', 'entries'),
      link('attendance_form', 'submissions', 'attendance_chart', 'data'),
    ],
  }),
  pattern({
    id: 'member-directory',
    name: 'Member Directory',
    description: 'Search members quickly and display profiles in a clean list view.',
    intent: 'group-matching',
    keywords: ['member directory', 'find members', 'roster search', 'member lookup', 'contact directory'],
    spaceTypes: ['student_org', 'university_org', 'greek_life'],
    elements: [
      {
        elementId: 'search-input',
        instanceId: 'member_search',
        config: searchConfig('Search by name, major, or role'),
        size: { width: 340, height: 120 },
      },
      {
        elementId: 'result-list',
        instanceId: 'member_results',
        config: resultListConfig('Member directory'),
      },
    ],
    connections: [link('member_search', 'query', 'member_results', 'filter')],
  }),
  pattern({
    id: 'committee-tracker',
    name: 'Committee Tracker',
    description: 'Track committee deliverables and visualize completion trends.',
    intent: 'attendance-tracking',
    keywords: ['committee tracker', 'committee progress', 'committee updates', 'committee dashboard', 'working groups'],
    spaceTypes: ['student_org', 'university_org'],
    elements: [
      {
        elementId: 'result-list',
        instanceId: 'committee_list',
        config: resultListConfig('Committee tasks and owners'),
      },
      {
        elementId: 'chart-display',
        instanceId: 'committee_chart',
        config: chartConfig('Completion by committee', 'bar'),
      },
    ],
    connections: [link('committee_list', 'items', 'committee_chart', 'data')],
  }),
  pattern({
    id: 'task-board',
    name: 'Task Board',
    description: 'Capture actionable tasks and keep a visible list of open items.',
    intent: 'resource-management',
    keywords: ['task board', 'to do board', 'action tracker', 'task list', 'assign tasks'],
    spaceTypes: ['student_org', 'university_org', 'campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'task_form',
        config: formConfig(
          [
            { name: 'task', label: 'Task', type: 'text', required: true },
            { name: 'owner', label: 'Owner', type: 'text', required: true },
            { name: 'due_date', label: 'Due Date', type: 'date', required: false },
            { name: 'priority', label: 'Priority', type: 'select', required: true, options: ['High', 'Medium', 'Low'] },
          ],
          'Add Task'
        ),
      },
      {
        elementId: 'result-list',
        instanceId: 'task_results',
        config: resultListConfig('Open tasks'),
      },
    ],
    connections: [link('task_form', 'submissions', 'task_results', 'items')],
  }),
  pattern({
    id: 'equipment-checkout',
    name: 'Equipment Checkout',
    description: 'Track equipment requests, current checkouts, and return deadlines.',
    intent: 'resource-management',
    keywords: ['equipment checkout', 'borrow equipment', 'inventory checkout', 'gear booking', 'resource lending'],
    spaceTypes: ['student_org', 'university_org', 'campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'checkout_form',
        config: formConfig(
          [
            { name: 'item_name', label: 'Item Name', type: 'text', required: true },
            { name: 'borrower', label: 'Borrower', type: 'text', required: true },
            { name: 'return_date', label: 'Return Date', type: 'date', required: true },
          ],
          'Check Out Item'
        ),
      },
      {
        elementId: 'result-list',
        instanceId: 'checkout_results',
        config: resultListConfig('Currently checked out'),
      },
      {
        elementId: 'countdown-timer',
        instanceId: 'checkout_due',
        config: countdownConfig('Next return due in', 3),
        size: { width: 340, height: 160 },
      },
    ],
    connections: [link('checkout_form', 'submissions', 'checkout_results', 'items')],
  }),
  pattern({
    id: 'budget-tracker',
    name: 'Budget Tracker',
    description: 'Collect transactions, chart spending, and keep a detailed budget ledger.',
    intent: 'competition-goals',
    keywords: ['budget tracker', 'expense tracker', 'finance dashboard', 'budget log', 'spending chart'],
    spaceTypes: ['student_org', 'university_org'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'budget_entry_form',
        config: formConfig(
          [
            { name: 'transaction_name', label: 'Transaction', type: 'text', required: true },
            { name: 'amount', label: 'Amount', type: 'number', required: true },
            { name: 'category', label: 'Category', type: 'select', required: true, options: ['Travel', 'Programming', 'Marketing', 'Operations'] },
          ],
          'Log Transaction'
        ),
      },
      {
        elementId: 'chart-display',
        instanceId: 'budget_spend_chart',
        config: chartConfig('Spending by category', 'pie'),
      },
      {
        elementId: 'result-list',
        instanceId: 'budget_entries',
        config: resultListConfig('Recent transactions'),
      },
    ],
    connections: [
      link('budget_entry_form', 'submissions', 'budget_entries', 'items'),
      link('budget_entry_form', 'submissions', 'budget_spend_chart', 'data'),
    ],
  }),

  // Campus Life (6)
  pattern({
    id: 'dining-decider',
    name: 'Dining Decider',
    description: 'Blend dining recommendations with a final group vote.',
    intent: 'find-food',
    keywords: ['dining decider', 'where should we eat', 'food vote', 'pick dining hall', 'meal choice'],
    spaceTypes: ['campus_living', 'student_org'],
    elements: [
      {
        elementId: 'dining-picker',
        instanceId: 'dining_picker',
        config: {
          title: 'Where should we eat?',
          showFilters: true,
          showRecommendation: true,
          maxItems: 6,
        },
      },
      {
        elementId: 'poll-element',
        instanceId: 'dining_poll',
        config: pollConfig('Final pick for tonight?', ['Location A', 'Location B', 'Location C']),
      },
    ],
    connections: [link('dining_picker', 'options', 'dining_poll', 'options')],
  }),
  pattern({
    id: 'study-spot-ranker',
    name: 'Study Spot Ranker',
    description: 'Surface study spaces and rank favorites based on member feedback.',
    intent: 'find-study-spot',
    keywords: ['study spot ranker', 'best study spaces', 'rank study spots', 'library ranking', 'quiet places'],
    spaceTypes: ['student_org', 'campus_living'],
    elements: [
      {
        elementId: 'study-spot-finder',
        instanceId: 'study_spot_finder',
        config: {
          title: 'Find Study Spots',
          showFilters: true,
          showRecommendation: true,
          maxItems: 8,
        },
      },
      {
        elementId: 'leaderboard',
        instanceId: 'study_spot_board',
        config: leaderboardConfig('Top-rated study spots', 'upvotes'),
      },
    ],
    connections: [link('study_spot_finder', 'results', 'study_spot_board', 'entries')],
  }),
  pattern({
    id: 'campus-event-feed',
    name: 'Campus Event Feed',
    description: 'Personalize campus event discovery and capture intent to attend.',
    intent: 'discover-events',
    keywords: ['campus event feed', 'event recommendations', 'what is happening', 'events for me', 'event discovery'],
    spaceTypes: ['student_org', 'campus_living', 'greek_life'],
    elements: [
      {
        elementId: 'personalized-event-feed',
        instanceId: 'campus_events_feed',
        config: {
          title: 'Events For You',
          timeRange: 'this-week',
          maxItems: 10,
          showFriendCount: true,
        },
      },
      {
        elementId: 'rsvp-button',
        instanceId: 'campus_event_rsvp',
        config: rsvpConfig('Selected Campus Event', 250),
        size: { width: 340, height: 140 },
      },
    ],
    connections: [link('campus_events_feed', 'selectedEvent', 'campus_event_rsvp', 'event')],
  }),
  pattern({
    id: 'course-review',
    name: 'Course Review Hub',
    description: 'Collect course feedback and rank classes with trend visibility.',
    intent: 'competition-goals',
    keywords: ['course review', 'class rating', 'course feedback', 'best classes', 'course ranking'],
    spaceTypes: ['student_org', 'university_org', 'campus_living'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'course_review_form',
        config: formConfig(
          [
            { name: 'course', label: 'Course', type: 'text', required: true },
            { name: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
            { name: 'notes', label: 'Review Notes', type: 'textarea', required: false },
          ],
          'Submit Review'
        ),
      },
      {
        elementId: 'leaderboard',
        instanceId: 'course_leaderboard',
        config: leaderboardConfig('Top-rated courses', 'average rating'),
      },
      {
        elementId: 'chart-display',
        instanceId: 'course_rating_chart',
        config: chartConfig('Course rating distribution', 'bar'),
      },
    ],
    connections: [
      link('course_review_form', 'submissions', 'course_leaderboard', 'entries'),
      link('course_review_form', 'submissions', 'course_rating_chart', 'data'),
    ],
  }),
  pattern({
    id: 'professor-rating',
    name: 'Professor Rating Board',
    description: 'Collect instructor reviews, chart ratings, and publish recent feedback.',
    intent: 'suggestion-triage',
    keywords: ['professor rating', 'instructor review', 'class feedback', 'teacher rating', 'professor reviews'],
    spaceTypes: ['student_org', 'university_org'],
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'professor_form',
        config: formConfig(
          [
            { name: 'professor', label: 'Professor Name', type: 'text', required: true },
            { name: 'course', label: 'Course', type: 'text', required: true },
            { name: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
            { name: 'comment', label: 'Comment', type: 'textarea', required: false },
          ],
          'Submit Rating'
        ),
      },
      {
        elementId: 'chart-display',
        instanceId: 'professor_chart',
        config: chartConfig('Professor ratings', 'bar'),
      },
      {
        elementId: 'result-list',
        instanceId: 'professor_results',
        config: resultListConfig('Recent reviews'),
      },
    ],
    connections: [
      link('professor_form', 'submissions', 'professor_chart', 'data'),
      link('professor_form', 'submissions', 'professor_results', 'items'),
    ],
  }),
  pattern({
    id: 'campus-guide',
    name: 'Campus Guide Search',
    description: 'Provide a searchable campus guide for resources, offices, and services.',
    intent: 'search-filter',
    keywords: ['campus guide', 'where is', 'campus resources', 'service locator', 'campus search'],
    spaceTypes: ['campus_living', 'student_org', 'university_org'],
    elements: [
      {
        elementId: 'search-input',
        instanceId: 'campus_guide_search',
        config: searchConfig('Search buildings, services, and offices'),
        size: { width: 340, height: 120 },
      },
      {
        elementId: 'result-list',
        instanceId: 'campus_guide_results',
        config: resultListConfig('Campus resources'),
      },
    ],
    connections: [link('campus_guide_search', 'query', 'campus_guide_results', 'filter')],
  }),
];

export const COMPOSITION_PATTERNS: Partial<Record<Intent, CompositionPattern[]>> = {};

for (const item of ALL_PATTERNS) {
  const existing = COMPOSITION_PATTERNS[item.intent];
  if (existing) {
    existing.push(item);
  } else {
    COMPOSITION_PATTERNS[item.intent] = [item];
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSpaceType(spaceType?: string): string | null {
  if (!spaceType) {
    return null;
  }

  const normalized = normalizeText(spaceType).replace(/\s+/g, '_');

  switch (normalized) {
    case 'student_organizations':
    case 'student_orgs':
      return 'student_org';
    case 'university_organizations':
      return 'university_org';
    default:
      return normalized;
  }
}

function scorePattern(
  patternToScore: CompositionPattern,
  normalizedPrompt: string,
  promptTokens: Set<string>,
  normalizedSpaceType: string | null
): number {
  let score = 1;

  for (const keyword of patternToScore.keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) {
      continue;
    }

    if (normalizedPrompt.includes(normalizedKeyword)) {
      score += normalizedKeyword.includes(' ') ? 5 : 3;
      continue;
    }

    const parts = normalizedKeyword.split(' ').filter(Boolean);
    const overlap = parts.filter((part) => promptTokens.has(part)).length;
    if (overlap > 0) {
      score += overlap;
    }
  }

  const normalizedName = normalizeText(patternToScore.name);
  if (normalizedName && normalizedPrompt.includes(normalizedName)) {
    score += 2;
  }

  if (normalizedSpaceType && patternToScore.spaceTypes) {
    const matchesSpaceType = patternToScore.spaceTypes.some(
      (spaceType) => normalizeSpaceType(spaceType) === normalizedSpaceType
    );

    if (matchesSpaceType) {
      score += 4;
    }
  }

  return score;
}

export function getPatternForIntent(
  intent: Intent,
  prompt: string,
  spaceType?: string
): CompositionPattern | null {
  const candidates = COMPOSITION_PATTERNS[intent];
  if (!candidates || candidates.length === 0) {
    return null;
  }

  const normalizedPrompt = normalizeText(prompt);
  const promptTokens = new Set(normalizedPrompt.split(' ').filter(Boolean));
  const normalizedSpaceType = normalizeSpaceType(spaceType);

  let bestPattern: CompositionPattern | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    const score = scorePattern(candidate, normalizedPrompt, promptTokens, normalizedSpaceType);
    if (!bestPattern || score > bestScore) {
      bestPattern = candidate;
      bestScore = score;
    }
  }

  return bestPattern ? clonePattern(bestPattern) : null;
}

function upsertFormField(
  config: Record<string, unknown>,
  field: Record<string, unknown>
): void {
  const fieldName = typeof field.name === 'string' ? field.name : '';
  const existingFields = Array.isArray(config.fields) ? [...config.fields] : [];
  const hasField = existingFields.some(
    (item) =>
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      (item as Record<string, unknown>).name === fieldName
  );

  if (!hasField) {
    existingFields.push(field);
  }

  config.fields = existingFields;
}

function getString(config: Record<string, unknown>, key: string, fallback: string): string {
  const value = config[key];
  return typeof value === 'string' ? value : fallback;
}

function withPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value : `${prefix}${value}`;
}

export function enrichPatternForSpace(
  pattern: CompositionPattern,
  spaceContext: { name: string; type: string; memberCount: number }
): CompositionPattern {
  const normalizedSpaceType = normalizeSpaceType(spaceContext.type);
  const memberCount = spaceContext.memberCount;
  const smallSpace = memberCount < 20;
  const largeSpace = memberCount >= 100;

  const enriched = clonePattern(pattern);

  enriched.elements = enriched.elements.map((element) => {
    const config = cloneConfig(element.config);

    if (element.elementId === 'form-builder') {
      if (normalizedSpaceType === 'greek_life') {
        upsertFormField(config, {
          name: 'chapter_position',
          label: 'Chapter Position',
          type: 'select',
          required: false,
          options: ['Recruitment', 'Philanthropy', 'Academics', 'Social'],
        });
        upsertFormField(config, {
          name: 'pledge_class',
          label: 'Pledge Class',
          type: 'text',
          required: false,
        });
      }

      if (normalizedSpaceType === 'student_org') {
        upsertFormField(config, {
          name: 'position',
          label: 'Position',
          type: 'text',
          required: false,
        });
        upsertFormField(config, {
          name: 'committee',
          label: 'Committee',
          type: 'text',
          required: false,
        });
      }

      if (normalizedSpaceType === 'campus_living') {
        upsertFormField(config, {
          name: 'building',
          label: 'Building',
          type: 'text',
          required: false,
        });
        upsertFormField(config, {
          name: 'floor',
          label: 'Floor',
          type: 'text',
          required: false,
        });
      }

      if (normalizedSpaceType === 'university_org') {
        upsertFormField(config, {
          name: 'department',
          label: 'Department',
          type: 'text',
          required: false,
        });
        config.submitButtonText = 'Submit Request';
      }

      if (smallSpace) {
        const fields = Array.isArray(config.fields) ? [...config.fields] : [];
        config.fields = fields.slice(0, 4);
      }

      if (largeSpace) {
        config.pagination = { enabled: true, pageSize: 25 };
        config.batchSummary = `${spaceContext.name} has ${memberCount} members; enable grouped responses by committee or section.`;
      }
    }

    if (element.elementId === 'poll-element') {
      if (normalizedSpaceType === 'greek_life') {
        const options = Array.isArray(config.options) ? [...config.options] : [];
        if (options.length < 4) {
          config.options = ['Recruitment', 'Philanthropy', 'Brotherhood/Sisterhood', 'Academics'];
        }
        config.question = withPrefix(
          getString(config, 'question', 'Which chapter priority should we focus on?'),
          'Chapter Poll: '
        );
      }

      if (normalizedSpaceType === 'university_org') {
        config.question = withPrefix(
          getString(config, 'question', 'Please select the preferred option.'),
          'Official Ballot: '
        );
      }

      if (smallSpace) {
        const options = Array.isArray(config.options) ? [...config.options] : [];
        config.options = options.slice(0, 3);
      }
    }

    if (element.elementId === 'announcement') {
      const baseTitle = getString(config, 'title', 'Update');
      const baseBody = getString(config, 'body', 'Please review the latest update.');

      if (normalizedSpaceType === 'greek_life') {
        config.title = withPrefix(baseTitle, 'Chapter Update: ');
        config.body = `${baseBody} Coordinate with your pledge class and committee leads.`;
      } else if (normalizedSpaceType === 'university_org') {
        config.title = withPrefix(baseTitle, 'Official Notice: ');
        config.body = `${baseBody} This notice is issued for ${spaceContext.name}.`;
      } else if (normalizedSpaceType === 'student_org') {
        config.body = `${baseBody} Committee updates should include owner and due date.`;
      } else if (normalizedSpaceType === 'campus_living') {
        config.body = `${baseBody} Include building and floor details when relevant.`;
      }
    }

    if (element.elementId === 'result-list') {
      if (smallSpace) {
        config.itemsPerPage = 5;
      } else if (largeSpace) {
        config.itemsPerPage = 25;
        config.showPagination = true;
        config.paginationHint = 'Use search and filters to manage large result volumes.';
      }
    }

    if (element.elementId === 'leaderboard') {
      if (smallSpace) {
        config.maxEntries = 5;
      } else if (largeSpace) {
        config.maxEntries = 25;
      }
    }

    if (element.elementId === 'chart-display' && largeSpace) {
      config.showSummary = true;
      config.summaryLabel = `Aggregated summary for ${memberCount}+ participants`;
    }

    return {
      ...element,
      config,
    };
  });

  return enriched;
}
