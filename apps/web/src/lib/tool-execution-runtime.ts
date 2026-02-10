// HIVE Tool Execution Runtime - Safe execution environment for user-created tools

interface PerformanceMemory {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

export interface SchemaFieldDefinition {
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  [key: string]: unknown;
}

export interface ExecutionContext {
  userId: string;
  toolId: string;
  spaceId?: string;
  deploymentId?: string;
  permissions: string[];
  timeout: number;
  maxMemory: number;
}

export interface ExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
  memoryUsed: number;
  logs: string[];
  metadata?: Record<string, unknown>;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description?: string;
  code: string;
  language: 'javascript' | 'typescript' | 'python';
  version: string;
  dependencies: string[];
  permissions: string[];
  schema: {
    inputs: Record<string, SchemaFieldDefinition>;
    outputs: Record<string, SchemaFieldDefinition>;
  };
  category: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

class SafeExecutionEnvironment {
  private context: ExecutionContext;
  private logs: string[] = [];
  private startTime: number = 0;
  private memoryStart: number = 0;

  constructor(context: ExecutionContext) {
    this.context = context;
  }

  private getDeploymentId(): string {
    return this.context.deploymentId || `standalone:${this.context.toolId}`;
  }

  // Safe console implementation
  private createSafeConsole(): typeof console {
    return {
      log: (...args: unknown[]) => {
        this.logs.push(`[LOG] ${args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')}`);
      },
      warn: (...args: unknown[]) => {
        this.logs.push(`[WARN] ${args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')}`);
      },
      error: (...args: unknown[]) => {
        this.logs.push(`[ERROR] ${args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')}`);
      }
    } as typeof console;
  }

