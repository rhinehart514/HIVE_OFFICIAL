/**
 * useChatMessages Hook Tests
 * 
 * Tests the core chat functionality including:
 * - SSE real-time connection
 * - Message sending with optimistic updates
 * - Board switching
 * - Reactions, pinning, editing, deleting
 * - Thread management
 * - Typing indicators
 * - Scroll position management
 * - Error handling and reconnection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { MockEventSource } from '../../setup';
import {
  createMockMessage,
  createMockMessages,
  createMockBoard,
  mockFetchSuccess,
  mockFetchError,
  TEST_SPACE_ID,
  resetIdCounters,
} from '../../utils/test-utils';

// Mock the firebase-realtime service
vi.mock('@/lib/firebase-realtime', () => ({
  realtimeService: {
    setBoardTypingIndicator: vi.fn().mockResolvedValue(undefined),
    listenToBoardTyping: vi.fn().mockReturnValue(() => {}),
  },
}));

describe('useChatMessages', () => {
  beforeEach(() => {
    resetIdCounters();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    MockEventSource.instances = [];
  });

  // ============================================================
  // Initialization Tests
  // ============================================================

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID })
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.messages).toEqual([]);
      expect(result.current.boards).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should fetch boards on mount', async () => {
      const mockBoards = [createMockBoard()];
      vi.mocked(global.fetch).mockImplementation(async (url: string) => {
        if (url.includes('/boards')) {
          return mockFetchSuccess({ boards: mockBoards }) as Response;
        }
        return mockFetchSuccess({ messages: [], hasMore: false }) as Response;
      });

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID })
      );

      await waitFor(() => {
        expect(result.current.boards.length).toBeGreaterThan(0);
      });

      expect(result.current.boards[0].id).toBe('general');
    });

    it('should fetch messages for active board', async () => {
      const mockMessages = createMockMessages(5);
      vi.mocked(global.fetch).mockImplementation(async (url: string) => {
        if (url.includes('/boards')) {
          return mockFetchSuccess({ boards: [createMockBoard()] }) as Response;
        }
        if (url.includes('/chat')) {
          return mockFetchSuccess({ messages: mockMessages, hasMore: false }) as Response;
        }
        return mockFetchSuccess({}) as Response;
      });

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(5);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should default to general board', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID })
      );

      expect(result.current.activeBoardId).toBe('general');
    });

    it('should use initialBoardId if provided', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, initialBoardId: 'events' })
      );

      expect(result.current.activeBoardId).toBe('events');
    });
  });

  // ============================================================
  // SSE Connection Tests
  // ============================================================

  describe('SSE connection', () => {
    it('should establish SSE connection when enableRealtime is true', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: true })
      );

      await vi.advanceTimersByTimeAsync(100);

      expect(MockEventSource.instances.length).toBe(1);
      expect(MockEventSource.instances[0].url).toContain('/chat/stream');
      expect(MockEventSource.instances[0].url).toContain('boardId=general');
    });

    it('should not establish SSE when enableRealtime is false', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await vi.advanceTimersByTimeAsync(100);

      expect(MockEventSource.instances.length).toBe(0);
    });

    it('should set isConnected to true when SSE opens', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: true })
      );

      // Need to advance timers and flush promises for SSE to connect
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should handle SSE message events', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: true })
      );

      await vi.advanceTimersByTimeAsync(100);

      const newMessage = createMockMessage({ content: 'New SSE message' });
      
      act(() => {
        MockEventSource.instances[0].simulateMessage({
          type: 'message',
          data: newMessage,
        });
      });

      expect(result.current.messages).toContainEqual(
        expect.objectContaining({ content: 'New SSE message' })
      );
    });

    it('should handle SSE update events', async () => {
      const existingMessage = createMockMessage({ content: 'Original' });
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ 
          boards: [], 
          messages: [existingMessage], 
          hasMore: false 
        }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: true })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(1);
      });

      act(() => {
        MockEventSource.instances[0].simulateMessage({
          type: 'update',
          data: { id: existingMessage.id, content: 'Updated content' },
        });
      });

      expect(result.current.messages[0].content).toBe('Updated content');
    });

    it('should handle SSE delete events', async () => {
      const existingMessage = createMockMessage();
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ 
          boards: [], 
          messages: [existingMessage], 
          hasMore: false 
        }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: true })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(1);
      });

      act(() => {
        MockEventSource.instances[0].simulateMessage({
          type: 'delete',
          data: { id: existingMessage.id },
        });
      });

      expect(result.current.messages[0].isDeleted).toBe(true);
    });

    it('should close SSE on unmount', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { unmount } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: true })
      );

      await vi.advanceTimersByTimeAsync(100);
      expect(MockEventSource.instances.length).toBe(1);

      unmount();

      expect(MockEventSource.instances.length).toBe(0);
    });
  });

  // ============================================================
  // Send Message Tests
  // ============================================================

  describe('sendMessage', () => {
    it('should add optimistic message immediately', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchSuccess({ messageId: 'real-id', timestamp: Date.now() }) as Response
      );

      await act(async () => {
        result.current.sendMessage('Hello world');
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].content).toBe('Hello world');
    });

    it('should update optimistic message with real ID on success', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const realId = 'real-message-id';
      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchSuccess({ messageId: realId, timestamp: Date.now() }) as Response
      );

      await act(async () => {
        await result.current.sendMessage('Hello world');
      });

      expect(result.current.messages[0].id).toBe(realId);
    });

    it('should remove optimistic message on failure', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchError(500, 'Server error') as Response
      );

      await act(async () => {
        try {
          await result.current.sendMessage('Hello world');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.messages.length).toBe(0);
    });

    it('should not send empty messages', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(result.current.messages.length).toBe(0);
    });

    it('should include replyToId when replying', async () => {
      let capturedBody: string | undefined;
      vi.mocked(global.fetch).mockImplementation(async (url: string, options?: RequestInit) => {
        if (url.includes('/chat') && options?.method === 'POST') {
          capturedBody = options.body as string;
          return mockFetchSuccess({ messageId: 'new-id', timestamp: Date.now() }) as Response;
        }
        return mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response;
      });

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.sendMessage('Reply content', 'parent-msg-id');
      });

      expect(capturedBody).toBeDefined();
      const parsed = JSON.parse(capturedBody!);
      expect(parsed.replyToId).toBe('parent-msg-id');
    });
  });

  // ============================================================
  // Edit Message Tests
  // ============================================================

  describe('editMessage', () => {
    it('should update message optimistically', async () => {
      const existingMessage = createMockMessage({ content: 'Original' });
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ 
          boards: [], 
          messages: [existingMessage], 
          hasMore: false 
        }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(1);
      });

      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchSuccess({}) as Response
      );

      await act(async () => {
        await result.current.editMessage(existingMessage.id, 'Edited content');
      });

      expect(result.current.messages[0].content).toBe('Edited content');
      expect(result.current.messages[0].editedAt).toBeDefined();
    });

    it('should rollback on edit failure', async () => {
      const existingMessage = createMockMessage({ content: 'Original' });
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ 
          boards: [], 
          messages: [existingMessage], 
          hasMore: false 
        }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(1);
      });

      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchError(500, 'Server error') as Response
      );

      await act(async () => {
        await result.current.editMessage(existingMessage.id, 'Edited content');
      });

      expect(result.current.messages[0].content).toBe('Original');
    });
  });

  // ============================================================
  // Delete Message Tests
  // ============================================================

  describe('deleteMessage', () => {
    it('should mark message as deleted optimistically', async () => {
      const existingMessage = createMockMessage();
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ 
          boards: [], 
          messages: [existingMessage], 
          hasMore: false 
        }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(1);
      });

      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchSuccess({}) as Response
      );

      await act(async () => {
        await result.current.deleteMessage(existingMessage.id);
      });

      expect(result.current.messages[0].isDeleted).toBe(true);
    });
  });

  // ============================================================
  // Reaction Tests
  // ============================================================

  describe('addReaction', () => {
    it('should add reaction optimistically', async () => {
      const existingMessage = createMockMessage({ reactions: [] });
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ 
          boards: [], 
          messages: [existingMessage], 
          hasMore: false 
        }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(1);
      });

      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchSuccess({}) as Response
      );

      await act(async () => {
        await result.current.addReaction(existingMessage.id, '👍');
      });

      const reactions = result.current.messages[0].reactions;
      expect(reactions).toContainEqual(
        expect.objectContaining({ emoji: '👍', count: 1, hasReacted: true })
      );
    });

    it('should toggle reaction off if already reacted', async () => {
      const existingMessage = createMockMessage({
        reactions: [{ emoji: '👍', count: 1, hasReacted: true }],
      });
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ 
          boards: [], 
          messages: [existingMessage], 
          hasMore: false 
        }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(1);
      });

      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchSuccess({}) as Response
      );

      await act(async () => {
        await result.current.addReaction(existingMessage.id, '👍');
      });

      // Should have removed the reaction (count becomes 0, so filtered out)
      expect(result.current.messages[0].reactions).toEqual([]);
    });
  });

  // ============================================================
  // Board Switching Tests
  // ============================================================

  describe('changeBoard', () => {
    it('should switch to new board', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.changeBoard('events');
      });

      expect(result.current.activeBoardId).toBe('events');
    });

    it('should clear messages on board change', async () => {
      const existingMessage = createMockMessage();
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ 
          boards: [], 
          messages: [existingMessage], 
          hasMore: false 
        }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(1);
      });

      act(() => {
        result.current.changeBoard('events');
      });

      expect(result.current.messages).toEqual([]);
    });

    it('should not trigger change if already on board', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCalls = vi.mocked(global.fetch).mock.calls.length;

      act(() => {
        result.current.changeBoard('general');
      });

      // Should not make additional fetch calls
      expect(vi.mocked(global.fetch).mock.calls.length).toBe(initialCalls);
    });
  });

  // ============================================================
  // Load More Tests
  // ============================================================

  describe('loadMore', () => {
    it('should load older messages', async () => {
      const initialMessages = createMockMessages(5);
      const olderMessages = createMockMessages(5);
      let callCount = 0;

      vi.mocked(global.fetch).mockImplementation(async (url: string) => {
        if (url.includes('/chat') && !url.includes('stream')) {
          callCount++;
          if (callCount === 1) {
            return mockFetchSuccess({ 
              messages: initialMessages, 
              hasMore: true 
            }) as Response;
          } else {
            return mockFetchSuccess({ 
              messages: olderMessages, 
              hasMore: false 
            }) as Response;
          }
        }
        return mockFetchSuccess({ boards: [] }) as Response;
      });

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(5);
      });

      expect(result.current.hasMore).toBe(true);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.messages.length).toBe(10);
      expect(result.current.hasMore).toBe(false);
    });

    it('should not load if hasMore is false', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ 
          boards: [], 
          messages: createMockMessages(5), 
          hasMore: false 
        }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(5);
      });

      const initialCalls = vi.mocked(global.fetch).mock.calls.length;

      await act(async () => {
        await result.current.loadMore();
      });

      expect(vi.mocked(global.fetch).mock.calls.length).toBe(initialCalls);
    });
  });

  // ============================================================
  // Scroll Position Tests
  // ============================================================

  describe('scroll position management', () => {
    it('should save and restore scroll position per board', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.saveScrollPosition(500);
      });

      expect(result.current.getScrollPosition()).toBe(500);

      // Switch board and back
      act(() => {
        result.current.changeBoard('events');
      });

      expect(result.current.getScrollPosition()).toBeUndefined();

      act(() => {
        result.current.changeBoard('general');
      });

      expect(result.current.getScrollPosition()).toBe(500);
    });
  });

  // ============================================================
  // Thread Tests
  // ============================================================

  describe('thread management', () => {
    it('should open thread and load replies', async () => {
      const parentMessage = createMockMessage();
      const replies = createMockMessages(3);

      vi.mocked(global.fetch).mockImplementation(async (url: string) => {
        if (url.includes('/replies')) {
          return mockFetchSuccess({ replies, hasMore: false }) as Response;
        }
        if (url.includes('/chat')) {
          return mockFetchSuccess({ messages: [parentMessage], hasMore: false }) as Response;
        }
        return mockFetchSuccess({ boards: [] }) as Response;
      });

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(1);
      });

      await act(async () => {
        await result.current.openThread(parentMessage.id);
      });

      expect(result.current.thread.isOpen).toBe(true);
      expect(result.current.thread.parentMessage?.id).toBe(parentMessage.id);
      expect(result.current.thread.replies.length).toBe(3);
    });

    it('should close thread', async () => {
      const parentMessage = createMockMessage();

      vi.mocked(global.fetch).mockImplementation(async (url: string) => {
        if (url.includes('/replies')) {
          return mockFetchSuccess({ replies: [], hasMore: false }) as Response;
        }
        if (url.includes('/chat')) {
          return mockFetchSuccess({ messages: [parentMessage], hasMore: false }) as Response;
        }
        return mockFetchSuccess({ boards: [] }) as Response;
      });

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(1);
      });

      await act(async () => {
        await result.current.openThread(parentMessage.id);
      });

      expect(result.current.thread.isOpen).toBe(true);

      act(() => {
        result.current.closeThread();
      });

      expect(result.current.thread.isOpen).toBe(false);
      expect(result.current.thread.parentMessage).toBeNull();
    });

    it('should send thread reply with optimistic update', async () => {
      const parentMessage = createMockMessage();

      vi.mocked(global.fetch).mockImplementation(async (url: string, options?: RequestInit) => {
        if (url.includes('/replies') && options?.method === 'POST') {
          return mockFetchSuccess({ 
            message: createMockMessage({ content: 'Reply' }) 
          }) as Response;
        }
        if (url.includes('/replies')) {
          return mockFetchSuccess({ replies: [], hasMore: false }) as Response;
        }
        if (url.includes('/chat')) {
          return mockFetchSuccess({ messages: [parentMessage], hasMore: false }) as Response;
        }
        return mockFetchSuccess({ boards: [] }) as Response;
      });

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.messages.length).toBe(1);
      });

      await act(async () => {
        await result.current.openThread(parentMessage.id);
      });

      await act(async () => {
        await result.current.sendThreadReply('Reply content');
      });

      expect(result.current.thread.replies.length).toBe(1);
    });
  });

  // ============================================================
  // Error Handling Tests
  // ============================================================

  describe('error handling', () => {
    it('should set error state on fetch failure', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchError(500, 'Server error') as Response
      );

      const { result } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
    });

    it('should handle SSE reconnection on error', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: true })
      );

      await vi.advanceTimersByTimeAsync(100);
      expect(MockEventSource.instances.length).toBe(1);

      const originalInstance = MockEventSource.instances[0];
      
      act(() => {
        originalInstance.simulateError();
      });

      // Should attempt reconnection after base delay
      await vi.advanceTimersByTimeAsync(1100);

      // New instance should be created
      expect(MockEventSource.instances.length).toBe(1);
      expect(MockEventSource.instances[0]).not.toBe(originalInstance);
    });
  });

  // ============================================================
  // Cleanup Tests
  // ============================================================

  describe('cleanup', () => {
    it('should not update state after unmount', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess({ boards: [], messages: [], hasMore: false }) as Response
      );

      const { unmount } = renderHook(() =>
        useChatMessages({ spaceId: TEST_SPACE_ID, enableRealtime: true })
      );

      await vi.advanceTimersByTimeAsync(100);

      unmount();

      // Simulate late SSE message - should not cause errors
      expect(() => {
        if (MockEventSource.instances[0]) {
          MockEventSource.instances[0].simulateMessage({
            type: 'message',
            data: createMockMessage(),
          });
        }
      }).not.toThrow();
    });
  });
});
