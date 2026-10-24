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
  const [state, setState] = useState<CustomerState>({ status: 'loading' });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (id === undefined) {
      setState({ status: 'notFound' });
      return;
    }

    let isCancelled = false;

    async function load(customerId: string) {
      try {
        const customer = await getCustomer(customerId);
        if (!isCancelled) {
          setState(customer === null ? { status: 'notFound' } : { status: 'ready', customer });
        }
      } catch {
        if (!isCancelled) {
          setState({ status: 'error', message: "We couldn't load this customer. Check your connection and try again." });
        }
      }
    }

    void load(id);

    return () => {
      isCancelled = true;
    };
  }, [id, reloadCount]);

  function reload() {
    setState({ status: 'loading' });
    setReloadCount((count) => count + 1);
  }

  return { state, reload };
}
