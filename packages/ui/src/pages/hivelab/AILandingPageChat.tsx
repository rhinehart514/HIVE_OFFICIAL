'use client';

/**
 * AI HiveLab Landing Page - Chat Interface
 *
 * YC/SF-style conversational interface for AI tool generation.
 * Split-view: Chat left (60%), Live preview right (40%)
 * Flow: Example prompts → User message → AI response with streaming → Tool preview updates
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageBubble,
  MessageList,
  ConversationThread,
  EmptyChatState,
  ChatInput,
  TypingIndicator,
  ToolPreviewCard
} from '../../atomic/03-Chat';
import { StreamingCanvasView } from '../../components/hivelab/StreamingCanvasView';
import { SignupGateModal } from '../../components/auth/SignupGateModal';
import { useStreamingGeneration } from '@hive/hooks';
import { saveLocalTool } from '../../lib/hivelab/local-tool-storage';
import type { ToolComposition } from '../../lib/hivelab/element-system';
import { AnimatePresence, motion } from 'framer-motion';
import { ResizableDivider } from '../../atomic/molecules/resizable-divider';
import { cn } from '../../lib/utils';
import { Command } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  {
    label: 'Event RSVP',
    prompt: 'Create an event RSVP form with meal preferences and dietary restrictions'
  },
  {
    label: 'Feedback polls',
    prompt: 'Build an anonymous feedback tool for club meetings with rating scales'
  },
  {
    label: 'Room finder',
    prompt: 'Make a room finder for group study sessions with time slots'
  },
  {
    label: 'Logo voting',
    prompt: 'Design a poll for voting on club logo designs with image options'
  }
];

export interface AILandingPageChatProps {
  /** User ID (if authenticated) */
  userId?: string;

  /** Is user authenticated */
  isAuthenticated?: boolean;

  /** Handle signup */
  onSignup?: (email: string, password: string) => Promise<void>;

  /** Redirect to signup page */
  redirectToSignup?: () => void;
}

interface Message {
  id: string;
  variant: 'user' | 'ai';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

/**
 * AI HiveLab Landing Page - Chat Interface
 *
 * Conversational AI tool builder with split-view preview
 */
export function AILandingPageChat({
  userId,
  isAuthenticated = false,
  onSignup,
  redirectToSignup
}: AILandingPageChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [currentAIMessage, setCurrentAIMessage] = useState('');
  const generationStepsRef = useRef<string[]>([]);

  // Layout state management
  const [chatWidth, setChatWidth] = useState<number>(() => {
    // Load from localStorage or use default (60%)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hivelab-chat-width');
      return saved ? parseFloat(saved) : 60;
    }
    return 60;
  });
  const [userHasManuallyResized, setUserHasManuallyResized] = useState(false);

  // Streaming generation hook
  const { state, generate, reset } = useStreamingGeneration({
    onElementAdded: (element, status) => {
      // Track generation steps for conversational output
      const stepMessage = getStepMessage(element.elementId, status);
      generationStepsRef.current.push(stepMessage);

      // Update AI message with accumulated steps
      setCurrentAIMessage(
        "I'll create that for you. Let me add:\n\n" +
        generationStepsRef.current.map((step, i) => `${i + 1}. ${step} ✓`).join('\n')
      );
    },
    onComplete: (composition: ToolComposition) => {
      // Final AI message
      const finalMessage =
        "I'll create that for you. Let me add:\n\n" +
        generationStepsRef.current.map((step, i) => `${i + 1}. ${step} ✓`).join('\n') +
        `\n\nYour ${composition.name} is ready! You can see it previewed on the right. Click "Deploy to your org" when you're ready to launch it.`;

      // Add final AI message
      addAIMessage(finalMessage);
      setCurrentAIMessage('');
      generationStepsRef.current = [];

      // Save to localStorage (pre-signup)
      if (!isAuthenticated && typeof window !== 'undefined') {
        saveLocalTool(composition);
      }
    },
    onError: (error) => {
      addAIMessage(`I encountered an error while building your tool: ${error}. Please try again or rephrase your request.`);
      setCurrentAIMessage('');
      generationStepsRef.current = [];
    }
  });

  // Auto-collapse chat when generation starts (unless user manually resized)
  const prevIsGeneratingRef = useRef(false);
  useEffect(() => {
    const isGenerating = state.isGenerating;

    // Only auto-collapse when generation first starts (with delay)
    if (isGenerating && !prevIsGeneratingRef.current && !userHasManuallyResized) {
      // Wait 1.5s before collapse (let user read their input)
      setTimeout(() => {
        if (state.isGenerating && !userHasManuallyResized) {
          setChatWidth(35); // Collapse to 35% (maintain readability)
        }
      }, 1500);
    }

    prevIsGeneratingRef.current = isGenerating;
  }, [state.isGenerating, userHasManuallyResized]);

