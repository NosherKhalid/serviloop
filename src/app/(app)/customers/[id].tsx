import { useLocalSearchParams } from 'expo-router';

import { EditCustomerScreen } from '@/features/customers';

// iOS: the `[id]` in the file name is a path parameter, like the value you pass into a NavigationLink destination.
export default function EditCustomerRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditCustomerScreen id={id} />;
}
