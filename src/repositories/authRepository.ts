import { supabase } from '@/lib/supabase';

// What the rest of the app may know about a signed-in person. Deliberately NOT the session:
// access and refresh tokens stay inside the Supabase client and its encrypted storage, never in
// React state, context or logs.
export type AuthUser = {
  id: string;
  email: string | null;
};

type SessionLike = { user: { id: string; email?: string | undefined } } | null;

function toAuthUser(session: SessionLike): AuthUser | null {
  return session === null ? null : { id: session.user.id, email: session.user.email ?? null };
}

// The saved session (if any), restored from encrypted storage. Never touches the network.
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return toAuthUser(data.session);
}

// Calls `onChange` whenever the person signs in, signs out, or the session is restored/refreshed.
// Returns an "unsubscribe" function. The callback must stay quick and must not call Supabase itself.
export function subscribeToAuthChanges(onChange: (user: AuthUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(toAuthUser(session));
  });
  return () => data.subscription.unsubscribe();
}

// The three functions below throw the raw Supabase error; `features/auth/errors.ts` turns it into
// a friendly message for the screen.
export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
}

// `needsEmailConfirmation` is true only if the project requires confirming the email first
// (it is off in development, see D-018). Then no session exists until the link is clicked.
export async function signUpWithPassword(email: string, password: string): Promise<{ needsEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw error;
  }
  return { needsEmailConfirmation: data.session === null };
}

// Signs out of THIS device only. In the installed auth library the local session is removed even
// when the network call fails, so a failed request cannot leave the person stuck signed in.
export async function signOutOfThisDevice(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}
