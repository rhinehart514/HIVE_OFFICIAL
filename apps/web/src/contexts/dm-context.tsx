'use client';

/**
 * DM Context - Global state management for direct messaging
 *
 * Provides:
 * - Panel open/close state
 * - Active conversation management
 * - Conversations list
 * - Messages for active conversation
 * - Real-time updates via SSE
 */

import * as React from 'react';
import { useAuth } from '@hive/auth-logic';

// ============================================================================
// Types
// ============================================================================

export interface DMParticipant {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
}

export interface DMMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderHandle: string;
  senderAvatarUrl?: string;
  content: string;
  type: 'text';
  timestamp: number; // Unix timestamp for compatibility with ChatMessages
  isDeleted: boolean;
}

export interface DMConversation {
  id: string;
  participants: Record<string, DMParticipant>;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: string;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DMState {
  isPanelOpen: boolean;
  activeConversationId: string | null;
  activeConversation: DMConversation | null;
  conversations: DMConversation[];
  messages: DMMessage[];
  totalUnread: number;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
}

interface DMContextValue extends DMState {
  openPanel: () => void;
  openConversation: (recipientId: string) => Promise<void>;
  openConversationById: (conversationId: string) => Promise<void>;
  closePanel: () => void;
  sendMessage: (content: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  getOtherParticipant: (conversation: DMConversation) => DMParticipant | null;
}

// ============================================================================
// Context
// ============================================================================

const DMContext = React.createContext<DMContextValue | null>(null);

export function useDM(): DMContextValue {
  const context = React.useContext(DMContext);
  if (!context) {
    throw new Error('useDM must be used within a DMProvider');
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

interface DMProviderProps {
  children: React.ReactNode;
}

export function DMProvider({ children }: DMProviderProps) {
  const { user } = useAuth();
  const userId = user?.id;

  // State
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);
  const [activeConversation, setActiveConversation] = React.useState<DMConversation | null>(null);
  const [conversations, setConversations] = React.useState<DMConversation[]>([]);
  const [messages, setMessages] = React.useState<DMMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  // SSE connection ref
  const eventSourceRef = React.useRef<EventSource | null>(null);

  // Calculate total unread
  const totalUnread = React.useMemo(() => {
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  }, [conversations]);

  // Get other participant (for DMs there's always exactly 2)
  const getOtherParticipant = React.useCallback(
    (conversation: DMConversation): DMParticipant | null => {
      if (!userId) return null;
      const participants = Object.values(conversation.participants);
      return participants.find((p) => p.id !== userId) || null;
    },
    [userId]
  );

  // Fetch conversations
  const refreshConversations = React.useCallback(async () => {
    if (!userId) return;

    setIsLoadingConversations(true);
    try {
      const response = await fetch('/api/dm/conversations', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [userId]);

  // Fetch messages for a conversation
  const fetchMessages = React.useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(
        `/api/dm/conversations/${conversationId}/messages`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        // Convert ISO timestamps to Unix timestamps for ChatMessages compatibility
        const formattedMessages: DMMessage[] = (data.messages || []).map(
          (m: { id: string; senderId: string; senderName: string; senderHandle: string; senderAvatarUrl?: string; content: string; type: 'text'; timestamp: string; isDeleted: boolean }) => ({
            ...m,
            timestamp: new Date(m.timestamp).getTime(),
          })
        );
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Connect to SSE stream
  const connectToStream = React.useCallback((conversationId: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const eventSource = new EventSource(
      `/api/dm/conversations/${conversationId}/stream`,
      { withCredentials: true }
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'message': {
            const newMessage: DMMessage = {
              ...data.data,
              timestamp: new Date(data.data.timestamp).getTime(),
            };
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
            break;
          }
          case 'ping':
          case 'connected':
            // Heartbeat or connection confirmation
            break;
          default:
            break;
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // Will auto-reconnect
    };

    eventSourceRef.current = eventSource;
  }, []);

  // Open conversation by recipient ID
  const openConversation = React.useCallback(
    async (recipientId: string) => {
      if (!userId) return;

      setIsPanelOpen(true);
      setIsLoadingMessages(true);

      try {
        // Create or get conversation
        const response = await fetch('/api/dm/conversations', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientId }),
        });

        if (!response.ok) {
          throw new Error('Failed to create conversation');
        }

        const data = await response.json();
        const conversation = data.conversation;

        setActiveConversationId(conversation.id);
        setActiveConversation(conversation);

        // Update conversations list if this is new
        if (data.isNew) {
          setConversations((prev) => [conversation, ...prev]);
        }

        // Fetch messages
        await fetchMessages(conversation.id);

        // Connect to stream
        connectToStream(conversation.id);
      } catch (error) {
        console.error('Failed to open conversation:', error);
        setIsPanelOpen(false);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [userId, fetchMessages, connectToStream]
  );

  // Open conversation by ID
  const openConversationById = React.useCallback(
    async (conversationId: string) => {
      setIsPanelOpen(true);
      setActiveConversationId(conversationId);

      // Find in existing list or fetch
      const existing = conversations.find((c) => c.id === conversationId);
      if (existing) {
        setActiveConversation(existing);
      } else {
        try {
          const response = await fetch(`/api/dm/conversations/${conversationId}`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            setActiveConversation(data.conversation);
          }
        } catch (error) {
          console.error('Failed to fetch conversation:', error);
        }
      }

      // Fetch messages
      await fetchMessages(conversationId);

      // Connect to stream
      connectToStream(conversationId);
    },
    [conversations, fetchMessages, connectToStream]
  );

  // Open panel (shows conversation list)
  const openPanel = React.useCallback(() => {
    setIsPanelOpen(true);
    // Don't set active conversation - this will show the list view
    setActiveConversationId(null);
    setActiveConversation(null);
    setMessages([]);
  }, []);

  // Close panel
  const closePanel = React.useCallback(() => {
    setIsPanelOpen(false);
    setActiveConversationId(null);
    setActiveConversation(null);
    setMessages([]);

    // Close SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Send message
  const sendMessage = React.useCallback(
    async (content: string) => {
      if (!activeConversationId || !content.trim()) return;

      setIsSending(true);
      try {
        const response = await fetch(
          `/api/dm/conversations/${activeConversationId}/messages`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        const newMessage: DMMessage = {
          ...data.message,
          timestamp: new Date(data.message.timestamp).getTime(),
        };

        // Add optimistically (SSE will also deliver it, but we dedupe)
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });

        // Update conversation in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  lastMessage: {
                    content: content.slice(0, 100),
                    senderId: newMessage.senderId,
                    timestamp: new Date().toISOString(),
                  },
                  updatedAt: new Date().toISOString(),
                }
              : c
          )
        );
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId]
  );

  // Load conversations on mount
  React.useEffect(() => {
    if (userId) {
      refreshConversations();
    }
  }, [userId, refreshConversations]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const value: DMContextValue = {
    isPanelOpen,
    activeConversationId,
    activeConversation,
    conversations,
    messages,
    totalUnread,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    openPanel,
    openConversation,
    openConversationById,
    closePanel,
    sendMessage,
    refreshConversations,
    getOtherParticipant,
  };

  return <DMContext.Provider value={value}>{children}</DMContext.Provider>;
}