  // Safe HIVE API for tools
  private createHiveAPI() {
    const deploymentId = this.getDeploymentId();
    const context = this.context;

    return {
      // User data access (with permission checks)
      user: {
        getId: () => context.permissions.includes('user:read') ? context.userId : null,
        getProfile: async () => {
          if (!context.permissions.includes('user:read')) {
            throw new Error('Permission denied: user:read required');
          }
          try {
            const profileRes = await fetch('/api/profile', { credentials: 'include' });
            if (!profileRes.ok) throw new Error(`Profile fetch failed: ${profileRes.status}`);
            const profileData = await profileRes.json();
            const profile = profileData.data || profileData;

            let role: string = 'member';
            if (context.spaceId) {
              try {
                const membershipRes = await fetch(
                  `/api/spaces/${context.spaceId}/membership`,
                  { credentials: 'include' }
                );
                if (membershipRes.ok) {
                  const membershipData = await membershipRes.json();
                  role = membershipData.requestingUser?.role || 'member';
                }
              } catch {
                // Membership fetch failed — default to member
              }
            }

            return {
              id: profile.id || context.userId,
              name: profile.fullName || profile.firstName || 'Unknown',
              avatarUrl: profile.profileImageUrl || null,
              role,
            };
          } catch {
            return { id: context.userId, name: 'Unknown', avatarUrl: null, role: 'member' };
          }
        }
      },

      // Space data access
      space: {
        getId: () => context.spaceId,
        getMembers: async () => {
          if (!context.permissions.includes('space:read')) {
            throw new Error('Permission denied: space:read required');
          }
          if (!context.spaceId) return [];
          try {
            const res = await fetch(
              `/api/spaces/${context.spaceId}/members?limit=100`,
              { credentials: 'include' }
            );
            if (!res.ok) return [];
            const data = await res.json();
            const members = data.members || [];
            return members.map((m: Record<string, unknown>) => ({
              id: m.id,
              name: m.name,
              avatarUrl: m.avatar || null,
              role: m.role || 'member',
              isOnline: m.isOnline || false,
            }));
          } catch {
            return [];
          }
        }
      },

      // Data storage for tools (Firestore-backed via state API)
      storage: {
        get: async (key: string) => {
          if (!context.permissions.includes('storage:read')) {
            throw new Error('Permission denied: storage:read required');
          }
          try {
            const res = await fetch(`/api/tools/state/${deploymentId}`, { credentials: 'include' });
            if (!res.ok) return null;
            const data = await res.json();
            const state = data.state || {};
            return state[key] ?? null;
          } catch {
            return null;
          }
        },
        set: async (key: string, value: unknown) => {
          if (!context.permissions.includes('storage:write')) {
            throw new Error('Permission denied: storage:write required');
          }
          try {
            const patchRes = await fetch(`/api/tools/state/${deploymentId}`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: key, value, operation: 'set' }),
            });
            if (patchRes.status === 404) {
              // State doc doesn't exist yet — create via PUT
              await fetch(`/api/tools/state/${deploymentId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: { [key]: value } }),
              });
            }
          } catch {
            // Storage write failed silently — tool continues
          }
        },
        delete: async (key: string) => {
          if (!context.permissions.includes('storage:write')) {
            throw new Error('Permission denied: storage:write required');
          }
          try {
            await fetch(`/api/tools/state/${deploymentId}`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: key, operation: 'delete' }),
            });
          } catch {
            // Storage delete failed silently
          }
        }
      },

      // HTTP requests (sandboxed)
      http: {
        get: async (url: string) => {
          if (!context.permissions.includes('network:read')) {
            throw new Error('Permission denied: network:read required');
          }
          return fetch(url);
        },
        post: async (url: string, data: unknown) => {
          if (!context.permissions.includes('network:write')) {
            throw new Error('Permission denied: network:write required');
          }
          return fetch(url, { method: 'POST', body: JSON.stringify(data) });
        }
      },

      // UI utilities
      ui: {
        showToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
          // Log for execution trace
          this.logs.push(`[TOAST:${type}] ${message}`);
          // Bridge to app toast system if available (non-blocking)
          try {
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
              window.dispatchEvent(new CustomEvent('hive:toast', { detail: { title: message, type } }));
            }
          } catch {
            // Silently ignore toast dispatch errors
          }
        },
        showModal: (title: string, content: string) => {
          this.logs.push(`[MODAL] ${title}: ${content}`);
        }
      }
    };
  }

  // Execute JavaScript/TypeScript code safely
  async executeJSCode(code: string, inputs: Record<string, unknown>): Promise<ExecutionResult> {
    this.startTime = Date.now();
    this.memoryStart = (performance as PerformanceWithMemory).memory?.usedJSHeapSize || 0;
    this.logs = [];

    try {
      // Create sandboxed environment
      const sandbox = {
        console: this.createSafeConsole(),
        HIVE: this.createHiveAPI(),
        inputs: inputs,
        // Safe utilities
        JSON: JSON,
        Math: Math,
        Date: Date,
        Promise: Promise,
        setTimeout: (fn: () => void, delay: number) => {
          if (delay > 5000) throw new Error('Timeout too long (max 5s)');
          return setTimeout(fn, delay);
        },
        // Blocked globals
        window: undefined,
        document: undefined,
        localStorage: undefined,
        sessionStorage: undefined,
        fetch: undefined,
        XMLHttpRequest: undefined,
        eval: undefined,
        Function: undefined
      };

      // Wrap code in async function
      const wrappedCode = `
        (async function() {
          ${code}
        })()
      `;

      // Create function with restricted scope
      const func = new Function(
        ...Object.keys(sandbox),
        `"use strict"; return ${wrappedCode}`
      );

      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout')), this.context.timeout);
      });

      const executionPromise = func(...Object.values(sandbox));
      const result = await Promise.race([executionPromise, timeoutPromise]);

      const executionTime = Date.now() - this.startTime;
      const memoryUsed = ((performance as PerformanceWithMemory).memory?.usedJSHeapSize || 0) - this.memoryStart;

      return {
        success: true,
        result,
        executionTime,
        memoryUsed,
        logs: this.logs
      };

    } catch (error) {
      const executionTime = Date.now() - this.startTime;
      const memoryUsed = ((performance as PerformanceWithMemory).memory?.usedJSHeapSize || 0) - this.memoryStart;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        memoryUsed,
        logs: this.logs
      };
    }
  }
}

export class ToolExecutionRuntime {
  private static instance: ToolExecutionRuntime;
  private runningTools: Map<string, AbortController> = new Map();

  static getInstance(): ToolExecutionRuntime {
    if (!ToolExecutionRuntime.instance) {
      ToolExecutionRuntime.instance = new ToolExecutionRuntime();
    }
    return ToolExecutionRuntime.instance;
  }

  async executeTool(
    tool: ToolDefinition,
    inputs: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const executionId = `${tool.id}_${Date.now()}`;
    const abortController = new AbortController();
    this.runningTools.set(executionId, abortController);

    try {
      // Validate inputs against schema
      const validationResult = this.validateInputs(inputs, tool.schema.inputs);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Input validation failed: ${validationResult.errors.join(', ')}`,
          executionTime: 0,
          memoryUsed: 0,
          logs: []
        };
      }

      // Create execution environment
      const env = new SafeExecutionEnvironment(context);

      // Execute based on language
      let result: ExecutionResult;
      switch (tool.language) {
        case 'javascript':
        case 'typescript':
          result = await env.executeJSCode(tool.code, inputs);
          break;
        case 'python':
          result = {
            success: false,
            error: 'Python execution not yet supported in browser',
            executionTime: 0,
            memoryUsed: 0,
            logs: []
          };
          break;
        default:
          result = {
            success: false,
            error: `Unsupported language: ${tool.language}`,
            executionTime: 0,
            memoryUsed: 0,
            logs: []
          };
      }

      // Add metadata
      result.metadata = {
        toolId: tool.id,
        toolName: tool.name,
        executionId,
        userId: context.userId,
        spaceId: context.spaceId
      };

      return result;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime: 0,
        memoryUsed: 0,
        logs: []
      };
    } finally {
      this.runningTools.delete(executionId);
    }
  }

