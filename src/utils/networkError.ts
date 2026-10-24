// Shared by every feature that shows a friendly message for a failed request.
// True when the request never reached the server (offline, timeout, DNS), however the library reports it.
type ErrorLike = { status?: unknown; name?: unknown; message?: unknown };

export function isNetworkProblem(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const e = error as ErrorLike;
  return (
    e.name === 'AuthRetryableFetchError' ||
    e.status === 0 ||
    (typeof e.message === 'string' && /network request failed|failed to fetch|fetch failed|timed out|network error/i.test(e.message))
  );
}
