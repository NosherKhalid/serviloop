import { useBusiness } from '@/providers/BusinessProvider';
import { createCustomer, deleteCustomer, updateCustomer } from '@/repositories/customerRepository';

import type { CustomerInput } from '../validation';

// iOS: the "intent" half of the ViewModel. Screens call these functions; they never touch the
// repository (screen -> hook -> repository).

export function useCreateCustomer() {
  const { state } = useBusiness();
  const businessId = state.status === 'ready' ? state.business.id : null;

  return async function create(input: CustomerInput): Promise<void> {
    if (businessId === null) {
      throw new Error('No business loaded');
    }
    await createCustomer(businessId, input);
  };
}

export function useUpdateCustomer() {
  return async function update(id: string, input: CustomerInput): Promise<void> {
    await updateCustomer(id, input);
  };
}

export function useDeleteCustomer() {
  return async function remove(id: string): Promise<void> {
    await deleteCustomer(id);
  };
}
