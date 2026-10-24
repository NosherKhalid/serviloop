-- Demo data (M1).
--
-- `public.load_demo_data()` gives the signed-in user a ready-to-explore business: fictional
-- customers, technicians and jobs. It powers the "Load demo data" button, so anyone who signs up
-- (including a portfolio visitor) can see a populated app in one tap.
--
-- Design notes
--   * SECURITY INVOKER: the function runs with the CALLER's permissions, so row level security
--     still applies. It can only ever create data in the caller's own business.
--   * It never touches auth.users, and it needs no secret key.
--   * It refuses to run if the business already has any data, so tapping twice (or tapping on a
--     real business) cannot create duplicates or mix demo rows into real ones.
--   * Everything is fictional. Dates are relative to "now" so the demo never looks stale.
--   * Executable by signed-in users only (not by `anon`).

create function public.load_demo_data()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_business  uuid;
  v_today     timestamptz := date_trunc('day', now());
begin
  if v_uid is null then
    raise exception 'You must be signed in to load demo data.' using errcode = '28000';
  end if;

  -- Serialise concurrent calls from the same user (e.g. a double tap) for the rest of this transaction.
  perform pg_advisory_xact_lock(hashtext(v_uid::text));

  select id into v_business from public.businesses where owner_id = v_uid;

  if v_business is not null and (
       exists (select 1 from public.customers   where business_id = v_business)
    or exists (select 1 from public.technicians where business_id = v_business)
    or exists (select 1 from public.work_orders where business_id = v_business)
  ) then
    raise exception 'This business already has data. Demo data can only be loaded into an empty business.';
  end if;

  if v_business is null then
    insert into public.businesses (name) values ('Demo Plumbing Co.') returning id into v_business;
  end if;

  insert into public.customers (business_id, name, phone, address) values
    (v_business, 'Maple Street Bakery',        '555-0101', '12 Maple Street'),
    (v_business, 'Priya Natarajan',            '555-0102', '48 Orchard Lane'),
    (v_business, 'Harbor View Dental',         '555-0103', '3 Harbor Road, Suite 2'),
    (v_business, 'Tomás Rivera',               null,       '77 Cedar Court'),
    (v_business, 'Greenfield Community Hall',  '555-0105', null),
    (v_business, 'Amelia Brooks',              '555-0106', '9 Willow Way');

  insert into public.technicians (business_id, name, specialty, active) values
    (v_business, 'Sam Rivera', 'Plumbing',    true),
    (v_business, 'Ivy Chen',   'Electrical',  true),
    (v_business, 'Dana Okafor','Heating & HVAC', true);

  insert into public.work_orders
    (business_id, customer_id, technician_id, title, description, status, scheduled_for, completion_notes)
  select
    v_business, c.id, t.id, j.title, j.description, j.status, j.scheduled_for, j.completion_notes
  from (values
    ('Maple Street Bakery', 'Sam Rivera', 'Replace kitchen faucet',
       'Dripping mixer tap in the prep kitchen; customer supplies the new faucet.',
       'in_progress', v_today + interval '1 day 9 hours', null),
    ('Harbor View Dental', 'Dana Okafor', 'Annual boiler service',
       'Yearly service and safety check.',
       'open', v_today + interval '3 days 13 hours 30 minutes', null),
    ('Priya Natarajan', 'Sam Rivera', 'Fix leaking pipe under sink',
       'Slow leak under the kitchen sink reported by the customer.',
       'completed', v_today - interval '5 days' + interval '10 hours',
       'Found a corroded compression fitting under the kitchen sink. Replaced the fitting and a short section of supply line. Ran water for 20 minutes and checked for leaks, none found. Advised the customer to watch the cabinet floor for a week.'),
    ('Tomás Rivera', null, 'Install outdoor lighting',
       'Two wall lights by the back door. Date not agreed yet.',
       'open', null, null),
    ('Greenfield Community Hall', 'Sam Rivera', 'Unblock main drain',
       'Hall toilets backing up after events.',
       'completed', v_today - interval '7 days' + interval '8 hours',
       'Drain blocked by tree roots roughly 4 m from the access point. Cleared it with the drain machine and the flow is normal again. Possible small crack in the pipe at that point; recommended a follow-up inspection and repair quote.'),
    ('Amelia Brooks', null, 'Quote for bathroom refit',
       'Customer decided to postpone the work.',
       'cancelled', v_today - interval '3 days' + interval '15 hours', null)
  ) as j(customer_name, technician_name, title, description, status, scheduled_for, completion_notes)
  join public.customers c
    on c.business_id = v_business and c.name = j.customer_name
  left join public.technicians t
    on t.business_id = v_business and t.name = j.technician_name;

  return jsonb_build_object(
    'business_id', v_business,
    'customers',   (select count(*) from public.customers   where business_id = v_business),
    'technicians', (select count(*) from public.technicians where business_id = v_business),
    'jobs',        (select count(*) from public.work_orders where business_id = v_business)
  );
end;
$$;

-- Functions are executable by everyone by default. Allow signed-in users only.
revoke execute on function public.load_demo_data() from public, anon;
grant  execute on function public.load_demo_data() to authenticated;
