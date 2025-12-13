#!/usr/bin/env npx ts-node --esm
/**
 * AI Benchmark CLI
 *
 * Run AI quality benchmarks from the command line.
 * Designed for both local development and CI environments.
 *
 * Usage:
 *   npx ts-node scripts/benchmark-ai.ts [options]
 *
 * Options:
 *   --category <cat>    Filter by category (basic, complex, edge_case, space_context, iteration)
 *   --tag <tag>         Filter by tag
 *   --prompt <id>       Run specific prompt by ID
 *   --format <fmt>      Output format (json, table, summary, markdown, github)
 *   --parallel          Run benchmarks in parallel
 *   --baseline <path>   Compare against baseline file
 *   --save <path>       Save results to file
 *   --verbose           Verbose output
 *   --mock              Use mock generator (default in CI)
 *
 * Examples:
 *   # Run all benchmarks with table output
 *   npx ts-node scripts/benchmark-ai.ts --format table
 *
 *   # Run basic prompts only
 *   npx ts-node scripts/benchmark-ai.ts --category basic
 *
 *   # Compare against baseline
 *   npx ts-node scripts/benchmark-ai.ts --baseline benchmarks/baseline.json
 *
 *   # Save results for CI
 *   npx ts-node scripts/benchmark-ai.ts --format json --save benchmarks/latest.json
 */

import { getBenchmarkRunner, getBenchmarkReporter } from '../packages/core/src/application/hivelab/benchmarks';
import type { BenchmarkCategory, OutputFormat } from '../packages/core/src/application/hivelab/benchmarks';
import * as fs from 'fs/promises';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════
// CLI ARGUMENT PARSING
// ═══════════════════════════════════════════════════════════════════

interface CLIOptions {
  categories: BenchmarkCategory[];
  tags: string[];
  promptIds: string[];
  format: OutputFormat;
  parallel: boolean;
  baselinePath?: string;
  savePath?: string;
  verbose: boolean;
  mockMode: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    categories: [],
    tags: [],
    promptIds: [],
    format: 'summary',
    parallel: false,
    verbose: false,
    mockMode: process.env.CI === 'true' || !process.env.GOOGLE_AI_API_KEY,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--category':
      case '-c':
        if (nextArg) {
          options.categories.push(nextArg as BenchmarkCategory);
          i++;
        }
        break;

      case '--tag':
      case '-t':
        if (nextArg) {
          options.tags.push(nextArg);
          i++;
        }
        break;

      case '--prompt':
      case '-p':
        if (nextArg) {
          options.promptIds.push(nextArg);
          i++;
        }
        break;

      case '--format':
      case '-f':
        if (nextArg) {
          options.format = nextArg as OutputFormat;
          i++;
        }
        break;

      case '--parallel':
        options.parallel = true;
        break;

      case '--baseline':
      case '-b':
        if (nextArg) {
          options.baselinePath = nextArg;
          i++;
        }
        break;

      case '--save':
      case '-s':
        if (nextArg) {
          options.savePath = nextArg;
          i++;
        }
        break;

      case '--verbose':
      case '-v':
        options.verbose = true;
        break;

      case '--mock':
      case '-m':
        options.mockMode = true;
        break;

      case '--real':
        options.mockMode = false;
        break;

      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
AI Benchmark CLI

Usage:
  npx ts-node scripts/benchmark-ai.ts [options]

Options:
  -c, --category <cat>    Filter by category (basic, complex, edge_case, space_context, iteration)
  -t, --tag <tag>         Filter by tag (can specify multiple)
  -p, --prompt <id>       Run specific prompt by ID (can specify multiple)
  -f, --format <fmt>      Output format: json, table, summary, markdown, github (default: summary)
      --parallel          Run benchmarks in parallel (faster)
  -b, --baseline <path>   Compare against baseline JSON file
  -s, --save <path>       Save results to JSON file
  -v, --verbose           Verbose output during run
  -m, --mock              Use mock generator (no API key needed)
      --real              Use real AI generator (requires API key)
  -h, --help              Show this help

Categories:
  basic          Single element, clear intent (should always pass)
  complex        Multi-element with connections
  edge_case      Vague or conflicting prompts
  space_context  Context-aware generation
  iteration      Building on existing compositions

Examples:
  # Quick test with basic prompts
  npx ts-node scripts/benchmark-ai.ts -c basic -f table

  # Full suite for CI
  npx ts-node scripts/benchmark-ai.ts --mock -f github -s benchmarks/latest.json

  # Compare with baseline
  npx ts-node scripts/benchmark-ai.ts --baseline benchmarks/baseline.json -f table
`);
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  const options = parseArgs();
  const runner = getBenchmarkRunner();
  const reporter = getBenchmarkReporter();

  // Print header
  if (options.verbose) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    AI QUALITY BENCHMARK                        ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`Mode: ${options.mockMode ? 'Mock (CI-safe)' : 'Real AI'}`);
    console.log(`Format: ${options.format}`);
    if (options.categories.length > 0) {
      console.log(`Categories: ${options.categories.join(', ')}`);
    }
    if (options.tags.length > 0) {
      console.log(`Tags: ${options.tags.join(', ')}`);
    }
    if (options.baselinePath) {
      console.log(`Baseline: ${options.baselinePath}`);
    }
    console.log('');
  }

  // Run benchmarks
  const results = await runner.runSuite({
    categories: options.categories.length > 0 ? options.categories : undefined,
    tags: options.tags.length > 0 ? options.tags : undefined,
    promptIds: options.promptIds.length > 0 ? options.promptIds : undefined,
    parallel: options.parallel,
    mockMode: options.mockMode,
    baselinePath: options.baselinePath,
    verbose: options.verbose,
  });

  // Format and output
  const output = reporter.format(results, options.format);
  console.log(output);

  // Save results if requested
  if (options.savePath) {
    const dir = path.dirname(options.savePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(options.savePath, JSON.stringify(results, null, 2));

    if (options.verbose) {
      console.log(`\nResults saved to: ${options.savePath}`);
    }
  }

  // Exit with appropriate code
  const passThreshold = 0.8;
  if (results.passRate < passThreshold) {
    console.error(`\nFailed: Pass rate ${(results.passRate * 100).toFixed(1)}% below threshold ${passThreshold * 100}%`);
    process.exit(1);
  }

  if (results.comparison?.isRegression) {
    console.error(`\nRegression detected: ${results.comparison.regressionReason}`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
