/**
 * Benchmark Reporter
 *
 * Formats benchmark results for different output targets:
 * - Console (human-readable table)
 * - JSON (machine-readable for CI)
 * - Markdown (for PR comments)
 */

import type {
  BenchmarkSuiteResult,
  BenchmarkResult,
  BenchmarkCategory,
} from './benchmark.types';

// ═══════════════════════════════════════════════════════════════════
// OUTPUT FORMATS
// ═══════════════════════════════════════════════════════════════════

export type OutputFormat = 'json' | 'table' | 'summary' | 'markdown' | 'github';

// ═══════════════════════════════════════════════════════════════════
// BENCHMARK REPORTER
// ═══════════════════════════════════════════════════════════════════

export class BenchmarkReporter {
  /**
   * Format results for output
   */
  format(results: BenchmarkSuiteResult, format: OutputFormat): string {
    switch (format) {
      case 'json':
        return this.formatJSON(results);
      case 'table':
        return this.formatTable(results);
      case 'summary':
        return this.formatSummary(results);
      case 'markdown':
        return this.formatMarkdown(results);
      case 'github':
        return this.formatGitHubComment(results);
      default:
        return this.formatSummary(results);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // JSON FORMAT
  // ─────────────────────────────────────────────────────────────────

  private formatJSON(results: BenchmarkSuiteResult): string {
    return JSON.stringify(results, null, 2);
  }

  // ─────────────────────────────────────────────────────────────────
  // TABLE FORMAT
  // ─────────────────────────────────────────────────────────────────

  private formatTable(results: BenchmarkSuiteResult): string {
    const lines: string[] = [];

    // Header
    lines.push('');
    lines.push('┌─────────────────────────────────────────────────────────────────────┐');
    lines.push('│                    AI BENCHMARK RESULTS                             │');
    lines.push('├─────────────────────────────────────────────────────────────────────┤');

    // Summary row
    const passIcon = results.passRate >= 0.8 ? '✓' : '✗';
    lines.push(`│ ${passIcon} Pass Rate: ${(results.passRate * 100).toFixed(1)}%  │  Avg Score: ${results.avgQualityScore.toFixed(1)}/100  │  Total: ${results.totalPrompts} │`);

    // Category results
    lines.push('├─────────────────────────────────────────────────────────────────────┤');
    lines.push('│ Category       │ Total │ Passed │ Failed │ Pass Rate │ Avg Score   │');
    lines.push('├────────────────┼───────┼────────┼────────┼───────────┼─────────────┤');

    const categories: BenchmarkCategory[] = ['basic', 'complex', 'edge_case', 'space_context', 'iteration'];
    for (const cat of categories) {
      const catResult = results.categoryResults[cat];
      if (catResult && catResult.total > 0) {
        const catName = cat.padEnd(14);
        const total = String(catResult.total).padStart(5);
        const passed = String(catResult.passed).padStart(6);
        const failed = String(catResult.failed).padStart(6);
        const passRate = `${(catResult.passRate * 100).toFixed(0)}%`.padStart(9);
        const avgScore = `${catResult.avgScore.toFixed(1)}`.padStart(11);
        lines.push(`│ ${catName} │ ${total} │ ${passed} │ ${failed} │ ${passRate} │ ${avgScore} │`);
      }
    }

    lines.push('└─────────────────────────────────────────────────────────────────────┘');

    // Individual results
    lines.push('');
    lines.push('Individual Results:');
    lines.push('─'.repeat(70));

    for (const result of results.results) {
      const icon = result.passed ? '✓' : '✗';
      const id = result.promptId.padEnd(30);
      const score = `${result.scores.overall}/100`.padStart(8);
      const gate = result.gateDecision.padEnd(15);
      const duration = `${result.durationMs}ms`.padStart(8);
      lines.push(`${icon} ${id} ${score} ${gate} ${duration}`);

      if (!result.passed && result.failureReasons.length > 0) {
        for (const reason of result.failureReasons) {
          lines.push(`    └─ ${reason}`);
        }
      }
    }

    // Comparison
    if (results.comparison) {
      lines.push('');
      lines.push('Comparison with Baseline:');
      lines.push('─'.repeat(70));

      const scoreChange = results.comparison.scoreChange >= 0
        ? `+${results.comparison.scoreChange.toFixed(1)}`
        : results.comparison.scoreChange.toFixed(1);
      const passRateChange = results.comparison.passRateChange >= 0
        ? `+${(results.comparison.passRateChange * 100).toFixed(1)}%`
        : `${(results.comparison.passRateChange * 100).toFixed(1)}%`;

      lines.push(`Score Change: ${scoreChange} points`);
      lines.push(`Pass Rate Change: ${passRateChange}`);

      if (results.comparison.regressions.length > 0) {
        lines.push(`Regressions: ${results.comparison.regressions.join(', ')}`);
      }
      if (results.comparison.improvements.length > 0) {
        lines.push(`Improvements: ${results.comparison.improvements.join(', ')}`);
      }
      if (results.comparison.isRegression) {
        lines.push(`⚠️  REGRESSION DETECTED: ${results.comparison.regressionReason}`);
      }
    }

    return lines.join('\n');
  }

  // ─────────────────────────────────────────────────────────────────
  // SUMMARY FORMAT
  // ─────────────────────────────────────────────────────────────────

  private formatSummary(results: BenchmarkSuiteResult): string {
    const lines: string[] = [];

    lines.push('AI Benchmark Summary');
    lines.push('====================');
    lines.push(`Run ID: ${results.runId}`);
    lines.push(`Git: ${results.gitBranch} @ ${results.gitCommit.slice(0, 7)}`);
    lines.push(`Environment: ${results.environment}`);
    lines.push('');
    lines.push(`Total: ${results.totalPrompts} | Passed: ${results.passed} | Failed: ${results.failed}`);
    lines.push(`Pass Rate: ${(results.passRate * 100).toFixed(1)}%`);
    lines.push(`Avg Quality Score: ${results.avgQualityScore.toFixed(1)}/100`);
    lines.push(`Acceptance Rate: ${(results.acceptanceRate * 100).toFixed(1)}%`);
    lines.push(`Avg Duration: ${results.avgDurationMs.toFixed(0)}ms`);

    if (results.comparison?.isRegression) {
      lines.push('');
      lines.push(`⚠️  REGRESSION: ${results.comparison.regressionReason}`);
    }

    return lines.join('\n');
  }

  // ─────────────────────────────────────────────────────────────────
  // MARKDOWN FORMAT
  // ─────────────────────────────────────────────────────────────────

  private formatMarkdown(results: BenchmarkSuiteResult): string {
    const lines: string[] = [];

    lines.push('# AI Benchmark Results');
    lines.push('');
    lines.push(`**Run ID:** \`${results.runId}\``);
    lines.push(`**Git:** ${results.gitBranch} @ \`${results.gitCommit.slice(0, 7)}\``);
    lines.push(`**Environment:** ${results.environment}`);
    lines.push('');

    // Summary table
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Pass Rate | ${(results.passRate * 100).toFixed(1)}% |`);
    lines.push(`| Avg Score | ${results.avgQualityScore.toFixed(1)}/100 |`);
    lines.push(`| Acceptance Rate | ${(results.acceptanceRate * 100).toFixed(1)}% |`);
    lines.push(`| Avg Duration | ${results.avgDurationMs.toFixed(0)}ms |`);
    lines.push(`| Total Tests | ${results.totalPrompts} |`);
    lines.push(`| Passed | ${results.passed} |`);
    lines.push(`| Failed | ${results.failed} |`);
    lines.push('');

    // Category breakdown
    lines.push('## By Category');
    lines.push('');
    lines.push('| Category | Passed | Failed | Pass Rate | Avg Score |');
    lines.push('|----------|--------|--------|-----------|-----------|');

    const categories: BenchmarkCategory[] = ['basic', 'complex', 'edge_case', 'space_context', 'iteration'];
    for (const cat of categories) {
      const catResult = results.categoryResults[cat];
      if (catResult && catResult.total > 0) {
        lines.push(`| ${cat} | ${catResult.passed} | ${catResult.failed} | ${(catResult.passRate * 100).toFixed(0)}% | ${catResult.avgScore.toFixed(1)} |`);
      }
    }
    lines.push('');

    // Comparison
    if (results.comparison) {
      lines.push('## Comparison with Baseline');
      lines.push('');

      const scoreIcon = results.comparison.scoreChange >= 0 ? '📈' : '📉';
      const passIcon = results.comparison.passRateChange >= 0 ? '📈' : '📉';

      lines.push(`${scoreIcon} **Score Change:** ${results.comparison.scoreChange >= 0 ? '+' : ''}${results.comparison.scoreChange.toFixed(1)} points`);
      lines.push(`${passIcon} **Pass Rate Change:** ${results.comparison.passRateChange >= 0 ? '+' : ''}${(results.comparison.passRateChange * 100).toFixed(1)}%`);
      lines.push('');

      if (results.comparison.regressions.length > 0) {
        lines.push('### Regressions ⚠️');
        for (const r of results.comparison.regressions) {
          lines.push(`- \`${r}\``);
        }
        lines.push('');
      }

