import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { DateTimeField } from '@/components/DateTimeField';
import { Input } from '@/components/Input';
import { OptionPicker, type Option } from '@/components/OptionPicker';
import { spacing, typography, useTheme } from '@/theme';
import type { Customer } from '@/types/customer';
import type { Technician } from '@/types/technician';
import type { WorkOrderStatus } from '@/types/workOrder';

import { useWorkOrderForm } from '../hooks/useWorkOrderForm';
import { statusLabel } from '../status';
import { statusChoices, type WorkOrderFormValues, type WorkOrderInput } from '../validation';

type WorkOrderFormProps = {
  initialValues: WorkOrderFormValues;
  // The job's status before editing; undefined when creating a new job (it always starts Open).
  originalStatus?: WorkOrderStatus;
  customers: readonly Customer[];
  technicians: readonly Technician[];
  submitLabel: string;
  onSave: (input: WorkOrderInput) => Promise<void>;
  footer?: ReactNode; // extra content under the save button (the edit screen puts "Delete job" here)
};

export function WorkOrderForm({ initialValues, originalStatus, customers, technicians, submitLabel, onSave, footer }: WorkOrderFormProps) {
  const colors = useTheme();
  const { values, errors, isSubmitting, submitError, setField, submit } = useWorkOrderForm({ initialValues, originalStatus, onSave });

  const customerOptions: Option[] = customers.map((customer) => ({
    id: customer.id,
    label: customer.name,
    detail: customer.address ?? undefined,
  }));

  // Only active technicians can be chosen, plus the one already on this job even if they have since
  // been deactivated (so the job still shows who it is assigned to).
  const technicianOptions: Option[] = technicians
    .filter((technician) => technician.active || technician.id === initialValues.technicianId)
    .map((technician) => ({
      id: technician.id,
      label: technician.active ? technician.name : `${technician.name} (inactive)`,
      detail: technician.specialty ?? undefined,
    }));

  const statusOptions: Option[] =
    originalStatus === undefined ? [] : statusChoices(originalStatus).map((status) => ({ id: status, label: statusLabel(status) }));

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Input
        label="Title"
        value={values.title}
        onChangeText={(text) => setField('title', text)}
        error={errors.title}
        autoCapitalize="sentences"
        editable={!isSubmitting}
      />
      <Input
        label="Description (optional)"
        value={values.description}
        onChangeText={(text) => setField('description', text)}
        error={errors.description}
        multiline
        numberOfLines={4}
        autoCapitalize="sentences"
        style={styles.multiline}
        editable={!isSubmitting}
      />

      <OptionPicker
        label="Customer"
        placeholder="Choose a customer"
        options={customerOptions}
        value={values.customerId}
        onChange={(id) => setField('customerId', id)}
        error={errors.customerId}
        disabled={isSubmitting}
      />
      <OptionPicker
        label="Technician (optional)"
        noneLabel="Unassigned"
        options={technicianOptions}
        value={values.technicianId}
        onChange={(id) => setField('technicianId', id)}
        error={errors.technicianId}
        disabled={isSubmitting}
      />
      <DateTimeField
        label="Scheduled for (optional)"
        value={values.scheduledFor}
        onChange={(iso) => setField('scheduledFor', iso)}
        error={errors.scheduledFor}
        disabled={isSubmitting}
      />
      {/* A new job always starts as Open, so the status choice only appears when editing. */}
      {originalStatus !== undefined ? (
        <OptionPicker
          label="Status"
          options={statusOptions}
          value={values.status}
          onChange={(id) => setField('status', id as WorkOrderStatus)}
          error={errors.status}
          disabled={isSubmitting}
        />
      ) : null}

      {submitError !== null ? (
        <Text accessibilityRole="alert" style={[styles.submitError, { color: colors.danger }]}>
          {submitError}
        </Text>
      ) : null}

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  multiline: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  submitError: {
    ...typography.body,
  },
});
