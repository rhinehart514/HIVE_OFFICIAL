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
} from '@hive/core/hivelab/goose';

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

  // Use higher token limit for 70b model (better at complex tools)
  const is70b = config.groqModel.includes('70b');
  const maxTokens = is70b ? 2048 : 1024;

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
      max_tokens: maxTokens,
      // Groq-specific: request JSON mode for better structured output
      response_format: is70b ? { type: 'json_object' } : undefined,
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
// PROMPT ANALYSIS
// ═══════════════════════════════════════════════════════════════════

interface PromptAnalysis {
  question: string | null;
  options: string[];
  eventName: string | null;
  targetDate: Date | null;
  subject: string;
  fields: Array<{ name: string; label: string; type: string }>;
  items: string[];
}

function analyzePrompt(prompt: string): PromptAnalysis {
  const result: PromptAnalysis = {
    question: null,
    options: [],
    eventName: null,
    targetDate: null,
    subject: '',
    fields: [],
    items: [],
  };

  // Extract explicit options: "options: A, B, C" or "with options A, B, C"
  // Also handles "choices:", "between X, Y, and Z", "A vs B vs C", "A or B or C"
  const optionsMatch = prompt.match(
    /(?:options?|choices?)\s*[:=]\s*(.+?)(?:\.|$)/i
  ) || prompt.match(
    /(?:with\s+options?|with\s+choices?)\s+(.+?)(?:\.|$)/i
  );
  if (optionsMatch) {
    result.options = splitList(optionsMatch[1]);
  } else {
    const vsMatch = prompt.match(/\b(.+?)\s+vs\.?\s+(.+?)(?:\s+vs\.?\s+(.+?))?(?:\.|$)/i);
    if (vsMatch) {
      result.options = [vsMatch[1].trim(), vsMatch[2].trim()];
      if (vsMatch[3]) result.options.push(vsMatch[3].trim());
    } else {
      const orMatch = prompt.match(/(?:between|choose|pick)\s+(.+?\s+or\s+.+?)(?:\.|$)/i);
      if (orMatch) {
        result.options = orMatch[1].split(/\s+or\s+/i).map(s => s.trim()).filter(Boolean);
      }
    }
  }

  // Clean up options
  result.options = result.options
    .map(o => o.replace(/^(and|or)\s+/i, '').trim())
    .filter(o => o.length > 0 && o.length < 80);

  // Extract question: text ending in "?" or "about X" patterns
  const questionMatch = prompt.match(/[""](.+?\?)[""]/) || prompt.match(/["""](.+?\?)["""]/) || prompt.match(/(?:^|\.\s*)([^.]+\?)$/);
  if (questionMatch) {
    result.question = questionMatch[1].trim();
  } else {
    const aboutMatch = prompt.match(/(?:poll|vote|survey|ask)\s+(?:about|on|for)\s+(.+?)(?:\s+with|\s+options|\s+choices|\.|$)/i);
    if (aboutMatch) {
      const topic = aboutMatch[1].trim();
      result.question = topic.endsWith('?') ? topic : `What do you think about ${topic}?`;
    }
  }

  // Extract event name: "for [event name]" or "[event] RSVP/signup"
  const eventMatch = prompt.match(
    /(?:rsvp|signup|sign[- ]up|register|registration|attend)\s+(?:for|to)\s+(.+?)(?:\s+with|\s+options|\.|$)/i
  ) || prompt.match(
    /(.+?)\s+(?:rsvp|signup|sign[- ]up|registration)/i
  ) || prompt.match(
    /(?:for|to)\s+(?:the\s+)?(.+?)(?:\s+with|\s+options|\.|$)/i
  );
  if (eventMatch) {
    result.eventName = titleCase(eventMatch[1].trim().replace(/^(a|an|the)\s+/i, ''));
  }

  // Extract date: "March 15", "next Friday", "January 20, 2026", "in 3 days"
  const dateStr = extractDateFromText(prompt);
  if (dateStr) {
    result.targetDate = dateStr;
  }

  // Extract subject (primary noun phrase)
  const subjectMatch = prompt.match(
    /(?:create|make|build|generate)\s+(?:a|an|the)?\s*(.+?)(?:\s+tool|\s+for|\s+with|\s+that|\.|$)/i
  );
  if (subjectMatch) {
    result.subject = subjectMatch[1].trim();
  } else {
    // Fall back to first meaningful phrase
    result.subject = prompt.replace(/^(create|make|build|generate|i need|i want)\s+(a|an|the)?\s*/i, '').split(/[.,!?]/)[0].trim();
  }

  // Extract form fields from "fields: name, email, phone" patterns
  const fieldsMatch = prompt.match(/(?:fields?|inputs?|questions?)\s*[:=]\s*(.+?)(?:\.|$)/i);
  if (fieldsMatch) {
    result.fields = splitList(fieldsMatch[1]).map(f => ({
      name: f.toLowerCase().replace(/\s+/g, '_'),
      label: titleCase(f),
      type: guessFieldType(f),
    }));
  }

  // Extract list items from "items: X, Y, Z" patterns
  const itemsMatch = prompt.match(/(?:items?|tasks?|things?|list)\s*[:=]\s*(.+?)(?:\.|$)/i);
  if (itemsMatch) {
    result.items = splitList(itemsMatch[1]);
  }

  return result;
}

