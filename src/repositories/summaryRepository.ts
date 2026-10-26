import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import { z } from 'zod';

import { supabase } from '@/lib/supabase';
import { isNetworkProblem } from '@/utils/networkError';

// Asks the `generate-job-summary` Edge Function for a DRAFT summary of one job. The app sends only the job's id:
// the function loads the notes itself (after checking the job is yours), so the app can never send arbitrary text
// to the AI, and the AI key never leaves the server. Nothing is saved here.

export type SummarySource = 'ai' | 'mock';

// The reply is data from the network, so it is checked at runtime (types are erased).
const replySchema = z.object({
  summary: z.string().min(1).max(2000),
  source: z.enum(['ai', 'mock']),
});
export type JobSummary = z.infer<typeof replySchema>;

export type SummaryErrorCode =
  | 'unauthorized'
  | 'not_found'
  | 'empty_notes'
  | 'too_long'
  | 'rate_limited'
  | 'timeout'
  | 'unavailable'
  | 'offline';

// Fixed sentences written here, never the server's or the provider's text.
const messages: Record<SummaryErrorCode, string> = {
  unauthorized: 'Your session has expired. Please sign in again.',
  not_found: 'This job could not be found. It may have been removed.',
  empty_notes: 'Add completion notes to the job and save them, then generate the summary.',
  too_long: 'The notes are too long to summarise. Shorten them and try again.',
  rate_limited: "You've reached the summary limit for now. Please try again later.",
  timeout: 'The summary took too long. Please try again.',
  unavailable: "We couldn't write a summary right now. Please try again later.",
  offline: "We can't reach the server. Check your connection and try again.",
};

export class SummaryError extends Error {
  readonly code: SummaryErrorCode;

  constructor(code: SummaryErrorCode) {
    super(code);
    this.name = 'SummaryError';
    this.code = code;
  }

  get userMessage(): string {
    return messages[this.code];
  }
}

const knownCodes = Object.keys(messages);

function isCode(value: unknown): value is SummaryErrorCode {
  return typeof value === 'string' && knownCodes.includes(value);
}

// The function answers a refusal with `{ error: '<code>', message }`; the HTTP status is the fallback.
async function codeFromResponse(response: Response): Promise<SummaryErrorCode> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null) {
      const code = Object.entries(body).find(([key]) => key === 'error')?.[1];
      if (isCode(code)) {
        return code;
      }
    }
  } catch {
    // not JSON: fall through to the status
  }
  if (response.status === 401) return 'unauthorized';
  if (response.status === 404) return 'not_found';
  if (response.status === 429) return 'rate_limited';
  if (response.status === 504) return 'timeout';
  return 'unavailable';
}

async function toSummaryError(error: unknown): Promise<SummaryError> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    return new SummaryError(await codeFromResponse(error.context));
  }
  if (error instanceof FunctionsFetchError || isNetworkProblem(error)) {
    return new SummaryError('offline');
  }
  return new SummaryError('unavailable');
}

export async function generateJobSummary(workOrderId: string): Promise<JobSummary> {
  // 30 s: a little longer than the function's own 20 s model timeout, so its friendly answer arrives first.
  const { data, error } = await supabase.functions.invoke('generate-job-summary', {
    body: { workOrderId },
    timeout: 30_000,
  });
  if (error) {
    throw await toSummaryError(error);
  }
  const reply = replySchema.safeParse(data);
  if (!reply.success) {
    throw new SummaryError('unavailable');
  }
  return reply.data;
}
