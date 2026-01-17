'use client';

/**
 * AI Prompt Input Component
 *
 * ChatGPT-style large textarea for natural language tool generation.
 * Hero component for landing page AI experience.
 */

import { SparklesIcon, PaperAirplaneIcon, ArrowPathIcon, BoltIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';

import { Button } from '../../design-system/primitives';

export interface AIPromptInputProps {
  /** Callback when user submits prompt */
  onSubmit: (prompt: string) => void;

  /** Whether generation is in progress */
  isGenerating?: boolean;

  /** Current generation status */
  status?: string;

  /** Placeholder text */
  placeholder?: string;

  /** Demo prompts to show as suggestions */
  demoPrompts?: string[];

  /** Show demo prompt suggestions */
  showSuggestions?: boolean;

  /** Auto-focus on mount */
  autoFocus?: boolean;

  /** Variant: 'hero' (large, centered) or 'inline' (compact, integrated) */
  variant?: 'hero' | 'inline';

  /** Max character limit */
  maxLength?: number;
}

/**
 * AI Prompt Input - ChatGPT-style textarea for tool generation
 */
export function AIPromptInput({
  onSubmit,
  isGenerating = false,
  status,
  placeholder = 'Describe what you want to build for your campus org...',
  demoPrompts = [],
  showSuggestions = true,
  autoFocus = false,
  variant = 'hero',
  maxLength = 1000
}: AIPromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    if (prompt.trim() && !isGenerating) {
      onSubmit(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const isSubmitDisabled = !prompt.trim() || isGenerating;
  const characterCount = prompt.length;
  const isNearLimit = characterCount > maxLength * 0.9;

  // Hero variant (landing page)
  if (variant === 'hero') {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
            <SparklesIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">AI-Powered Tool Builder</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Build campus tools in seconds
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Describe what you need, watch AI build it in real-time, then deploy to your org.
          </p>
        </div>

        {/* Input Container */}
        <div
          className={`
            relative rounded-2xl border-2 transition-all duration-200
            ${isFocused ? 'border-white/20 bg-background shadow-xl' : 'border-border bg-muted/30 hover:border-white/10'}
          `}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isGenerating}
            maxLength={maxLength}
            rows={3}
            className="w-full px-6 py-5 bg-transparent resize-none focus:outline-none text-lg placeholder:text-muted-foreground/60 disabled:opacity-50"
            style={{ minHeight: '120px', maxHeight: '300px' }}
          />

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            {/* Character count */}
            <div className="text-xs text-muted-foreground">
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <ArrowPathIcon className="h-3 w-3 animate-spin" />
                  {status || 'Generating...'}
                </span>
              ) : (
                <span className={isNearLimit ? 'text-amber-500' : ''}>
                  {characterCount} / {maxLength}
                </span>
              )}
            </div>

            {/* Submit button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              size="sm"
              className="gap-2 bg-gold-cta hover:brightness-110 text-black disabled:bg-muted disabled:text-muted-foreground transition-all"
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Demo Prompts (Suggestions) */}
        {showSuggestions && demoPrompts.length > 0 && !isGenerating && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BoltIcon className="h-3.5 w-3.5" />
              <span>Try these examples:</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {demoPrompts.slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="group text-left px-4 py-3 rounded-lg border border-border hover:border-white/10 hover:bg-muted/50 transition-all text-sm"
                >
                  <div className="flex items-start gap-2">
                    <SparklesIcon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {suggestion}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inline variant (canvas header)
  return (
    <div className="w-full space-y-2">
      <div
        className={`
          relative rounded-lg border transition-all
          ${isFocused ? 'border-white/20 bg-background' : 'border-border bg-muted/30'}
        `}
      >
        <div className="flex items-end gap-2 p-2">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isGenerating}
            maxLength={maxLength}
            rows={1}
            className="flex-1 px-3 py-2 bg-transparent resize-none focus:outline-none text-sm placeholder:text-muted-foreground/60 disabled:opacity-50"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            size="sm"
            className="shrink-0 bg-gold-cta hover:brightness-110 text-black disabled:bg-muted disabled:text-muted-foreground transition-all"
          >
            {isGenerating ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <PaperAirplaneIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Status/Counter */}
        {(isGenerating || characterCount > 0) && (
          <div className="px-3 pb-2 text-xs text-muted-foreground">
            {isGenerating ? (
              <span className="flex items-center gap-1.5">
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
                {status || 'Generating...'}
              </span>
            ) : (
              <span className={isNearLimit ? 'text-amber-500' : ''}>
                {characterCount} / {maxLength}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Inline suggestions (if space allows) */}
      {showSuggestions && demoPrompts.length > 0 && !isGenerating && !prompt && (
        <div className="flex flex-wrap gap-2">
          {demoPrompts.slice(0, 3).map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-xs px-2 py-1 rounded-md border border-border hover:border-white/10 hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground"
            >
              {suggestion.length > 40 ? `${suggestion.slice(0, 40)}...` : suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
