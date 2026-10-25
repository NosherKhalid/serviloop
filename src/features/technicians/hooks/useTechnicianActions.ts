import { useBusiness } from '@/providers/BusinessProvider';
import { createTechnician, setTechnicianActive, updateTechnician } from '@/repositories/technicianRepository';
import type { Technician } from '@/types/technician';

import type { TechnicianInput } from '../validation';

// The "intent" half of the ViewModel; screens never touch the repository directly.

export function useCreateTechnician() {
  const { state } = useBusiness();
  const businessId = state.status === 'ready' ? state.business.id : null;

  return async function create(input: TechnicianInput): Promise<void> {
    if (businessId === null) {
      throw new Error('No business loaded');
    }
    await createTechnician(businessId, input);
  };
}

export function useUpdateTechnician() {
  return async function update(id: string, input: TechnicianInput): Promise<void> {
    await updateTechnician(id, input);
  };
}

export function useSetTechnicianActive() {
  return async function setActive(id: string, active: boolean): Promise<Technician> {
    return setTechnicianActive(id, active);
  };
}
