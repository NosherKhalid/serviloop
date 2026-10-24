import { createContext, useContext, useState, type ReactNode } from 'react';

type AuthContextValue = {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
};

// iOS: like an `EnvironmentObject` key. The default is `null` so we can detect a missing provider.
const AuthContext = createContext<AuthContextValue | null>(null);

// MOCK (M0): a boolean flag stands in for a real session. M2 replaces the body with Supabase Auth;
// screens keep using `useAuth()` and do not change.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);

  const value: AuthContextValue = {
    isSignedIn,
    signIn: () => setIsSignedIn(true),
    signOut: () => setIsSignedIn(false),
  };

  // Every component below this provider can read `value`. When it changes, they all re-render.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// A custom hook that hides `useContext` and fails loudly if the provider is missing.
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) {
    // After this check TypeScript narrows `value` from `AuthContextValue | null` to `AuthContextValue`.
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
