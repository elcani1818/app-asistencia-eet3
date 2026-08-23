/**
 * Standalone High-Performance Test Framework Engine
 * Escuela de Educación Secundaria Técnica N° 3 — "Ntra. Sra. de la Merced"
 */

export type TestFn = () => Promise<void> | void;
export type HookFn = () => Promise<void> | void;

export interface TestCase {
  name: string;
  fn: TestFn;
  tier: number;
  featureId?: string;
  durationMs?: number;
  status: 'passed' | 'failed' | 'skipped';
  error?: Error;
}

export interface TestSuite {
  name: string;
  tier: number;
  tests: TestCase[];
  beforeAllHooks: HookFn[];
  beforeEachHooks: HookFn[];
  afterEachHooks: HookFn[];
  afterAllHooks: HookFn[];
}

export class TestRegistry {
  private static instance: TestRegistry;
  public suites: TestSuite[] = [];
  public currentSuite: TestSuite | null = null;
  public currentTier: number = 1;

  public static getInstance(): TestRegistry {
    if (!TestRegistry.instance) {
      TestRegistry.instance = new TestRegistry();
    }
    return TestRegistry.instance;
  }

  public registerSuite(name: string, tier: number): TestSuite {
    const suite: TestSuite = {
      name,
      tier,
      tests: [],
      beforeAllHooks: [],
      beforeEachHooks: [],
      afterEachHooks: [],
      afterAllHooks: [],
    };
    this.suites.push(suite);
    this.currentSuite = suite;
    return suite;
  }

  public clear(): void {
    this.suites = [];
    this.currentSuite = null;
  }
}

export function describe(name: string, fn: () => void, tier: number = 1): void {
  const registry = TestRegistry.getInstance();
  const prevTier = registry.currentTier;
  registry.currentTier = tier;
  const suite = registry.registerSuite(name, tier);
  fn();
  registry.currentSuite = null;
  registry.currentTier = prevTier;
}

export function test(name: string, fn: TestFn, featureId?: string): void {
  const registry = TestRegistry.getInstance();
  let suite = registry.currentSuite;
  if (!suite) {
    suite = registry.registerSuite('Default Suite', registry.currentTier);
  }
  suite.tests.push({
    name,
    fn,
    tier: suite.tier,
    featureId,
    status: 'skipped'
  });
}

export const it = test;

export function beforeAll(fn: HookFn): void {
  const registry = TestRegistry.getInstance();
  if (registry.currentSuite) registry.currentSuite.beforeAllHooks.push(fn);
}

export function beforeEach(fn: HookFn): void {
  const registry = TestRegistry.getInstance();
  if (registry.currentSuite) registry.currentSuite.beforeEachHooks.push(fn);
}

export function afterEach(fn: HookFn): void {
  const registry = TestRegistry.getInstance();
  if (registry.currentSuite) registry.currentSuite.afterEachHooks.push(fn);
}

export function afterAll(fn: HookFn): void {
  const registry = TestRegistry.getInstance();
  if (registry.currentSuite) registry.currentSuite.afterAllHooks.push(fn);
}

