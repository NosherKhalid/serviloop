// Supabase Edge Function: generate-job-summary (M5).
//
// The app sends `{ "workOrderId": "<uuid>" }`. This function turns that job's completion notes into a short,
// customer-friendly summary DRAFT and returns it. It never saves anything: the owner edits the draft in the app
// and saves it through the normal row-level-security path.
//
// The order of the steps below is the security design:
//   1. Identity   - only a signed-in user gets past (platform JWT check + `createSupabaseContext`).
//   2. Input      - exactly `{ workOrderId }`, tiny, a UUID. Nothing else is accepted.
//   3. Ownership  - the job is read with the CALLER'S OWN client, so row-level security decides. A job that is
//                   not yours looks exactly like a job that does not exist (same 404).
//   4. Notes      - empty or oversized notes are refused before any money is spent.
//   5. Rate limit - `claim_ai_summary_slot()` (10/hour, 30/day per user), atomic in the database.
//   6. Model      - one call, 20 s timeout, no retries. No API key configured -> a clearly labelled MOCK summary.
// Only the job's title, description and notes ever reach the model: no customer or technician details.
// Errors returned to the app are fixed sentences; provider errors, SQL and keys are never returned or logged.
//
// Secrets (never in the app or git):  ANTHROPIC_API_KEY  (set with `npx supabase secrets set`).

import Anthropic from 'npm:@anthropic-ai/sdk@1.3.0';
import { createSupabaseContext } from 'npm:@supabase/server@1.9.2';

import {
  buildMockSummary,
  buildUserMessage,
  cleanSummary,
  failures,
  jobProblem,
  maxOutputTokens,
  model,
  parseRequestBody,
  providerTimeoutMs,
  slotAllowed,
  systemPrompt,
  type FailureCode,
  type JobForSummary,
  type SummarySource,
} from './logic.ts';

function fail(code: FailureCode): Response {
  const { status, message } = failures[code];
  return Response.json({ error: code, message }, { status });
}

// Calls the model once. Returns the cleaned summary, or a failure code. Never throws, never retries.
async function askModel(apiKey: string, job: JobForSummary): Promise<{ summary: string } | { failure: FailureCode }> {
  const client = new Anthropic({ apiKey, timeout: providerTimeoutMs, maxRetries: 0 });
  try {
    const message = await client.messages.create({
      model,
      max_tokens: maxOutputTokens,
      thinking: { type: 'disabled' }, // a short rewrite does not need reasoning; keeps cost and latency low
      system: systemPrompt,
      messages: [{ role: 'user', content: buildUserMessage(job) }],
    });
    if (message.stop_reason !== 'end_turn') {
      return { failure: 'unavailable' }; // refusal, cut-off or anything unexpected: do not show half a draft
    }
    const text = message.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
    const summary = cleanSummary(text);
    return summary === null ? { failure: 'unavailable' } : { summary };
  } catch (error) {
    // Log only the kind of failure, never the message (it could echo request details).
    const status = error instanceof Anthropic.APIError ? error.status : undefined;
    console.error('summary provider call failed', error instanceof Error ? error.name : 'unknown', status ?? '');
    return { failure: error instanceof Anthropic.APIConnectionTimeoutError ? 'timeout' : 'unavailable' };
  }
}

export default {
  fetch: async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'bad_request', message: failures.bad_request.message }, { status: 405 });
    }

    // 1. Identity
    const { data: ctx, error: authError } = await createSupabaseContext(req, { auth: 'user' });
    if (authError) {
      return fail('unauthorized');
    }

    // 2. Input
    const declaredLength = Number(req.headers.get('content-length') ?? '0');
    if (declaredLength > 1024) {
      return fail('bad_request');
    }
    const request = parseRequestBody(await req.text());
    if (!request.ok) {
      return fail('bad_request');
    }

    // 3. Ownership: row-level security means this only finds the caller's own job.
    const { data: job, error: jobError } = await ctx.supabase
      .from('work_orders')
      .select('title, description, completion_notes')
      .eq('id', request.workOrderId)
      .maybeSingle();
    if (jobError) {
      return fail('unavailable');
    }
    if (job === null) {
      return fail('not_found');
    }

    // 4. Notes
    const problem = jobProblem(job);
    if (problem !== null) {
      return fail(problem);
    }

    // 5. Rate limit (fails closed: if the counter cannot be read, no summary is made)
    const { data: slot, error: slotError } = await ctx.supabase.rpc('claim_ai_summary_slot');
    if (slotError) {
      return fail('unavailable');
    }
    if (!slotAllowed(slot)) {
      return fail('rate_limited');
    }

    // 6. Model, or the labelled mock when no key is configured
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (apiKey === undefined || apiKey === '') {
      const source: SummarySource = 'mock';
      return Response.json({ summary: buildMockSummary(job), source });
    }
    const result = await askModel(apiKey, job);
    if ('failure' in result) {
      return fail(result.failure);
    }
    const source: SummarySource = 'ai';
    return Response.json({ summary: result.summary, source });
  },
};
