import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  createBusiness as createBusinessInDatabase,
  getMyBusiness,
  loadDemoData as loadDemoDataInDatabase,
  type Business,
  type DemoDataSummary,
} from '@/repositories/businessRepository';

import { useAuth } from './AuthProvider';

// iOS: another enum with associated values.
//   idle        nobody is signed in
//   loading     looking up the signed-in owner's business
//   error       the lookup failed (usually offline): show a retry screen
//   none        signed in, no business yet: show onboarding
//   demoLoaded  demo data was just created: onboarding shows what was loaded, then "Continue"
//   ready       the business is known: show the app
export type BusinessState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'none' }
  | { status: 'demoLoaded'; business: Business; summary: DemoDataSummary }
  | { status: 'ready'; business: Business };

type BusinessContextValue = {
  state: BusinessState;
  // Both throw the underlying error on failure; the onboarding screen turns it into a friendly message.
  createBusiness: (name: string) => Promise<void>;
  loadDemoData: () => Promise<void>;
  continueAfterDemo: () => void;
  reload: () => void;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

// The result of the lookup is remembered together with WHO it belongs to, so a different account
// signing in on the same phone can never briefly see the previous account's business.
type Loaded = { userId: string; state: BusinessState };

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { state: auth } = useAuth();
  const userId = auth.status === 'signedIn' ? auth.user.id : null;

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  // iOS: roughly `.task(id: userId)`. Looks the business up whenever a different person signs in
  // (or after a retry). The cleanup ignores a late answer for someone who has since signed out.
  useEffect(() => {
    if (userId === null) {
      return;
    }
    let isCancelled = false;

    getMyBusiness()
      .then((business) => {
        if (!isCancelled) {
          setLoaded({ userId, state: business === null ? { status: 'none' } : { status: 'ready', business } });
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setLoaded({ userId, state: { status: 'error' } });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [userId, reloadCount]);

  // Derived while rendering (not stored): nobody signed in -> idle; a stale answer for another
  // person -> loading again.
  const state: BusinessState = userId === null ? { status: 'idle' } : loaded?.userId === userId ? loaded.state : { status: 'loading' };

  function reload() {
    setLoaded(null);
    setReloadCount((count) => count + 1);
  }

  async function createBusiness(name: string) {
    if (userId === null) {
      throw new Error('Not signed in');
    }
    try {
      const business = await createBusinessInDatabase(name);
      setLoaded({ userId, state: { status: 'ready', business } });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        reload(); // the business already exists (e.g. created on another device): just pick it up
      }
      throw error;
    }
  }

  async function loadDemoData() {
    if (userId === null) {
      throw new Error('Not signed in');
    }
    const { business, summary } = await loadDemoDataInDatabase();
    setLoaded({ userId, state: { status: 'demoLoaded', business, summary } });
  }

  function continueAfterDemo() {
    if (userId !== null && state.status === 'demoLoaded') {
      setLoaded({ userId, state: { status: 'ready', business: state.business } });
    }
  }

  return (
    <BusinessContext.Provider value={{ state, createBusiness, loadDemoData, continueAfterDemo, reload }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness(): BusinessContextValue {
  const value = useContext(BusinessContext);
  if (value === null) {
    throw new Error('useBusiness must be used inside <BusinessProvider>');
  }
  return value;
}