function splitList(text: string): string[] {
  return text
    .split(/[,;]\s*|\s+and\s+/i)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function guessFieldType(field: string): string {
  const lower = field.toLowerCase();
  if (lower.includes('email')) return 'email';
  if (lower.includes('phone') || lower.includes('number')) return 'tel';
  if (lower.includes('comment') || lower.includes('feedback') || lower.includes('message') || lower.includes('description')) return 'textarea';
  if (lower.includes('date') || lower.includes('when')) return 'date';
  return 'text';
}

function extractDateFromText(prompt: string): Date | null {
  // Explicit date: "March 15", "January 20, 2026", "12/25/2026"
  const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const monthMatch = prompt.match(
    new RegExp(`(${monthNames.join('|')})\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?`, 'i')
  );
  if (monthMatch) {
    const month = monthNames.indexOf(monthMatch[1].toLowerCase());
    const day = parseInt(monthMatch[2]);
    const year = monthMatch[3] ? parseInt(monthMatch[3]) : new Date().getFullYear();
    const date = new Date(year, month, day);
    if (date > new Date()) return date;
    // If date already passed this year, use next year
    return new Date(year + 1, month, day);
  }

  // Relative: "in 3 days", "in 2 weeks"
  const relativeMatch = prompt.match(/in\s+(\d+)\s+(day|week|month|hour)s?/i);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    const date = new Date();
    if (unit === 'day') date.setDate(date.getDate() + amount);
    else if (unit === 'week') date.setDate(date.getDate() + amount * 7);
    else if (unit === 'month') date.setMonth(date.getMonth() + amount);
    else if (unit === 'hour') date.setHours(date.getHours() + amount);
    return date;
  }

  // "next Friday", "next Monday" etc.
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const nextDayMatch = prompt.match(
    new RegExp(`next\\s+(${dayNames.join('|')})`, 'i')
  );
  if (nextDayMatch) {
    const targetDay = dayNames.indexOf(nextDayMatch[1].toLowerCase());
    const date = new Date();
    const currentDay = date.getDay();
    const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntil);
    return date;
  }

  // "tomorrow"
  if (/\btomorrow\b/i.test(prompt)) {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
// RULES-BASED FALLBACK
// ═══════════════════════════════════════════════════════════════════

function generateWithRules(prompt: string): ToolComposition {
  const lowerPrompt = prompt.toLowerCase();
  const analysis = analyzePrompt(prompt);
  let nextY = 100;

  const elements: ToolComposition['elements'] = [];
  const connections: ToolComposition['connections'] = [];

  function addElement(
    type: string,
    instanceId: string,
    config: Record<string, unknown>,
    width = 12,
    height = 200,
  ) {
    elements.push({
      type,
      instanceId,
      config,
      position: { x: 0, y: nextY },
      size: { width, height },
    });
    nextY += height + 20;
  }

  // ── Poll ──────────────────────────────────────────────────────
  const wantsPoll = /\b(poll|vote|survey|ballot|rank|preference)\b/.test(lowerPrompt);
  if (wantsPoll) {
    const options = analysis.options.length >= 2
      ? analysis.options
      : ['Option A', 'Option B', 'Option C'];
    addElement('poll-element', 'poll_001', {
      question: analysis.question || `What do you think about ${analysis.subject || 'this'}?`,
      options,
      showResults: true,
      allowMultipleVotes: lowerPrompt.includes('multiple') || lowerPrompt.includes('multi'),
    });
  }

  // ── RSVP / Signup ─────────────────────────────────────────────
  const wantsRsvp = /\b(rsvp|sign\s*up|signup|register|registration|attend|going)\b/.test(lowerPrompt);
  if (wantsRsvp) {
    addElement('rsvp-button', 'rsvp_001', {
      eventName: analysis.eventName || titleCase(analysis.subject) || 'Event',
      showAttendeeCount: true,
      enableWaitlist: lowerPrompt.includes('waitlist') || lowerPrompt.includes('limit'),
      maxAttendees: extractNumber(lowerPrompt, /(?:max|limit|cap)\s*(?:of|:)?\s*(\d+)/i),
    }, 12, 120);
  }

  // ── Countdown ─────────────────────────────────────────────────
  const wantsCountdown = /\b(countdown|count\s*down|time\s*left|days?\s*until|deadline)\b/.test(lowerPrompt);
  if (wantsCountdown) {
    const targetDate = analysis.targetDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    })();
    addElement('countdown-timer', 'countdown_001', {
      targetDate: targetDate.toISOString(),
      title: analysis.eventName || titleCase(analysis.subject) || 'Event',
      showDays: true,
      showHours: true,
      showMinutes: true,
    }, 12, 140);
  }

  // ── Leaderboard ───────────────────────────────────────────────
  const wantsLeaderboard = /\b(leaderboard|ranking|scoreboard|top\s*\d+|competition|contest)\b/.test(lowerPrompt);
  if (wantsLeaderboard) {
    addElement('leaderboard', 'leaderboard_001', {
      title: analysis.eventName || titleCase(analysis.subject) || 'Leaderboard',
      maxItems: extractNumber(lowerPrompt, /top\s*(\d+)/i) || 10,
      showRank: true,
    });
  }

  // ── Counter ───────────────────────────────────────────────────
  const wantsCounter = /\b(counter|tally|count|track\s*(?:a\s+)?number|how\s*many)\b/.test(lowerPrompt);
  if (wantsCounter && !wantsCountdown) {
    addElement('counter-element', 'counter_001', {
      label: titleCase(analysis.subject) || 'Count',
      initialValue: 0,
      step: 1,
      showControls: true,
    }, 12, 120);
  }

  // ── Signup Sheet / Checklist ──────────────────────────────────
  const wantsChecklist = /\b(checklist|to\s*-?\s*do|task\s*list|sign\s*-?\s*up\s*sheet|slot)\b/.test(lowerPrompt);
  if (wantsChecklist) {
    const items = analysis.items.length > 0
      ? analysis.items
      : ['Task 1', 'Task 2', 'Task 3'];
    addElement('checklist-tracker', 'checklist_001', {
      title: titleCase(analysis.subject) || 'Tasks',
      items: items.map(item => ({ text: item, completed: false })),
    });
  }

  // ── Signup Sheet ──────────────────────────────────────────────
  const wantsSignupSheet = /\b(signup\s*sheet|volunteer|bring\s*list|potluck|assign)\b/.test(lowerPrompt);
  if (wantsSignupSheet && !wantsRsvp) {
    const items = analysis.items.length > 0
      ? analysis.items
      : ['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4'];
    addElement('signup-sheet', 'signup_sheet_001', {
      title: analysis.eventName || titleCase(analysis.subject) || 'Sign-Up Sheet',
      slots: items.map(item => ({ label: item, maxSignups: 1 })),
    });
  }

  // ── Form / Feedback ───────────────────────────────────────────
  const wantsForm = /\b(form|feedback|submission|input|collect|gather|questionnaire)\b/.test(lowerPrompt);
  if (wantsForm && !wantsPoll) {
    const fields = analysis.fields.length > 0
      ? analysis.fields
      : [
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'response', label: lowerPrompt.includes('feedback') ? 'Your Feedback' : 'Response', type: 'textarea' },
        ];
    addElement('form-builder', 'form_001', {
      fields: fields.map(f => ({ ...f, required: true })),
      submitButtonText: lowerPrompt.includes('feedback') ? 'Send Feedback' : 'Submit',
    });
  }

  // ── Progress Bar ──────────────────────────────────────────────
  const wantsProgress = /\b(progress|goal|fundrais|target|milestone)\b/.test(lowerPrompt);
  if (wantsProgress) {
    const target = extractNumber(lowerPrompt, /(?:goal|target|raise)\s*(?:of|:)?\s*\$?(\d+)/i) || 100;
    addElement('progress-indicator', 'progress_001', {
      title: titleCase(analysis.subject) || 'Progress',
      current: 0,
      target,
      unit: lowerPrompt.includes('$') || lowerPrompt.includes('fundrais') ? '$' : '',
    }, 12, 100);
  }

  // ── Chart (standalone or paired) ──────────────────────────────
  const wantsChart = /\b(chart|graph|visual|results?\s*display|analytics)\b/.test(lowerPrompt);
  if (wantsChart) {
    addElement('chart-display', 'chart_001', {
      chartType: lowerPrompt.includes('pie') ? 'pie' : lowerPrompt.includes('line') ? 'line' : 'bar',
      title: 'Results',
      showLegend: true,
    }, 12, 240);

    // Connect poll → chart if both exist
    const hasPoll = elements.find(e => e.type === 'poll-element');
    if (hasPoll) {
      connections.push({
        from: { instanceId: hasPoll.instanceId, port: 'results' },
        to: { instanceId: 'chart_001', port: 'data' },
      });
    }
  }

  // ── Custom Block (games, interactive widgets) ─────────────────
  const wantsCustom = /\b(bingo|flip|game|drag|animation|widget|interactive|spinner|wheel|trivia|flashcard|matching|quiz game)\b/.test(lowerPrompt);
  if (wantsCustom && elements.length === 0) {
    const title = generateToolName(prompt, analysis);
    addElement('custom-block', 'custom_001', {
      blockId: `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      version: 1,
      metadata: {
        name: title,
        description: `Interactive widget: ${analysis.subject}`,
        createdBy: 'ai' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      code: {
        html: `<div id="app" style="font-family: var(--hive-font-sans, system-ui, sans-serif); padding: 24px; text-align: center;">
  <h2 style="margin: 0 0 16px; color: var(--hive-color-text, #fff);">${title}</h2>
  <p style="color: var(--hive-color-text-secondary, #a0a0a0); margin-bottom: 24px;">Interactive widget</p>
  <div id="content" style="background: var(--hive-color-surface, #1a1a2e); border-radius: 12px; padding: 32px; border: 1px solid var(--hive-color-border, #2a2a3e);"></div>
</div>`,
        css: `#app { max-width: 480px; margin: 0 auto; }
#content { transition: all 0.2s ease; }
#content:hover { border-color: var(--hive-color-primary, #6366f1); }
button { background: var(--hive-color-primary, #6366f1); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: opacity 0.15s; }
button:hover { opacity: 0.9; }`,
        js: `const hive = window.HiveSDK?.init?.() || { setState: () => {}, getState: () => ({}), emit: () => {} };
const content = document.getElementById('content');
content.innerHTML = '<p style="color: var(--hive-color-text-secondary, #a0a0a0);">Ready to interact</p><button onclick="hive.emit(\\'click\\')">Get Started</button>';`,
        hash: `blk_${Math.abs(Date.now()).toString(36)}`,
      },
      manifest: { actions: [], inputs: [], outputs: [] },
    }, 12, 350);
  }

  // ── Smart Composition: RSVP + Countdown ───────────────────────
  if (wantsRsvp && !wantsCountdown && analysis.targetDate) {
    addElement('countdown-timer', 'countdown_001', {
      targetDate: analysis.targetDate.toISOString(),
      title: analysis.eventName || 'Event Starts',
      showDays: true,
      showHours: true,
      showMinutes: true,
    }, 12, 140);
  }

  // ── Smart Composition: Poll + Chart (auto-add chart for polls) ─
  if (wantsPoll && !wantsChart && elements.length < 3) {
    addElement('chart-display', 'chart_001', {
      chartType: 'bar',
      title: 'Live Results',
      showLegend: true,
    }, 12, 240);
    connections.push({
      from: { instanceId: 'poll_001', port: 'results' },
      to: { instanceId: 'chart_001', port: 'data' },
    });
  }

  // ── Default: intelligent single-element fallback ──────────────
  if (elements.length === 0) {
    // Try to infer the best element from the prompt
    if (/\b(event|meet|gather|party|meeting)\b/.test(lowerPrompt)) {
      addElement('rsvp-button', 'rsvp_001', {
        eventName: analysis.eventName || titleCase(analysis.subject) || 'Event',
        showAttendeeCount: true,
        enableWaitlist: false,
      }, 12, 120);
    } else if (/\b(question|ask|opinion|think)\b/.test(lowerPrompt)) {
      addElement('poll-element', 'poll_001', {
        question: analysis.question || `${titleCase(analysis.subject)}?`,
        options: analysis.options.length >= 2 ? analysis.options : ['Yes', 'No', 'Maybe'],
        showResults: true,
      });
    } else {
      // True fallback — use the subject to make a meaningful poll
      const q = analysis.subject
        ? `What do you think about ${analysis.subject}?`
        : prompt.length < 60
          ? `${prompt}?`
          : 'What do you think?';
      addElement('poll-element', 'poll_001', {
        question: q,
        options: analysis.options.length >= 2 ? analysis.options : ['Great idea', 'Needs work', 'Not sure'],
        showResults: true,
      });
    }
  }

  const name = generateToolName(prompt, analysis);
  const description = generateDescription(elements, analysis);

  return {
    elements,
    connections,
    name,
    description,
    layout: 'grid',
  };
}

function extractNumber(text: string, pattern: RegExp): number | undefined {
  const match = text.match(pattern);
  return match ? parseInt(match[1]) : undefined;
}

function generateToolName(prompt: string, analysis: PromptAnalysis): string {
  // Use event name if we have one
  if (analysis.eventName) return analysis.eventName;

  // Use subject if meaningful
  if (analysis.subject && analysis.subject.length > 2 && analysis.subject.length < 40) {
    return titleCase(analysis.subject);
  }

  // Fall back to first 4 words
  const words = prompt.split(/\s+/).slice(0, 4);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function generateDescription(
  elements: ToolComposition['elements'],
  analysis: PromptAnalysis,
): string {
  const types = elements.map(e => e.type);
  const parts: string[] = [];

  if (types.includes('poll-element')) parts.push('poll');
  if (types.includes('rsvp-button')) parts.push('RSVP');
  if (types.includes('countdown-timer')) parts.push('countdown');
  if (types.includes('leaderboard')) parts.push('leaderboard');
  if (types.includes('counter-element')) parts.push('counter');
  if (types.includes('form-builder')) parts.push('form');
  if (types.includes('checklist-tracker')) parts.push('checklist');
  if (types.includes('signup-sheet')) parts.push('sign-up sheet');
  if (types.includes('chart-display')) parts.push('results chart');
  if (types.includes('progress-indicator')) parts.push('progress tracker');
  if (types.includes('custom-block')) parts.push('interactive widget');

  if (parts.length === 0) return `Tool for: ${analysis.subject}`;
  const subject = analysis.eventName || analysis.subject;
  return subject
    ? `${titleCase(parts.join(' + '))} for ${subject}`
    : titleCase(parts.join(' + '));
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

        case 'groq': {
          // Use full system prompt for 70b model, compact for 8b
          const is70b = config.groqModel.includes('70b');
          const groqSystemPrompt = is70b
            ? systemPrompt  // Full prompt for 70b - better understanding
            : buildCompactSystemPrompt();  // Compact for smaller models
          rawOutput = await callGroq(config, request.prompt, groqSystemPrompt);
          composition = parseModelOutput(rawOutput);
          break;
        }

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
    } catch {
      // Continue to next backend
    }
  }

  // Ultimate fallback
  return generateWithRules(request.prompt);
}

export async function* generateToolStream(
  request: GenerateRequest
): AsyncGenerator<StreamMessage> {
  // Yield thinking message
  yield { type: 'thinking', data: { message: 'Analyzing your request...' } };

  try {
    const composition = await generateTool(request);

    // Yield elements one by one
    for (const element of composition.elements) {
      yield { type: 'element', data: { ...element, config: { ...(element.config || {}), aiGenerated: true } } };
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
