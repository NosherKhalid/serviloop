import { useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme';
import type { WorkOrderStatus } from '@/types/workOrder';

import { useWorkOrderFormOptions } from '../hooks/useWorkOrderFormOptions';
import type { WorkOrderFormValues, WorkOrderInput } from '../validation';
import { WorkOrderForm } from './WorkOrderForm';

type WorkOrderFormScreenProps = {
  initialValues: WorkOrderFormValues;
  originalStatus?: WorkOrderStatus;
  submitLabel: string;
  onSave: (input: WorkOrderInput) => Promise<void>;
};

// Shared by "new job" and "edit job": loads the customers and technicians to choose from, and handles
// the three situations around them (loading, failed, no customers yet) before showing the form.
export function WorkOrderFormScreen({ initialValues, originalStatus, submitLabel, onSave }: WorkOrderFormScreenProps) {
  const colors = useTheme();
  const router = useRouter();
  const { state, reload } = useWorkOrderFormOptions();

  switch (state.status) {
    case 'loading':
      return (
        <Screen centered>
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
        </Screen>
      );

    case 'error':
      return (
        <Screen centered>
          <EmptyState title="Something went wrong" message={state.message} actionLabel="Try again" onAction={reload} />
        </Screen>
      );

    case 'ready':
      // A job must belong to a customer, so with none yet the first step is adding one.
      if (state.customers.length === 0) {
        return (
          <Screen centered>
            <EmptyState
              title="Add a customer first"
              message="Every job is for a customer. Add one, then come back to create the job."
              actionLabel="Add customer"
              onAction={() => router.push('/customers/new')}
            />
          </Screen>
        );
      }
      return (
        <WorkOrderForm
          initialValues={initialValues}
          originalStatus={originalStatus}
          customers={state.customers}
          technicians={state.technicians}
          submitLabel={submitLabel}
          onSave={onSave}
        />
      );
  }
}
