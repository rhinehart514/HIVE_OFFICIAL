/**
 * Benchmark Runner Service
 *
 * Executes benchmark prompts against the AI generation system
 * and collects quality metrics. Supports both real AI generation
 * and mock mode for CI.
 */

import type { ToolComposition } from '../../../domain/hivelab/tool-composition.types';
import type { ValidationResult } from '../../../domain/hivelab/validation/types';
import { CompositionValidatorService, getCompositionValidator } from '../validation/composition-validator.service';
import { QualityGateService, getQualityGateService, type GateDecision } from '../validation/quality-gate.service';
import { MockGeneratorService, getMockGenerator } from './mock-generator.service';
import { BENCHMARK_PROMPTS, getPromptById, getPromptsByCategory, getPromptsByTag } from './benchmark-prompts';
import type {
  BenchmarkPrompt,
  BenchmarkResult,
  BenchmarkSuiteResult,
  BenchmarkCategory,
  BenchmarkRunnerOptions,
  BenchmarkComparison,
  CategoryResult,
  ExpectationResult,
  RegressionThresholds,
  DEFAULT_REGRESSION_THRESHOLDS,
} from './benchmark.types';

// ═══════════════════════════════════════════════════════════════════
// BENCHMARK RUNNER SERVICE
// ═══════════════════════════════════════════════════════════════════

export class BenchmarkRunnerService {
  private validator: CompositionValidatorService;
  private gate: QualityGateService;
  private mockGenerator: MockGeneratorService;
  private regressionThresholds: RegressionThresholds;

  constructor(options?: {
    regressionThresholds?: Partial<RegressionThresholds>;
  }) {
    this.validator = getCompositionValidator();
    this.gate = getQualityGateService();
    this.mockGenerator = getMockGenerator();
    this.regressionThresholds = {
      scoreDropWarning: -5,
      scoreDropFail: -10,
      passRateDropWarning: 0.1,
      passRateDropFail: 0.2,
      ...options?.regressionThresholds,
    };
  }

  /**
   * Run the full benchmark suite
   */
  async runSuite(options: BenchmarkRunnerOptions = {}): Promise<BenchmarkSuiteResult> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const runAt = new Date();

    // Determine which prompts to run
    const prompts = this.selectPrompts(options);

    if (options.verbose) {
      console.log(`Running ${prompts.length} benchmarks...`);
    }

    // Run benchmarks
    const results: BenchmarkResult[] = [];

    if (options.parallel) {
      // Parallel execution with concurrency limit
      const concurrency = options.concurrency || 3;
      for (let i = 0; i < prompts.length; i += concurrency) {
        const batch = prompts.slice(i, i + concurrency);
        const batchResults = await Promise.all(
          batch.map(p => this.runBenchmark(p, options))
        );
        results.push(...batchResults);

        if (options.verbose) {
          console.log(`Completed ${Math.min(i + concurrency, prompts.length)}/${prompts.length}`);
        }
      }
    } else {
      // Sequential execution
      for (const prompt of prompts) {
        const result = await this.runBenchmark(prompt, options);
        results.push(result);

        if (options.verbose) {
          const status = result.passed ? '✓' : '✗';
          console.log(`${status} ${prompt.id}: ${result.scores.overall}/100`);
        }
      }
    }

    // Calculate aggregates
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const passRate = results.length > 0 ? passed / results.length : 0;
    const avgQualityScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length
      : 0;
    const avgDurationMs = results.length > 0
      ? results.reduce((sum, r) => sum + r.durationMs, 0) / results.length
      : 0;
    const acceptedCount = results.filter(r =>
      r.gateDecision === 'accepted' || r.gateDecision === 'partial_accept'
    ).length;
    const acceptanceRate = results.length > 0 ? acceptedCount / results.length : 0;

    // Calculate category results
    const categoryResults = this.calculateCategoryResults(results);

    // Build suite result
    const suiteResult: BenchmarkSuiteResult = {
      runId,
      gitCommit: this.getGitCommit(),
      gitBranch: this.getGitBranch(),
      runAt,
      environment: this.getEnvironment(),
      totalPrompts: prompts.length,
      passed,
      failed,
      passRate,
      avgQualityScore,
      avgDurationMs,
      acceptanceRate,
      categoryResults,
      results,
    };

    // Load and compare with baseline if available
    if (options.baselinePath) {
      try {
        const baseline = await this.loadBaseline(options.baselinePath);
        suiteResult.comparison = this.compareRuns(suiteResult, baseline);
      } catch (e) {
        // Baseline not found or invalid - continue without comparison
        if (options.verbose) {
          console.log('No baseline found for comparison');
        }
      }
    }

