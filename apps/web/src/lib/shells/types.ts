/**
 * Shell Format Types
 *
 * Type definitions for the 3 native format shells (poll, bracket, RSVP)
 * plus custom (AI code gen fallback).
 */

// ============================================================================
// FORMAT TYPES
// ============================================================================

export type ShellFormat = 'poll' | 'bracket' | 'rsvp' | 'custom';

// ============================================================================
// CONFIG TYPES
// ============================================================================

export interface PollConfig {
  question: string;
  options: string[];
  /** Allow multiple votes per user */
  multiSelect?: boolean;
  /** Auto-close after N seconds */
  timerSeconds?: number;
  /** Anonymous voting */
  anonymous?: boolean;
}

export interface BracketConfig {
  topic: string;
  entries: string[];
  /** Voting duration per round in seconds */
  roundDurationSeconds?: number;
}

export interface RSVPConfig {
  title: string;
  dateTime?: string;
  location?: string;
  capacity?: number;
  deadline?: string;
  description?: string;
}

export type ShellConfig = PollConfig | BracketConfig | RSVPConfig | null;

// ============================================================================
// STATE TYPES (stored in Firebase RTDB at shell_states/{shellId})
// ============================================================================

export interface PollVote {
  userId: string;
  optionIndex: number;
  votedAt: number;
}

export interface PollState {
  votes: Record<string, PollVote>;
  voteCounts: number[];
  closed: boolean;
  closedAt?: number;
}

export interface BracketMatchup {
  id: string;
  round: number;
  entryA: string;
  entryB: string;
  votes: Record<string, 'A' | 'B'>;
  winner?: string;
}

export interface BracketState {
  matchups: BracketMatchup[];
  currentRound: number;
  totalRounds: number;
  winner?: string;
  completed: boolean;
}

export interface RSVPState {
  attendees: Record<string, { userId: string; displayName: string; photoURL?: string; rsvpAt: number }>;
  count: number;
}

export type ShellState = PollState | BracketState | RSVPState;

// ============================================================================
// CLASSIFICATION RESULT (from Groq)
// ============================================================================

export interface ClassificationResult {
  format: ShellFormat;
  confidence: number;
  config: ShellConfig;
}

// ============================================================================
// SHELL COMPONENT PROPS
// ============================================================================

export interface ShellComponentProps<TConfig = ShellConfig, TState = ShellState> {
  shellId: string;
  config: TConfig;
  state: TState | null;
  currentUserId: string;
  creatorId: string;
  isCreator: boolean;
  onAction: (action: ShellAction) => void;
  compact?: boolean;
}

export type ShellAction =
  | { type: 'poll_vote'; optionIndex: number }
  | { type: 'poll_close' }
  | { type: 'bracket_vote'; matchupId: string; choice: 'A' | 'B' }
  | { type: 'rsvp_toggle' }
  | { type: 'rsvp_cancel' };
