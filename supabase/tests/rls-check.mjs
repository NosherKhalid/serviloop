// Serviloop security check: proves one business cannot read or change another's data.
//
// Runs against the HOSTED project in .env, over the same public HTTP API the mobile app uses,
// with only the PUBLISHABLE key (no secret key is needed or accepted). It signs up three throwaway
// users, tries to attack data across accounts, and prints PASS/FAIL for each case.
//
//   npm run test:rls
//
// Requirements: Node 20+, email confirmation OFF in Supabase (so sign-up returns a session).
// Throwaway users (rls-test-*@example.com) stay in Auth afterwards: deleting users needs a secret key.
// This script never prints keys or tokens.

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key || url.includes('YOUR_PROJECT') || key.includes('YOUR_PUBLISHABLE')) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Fill in .env (see .env.example).');
  process.exit(2);
}
if (!key.startsWith('sb_publishable_')) {
  console.error('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be the publishable key (sb_publishable_...). Refusing to run with any other key.');
  process.exit(2);
}
const base = url.replace(/\/$/, '');

// ---------------------------------------------------------------------------------------------
// tiny HTTP helpers
// ---------------------------------------------------------------------------------------------
async function http(path, { method = 'GET', token, body, prefer } = {}) {
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  return { status: res.status, json };
}
const rest = (method, path, token, body) =>
  http(`/rest/v1/${path}`, { method, token, body, prefer: 'return=representation' });
const rpc = (name, token) => http(`/rest/v1/rpc/${name}`, { method: 'POST', token, body: {} });

async function signUp(label) {
  const random = Math.random().toString(36).slice(2, 10);
  const email = `rls-test-${Date.now()}-${label}-${random}@example.com`;
  const password = `Pw-${random}-${Math.random().toString(36).slice(2, 12)}`; // never printed
  const r = await http('/auth/v1/signup', { method: 'POST', body: { email, password } });
  const token = r.json?.access_token ?? r.json?.session?.access_token;
  if (!token) {
    console.error(`Sign-up for test user ${label} did not return a session (HTTP ${r.status}: ${r.json?.msg ?? r.json?.message ?? r.json?.error_description ?? 'unknown'}).`);
    console.error('Check that "Confirm email" is OFF (Authentication > Sign In / Providers > Email) and that you have not hit the sign-up rate limit.');
    process.exit(2);
  }
  return token;
}

