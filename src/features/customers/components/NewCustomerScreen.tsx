import { useRouter } from 'expo-router';

import { useCreateCustomer } from '../hooks/useCustomerActions';
import { emptyCustomerForm, type CustomerInput } from '../validation';
import { CustomerForm } from './CustomerForm';

export function NewCustomerScreen() {
  // iOS: like resetting a NavigationStack path to its root list. `dismissTo` pops back to the list if it is
  // underneath, or shows it if this form was opened from another tab (Jobs -> "Add a customer first").
  const router = useRouter();
  const createCustomer = useCreateCustomer();

  async function handleSave(input: CustomerInput) {
    await createCustomer(input);
    router.dismissTo('/customers'); // the list refetches when it regains focus
  }

  return <CustomerForm initialValues={emptyCustomerForm} submitLabel="Add customer" onSave={handleSave} />;
}
