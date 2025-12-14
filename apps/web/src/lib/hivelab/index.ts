/**
 * HiveLab Chat-First Experience
 *
 * This module provides the infrastructure for creating inline components
 * (polls, RSVPs, countdowns) from natural language and slash commands.
 */

// AI Intent Parser
export {
  parseIntent,
  hasComponentIntent,
  suggestComponentType,
  type IntentType,
  type ParsedIntent,
  type ParseOptions,
  type PollParams,
  type RsvpParams,
  type CountdownParams,
  type AnnouncementParams,
  type IntentParams,
} from './ai-intent-parser';

// Slash Command Parser
export {
  parseSlashCommand,
  parseSlashCommandToIntent,
  isSlashCommand,
  getCommandSuggestions,
  getCommandHelp,
  getAllCommands,
  validateCommand,
  COMMAND_DEFINITIONS,
  type SlashCommand,
  type ParsedSlashCommand,
  type CommandDefinition,
  type CommandSuggestion,
} from './slash-command-parser';

// Intent to Component Converter
export {
  intentToComponent,
  slashCommandToComponent,
  componentToFirestoreDoc,
  generateMessageId,
  generatePreview,
  type ComponentCreationContext,
  type ComponentCreationResult,
  type CreationSource,
  type ComponentPreview,
} from './intent-to-component';