// ---------------------------------------------------------------------------------------------
// assertions: every "rejected" case must fail with a SPECIFIC database error code, so a typo or
// network problem cannot masquerade as a security win.
// ---------------------------------------------------------------------------------------------
const results = [];
let group = '';
const section = (name) => { group = name; console.log(`\n${name}`); };
function record(ok, label, detail) {
  results.push({ ok, group, label, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
}
const brief = (r) => `HTTP ${r.status}${r.json?.code ? ` ${r.json.code}` : ''}`;

// A request is "rejected" when the database answers with an error carrying one of `codes`.
function expectRejected(label, r, codes) {
  const ok = r.status >= 400 && codes.includes(r.json?.code);
  record(ok, label, ok ? `rejected: ${brief(r)}` : `expected one of ${codes.join('/')}, got ${brief(r)}`);
}
// A request is "invisible" when it succeeds but sees/changes no rows.
function expectNoRows(label, r) {
  const ok = r.status === 200 && Array.isArray(r.json) && r.json.length === 0;
  record(ok, label, ok ? 'matched 0 rows' : `expected 200 with 0 rows, got ${brief(r)} ${Array.isArray(r.json) ? r.json.length + ' rows' : ''}`);
}
function expectOk(label, r, check) {
  const ok = r.status >= 200 && r.status < 300 && (check ? check(r.json) : true);
  record(ok, label, ok ? brief(r) : `got ${brief(r)} ${r.json?.message ?? ''}`);
  return r.json;
}

const RLS_OR_GRANT = ['42501'];   // insufficient_privilege: covers both "permission denied" and RLS violations
const FOREIGN_KEY = ['23503'];
const CHECK_FAIL = ['23514'];
const UNIQUE = ['23505'];

// ---------------------------------------------------------------------------------------------
console.log('Serviloop security check (hosted project, publishable key only)');
const tokenA = await signUp('a');
const tokenB = await signUp('b');
const tokenC = await signUp('c');
console.log('Created 3 throwaway users: A, B (security tests) and C (demo data).');

// ---------------------------------------------------------------------------------------------
section('1. Setup: A and B each build their own business');
const [bizA] = expectOk('A creates a business', await rest('POST', 'businesses', tokenA, { name: 'Alpha Plumbing' }), (j) => j?.length === 1) ?? [];
const [bizB] = expectOk('B creates a business', await rest('POST', 'businesses', tokenB, { name: 'Beta Electric' }), (j) => j?.length === 1) ?? [];
if (!bizA || !bizB) { console.error('Setup failed; cannot continue.'); process.exit(1); }
const [custA] = expectOk('A adds a customer', await rest('POST', 'customers', tokenA, { business_id: bizA.id, name: 'Maple Bakery', phone: '555-0101' })) ?? [];
const [techA] = expectOk('A adds a technician', await rest('POST', 'technicians', tokenA, { business_id: bizA.id, name: 'Sam Rivera' })) ?? [];
const [jobA] = expectOk('A creates a job', await rest('POST', 'work_orders', tokenA, { business_id: bizA.id, customer_id: custA?.id, technician_id: techA?.id, title: 'Replace faucet' })) ?? [];
const [custB] = expectOk('B adds a customer', await rest('POST', 'customers', tokenB, { business_id: bizB.id, name: 'Harbor Dental' })) ?? [];
const [techB] = expectOk('B adds a technician', await rest('POST', 'technicians', tokenB, { business_id: bizB.id, name: 'Ivy Chen' })) ?? [];
if (!custA || !techA || !jobA || !custB || !techB) { console.error('Setup failed; cannot continue.'); process.exit(1); }

// ---------------------------------------------------------------------------------------------
section('2. Reading: B cannot see A\'s data');
const bView = {
  customers: (await rest('GET', 'customers?select=id', tokenB)).json,
  technicians: (await rest('GET', 'technicians?select=id', tokenB)).json,
  jobs: (await rest('GET', 'work_orders?select=id', tokenB)).json,
  businesses: (await rest('GET', 'businesses?select=id', tokenB)).json,
};
record(
  bView.customers?.length === 1 && bView.technicians?.length === 1 && bView.jobs?.length === 0 && bView.businesses?.length === 1 &&
    bView.customers[0].id === custB.id && bView.businesses[0].id === bizB.id,
  'B\'s lists contain only B\'s own rows (1 customer, 1 technician, 0 jobs, 1 business)',
  `customers ${bView.customers?.length}, technicians ${bView.technicians?.length}, jobs ${bView.jobs?.length}, businesses ${bView.businesses?.length}`,
);
expectNoRows('B asks for A\'s customer by id', await rest('GET', `customers?id=eq.${custA.id}`, tokenB));
expectNoRows('B asks for A\'s technician by id', await rest('GET', `technicians?id=eq.${techA.id}`, tokenB));
expectNoRows('B asks for A\'s job by id', await rest('GET', `work_orders?id=eq.${jobA.id}`, tokenB));
expectNoRows('B asks for A\'s business by id', await rest('GET', `businesses?id=eq.${bizA.id}`, tokenB));
expectNoRows('B filters customers by A\'s business_id', await rest('GET', `customers?business_id=eq.${bizA.id}`, tokenB));

// ---------------------------------------------------------------------------------------------
section('3. Changing and deleting: B cannot touch A\'s data');
expectNoRows('B renames A\'s business', await rest('PATCH', `businesses?id=eq.${bizA.id}`, tokenB, { name: 'Pwned' }));
expectNoRows('B edits A\'s customer', await rest('PATCH', `customers?id=eq.${custA.id}`, tokenB, { name: 'Pwned' }));
expectNoRows('B deactivates A\'s technician', await rest('PATCH', `technicians?id=eq.${techA.id}`, tokenB, { active: false }));
expectNoRows('B cancels A\'s job', await rest('PATCH', `work_orders?id=eq.${jobA.id}`, tokenB, { status: 'cancelled' }));
expectNoRows('B deletes A\'s customer', await rest('DELETE', `customers?id=eq.${custA.id}`, tokenB));
expectNoRows('B deletes A\'s job', await rest('DELETE', `work_orders?id=eq.${jobA.id}`, tokenB));
const intact = {
  biz: (await rest('GET', `businesses?id=eq.${bizA.id}&select=name`, tokenA)).json?.[0],
  cust: (await rest('GET', `customers?id=eq.${custA.id}&select=name`, tokenA)).json?.[0],
  tech: (await rest('GET', `technicians?id=eq.${techA.id}&select=active`, tokenA)).json?.[0],
  job: (await rest('GET', `work_orders?id=eq.${jobA.id}&select=status`, tokenA)).json?.[0],
};
record(
  intact.biz?.name === 'Alpha Plumbing' && intact.cust?.name === 'Maple Bakery' && intact.tech?.active === true && intact.job?.status === 'open',
  'A\'s data is unchanged after all of B\'s attempts', JSON.stringify(intact),
);

// ---------------------------------------------------------------------------------------------
section('4. Writing into A\'s business, and forged references');
expectRejected('B adds a customer to A\'s business', await rest('POST', 'customers', tokenB, { business_id: bizA.id, name: 'Intruder' }), RLS_OR_GRANT);
expectRejected('B adds a technician to A\'s business', await rest('POST', 'technicians', tokenB, { business_id: bizA.id, name: 'Intruder' }), RLS_OR_GRANT);
expectRejected('B creates a job in A\'s business', await rest('POST', 'work_orders', tokenB, { business_id: bizA.id, customer_id: custA.id, title: 'Intruder job' }), RLS_OR_GRANT);
expectRejected('B creates a job in B\'s business using A\'s customer id', await rest('POST', 'work_orders', tokenB, { business_id: bizB.id, customer_id: custA.id, title: 'Forged job' }), FOREIGN_KEY);
expectRejected('B creates a job using B\'s customer but A\'s technician id', await rest('POST', 'work_orders', tokenB, { business_id: bizB.id, customer_id: custB.id, technician_id: techA.id, title: 'Forged job' }), FOREIGN_KEY);
expectRejected('A re-points own job to B\'s customer', await rest('PATCH', `work_orders?id=eq.${jobA.id}`, tokenA, { customer_id: custB.id }), FOREIGN_KEY);
expectRejected('A re-points own job to B\'s technician', await rest('PATCH', `work_orders?id=eq.${jobA.id}`, tokenA, { technician_id: techB.id }), FOREIGN_KEY);

// ---------------------------------------------------------------------------------------------
section('5. Ownership and moving rows: locked columns');
expectRejected('A creates a business naming B as the owner', await rest('POST', 'businesses', tokenA, { name: 'Fake', owner_id: '00000000-0000-0000-0000-000000000000' }), RLS_OR_GRANT);
expectRejected('A cannot create a second business', await rest('POST', 'businesses', tokenA, { name: 'Second business' }), UNIQUE);
expectRejected('A changes own business owner_id', await rest('PATCH', `businesses?id=eq.${bizA.id}`, tokenA, { owner_id: '00000000-0000-0000-0000-000000000000' }), RLS_OR_GRANT);
expectRejected('A moves a customer to B\'s business', await rest('PATCH', `customers?id=eq.${custA.id}`, tokenA, { business_id: bizB.id }), RLS_OR_GRANT);
expectRejected('A moves a technician to B\'s business', await rest('PATCH', `technicians?id=eq.${techA.id}`, tokenA, { business_id: bizB.id }), RLS_OR_GRANT);
expectRejected('A moves a job to B\'s business', await rest('PATCH', `work_orders?id=eq.${jobA.id}`, tokenA, { business_id: bizB.id }), RLS_OR_GRANT);
expectRejected('A edits a job\'s updated_at by hand', await rest('PATCH', `work_orders?id=eq.${jobA.id}`, tokenA, { updated_at: '2000-01-01T00:00:00Z' }), RLS_OR_GRANT);
expectRejected('A deletes own business through the API', await rest('DELETE', `businesses?id=eq.${bizA.id}`, tokenA), RLS_OR_GRANT);
expectRejected('A deletes a technician (deactivate instead)', await rest('DELETE', `technicians?id=eq.${techA.id}`, tokenA), RLS_OR_GRANT);
expectRejected('A deletes a customer who still has jobs', await rest('DELETE', `customers?id=eq.${custA.id}`, tokenA), FOREIGN_KEY);

// ---------------------------------------------------------------------------------------------
section('6. Signed-out and invalid callers');
for (const table of ['businesses', 'customers', 'technicians', 'work_orders']) {
  expectRejected(`signed-out visitor reads ${table}`, await rest('GET', `${table}?select=id`, undefined), RLS_OR_GRANT);
}
expectRejected('signed-out visitor creates a business', await rest('POST', 'businesses', undefined, { name: 'Anon Co' }), RLS_OR_GRANT);
expectRejected('signed-out visitor calls load_demo_data()', await rpc('load_demo_data', undefined), RLS_OR_GRANT);
{
  const r = await rest('GET', 'customers?select=id', 'not-a-real-token');
  record(r.status === 401, 'a made-up login token is refused', brief(r));
}
{
  const r = await rpc('set_updated_at', tokenA);
  record(r.status >= 400 && !Array.isArray(r.json), 'the internal set_updated_at() helper cannot be called by users', brief(r));
}

// ---------------------------------------------------------------------------------------------
section('7. Data rules still apply to signed-in users');
expectRejected('job with an invalid status', await rest('POST', 'work_orders', tokenA, { business_id: bizA.id, customer_id: custA.id, title: 'Bad status', status: 'done' }), CHECK_FAIL);
expectRejected('job with a one-letter title', await rest('POST', 'work_orders', tokenA, { business_id: bizA.id, customer_id: custA.id, title: 'X' }), CHECK_FAIL);
expectRejected('customer with a blank name', await rest('POST', 'customers', tokenA, { business_id: bizA.id, name: '   ' }), CHECK_FAIL);

// ---------------------------------------------------------------------------------------------
section('8. A\'s own work is allowed');
expectOk('A edits own customer', await rest('PATCH', `customers?id=eq.${custA.id}`, tokenA, { phone: '555-0199' }), (j) => j?.[0]?.phone === '555-0199');
expectOk('A renames own business', await rest('PATCH', `businesses?id=eq.${bizA.id}`, tokenA, { name: 'Alpha Plumbing Ltd' }), (j) => j?.[0]?.name === 'Alpha Plumbing Ltd');
const updated = expectOk('A moves own job to in progress with notes', await rest('PATCH', `work_orders?id=eq.${jobA.id}`, tokenA, { status: 'in_progress', completion_notes: 'Replaced the cartridge.' }), (j) => j?.[0]?.status === 'in_progress');
expectOk('A saves an AI summary on own job', await rest('PATCH', `work_orders?id=eq.${jobA.id}`, tokenA, { ai_summary: 'We replaced the faucet cartridge.' }), (j) => j?.[0]?.ai_summary?.startsWith('We replaced'));
{
  const r = await rest('GET', `work_orders?id=eq.${jobA.id}&select=created_at,updated_at`, tokenA);
  const row = r.json?.[0];
  record(!!row && new Date(row.updated_at) > new Date(row.created_at), 'the job\'s updated_at moved forward automatically', row ? `created ${row.created_at.slice(11, 19)}, updated ${row.updated_at.slice(11, 19)}` : brief(r));
}
expectOk('A deactivates own technician', await rest('PATCH', `technicians?id=eq.${techA.id}`, tokenA, { active: false }), (j) => j?.[0]?.active === false);
expectOk('A deletes own job, then own customer', await rest('DELETE', `work_orders?id=eq.${jobA.id}`, tokenA), (j) => j?.length === 1);
expectOk('A deletes own customer once it has no jobs', await rest('DELETE', `customers?id=eq.${custA.id}`, tokenA), (j) => j?.length === 1);

// ---------------------------------------------------------------------------------------------
section('9. Demo data: one tap for a new user (user C), and no leaks');
{
  const r = await rpc('load_demo_data', tokenC);
  expectOk('C loads demo data', r, (j) => j?.customers === 6 && j?.technicians === 3 && j?.jobs === 6);
  const again = await rpc('load_demo_data', tokenC);
  record(again.status >= 400 && /already has data/.test(again.json?.message ?? ''), 'C loading demo data a second time is refused', brief(again));
  const counts = {
    customers: (await rest('GET', 'customers?select=id', tokenC)).json?.length,
    technicians: (await rest('GET', 'technicians?select=id', tokenC)).json?.length,
    jobs: (await rest('GET', 'work_orders?select=id', tokenC)).json?.length,
  };
  record(counts.customers === 6 && counts.technicians === 3 && counts.jobs === 6, 'no duplicates after the refused second call', JSON.stringify(counts));
  const statuses = (await rest('GET', 'work_orders?select=status', tokenC)).json?.map((j) => j.status).sort().join(',');
  record(statuses === 'cancelled,completed,completed,in_progress,open,open', 'demo jobs: 2 open, 1 in progress, 2 completed, 1 cancelled', statuses);
  const aAfter = (await rest('GET', 'customers?select=id', tokenA)).json?.length;
  const bAfter = (await rest('GET', 'customers?select=id', tokenB)).json?.length;
  record(aAfter === 0 && bAfter === 1, 'A and B see none of C\'s demo rows (A has 0 customers left, B has its own 1)', `A ${aAfter}, B ${bAfter}`);
  const bDemo = await rpc('load_demo_data', tokenB);
  record(bDemo.status >= 400 && /already has data/.test(bDemo.json?.message ?? ''), 'B (who already has data) is refused demo data', brief(bDemo));
}

// ---------------------------------------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} of ${results.length} checks passed.`);
if (failed.length) {
  console.log('\nFAILED:');
  for (const f of failed) console.log(`  - [${f.group}] ${f.label}: ${f.detail}`);
  process.exit(1);
}
console.log('Result: tenant isolation holds. No account could read, change, delete or forge data in another business.');
