/**
 * Custom Block Types
 *
 * Phase 5: iframe sandbox system for AI-generated HTML/CSS/JS components
 */

/**
 * Custom block port definition (input/output)
 */
export interface CustomBlockPort {
  /** Port identifier */
  id: string;

  /** Human-readable label */
  label: string;

  /** Data type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';

  /** Optional description */
  description?: string;
}

/**
 * Custom block action definition
 */
export interface CustomBlockAction {
  /** Action identifier (e.g., 'submit', 'vote') */
  id: string;

  /** Human-readable label */
  label: string;

  /** Action category (determines state update behavior) */
  category: 'aggregate' | 'personal' | 'hybrid';

  /** Expected payload schema (JSON Schema) */
  payloadSchema?: Record<string, unknown>;
}

/**
 * Custom block manifest
 * Describes what the block can do and what it needs
 */
export interface CustomBlockManifest {
  /** Actions this block can handle */
  actions: CustomBlockAction[];

  /** Input ports (data the block consumes) */
  inputs: CustomBlockPort[];

  /** Output ports (data the block produces) */
  outputs: CustomBlockPort[];

  /** State schema (what the block stores) */
  stateSchema?: {
    type: 'object';
    properties: Record<string, {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      description?: string;
      default?: unknown;
    }>;
  };

  /** Design tokens the block needs */
  requiredTokens?: {
    colors?: string[];
    spacing?: string[];
    typography?: string[];
    radius?: string[];
  };
}

/**
 * Custom block code bundle
 */
export interface CustomBlockCode {
  /** HTML template (single root element, no <script> tags) */
  html: string;

  /** CSS styles scoped to this block */
  css: string;

  /** JavaScript code (strict mode, HIVE SDK access via window.HIVE) */
  js: string;

  /** Hash of code bundle for integrity checking */
  hash: string;
}

/**
 * Custom block CSP overrides
 */
export interface CustomBlockCSP {
  /** Allow specific image sources */
  imgSrc?: string[];

  /** Allow specific font sources */
  fontSrc?: string[];
}

/**
 * Custom block metadata
 */
export interface CustomBlockMetadata {
  /** Human-readable name */
  name: string;

  /** What this block does */
  description: string;

  /** AI-generated or user-provided */
  createdBy: 'ai' | 'user';

  /** Timestamp of creation */
  createdAt: string;

  /** Timestamp of last update */
  updatedAt: string;
}

/**
 * Custom block configuration (element config)
 */
export interface CustomBlockConfig {
  /** Unique block identifier */
  blockId: string;

  /** Current version of the block code */
  version: number;

  /** Block metadata */
  metadata: CustomBlockMetadata;

  /** Code bundle for this version */
  code: CustomBlockCode;

  /** Block capabilities and interface */
  manifest: CustomBlockManifest;

  /** CSP overrides (restrictive by default) */
  csp?: CustomBlockCSP;
}

// ============================================================================
// HIVE SDK Types (for custom block JavaScript runtime)
// ============================================================================

/**
 * Block state (subset of ToolUserState + ToolSharedState)
 */
export interface BlockState {
  /** User's personal state for this block */
  personal: Record<string, unknown>;

  /** Shared state visible to all users */
  shared: Record<string, unknown>;
}

/**
 * Action execution result
 */
export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * Tool context available to custom blocks
 */
export interface BlockContext {
  spaceId?: string;
  spaceName?: string;
  userId: string;
  userDisplayName?: string;
  userRole?: 'admin' | 'moderator' | 'member' | 'guest';
  timestamp: string;
}

/**
 * HIVE SDK interface available to custom blocks
 * Exposed via window.HIVE in iframe
 */
export interface HIVESDK {
  /**
   * Get current state for this block
   */
  getState(): Promise<BlockState>;

  /**
   * Update state
   */
  setState(updates: Partial<BlockState>): Promise<void>;

  /**
   * Execute an action
   */
  executeAction(actionId: string, payload?: unknown): Promise<ActionResult>;

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: BlockState) => void): () => void;

  /**
   * Get input data from connected elements
   */
  getInput(inputId: string): Promise<unknown>;

  /**
   * Emit output data to connected elements
   */
  emitOutput(outputId: string, data: unknown): Promise<void>;

  /**
   * Get current user context
   */
  getContext(): Promise<BlockContext>;

  /**
   * Show a toast notification
   */
  notify(message: string, type?: 'success' | 'error' | 'info'): void;

  /**
   * Log to parent (for debugging)
   */
  log(...args: unknown[]): void;
}

// ============================================================================
// postMessage Protocol Types
// ============================================================================

/**
 * Messages sent from parent to iframe
 */
export type ParentMessage =
  | { type: 'state_update'; state: BlockState }
  | { type: 'input_update'; inputId: string; data: unknown }
  | { type: 'action_result'; requestId: string; result: ActionResult }
  | { type: 'context_update'; context: BlockContext };

/**
 * Messages sent from iframe to parent
 */
export type IframeMessage =
  | { type: 'ready' }
  | { type: 'get_state'; requestId: string }
  | { type: 'set_state'; requestId: string; updates: Partial<BlockState> }
  | { type: 'execute_action'; requestId: string; actionId: string; payload?: unknown }
  | { type: 'get_input'; requestId: string; inputId: string }
  | { type: 'emit_output'; outputId: string; data: unknown }
  | { type: 'get_context'; requestId: string }
  | { type: 'notify'; message: string; notifyType?: 'success' | 'error' | 'info' }
  | { type: 'log'; args: unknown[] }
  | { type: 'create_post'; requestId: string; content: string; postType?: string }
  | { type: 'get_members'; requestId: string; limit?: number; cursor?: string | null };

/**
 * postMessage envelope (adds origin validation)
 */
export interface PostMessageEnvelope<T> {
  source: 'hive-parent' | 'hive-iframe';
  timestamp: number;
  payload: T;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Code validation result
 */
export interface CodeValidationResult {
  valid: boolean;
  errors: CodeValidationError[];
  warnings: CodeValidationWarning[];
  stats: {
    htmlSize: number;
    cssSize: number;
    jsSize: number;
    totalSize: number;
  };
}

/**
 * Code validation error
 */
export interface CodeValidationError {
  type: 'syntax' | 'security' | 'size' | 'structure';
  message: string;
  line?: number;
  column?: number;
  code?: string;
}

/**
 * Code validation warning
 */
export interface CodeValidationWarning {
  type: 'performance' | 'accessibility' | 'best-practice';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// ============================================================================
// Version Management Types
// ============================================================================

/**
 * Custom block version (for version history)
 */
export interface CustomBlockVersion {
  /** Version number */
  version: number;

  /** Code bundle */
  code: CustomBlockCode;

  /** Manifest */
  manifest: CustomBlockManifest;

  /** Created timestamp */
  createdAt: string;

  /** Created by user ID */
  createdBy: string;

  /** Version status */
  status: 'draft' | 'deployed';

  /** Number of active deployments using this version */
  deploymentCount: number;
}

/**
 * Custom block with version history
 */
export interface CustomBlockWithVersions {
  /** Block ID */
  blockId: string;

  /** Current version number */
  currentVersion: number;

  /** All versions */
  versions: Record<number, CustomBlockVersion>;

  /** Metadata (from current version) */
  metadata: CustomBlockMetadata;
}
