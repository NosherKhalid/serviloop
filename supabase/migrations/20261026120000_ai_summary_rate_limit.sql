-- AI summary rate limit (M5).
--
-- The `generate-job-summary` Edge Function calls a paid AI model. To stop one account from running up the
-- bill (or hammering the model), every request first "claims a slot": a small counter per signed-in user.
--
-- Design notes
--   * `ai_summary_usage` holds one row per request: who asked and when. It stores NO job text, no customer
--     data and no job id (so it cannot be used to probe which job ids exist).
--   * The table has row level security ON and NO privileges for `anon` or `authenticated` at all, so the
--     app cannot read, add, change or delete rows. The only way in is the function below.
--   * `claim_ai_summary_slot()` is SECURITY DEFINER because the table is locked. It is narrow on purpose:
--     the user is always `auth.uid()` (a caller cannot name someone else), `search_path` is pinned, and it
--     can only insert one row for that user. Signed-out callers are refused.
--   * A per-user advisory lock makes "count, then insert" atomic, so two simultaneous taps cannot both
--     squeeze under the limit (same technique as `load_demo_data`).
--   * Limits: 10 requests per hour and 30 per day, per user. Change the two constants below to tune them.
--   * Rows older than 7 days are deleted for that user whenever they claim a slot (no cron job needed).

create table public.ai_summary_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index ai_summary_usage_user_time_idx on public.ai_summary_usage (user_id, created_at desc);

-- RLS on, and deliberately no policies and no grants: nobody reaches this table through the API.
alter table public.ai_summary_usage enable row level security;
revoke all on table public.ai_summary_usage from public, anon, authenticated;

create function public.claim_ai_summary_slot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_hour_limit constant int := 10;
  c_day_limit  constant int := 30;
  v_uid        uuid := auth.uid();
  v_hour       int;
  v_day        int;
begin
  if v_uid is null then
    raise exception 'You must be signed in.' using errcode = '28000';
  end if;

  -- One caller at a time per user until this transaction ends.
  perform pg_advisory_xact_lock(hashtext('ai_summary:' || v_uid::text));

  delete from public.ai_summary_usage
   where user_id = v_uid and created_at < now() - interval '7 days';

  select count(*) filter (where created_at > now() - interval '1 hour'),
         count(*)
    into v_hour, v_day
    from public.ai_summary_usage
   where user_id = v_uid and created_at > now() - interval '1 day';

  if v_hour >= c_hour_limit or v_day >= c_day_limit then
    return jsonb_build_object(
      'allowed', false,
      'hour_remaining', greatest(c_hour_limit - v_hour, 0),
      'day_remaining', greatest(c_day_limit - v_day, 0)
    );
  end if;

  insert into public.ai_summary_usage (user_id) values (v_uid);

  return jsonb_build_object(
    'allowed', true,
    'hour_remaining', c_hour_limit - v_hour - 1,
    'day_remaining', c_day_limit - v_day - 1
  );
end;
$$;

-- Functions are executable by everyone by default. Allow signed-in users only.
revoke execute on function public.claim_ai_summary_slot() from public, anon;
grant  execute on function public.claim_ai_summary_slot() to authenticated;
