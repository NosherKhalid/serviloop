// Test-only helper (never imported by the app): a recording stand-in for the Supabase query builder.
// Every call is remembered so a test can check exactly what a repository asks the database for.
//
// Usage in a test file:
//   jest.mock('@/lib/supabase', () => ({ supabase: require('@/testing/mockSupabase').mockDb.client }));
//   import { mockDb } from '@/testing/mockSupabase';
//   mockDb.result = { data: [...], error: null };

type Result = { data: unknown; error: unknown };
type Call = { method: string; args: unknown[] };

const calls: Call[] = [];

function createBuilder(): Record<string, unknown> {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'returns']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder.single = () => Promise.resolve(mockDb.result);
  builder.maybeSingle = () => Promise.resolve(mockDb.result);
  // `await builder` (a list query with no .single()) resolves to the result.
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(mockDb.result).then(resolve);
  return builder;
}

export const mockDb = {
  result: { data: null, error: null } as Result,
  calls,
  client: {
    from: (table: string) => {
      calls.push({ method: 'from', args: [table] });
      return createBuilder();
    },
  },
  // The arguments of every call to `method`, in order.
  called(method: string): unknown[][] {
    return calls.filter((call) => call.method === method).map((call) => call.args);
  },
  reset() {
    calls.length = 0;
    mockDb.result = { data: null, error: null };
  },
};
