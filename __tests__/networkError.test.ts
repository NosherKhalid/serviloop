import { isNetworkProblem } from '@/utils/networkError';

describe('isNetworkProblem', () => {
  it('recognises requests that never reached the server', () => {
    expect(isNetworkProblem({ name: 'AuthRetryableFetchError', message: 'x' })).toBe(true);
    expect(isNetworkProblem({ status: 0 })).toBe(true);
    expect(isNetworkProblem(new TypeError('Network request failed'))).toBe(true);
    expect(isNetworkProblem({ message: 'TypeError: Failed to fetch' })).toBe(true);
    expect(isNetworkProblem({ message: 'The request timed out' })).toBe(true);
  });

  it('does not treat ordinary errors as network problems', () => {
    expect(isNetworkProblem({ code: 'invalid_credentials', status: 400 })).toBe(false);
    expect(isNetworkProblem({ message: 'duplicate key value' })).toBe(false);
    expect(isNetworkProblem(null)).toBe(false);
    expect(isNetworkProblem('Network request failed')).toBe(false); // plain strings are not errors we know how to read
  });
});
