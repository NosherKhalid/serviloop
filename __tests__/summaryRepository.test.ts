import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

const mockInvoke = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: { functions: { invoke: (...args: unknown[]) => mockInvoke(...args) } } }));

import { generateJobSummary, SummaryError, type SummaryErrorCode } from '@/repositories/summaryRepository';

beforeEach(() => {
  jest.clearAllMocks();
});

function httpError(status: number, body: unknown) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new FunctionsHttpError(new Response(text, { status }));
}

async function failureOf(promise: Promise<unknown>): Promise<SummaryError> {
  try {
    await promise;
  } catch (caught) {
    if (caught instanceof SummaryError) {
      return caught;
    }
    throw caught;
  }
  throw new Error('expected the call to fail');
}

describe('generateJobSummary (calls the Edge Function; boundary mocked)', () => {
  it('sends only the job id and returns the draft with where it came from', async () => {
    mockInvoke.mockResolvedValue({ data: { summary: 'We replaced the washer.', source: 'ai' }, error: null });

    const result = await generateJobSummary('w1');

    expect(result).toEqual({ summary: 'We replaced the washer.', source: 'ai' });
    expect(mockInvoke).toHaveBeenCalledWith('generate-job-summary', { body: { workOrderId: 'w1' }, timeout: 30_000 });
  });

  it('passes the "mock" label through untouched', async () => {
    mockInvoke.mockResolvedValue({ data: { summary: 'Demo text.', source: 'mock' }, error: null });

    expect((await generateJobSummary('w1')).source).toBe('mock');
  });

  it.each<[SummaryErrorCode, number]>([
    ['unauthorized', 401],
    ['not_found', 404],
    ['empty_notes', 422],
    ['too_long', 422],
    ['rate_limited', 429],
    ['timeout', 504],
    ['unavailable', 503],
  ])('turns the function\'s "%s" refusal (HTTP %i) into a friendly sentence', async (code, status) => {
    mockInvoke.mockResolvedValue({ data: null, error: httpError(status, { error: code, message: 'server text' }) });

    const error = await failureOf(generateJobSummary('w1'));

    expect(error.code).toBe(code);
    expect(error.userMessage.length).toBeGreaterThan(10);
    expect(error.userMessage).not.toMatch(/server text/);
  });

  it('never shows server or provider text, even when the function sends some', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: httpError(503, { error: 'unavailable', message: 'relation "work_orders" exploded: invalid x-api-key sk-ant-123' }),
    });

    const error = await failureOf(generateJobSummary('w1'));

    expect(error.userMessage).not.toMatch(/exploded|x-api-key|sk-ant|relation/);
  });

  it('falls back to the HTTP status when the body is not the expected JSON', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: httpError(429, 'Too Many Requests') });
    expect((await failureOf(generateJobSummary('w1'))).code).toBe('rate_limited');

    mockInvoke.mockResolvedValue({ data: null, error: httpError(401, '<html>nope</html>') });
    expect((await failureOf(generateJobSummary('w1'))).code).toBe('unauthorized');

    mockInvoke.mockResolvedValue({ data: null, error: httpError(500, { error: 'something_unknown' }) });
    expect((await failureOf(generateJobSummary('w1'))).code).toBe('unavailable');
  });

  it('says the connection is down when the request cannot be sent', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new FunctionsFetchError(new TypeError('Network request failed')) });
    expect((await failureOf(generateJobSummary('w1'))).code).toBe('offline');

    mockInvoke.mockResolvedValue({ data: null, error: new TypeError('Network request failed') });
    expect((await failureOf(generateJobSummary('w1'))).code).toBe('offline');
  });

  it.each([
    ['no summary', { source: 'ai' }],
    ['an empty summary', { summary: '', source: 'ai' }],
    ['an unknown source', { summary: 'Text', source: 'human' }],
    ['a summary over the 2000 limit', { summary: 'a'.repeat(2001), source: 'ai' }],
    ['no body at all', null],
    ['a string instead of an object', 'ok'],
  ])('treats %s as unavailable instead of showing it', async (_name, data) => {
    mockInvoke.mockResolvedValue({ data, error: null });

    expect((await failureOf(generateJobSummary('w1'))).code).toBe('unavailable');
  });
});
