import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { vi } from 'vitest';

// ============================================================
// Test Wrapper Provider
// ============================================================

interface WrapperProps {
  children: ReactNode;
}

function TestWrapper({ children }: WrapperProps): ReactElement {
  return <>{children}</>;
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: TestWrapper, ...options });
}

// ============================================================
// Async Helpers
// ============================================================

export async function waitFor(
  condition: () => boolean,
  { timeout = 1000, interval = 50 } = {}
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

export function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// ============================================================
// Fetch Mock Helpers
// ============================================================

interface MockFetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

export function mockFetchSuccess(data: unknown): MockFetchResponse {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  };
}

export function mockFetchError(
  status: number,
  error: string
): MockFetchResponse {
  return {
    ok: false,
    status,
    json: async () => ({ error }),
  };
}

export function setupFetchMock(
  handlers: Record<string, () => MockFetchResponse | Promise<MockFetchResponse>>
): void {
  (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
    async (url: string): Promise<MockFetchResponse> => {
      for (const [pattern, handler] of Object.entries(handlers)) {
        if (url.includes(pattern)) {
          return handler();
        }
      }
      return mockFetchError(404, 'Not found');
    }
  );
}

export function resetFetchMock(): void {
  (global.fetch as ReturnType<typeof vi.fn>).mockReset();
}

// ============================================================
// Test Constants
// ============================================================

export const TEST_SPACE_ID = 'test-space-123';
export const TEST_BOARD_ID = 'general';
export const TEST_USER_ID = 'user-123';
export const TEST_USER_NAME = 'Test User';

export function createMockSpaceData(overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id ?? TEST_SPACE_ID,
    name: overrides.name ?? 'Test Space',
    description: overrides.description ?? 'A test space for unit tests',
    category: overrides.category ?? 'student_org',
    type: overrides.type ?? 'social',
    campusId: overrides.campusId ?? 'ub-buffalo',
    memberCount: overrides.memberCount ?? 10,
    isPublic: overrides.isPublic ?? true,
    visibility: overrides.visibility ?? 'public',
    createdAt: overrides.createdAt ?? Date.now(),
    ...overrides,
  };
}

export const createMockSpace = createMockSpaceData;

export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id ?? TEST_USER_ID,
    uid: overrides.uid ?? TEST_USER_ID,
    name: overrides.name ?? TEST_USER_NAME,
    displayName: overrides.displayName ?? TEST_USER_NAME,
    email: overrides.email ?? 'test@buffalo.edu',
    campusId: overrides.campusId ?? 'ub-buffalo',
    avatarUrl: overrides.avatarUrl ?? null,
    createdAt: overrides.createdAt ?? Date.now(),
    ...overrides,
  };
}

// Re-export testing-library
export * from '@testing-library/react';
export { customRender as render };
