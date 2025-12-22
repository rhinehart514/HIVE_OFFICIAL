/**
 * AI Benchmark System
 *
 * Automated quality measurement for AI-generated tool compositions.
 * Runs in CI to detect regressions and track improvement over time.
 *
 * @example
 * ```typescript
 * import { getBenchmarkRunner, getBenchmarkReporter } from '@hive/core';
 *
 * const runner = getBenchmarkRunner();
 * const results = await runner.runSuite({ mockMode: true });
 *
 * const reporter = getBenchmarkReporter();
 * console.log(reporter.format(results, 'table'));
 * ```
 */

// Types
export type {
  BenchmarkCategory,
  BenchmarkPrompt,
  BenchmarkResult,
  BenchmarkSuiteResult,
  BenchmarkComparison,
  BenchmarkRunnerOptions,
  CategoryResult,
  ExpectationResult,
  RegressionThresholds,
  MockGenerationResult,
} from './benchmark.types';

export { DEFAULT_REGRESSION_THRESHOLDS } from './benchmark.types';

// Prompts
export {
  BENCHMARK_PROMPTS,
  getPromptsByCategory,
  getPromptsByTag,
  getPromptById,
  getPromptIdsByCategory,
  PROMPT_COUNTS,
  TOTAL_PROMPT_COUNT,
} from './benchmark-prompts';

// Runner
export {
  BenchmarkRunnerService,
  getBenchmarkRunner,
} from './benchmark-runner.service';

// Mock Generator
export {
  MockGeneratorService,
  getMockGenerator,
} from './mock-generator.service';

// Reporter
export {
  BenchmarkReporter,
  getBenchmarkReporter,
  type OutputFormat,
} from './benchmark-reporter';
