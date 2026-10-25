import { useLocalSearchParams } from 'expo-router';

import { WorkOrderDetailScreen } from '@/features/workOrders';

export default function WorkOrderDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorkOrderDetailScreen id={id} />;
}
