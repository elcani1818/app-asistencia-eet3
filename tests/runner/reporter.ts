import * as fs from 'fs';
import * as path from 'path';
import { TestSuite, TestCase } from './framework';

export interface RunResults {
  totalSuites: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  tierBreakdown: Record<number, { passed: number; failed: number; skipped: number; total: number }>;
  featureBreakdown: Record<string, { passed: number; failed: number; skipped: number; total: number }>;
  failures: Array<{ suite: string; test: string; tier: number; featureId?: string; error: string; stack?: string }>;
}

export class TestReporter {
  private startTime: number = 0;

  startRun(): void {
    this.startTime = Date.now();
    console.log('\n========================================================================================');
    console.log('  E.E.S.T. N° 3 "Ntra. Sra. de la Merced" — E2E TEST SUITE RUNNER');
    console.log('  Autonomous Opaque-Box Verification System (Tiers 1, 2, 3, 4)');
    console.log('========================================================================================\n');
  }

  logSuite(suite: TestSuite): void {
    const tierName = this.getTierName(suite.tier);
    console.log(`\n▶ TIER ${suite.tier}: ${tierName.toUpperCase()} — ${suite.name}`);
  }

  logTest(test: TestCase): void {
    const duration = test.durationMs !== undefined ? `${test.durationMs}ms` : '';
    const featureTag = test.featureId ? ` [${test.featureId}]` : '';
    if (test.status === 'passed') {
      console.log(`  \x1b[32m✔\x1b[0m${featureTag} ${test.name} \x1b[90m(${duration})\x1b[0m`);
    } else if (test.status === 'failed') {
      console.log(`  \x1b[31m✖\x1b[0m${featureTag} ${test.name} \x1b[90m(${duration})\x1b[0m`);
      if (test.error) {
        console.log(`    \x1b[31mError: ${test.error.message}\x1b[0m`);
        if (test.error.stack) {
          const lines = test.error.stack.split('\n').slice(1, 4).map(l => `      ${l.trim()}`).join('\n');
          console.log(`\x1b[90m${lines}\x1b[0m`);
        }
      }
    } else {
      console.log(`  \x1b[33m-\x1b[0m${featureTag} ${test.name} \x1b[90m(skipped)\x1b[0m`);
    }
  }

  summarize(suites: TestSuite[], exportJson: boolean = false): RunResults {
    const durationMs = Date.now() - this.startTime;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let totalTests = 0;

    const tierBreakdown: Record<number, { passed: number; failed: number; skipped: number; total: number }> = {
      1: { passed: 0, failed: 0, skipped: 0, total: 0 },
      2: { passed: 0, failed: 0, skipped: 0, total: 0 },
      3: { passed: 0, failed: 0, skipped: 0, total: 0 },
      4: { passed: 0, failed: 0, skipped: 0, total: 0 },
    };

    const featureBreakdown: Record<string, { passed: number; failed: number; skipped: number; total: number }> = {};
    const failures: Array<{ suite: string; test: string; tier: number; featureId?: string; error: string; stack?: string }> = [];

    for (const suite of suites) {
      for (const t of suite.tests) {
        totalTests++;
        const tier = t.tier || suite.tier || 1;
        if (!tierBreakdown[tier]) {
          tierBreakdown[tier] = { passed: 0, failed: 0, skipped: 0, total: 0 };
        }
        tierBreakdown[tier].total++;

        if (t.featureId) {
          if (!featureBreakdown[t.featureId]) {
            featureBreakdown[t.featureId] = { passed: 0, failed: 0, skipped: 0, total: 0 };
          }
          featureBreakdown[t.featureId].total++;
        }

        if (t.status === 'passed') {
          passed++;
          tierBreakdown[tier].passed++;
          if (t.featureId) featureBreakdown[t.featureId].passed++;
        } else if (t.status === 'failed') {
          failed++;
          tierBreakdown[tier].failed++;
          if (t.featureId) featureBreakdown[t.featureId].failed++;
          failures.push({
            suite: suite.name,
            test: t.name,
            tier,
            featureId: t.featureId,
            error: t.error?.message || 'Unknown error',
            stack: t.error?.stack
          });
        } else {
          skipped++;
          tierBreakdown[tier].skipped++;
          if (t.featureId) featureBreakdown[t.featureId].skipped++;
        }
      }
    }

    const results: RunResults = {
      totalSuites: suites.length,
      totalTests,
      passed,
      failed,
      skipped,
      durationMs,
      tierBreakdown,
      featureBreakdown,
      failures
    };

    // Print Final Scorecard
    console.log('\n========================================================================================');
    console.log('  TEST EXECUTION SCORECARD & COMPLIANCE SUMMARY');
    console.log('========================================================================================');
    console.log(`  Tier 1: Feature Coverage (F-01..F-20 / R1-R5) : ${this.pad(tierBreakdown[1].passed)} Passed | ${this.pad(tierBreakdown[1].failed)} Failed | ${this.pad(tierBreakdown[1].skipped)} Skipped`);
    console.log(`  Tier 2: Boundary, Math & RLS Security Cases   : ${this.pad(tierBreakdown[2].passed)} Passed | ${this.pad(tierBreakdown[2].failed)} Failed | ${this.pad(tierBreakdown[2].skipped)} Skipped`);
    console.log(`  Tier 3: Pairwise Combinations & Realtime Sync : ${this.pad(tierBreakdown[3].passed)} Passed | ${this.pad(tierBreakdown[3].failed)} Failed | ${this.pad(tierBreakdown[3].skipped)} Skipped`);
    console.log(`  Tier 4: Real-World Workload & Export Fidelity : ${this.pad(tierBreakdown[4].passed)} Passed | ${this.pad(tierBreakdown[4].failed)} Failed | ${this.pad(tierBreakdown[4].skipped)} Skipped`);
    console.log('  --------------------------------------------------------------------------------------');
    const passRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(2) : '0.00';
    console.log(`  TOTAL TEST CASES                              : ${this.pad(passed)} Passed | ${this.pad(failed)} Failed | ${this.pad(skipped)} Skipped (${passRate}% PASS)`);
    console.log(`  Execution Time                                : ${durationMs} ms`);
    console.log(`  Exit Status                                   : ${failed === 0 ? '\x1b[32m0 (SUCCESS / READY FOR PRODUCTION)\x1b[0m' : '\x1b[31m1 (FAILED)\x1b[0m'}`);
    console.log('========================================================================================\n');

    if (exportJson) {
      const outputPath = path.resolve(process.cwd(), 'test-results.json');
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
      console.log(`Structured test results exported to: ${outputPath}\n`);
    }

    return results;
  }

  private pad(n: number): string {
    return n.toString().padStart(3, ' ');
  }

  private getTierName(tier: number): string {
    switch (tier) {
      case 1: return 'Feature Coverage (F-01 to F-20)';
      case 2: return 'Boundary & Security Invariants';
      case 3: return 'Pairwise & System Realtime Interactions';
      case 4: return 'Real-World Workloads & Export Fidelity';
      default: return `Tier ${tier}`;
    }
  }
}