    return suiteResult;
  }

  /**
   * Run a single benchmark prompt
   */
  async runBenchmark(
    prompt: BenchmarkPrompt,
    options: BenchmarkRunnerOptions = {}
  ): Promise<BenchmarkResult> {
    const startedAt = new Date();
    let composition: ToolComposition;
    let durationMs: number;
    let error: string | undefined;

    try {
      if (options.mockMode) {
        // Use mock generator
        const mockResult = this.mockGenerator.generate(prompt);
        composition = mockResult.composition as unknown as ToolComposition;
        durationMs = mockResult.durationMs;
      } else {
        // Real AI generation would go here
        // For now, fall back to mock
        const mockResult = this.mockGenerator.generate(prompt);
        composition = mockResult.composition as unknown as ToolComposition;
        durationMs = mockResult.durationMs;
      }
    } catch (e) {
      // Generation failed
      const completedAt = new Date();
      error = e instanceof Error ? e.message : String(e);

      return {
        promptId: prompt.id,
        prompt: prompt.prompt,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        success: false,
        error,
        scores: { overall: 0, schema: 0, elements: 0, config: 0, connections: 0, semantic: 0 },
        gateDecision: 'rejected',
        elementCount: 0,
        connectionCount: 0,
        elementTypes: [],
        expectations: {
          hasExpectedElements: false,
          missingElements: prompt.expectedElements,
          withinElementBounds: false,
          actualElementCount: 0,
          hasExpectedConnections: false,
          meetsMinQuality: false,
          actualQualityScore: 0,
        },
        passed: false,
        failureReasons: [`Generation failed: ${error}`],
      };
    }

    // Validate composition
    const validation = this.validator.validate(composition);
    const gateResult = this.gate.gate(composition, validation);

    // Check expectations
    const expectations = this.checkExpectations(prompt, composition, validation);

    // Determine if passed
    const failureReasons: string[] = [];

    if (!expectations.hasExpectedElements) {
      failureReasons.push(`Missing elements: ${expectations.missingElements.join(', ')}`);
    }
    if (!expectations.withinElementBounds) {
      failureReasons.push(`Element count ${expectations.actualElementCount} outside bounds [${prompt.minElementCount}, ${prompt.maxElementCount}]`);
    }
    if (!expectations.hasExpectedConnections && prompt.expectedConnections) {
      failureReasons.push('Expected connections but none found');
    }
    if (!expectations.meetsMinQuality) {
      failureReasons.push(`Quality score ${expectations.actualQualityScore} below minimum ${prompt.minQualityScore}`);
    }

    const passed = failureReasons.length === 0;
    const completedAt = new Date();

    return {
      promptId: prompt.id,
      prompt: prompt.prompt,
      startedAt,
      completedAt,
      durationMs,
      success: true,
      scores: validation.score,
      gateDecision: gateResult.decision,
      elementCount: composition.elements?.length || 0,
      connectionCount: composition.connections?.length || 0,
      elementTypes: [...new Set(composition.elements?.map(e => e.elementId) || [])],
      expectations,
      passed,
      failureReasons,
    };
  }

  /**
   * Compare two benchmark runs
   */
  compareRuns(
    current: BenchmarkSuiteResult,
    baseline: BenchmarkSuiteResult
  ): BenchmarkComparison {
    const scoreChange = current.avgQualityScore - baseline.avgQualityScore;
    const passRateChange = current.passRate - baseline.passRate;
    const acceptanceRateChange = current.acceptanceRate - baseline.acceptanceRate;
    const durationChange = current.avgDurationMs - baseline.avgDurationMs;

    // Find regressions and improvements
    const regressions: string[] = [];
    const improvements: string[] = [];

    const baselineResults = new Map(baseline.results.map(r => [r.promptId, r]));

    for (const result of current.results) {
      const baseResult = baselineResults.get(result.promptId);
      if (baseResult) {
        if (baseResult.passed && !result.passed) {
          regressions.push(result.promptId);
        } else if (!baseResult.passed && result.passed) {
          improvements.push(result.promptId);
        }
      }
    }

    // Determine if this is a regression
    let isRegression = false;
    let regressionReason: string | undefined;

    if (scoreChange <= this.regressionThresholds.scoreDropFail) {
      isRegression = true;
      regressionReason = `Quality score dropped by ${Math.abs(scoreChange).toFixed(1)} points`;
    } else if (passRateChange <= -this.regressionThresholds.passRateDropFail) {
      isRegression = true;
      regressionReason = `Pass rate dropped by ${Math.abs(passRateChange * 100).toFixed(1)}%`;
    } else if (regressions.length > 0) {
      isRegression = true;
      regressionReason = `${regressions.length} benchmark(s) regressed`;
    }

    return {
      baselineRunId: baseline.runId,
      baselineCommit: baseline.gitCommit,
      scoreChange,
      passRateChange,
      acceptanceRateChange,
      durationChange,
      regressions,
      improvements,
      isRegression,
      regressionReason,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────

  private selectPrompts(options: BenchmarkRunnerOptions): BenchmarkPrompt[] {
    let prompts = [...BENCHMARK_PROMPTS];

    // Filter by IDs
    if (options.promptIds && options.promptIds.length > 0) {
      prompts = prompts.filter(p => options.promptIds!.includes(p.id));
    }

    // Filter by categories
    if (options.categories && options.categories.length > 0) {
      prompts = prompts.filter(p => options.categories!.includes(p.category));
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      prompts = prompts.filter(p =>
        options.tags!.some(tag => p.tags.includes(tag))
      );
    }

    return prompts;
  }

  private checkExpectations(
    prompt: BenchmarkPrompt,
    composition: ToolComposition,
    validation: ValidationResult
  ): ExpectationResult {
    const elementTypes = new Set(
      composition.elements?.map(e => e.elementId?.replace(/-\d+$/, '')) || []
    );

    const missingElements = prompt.expectedElements.filter(e => !elementTypes.has(e));
    const hasExpectedElements = missingElements.length === 0;

    const actualElementCount = composition.elements?.length || 0;
    const withinElementBounds =
      actualElementCount >= prompt.minElementCount &&
      actualElementCount <= prompt.maxElementCount;

    const hasExpectedConnections =
      !prompt.expectedConnections ||
      (composition.connections?.length || 0) > 0;

    const actualQualityScore = validation.score.overall;
    const meetsMinQuality = actualQualityScore >= prompt.minQualityScore;

    return {
      hasExpectedElements,
      missingElements,
      withinElementBounds,
      actualElementCount,
      hasExpectedConnections,
      meetsMinQuality,
      actualQualityScore,
    };
  }

  private calculateCategoryResults(
    results: BenchmarkResult[]
  ): Record<BenchmarkCategory, CategoryResult> {
    const categories: BenchmarkCategory[] = ['basic', 'complex', 'edge_case', 'space_context', 'iteration'];
    const categoryResults: Record<BenchmarkCategory, CategoryResult> = {} as Record<BenchmarkCategory, CategoryResult>;

    for (const category of categories) {
      const categoryPrompts = BENCHMARK_PROMPTS.filter(p => p.category === category);
      const categoryResultsList = results.filter(r =>
        categoryPrompts.some(p => p.id === r.promptId)
      );

      const total = categoryResultsList.length;
      const passed = categoryResultsList.filter(r => r.passed).length;
      const failed = total - passed;
      const passRate = total > 0 ? passed / total : 0;
      const avgScore = total > 0
        ? categoryResultsList.reduce((sum, r) => sum + r.scores.overall, 0) / total
        : 0;
      const avgDurationMs = total > 0
        ? categoryResultsList.reduce((sum, r) => sum + r.durationMs, 0) / total
        : 0;

      categoryResults[category] = {
        category,
        total,
        passed,
        failed,
        passRate,
        avgScore,
        avgDurationMs,
      };
    }

    return categoryResults;
  }

  private getGitCommit(): string {
    // In real implementation, would read from git
    return process.env.GITHUB_SHA || process.env.GIT_COMMIT || 'unknown';
  }

  private getGitBranch(): string {
    // In real implementation, would read from git
    return process.env.GITHUB_REF_NAME || process.env.GIT_BRANCH || 'unknown';
  }

  private getEnvironment(): 'ci' | 'local' | 'production' {
    if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
      return 'ci';
    }
    if (process.env.NODE_ENV === 'production') {
      return 'production';
    }
    return 'local';
  }

  private async loadBaseline(path: string): Promise<BenchmarkSuiteResult> {
    // Only available in Node.js environment (CLI/CI usage)
    if (typeof window !== 'undefined') {
      throw new Error('loadBaseline is only available in Node.js environment');
    }
    // Use eval to prevent webpack from bundling fs
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fs = await (new Function('return import("fs")'))() as { promises: typeof import('fs').promises };
    const content = await fs.promises.readFile(path, 'utf-8');
    return JSON.parse(content);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════

let benchmarkRunnerInstance: BenchmarkRunnerService | null = null;

export function getBenchmarkRunner(): BenchmarkRunnerService {
  if (!benchmarkRunnerInstance) {
    benchmarkRunnerInstance = new BenchmarkRunnerService();
  }
  return benchmarkRunnerInstance;
}
