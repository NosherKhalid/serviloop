import { useEffect, useState } from 'react';

import { getTechnician } from '@/repositories/technicianRepository';
import type { Technician } from '@/types/technician';

export type TechnicianState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'notFound' }
  | { status: 'ready'; technician: Technician };

// Loads one technician by id. `id` is `undefined` when the route parameter was missing or malformed.
export function useTechnician(id: string | undefined) {
  const [loadedState, setLoadedState] = useState<TechnicianState>({ status: 'loading' });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (id === undefined) {
      return;
    }
    let isCancelled = false;

    async function load(technicianId: string) {
      try {
        const technician = await getTechnician(technicianId);
        if (!isCancelled) {
          setLoadedState(technician === null ? { status: 'notFound' } : { status: 'ready', technician });
        }
      } catch {
        if (!isCancelled) {
          setLoadedState({ status: 'error', message: "We couldn't load this technician. Check your connection and try again." });
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

  const state: TechnicianState = id === undefined ? { status: 'notFound' } : loadedState;
  return { state, reload, setTechnician: (technician: Technician) => setLoadedState({ status: 'ready', technician }) };
}
