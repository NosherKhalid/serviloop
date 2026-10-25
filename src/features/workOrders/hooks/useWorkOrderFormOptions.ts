import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { listCustomers } from '@/repositories/customerRepository';
import { listTechnicians } from '@/repositories/technicianRepository';
import type { Customer } from '@/types/customer';
import type { Technician } from '@/types/technician';

export type FormOptionsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; customers: Customer[]; technicians: Technician[] };

// The two lists the job form chooses from. Loaded together so the form appears once, not in pieces.
//
// They are fetched again every time this screen comes back into view. That matters because the
// job form stays open while the owner goes elsewhere (e.g. to add the first customer on the
// Customers tab): when they return, the new customer must be in the list.
//
// The refresh is SILENT: after the first load it never shows the spinner or an error screen, because
// replacing the form would throw away what the owner has already typed. If a refresh fails, the lists
// they already have stay in place.
export function useWorkOrderFormOptions() {
  const [state, setState] = useState<FormOptionsState>({ status: 'loading' });
  const isFocusedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const [customers, technicians] = await Promise.all([listCustomers(), listTechnicians()]);
      if (isFocusedRef.current) {
        setState({ status: 'ready', customers, technicians });
      }
    } catch {
      if (isFocusedRef.current) {
        // Keep showing what we already have; only report a failure when there is nothing to show yet.
        setState((current) =>
          current.status === 'ready'
            ? current
            : { status: 'error', message: "We couldn't load your customers and technicians. Check your connection and try again." },
        );
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      void load();
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
