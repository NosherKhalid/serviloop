import { useRouter } from 'expo-router';

import { useCreateWorkOrder } from '../hooks/useWorkOrderActions';
import { emptyWorkOrderForm, type WorkOrderInput } from '../validation';
import { WorkOrderFormScreen } from './WorkOrderFormScreen';

export function NewWorkOrderScreen() {
  const router = useRouter();
  const createWorkOrder = useCreateWorkOrder();

  async function handleSave(input: WorkOrderInput) {
    await createWorkOrder(input);
    router.back(); // the list refetches when it regains focus
  }

  return <WorkOrderFormScreen initialValues={emptyWorkOrderForm} submitLabel="Add job" onSave={handleSave} />;
}
