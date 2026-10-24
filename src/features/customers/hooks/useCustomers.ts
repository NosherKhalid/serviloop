import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { listCustomers } from '@/repositories/customerRepository';
import type { Customer } from '@/types/customer';

// iOS: like a Swift enum with associated values. `status` is the discriminator, and TypeScript
// narrows the rest: only the `ready` case has `customers`, only `error` has `message`.
export type CustomersState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; customers: Customer[] };

// iOS: this hook plays the ViewModel role. The screen reads `state` and calls `reload`.
export function useCustomers() {
  const [state, setState] = useState<CustomersState>({ status: 'loading' });
  // True only while the screen is focused. A late response must not update a screen the user left.
  // A ref (unlike state) can change without causing a re-render.
  const isFocusedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const customers = await listCustomers();
      if (isFocusedRef.current) {
        setState({ status: 'ready', customers });
      }
    } catch {
      if (isFocusedRef.current) {
        // Never show raw error text from the data layer to the user.
        setState({ status: 'error', message: "We couldn't load your customers. Check your connection and try again." });
      }
    }
  }, []);

  // iOS: this is `.onAppear` / `.task` for *navigation focus*. A screen under a pushed form stays
  // mounted, so a plain `useEffect` would not run again when you come back from saving. This runs
  // every time the screen gains focus and does NOT show the spinner again: old rows stay visible
  // until fresh ones arrive.
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      void load(); // `void` = intentionally not awaited; errors are handled inside `load`

      // iOS: like `onDisappear` / task cancellation.
      return () => {
        isFocusedRef.current = false;
      };
    }, [load]),
  );

  function reload() {
    setState({ status: 'loading' });
    void load();
  }

  return { state, reload };
}
