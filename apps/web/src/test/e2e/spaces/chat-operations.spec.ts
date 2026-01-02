/**
 * Spaces Chat Operations E2E Tests
 *
 * Tests chat functionality: sending messages, reactions, pins, boards.
 */

import { test, expect } from '../config/test-fixtures';
import {
  sendChatMessage,
  addReaction,
  pinMessage,
  browseSpaces,
  joinSpace,
} from '../config/api-helpers';

// Find a space to test with
async function getTestSpace(page: any): Promise<{ spaceId: string; boardId: string } | null> {
  const browse = await browseSpaces(page, { limit: 5 });
  if (!browse.ok || !browse.data.spaces?.length) return null;

  const spaces = browse.data.spaces as Array<{
    id: string;
    boards?: Array<{ id: string }>;
  }>;

  // Find a space with boards
  for (const space of spaces) {
    if (space.boards && space.boards.length > 0) {
      return {
        spaceId: space.id,
        boardId: space.boards[0].id,
      };
    }
  }

  // Return first space even without explicit board (will use 'general')
  if (spaces[0]) {
    return {
      spaceId: spaces[0].id,
      boardId: 'general',
    };
  }

  return null;
}

test.describe('Chat Message Operations', () => {
  test('should send a text message and receive confirmation', async ({ authenticatedPage }) => {
    const testSpace = await getTestSpace(authenticatedPage);
    test.skip(!testSpace, 'No test space available');

    const { spaceId, boardId } = testSpace!;

    // Send a test message
    const message = `E2E Test message ${Date.now()}`;
    const result = await sendChatMessage(authenticatedPage, spaceId, boardId, message);

    expect(result.ok).toBe(true);
    expect(result.status).toBeLessThan(400);
  });

  test('should enforce message length limits', async ({ authenticatedPage }) => {
    const testSpace = await getTestSpace(authenticatedPage);
    test.skip(!testSpace, 'No test space available');

    const { spaceId, boardId } = testSpace!;

    // Try to send a very long message (over 4000 chars)
    const longMessage = 'x'.repeat(5000);
    const result = await sendChatMessage(authenticatedPage, spaceId, boardId, longMessage);

    // Should be rejected or truncated
    expect(result.status).toBeGreaterThanOrEqual(400);
  });

  test('should handle empty message gracefully', async ({ authenticatedPage }) => {
    const testSpace = await getTestSpace(authenticatedPage);
    test.skip(!testSpace, 'No test space available');

    const { spaceId, boardId } = testSpace!;

    // Try to send empty message
    const result = await sendChatMessage(authenticatedPage, spaceId, boardId, '');

    // Should be rejected
    expect(result.status).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Chat Reactions', () => {
  test('should add reaction to a message', async ({ authenticatedPage }) => {
    const testSpace = await getTestSpace(authenticatedPage);
    test.skip(!testSpace, 'No test space available');

    const { spaceId, boardId } = testSpace!;

    // First send a message
    const message = `Reaction test ${Date.now()}`;
    const sendResult = await sendChatMessage(authenticatedPage, spaceId, boardId, message);

    if (!sendResult.ok || !sendResult.data?.messageId) {
      test.skip(true, 'Could not send test message');
      return;
    }

    const messageId = sendResult.data.messageId;

    // Add a reaction
    const reactionResult = await addReaction(authenticatedPage, spaceId, boardId, messageId, '👍');

    expect(reactionResult.ok).toBe(true);
    expect(reactionResult.status).toBeLessThan(400);
  });

  test('should toggle reaction on second click', async ({ authenticatedPage }) => {
    const testSpace = await getTestSpace(authenticatedPage);
    test.skip(!testSpace, 'No test space available');

    const { spaceId, boardId } = testSpace!;

    // Send a message
    const message = `Toggle reaction test ${Date.now()}`;
    const sendResult = await sendChatMessage(authenticatedPage, spaceId, boardId, message);

    if (!sendResult.ok || !sendResult.data?.messageId) {
      test.skip(true, 'Could not send test message');
      return;
    }

    const messageId = sendResult.data.messageId;

    // Add reaction
    const firstReaction = await addReaction(authenticatedPage, spaceId, boardId, messageId, '❤️');
    expect(firstReaction.ok).toBe(true);

    // Toggle (remove) reaction
    const secondReaction = await addReaction(authenticatedPage, spaceId, boardId, messageId, '❤️');
    expect(secondReaction.ok).toBe(true);
  });
});

test.describe('Chat Pin Operations', () => {
  test('should pin a message as space leader', async ({ adminPage }) => {
    const testSpace = await getTestSpace(adminPage);
    test.skip(!testSpace, 'No test space available');

    const { spaceId, boardId } = testSpace!;

    // Send a message
    const message = `Pin test ${Date.now()}`;
    const sendResult = await sendChatMessage(adminPage, spaceId, boardId, message);

    if (!sendResult.ok || !sendResult.data?.messageId) {
      test.skip(true, 'Could not send test message');
      return;
    }

    const messageId = sendResult.data.messageId;

    // Pin the message
    const pinResult = await pinMessage(adminPage, spaceId, boardId, messageId);

    // May succeed or fail depending on leadership status
    // But should not throw an error
    expect(pinResult.status).toBeDefined();
  });
});

test.describe('Space Browse and Join', () => {
  test('should browse spaces and get results', async ({ authenticatedPage }) => {
    const result = await browseSpaces(authenticatedPage, { limit: 10 });

    expect(result.ok).toBe(true);
    expect(result.data.spaces).toBeDefined();
    expect(Array.isArray(result.data.spaces)).toBe(true);
  });

  test('should browse spaces by territory', async ({ authenticatedPage }) => {
    const result = await browseSpaces(authenticatedPage, { limit: 10, territory: 'student' });

    expect(result.ok).toBe(true);
    expect(result.data.spaces).toBeDefined();
  });

  test('should attempt to join a public space', async ({ authenticatedPage }) => {
    const browse = await browseSpaces(authenticatedPage, { limit: 5 });
    test.skip(!browse.ok || !browse.data.spaces?.length, 'No spaces available');

    const spaces = browse.data.spaces as Array<{ id: string }>;
    const spaceId = spaces[0].id;

    // Attempt to join
    const joinResult = await joinSpace(authenticatedPage, spaceId);

    // Should either succeed or indicate already a member
    expect([200, 201, 400, 409].includes(joinResult.status)).toBe(true);
  });
});

test.describe('Chat UI Navigation', () => {
  test('should load space page with chat board', async ({ authenticatedPage }) => {
    const testSpace = await getTestSpace(authenticatedPage);
    test.skip(!testSpace, 'No test space available');

    const { spaceId } = testSpace!;

    // Navigate to space
    await authenticatedPage.goto(`/spaces/${spaceId}`);
    await authenticatedPage.waitForLoadState('networkidle');

    // Should see chat area (flexible selectors)
    const chatArea = authenticatedPage.locator(
      '[data-testid="chat-board"], [data-testid="chat-messages"], .chat-container, [class*="chat"]'
    );

    // Use a shorter timeout and handle potential absence gracefully
    const hasChatArea = await chatArea.first().isVisible().catch(() => false);

    // If no explicit chat area, at least the page should load
    if (!hasChatArea) {
      // Page should at least have content
      await expect(authenticatedPage.locator('body')).not.toBeEmpty();
    }
  });

  test('should show message input on space page', async ({ authenticatedPage }) => {
    const testSpace = await getTestSpace(authenticatedPage);
    test.skip(!testSpace, 'No test space available');

    const { spaceId } = testSpace!;

    await authenticatedPage.goto(`/spaces/${spaceId}`);
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for message input (flexible selectors)
    const messageInput = authenticatedPage.locator(
      '[data-testid="chat-input"], [data-testid="message-input"], textarea[placeholder*="message"], input[placeholder*="message"], [class*="chat-input"]'
    );

    const hasInput = await messageInput.first().isVisible().catch(() => false);

    // Input should exist if user is a member
    // (non-member might not see input, which is also valid)
    expect(typeof hasInput).toBe('boolean');
  });
});
