import { useBusiness } from '@/providers/BusinessProvider';
import { createWorkOrder, deleteWorkOrder, updateWorkOrder } from '@/repositories/workOrderRepository';

import type { WorkOrderInput } from '../validation';

// The "intent" half of the ViewModel; screens never touch the repository directly.

export function useCreateWorkOrder() {
  const { state } = useBusiness();
  const businessId = state.status === 'ready' ? state.business.id : null;

  return async function create(input: WorkOrderInput): Promise<void> {
    if (businessId === null) {
      throw new Error('No business loaded');
    }
    await createWorkOrder(businessId, input);
  };
}

export function useUpdateWorkOrder() {
  return async function update(id: string, input: WorkOrderInput): Promise<void> {
    await updateWorkOrder(id, input);
  };
}

export function useDeleteWorkOrder() {
  return async function remove(id: string): Promise<void> {
    await deleteWorkOrder(id);
  };
}
