import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { listTechnicians } from '@/repositories/technicianRepository';
import type { Technician } from '@/types/technician';

export type TechniciansState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; technicians: Technician[] };

// Same shape as `useCustomers`: loading / error / ready, refreshed whenever the screen regains focus
// (so a technician added or edited on the next screen shows up when you come back).
export function useTechnicians() {
  const [state, setState] = useState<TechniciansState>({ status: 'loading' });
  const isFocusedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const technicians = await listTechnicians();
      if (isFocusedRef.current) {
        setState({ status: 'ready', technicians });
      }
    } catch {
      if (isFocusedRef.current) {
        setState({ status: 'error', message: "We couldn't load your technicians. Check your connection and try again." });
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
