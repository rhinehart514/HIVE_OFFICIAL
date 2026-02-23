/**
 * HiveLab Generation Eval Harness
 *
 * Scores tool generation output on 5 dimensions:
 *   1. Intent  — did we pick the right element(s)?
 *   2. Schema  — is the config valid per Zod + manifest?
 *   3. Depth   — are depth assignments correct?
 *   4. Connections — are required connections declared?
 *   5. Functional  — will it actually render?
 *
 * Usage:
 *   npx tsx scripts/eval/run-generation-eval.ts
 *   npx tsx scripts/eval/run-generation-eval.ts --level 1
 *   npx tsx scripts/eval/run-generation-eval.ts --case "simple poll"
 *   npx tsx scripts/eval/run-generation-eval.ts --verbose
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Types ──────────────────────────────────────────────────────

type ConnectionLevel = 'standalone' | 'space' | 'campus' | 'event+space';

interface BenchmarkCase {
  id: string;
  level: 1 | 2 | 3 | 4;
  prompt: string;
  expectedElements: ExpectedElement[];
  expectedDepth: ConnectionLevel;
  expectsConnections: boolean;
  tags: string[];
  description: string;
}

interface ExpectedElement {
  elementId: string;
  requiredConfigKeys?: string[];
  depth: ConnectionLevel;
}

interface GeneratedElement {
  type: string;
  instanceId: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface GeneratedConnection {
  from: { instanceId: string; port: string };
  to: { instanceId: string; port: string };
}

interface ToolComposition {
  elements: GeneratedElement[];
  connections: GeneratedConnection[];
  name: string;
  description: string;
  layout: string;
}

interface DimensionScore {
  score: number; // 0-1
  details: string;
}

interface CaseResult {
  caseId: string;
  level: number;
  prompt: string;
  passed: boolean;
  scores: {
    intent: DimensionScore;
    schema: DimensionScore;
    depth: DimensionScore;
    connections: DimensionScore;
    functional: DimensionScore;
  };
  composite: number; // weighted average
  generatedElements: string[];
  expectedElements: string[];
  durationMs: number;
}

interface EvalSummary {
  totalCases: number;
  passed: number;
  failed: number;
  byLevel: Record<number, { total: number; passed: number; rate: number }>;
  byDimension: Record<string, { avg: number; min: number; max: number }>;
  overallScore: number;
  durationMs: number;
}

// ── Registry + Validation Imports (lazy) ────────────────────────

let registryModule: typeof import('../../packages/core/src/domain/hivelab/elements/registry');
let validationModule: typeof import('../../packages/ui/src/lib/hivelab/element-config-validation');

async function loadModules() {
  try {
    registryModule = await import('../../packages/core/src/domain/hivelab/elements/registry');
  } catch {
    console.error('Failed to load element registry. Using inline fallback.');
    registryModule = createFallbackRegistry();
  }

  try {
    validationModule = await import('../../packages/ui/src/lib/hivelab/element-config-validation');
  } catch {
    console.error('Failed to load element-config-validation. Schema scoring will use registry only.');
    validationModule = createFallbackValidation();
  }
}

// ── Generator Import (lazy) ────────────────────────────────────

type GenerateWithRulesFn = (prompt: string) => ToolComposition;

let generateWithRules: GenerateWithRulesFn;

async function loadGenerator() {
  // The goose-server is a Next.js server file. We can't import it directly
  // in a script context because it has server-only deps. Instead we inline
  // a stripped version of generateWithRules by importing the module and
  // catching failures gracefully.
  try {
    const mod = await import('../../apps/web/src/lib/goose-server');
    // generateTool returns a Promise<ToolComposition>. Wrap it.
    generateWithRules = (prompt: string) => {
      // We need the sync rules path. The module exports generateTool which
      // tries groq first then rules. Since we're testing the rules engine,
      // force rules by not setting GOOSE_BACKEND.
      delete process.env.GOOSE_BACKEND;
      delete process.env.GROQ_API_KEY;
      // generateTool is async but rules path resolves immediately
      return null as unknown as ToolComposition; // replaced below
    };
    // Actually use the async version
    const asyncGen = async (prompt: string): Promise<ToolComposition> => {
      delete process.env.GOOSE_BACKEND;
      delete process.env.GROQ_API_KEY;
      return mod.generateTool({ prompt });
    };
    generateWithRules = asyncGen as unknown as GenerateWithRulesFn;
  } catch {
    console.error('Failed to import goose-server. Using HTTP fallback.');
    generateWithRules = null as unknown as GenerateWithRulesFn;
  }
}

// ── Fallback modules for when imports fail ─────────────────────

const DEPTH_RANK: Record<ConnectionLevel, number> = {
  standalone: 0,
  space: 1,
  campus: 2,
  'event+space': 3,
};

function createFallbackRegistry() {
  // Load registry data from inline known elements
  const KNOWN_ELEMENTS = new Map<string, { minDepth: ConnectionLevel; requiredConfig: string[]; hasConnections: boolean; canBeStandalone: boolean }>([
    ['poll-element', { minDepth: 'standalone', requiredConfig: ['question', 'options'], hasConnections: false, canBeStandalone: true }],
    ['counter', { minDepth: 'standalone', requiredConfig: [], hasConnections: false, canBeStandalone: true }],
    ['timer', { minDepth: 'standalone', requiredConfig: [], hasConnections: false, canBeStandalone: true }],
    ['signup-sheet', { minDepth: 'standalone', requiredConfig: ['slots'], hasConnections: false, canBeStandalone: true }],
    ['checklist-tracker', { minDepth: 'standalone', requiredConfig: ['items'], hasConnections: false, canBeStandalone: true }],
    ['countdown-timer', { minDepth: 'standalone', requiredConfig: ['seconds'], hasConnections: false, canBeStandalone: true }],
    ['leaderboard', { minDepth: 'standalone', requiredConfig: [], hasConnections: false, canBeStandalone: true }],
    ['progress-indicator', { minDepth: 'standalone', requiredConfig: [], hasConnections: false, canBeStandalone: true }],
    ['chart-display', { minDepth: 'standalone', requiredConfig: ['chartType'], hasConnections: false, canBeStandalone: true }],
    ['form-builder', { minDepth: 'standalone', requiredConfig: ['fields'], hasConnections: false, canBeStandalone: true }],
    ['rsvp-button', { minDepth: 'standalone', requiredConfig: ['eventName'], hasConnections: true, canBeStandalone: true }],
    ['member-list', { minDepth: 'space', requiredConfig: [], hasConnections: true, canBeStandalone: false }],
    ['announcement', { minDepth: 'space', requiredConfig: [], hasConnections: true, canBeStandalone: false }],
    ['custom-block', { minDepth: 'standalone', requiredConfig: ['html'], hasConnections: false, canBeStandalone: true }],
  ]);

  return {
    getAllSpecs: () => [],
    getElementSpec: (id: string) => {
      const canonical = id === 'counter-element' ? 'counter' : id;
      const data = KNOWN_ELEMENTS.get(canonical);
      if (!data) return undefined;
      const config: Record<string, { type: string; description: string; required: boolean }> = {};
      for (const k of data.requiredConfig) {
        config[k] = { type: 'string', description: k, required: true };
      }
      return {
        elementId: canonical,
        name: canonical,
        category: 'action' as const,
        dataSource: 'none' as const,
        config,
        connection: {
          minDepth: data.minDepth,
          levels: [{ depth: data.minDepth, provides: '', requiredContext: [] }],
        },
        permissions: { create: 'anyone' as const, interact: 'anyone' as const },
        executeActions: [],
        state: { shared: [], personal: [] },
      };
    },
    validateRequiredConfig: (id: string, config: Record<string, unknown>) => {
      const canonical = id === 'counter-element' ? 'counter' : id;
      const data = KNOWN_ELEMENTS.get(canonical);
      if (!data) return { valid: false, missingFields: ['UNKNOWN_ELEMENT'] };
      const missing = data.requiredConfig.filter(k => config[k] === undefined || config[k] === null || config[k] === '');
      return { valid: missing.length === 0, missingFields: missing };
    },
    getConnectionRequirements: (id: string) => {
      const canonical = id === 'counter-element' ? 'counter' : id;
      const data = KNOWN_ELEMENTS.get(canonical);
      if (!data || !data.hasConnections) return null;
      return { minDepth: data.minDepth, levels: [] };
    },
    getSpecsByMinDepth: () => [],
    getStandaloneSpecs: () => [],
    canBeStandalone: (id: string) => KNOWN_ELEMENTS.get(id)?.canBeStandalone ?? false,
    getGeneratableElementIds: () => [...KNOWN_ELEMENTS.keys()],
    getMaxDepth: () => undefined,
  } as unknown as typeof registryModule;
}

function createFallbackValidation() {
  return {
    validateAndCoerceConfig: (_elementId: string, config: unknown) => {
      return (config && typeof config === 'object' && !Array.isArray(config))
        ? config as Record<string, unknown>
        : {};
    },
  } as unknown as typeof validationModule;
}

// ── Scoring Functions ──────────────────────────────────────────

function scoreIntent(generated: ToolComposition, expected: ExpectedElement[]): DimensionScore {
  if (expected.length === 0) {
    return { score: generated.elements.length > 0 ? 1 : 0, details: 'No expected elements specified' };
  }

  // Count-aware matching: if expected has 2x poll-element, generated needs 2x
  const expectedCounts = new Map<string, number>();
  for (const e of expected) {
    const id = normalizeElementId(e.elementId);
    expectedCounts.set(id, (expectedCounts.get(id) || 0) + 1);
  }

  const generatedCounts = new Map<string, number>();
  for (const e of generated.elements) {
    const id = normalizeElementId(e.type);
    generatedCounts.set(id, (generatedCounts.get(id) || 0) + 1);
  }

  let matched = 0;
  let totalExpected = 0;
  const missing: string[] = [];

  for (const [id, count] of expectedCounts) {
    const genCount = generatedCounts.get(id) || 0;
    const m = Math.min(count, genCount);
    matched += m;
    totalExpected += count;
    if (genCount < count) {
      missing.push(genCount === 0 ? id : `${id} (${genCount}/${count})`);
    }
  }

  const extra: string[] = [];
  for (const [id, count] of generatedCounts) {
    const expCount = expectedCounts.get(id) || 0;
    if (count > expCount) {
      extra.push(id);
    }
  }

  // Recall: did we get all expected elements?
  const recall = matched / totalExpected;
  // Precision: are extras minimal?
  const totalGenerated = generated.elements.length;
  const precision = totalGenerated > 0 ? matched / totalGenerated : 0;

  // If recall is 0, score is 0 — we didn't get ANY expected element
  if (recall === 0) {
    return { score: 0, details: `wrong element: got [${[...generatedCounts.keys()].join(', ')}], expected [${[...expectedCounts.keys()].join(', ')}]` };
  }

  // Weighted: recall matters more, but extras are a real penalty
  const score = recall * 0.7 + precision * 0.3;

  const parts: string[] = [];
  if (missing.length) parts.push(`missing: ${missing.join(', ')}`);
  if (extra.length) parts.push(`extra: ${extra.join(', ')}`);
  if (parts.length === 0) parts.push('exact match');

  return { score: Math.round(score * 100) / 100, details: parts.join('; ') };
}

function scoreSchema(generated: ToolComposition, expected: ExpectedElement[]): DimensionScore {
  if (generated.elements.length === 0) {
    return { score: 0, details: 'No elements generated' };
  }

  let totalScore = 0;
  const issues: string[] = [];

  for (const el of generated.elements) {
    const elementId = normalizeElementId(el.type);
    const spec = registryModule.getElementSpec(elementId);

    if (!spec) {
      issues.push(`${elementId}: unknown element`);
      continue;
    }

    // Check required config from registry
    const validation = registryModule.validateRequiredConfig(elementId, el.config || {});
    if (!validation.valid) {
      issues.push(`${elementId}: missing ${validation.missingFields.join(', ')}`);
      // Partial credit — some required fields present
      const totalRequired = Object.entries(spec.config).filter(([, f]) => f.required).length;
      const present = totalRequired - validation.missingFields.length;
      totalScore += totalRequired > 0 ? present / totalRequired : 1;
      continue;
    }

    // Try Zod validation too
    try {
      const coerced = validationModule.validateAndCoerceConfig(elementId, el.config);
      // If we get back a non-empty object, it's valid enough
      if (coerced && Object.keys(coerced).length > 0) {
        totalScore += 1;
      } else {
        totalScore += 0.5;
        issues.push(`${elementId}: Zod returned empty config`);
      }
    } catch {
      totalScore += 0.8; // registry passed, Zod unavailable
    }
  }

  const score = totalScore / generated.elements.length;
  return {
    score: Math.round(score * 100) / 100,
    details: issues.length ? issues.join('; ') : 'all configs valid',
  };
}

function scoreDepth(generated: ToolComposition, expectedDepth: ConnectionLevel): DimensionScore {
  if (generated.elements.length === 0) {
    return { score: 0, details: 'No elements generated' };
  }

  let correct = 0;
  const wrong: string[] = [];

  for (const el of generated.elements) {
    const elementId = normalizeElementId(el.type);
    const spec = registryModule.getElementSpec(elementId);

    if (!spec) {
      wrong.push(`${elementId}: unknown`);
      continue;
    }

    // Check if element's minDepth can operate at the expected depth
    // An element with minDepth=standalone can work at any depth.
    // An element with minDepth=space can work at space or deeper, but not standalone.
    const expectedRank = DEPTH_RANK[expectedDepth] ?? 0;
    const actualMinRank = DEPTH_RANK[spec.connection.minDepth] ?? 0;

    if (actualMinRank <= expectedRank) {
      correct++;
    } else {
      wrong.push(`${elementId} needs ${spec.connection.minDepth}, context only provides ${expectedDepth}`);
    }
  }

  const score = correct / generated.elements.length;
  return {
    score: Math.round(score * 100) / 100,
    details: wrong.length ? wrong.join('; ') : 'all depths correct',
  };
}

function scoreConnections(generated: ToolComposition, expectsConnections: boolean): DimensionScore {
  // Check if generated elements that require connections have them
  const elementsNeedingConnections: string[] = [];

  for (const el of generated.elements) {
    const elementId = normalizeElementId(el.type);
    const reqs = registryModule.getConnectionRequirements(elementId);
    if (reqs) {
      elementsNeedingConnections.push(elementId);
    }
  }

  if (elementsNeedingConnections.length === 0 && !expectsConnections) {
    return { score: 1, details: 'no connections needed or expected' };
  }

  if (elementsNeedingConnections.length === 0 && expectsConnections) {
    return { score: 0.5, details: 'connections expected but no elements require them' };
  }

  // Check if connections exist between elements
  const hasConnections = generated.connections.length > 0;

  if (expectsConnections && hasConnections) {
    // Verify connection references valid instance IDs
    const instanceIds = new Set(generated.elements.map(e => e.instanceId));
    const validConnections = generated.connections.filter(
      c => instanceIds.has(c.from.instanceId) && instanceIds.has(c.to.instanceId)
    );
    const score = validConnections.length / generated.connections.length;
    return {
      score: Math.round(score * 100) / 100,
      details: `${validConnections.length}/${generated.connections.length} connections valid`,
    };
  }

  if (expectsConnections && !hasConnections) {
    return { score: 0.3, details: 'connections expected but none generated' };
  }

  // Connections exist but not expected — not penalized much
  return { score: 0.9, details: 'extra connections (not harmful)' };
}

function scoreFunctional(generated: ToolComposition): DimensionScore {
  if (generated.elements.length === 0) {
    return { score: 0, details: 'No elements generated' };
  }

  let renderable = 0;
  const issues: string[] = [];

  for (const el of generated.elements) {
    const elementId = normalizeElementId(el.type);
    const spec = registryModule.getElementSpec(elementId);

    if (!spec) {
      issues.push(`${elementId}: not in registry`);
      continue;
    }

    // Check it has some config (even if defaults)
    const hasConfig = el.config && typeof el.config === 'object' && Object.keys(el.config).length > 0;

    // Check position and size are reasonable
    const hasPosition = el.position && typeof el.position.x === 'number' && typeof el.position.y === 'number';
    const hasSize = el.size && el.size.width > 0 && el.size.height > 0;

    if (hasConfig && hasPosition && hasSize) {
      renderable++;
    } else {
      const missing: string[] = [];
      if (!hasConfig) missing.push('no config');
      if (!hasPosition) missing.push('no position');
      if (!hasSize) missing.push('no size');
      issues.push(`${elementId}: ${missing.join(', ')}`);
      // Partial credit
      if (hasConfig) renderable += 0.5;
    }
  }

  // Also check: has a name?
  const hasName = !!generated.name && generated.name.length > 0;
  const nameBonus = hasName ? 0.05 : 0;

  const score = Math.min(1, (renderable / generated.elements.length) + nameBonus);
  return {
    score: Math.round(score * 100) / 100,
    details: issues.length ? issues.join('; ') : 'all elements renderable',
  };
}

// ── Helpers ────────────────────────────────────────────────────

function normalizeElementId(id: string): string {
  // counter-element → counter, strip numeric suffixes
  const stripped = id.replace(/-\d+$/, '');
  if (stripped === 'counter-element') return 'counter';
  return stripped;
}

// ── Runner ─────────────────────────────────────────────────────

const DIMENSION_WEIGHTS = {
  intent: 0.35,
  schema: 0.25,
  depth: 0.15,
  connections: 0.10,
  functional: 0.15,
};

const PASS_THRESHOLD = 0.7;

// Intent is a gate: if you picked the wrong element, nothing else matters
const INTENT_GATE = 0.5;

async function runCase(testCase: BenchmarkCase): Promise<CaseResult> {
  const start = Date.now();

  let composition: ToolComposition;
  try {
    composition = await (generateWithRules as unknown as (p: string) => Promise<ToolComposition>)(testCase.prompt);
  } catch (err) {
    return {
      caseId: testCase.id,
      level: testCase.level,
      prompt: testCase.prompt,
      passed: false,
      scores: {
        intent: { score: 0, details: `Generation failed: ${err}` },
        schema: { score: 0, details: 'skipped' },
        depth: { score: 0, details: 'skipped' },
        connections: { score: 0, details: 'skipped' },
        functional: { score: 0, details: 'skipped' },
      },
      composite: 0,
      generatedElements: [],
      expectedElements: testCase.expectedElements.map(e => e.elementId),
      durationMs: Date.now() - start,
    };
  }

  const intent = scoreIntent(composition, testCase.expectedElements);
  const schema = scoreSchema(composition, testCase.expectedElements);
  const depth = scoreDepth(composition, testCase.expectedDepth);
  const connections = scoreConnections(composition, testCase.expectsConnections);
  const functional = scoreFunctional(composition);

  const composite =
    intent.score * DIMENSION_WEIGHTS.intent +
    schema.score * DIMENSION_WEIGHTS.schema +
    depth.score * DIMENSION_WEIGHTS.depth +
    connections.score * DIMENSION_WEIGHTS.connections +
    functional.score * DIMENSION_WEIGHTS.functional;

  // Intent gate: wrong element type = automatic fail regardless of composite
  const passesIntentGate = intent.score >= INTENT_GATE;
  const passed = passesIntentGate && composite >= PASS_THRESHOLD;

  return {
    caseId: testCase.id,
    level: testCase.level,
    prompt: testCase.prompt,
    passed,
    scores: { intent, schema, depth, connections, functional },
    composite: Math.round(composite * 100) / 100,
    generatedElements: composition.elements.map(e => e.type),
    expectedElements: testCase.expectedElements.map(e => e.elementId),
    durationMs: Date.now() - start,
  };
}

function summarize(results: CaseResult[]): EvalSummary {
  const byLevel: Record<number, { total: number; passed: number; rate: number }> = {};
  const dimensionScores: Record<string, number[]> = {
    intent: [], schema: [], depth: [], connections: [], functional: [],
  };

  for (const r of results) {
    if (!byLevel[r.level]) byLevel[r.level] = { total: 0, passed: 0, rate: 0 };
    byLevel[r.level].total++;
    if (r.passed) byLevel[r.level].passed++;

    for (const [dim, score] of Object.entries(r.scores)) {
      dimensionScores[dim].push(score.score);
    }
  }

  for (const level of Object.values(byLevel)) {
    level.rate = Math.round((level.passed / level.total) * 100);
  }

  const byDimension: Record<string, { avg: number; min: number; max: number }> = {};
  for (const [dim, scores] of Object.entries(dimensionScores)) {
    byDimension[dim] = {
      avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
      min: Math.round(Math.min(...scores) * 100) / 100,
      max: Math.round(Math.max(...scores) * 100) / 100,
    };
  }

  return {
    totalCases: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    byLevel,
    byDimension,
    overallScore: Math.round((results.reduce((a, r) => a + r.composite, 0) / results.length) * 100) / 100,
    durationMs: results.reduce((a, r) => a + r.durationMs, 0),
  };
}

// ── Output Formatting ──────────────────────────────────────────

function printResult(r: CaseResult, verbose: boolean) {
  const status = r.passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  const score = r.composite.toFixed(2);
  console.log(`  ${status} [${score}] ${r.caseId}`);

  if (verbose || !r.passed) {
    console.log(`    Prompt: "${r.prompt.substring(0, 80)}${r.prompt.length > 80 ? '...' : ''}"`);
    console.log(`    Generated: [${r.generatedElements.join(', ')}]`);
    console.log(`    Expected:  [${r.expectedElements.join(', ')}]`);
    for (const [dim, score] of Object.entries(r.scores)) {
      const bar = scoreBar(score.score);
      console.log(`    ${dim.padEnd(12)} ${bar} ${score.score.toFixed(2)}  ${score.details}`);
    }
    console.log(`    Duration: ${r.durationMs}ms`);
    console.log('');
  }
}

function scoreBar(score: number): string {
  const filled = Math.round(score * 10);
  return '\x1b[32m' + '█'.repeat(filled) + '\x1b[90m' + '░'.repeat(10 - filled) + '\x1b[0m';
}

function printSummary(summary: EvalSummary) {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  HIVELAB GENERATION EVAL — RESULTS');
  console.log('══════════════════════════════════════════════════════\n');

  console.log(`  Overall Score: ${(summary.overallScore * 100).toFixed(0)}%`);
  console.log(`  Pass Rate:     ${summary.passed}/${summary.totalCases} (${Math.round(summary.passed / summary.totalCases * 100)}%)`);
  console.log(`  Duration:      ${summary.durationMs}ms\n`);

  console.log('  By Level:');
  for (const [level, data] of Object.entries(summary.byLevel).sort()) {
    const bar = scoreBar(data.rate / 100);
    console.log(`    L${level}  ${bar} ${data.passed}/${data.total} (${data.rate}%)`);
  }

  console.log('\n  By Dimension:');
  for (const [dim, data] of Object.entries(summary.byDimension)) {
    const bar = scoreBar(data.avg);
    console.log(`    ${dim.padEnd(12)} ${bar} avg=${data.avg.toFixed(2)} min=${data.min.toFixed(2)} max=${data.max.toFixed(2)}`);
  }

  console.log('\n══════════════════════════════════════════════════════\n');
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const levelFilter = args.includes('--level') ? parseInt(args[args.indexOf('--level') + 1]) : null;
  const caseFilter = args.includes('--case') ? args[args.indexOf('--case') + 1] : null;

  console.log('\n  Loading modules...');
  await loadModules();
  await loadGenerator();

  if (!generateWithRules) {
    console.error('\n  ERROR: Could not load generator. Make sure you run from the repo root.');
    console.error('  Try: npx tsx scripts/eval/run-generation-eval.ts\n');
    process.exit(1);
  }

  // Load benchmark suite
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const suitePath = resolve(__dirname, 'benchmark-suite.json');
  let suite: BenchmarkCase[];

  try {
    suite = JSON.parse(readFileSync(suitePath, 'utf-8'));
  } catch {
    console.error(`\n  ERROR: Could not load benchmark suite at ${suitePath}`);
    process.exit(1);
  }

  // Apply filters
  if (levelFilter) {
    suite = suite.filter(c => c.level === levelFilter);
  }
  if (caseFilter) {
    const lower = caseFilter.toLowerCase();
    suite = suite.filter(c =>
      c.id.toLowerCase().includes(lower) ||
      c.prompt.toLowerCase().includes(lower) ||
      c.tags.some(t => t.toLowerCase().includes(lower))
    );
  }

  console.log(`  Running ${suite.length} test cases...\n`);

  // Run all cases
  const results: CaseResult[] = [];
  for (const testCase of suite) {
    const result = await runCase(testCase);
    results.push(result);
    printResult(result, verbose);
  }

  // Print summary
  const summary = summarize(results);
  printSummary(summary);

  // Exit with error code if below targets
  const levelTargets: Record<number, number> = { 1: 100, 2: 80, 3: 70, 4: 60 };
  let hasFailures = false;
  for (const [level, target] of Object.entries(levelTargets)) {
    const data = summary.byLevel[parseInt(level)];
    if (data && data.rate < target) {
      console.log(`  \x1b[31mLevel ${level} below target: ${data.rate}% < ${target}%\x1b[0m`);
      hasFailures = true;
    }
  }

  if (hasFailures) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Eval harness crashed:', err);
  process.exit(1);
});