  // Handle manual resize
  const handleWidthChange = (newWidth: number) => {
    setChatWidth(newWidth);
    setUserHasManuallyResized(true);

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('hivelab-chat-width', newWidth.toString());
    }
  };

  // Handle user message submission
  const handleUserMessage = async (message: string) => {
    // Add user message to chat
    addUserMessage(message);

    // Reset generation state
    generationStepsRef.current = [];
    setCurrentAIMessage('');

    // Start generation
    await generate({ prompt: message });
  };

  // Handle example prompt click
  const handleExampleClick = (prompt: string) => {
    handleUserMessage(prompt);
  };

  // Add user message
  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      variant: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Add AI message
  const addAIMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      variant: 'ai',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Handle deploy click
  const handleDeploy = () => {
    if (!isAuthenticated) {
      setShowSignupGate(true);
    } else {
      // Handle authenticated deploy
      router.push(`/tools/${state.composition?.id}/deploy`);
    }
  };

  // Handle edit click
  const handleEdit = () => {
    if (state.composition) {
      // Save composition to localStorage for edit route to hydrate
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `hivelab_edit_composition_${state.composition.id}`,
          JSON.stringify(state.composition)
        );
      }
      router.push(`/tools/${state.composition.id}/edit`);
    }
  };

  // Get conversational step message
  const getStepMessage = (elementId: string, status: string): string => {
    // Map element IDs to friendly names
    const elementNames: Record<string, string> = {
      'form-builder': 'Form with input fields',
      'result-list': 'Results display list',
      'text-input': 'Text input field',
      'poll': 'Poll with options',
      'rating-scale': 'Rating scale',
      'feedback-form': 'Feedback form',
      'calendar': 'Calendar picker'
    };

    const friendlyName = elementNames[elementId] || elementId.replace('-', ' ');
    return friendlyName;
  };

  const hasMessages = messages.length > 0;
  const isGenerating = state.isGenerating;
  const hasComposition = state.composition !== null;

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      {/* Main: Split View - Full height, no navbar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat (Dynamic Width) */}
        <motion.div
          className="flex flex-col relative"
          style={{ width: `${chatWidth}%` }}
          initial={false}
          animate={{ width: `${chatWidth}%` }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            mass: 0.8
          }}
        >
          {/* Expand Chat Button (when minimized) */}
          {chatWidth < 30 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleWidthChange(60)}
              className={cn(
                'absolute top-4 right-4 z-10',
                'px-3 py-2 rounded-lg',
                'bg-neutral-900 hover:bg-neutral-800',
                'border border-neutral-800 hover:border-neutral-700',
                'text-xs text-neutral-400 hover:text-neutral-100',
                'transition-all duration-200',
                'flex items-center gap-2',
                'focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30'
              )}
            >
              <Command className="w-3 h-3" />
              Expand
            </motion.button>
          )}

          <ConversationThread
            autoScroll={true}
            emptyState={
              <EmptyChatState
                title="Build campus tools with AI"
                description="Describe what you need and we'll generate it instantly. No code required."
                examplePrompts={EXAMPLE_PROMPTS.map(ex => ({
                  label: ex.label,
                  prompt: ex.prompt,
                  onClick: handleExampleClick
                }))}
              />
            }
          >
            {hasMessages && (
              <MessageList>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    variant={message.variant}
                    content={message.content}
                    timestamp={message.timestamp}
                    userName="You"
                  />
                ))}

                {/* Streaming AI message */}
                {isGenerating && currentAIMessage && (
                  <MessageBubble
                    variant="ai"
                    content={currentAIMessage}
                    isStreaming={true}
                  />
                )}

                {/* Typing indicator (before first element) */}
                {isGenerating && !currentAIMessage && (
                  <AnimatePresence>
                    <TypingIndicator />
                  </AnimatePresence>
                )}
              </MessageList>
            )}
          </ConversationThread>

          {/* Chat Input */}
          <ChatInput
            onSubmit={handleUserMessage}
            onStop={() => {/* TODO: Implement stop generation */}}
            isGenerating={isGenerating}
            placeholder="Describe what you want to build..."
            disabled={false}
          />
        </motion.div>

        {/* Resizable Divider */}
        <ResizableDivider
          leftWidth={chatWidth}
          onWidthChange={handleWidthChange}
          minWidth={20}
          maxWidth={80}
          ariaLabel="Resize chat and preview panels"
        />

        {/* Right: Tool Preview (Dynamic Width) */}
        <motion.div
          className="flex flex-col"
          style={{ width: `${100 - chatWidth}%` }}
          initial={false}
          animate={{ width: `${100 - chatWidth}%` }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            mass: 0.8
          }}
        >
          <ToolPreviewCard
            toolName={state.composition?.name}
            toolDescription={state.composition?.description}
            isGenerating={isGenerating}
            isComplete={hasComposition && !isGenerating}
            onDeploy={handleDeploy}
            onEdit={handleEdit}
            composition={state.composition}
          >
            {/* Canvas Preview */}
            {(hasComposition || isGenerating) && (
              <StreamingCanvasView
                elements={state.elements}
                status={state.currentStatus}
                isGenerating={isGenerating}
                composition={state.composition}
                progress={state.progress}
              />
            )}
          </ToolPreviewCard>
        </motion.div>
      </div>

      {/* Signup Gate Modal */}
      <SignupGateModal
        isOpen={showSignupGate}
        onClose={() => setShowSignupGate(false)}
        onSignup={onSignup}
        redirectToSignup={redirectToSignup}
        toolName={state.composition?.name}
      />
    </div>
  );
}
