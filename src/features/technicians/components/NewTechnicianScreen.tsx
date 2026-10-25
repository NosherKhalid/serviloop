import { useRouter } from 'expo-router';

import { useCreateTechnician } from '../hooks/useTechnicianActions';
import { emptyTechnicianForm, type TechnicianInput } from '../validation';
import { TechnicianForm } from './TechnicianForm';

export function NewTechnicianScreen() {
  const router = useRouter();
  const createTechnician = useCreateTechnician();

  async function handleSave(input: TechnicianInput) {
    await createTechnician(input);
    router.back(); // the list refetches when it regains focus
  }

  return <TechnicianForm initialValues={emptyTechnicianForm} submitLabel="Add technician" onSave={handleSave} />;
}