// Fluent Assertion Engine
export function expect<T>(actual: T) {
  const createMatchers = (isNot: boolean) => ({
    toBe(expected: any) {
      const match = Object.is(actual, expected) || actual === expected;
      if (isNot ? match : !match) {
        throw new Error(
          isNot
            ? `Expected value NOT to be ${JSON.stringify(expected)}`
            : `Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`
        );
      }
    },
    toEqual(expected: any) {
      const actualJson = JSON.stringify(actual);
      const expectedJson = JSON.stringify(expected);
      const match = actualJson === expectedJson;
      if (isNot ? match : !match) {
        throw new Error(
          isNot
            ? `Expected objects NOT to deeply equal:\n${expectedJson}`
            : `Expected deep equality:\nExpected: ${expectedJson}\nReceived: ${actualJson}`
        );
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      const match = typeof actual === 'number' && actual >= expected;
      if (isNot ? match : !match) {
        throw new Error(`Expected ${actual} ${isNot ? '<' : '>='} ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      const match = typeof actual === 'number' && actual <= expected;
      if (isNot ? match : !match) {
        throw new Error(`Expected ${actual} ${isNot ? '>' : '<='} ${expected}`);
      }
    },
    toBeGreaterThan(expected: number) {
      const match = typeof actual === 'number' && actual > expected;
      if (isNot ? match : !match) {
        throw new Error(`Expected ${actual} ${isNot ? '<=' : '>'} ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      const match = typeof actual === 'number' && actual < expected;
      if (isNot ? match : !match) {
        throw new Error(`Expected ${actual} ${isNot ? '>=' : '<'} ${expected}`);
      }
    },
    toBeTruthy() {
      const match = Boolean(actual);
      if (isNot ? match : !match) {
        throw new Error(`Expected ${JSON.stringify(actual)} ${isNot ? 'NOT to be truthy' : 'to be truthy'}`);
      }
    },
    toBeFalsy() {
      const match = !Boolean(actual);
      if (isNot ? match : !match) {
        throw new Error(`Expected ${JSON.stringify(actual)} ${isNot ? 'NOT to be falsy' : 'to be falsy'}`);
      }
    },
    toBeNull() {
      const match = actual === null;
      if (isNot ? match : !match) {
        throw new Error(`Expected value ${isNot ? 'NOT to be null' : 'to be null'}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeDefined() {
      const match = actual !== undefined;
      if (isNot ? match : !match) {
        throw new Error(`Expected value ${isNot ? 'to be undefined' : 'to be defined'}`);
      }
    },
    toBeUndefined() {
      const match = actual === undefined;
      if (isNot ? match : !match) {
        throw new Error(`Expected value ${isNot ? 'NOT to be undefined' : 'to be undefined'}, got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expectedItem: any) {
      let match = false;
      if (typeof actual === 'string') {
        match = actual.includes(String(expectedItem));
      } else if (Array.isArray(actual)) {
        match = actual.some(item => {
          if (item === expectedItem) return true;
          try {
            return JSON.stringify(item) === JSON.stringify(expectedItem);
          } catch {
            return false;
          }
        });
      }
      if (isNot ? match : !match) {
        throw new Error(
          isNot
            ? `Expected collection NOT to contain ${JSON.stringify(expectedItem)}`
            : `Expected collection to contain ${JSON.stringify(expectedItem)}, but was not found in ${JSON.stringify(actual)}`
        );
      }
    },
    toMatch(pattern: RegExp | string) {
      if (typeof actual !== 'string') {
        throw new Error(`expect(actual).toMatch requires a string, received ${typeof actual}`);
      }
      const match = pattern instanceof RegExp ? pattern.test(actual) : actual.includes(pattern);
      if (isNot ? match : !match) {
        throw new Error(
          isNot
            ? `Expected string NOT to match pattern ${pattern}`
            : `Expected "${actual}" to match pattern ${pattern}`
        );
      }
    },
    toThrow(expectedPattern?: RegExp | string) {
      if (typeof actual !== 'function') {
        throw new Error('expect(fn).toThrow requires a function');
      }
      let didThrow = false;
      let errorMsg = '';
      try {
        (actual as any)();
      } catch (err: any) {
        didThrow = true;
        errorMsg = err?.message || String(err);
      }
      if (!didThrow) {
        if (!isNot) {
          throw new Error('Expected function to throw an error, but it succeeded.');
        }
        return;
      }
      if (isNot) {
        throw new Error(`Expected function NOT to throw, but it threw: "${errorMsg}"`);
      }
      if (expectedPattern) {
        const matches = expectedPattern instanceof RegExp
          ? expectedPattern.test(errorMsg)
          : errorMsg.includes(expectedPattern);
        if (!matches) {
          throw new Error(`Expected error message matching ${expectedPattern}, but got: "${errorMsg}"`);
        }
      }
    }
  });

  return {
    ...createMatchers(false),
    not: createMatchers(true),
    rejects: {
      async toThrow(expectedPattern?: RegExp | string) {
        if (!(actual instanceof Promise)) {
          throw new Error('expect(promise).rejects requires a Promise');
        }
        let didThrow = false;
        let errorMsg = '';
        try {
          await actual;
        } catch (err: any) {
          didThrow = true;
          errorMsg = err?.message || String(err);
        }
        if (!didThrow) {
          throw new Error('Expected Promise to reject, but it resolved successfully.');
        }
        if (expectedPattern) {
          const matches = expectedPattern instanceof RegExp
            ? expectedPattern.test(errorMsg)
            : errorMsg.includes(expectedPattern);
          if (!matches) {
            throw new Error(`Expected rejection matching ${expectedPattern}, but got: "${errorMsg}"`);
          }
        }
      }
    },
    resolves: {
      async toBe(expected: any) {
        if (!(actual instanceof Promise)) {
          throw new Error('expect(promise).resolves requires a Promise');
        }
        const resolvedVal = await actual;
        if (resolvedVal !== expected) {
          throw new Error(`Expected promise to resolve to ${JSON.stringify(expected)}, got ${JSON.stringify(resolvedVal)}`);
        }
      }
    }
  };
}
