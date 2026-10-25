import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { countWorkOrdersByStatus, listRecentWorkOrders } from '@/repositories/workOrderRepository';
import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder';

export const recentJobsLimit = 5;

export type DashboardData = {
  counts: Record<WorkOrderStatus, number>;
  recent: WorkOrder[];
};

export type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: DashboardData };

// The numbers and the recent jobs come straight from the database every time the Dashboard tab comes into
// view (tabs stay mounted, so mounting alone would show stale numbers after a status change elsewhere, D-034).
// After the first load a refresh is silent: no spinner, and if it fails the last numbers stay on screen.
export function useDashboard() {
  const [state, setState] = useState<DashboardState>({ status: 'loading' });
  const isFocusedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const [counts, recent] = await Promise.all([countWorkOrdersByStatus(), listRecentWorkOrders(recentJobsLimit)]);
      if (isFocusedRef.current) {
        setState({ status: 'ready', data: { counts, recent } });
      }
    } catch {
      if (isFocusedRef.current) {
        setState((previous) =>
          previous.status === 'ready'
            ? previous
            : { status: 'error', message: "We couldn't load your dashboard. Check your connection and try again." },
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
