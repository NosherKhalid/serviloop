// Test-only helper (never imported by the app): a recording stand-in for the Supabase query builder.
// Every call is remembered so a test can check exactly what a repository asks the database for.
//
// Usage in a test file:
//   jest.mock('@/lib/supabase', () => ({ supabase: require('@/testing/mockSupabase').mockDb.client }));
//   import { mockDb } from '@/testing/mockSupabase';
//   mockDb.result = { data: [...], error: null };

type Result = { data: unknown; error: unknown; count?: number | null };
type Call = { method: string; args: unknown[] };

const calls: Call[] = [];

// Several requests sent at once (e.g. four count queries) can each get their own answer: results are handed out in
// the order the requests are awaited. When the queue is empty every request gets `mockDb.result`.
const queue: Result[] = [];

function nextResult(): Result {
  return queue.shift() ?? mockDb.result;
}

function createBuilder(): Record<string, unknown> {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'limit', 'returns']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder.single = () => Promise.resolve(nextResult());
  builder.maybeSingle = () => Promise.resolve(nextResult());
  // `await builder` (a list query with no .single()) resolves to the result.
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(nextResult()).then(resolve);
  return builder;
}

export const mockDb = {
  result: { data: null, error: null } as Result,
  calls,
  queue,
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
    queue.length = 0;
    mockDb.result = { data: null, error: null };
  },
};
