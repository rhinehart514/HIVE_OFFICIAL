/**
 * Slash Command Parser for HiveLab Quick Actions
 *
 * Parses slash commands like:
 * - /poll "Question?" Option1 Option2 Option3
 * - /rsvp "Event Name" --limit=50 --date=2024-01-15
 * - /countdown "Event" 2024-01-15T18:00
 * - /announce Important message here
 *
 * Provides autocomplete suggestions and syntax help.
 */

import type {
  IntentType,
  PollParams,
  RsvpParams,
  CountdownParams,
  AnnouncementParams,
  IntentParams,
} from './ai-intent-parser';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SlashCommand {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  raw: string;
}

export interface ParsedSlashCommand {
  type: IntentType;
  params: IntentParams;
  raw: string;
  isValid: boolean;
  errors: string[];
}

export interface CommandDefinition {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  examples: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Command Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const COMMAND_DEFINITIONS: Record<string, CommandDefinition> = {
  poll: {
    name: 'poll',
    aliases: ['vote', 'p'],
    description: 'Create a poll for members to vote on',
    usage: '/poll "Question?" Option1 Option2 [Option3...]',
    examples: [
      '/poll "Best meeting time?" Monday Tuesday Wednesday',
      '/poll "Pizza or Sushi?" Pizza Sushi --multi',
      '/p "Favorite color?" Red Blue Green Yellow',
    ],
  },
  rsvp: {
    name: 'rsvp',
    aliases: ['event', 'signup', 'r'],
    description: 'Create an RSVP for an event',
    usage: '/rsvp "Event Name" [--date=YYYY-MM-DD] [--limit=N]',
    examples: [
      '/rsvp "Study Session"',
      '/rsvp "Club Meeting" --date=2024-01-20 --limit=30',
      '/event "Game Night" --date=tomorrow',
    ],
  },
  countdown: {
    name: 'countdown',
    aliases: ['timer', 'cd'],
    description: 'Create a countdown timer',
    usage: '/countdown "Event Name" YYYY-MM-DD[THH:MM]',
    examples: [
      '/countdown "Finals Week" 2024-12-16',
      '/countdown "Application Deadline" 2024-01-15T23:59',
      '/timer "Meeting" in 30 minutes',
    ],
  },
  announce: {
    name: 'announce',
    aliases: ['announcement', 'a'],
    description: 'Make an announcement',
    usage: '/announce [--pin] Message content here',
    examples: [
      '/announce Welcome to the new semester!',
      '/announce --pin Important: Meeting rescheduled to Friday',
      '/a Don\'t forget about tomorrow\'s event!',
    ],
  },
};

// Build alias lookup map
const ALIAS_MAP: Record<string, string> = {};
for (const [name, def] of Object.entries(COMMAND_DEFINITIONS)) {
  ALIAS_MAP[name] = name;
  for (const alias of def.aliases) {
    ALIAS_MAP[alias] = name;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tokenizer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tokenize command string respecting quotes
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Parse flags from tokens
 * Supports: --flag, --flag=value, -f
 */
function parseFlags(tokens: string[]): {
  args: string[];
  flags: Record<string, string | boolean>;
} {
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (const token of tokens) {
    if (token.startsWith('--')) {
      const withoutDashes = token.slice(2);
      if (withoutDashes.includes('=')) {
        const [key, value] = withoutDashes.split('=', 2);
        flags[key] = value;
      } else {
        flags[withoutDashes] = true;
      }
    } else if (token.startsWith('-') && token.length === 2) {
      // Short flags like -m for --multi
      flags[token.slice(1)] = true;
    } else {
      args.push(token);
    }
  }

  return { args, flags };
}

// ─────────────────────────────────────────────────────────────────────────────
// Command Parsers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse date from various formats
 */
function parseDate(input: string): Date | undefined {
  // Relative dates
  if (input === 'tomorrow') {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(12, 0, 0, 0);
    return date;
  }

  if (input === 'today') {
    const date = new Date();
    date.setHours(23, 59, 0, 0);
    return date;
  }

  // "in X minutes/hours/days"
  const relativeMatch = input.match(/^in\s+(\d+)\s+(minutes?|hours?|days?|weeks?)$/i);
  if (relativeMatch) {
    const value = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();
    const date = new Date();

    if (unit.startsWith('minute')) date.setMinutes(date.getMinutes() + value);
    else if (unit.startsWith('hour')) date.setHours(date.getHours() + value);
    else if (unit.startsWith('day')) date.setDate(date.getDate() + value);
    else if (unit.startsWith('week')) date.setDate(date.getDate() + value * 7);

    return date;
  }

  // ISO date or datetime
  const isoMatch = input.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?$/);
  if (isoMatch) {
    const dateStr = isoMatch[1];
    const timeStr = isoMatch[2] || '12:00';
    const parsed = new Date(`${dateStr}T${timeStr}:00`);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // MM/DD/YYYY
  const usMatch = input.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (usMatch) {
    const month = parseInt(usMatch[1], 10) - 1;
    const day = parseInt(usMatch[2], 10);
    const year = usMatch[3]
      ? parseInt(usMatch[3], 10) < 100
        ? 2000 + parseInt(usMatch[3], 10)
        : parseInt(usMatch[3], 10)
      : new Date().getFullYear();
    const date = new Date(year, month, day, 12, 0, 0);
    if (!isNaN(date.getTime())) return date;
  }

  return undefined;
}

/**
 * Parse poll command
 */
function parsePollCommand(args: string[], flags: Record<string, string | boolean>): ParsedSlashCommand {
  const errors: string[] = [];

  // First arg should be the question (in quotes)
  const question = args[0];
  if (!question) {
    errors.push('Question is required. Usage: /poll "Question?" Option1 Option2');
  }

  // Remaining args are options
  const options = args.slice(1);
  if (options.length < 2) {
    errors.push('At least 2 options are required');
  }

  if (options.length > 10) {
    errors.push('Maximum 10 options allowed');
  }

  const allowMultiple = Boolean(flags.multi || flags.m || flags.multiple);

  // Parse close time if provided
  let closesAt: Date | undefined;
  if (flags.close || flags.closes) {
    const closeValue = typeof flags.close === 'string' ? flags.close : (flags.closes as string);
    closesAt = parseDate(closeValue);
  }

  return {
    type: 'poll',
    params: {
      question: question || '',
      options: options.length >= 2 ? options : ['Option 1', 'Option 2'],
      allowMultiple,
      closesAt,
    } as PollParams,
    raw: `/poll ${args.join(' ')}`,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parse RSVP command
 */
function parseRsvpCommand(args: string[], flags: Record<string, string | boolean>): ParsedSlashCommand {
  const errors: string[] = [];

  const eventTitle = args.join(' ').trim();
  if (!eventTitle) {
    errors.push('Event title is required. Usage: /rsvp "Event Name"');
  }

  // Parse date
  let eventDate: Date | undefined;
  if (flags.date) {
    eventDate = parseDate(flags.date as string);
    if (!eventDate) {
      errors.push('Invalid date format. Use YYYY-MM-DD or "tomorrow"');
    }
  }

  // Parse limit
  let maxCapacity: number | undefined;
  if (flags.limit) {
    maxCapacity = parseInt(flags.limit as string, 10);
    if (isNaN(maxCapacity) || maxCapacity < 1) {
      errors.push('Limit must be a positive number');
      maxCapacity = undefined;
    }
  }

  const allowMaybe = !flags['no-maybe'];

  return {
    type: 'rsvp',
    params: {
      eventTitle: eventTitle || 'Event',
      eventDate,
      maxCapacity,
      allowMaybe,
    } as RsvpParams,
    raw: `/rsvp ${args.join(' ')}`,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parse countdown command
 */
function parseCountdownCommand(args: string[], flags: Record<string, string | boolean>): ParsedSlashCommand {
  const errors: string[] = [];

  // First arg is title, remaining could be date
  let title = args[0] || '';
  let dateArg = args.slice(1).join(' ');

  // If no date arg, check if title looks like a date
  if (!dateArg && /^\d/.test(title)) {
    dateArg = title;
    title = 'Countdown';
  }

  // Or check flags
  if (!dateArg && flags.date) {
    dateArg = flags.date as string;
  }

  const targetDate = parseDate(dateArg);
  if (!targetDate) {
    errors.push('Target date is required. Usage: /countdown "Event" 2024-01-15');
  } else if (targetDate <= new Date()) {
    errors.push('Target date must be in the future');
  }

  return {
    type: 'countdown',
    params: {
      title: title || 'Countdown',
      targetDate: targetDate || new Date(),
    } as CountdownParams,
    raw: `/countdown ${args.join(' ')}`,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parse announce command
 */
function parseAnnounceCommand(args: string[], flags: Record<string, string | boolean>): ParsedSlashCommand {
  const errors: string[] = [];

  const content = args.join(' ').trim();
  if (!content) {
    errors.push('Announcement content is required');
  }

  const isPinned = Boolean(flags.pin || flags.pinned);

  return {
    type: 'announcement',
    params: {
      content: content || '',
      isPinned,
    } as AnnouncementParams,
    raw: `/announce ${args.join(' ')}`,
    isValid: errors.length === 0,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Parser Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if input is a slash command
 */
export function isSlashCommand(input: string): boolean {
  return input.trim().startsWith('/');
}

/**
 * Parse a slash command string
 *
 * @param input - The full command string starting with /
 * @returns Parsed command or null if invalid
 */
export function parseSlashCommand(input: string): SlashCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const tokens = tokenize(trimmed.slice(1)); // Remove leading /
  if (tokens.length === 0) return null;

  const command = tokens[0].toLowerCase();
  const resolvedCommand = ALIAS_MAP[command];
  if (!resolvedCommand) return null;

  const { args, flags } = parseFlags(tokens.slice(1));

  return {
    command: resolvedCommand,
    args,
    flags,
    raw: trimmed,
  };
}

/**
 * Parse a slash command and extract component parameters
 *
 * @param input - The full command string starting with /
 * @returns Parsed command with type-specific parameters
 */
export function parseSlashCommandToIntent(input: string): ParsedSlashCommand | null {
  const parsed = parseSlashCommand(input);
  if (!parsed) return null;

  switch (parsed.command) {
    case 'poll':
      return parsePollCommand(parsed.args, parsed.flags);
    case 'rsvp':
      return parseRsvpCommand(parsed.args, parsed.flags);
    case 'countdown':
      return parseCountdownCommand(parsed.args, parsed.flags);
    case 'announce':
      return parseAnnounceCommand(parsed.args, parsed.flags);
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Autocomplete & Suggestions
// ─────────────────────────────────────────────────────────────────────────────

export interface CommandSuggestion {
  command: string;
  description: string;
  usage: string;
}

/**
 * Get command suggestions based on partial input
 */
export function getCommandSuggestions(partialInput: string): CommandSuggestion[] {
  if (!partialInput.startsWith('/')) return [];

  const search = partialInput.slice(1).toLowerCase();
  const suggestions: CommandSuggestion[] = [];

  for (const [name, def] of Object.entries(COMMAND_DEFINITIONS)) {
    const matches =
      name.startsWith(search) ||
      def.aliases.some(alias => alias.startsWith(search));

    if (matches || search === '') {
      suggestions.push({
        command: `/${name}`,
        description: def.description,
        usage: def.usage,
      });
    }
  }

  return suggestions;
}

/**
 * Get full help text for a command
 */
export function getCommandHelp(command: string): string | null {
  const resolved = ALIAS_MAP[command.replace('/', '')];
  if (!resolved) return null;

  const def = COMMAND_DEFINITIONS[resolved];
  if (!def) return null;

  let help = `**/${def.name}** - ${def.description}\n\n`;
  help += `Usage: \`${def.usage}\`\n\n`;
  help += `Examples:\n`;
  for (const example of def.examples) {
    help += `  \`${example}\`\n`;
  }

  if (def.aliases.length > 0) {
    help += `\nAliases: ${def.aliases.map(a => `/${a}`).join(', ')}`;
  }

  return help;
}

/**
 * Get all available commands for help display
 */
export function getAllCommands(): CommandDefinition[] {
  return Object.values(COMMAND_DEFINITIONS);
}

/**
 * Validate a command without executing
 */
export function validateCommand(input: string): { valid: boolean; errors: string[] } {
  const result = parseSlashCommandToIntent(input);
  if (!result) {
    return { valid: false, errors: ['Invalid command'] };
  }
  return { valid: result.isValid, errors: result.errors };
}
