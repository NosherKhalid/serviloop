import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from '@/types/database';

import { readSupabaseEnv } from './env';
import { secureSessionStorage } from './secureSessionStorage';

const { url, publishableKey } = readSupabaseEnv();

// The ONE Supabase client for the whole app (rule: never create another).
// It holds only the public (publishable) key; row-level security in the database does the protecting.
export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    storage: secureSessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // there is no browser URL to read a session from in a mobile app
  },
});

// iOS: like pausing a timer in `sceneDidEnterBackground`. Refreshing the login token only while the
// app is in the foreground avoids pointless network calls and refresh errors in the background.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
