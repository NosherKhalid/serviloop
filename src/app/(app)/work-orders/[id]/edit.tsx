import { useLocalSearchParams } from 'expo-router';

import { EditWorkOrderScreen } from '@/features/workOrders';

export default function EditWorkOrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditWorkOrderScreen id={id} />;
}