  cancelExecution(executionId: string): boolean {
    const controller = this.runningTools.get(executionId);
    if (controller) {
      controller.abort();
      this.runningTools.delete(executionId);
      return true;
    }
    return false;
  }

  getRunningExecutions(): string[] {
    return Array.from(this.runningTools.keys());
  }

  private validateInputs(
    inputs: Record<string, unknown>,
    schema: Record<string, SchemaFieldDefinition>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, definition] of Object.entries(schema)) {
      const value = inputs[key];

      // Check required fields
      if (definition.required && (value === undefined || value === null)) {
        errors.push(`Required field '${key}' is missing`);
        continue;
      }

      // Skip validation for optional missing fields
      if (value === undefined || value === null) continue;

      // Type validation
      if (definition.type) {
        const expectedType = definition.type;
        const actualType = typeof value;

        if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push(`Field '${key}' must be an array`);
        } else if (expectedType !== 'array' && actualType !== expectedType) {
          errors.push(`Field '${key}' must be of type ${expectedType}`);
        }
      }

      // Length validation for strings
      if (typeof value === 'string') {
        if (definition.minLength && value.length < definition.minLength) {
          errors.push(`Field '${key}' must be at least ${definition.minLength} characters`);
        }
        if (definition.maxLength && value.length > definition.maxLength) {
          errors.push(`Field '${key}' must be no more than ${definition.maxLength} characters`);
        }
      }

      // Range validation for numbers
      if (typeof value === 'number') {
        if (definition.min !== undefined && value < definition.min) {
          errors.push(`Field '${key}' must be at least ${definition.min}`);
        }
        if (definition.max !== undefined && value > definition.max) {
          errors.push(`Field '${key}' must be no more than ${definition.max}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Pre-built tool templates
export const toolTemplates = {
  calculator: {
    name: 'Simple Calculator',
    code: `
// Simple Calculator Tool
const { operation, a, b } = inputs;

let result;
switch (operation) {
  case 'add':
    result = a + b;
    break;
  case 'subtract':
    result = a - b;
    break;
  case 'multiply':
    result = a * b;
    break;
  case 'divide':
    if (b === 0) throw new Error('Division by zero');
    result = a / b;
    break;
  default:
    throw new Error('Invalid operation');
}

return { result, operation: \`\${a} \${operation} \${b}\` };
    `,
    schema: {
      inputs: {
        operation: { type: 'string', required: true },
        a: { type: 'number', required: true },
        b: { type: 'number', required: true }
      },
      outputs: {
        result: { type: 'number' },
        operation: { type: 'string' }
      }
    }
  },

  todoList: {
    name: 'Personal Todo List',
    code: `
// Personal Todo List Tool
const { action, task, id } = inputs;

// Get current todos from storage
let todos = await HIVE.storage.get('todos') || [];
todos = typeof todos === 'string' ? JSON.parse(todos) : todos;

switch (action) {
  case 'add':
    const newTodo = {
      id: Date.now().toString(),
      task,
      completed: false,
      createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    await HIVE.storage.set('todos', todos);
    HIVE.ui.showToast('Task added!', 'success');
    return { todos, added: newTodo };

  case 'complete':
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.completed = true;
      await HIVE.storage.set('todos', todos);
      HIVE.ui.showToast('Task completed!', 'success');
    }
    return { todos };

  case 'list':
    return { todos };

  default:
    throw new Error('Invalid action. Use: add, complete, or list');
}
    `,
    schema: {
      inputs: {
        action: { type: 'string', required: true },
        task: { type: 'string', required: false },
        id: { type: 'string', required: false }
      },
      outputs: {
        todos: { type: 'array' },
        added: { type: 'object', required: false }
      }
    }
  },

  spaceStats: {
    name: 'Space Statistics',
    code: `
// Space Statistics Tool
const spaceId = HIVE.space.getId();
if (!spaceId) {
  throw new Error('This tool must be run within a space');
}

const members = await HIVE.space.getMembers();
const memberCount = members.length;
const activeMembers = members.filter(m => m.lastActive > Date.now() - 24 * 60 * 60 * 1000).length;


return {
  spaceId,
  totalMembers: memberCount,
  activeMembers,
  activityRate: memberCount > 0 ? (activeMembers / memberCount) * 100 : 0,
  timestamp: new Date().toISOString()
};
    `,
    schema: {
      inputs: {},
      outputs: {
        spaceId: { type: 'string' },
        totalMembers: { type: 'number' },
        activeMembers: { type: 'number' },
        activityRate: { type: 'number' },
        timestamp: { type: 'string' }
      }
    }
  }
};

export default ToolExecutionRuntime;
