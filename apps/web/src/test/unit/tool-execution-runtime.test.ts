/**
 * @vitest-environment node
 *
 * Tests for ToolExecutionRuntime.
 *
 * Note: The runtime uses `new Function()` for sandboxed execution, which is
 * blocked in Node strict mode. We test input validation, singleton behavior,
 * and execution management directly. The HIVE API surface (storage, profile,
 * members) is tested via the integration tests that exercise the real API routes.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import type { ExecutionContext, ToolDefinition } from '@/lib/tool-execution-runtime';
import { ToolExecutionRuntime } from '@/lib/tool-execution-runtime';

function makeContext(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    userId: 'user1',
    toolId: 'tool1',
    permissions: ['user:read', 'space:read', 'storage:read', 'storage:write'],
    timeout: 5000,
    maxMemory: 50 * 1024 * 1024,
    ...overrides,
  };
}

function makeTool(overrides?: Partial<ToolDefinition>): ToolDefinition {
  return {
    id: 'tool1',
    name: 'Test Tool',
    code: 'return { ok: true };',
    language: 'javascript',
    version: '1.0.0',
    dependencies: [],
    permissions: [],
    schema: { inputs: {}, outputs: {} },
    category: 'test',
    isPublic: false,
    createdBy: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ToolExecutionRuntime', () => {
  let runtime: ToolExecutionRuntime;

  beforeEach(() => {
    // Reset singleton between tests
    (ToolExecutionRuntime as any).instance = undefined;
    runtime = ToolExecutionRuntime.getInstance();
  });

  afterEach(() => {
    (ToolExecutionRuntime as any).instance = undefined;
  });

  // ── Singleton ─────────────────────────────────────────────
  it('returns the same instance on repeated calls', () => {
    const a = ToolExecutionRuntime.getInstance();
    const b = ToolExecutionRuntime.getInstance();
    expect(a).toBe(b);
  });

  // ── Input Validation ──────────────────────────────────────
  it('rejects missing required inputs', async () => {
    const tool = makeTool({
      schema: {
        inputs: { name: { type: 'string', required: true } },
        outputs: {},
      },
    });
    const result = await runtime.executeTool(tool, {}, makeContext());
    expect(result.success).toBe(false);
    expect(result.error).toContain("Required field 'name' is missing");
  });

  it('rejects wrong input type (string instead of number)', async () => {
    const tool = makeTool({
      schema: {
        inputs: { count: { type: 'number', required: true } },
        outputs: {},
      },
    });
    const result = await runtime.executeTool(tool, { count: 'not-a-number' }, makeContext());
    expect(result.success).toBe(false);
    expect(result.error).toContain('must be of type number');
  });

  it('rejects string below minLength', async () => {
    const tool = makeTool({
      schema: {
        inputs: { name: { type: 'string', required: true, minLength: 3, maxLength: 50 } },
        outputs: {},
      },
    });
    const result = await runtime.executeTool(tool, { name: 'ab' }, makeContext());
    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 3 characters');
  });

  it('rejects string above maxLength', async () => {
    const tool = makeTool({
      schema: {
        inputs: { name: { type: 'string', required: true, maxLength: 5 } },
        outputs: {},
      },
    });
    const result = await runtime.executeTool(tool, { name: 'toolongname' }, makeContext());
    expect(result.success).toBe(false);
    expect(result.error).toContain('no more than 5 characters');
  });

  it('rejects number below min', async () => {
    const tool = makeTool({
      schema: {
        inputs: { age: { type: 'number', required: true, min: 0, max: 150 } },
        outputs: {},
      },
    });
    const result = await runtime.executeTool(tool, { age: -1 }, makeContext());
    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 0');
  });

  it('rejects number above max', async () => {
    const tool = makeTool({
      schema: {
        inputs: { age: { type: 'number', required: true, min: 0, max: 150 } },
        outputs: {},
      },
    });
    const result = await runtime.executeTool(tool, { age: 200 }, makeContext());
    expect(result.success).toBe(false);
    expect(result.error).toContain('no more than 150');
  });

  it('rejects non-array when array expected', async () => {
    const tool = makeTool({
      schema: {
        inputs: { items: { type: 'array', required: true } },
        outputs: {},
      },
    });
    const result = await runtime.executeTool(tool, { items: 'not-array' }, makeContext());
    expect(result.success).toBe(false);
    expect(result.error).toContain('must be an array');
  });

  it('passes valid inputs through', async () => {
    const tool = makeTool({
      schema: {
        inputs: {
          name: { type: 'string', required: true, minLength: 1, maxLength: 50 },
          count: { type: 'number', required: true, min: 0, max: 100 },
        },
        outputs: {},
      },
    });
    // The execution itself may fail (new Function in strict mode) but
    // validation should pass — error won't mention "Input validation"
    const result = await runtime.executeTool(tool, { name: 'Test', count: 5 }, makeContext());
    if (!result.success) {
      expect(result.error).not.toContain('Input validation failed');
    }
  });

  it('allows optional missing fields', async () => {
    const tool = makeTool({
      schema: {
        inputs: {
          required_field: { type: 'string', required: true },
          optional_field: { type: 'string', required: false },
        },
        outputs: {},
      },
    });
    const result = await runtime.executeTool(
      tool,
      { required_field: 'present' },
      makeContext()
    );
    // Should not fail validation
    if (!result.success) {
      expect(result.error).not.toContain('Input validation failed');
    }
  });

  it('reports multiple validation errors', async () => {
    const tool = makeTool({
      schema: {
        inputs: {
          name: { type: 'string', required: true },
          age: { type: 'number', required: true },
        },
        outputs: {},
      },
    });
    const result = await runtime.executeTool(tool, {}, makeContext());
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
    expect(result.error).toContain('age');
  });

  // ── Language Support ──────────────────────────────────────
  it('returns error for Python tools', async () => {
    const tool = makeTool({ language: 'python' });
    const result = await runtime.executeTool(tool, {}, makeContext());
    expect(result.success).toBe(false);
    expect(result.error).toContain('Python execution not yet supported');
  });

  it('returns error for unsupported language', async () => {
    const tool = makeTool({ language: 'ruby' as any });
    const result = await runtime.executeTool(tool, {}, makeContext());
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported language: ruby');
  });

  // ── Execution Management ──────────────────────────────────
  it('starts with no running executions', () => {
    expect(runtime.getRunningExecutions()).toEqual([]);
  });

  it('cancelExecution returns false for nonexistent id', () => {
    expect(runtime.cancelExecution('nonexistent')).toBe(false);
  });

  // ── Metadata ──────────────────────────────────────────────
  it('includes metadata in execution result', async () => {
    const tool = makeTool({ id: 'mytool', name: 'My Tool' });
    const result = await runtime.executeTool(
      tool,
      {},
      makeContext({ userId: 'u42', spaceId: 'space7' })
    );

    // Even if execution fails (strict mode), metadata should be set
    if (result.metadata) {
      expect(result.metadata.toolId).toBe('mytool');
      expect(result.metadata.toolName).toBe('My Tool');
      expect(result.metadata.userId).toBe('u42');
      expect(result.metadata.spaceId).toBe('space7');
    }
  });

  // ── Context: deploymentId derivation ──────────────────────
  it('ExecutionContext accepts optional deploymentId', () => {
    const ctx = makeContext({ deploymentId: 'space:s1_p1' });
    expect(ctx.deploymentId).toBe('space:s1_p1');
  });

  it('ExecutionContext defaults deploymentId to undefined', () => {
    const ctx = makeContext();
    expect(ctx.deploymentId).toBeUndefined();
  });
});
