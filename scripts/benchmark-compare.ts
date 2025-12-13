#!/usr/bin/env npx ts-node --esm
/**
 * Benchmark Comparison CLI
 *
 * Compare two benchmark runs to detect regressions and improvements.
 * Useful for reviewing changes before merging.
 *
 * Usage:
 *   npx ts-node scripts/benchmark-compare.ts <current> <baseline>
 *
 * Examples:
 *   # Compare two saved benchmark results
 *   npx ts-node scripts/benchmark-compare.ts benchmarks/latest.json benchmarks/baseline.json
 *
 *   # Compare and output markdown for PR
 *   npx ts-node scripts/benchmark-compare.ts benchmarks/pr.json benchmarks/main.json --format markdown
 */

import { getBenchmarkRunner, getBenchmarkReporter } from '../packages/core/src/application/hivelab/benchmarks';
import type { BenchmarkSuiteResult, BenchmarkComparison } from '../packages/core/src/application/hivelab/benchmarks';
import * as fs from 'fs/promises';

// ═══════════════════════════════════════════════════════════════════
// CLI ARGUMENT PARSING
// ═══════════════════════════════════════════════════════════════════

interface CLIOptions {
  currentPath: string;
  baselinePath: string;
  format: 'summary' | 'detailed' | 'markdown' | 'json';
  failOnRegression: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);

  if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const options: CLIOptions = {
    currentPath: args[0],
    baselinePath: args[1],
    format: 'summary',
    failOnRegression: true,
  };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--format':
      case '-f':
        if (nextArg) {
          options.format = nextArg as CLIOptions['format'];
          i++;
        }
        break;

      case '--no-fail':
        options.failOnRegression = false;
        break;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Benchmark Comparison CLI

Usage:
  npx ts-node scripts/benchmark-compare.ts <current> <baseline> [options]

Arguments:
  <current>     Path to current benchmark results JSON
  <baseline>    Path to baseline benchmark results JSON

Options:
  -f, --format <fmt>    Output format: summary, detailed, markdown, json (default: summary)
      --no-fail         Don't exit with error code on regression
  -h, --help            Show this help

Examples:
  # Compare latest against baseline
  npx ts-node scripts/benchmark-compare.ts benchmarks/latest.json benchmarks/baseline.json

  # Output markdown for PR comment
  npx ts-node scripts/benchmark-compare.ts benchmarks/pr.json benchmarks/main.json -f markdown
