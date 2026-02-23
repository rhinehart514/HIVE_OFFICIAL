/**
 * HiveLab Generation Eval Harness
 *
 * Scores tool generation output on 5 dimensions:
 *   1. Intent  — did we pick the right element(s)?
 *   2. Schema  — is the config valid per Zod + manifest?
 *   3. Tier    — are tier assignments correct?
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

interface BenchmarkCase {
  id: string;
  level: 1 | 2 | 3 | 4;
  prompt: string;
  expectedElements: ExpectedElement[];
  expectedTier: 'T1' | 'T2' | 'T3';
  expectsConnections: boolean;
  tags: string[];
  description: string;
}

interface ExpectedElement {
  elementId: string;
  requiredConfigKeys?: string[];
  tier: 'T1' | 'T2' | 'T3';
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
    tier: DimensionScore;
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

// ── Manifest + Validation Imports (lazy) ───────────────────────

let manifestModule: typeof import('../../packages/core/src/domain/hivelab/element-manifest');
let validationModule: typeof import('../../packages/ui/src/lib/hivelab/element-config-validation');

async function loadModules() {
  try {
    manifestModule = await import('../../packages/core/src/domain/hivelab/element-manifest');
  } catch {
    console.error('Failed to load element-manifest. Using inline fallback.');
    manifestModule = createFallbackManifest();
  }

  try {
    validationModule = await import('../../packages/ui/src/lib/hivelab/element-config-validation');
  } catch {
    console.error('Failed to load element-config-validation. Schema scoring will use manifest only.');
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

function createFallbackManifest() {
  // Load manifest data from the TS file as plain text and extract what we need
  const KNOWN_ELEMENTS = new Map<string, { tier: string; requiredConfig: string[]; connectionType: string | null; canBeStandalone: boolean }>([
    ['poll-element', { tier: 'T1', requiredConfig: ['question', 'options'], connectionType: null, canBeStandalone: true }],
    ['counter', { tier: 'T1', requiredConfig: [], connectionType: null, canBeStandalone: true }],
    ['timer', { tier: 'T1', requiredConfig: [], connectionType: null, canBeStandalone: true }],
    ['signup-sheet', { tier: 'T1', requiredConfig: ['slots'], connectionType: null, canBeStandalone: true }],
    ['checklist-tracker', { tier: 'T1', requiredConfig: ['items'], connectionType: null, canBeStandalone: true }],
    ['countdown-timer', { tier: 'T1', requiredConfig: ['seconds'], connectionType: null, canBeStandalone: true }],
    ['leaderboard', { tier: 'T1', requiredConfig: [], connectionType: null, canBeStandalone: true }],
    ['progress-indicator', { tier: 'T1', requiredConfig: [], connectionType: null, canBeStandalone: true }],
    ['chart-display', { tier: 'T1', requiredConfig: ['chartType'], connectionType: null, canBeStandalone: true }],
    ['form-builder', { tier: 'T1', requiredConfig: ['fields'], connectionType: null, canBeStandalone: true }],
    ['rsvp-button', { tier: 'T2', requiredConfig: ['eventName'], connectionType: 'event+space', canBeStandalone: true }],
    ['member-list', { tier: 'T3', requiredConfig: [], connectionType: 'space', canBeStandalone: false }],
    ['announcement', { tier: 'T3', requiredConfig: [], connectionType: 'space', canBeStandalone: false }],
    ['custom-block', { tier: 'T3', requiredConfig: ['html'], connectionType: null, canBeStandalone: true }],
  ]);

  return {
    ELEMENT_MANIFEST: [] as never[],
    getElementManifest: (id: string) => {
      const canonical = id === 'counter-element' ? 'counter' : id;
      const data = KNOWN_ELEMENTS.get(canonical);
      if (!data) return undefined;
      return {
        elementId: canonical,
        name: canonical,
        tier: data.tier,
        category: 'action',
        dataSource: 'none',
        requiredConfig: Object.fromEntries(data.requiredConfig.map(k => [k, { type: 'string', description: k }])),
        optionalConfig: {},
        connectionRequirements: data.connectionType ? { connectionType: data.connectionType, requiredContext: [] } : null,
        executeActions: [],
        stateShape: { shared: [], personal: [] },
        canBeStandalone: data.canBeStandalone,
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
      if (!data || !data.connectionType) return null;
      return { connectionType: data.connectionType, requiredContext: [] };
    },
    getElementsByTier: () => [],
    getStandaloneElements: () => [],
    canBeStandalone: (id: string) => KNOWN_ELEMENTS.get(id)?.canBeStandalone ?? false,
    getGeneratableElementIds: () => [...KNOWN_ELEMENTS.keys()],
  } as unknown as typeof manifestModule;
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
    const manifest = manifestModule.getElementManifest(elementId);

    if (!manifest) {
      issues.push(`${elementId}: unknown element`);
      continue;
    }

    // Check required config from manifest
    const validation = manifestModule.validateRequiredConfig(elementId, el.config || {});
    if (!validation.valid) {
      issues.push(`${elementId}: missing ${validation.missingFields.join(', ')}`);
      // Partial credit — some required fields present
      const totalRequired = Object.keys(manifest.requiredConfig).length;
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
      totalScore += 0.8; // manifest passed, Zod unavailable
    }
  }

  const score = totalScore / generated.elements.length;
  return {
    score: Math.round(score * 100) / 100,
    details: issues.length ? issues.join('; ') : 'all configs valid',
  };
}

function scoreTier(generated: ToolComposition, expectedTier: string): DimensionScore {
  if (generated.elements.length === 0) {
    return { score: 0, details: 'No elements generated' };
  }

  let correct = 0;
  const wrong: string[] = [];

  for (const el of generated.elements) {
    const elementId = normalizeElementId(el.type);
    const manifest = manifestModule.getElementManifest(elementId);

    if (!manifest) {
      wrong.push(`${elementId}: unknown`);
      continue;
    }

    // Check if element tier is compatible with expected tier
    // T1 elements are always valid. T2/T3 elements in a "T1 expected" test = wrong.
    const tierRank = { T1: 1, T2: 2, T3: 3 } as Record<string, number>;
    const expectedRank = tierRank[expectedTier] || 1;
    const actualRank = tierRank[manifest.tier] || 1;

    if (actualRank <= expectedRank) {
      correct++;
    } else {
      wrong.push(`${elementId} is ${manifest.tier}, expected ${expectedTier} or lower`);
    }
  }

  const score = correct / generated.elements.length;
  return {
    score: Math.round(score * 100) / 100,
    details: wrong.length ? wrong.join('; ') : 'all tiers correct',
  };
}

function scoreConnections(generated: ToolComposition, expectsConnections: boolean): DimensionScore {
  // Check if generated elements that require connections have them
  const elementsNeedingConnections: string[] = [];

  for (const el of generated.elements) {
    const elementId = normalizeElementId(el.type);
    const reqs = manifestModule.getConnectionRequirements(elementId);
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
    const manifest = manifestModule.getElementManifest(elementId);

    if (!manifest) {
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
  tier: 0.15,
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
        tier: { score: 0, details: 'skipped' },
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
  const tier = scoreTier(composition, testCase.expectedTier);
  const connections = scoreConnections(composition, testCase.expectsConnections);
  const functional = scoreFunctional(composition);

  const composite =
    intent.score * DIMENSION_WEIGHTS.intent +
    schema.score * DIMENSION_WEIGHTS.schema +
    tier.score * DIMENSION_WEIGHTS.tier +
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
    scores: { intent, schema, tier, connections, functional },
    composite: Math.round(composite * 100) / 100,
    generatedElements: composition.elements.map(e => e.type),
    expectedElements: testCase.expectedElements.map(e => e.elementId),
    durationMs: Date.now() - start,
  };
}

function summarize(results: CaseResult[]): EvalSummary {
  const byLevel: Record<number, { total: number; passed: number; rate: number }> = {};
  const dimensionScores: Record<string, number[]> = {
    intent: [], schema: [], tier: [], connections: [], functional: [],
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
