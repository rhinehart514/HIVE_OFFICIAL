/**
 * Slash Command Parser
 *
 * Parses slash commands for power users who want faster component creation.
 * Supports: /poll, /rsvp, /countdown, /announce, /help
 *
 * Part of HiveLab Winter 2025 Strategy: Quick Actions (Mode 2)
 *
 * @example
 * /poll "Best day for meeting?" Monday Tuesday Wednesday --multiple
 * /rsvp "Study Session" --limit=20 --date=2024-12-20
 * /countdown "Finals Week" 2024-12-16T09:00
 * /announce Welcome to our space!
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SlashCommandType = 'poll' | 'rsvp' | 'countdown' | 'announce' | 'automate' | 'welcome' | 'remind' | 'signup' | 'event' | 'help' | 'unknown';

export interface SlashCommand {
  command: SlashCommandType;
  args: string[];
  flags: Record<string, string | boolean | number>;
  raw: string;
  isValid: boolean;
  error?: string;
}

export interface PollCommand extends SlashCommand {
  command: 'poll';
  parsed: {
    question: string;
    options: string[];
    allowMultiple: boolean;
    anonymous: boolean;
    closesIn?: number; // minutes
  };
}

export interface RsvpCommand extends SlashCommand {
  command: 'rsvp';
  parsed: {
    eventTitle: string;
    eventDate?: Date;
    maxCapacity?: number;
    allowMaybe: boolean;
    deadline?: Date;
  };
}

export interface CountdownCommand extends SlashCommand {
  command: 'countdown';
  parsed: {
    title: string;
    targetDate: Date;
    showDays: boolean;
    showHours: boolean;
    showMinutes: boolean;
    showSeconds: boolean;
  };
}

export interface AnnounceCommand extends SlashCommand {
  command: 'announce';
  parsed: {
    content: string;
    pin: boolean;
    urgent: boolean;
  };
}

export interface HelpCommand extends SlashCommand {
  command: 'help';
  parsed: {
    topic?: SlashCommandType;
  };
}

export interface AutomateCommand extends SlashCommand {
  command: 'automate';
  parsed: {
    automationType: 'welcome' | 'reminder' | 'keyword' | 'schedule';
    name: string;
    triggerConfig?: Record<string, unknown>;
    actionConfig?: Record<string, unknown>;
  };
}

export interface WelcomeCommand extends SlashCommand {
  command: 'welcome';
  parsed: {
    message: string;
    delay?: number; // seconds before sending
    boardId?: string;
  };
}

export interface SignupCommand extends SlashCommand {
  command: 'signup';
  parsed: {
    title: string;
    slots: string[];
    limitPerSlot?: number;
    deadline?: Date;
  };
}

export interface EventCommand extends SlashCommand {
  command: 'event';
  parsed: {
    title: string;
    date: Date;
    location?: string;
    description?: string;
  };
}

export interface RemindCommand extends SlashCommand {
  command: 'remind';
  parsed: {
    beforeMinutes: number;
    message?: string;
    boardId?: string;
  };
}

export type ParsedSlashCommand =
  | PollCommand
  | RsvpCommand
  | CountdownCommand
  | AnnounceCommand
  | AutomateCommand
  | WelcomeCommand
  | RemindCommand
  | SignupCommand
  | EventCommand
  | HelpCommand
  | SlashCommand;

// ─────────────────────────────────────────────────────────────────────────────
// Command Registry
// ─────────────────────────────────────────────────────────────────────────────

const COMMANDS: readonly SlashCommandType[] = ['poll', 'rsvp', 'countdown', 'announce', 'automate', 'welcome', 'remind', 'signup', 'event', 'help'];

export const COMMAND_HELP: Record<SlashCommandType, { syntax: string; description: string; examples: string[] }> = {
  poll: {
    syntax: '/poll "Question?" Option1 Option2 [Option3...] [--multiple] [--anonymous] [--closes=<minutes>]',
    description: 'Create a poll for members to vote on',
    examples: [
      '/poll "Best meeting day?" Monday Tuesday Wednesday',
      '/poll "Favorite pizza?" Pepperoni Cheese Veggie --multiple',
      '/poll "President election" Alice Bob --anonymous --closes=60',
    ],
  },
  rsvp: {
    syntax: '/rsvp "Event Name" [--date=<date>] [--limit=<number>] [--maybe] [--deadline=<date>]',
    description: 'Create an RSVP for an event',
    examples: [
      '/rsvp "Study Session"',
      '/rsvp "End of Year Party" --date=2024-12-20 --limit=50',
      '/rsvp "Workshop" --date=tomorrow --maybe --deadline=2024-12-15',
    ],
  },
  countdown: {
    syntax: '/countdown "Event Name" <date> [--no-days] [--no-hours] [--no-minutes] [--no-seconds]',
    description: 'Create a countdown timer to a date/time',
    examples: [
      '/countdown "Finals Week" 2024-12-16',
      '/countdown "Spring Break" 2025-03-15T00:00',
      '/countdown "Meeting" tomorrow --no-seconds',
    ],
  },
  announce: {
    syntax: '/announce <message> [--pin] [--urgent]',
    description: 'Post an announcement to the space',
    examples: [
      '/announce Meeting moved to Room 201',
      '/announce New member guidelines posted! --pin',
      '/announce Elections starting now! --urgent',
    ],
  },
  automate: {
    syntax: '/automate <type> "Name" [config]',
    description: 'Create a custom automation',
    examples: [
      '/automate welcome "New Member Greeting"',
      '/automate reminder "Event Reminder" --before=30',
      '/automate keyword "FAQ Bot" --keywords="hours,schedule"',
    ],
  },
  welcome: {
    syntax: '/welcome "Message" [--delay=<seconds>] [--board=<boardId>]',
    description: 'Set up automatic welcome messages for new members',
    examples: [
      '/welcome "Welcome to our club! Check out #events for upcoming activities"',
      '/welcome "Hey {member}! Introduce yourself in #general" --delay=30',
    ],
  },
  remind: {
    syntax: '/remind <minutes> ["Message"] [--board=<boardId>]',
    description: 'Set up event reminders for all events',
    examples: [
      '/remind 30',
      '/remind 60 "Don\'t forget about {event}!"',
      '/remind 15 --board=events',
    ],
  },
  signup: {
    syntax: '/signup "Title" Slot1 Slot2 [Slot3...] [--limit=<number>] [--deadline=<date>]',
    description: 'Create a slot-based signup sheet',
    examples: [
      '/signup "Bake Sale" Cookies Brownies Cupcakes',
      '/signup "Setup Crew" Tables Chairs AV --limit=4',
      '/signup "Carpool" Driver1 Driver2 Driver3 --limit=5 --deadline=friday',
    ],
  },
  event: {
    syntax: '/event "Title" --date=<date> [--location="Place"] [--description="Details"]',
    description: 'Create an event inline in chat',
    examples: [
      '/event "Weekly Meeting" --date=tuesday --location="SU 330"',
      '/event "Study Session" --date=2026-02-15 --location="Library 2F"',
      '/event "End of Year Party" --date=2026-05-01 --description="Celebrate the semester!"',
    ],
  },
  help: {
    syntax: '/help [command]',
    description: 'Show help for slash commands',
    examples: ['/help', '/help poll', '/help automate'],
  },
  unknown: {
    syntax: '',
    description: 'Unknown command',
    examples: [],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Parser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a message is a slash command
 */
