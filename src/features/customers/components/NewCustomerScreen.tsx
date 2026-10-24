import { useRouter } from 'expo-router';

import { createCustomer } from '@/repositories/customerRepository';

import { emptyCustomerForm, type CustomerInput } from '../validation';
import { CustomerForm } from './CustomerForm';

export function NewCustomerScreen() {
  // iOS: like `@Environment(\.dismiss)` / the NavigationStack path: `router.back()` pops this screen.
  const router = useRouter();

  async function handleSave(input: CustomerInput) {
    await createCustomer(input);
    router.back(); // the list refetches when it regains focus
  }

  return <CustomerForm initialValues={emptyCustomerForm} submitLabel="Add customer" onSave={handleSave} />;
}
