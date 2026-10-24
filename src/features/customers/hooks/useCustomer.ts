import { useEffect, useState } from 'react';

import { getCustomer } from '@/repositories/customerRepository';
import type { Customer } from '@/types/customer';

export type CustomerState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'notFound' }
  | { status: 'ready'; customer: Customer };

// Loads one customer by id. `id` is `undefined` when the route parameter was missing or malformed.
export function useCustomer(id: string | undefined) {
  const [loadedState, setLoadedState] = useState<CustomerState>({ status: 'loading' });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (id === undefined) {
      return; // nothing to load; the missing id is handled below, during render
    }

    let isCancelled = false;

    async function load(customerId: string) {
      try {
        const customer = await getCustomer(customerId);
        if (!isCancelled) {
          setLoadedState(customer === null ? { status: 'notFound' } : { status: 'ready', customer });
        }
      } catch {
        if (!isCancelled) {
          setLoadedState({
            status: 'error',
            message: "We couldn't load this customer. Check your connection and try again.",
          });
        }
      }
    }

    void load(id);

    return () => {
      isCancelled = true;
    };
  }, [id, reloadCount]);

  function reload() {
    setLoadedState({ status: 'loading' });
    setReloadCount((count) => count + 1);
  }

  // Derive during render instead of storing it: a missing id is always "not found".
  const state: CustomerState = id === undefined ? { status: 'notFound' } : loadedState;
  return { state, reload };
}
