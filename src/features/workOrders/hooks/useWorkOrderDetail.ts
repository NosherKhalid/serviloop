import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { getWorkOrder } from '@/repositories/workOrderRepository';
import type { WorkOrder } from '@/types/workOrder';

import type { WorkOrderState } from './useWorkOrder';

// Loads one job for the detail screen and reloads it every time the screen comes back into view, so edits
// made on the edit screen (one step up the stack) show immediately. After the first load a refresh is silent:
// no spinner, and a failed refresh keeps what is on screen instead of replacing it with an error.
// `id` is `undefined` when the route parameter was missing or malformed.
export function useWorkOrderDetail(id: string | undefined) {
  const [loadedState, setLoadedState] = useState<WorkOrderState>({ status: 'loading' });
  const isFocusedRef = useRef(false);

  const load = useCallback(async () => {
    if (id === undefined) {
      return;
    }
    try {
      const workOrder = await getWorkOrder(id);
      if (isFocusedRef.current) {
        setLoadedState(workOrder === null ? { status: 'notFound' } : { status: 'ready', workOrder });
      }
    } catch {
      if (isFocusedRef.current) {
        setLoadedState((previous) =>
          previous.status === 'ready'
            ? previous
            : { status: 'error', message: "We couldn't load this job. Check your connection and try again." },
        );
      }
    }
  }, [id]);

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
    setLoadedState({ status: 'loading' });
    void load();
  }

  // After a successful save the screen already has the fresh job from the database; show it without a second request.
  function replace(workOrder: WorkOrder) {
    setLoadedState({ status: 'ready', workOrder });
  }

  const state: WorkOrderState = id === undefined ? { status: 'notFound' } : loadedState;
  return { state, reload, replace };
}
