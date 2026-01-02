/**
 * Content Library - The Soul of the Landing
 *
 * This is the most important file for the landing page.
 * Every piece of content here should feel REAL and show VALUE.
 *
 * Rules:
 * - No corporate speak
 * - No perfect grammar (students don't text perfectly)
 * - Inside jokes > explanations
 * - Lowercase > proper case
 * - Personality > professionalism
 * - If it sounds like marketing, delete it
 * - SHOW OUTCOMES, not features
 * - Create FOMO, not interest
 */

export interface MessageFragment {
  id: string;
  text: string;
  /** Optional: adds context without showing full convo */
  context?: string;
  /** Visual weight: how prominent this should be */
  weight: 'hero' | 'accent' | 'ambient';
  /** Optional: show reactions */
  reactions?: { emoji: string; count: number }[];
  /** Optional: show as reply */
  replyTo?: string;
}

export interface SpaceFragment {
  id: string;
  name: string;
  /** Short, punchy - not "127 members" but "47 here" */
  activity: string;
  /** Is this space popping right now? */
  hot?: boolean;
  /** Optional: show recent action */
  recentAction?: string;
}

export interface ToolFragment {
  id: string;
  name: string;
  /** One line that shows value */
  hook: string;
  /** Visual indicator of activity - should show RESULT */
  stat?: string;
  /** Optional: show usage */
  uses?: string;
}

export interface ActivityFragment {
  id: string;
  /** Action text like "Sarah saved 3 hours" */
  action: string;
  /** Time ago */
  when: string;
  /** Type for styling */
  type: 'join' | 'create' | 'share' | 'achieve';
}

// ============================================
// MESSAGES - These should make you want to join
// ============================================

export const MESSAGE_FRAGMENTS: MessageFragment[] = [
  // Hero messages - SHOW VALUE
  {
    id: 'm1',
    text: 'this tool literally saved my grade',
    context: 'CSE 250 Study Crew',
    weight: 'hero',
    reactions: [{ emoji: '💀', count: 12 }],
  },
  {
    id: 'm2',
    text: 'wait how did you find a study room that fast',
    weight: 'hero',
  },
  {
    id: 'm3',
    text: 'studio open til 2am bring snacks',
    context: '14 people responded',
    weight: 'hero',
  },
  {
    id: 'm4',
    text: 'ok this dining tracker actually works???',
    weight: 'hero',
    reactions: [{ emoji: '🔥', count: 8 }],
  },

  // Accent messages - community proof
  {
    id: 'm5',
    text: 'someone just dropped notes for the whole exam',
    context: 'PHY 107 Pain',
    weight: 'accent',
  },
  {
    id: 'm6',
    text: '3 open spots left for the film screening',
    weight: 'accent',
  },
  {
    id: 'm7',
    text: 'prof just moved the exam and someone already updated the countdown',
    weight: 'accent',
    reactions: [{ emoji: '😭', count: 23 }],
  },
  {
    id: 'm8',
    text: 'who made this poll tool its actually clutch',
    weight: 'accent',
  },
  {
    id: 'm9',
    text: 'late night study gang checking in',
    context: '47 people here',
    weight: 'accent',
  },
  {
    id: 'm10',
    text: 'the grade calculator just told me i can get a C if i get 127% on the final',
    weight: 'accent',
    reactions: [{ emoji: '💀', count: 34 }],
  },

  // Ambient messages - life happening
  {
    id: 'm11',
    text: 'checking in from capen 4th',
    weight: 'ambient',
  },
  {
    id: 'm12',
    text: 'ong this hits different at 3am',
    weight: 'ambient',
  },
  {
    id: 'm13',
    text: 'we really out here',
    weight: 'ambient',
  },
];

// ============================================
// SPACES - Names that have personality + proof
// ============================================

export const SPACE_FRAGMENTS: SpaceFragment[] = [
  // Hot spaces with proof
  {
    id: 's1',
    name: 'Late Night Philosophy',
    activity: '23 debating rn',
    hot: true,
    recentAction: 'Alex just joined',
  },
  {
    id: 's2',
    name: '3AM Study Crew',
    activity: '47 grinding',
    hot: true,
    recentAction: 'notes just dropped',
  },
  {
    id: 's3',
    name: 'UB Film Society',
    activity: 'screening now',
    hot: true,
    recentAction: '8 seats left',
  },

  // Active spaces
  {
    id: 's4',
    name: 'Pre-Med Pain',
    activity: '89 suffering together',
    recentAction: 'MCAT tips shared',
  },
  {
    id: 's5',
    name: 'Design Twitter IRL',
    activity: '34 lurking',
    recentAction: 'portfolio review live',
  },
  {
    id: 's6',
    name: 'Startup Graveyard',
    activity: 'pivoting again',
    recentAction: 'new pitch deck',
  },
  {
    id: 's7',
    name: 'Capen 4th Floor Gang',
    activity: '12 regulars',
    recentAction: 'coffee run happening',
  },
  {
    id: 's8',
    name: 'Music Production Collective',
    activity: 'cooking something',
    hot: true,
    recentAction: 'collab starting',
  },
];

