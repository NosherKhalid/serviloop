import { useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { updateCustomer } from '@/repositories/customerRepository';
import { useTheme } from '@/theme';

import { useCustomer } from '../hooks/useCustomer';
import type { CustomerInput } from '../validation';
import { CustomerForm } from './CustomerForm';

type EditCustomerScreenProps = {
  // Route params are untrusted: they come from the URL as `string`, and a repeated segment can even
  // arrive as `string[]`. TypeScript cannot check them, so we do at runtime below.
  id: string | string[] | undefined;
};

export function EditCustomerScreen({ id }: EditCustomerScreenProps) {
  const colors = useTheme();
  const router = useRouter();
  const customerId = typeof id === 'string' && id !== '' ? id : undefined;
  const { state, reload } = useCustomer(customerId);

  switch (state.status) {
    case 'loading':
      return (
        <Screen centered>
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading customer" />
        </Screen>
      );

    case 'error':
      return (
        <Screen centered>
          <EmptyState title="Something went wrong" message={state.message} actionLabel="Try again" onAction={reload} />
        </Screen>
      );

    case 'notFound':
      return (
        <Screen centered>
          <EmptyState
            title="Customer not found"
            message="This customer may have been removed."
            actionLabel="Back to customers"
            onAction={() => router.back()}
          />
        </Screen>
      );

    case 'ready': {
      const { customer } = state;

      async function handleSave(input: CustomerInput) {
        await updateCustomer(customer.id, input);
        router.back();
      }

      return (
        <CustomerForm
          // `?? ''` turns a null column into an empty text field.
          initialValues={{ name: customer.name, phone: customer.phone ?? '', address: customer.address ?? '' }}
          submitLabel="Save changes"
          onSave={handleSave}
        />
      );
    }
  }
}
