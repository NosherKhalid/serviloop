import { useLocalSearchParams } from 'expo-router';

import { EditTechnicianScreen } from '@/features/technicians';

export default function EditTechnicianRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditTechnicianScreen id={id} />;
}
