'use client';

/**
 * /tools/new — Create New Tool & Launch IDE
 *
 * This page handles the flow from the ChatGPT-style landing page:
 * 1. Receives prompt from URL params
 * 2. Creates a new tool via API
 * 3. Redirects to IDE with prompt for auto-generation
 *
 * Also handles direct access (no prompt) — creates blank tool.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@hive/auth-logic';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// Premium easing
const EASE = [0.22, 1, 0.36, 1] as const;

// Create a new tool via API
async function createTool(name: string, description?: string): Promise<string> {
  const response = await fetch('/api/tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: name || 'Untitled Tool',
      description: description || '',
      status: 'draft',
      type: 'visual',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create tool');
  }

  const data = await response.json();
  return data.tool.id;
}

// Generate a tool name from prompt (first 3-4 words + "Tool")
function generateToolName(prompt: string): string {
  const words = prompt.trim().split(/\s+/).slice(0, 4);
  // Capitalize first letter of each word
  const title = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return title || 'New Tool';
}

export default function NewToolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState<'creating' | 'redirecting' | 'error'>('creating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prevent double creation
  const hasCreated = useRef(false);

  // Get prompt from URL params
  const prompt = searchParams.get('prompt');
  const templateId = searchParams.get('template');

  useEffect(() => {
    // Wait for auth
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      const returnUrl = prompt
        ? `/tools/new?prompt=${encodeURIComponent(prompt)}`
        : '/tools/new';
      router.push(`/enter?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Prevent double creation in strict mode
    if (hasCreated.current) return;
    hasCreated.current = true;

    // Create tool and redirect to IDE
    async function initializeTool() {
      try {
        // Generate a name from the prompt or use default
        const toolName = prompt ? generateToolName(prompt) : 'Untitled Tool';

        // Create the tool
        const toolId = await createTool(toolName);

        setStatus('redirecting');

        // Build redirect URL
        const params = new URLSearchParams();
        params.set('new', 'true');

        if (prompt) {
          params.set('prompt', prompt);
        }

        if (templateId) {
          params.set('template', templateId);
        }

        // Navigate to IDE
        router.replace(`/tools/${toolId}?${params.toString()}`);
      } catch (error) {
        console.error('Failed to create tool:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to create tool');
        toast.error('Failed to create tool');
      }
    }

    initializeTool();
  }, [authLoading, user, router, prompt, templateId]);

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--bg-ground,#0A0A09)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-white/50 mb-6">
            {errorMessage || 'We couldn\'t create your tool. Please try again.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/tools')}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              Back to HiveLab
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-black rounded-lg font-medium
                hover:bg-white/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Creating/Redirecting state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--bg-ground,#0A0A09)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="text-center"
      >
        {/* Animated icon */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
          </div>
        </div>

        {/* Status text */}
        <h1 className="text-xl font-medium text-white mb-2">
          {status === 'creating' ? 'Preparing your canvas...' : 'Launching IDE...'}
        </h1>

        {prompt && (
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            &ldquo;{prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt}&rdquo;
          </p>
        )}

        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut'
              }}
              className="w-2 h-2 rounded-full bg-white"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
