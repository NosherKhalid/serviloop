import { useEffect, useState } from 'react';

import { getWorkOrder } from '@/repositories/workOrderRepository';
import type { WorkOrder } from '@/types/workOrder';

export type WorkOrderState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'notFound' }
  | { status: 'ready'; workOrder: WorkOrder };

// Loads one job by id. `id` is `undefined` when the route parameter was missing or malformed.
export function useWorkOrder(id: string | undefined) {
  const [loadedState, setLoadedState] = useState<WorkOrderState>({ status: 'loading' });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (id === undefined) {
      return;
    }
    let isCancelled = false;

    async function load(workOrderId: string) {
      try {
        const workOrder = await getWorkOrder(workOrderId);
        if (!isCancelled) {
          setLoadedState(workOrder === null ? { status: 'notFound' } : { status: 'ready', workOrder });
        }
      } catch {
        if (!isCancelled) {
          setLoadedState({ status: 'error', message: "We couldn't load this job. Check your connection and try again." });
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

  const state: WorkOrderState = id === undefined ? { status: 'notFound' } : loadedState;
  return { state, reload };
}
