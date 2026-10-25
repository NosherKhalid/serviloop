import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { spacing, typography, useTheme } from '@/theme';
import type { Technician } from '@/types/technician';
import { dataErrorMessage } from '@/utils/dataErrors';

import { useSetTechnicianActive, useUpdateTechnician } from '../hooks/useTechnicianActions';
import { useTechnician } from '../hooks/useTechnician';
import type { TechnicianInput } from '../validation';
import { TechnicianForm } from './TechnicianForm';

type EditTechnicianScreenProps = {
  // Route params are untrusted: they arrive from the URL as `string` (or `string[]`).
  id: string | string[] | undefined;
};

export function EditTechnicianScreen({ id }: EditTechnicianScreenProps) {
  const colors = useTheme();
  const router = useRouter();
  const technicianId = typeof id === 'string' && id !== '' ? id : undefined;
  const { state, reload, setTechnician } = useTechnician(technicianId);

  switch (state.status) {
    case 'loading':
      return (
        <Screen centered>
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading technician" />
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
            title="Technician not found"
            message="This technician may have been removed."
            actionLabel="Back to technicians"
            onAction={() => router.back()}
          />
        </Screen>
      );

    case 'ready':
      return <TechnicianEditor technician={state.technician} onChanged={setTechnician} />;
  }
}

// Separate component so it can own the small bit of state for the Deactivate / Reactivate button.
function TechnicianEditor({ technician, onChanged }: { technician: Technician; onChanged: (technician: Technician) => void }) {
  const colors = useTheme();
  const router = useRouter();
  const updateTechnician = useUpdateTechnician();
  const setActive = useSetTechnicianActive();
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  async function handleSave(input: TechnicianInput) {
    await updateTechnician(technician.id, input);
    router.back();
  }

  async function toggleActive() {
    if (isToggling) {
      return;
    }
    setIsToggling(true);
    setToggleError(null);
    try {
      onChanged(await setActive(technician.id, !technician.active));
    } catch (error) {
      setToggleError(dataErrorMessage(error, "We couldn't update this technician. Please try again."));
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <TechnicianForm
      initialValues={{ name: technician.name, specialty: technician.specialty ?? '' }}
      submitLabel="Save changes"
      onSave={handleSave}>
      {!technician.active ? (
        <Text style={[styles.note, { color: colors.textMuted }]}>
          This technician is inactive. They keep their old jobs but cannot be chosen for new ones.
        </Text>
      ) : null}
      {toggleError !== null ? (
        <Text accessibilityRole="alert" style={[styles.note, { color: colors.danger }]}>
          {toggleError}
        </Text>
      ) : null}
      <Button
        title={technician.active ? 'Deactivate technician' : 'Reactivate technician'}
        variant="secondary"
        onPress={toggleActive}
        loading={isToggling}
      />
    </TechnicianForm>
  );
}

const styles = StyleSheet.create({
  note: {
    ...typography.body,
    marginTop: spacing.sm,
  },
});
