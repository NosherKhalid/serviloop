import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { listWorkOrders } from '@/repositories/workOrderRepository';
import type { WorkOrder } from '@/types/workOrder';

export type WorkOrdersState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; workOrders: WorkOrder[] };

// Same shape as `useCustomers` on purpose: loading / error / ready, refreshed whenever the tab regains focus.
export function useWorkOrders() {
  const [state, setState] = useState<WorkOrdersState>({ status: 'loading' });
  const isFocusedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const workOrders = await listWorkOrders();
      if (isFocusedRef.current) {
        setState({ status: 'ready', workOrders });
      }
    } catch {
      if (isFocusedRef.current) {
        setState({ status: 'error', message: "We couldn't load your jobs. Check your connection and try again." });
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
