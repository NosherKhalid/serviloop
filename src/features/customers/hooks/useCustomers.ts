import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

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
  // Changing this number is how `reload` re-runs the effect below.
  const [reloadCount, setReloadCount] = useState(0);

  // iOS: this is `.onAppear` / `.task` for *navigation focus*. A screen under a pushed form stays
  // mounted, so a plain `useEffect` would not run again when you come back from saving. This runs
  // every time the screen gains focus. It does NOT show the spinner again: old rows stay visible
  // until fresh ones arrive.
  //
  // `useCallback` is needed here for a real reason: `useFocusEffect` re-runs whenever the function
  // it receives changes identity, and a new inline function is created on every render.
  useFocusEffect(
    useCallback(() => {
      // Nothing cancels this for us (unlike `.task`). If the screen goes away while the request is
      // in flight, the flag stops a late result from calling setState on a gone screen.
      let isCancelled = false;

      async function load() {
        try {
          const customers = await listCustomers();
          if (!isCancelled) {
            setState({ status: 'ready', customers });
          }
        } catch {
          if (!isCancelled) {
            // Never show raw error text from the data layer to the user.
            setState({ status: 'error', message: "We couldn't load your customers. Check your connection and try again." });
          }
        }
      }

      void load(); // `void` = we intentionally do not await; errors are handled inside `load`

      // iOS: like `onDisappear` / task cancellation.
      return () => {
        isCancelled = true;
      };
    }, [reloadCount]),
  );

  function reload() {
    setState({ status: 'loading' });
    // Functional update: "give me the latest value", safe even if called twice before a re-render.
    setReloadCount((count) => count + 1);
  }

  return { state, reload };
}