      if (results.comparison.improvements.length > 0) {
        lines.push('### Improvements ✨');
        for (const i of results.comparison.improvements) {
          lines.push(`- \`${i}\``);
        }
        lines.push('');
      }

      if (results.comparison.isRegression) {
        lines.push(`> ⚠️ **REGRESSION DETECTED:** ${results.comparison.regressionReason}`);
        lines.push('');
      }
    }

    // Failed tests details
    const failedTests = results.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      lines.push('## Failed Tests');
      lines.push('');
      lines.push('<details>');
      lines.push('<summary>Click to expand</summary>');
      lines.push('');

      for (const test of failedTests) {
        lines.push(`### \`${test.promptId}\``);
        lines.push(`**Score:** ${test.scores.overall}/100`);
        lines.push(`**Gate:** ${test.gateDecision}`);
        lines.push('');
        lines.push('**Failure reasons:**');
        for (const reason of test.failureReasons) {
          lines.push(`- ${reason}`);
        }
        lines.push('');
      }

      lines.push('</details>');
    }

    return lines.join('\n');
  }

  // ─────────────────────────────────────────────────────────────────
  // GITHUB COMMENT FORMAT
  // ─────────────────────────────────────────────────────────────────

  private formatGitHubComment(results: BenchmarkSuiteResult): string {
    const lines: string[] = [];

    // Header with status
    const statusEmoji = results.passRate >= 0.8 ? '✅' : '❌';
    lines.push(`## ${statusEmoji} AI Quality Benchmark Results`);
    lines.push('');

    // Key metrics table
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Pass Rate | **${(results.passRate * 100).toFixed(1)}%** |`);
    lines.push(`| Avg Score | **${results.avgQualityScore.toFixed(1)}**/100 |`);
    lines.push(`| Tests | ${results.passed}/${results.totalPrompts} passed |`);
    lines.push('');

    // Comparison (if available)
    if (results.comparison) {
      const scoreChange = results.comparison.scoreChange;
      const passChange = results.comparison.passRateChange * 100;

      const scoreSymbol = scoreChange >= 0 ? '📈' : '📉';
      const passSymbol = passChange >= 0 ? '📈' : '📉';

      lines.push('### vs Baseline');
      lines.push(`- ${scoreSymbol} Score: ${scoreChange >= 0 ? '+' : ''}${scoreChange.toFixed(1)} pts`);
      lines.push(`- ${passSymbol} Pass rate: ${passChange >= 0 ? '+' : ''}${passChange.toFixed(1)}%`);

      if (results.comparison.isRegression) {
        lines.push('');
        lines.push(`> ⚠️ **Regression:** ${results.comparison.regressionReason}`);
      }
    }

    // Footer
    lines.push('');
    lines.push('---');
    lines.push(`<sub>Run: \`${results.runId.slice(0, 16)}\` | Commit: \`${results.gitCommit.slice(0, 7)}\`</sub>`);

    return lines.join('\n');
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════

let reporterInstance: BenchmarkReporter | null = null;

export function getBenchmarkReporter(): BenchmarkReporter {
  if (!reporterInstance) {
    reporterInstance = new BenchmarkReporter();
  }
  return reporterInstance;
}
