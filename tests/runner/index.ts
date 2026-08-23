import { TestRegistry, TestSuite, TestCase } from './framework';
import { TestReporter, RunResults } from './reporter';

export interface CliOptions {
  tier?: number | 'all';
  feature?: string;
  filter?: string;
  adapter?: 'mock' | 'supabase';
  json?: boolean;
  verbose?: boolean;
  bail?: boolean;
}

export function parseCliArgs(args: string[] = process.argv.slice(2)): CliOptions {
  const options: CliOptions = {
    tier: 'all',
    adapter: 'mock',
    json: false,
    verbose: false,
    bail: false
  };

  for (const arg of args) {
    if (arg.startsWith('--tier=')) {
      const val = arg.split('=')[1];
      options.tier = val === 'all' ? 'all' : parseInt(val, 10);
    } else if (arg.startsWith('--feature=')) {
      options.feature = arg.split('=')[1];
    } else if (arg.startsWith('--filter=')) {
      options.filter = arg.split('=')[1];
    } else if (arg.startsWith('--adapter=')) {
      options.adapter = arg.split('=')[1] as any;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--bail') {
      options.bail = true;
    }
  }

  return options;
}

export async function loadSuites(tierFilter?: number | 'all'): Promise<void> {
  const registry = TestRegistry.getInstance();
  registry.clear();

  const runTier1 = tierFilter === 'all' || tierFilter === 1 || tierFilter === undefined;
  const runTier2 = tierFilter === 'all' || tierFilter === 2 || tierFilter === undefined;
  const runTier3 = tierFilter === 'all' || tierFilter === 3 || tierFilter === undefined;
  const runTier4 = tierFilter === 'all' || tierFilter === 4 || tierFilter === undefined;

  if (runTier1) {
    await import('../tier1_feature_coverage/auth_roles.test');
    await import('../tier1_feature_coverage/attendance_form.test');
    await import('../tier1_feature_coverage/dashboard_table.test');
    await import('../tier1_feature_coverage/export_engine.test');
    await import('../tier1_feature_coverage/course_admin.test');
  }

  if (runTier2) {
    await import('../tier2_boundaries/math_boundaries.test');
    await import('../tier2_boundaries/date_boundaries.test');
    await import('../tier2_boundaries/rls_security_boundaries.test');
    await import('../tier2_boundaries/m3_challenger_stress.test');
  }

  if (runTier3) {
    await import('../tier3_pairwise/teacher_to_admin_flow.test');
    await import('../tier3_pairwise/course_edit_to_totals.test');
    await import('../tier3_pairwise/multi_shift_parte_general.test');
  }

  if (runTier4) {
    await import('../tier4_real_world/full_school_daily_cycle.test');
    await import('../tier4_real_world/export_fidelity_workload.test');
  }
}

export async function runAllTests(options: CliOptions = {}): Promise<RunResults> {
  const reporter = new TestReporter();
  reporter.startRun();

  await loadSuites(options.tier);
  const registry = TestRegistry.getInstance();
  const suites = registry.suites;

  const filterRegex = options.filter ? new RegExp(options.filter, 'i') : null;

  for (const suite of suites) {
    reporter.logSuite(suite);

    // Run beforeAll hooks
    for (const hook of suite.beforeAllHooks) {
      try {
        await hook();
      } catch (err: any) {
        console.error(`  \x1b[31m[beforeAll Hook Failed]\x1b[0m ${err?.message || err}`);
      }
    }

    for (const testCase of suite.tests) {
      // Apply filters
      if (options.feature && testCase.featureId !== options.feature) {
        testCase.status = 'skipped';
        continue;
      }
      if (filterRegex && !filterRegex.test(testCase.name)) {
        testCase.status = 'skipped';
        continue;
      }

      // Run beforeEach hooks
      for (const hook of suite.beforeEachHooks) {
        try {
          await hook();
        } catch (err: any) {
          console.error(`  \x1b[31m[beforeEach Hook Failed]\x1b[0m ${err?.message || err}`);
        }
      }

      const start = Date.now();
      try {
        await testCase.fn();
        testCase.status = 'passed';
        testCase.durationMs = Date.now() - start;
      } catch (err: any) {
        testCase.status = 'failed';
        testCase.error = err instanceof Error ? err : new Error(String(err));
        testCase.durationMs = Date.now() - start;
      }

      reporter.logTest(testCase);

      // Run afterEach hooks
      for (const hook of suite.afterEachHooks) {
        try {
          await hook();
        } catch (err: any) {
          console.error(`  \x1b[31m[afterEach Hook Failed]\x1b[0m ${err?.message || err}`);
        }
      }

      if (options.bail && testCase.status === 'failed') {
        console.log('\n\x1b[31m[BAIL] Terminating run immediately upon first failure.\x1b[0m\n');
        break;
      }
    }

    // Run afterAll hooks
    for (const hook of suite.afterAllHooks) {
      try {
        await hook();
      } catch (err: any) {
        console.error(`  \x1b[31m[afterAll Hook Failed]\x1b[0m ${err?.message || err}`);
      }
    }
  }

  const results = reporter.summarize(suites, options.json);
  return results;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const options = parseCliArgs();
  runAllTests(options).then(results => {
    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }).catch(err => {
    console.error('Fatal Runner Error:', err);
    process.exit(1);
  });
}
