import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  getCurrentUser,
  signInWithPassword,
  signOutOfThisDevice,
  signUpWithPassword,
  subscribeToAuthChanges,
  type AuthUser,
} from '@/repositories/authRepository';

// iOS: like a Swift enum with associated values. `loading` lasts only until the saved session has
// been looked up (the splash screen stays visible meanwhile), so there is never a flash of the wrong screen.
export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: AuthUser };

type AuthContextValue = {
  state: AuthState;
  // These throw the underlying error on failure; the auth screens turn it into a friendly message.
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
};

// iOS: like an `EnvironmentObject` key. The default is `null` so we can detect a missing provider.
const AuthContext = createContext<AuthContextValue | null>(null);

function stateFor(user: AuthUser | null): AuthState {
  return user === null ? { status: 'signedOut' } : { status: 'signedIn', user };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // iOS: roughly `.task`: runs once when the app starts. It restores the saved session, then keeps
  // listening for sign-in, sign-out and token refreshes. The cleanup stops listening and ignores a
  // late answer, so nothing updates after the provider is gone.
  useEffect(() => {
    let isCancelled = false;

    getCurrentUser()
      .then((user) => {
        if (!isCancelled) {
          setState(stateFor(user));
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setState({ status: 'signedOut' }); // an unreadable saved session means "not signed in"
        }
      });

    const unsubscribe = subscribeToAuthChanges((user) => {
      if (!isCancelled) {
        setState(stateFor(user));
      }
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    state,
    signIn: signInWithPassword,
    signUp: signUpWithPassword,
    signOut: signOutOfThisDevice,
  };

  // Every component below this provider can read `value`. When it changes, they all re-render.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// A custom hook that hides `useContext` and fails loudly if the provider is missing.
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
