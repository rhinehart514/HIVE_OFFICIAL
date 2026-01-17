'use client';

/**
 * AI HiveLab Landing Page - Chat Interface
 *
 * YC/SF-style conversational interface for AI tool generation.
 * Split-view: Chat left (60%), Live preview right (40%)
 * Flow: Example prompts → User message → AI response with streaming → Tool preview updates
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageBubble,
  MessageList,
  ConversationThread,
  EmptyChatState,
  ChatInput,
  TypingIndicator,
  ToolPreviewCard,
  type ChatInputHandle
} from '../../atomic/03-Chat';
import { StreamingCanvasView } from '../../components/hivelab/StreamingCanvasView';
import { SignupGateModal } from '../../components/auth/SignupGateModal';
import { useStreamingGeneration } from '@hive/hooks';
import { saveLocalTool } from '../../lib/hivelab/local-tool-storage';
import type { ToolComposition } from '../../lib/hivelab/element-system';
import { AnimatePresence, motion } from 'framer-motion';
import { ResizableDivider } from '../../atomic/molecules/resizable-divider';
import { cn } from '../../lib/utils';
import { SparklesIcon, ChevronLeftIcon, ChevronRightIcon, CommandLineIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const Command = CommandLineIcon;
import { ElementShowcaseSidebar } from '../../components/hivelab/showcase';

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

  /** Is user a space leader (shows deploy option) */
  isSpaceLeader?: boolean;

  /** Handle signup */
  onSignup?: (email: string, password: string) => Promise<void>;

  /** Redirect to signup page */
  redirectToSignup?: () => void;

  /** Save tool callback - returns { toolId } */
  onSave?: (composition: ToolComposition) => Promise<{ toolId: string } | void>;

  /** Share tool callback - returns share URL */
  onShare?: (composition: ToolComposition) => Promise<string>;

  /** Called after successful save with toolId and name */
  onSaveComplete?: (toolId: string, toolName: string) => void;

  /** Called when composition changes (for WIP auto-save) */
  onCompositionChange?: (composition: ToolComposition) => void;

  /** Initial composition (for WIP restore) */
  initialComposition?: ToolComposition | null;

  /** Server ID if tool already saved */
  serverId?: string | null;
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
  isSpaceLeader = false,
  onSignup,
  redirectToSignup,
  onSave,
  onShare,
  onSaveComplete,
  onCompositionChange,
  initialComposition,
  serverId
}: AILandingPageChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [currentAIMessage, setCurrentAIMessage] = useState('');
  const generationStepsRef = useRef<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  // Element showcase sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);

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
  const { state, generate, reset, hydrate } = useStreamingGeneration({
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
        `\n\nYour ${composition.name} is ready! You can see it previewed on the right. Try it out with "Test", then "Save" when you're happy with it.`;

      // Add final AI message
      addAIMessage(finalMessage);
      setCurrentAIMessage('');
      generationStepsRef.current = [];

      // Save to localStorage (pre-signup)
      if (!isAuthenticated && typeof window !== 'undefined') {
        saveLocalTool(composition);
      }

      // Notify parent of composition change (for WIP auto-save)
      if (onCompositionChange) {
        onCompositionChange(composition);
      }
    },
    onError: (error) => {
      addAIMessage(`I encountered an error while building your tool: ${error}. Please try again or rephrase your request.`);
      setCurrentAIMessage('');
      generationStepsRef.current = [];
    }
  });

  // Hydrate from initialComposition (WIP restore)
  useEffect(() => {
    if (initialComposition && initialComposition.elements?.length > 0) {
      hydrate(initialComposition);
      // Add welcome back message
      addAIMessage(`Welcome back! Your "${initialComposition.name || 'tool'}" has been restored. Continue building or save when you're ready.`);
    }
  }, [initialComposition]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Check if we have an existing composition (for iteration)
    const existingComposition = state.composition;
    const hasExisting = existingComposition && existingComposition.elements.length > 0;

    // Detect if this is likely an iteration request
    const iterationSignals = ['add', 'also', 'include', 'change', 'modify', 'update', 'remove', 'make it', 'can you'];
    const lowerMessage = message.toLowerCase().trim();
    const isIteration = Boolean(hasExisting && iterationSignals.some(
      signal => lowerMessage.startsWith(signal) || lowerMessage.includes(` ${signal} `)
    ));

    // Start generation (passing existing composition for iteration)
    await generate({
      prompt: message,
      existingComposition: isIteration ? existingComposition ?? undefined : undefined,
      isIteration,
    });
  };

  // Handle example prompt click
  const handleExampleClick = (prompt: string) => {
    handleUserMessage(prompt);
  };

  // Handle element showcase element selection
  const handleElementSelect = useCallback((_elementId: string) => {
    // Could show element details or highlight in chat
    // TODO: Implement element detail display or chat highlight
  }, []);

  // Handle element showcase prompt click
  const handleShowcasePromptClick = useCallback((prompt: string) => {
    // Pre-fill the chat input with the suggested prompt
    setPendingPrompt(prompt);
    // Collapse sidebar to show chat
    setSidebarCollapsed(true);
  }, []);

  // Handle template selection from showcase
  const handleTemplateSelect = useCallback((template: ToolComposition) => {
    // Hydrate the composition state with the template
    hydrate(template);
    // Collapse sidebar
    setSidebarCollapsed(true);
    // Add message about template being loaded
    addAIMessage(`I've loaded the "${template.name}" template for you. You can see it in the preview on the right. Feel free to test it or ask me to modify it!`);
  }, [hydrate]);

  // Apply pending prompt when sidebar collapses
  useEffect(() => {
    if (pendingPrompt && sidebarCollapsed) {
      // Small delay to let animation complete
      const timer = setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.setValue(pendingPrompt);
          chatInputRef.current.focus();
        }
        setPendingPrompt(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pendingPrompt, sidebarCollapsed]);

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

  // Handle save click - primary action
  const handleSave = async () => {
    if (!state.composition) return;

    if (!isAuthenticated) {
      // Save to localStorage for anonymous users
      saveLocalTool(state.composition);
      addAIMessage("Saved! Your tool is stored locally. Sign up to sync it across devices and share it with others.");
      return;
    }

    // For authenticated users, call the save callback
    if (onSave) {
      setIsSaving(true);
      try {
        const result = await onSave(state.composition);
        const toolId = result?.toolId;
        const toolName = state.composition.name || 'Your tool';

        if (toolId && onSaveComplete) {
          // Trigger success state + redirect in parent
          onSaveComplete(toolId, toolName);
        } else {
          // Fallback: just show message (no redirect)
          addAIMessage(`"${toolName}" saved to your creations!`);
        }
      } catch (error) {
        addAIMessage("Failed to save. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Handle share click
  const handleShare = async () => {
    if (!state.composition) return;

    if (!isAuthenticated) {
      setShowSignupGate(true);
      return;
    }

    if (onShare) {
      try {
        const shareUrl = await onShare(state.composition);
        // Copy to clipboard
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          addAIMessage(`Share link copied! Anyone with the link can use your tool.`);
        }
      } catch (error) {
        addAIMessage("Failed to create share link. Please try again.");
      }
    }
  };

  // Handle test click - enable interactive preview
  const handleTest = () => {
    setIsTestMode(true);
    addAIMessage("Test mode enabled! Try interacting with your tool in the preview.");
  };

  // Handle deploy click (for space leaders)
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
        {/* Element Showcase Sidebar (Collapsible) */}
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="h-full border-r border-neutral-800 bg-neutral-900/50 overflow-hidden"
            >
              <ElementShowcaseSidebar
                onElementSelect={handleElementSelect}
                onPromptClick={handleShowcasePromptClick}
                onTemplateSelect={handleTemplateSelect}
                collapsed={false}
                onCollapseChange={() => setSidebarCollapsed(true)}
                className="h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

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
                'focus:outline-none focus:ring-2 focus:ring-life-gold/30'
              )}
            >
              <Command className="w-3 h-3" />
              Expand
            </motion.button>
          )}

          {/* Elements Sidebar Toggle Button */}
          <AnimatePresence>
            {sidebarCollapsed && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={() => setSidebarCollapsed(false)}
                className={cn(
                  'absolute left-4 top-4 z-10',
                  'flex items-center gap-2 px-3 py-2 rounded-lg',
                  'bg-neutral-900/90 hover:bg-neutral-800',
                  'border border-neutral-800 hover:border-life-gold/30',
                  'text-neutral-400 hover:text-life-gold',
                  'transition-colors duration-200',
                  'backdrop-blur-sm'
                )}
                title="Browse elements"
              >
                <SparklesIcon className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Elements</span>
                <ChevronRightIcon className="w-3 h-3" />
              </motion.button>
            )}
          </AnimatePresence>

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
            ref={chatInputRef}
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
            onSave={handleSave}
            onShare={isAuthenticated ? handleShare : undefined}
            onTest={handleTest}
            onEdit={handleEdit}
            onDeploy={isSpaceLeader ? handleDeploy : undefined}
            isSpaceLeader={isSpaceLeader}
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
                interactive={isTestMode}
                onInteraction={(_elementId, _action, _data) => {
                  // TODO: Show interaction feedback in chat
                }}
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
