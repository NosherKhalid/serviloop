import { z } from 'zod';

// Public client settings. Everything `EXPO_PUBLIC_*` is baked into the app bundle, so it must only
// ever hold the project URL and the PUBLISHABLE key (never a secret key). See `.env.example`.
// Messages here never include the actual values, so a mistake cannot leak a key into logs.
const supabaseEnvSchema = z.object({
  url: z
    .string()
    .regex(/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i, 'EXPO_PUBLIC_SUPABASE_URL must look like https://<project-ref>.supabase.co'),
  publishableKey: z
    .string()
    .startsWith('sb_publishable_', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be the publishable key (sb_publishable_...), never a secret key'),
});

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;

type RawSupabaseEnv = { url: string | undefined; publishableKey: string | undefined };

const variableNames = {
  url: 'EXPO_PUBLIC_SUPABASE_URL',
  publishableKey: 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
} as const;

// Pure and side-effect free so it can be unit-tested. Throws one readable error listing what to fix.
export function parseSupabaseEnv(raw: RawSupabaseEnv): SupabaseEnv {
  const result = supabaseEnvSchema.safeParse(raw);
  if (result.success) {
    return result.data;
  }
  const problems = result.error.issues.map((issue) => {
    const field = issue.path[0] === 'url' ? 'url' : 'publishableKey';
    // Decide "missing" from the raw input (not from the issue), and otherwise show our own message.
    return raw[field] === undefined || raw[field] === '' ? `${variableNames[field]} is missing` : issue.message;
  });
  throw new Error(
    `Supabase settings are missing or invalid:\n- ${problems.join('\n- ')}\nCopy .env.example to .env, fill in the two values, then restart Metro with: npm start -- --clear`,
  );
}

// Expo only replaces `process.env.EXPO_PUBLIC_*` when written out literally like this
// (a dynamic lookup such as process.env[name] would stay undefined in the app).
export function readSupabaseEnv(): SupabaseEnv {
  return parseSupabaseEnv({
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
