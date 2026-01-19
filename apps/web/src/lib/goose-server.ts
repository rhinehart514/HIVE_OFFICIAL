/**
 * Goose Server - Backend utilities for HiveLab tool generation
 *
 * Handles communication with Ollama (local) and Groq (cloud) backends.
 * Used by the /api/tools/generate endpoint.
 */

// Note: These imports are from the local goose module in packages/core
// Once the package export is properly configured, change to '@hive/core/hivelab/goose'
import {
  validateToolComposition,
  parseModelOutput,
  sanitizeComposition,
  buildSystemPrompt,
  buildCompactSystemPrompt,
  type ToolComposition,
} from '../../../../packages/core/src/hivelab/goose';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type GooseBackend = 'ollama' | 'groq' | 'rules';

export interface GooseConfig {
  backend: GooseBackend;
  ollamaHost: string;
  ollamaModel: string;
  groqApiKey?: string;
  groqModel: string;
}

export interface GenerateRequest {
  prompt: string;
  existingComposition?: ToolComposition;
  isIteration?: boolean;
}

export interface StreamMessage {
  type: 'thinking' | 'element' | 'connection' | 'complete' | 'error';
  data: unknown;
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export function getGooseConfig(): GooseConfig {
  return {
    backend: (process.env.GOOSE_BACKEND as GooseBackend) || 'rules',
    ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'goose',
    groqApiKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  };
}

// ═══════════════════════════════════════════════════════════════════
// OLLAMA BACKEND
// ═══════════════════════════════════════════════════════════════════

async function callOllama(
  config: GooseConfig,
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const response = await fetch(`${config.ollamaHost}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollamaModel,
      prompt: prompt,
      system: systemPrompt,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        num_ctx: 2048,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

async function* streamOllama(
  config: GooseConfig,
  prompt: string,
  systemPrompt: string
): AsyncGenerator<string> {
  const response = await fetch(`${config.ollamaHost}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollamaModel,
      prompt: prompt,
      system: systemPrompt,
      stream: true,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        num_ctx: 2048,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            yield data.response;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// GROQ BACKEND (Cloud Fallback)
// ═══════════════════════════════════════════════════════════════════

async function callGroq(
  config: GooseConfig,
  prompt: string,
  systemPrompt: string
): Promise<string> {
  if (!config.groqApiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.groqApiKey}`,
    },
    body: JSON.stringify({
      model: config.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Groq error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// ═══════════════════════════════════════════════════════════════════
// RULES-BASED FALLBACK
// ═══════════════════════════════════════════════════════════════════

function generateWithRules(prompt: string): ToolComposition {
  const lowerPrompt = prompt.toLowerCase();

  // Simple pattern matching for common requests
  const elements: ToolComposition['elements'] = [];
  const connections: ToolComposition['connections'] = [];

  // Detect poll
  if (lowerPrompt.includes('poll') || lowerPrompt.includes('vote') || lowerPrompt.includes('survey')) {
    elements.push({
      type: 'poll-element',
      instanceId: 'poll_element_1',
      config: {
        question: extractQuestion(prompt) || 'What do you think?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        showResults: true,
        allowMultipleVotes: false,
      },
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
    });
  }

  // Detect RSVP/signup
  if (lowerPrompt.includes('rsvp') || lowerPrompt.includes('signup') || lowerPrompt.includes('registration')) {
    elements.push({
      type: 'rsvp-button',
      instanceId: 'rsvp_button_1',
      config: {
        eventName: extractEventName(prompt) || 'Event',
        showAttendeeCount: true,
        enableWaitlist: true,
      },
      position: { x: elements.length > 0 ? 440 : 100, y: 100 },
      size: { width: 240, height: 120 },
    });
  }

  // Detect countdown
  if (lowerPrompt.includes('countdown') || lowerPrompt.includes('timer')) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);

    elements.push({
      type: 'countdown-timer',
      instanceId: 'countdown_timer_1',
      config: {
        targetDate: targetDate.toISOString(),
        title: 'Time Remaining',
        showDays: true,
        showHours: true,
        showMinutes: true,
      },
      position: { x: elements.length > 0 ? 440 : 100, y: 100 },
      size: { width: 280, height: 140 },
    });
  }

  // Detect chart
  if (lowerPrompt.includes('chart') || lowerPrompt.includes('results') || lowerPrompt.includes('visual')) {
    elements.push({
      type: 'chart-display',
      instanceId: 'chart_display_1',
      config: {
        chartType: 'bar',
        title: 'Results',
        showLegend: true,
      },
      position: { x: elements.length > 0 ? 440 : 100, y: 100 },
      size: { width: 320, height: 240 },
    });

    // Connect poll to chart if both exist
    const pollElement = elements.find(e => e.type === 'poll-element');
    const chartElement = elements.find(e => e.type === 'chart-display');
    if (pollElement && chartElement) {
      connections.push({
        from: { instanceId: pollElement.instanceId, port: 'results' },
        to: { instanceId: chartElement.instanceId, port: 'data' },
      });
    }
  }

  // Detect form
  if (lowerPrompt.includes('form') || lowerPrompt.includes('feedback')) {
    elements.push({
      type: 'form-builder',
      instanceId: 'form_builder_1',
      config: {
        fields: [
          { name: 'name', type: 'text', label: 'Your Name', required: true },
          { name: 'feedback', type: 'textarea', label: 'Your Feedback', required: true },
        ],
        submitButtonText: 'Submit',
      },
      position: { x: elements.length > 0 ? 440 : 100, y: 100 },
      size: { width: 280, height: 200 },
    });
  }

  // Default to a simple poll if nothing detected
  if (elements.length === 0) {
    elements.push({
      type: 'poll-element',
      instanceId: 'poll_element_1',
      config: {
        question: extractQuestion(prompt) || 'What would you like to know?',
        options: ['Option 1', 'Option 2', 'Option 3'],
        showResults: true,
      },
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
    });
  }

  return {
    elements,
    connections,
    name: generateToolName(prompt),
    description: `Generated tool for: ${prompt}`,
    layout: 'grid',
  };
}

function extractQuestion(prompt: string): string | null {
  // Try to extract a question from the prompt
  const aboutMatch = prompt.match(/about\s+(.+?)(?:\s+with|\s*$)/i);
  if (aboutMatch) {
    return `What's your favorite ${aboutMatch[1]}?`;
  }
  return null;
}

function extractEventName(prompt: string): string | null {
  const forMatch = prompt.match(/for\s+(.+?)(?:\s+with|\s*$)/i);
  if (forMatch) {
    return forMatch[1].charAt(0).toUpperCase() + forMatch[1].slice(1);
  }
  return null;
}

function generateToolName(prompt: string): string {
  const words = prompt.split(' ').slice(0, 4);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════════

export async function generateTool(
  request: GenerateRequest
): Promise<ToolComposition> {
  const config = getGooseConfig();
  const systemPrompt = buildSystemPrompt({
    existingComposition: request.existingComposition,
    isIteration: request.isIteration,
  });

  let rawOutput: string;
  let composition: ToolComposition | null = null;

  // Try backends in order of preference
  const backends: GooseBackend[] = [config.backend];
  if (config.backend === 'ollama' && config.groqApiKey) {
    backends.push('groq');
  }
  backends.push('rules');

  for (const backend of backends) {
    try {
      switch (backend) {
        case 'ollama':
          rawOutput = await callOllama(config, request.prompt, systemPrompt);
          composition = parseModelOutput(rawOutput);
          break;

        case 'groq':
          rawOutput = await callGroq(config, request.prompt, buildCompactSystemPrompt());
          composition = parseModelOutput(rawOutput);
          break;

        case 'rules':
          composition = generateWithRules(request.prompt);
          break;
      }

      if (composition) {
        // Validate and sanitize
        const validation = validateToolComposition(composition);
        if (validation.valid) {
          return composition;
        } else if (validation.sanitized) {
          return validation.sanitized;
        }
        // If invalid, try to sanitize
        return sanitizeComposition(composition);
      }
    } catch (error) {
      console.warn(`Backend ${backend} failed:`, error);
      // Continue to next backend
    }
  }

  // Ultimate fallback
  return generateWithRules(request.prompt);
}

export async function* generateToolStream(
  request: GenerateRequest
): AsyncGenerator<StreamMessage> {
  const config = getGooseConfig();

  // Yield thinking message
  yield { type: 'thinking', data: { message: 'Analyzing your request...' } };

  try {
    const composition = await generateTool(request);

    // Yield elements one by one
    for (const element of composition.elements) {
      yield { type: 'element', data: element };
      await new Promise(resolve => setTimeout(resolve, 100)); // Stagger for visual effect
    }

    // Yield connections
    for (const connection of composition.connections) {
      yield { type: 'connection', data: connection };
    }

    // Yield completion
    yield {
      type: 'complete',
      data: {
        name: composition.name,
        description: composition.description,
        elementCount: composition.elements.length,
      },
    };
  } catch (error) {
    yield {
      type: 'error',
      data: {
        message: error instanceof Error ? error.message : 'Generation failed',
        code: 'GENERATION_ERROR',
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════

export async function checkOllamaHealth(): Promise<boolean> {
  const config = getGooseConfig();

  try {
    const response = await fetch(`${config.ollamaHost}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return false;

    const data = await response.json();
    const models = data.models || [];
    return models.some((m: { name: string }) => m.name.includes(config.ollamaModel));
  } catch {
    return false;
  }
}

export async function getAvailableBackend(): Promise<GooseBackend> {
  const config = getGooseConfig();

  // Check Ollama first
  if (config.backend === 'ollama') {
    const ollamaAvailable = await checkOllamaHealth();
    if (ollamaAvailable) return 'ollama';
  }

  // Check Groq
  if (config.groqApiKey) {
    return 'groq';
  }

  // Fallback to rules
  return 'rules';
}