`);
}

// ═══════════════════════════════════════════════════════════════════
// COMPARISON FORMATTING
// ═══════════════════════════════════════════════════════════════════

function formatSummary(current: BenchmarkSuiteResult, baseline: BenchmarkSuiteResult, comparison: BenchmarkComparison): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('AI Benchmark Comparison');
  lines.push('=======================');
  lines.push('');

  // Commits
  lines.push(`Current:  ${current.gitBranch} @ ${current.gitCommit.slice(0, 7)}`);
  lines.push(`Baseline: ${baseline.gitBranch} @ ${baseline.gitCommit.slice(0, 7)}`);
  lines.push('');

  // Key metrics
  const scoreIcon = comparison.scoreChange >= 0 ? '+' : '';
  const passIcon = comparison.passRateChange >= 0 ? '+' : '';
  const acceptIcon = comparison.acceptanceRateChange >= 0 ? '+' : '';
  const durationIcon = comparison.durationChange <= 0 ? '' : '+';

  lines.push('Metrics:');
  lines.push(`  Quality Score:   ${current.avgQualityScore.toFixed(1)} (${scoreIcon}${comparison.scoreChange.toFixed(1)})`);
  lines.push(`  Pass Rate:       ${(current.passRate * 100).toFixed(1)}% (${passIcon}${(comparison.passRateChange * 100).toFixed(1)}%)`);
  lines.push(`  Acceptance Rate: ${(current.acceptanceRate * 100).toFixed(1)}% (${acceptIcon}${(comparison.acceptanceRateChange * 100).toFixed(1)}%)`);
  lines.push(`  Avg Duration:    ${current.avgDurationMs.toFixed(0)}ms (${durationIcon}${comparison.durationChange.toFixed(0)}ms)`);
  lines.push('');

  // Regressions
  if (comparison.regressions.length > 0) {
    lines.push(`Regressions (${comparison.regressions.length}):`);
    for (const r of comparison.regressions) {
      lines.push(`  - ${r}`);
    }
    lines.push('');
  }

  // Improvements
  if (comparison.improvements.length > 0) {
    lines.push(`Improvements (${comparison.improvements.length}):`);
    for (const i of comparison.improvements) {
      lines.push(`  + ${i}`);
    }
    lines.push('');
  }

  // Verdict
  if (comparison.isRegression) {
    lines.push(`REGRESSION DETECTED: ${comparison.regressionReason}`);
  } else if (comparison.improvements.length > 0) {
    lines.push('IMPROVEMENT: All metrics stable or improved');
  } else {
    lines.push('STABLE: No significant changes detected');
  }

  return lines.join('\n');
}

function formatDetailed(current: BenchmarkSuiteResult, baseline: BenchmarkSuiteResult, comparison: BenchmarkComparison): string {
  const lines: string[] = [];

  lines.push(formatSummary(current, baseline, comparison));
  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('');

  // Per-prompt comparison
  lines.push('Per-Prompt Analysis:');
  lines.push('');

  const baselineResults = new Map(baseline.results.map(r => [r.promptId, r]));

  for (const result of current.results) {
    const baseResult = baselineResults.get(result.promptId);
    const statusIcon = result.passed ? '✓' : '✗';
    const changeIcon = !baseResult
      ? 'NEW'
      : baseResult.passed === result.passed
        ? '='
        : result.passed
          ? '↑'
          : '↓';

    const scoreDiff = baseResult
      ? result.scores.overall - baseResult.scores.overall
      : 0;
    const scoreDiffStr = baseResult
      ? ` (${scoreDiff >= 0 ? '+' : ''}${scoreDiff.toFixed(0)})`
      : '';

    lines.push(`${statusIcon} ${changeIcon} ${result.promptId.padEnd(30)} ${result.scores.overall}/100${scoreDiffStr}`);

    if (!result.passed && result.failureReasons.length > 0) {
      for (const reason of result.failureReasons) {
        lines.push(`      └─ ${reason}`);
      }
    }
  }

  return lines.join('\n');
}

function formatMarkdown(current: BenchmarkSuiteResult, baseline: BenchmarkSuiteResult, comparison: BenchmarkComparison): string {
  const lines: string[] = [];

  // Header
  const statusEmoji = comparison.isRegression ? '❌' : comparison.improvements.length > 0 ? '✅' : '➖';
  lines.push(`## ${statusEmoji} AI Benchmark Comparison`);
  lines.push('');

  // Commits
  lines.push(`**Current:** \`${current.gitBranch}\` @ \`${current.gitCommit.slice(0, 7)}\``);
  lines.push(`**Baseline:** \`${baseline.gitBranch}\` @ \`${baseline.gitCommit.slice(0, 7)}\``);
  lines.push('');

  // Metrics table
  lines.push('### Metrics');
  lines.push('');
  lines.push('| Metric | Current | Baseline | Change |');
  lines.push('|--------|---------|----------|--------|');

  const scoreChange = comparison.scoreChange >= 0 ? `+${comparison.scoreChange.toFixed(1)}` : comparison.scoreChange.toFixed(1);
  const passChange = comparison.passRateChange >= 0 ? `+${(comparison.passRateChange * 100).toFixed(1)}%` : `${(comparison.passRateChange * 100).toFixed(1)}%`;
  const acceptChange = comparison.acceptanceRateChange >= 0 ? `+${(comparison.acceptanceRateChange * 100).toFixed(1)}%` : `${(comparison.acceptanceRateChange * 100).toFixed(1)}%`;

  lines.push(`| Quality Score | ${current.avgQualityScore.toFixed(1)} | ${baseline.avgQualityScore.toFixed(1)} | ${scoreChange} |`);
  lines.push(`| Pass Rate | ${(current.passRate * 100).toFixed(1)}% | ${(baseline.passRate * 100).toFixed(1)}% | ${passChange} |`);
  lines.push(`| Acceptance Rate | ${(current.acceptanceRate * 100).toFixed(1)}% | ${(baseline.acceptanceRate * 100).toFixed(1)}% | ${acceptChange} |`);
  lines.push(`| Tests | ${current.passed}/${current.totalPrompts} | ${baseline.passed}/${baseline.totalPrompts} | - |`);
  lines.push('');

  // Regressions
  if (comparison.regressions.length > 0) {
    lines.push('### Regressions ⚠️');
    lines.push('');
    for (const r of comparison.regressions) {
      lines.push(`- \`${r}\``);
    }
    lines.push('');
  }

  // Improvements
  if (comparison.improvements.length > 0) {
    lines.push('### Improvements ✨');
    lines.push('');
    for (const i of comparison.improvements) {
      lines.push(`- \`${i}\``);
    }
    lines.push('');
  }

  // Verdict
  if (comparison.isRegression) {
    lines.push(`> ⚠️ **REGRESSION:** ${comparison.regressionReason}`);
  }

  // Footer
  lines.push('');
  lines.push('---');
  lines.push(`<sub>Run: \`${current.runId.slice(0, 16)}\`</sub>`);

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  const options = parseArgs();

  // Load both result files
  let current: BenchmarkSuiteResult;
  let baseline: BenchmarkSuiteResult;

  try {
    const currentContent = await fs.readFile(options.currentPath, 'utf-8');
    current = JSON.parse(currentContent);
  } catch (e) {
    console.error(`Failed to load current results: ${options.currentPath}`);
    process.exit(1);
  }

  try {
    const baselineContent = await fs.readFile(options.baselinePath, 'utf-8');
    baseline = JSON.parse(baselineContent);
  } catch (e) {
    console.error(`Failed to load baseline results: ${options.baselinePath}`);
    process.exit(1);
  }

  // Compare
  const runner = getBenchmarkRunner();
  const comparison = runner.compareRuns(current, baseline);

  // Format output
  let output: string;
  switch (options.format) {
    case 'json':
      output = JSON.stringify({ current, baseline, comparison }, null, 2);
      break;
    case 'markdown':
      output = formatMarkdown(current, baseline, comparison);
      break;
    case 'detailed':
      output = formatDetailed(current, baseline, comparison);
      break;
    case 'summary':
    default:
      output = formatSummary(current, baseline, comparison);
  }

  console.log(output);

  // Exit code
  if (options.failOnRegression && comparison.isRegression) {
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Comparison failed:', error);
  process.exit(1);
});
