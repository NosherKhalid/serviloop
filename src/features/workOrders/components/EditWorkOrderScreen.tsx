import { useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { DeleteButton } from '@/components/DeleteButton';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme';

import { useDeleteWorkOrder, useUpdateWorkOrder } from '../hooks/useWorkOrderActions';
import { useWorkOrder } from '../hooks/useWorkOrder';
import type { WorkOrderInput } from '../validation';
import { WorkOrderFormScreen } from './WorkOrderFormScreen';

type EditWorkOrderScreenProps = {
  // Route params are untrusted: they arrive from the URL as `string` (or `string[]`).
  id: string | string[] | undefined;
};

export function EditWorkOrderScreen({ id }: EditWorkOrderScreenProps) {
  const colors = useTheme();
  const router = useRouter();
  const workOrderId = typeof id === 'string' && id !== '' ? id : undefined;
  const { state, reload } = useWorkOrder(workOrderId);
  const updateWorkOrder = useUpdateWorkOrder();
  const deleteWorkOrder = useDeleteWorkOrder();

  switch (state.status) {
    case 'loading':
      return (
        <Screen centered>
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading job" />
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
            title="Job not found"
            message="This job may have been removed."
            actionLabel="Back to jobs"
            onAction={() => router.back()}
          />
        </Screen>
      );

    case 'ready': {
      const { workOrder } = state;

      async function handleSave(input: WorkOrderInput) {
        await updateWorkOrder(workOrder.id, input);
        router.back();
      }

      return (
        <WorkOrderFormScreen
          // `?? ''` turns a missing value into an empty field / "nothing chosen".
          initialValues={{
            title: workOrder.title,
            description: workOrder.description ?? '',
            customerId: workOrder.customerId,
            technicianId: workOrder.technicianId ?? '',
            scheduledFor: workOrder.scheduledFor,
            status: workOrder.status,
          }}
          originalStatus={workOrder.status}
          submitLabel="Save changes"
          onSave={handleSave}
          footer={
            <DeleteButton
              title="Delete job"
              confirmTitle="Delete this job?"
              confirmMessage={`"${workOrder.title}" will be removed permanently. This cannot be undone.`}
              onDelete={() => deleteWorkOrder(workOrder.id)}
              onDeleted={() => router.dismissTo('/work-orders')}
              blockedMessage="This job can't be deleted right now."
              failureMessage="We couldn't delete this job. Please try again."
            />
          }
        />
      );
    }
  }
}
