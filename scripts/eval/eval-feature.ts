#!/usr/bin/env npx tsx
/**
 * HIVE Feature Depth Eval
 *
 * Stress-tests features through multiple user/strategic perspectives.
 * Each perspective embodies a real person and interrogates:
 *   - What works for them?
 *   - What breaks?
 *   - What's missing?
 *   - Signal: pain, gain, or pivot insight
 *
 * Usage:
 *   npx tsx scripts/eval/eval-feature.ts docs/specs/01-identity-home-system.md
 *   npx tsx scripts/eval/eval-feature.ts docs/specs/01-identity-home-system.md --perspectives lonely-freshman,commuter-student
 *   npx tsx scripts/eval/eval-feature.ts --list
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, basename } from 'path';
import { execSync } from 'child_process';

// ── Types ──────────────────────────────────────────────────────

interface Perspective {
  id: string;
  who: string;
  need: string;
  bar: string;
  redFlags: string;
  category: 'core' | 'strategic';
}

interface FeatureEval {
  id: string;
  name: string;
  valueProp: string;
  scenario: string;
  perspectives: string[]; // perspective IDs, empty = all core
  filesToCheck: string[];
}

interface PerspectiveResult {
  perspectiveId: string;
  works: string;
  breaks: string;
  missing: string;
  signal: { type: 'pain' | 'gain' | 'pivot'; severity: 'high' | 'medium' | 'low'; insight: string };
  depthScore: number; // 0-10: does this feature have real depth for this person?
}

interface EvalResult {
  evalId: string;
  specFile: string;
  perspectiveResults: PerspectiveResult[];
  overallDepth: number; // avg of perspective depth scores
  signals: PerspectiveResult['signal'][];
  timestamp: string;
}

// ── Parse Perspectives ──────────────────────────────────────────

function parsePerspectives(projectRoot: string): Perspective[] {
  const content = readFileSync(resolve(projectRoot, 'docs/PERSPECTIVES.md'), 'utf-8');
  const perspectives: Perspective[] = [];

  const sections = content.split(/\n### /).slice(1); // skip header
  let currentCategory: 'core' | 'strategic' = 'core';

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const id = lines[0].trim();

    // Detect category switches
    if (section.includes('## Strategic Perspectives')) currentCategory = 'strategic';

    const extract = (prefix: string) => {
      const line = lines.find(l => l.startsWith(`**${prefix}:**`));
      return line?.replace(`**${prefix}:**`, '').trim() || '';
    };

    if (id && extract('Who')) {
      perspectives.push({
        id,
        who: extract('Who'),
        need: extract('What they need'),
        bar: extract('Their bar') || extract("Their lens"),
        redFlags: extract('Red flags') || extract('Useful for'),
        category: currentCategory,
      });
    }
  }

  return perspectives;
}

// ── Parse Evals from Spec ──────────────────────────────────────

function parseEvalsFromSpec(specPath: string): FeatureEval[] {
  const content = readFileSync(specPath, 'utf-8');

  const evalsMatch = content.match(/## Evals\n([\s\S]*?)(?=\n## [^#]|\n# |$)/);
  if (!evalsMatch) return [];

  const evalsSection = evalsMatch[1];
  const evalBlocks = evalsSection.split(/\n### /).filter(Boolean);
  const evals: FeatureEval[] = [];

  for (const block of evalBlocks) {
    const lines = block.trim().split('\n');
    const headerLine = lines[0].trim();

    const headerMatch = headerLine.match(/^([\w-]+):\s*(.+)$/);
    if (!headerMatch) continue;

    const [, id, name] = headerMatch;
    const eval_: FeatureEval = {
      id,
      name,
      valueProp: '',
      scenario: '',
      perspectives: [],
      filesToCheck: [],
    };

    let currentField = '';
    for (const line of lines.slice(1)) {
      const trimmed = line.trim();

      if (trimmed.startsWith('**Value prop:**'))
        eval_.valueProp = trimmed.replace('**Value prop:**', '').trim();
      else if (trimmed.startsWith('**Scenario:**')) {
        currentField = 'scenario';
        eval_.scenario = trimmed.replace('**Scenario:**', '').trim();
      } else if (trimmed.startsWith('**Perspectives:**'))
        eval_.perspectives = trimmed.replace('**Perspectives:**', '').trim().split(',').map(t => t.trim());
      else if (trimmed.startsWith('**Files:**'))
        currentField = 'files';
      else if (trimmed.startsWith('- ') && currentField === 'files')
        eval_.filesToCheck.push(trimmed.replace('- ', '').replace(/`/g, ''));
      else if (currentField === 'scenario' && trimmed)
        eval_.scenario += ' ' + trimmed;
    }

    if (eval_.valueProp) evals.push(eval_);
  }

  return evals;
}

// ── Run Perspective ──────────────────────────────────────────

function buildPerspectivePrompt(
  perspective: Perspective,
  eval_: FeatureEval,
  specContent: string,
  fileContents: Map<string, string>
): string {
  let prompt = `You are embodying a specific person to stress-test a product feature. You are NOT an AI evaluator — you ARE this person, and you're reacting to this feature honestly.

## Who You Are

${perspective.who}

**What you need:** ${perspective.need}
**Your bar for this being worth it:** ${perspective.bar}
**What would make you bounce:** ${perspective.redFlags}

## The Feature

**Value prop:** ${eval_.valueProp}
**Scenario:** ${eval_.scenario}

## The Spec (what they're building)
\`\`\`
${specContent.slice(0, 6000)}
\`\`\`

## The Implementation (what actually exists)
`;

  for (const [path, content] of fileContents) {
    prompt += `\n### ${path}\n\`\`\`\n${content.slice(0, 5000)}\n\`\`\`\n`;
  }

  prompt += `
## Your Response

React to this feature AS THIS PERSON. Be specific, be honest, be grounded in real behavior — not abstract product thinking.

Output format (EXACTLY — machine-parsed):
WORKS: [What genuinely works for you. What would make you stay, use this, come back. Be specific about moments, not features.]
BREAKS: [What breaks for you. Where you'd get confused, frustrated, or bounce. Where the feature assumes something about your life that isn't true.]
MISSING: [What's not here that you desperately need. The gap between what this does and what would actually change your behavior.]
SIGNAL_TYPE: [pain|gain|pivot]
SIGNAL_SEVERITY: [high|medium|low]
SIGNAL: [One sharp insight. Not a feature request — a product truth this perspective reveals. What should the team know that they probably don't?]
DEPTH: [0-10 score. 0 = this feature has zero depth for this person, it's surface-level. 10 = this feature deeply understands and serves this person's actual need.]`;

  return prompt;
}

function runPerspective(
  perspective: Perspective,
  eval_: FeatureEval,
  specContent: string,
  fileContents: Map<string, string>,
  projectRoot: string
): PerspectiveResult | null {
  const prompt = buildPerspectivePrompt(perspective, eval_, specContent, fileContents);

  try {
    const result = execSync(`echo ${JSON.stringify(prompt)} | claude --print --no-input 2>/dev/null`, {
      maxBuffer: 1024 * 1024 * 10,
      timeout: 120_000,
      cwd: projectRoot,
    }).toString();

    const extract = (key: string) => {
      const match = result.match(new RegExp(`${key}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's'));
      return match?.[1]?.trim() || '';
    };

    const signalType = (extract('SIGNAL_TYPE') || 'pain') as 'pain' | 'gain' | 'pivot';
    const signalSeverity = (extract('SIGNAL_SEVERITY') || 'medium') as 'high' | 'medium' | 'low';
    const depthMatch = result.match(/DEPTH:\s*(\d+)/);

    return {
      perspectiveId: perspective.id,
      works: extract('WORKS'),
      breaks: extract('BREAKS'),
      missing: extract('MISSING'),
      signal: {
        type: signalType,
        severity: signalSeverity,
        insight: extract('SIGNAL'),
      },
      depthScore: depthMatch ? parseInt(depthMatch[1]) : 0,
    };
  } catch (e) {
    console.error(`    Failed: ${e}`);
    return null;
  }
}

// ── CLI ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const projectRoot = resolve(import.meta.dirname || '.', '../..');
const specsDir = resolve(projectRoot, 'docs/specs');

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;

const allPerspectives = parsePerspectives(projectRoot);

if (args.includes('--list')) {
  const specs = readdirSync(specsDir).filter(f => f.endsWith('.md'));
  console.log(bold('Perspectives:'));
  for (const p of allPerspectives) {
    console.log(`  ${cyan(p.id)} ${dim(`(${p.category})`)} — ${p.who.slice(0, 80)}...`);
  }
  console.log('');
  console.log(bold('Specs with evals:'));
  for (const spec of specs) {
    const evals = parseEvalsFromSpec(resolve(specsDir, spec));
    if (evals.length > 0) {
      console.log(`  ${bold(spec)}`);
      for (const e of evals) {
        const pLabel = e.perspectives.length > 0 ? e.perspectives.join(', ') : 'all core';
        console.log(`    ${dim(e.id)}: ${e.name} ${dim(`→ ${pLabel}`)}`);
      }
    }
  }
  process.exit(0);
}

// Parse args
let specFiles: string[] = [];
let perspectiveFilter: string[] = [];
let evalFilter: string | null = null;

if (args[0] && !args[0].startsWith('--')) {
  specFiles = [resolve(args[0])];
}

const persIdx = args.indexOf('--perspectives');
if (persIdx !== -1 && args[persIdx + 1]) {
  perspectiveFilter = args[persIdx + 1].split(',');
}

const evalIdx = args.indexOf('--eval');
if (evalIdx !== -1 && args[evalIdx + 1]) {
  evalFilter = args[evalIdx + 1];
}

if (specFiles.length === 0) {
  console.log('Usage:');
  console.log('  npx tsx scripts/eval/eval-feature.ts docs/specs/01-identity-home-system.md');
  console.log('  npx tsx scripts/eval/eval-feature.ts docs/specs/01-identity-home-system.md --perspectives lonely-freshman,commuter-student');
  console.log('  npx tsx scripts/eval/eval-feature.ts --list');
  process.exit(1);
}

// Run
console.log(bold('HIVE Feature Depth Eval'));
console.log('═'.repeat(60));
console.log('');

const allResults: EvalResult[] = [];

for (const specFile of specFiles) {
  const specContent = readFileSync(specFile, 'utf-8');
  let evals = parseEvalsFromSpec(specFile);
  if (evalFilter) evals = evals.filter(e => e.id === evalFilter);
  if (evals.length === 0) {
    console.log(yellow(`No evals found in ${basename(specFile)}`));
    continue;
  }

  console.log(bold(basename(specFile)));

  for (const eval_ of evals) {
    console.log(`\n  ${bold(eval_.name)}`);
    console.log(`  ${dim(eval_.valueProp)}`);
    console.log('');

    // Determine which perspectives to run
    let perspectives: Perspective[];
    if (perspectiveFilter.length > 0) {
      perspectives = allPerspectives.filter(p => perspectiveFilter.includes(p.id));
    } else if (eval_.perspectives.length > 0) {
      perspectives = allPerspectives.filter(p => eval_.perspectives.includes(p.id));
    } else {
      perspectives = allPerspectives.filter(p => p.category === 'core');
    }

    // Read implementation files
    const fileContents = new Map<string, string>();
    for (const filePath of eval_.filesToCheck) {
      try {
        fileContents.set(filePath, readFileSync(resolve(projectRoot, filePath), 'utf-8'));
      } catch {
        fileContents.set(filePath, '// FILE NOT FOUND');
      }
    }

    const perspectiveResults: PerspectiveResult[] = [];

    for (const perspective of perspectives) {
      process.stdout.write(`  ${cyan(perspective.id)}... `);
      const result = runPerspective(perspective, eval_, specContent, fileContents, projectRoot);

      if (result) {
        perspectiveResults.push(result);

        const depthColor = result.depthScore >= 7 ? green : result.depthScore >= 4 ? yellow : red;
        console.log(depthColor(`depth ${result.depthScore}/10`));

        // Show the key outputs
        if (result.works) console.log(`    ${green('+')} ${result.works.slice(0, 120)}`);
        if (result.breaks) console.log(`    ${red('−')} ${result.breaks.slice(0, 120)}`);
        if (result.missing) console.log(`    ${yellow('?')} ${result.missing.slice(0, 120)}`);

        const signalIcon = { pain: red('⚡'), gain: green('↑'), pivot: yellow('⟳') };
        console.log(`    ${signalIcon[result.signal.type]} ${result.signal.insight.slice(0, 140)}`);
        console.log('');
      } else {
        console.log(red('failed'));
      }
    }

    const overallDepth = perspectiveResults.length > 0
      ? Math.round(perspectiveResults.reduce((s, r) => s + r.depthScore, 0) / perspectiveResults.length * 10) / 10
      : 0;

    allResults.push({
      evalId: eval_.id,
      specFile,
      perspectiveResults,
      overallDepth,
      signals: perspectiveResults.map(r => r.signal),
      timestamp: new Date().toISOString(),
    });

    const depthColor = overallDepth >= 7 ? green : overallDepth >= 4 ? yellow : red;
    console.log(`  ${bold('Overall depth:')} ${depthColor(`${overallDepth}/10`)}`);
  }
}

// Aggregate signals
console.log('');
console.log('═'.repeat(60));
console.log(bold('SIGNAL DIGEST'));
console.log('═'.repeat(60));

const allSignals = allResults.flatMap(r => r.signals);
const grouped = { pain: [] as typeof allSignals, gain: [] as typeof allSignals, pivot: [] as typeof allSignals };
for (const s of allSignals) grouped[s.type].push(s);

// Sort each group by severity
const sevOrder = { high: 0, medium: 1, low: 2 };
for (const group of Object.values(grouped)) {
  group.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
}

if (grouped.pivot.length > 0) {
  console.log('');
  console.log(yellow(bold('PIVOT SIGNALS — consider before shipping:')));
  for (const s of grouped.pivot) {
    const sev = s.severity === 'high' ? red('HIGH') : s.severity === 'medium' ? yellow('MED') : dim('low');
    console.log(`  ${sev} ${s.insight}`);
  }
}

if (grouped.pain.length > 0) {
  console.log('');
  console.log(red(bold('PAIN SIGNALS — friction to address:')));
  for (const s of grouped.pain) {
    const sev = s.severity === 'high' ? red('HIGH') : s.severity === 'medium' ? yellow('MED') : dim('low');
    console.log(`  ${sev} ${s.insight}`);
  }
}

if (grouped.gain.length > 0) {
  console.log('');
  console.log(green(bold('GAIN SIGNALS — opportunities to lean into:')));
  for (const s of grouped.gain) {
    const sev = s.severity === 'high' ? red('HIGH') : s.severity === 'medium' ? yellow('MED') : dim('low');
    console.log(`  ${sev} ${s.insight}`);
  }
}

// Save
const resultsDir = resolve(projectRoot, 'scripts/eval/results');
mkdirSync(resultsDir, { recursive: true });
const resultsFile = resolve(resultsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
writeFileSync(resultsFile, JSON.stringify(allResults, null, 2));
console.log(dim(`\nResults saved: ${resultsFile}`));