// ============================================
// TOOLS - Things students actually built (with PROOF)
// ============================================

export const TOOL_FRAGMENTS: ToolFragment[] = [
  {
    id: 't1',
    name: 'Grade Calculator',
    hook: 'saved 200+ GPAs this semester',
    stat: '89.3%',
    uses: '2.4k uses',
  },
  {
    id: 't2',
    name: 'Study Room Finder',
    hook: 'never walk to a full room again',
    stat: '3 open now',
    uses: '847 today',
  },
  {
    id: 't3',
    name: 'Dining Tracker',
    hook: 'know before you go',
    stat: '7.2/10 rn',
    uses: '1.2k daily',
  },
  {
    id: 't4',
    name: 'Finals Countdown',
    hook: 'with stress level meter',
    stat: '14 days',
    uses: '3.1k watching',
  },
  {
    id: 't5',
    name: 'Group Project Matcher',
    hook: 'no more random groupme adds',
    uses: '412 matches',
  },
  {
    id: 't6',
    name: 'Prof Review Aggregator',
    hook: 'the real ones, not ratemyprof',
    uses: '890 reviews',
  },
];

// ============================================
// ACTIVITY - Live proof of value
// ============================================

export const ACTIVITY_FRAGMENTS: ActivityFragment[] = [
  {
    id: 'a1',
    action: 'Sarah found a study room in 30 seconds',
    when: 'just now',
    type: 'achieve',
  },
  {
    id: 'a2',
    action: '3 people joined Late Night Philosophy',
    when: '2m ago',
    type: 'join',
  },
  {
    id: 'a3',
    action: 'someone shared notes for MTH 309',
    when: '5m ago',
    type: 'share',
  },
  {
    id: 'a4',
    action: 'new study tool dropped in CSE 250',
    when: '12m ago',
    type: 'create',
  },
  {
    id: 'a5',
    action: 'Film screening filled up in 8 minutes',
    when: '1hr ago',
    type: 'achieve',
  },
];

// ============================================
// SEQUENCE - The order of appearance (tells a story)
// ============================================

export interface FragmentSequence {
  type: 'message' | 'space' | 'tool' | 'activity';
  id: string;
  /** Delay from previous fragment in ms */
  delay: number;
  /** Position hint for layout */
  position: 'top-left' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-right' | 'top-center';
  /** Rotation in degrees */
  rotation?: number;
}

/**
 * The choreographed sequence of fragments
 * TELLS A STORY:
 * 1. Someone uses something (value)
 * 2. Community is active (proof)
 * 3. Tool shows result (concrete)
 * 4. More life happening (FOMO)
 *
 * Rhythm: SNAP - HOLD - SNAP - HOLD
 */
export const FRAGMENT_SEQUENCE: FragmentSequence[] = [
  // Beat 1: VALUE - someone got something from this
  { type: 'message', id: 'm1', delay: 400, position: 'top-left', rotation: -1 },

  // Beat 2: PROOF - show the community is real
  { type: 'space', id: 's2', delay: 500, position: 'top-right', rotation: 0.5 },

  // Beat 3: CONCRETE - tool with real result
  { type: 'tool', id: 't2', delay: 500, position: 'center-right', rotation: 1 },

  // Beat 4: FOMO - something happening you're missing
  { type: 'message', id: 'm4', delay: 500, position: 'bottom-left', rotation: -0.5 },

  // Beat 5: MORE PROOF - another hot space
  { type: 'space', id: 's8', delay: 450, position: 'bottom-right', rotation: 0.5 },

  // Beat 6: URGENCY - limited spots
  { type: 'message', id: 'm6', delay: 450, position: 'center-left', rotation: -0.5 },

  // Beat 7: ACTIVITY - live proof (new type)
  { type: 'activity', id: 'a1', delay: 400, position: 'top-center', rotation: 0 },
];

// ============================================
// HELPERS
// ============================================

export function getMessageById(id: string): MessageFragment | undefined {
  return MESSAGE_FRAGMENTS.find(m => m.id === id);
}

export function getSpaceById(id: string): SpaceFragment | undefined {
  return SPACE_FRAGMENTS.find(s => s.id === id);
}

export function getToolById(id: string): ToolFragment | undefined {
  return TOOL_FRAGMENTS.find(t => t.id === id);
}

export function getActivityById(id: string): ActivityFragment | undefined {
  return ACTIVITY_FRAGMENTS.find(a => a.id === id);
}

/**
 * Get a random subset of fragments for variety
 * Uses seeded randomness for consistency during session
 */
export function getRandomizedSequence(seed?: number): FragmentSequence[] {
  // For now, return the curated sequence
  // Can add randomization later if we want variety between visits
  return FRAGMENT_SEQUENCE;
}