export function isSlashCommand(message: string): boolean {
  return message.trim().startsWith('/');
}

/**
 * Parse a slash command from a message
 *
 * @param input - The full message starting with /
 * @returns Parsed command with type, args, flags, and validation
 */
export function parseSlashCommand(input: string): ParsedSlashCommand {
  const trimmed = input.trim();

  if (!trimmed.startsWith('/')) {
    return createUnknownCommand(input, 'Message must start with /');
  }

  // Extract command name
  const spaceIndex = trimmed.indexOf(' ');
  const commandStr = (spaceIndex > 0 ? trimmed.slice(1, spaceIndex) : trimmed.slice(1)).toLowerCase();
  const argsStr = spaceIndex > 0 ? trimmed.slice(spaceIndex + 1).trim() : '';

  // Validate command
  if (!COMMANDS.includes(commandStr as SlashCommandType)) {
    return createUnknownCommand(input, `Unknown command: /${commandStr}. Try /help for available commands.`);
  }

  const command = commandStr as SlashCommandType;

  // Parse based on command type
  switch (command) {
    case 'poll':
      return parsePollCommand(argsStr, input);
    case 'rsvp':
      return parseRsvpCommand(argsStr, input);
    case 'countdown':
      return parseCountdownCommand(argsStr, input);
    case 'announce':
      return parseAnnounceCommand(argsStr, input);
    case 'automate':
      return parseAutomateCommand(argsStr, input);
    case 'welcome':
      return parseWelcomeCommand(argsStr, input);
    case 'remind':
      return parseRemindCommand(argsStr, input);
    case 'signup':
      return parseSignupCommand(argsStr, input);
    case 'event':
      return parseEventCommand(argsStr, input);
    case 'help':
      return parseHelpCommand(argsStr, input);
    default:
      return createUnknownCommand(input, 'Unhandled command type');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Command-Specific Parsers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse poll command
 * /poll "Question?" Option1 Option2 [--multiple] [--anonymous] [--closes=60]
 */
function parsePollCommand(argsStr: string, raw: string): PollCommand {
  const { quoted, positional, flags } = parseArgsAndFlags(argsStr);

  // Question is the first quoted string or error
  const question = quoted[0];
  if (!question) {
    return {
      command: 'poll',
      args: positional,
      flags,
      raw,
      isValid: false,
      error: 'Poll question required. Use: /poll "Question?" Option1 Option2',
      parsed: {
        question: '',
        options: [],
        allowMultiple: false,
        anonymous: false,
      },
    };
  }

  // Options are positional args
  const options = positional.filter(o => o.length > 0);
  if (options.length < 2) {
    return {
      command: 'poll',
      args: positional,
      flags,
      raw,
      isValid: false,
      error: 'Poll needs at least 2 options. Use: /poll "Question?" Option1 Option2',
      parsed: {
        question,
        options,
        allowMultiple: false,
        anonymous: false,
      },
    };
  }

  if (options.length > 10) {
    return {
      command: 'poll',
      args: positional,
      flags,
      raw,
      isValid: false,
      error: 'Poll cannot have more than 10 options.',
      parsed: {
        question,
        options,
        allowMultiple: false,
        anonymous: false,
      },
    };
  }

  return {
    command: 'poll',
    args: positional,
    flags,
    raw,
    isValid: true,
    parsed: {
      question,
      options,
      allowMultiple: Boolean(flags.multiple),
      anonymous: Boolean(flags.anonymous),
      closesIn: typeof flags.closes === 'number' ? flags.closes : undefined,
    },
  };
}

/**
 * Parse RSVP command
 * /rsvp "Event Name" [--date=<date>] [--limit=<number>] [--maybe] [--deadline=<date>]
 */
function parseRsvpCommand(argsStr: string, raw: string): RsvpCommand {
  const { quoted, flags } = parseArgsAndFlags(argsStr);

  const eventTitle = quoted[0];
  if (!eventTitle) {
    return {
      command: 'rsvp',
      args: [],
      flags,
      raw,
      isValid: false,
      error: 'Event title required. Use: /rsvp "Event Name"',
      parsed: {
        eventTitle: '',
        allowMaybe: true,
      },
    };
  }

  // Parse date flag
  let eventDate: Date | undefined;
  if (flags.date) {
    eventDate = parseDate(String(flags.date));
  }

  // Parse deadline flag
  let deadline: Date | undefined;
  if (flags.deadline) {
    deadline = parseDate(String(flags.deadline));
  }

  // Parse limit flag
  let maxCapacity: number | undefined;
  if (typeof flags.limit === 'number') {
    maxCapacity = flags.limit;
  } else if (typeof flags.limit === 'string') {
    maxCapacity = parseInt(flags.limit, 10) || undefined;
  }

  return {
    command: 'rsvp',
    args: [],
    flags,
    raw,
    isValid: true,
    parsed: {
      eventTitle,
      eventDate,
      maxCapacity,
      allowMaybe: flags.maybe !== false,
      deadline,
    },
  };
}

/**
 * Parse countdown command
 * /countdown "Title" <date> [--no-days] [--no-hours] [--no-minutes] [--no-seconds]
 */
function parseCountdownCommand(argsStr: string, raw: string): CountdownCommand {
  const { quoted, positional, flags } = parseArgsAndFlags(argsStr);

  const title = quoted[0];
  if (!title) {
    return {
      command: 'countdown',
      args: positional,
      flags,
      raw,
      isValid: false,
      error: 'Countdown title required. Use: /countdown "Title" <date>',
      parsed: {
        title: '',
        targetDate: new Date(),
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
      },
    };
  }

  // Date is the first positional arg
  const dateStr = positional[0];
  if (!dateStr) {
    return {
      command: 'countdown',
      args: positional,
      flags,
      raw,
      isValid: false,
      error: 'Target date required. Use: /countdown "Title" 2024-12-20',
      parsed: {
        title,
        targetDate: new Date(),
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
      },
    };
  }

  const targetDate = parseDate(dateStr);
  if (!targetDate || isNaN(targetDate.getTime())) {
    return {
      command: 'countdown',
      args: positional,
      flags,
      raw,
      isValid: false,
      error: `Invalid date: ${dateStr}. Use format like 2024-12-20 or "tomorrow"`,
      parsed: {
        title,
        targetDate: new Date(),
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
      },
    };
  }

  return {
    command: 'countdown',
    args: positional,
    flags,
    raw,
    isValid: true,
    parsed: {
      title,
      targetDate,
      showDays: !flags['no-days'],
      showHours: !flags['no-hours'],
      showMinutes: !flags['no-minutes'],
      showSeconds: !flags['no-seconds'],
    },
  };
}

/**
 * Parse announce command
 * /announce <message> [--pin] [--urgent]
 */
function parseAnnounceCommand(argsStr: string, raw: string): AnnounceCommand {
  const { flags } = parseArgsAndFlags(argsStr);

  // Content is everything except flags
  const content = argsStr.replace(/--\w+(?:=[^\s]+)?/g, '').trim();

  if (!content) {
    return {
      command: 'announce',
      args: [],
      flags,
      raw,
      isValid: false,
      error: 'Announcement content required. Use: /announce <message>',
      parsed: {
        content: '',
        pin: false,
        urgent: false,
      },
    };
  }

  return {
    command: 'announce',
    args: [content],
    flags,
    raw,
    isValid: true,
    parsed: {
      content,
      pin: Boolean(flags.pin),
      urgent: Boolean(flags.urgent),
    },
  };
}

/**
 * Parse automate command
 * /automate <type> "Name" [config]
 */
function parseAutomateCommand(argsStr: string, raw: string): AutomateCommand {
  const { quoted, positional, flags } = parseArgsAndFlags(argsStr);

  // Type is first positional arg
  const typeArg = positional[0]?.toLowerCase();
  const validTypes = ['welcome', 'reminder', 'keyword', 'schedule'];

  if (!typeArg || !validTypes.includes(typeArg)) {
    return {
      command: 'automate',
      args: positional,
      flags,
      raw,
      isValid: false,
      error: `Invalid automation type. Use: /automate <${validTypes.join('|')}> "Name"`,
      parsed: {
        automationType: 'welcome',
        name: '',
      },
    };
  }

  // Name is the first quoted string
  const name = quoted[0];
  if (!name) {
    return {
      command: 'automate',
      args: positional,
      flags,
      raw,
      isValid: false,
      error: 'Automation name required. Use: /automate welcome "Name"',
      parsed: {
        automationType: typeArg as 'welcome' | 'reminder' | 'keyword' | 'schedule',
        name: '',
      },
    };
  }

  return {
    command: 'automate',
    args: positional,
    flags,
    raw,
    isValid: true,
    parsed: {
      automationType: typeArg as 'welcome' | 'reminder' | 'keyword' | 'schedule',
      name,
      triggerConfig: flags,
      actionConfig: {},
    },
  };
}

/**
 * Parse welcome command
 * /welcome "Message" [--delay=<seconds>] [--board=<boardId>]
 */
function parseWelcomeCommand(argsStr: string, raw: string): WelcomeCommand {
  const { quoted, flags } = parseArgsAndFlags(argsStr);

  const message = quoted[0];
  if (!message) {
    return {
      command: 'welcome',
      args: [],
      flags,
      raw,
      isValid: false,
      error: 'Welcome message required. Use: /welcome "Your message here"',
      parsed: {
        message: '',
      },
    };
  }

  // Parse delay (convert to seconds)
  let delay: number | undefined;
  if (typeof flags.delay === 'number') {
    delay = flags.delay;
  } else if (typeof flags.delay === 'string') {
    delay = parseInt(flags.delay, 10) || undefined;
  }

  // Parse board
  const boardId = typeof flags.board === 'string' ? flags.board : undefined;

  return {
    command: 'welcome',
    args: [],
    flags,
    raw,
    isValid: true,
    parsed: {
      message,
      delay,
      boardId,
    },
  };
}

/**
 * Parse remind command
 * /remind <minutes> ["Message"] [--board=<boardId>]
 */
function parseRemindCommand(argsStr: string, raw: string): RemindCommand {
  const { quoted, positional, flags } = parseArgsAndFlags(argsStr);

  // Minutes is first positional arg
  const minutesArg = positional[0];
  const beforeMinutes = parseInt(minutesArg, 10);

  if (!minutesArg || isNaN(beforeMinutes) || beforeMinutes < 1 || beforeMinutes > 10080) {
    return {
      command: 'remind',
      args: positional,
      flags,
      raw,
      isValid: false,
      error: 'Reminder minutes required (1-10080). Use: /remind 30',
      parsed: {
        beforeMinutes: 30,
      },
    };
  }

  // Message is optional quoted string
  const message = quoted[0];

  // Parse board
  const boardId = typeof flags.board === 'string' ? flags.board : undefined;

  return {
    command: 'remind',
    args: positional,
    flags,
    raw,
    isValid: true,
    parsed: {
      beforeMinutes,
      message,
      boardId,
    },
  };
}

/**
 * Parse help command
 * /help [command]
 */
function parseHelpCommand(argsStr: string, raw: string): HelpCommand {
  const trimmed = argsStr.trim().toLowerCase();
  const topic = COMMANDS.includes(trimmed as SlashCommandType)
    ? (trimmed as SlashCommandType)
    : undefined;

  return {
    command: 'help',
    args: topic ? [topic] : [],
    flags: {},
    raw,
    isValid: true,
    parsed: { topic },
  };
}

/**
 * Parse signup command
 * /signup "Title" Slot1 Slot2 [--limit=<number>] [--deadline=<date>]
 */
function parseSignupCommand(argsStr: string, raw: string): SignupCommand {
  const { quoted, positional, flags } = parseArgsAndFlags(argsStr);

  const title = quoted[0];
  if (!title) {
    return {
      command: 'signup',
      args: positional,
      flags,
      raw,
      isValid: false,
      error: 'Signup title required. Use: /signup "Title" Slot1 Slot2',
      parsed: {
        title: '',
        slots: [],
      },
    };
  }

  const slots = positional.filter(s => s.length > 0);
  if (slots.length < 1) {
    return {
      command: 'signup',
      args: positional,
      flags,
      raw,
      isValid: false,
      error: 'At least one slot is required. Use: /signup "Title" Slot1 Slot2',
      parsed: {
        title,
        slots: [],
      },
    };
  }

  if (slots.length > 20) {
    return {
      command: 'signup',
      args: positional,
      flags,
      raw,
      isValid: false,
      error: 'Signup cannot have more than 20 slots.',
      parsed: {
        title,
        slots,
      },
    };
  }

  let limitPerSlot: number | undefined;
  if (typeof flags.limit === 'number') {
    limitPerSlot = flags.limit;
  } else if (typeof flags.limit === 'string') {
    limitPerSlot = parseInt(flags.limit, 10) || undefined;
  }

  let deadline: Date | undefined;
  if (flags.deadline) {
    deadline = parseDate(String(flags.deadline));
  }

  return {
    command: 'signup',
    args: positional,
    flags,
    raw,
    isValid: true,
    parsed: {
      title,
      slots,
      limitPerSlot,
      deadline,
    },
  };
}

/**
 * Parse event command
 * /event "Title" --date=<date> [--location="Place"] [--description="Details"]
 */
function parseEventCommand(argsStr: string, raw: string): EventCommand {
  const { quoted, flags } = parseArgsAndFlags(argsStr);

  const title = quoted[0];
  if (!title) {
    return {
      command: 'event',
      args: [],
      flags,
      raw,
      isValid: false,
      error: 'Event title required. Use: /event "Title" --date=tomorrow',
      parsed: {
        title: '',
        date: new Date(),
      },
    };
  }

  if (!flags.date) {
    return {
      command: 'event',
      args: [],
      flags,
      raw,
      isValid: false,
      error: 'Event date required. Use: /event "Title" --date=2026-02-20',
      parsed: {
        title,
        date: new Date(),
      },
    };
  }

  const date = parseDate(String(flags.date));
  if (!date || isNaN(date.getTime())) {
    return {
      command: 'event',
      args: [],
      flags,
      raw,
      isValid: false,
      error: `Invalid date: ${flags.date}. Use format like 2026-02-20 or "tomorrow"`,
      parsed: {
        title,
        date: new Date(),
      },
    };
  }

  const location = typeof flags.location === 'string' ? flags.location : (quoted[1] || undefined);
  const description = typeof flags.description === 'string' ? flags.description : (quoted[2] || undefined);

  return {
    command: 'event',
    args: [],
    flags,
    raw,
    isValid: true,
    parsed: {
      title,
      date,
      location,
      description,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse args and flags from a string
 * Supports: "quoted strings", positional args, --flag, --flag=value
 */
function parseArgsAndFlags(input: string): {
  quoted: string[];
  positional: string[];
  flags: Record<string, string | boolean | number>;
} {
  const quoted: string[] = [];
  const positional: string[] = [];
  const flags: Record<string, string | boolean | number> = {};

  // Extract quoted strings first
  let remaining = input;
  const quoteRegex = /"([^"]+)"/g;
  let quoteMatch;
  while ((quoteMatch = quoteRegex.exec(input)) !== null) {
    quoted.push(quoteMatch[1]);
    remaining = remaining.replace(quoteMatch[0], ' ');
  }

  // Parse remaining tokens
  const tokens = remaining.split(/\s+/).filter(t => t.length > 0);

  for (const token of tokens) {
    if (token.startsWith('--')) {
      // Flag
      const flagPart = token.slice(2);
      const eqIndex = flagPart.indexOf('=');

      if (eqIndex > 0) {
        // --flag=value
        const key = flagPart.slice(0, eqIndex);
        const value = flagPart.slice(eqIndex + 1);

        // Try to parse as number
        const numValue = parseFloat(value);
        flags[key] = !isNaN(numValue) ? numValue : value;
      } else {
        // --flag (boolean)
        flags[flagPart] = true;
      }
    } else {
      // Positional arg
      positional.push(token);
    }
  }

  return { quoted, positional, flags };
}

/**
 * Parse date string (relative or absolute)
 */
function parseDate(dateStr: string): Date | undefined {
  const lower = dateStr.toLowerCase().trim();
  const now = new Date();

  // Relative dates
  if (lower === 'tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d;
  }

  if (lower === 'today') {
    const d = new Date(now);
    d.setHours(23, 59, 0, 0);
    return d;
  }

  if (lower === 'next week') {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    d.setHours(12, 0, 0, 0);
    return d;
  }

  // Day names
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = days.indexOf(lower);
  if (dayIndex !== -1) {
    const d = new Date(now);
    const currentDay = d.getDay();
    let daysToAdd = dayIndex - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    d.setDate(d.getDate() + daysToAdd);
    d.setHours(12, 0, 0, 0);
    return d;
  }

  // Try parsing as date
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Fall through
  }

  return undefined;
}

/**
 * Create unknown command result
 */
function createUnknownCommand(raw: string, error: string): SlashCommand {
  return {
    command: 'unknown',
    args: [],
    flags: {},
    raw,
    isValid: false,
    error,
  };
}

/**
 * Generate help text for a command
 */
export function getCommandHelp(command?: SlashCommandType): string {
  if (command && command !== 'unknown') {
    const help = COMMAND_HELP[command];
    return [
      `**/${command}**`,
      help.description,
      '',
      '**Syntax:**',
      `\`${help.syntax}\``,
      '',
      '**Examples:**',
      ...help.examples.map(e => `\`${e}\``),
    ].join('\n');
  }

  // General help
  return [
    '**Available Commands:**',
    '',
    ...COMMANDS.filter(c => c !== 'unknown').map(c => {
      const help = COMMAND_HELP[c];
      return `• **/${c}** - ${help.description}`;
    }),
    '',
    'Type `/help <command>` for detailed usage.',
  ].join('\n');
}

/**
 * Get autocomplete suggestions for partial input
 */
export function getAutocompleteSuggestions(input: string): string[] {
  if (!input.startsWith('/')) {
    return COMMANDS.filter(c => c !== 'unknown').map(c => `/${c}`);
  }

  const partial = input.slice(1).toLowerCase();

  if (!partial.includes(' ')) {
    // Still typing command name
    return COMMANDS.filter(c => c !== 'unknown' && c.startsWith(partial)).map(c => `/${c}`);
  }

  // Command typed, suggest based on command
  const spaceIndex = partial.indexOf(' ');
  const command = partial.slice(0, spaceIndex) as SlashCommandType;

  switch (command) {
    case 'poll':
      return ['--multiple', '--anonymous', '--closes=60'];
    case 'rsvp':
      return ['--date=', '--limit=', '--maybe', '--deadline='];
    case 'countdown':
      return ['--no-days', '--no-hours', '--no-minutes', '--no-seconds'];
    case 'announce':
      return ['--pin', '--urgent'];
    case 'automate':
      return ['welcome', 'reminder', 'keyword', 'schedule', '--before=', '--keywords='];
    case 'welcome':
      return ['--delay=', '--board='];
    case 'remind':
      return ['--board='];
    case 'signup':
      return ['--limit=', '--deadline='];
    case 'event':
      return ['--date=', '--location=', '--description='];
    default:
      return [];
  }
}
