import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { spacing, typography, useTheme } from '@/theme';
import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder';

import { formatScheduledDate } from '../format';
import { useWorkOrderDetail } from '../hooks/useWorkOrderDetail';
import { useWorkOrderProgress, type ProgressResult } from '../hooks/useWorkOrderProgress';
import { nextStatuses, transitionLabel } from '../status';
import { StatusChip } from './StatusChip';

type WorkOrderDetailScreenProps = {
  // Route params are untrusted: they arrive from the URL as `string` (or `string[]`).
  id: string | string[] | undefined;
};

type Busy = 'status' | 'notes' | null;

// The job's home: everything about it, the next moves it can make, and the notes about what was done.
// "Edit" opens the full form for the job's own details (title, customer, technician, date).
export function WorkOrderDetailScreen({ id }: WorkOrderDetailScreenProps) {
  const colors = useTheme();
  const router = useRouter();
  const workOrderId = typeof id === 'string' && id !== '' ? id : undefined;
  const { state, reload, replace } = useWorkOrderDetail(workOrderId);
  const { changeStatus, saveNotes } = useWorkOrderProgress();

  // `null` = the owner has not typed anything, so the box shows what is saved. Deriving it this way means a
  // fresh copy of the job from the database never fights with what is being typed.
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(kind: Exclude<Busy, null>, action: () => Promise<ProgressResult>) {
    setActionError(null);
    setBusy(kind);
    const result = await action();
    setBusy(null);
    if (result.ok) {
      replace(result.workOrder);
      setDraft(null);
    } else {
      setActionError(result.message);
    }
  }

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
            onAction={() => router.dismissTo('/work-orders')}
          />
        </Screen>
      );

    case 'ready': {
      const { workOrder } = state;
      const saved = workOrder.completionNotes ?? '';
      const notesText = draft ?? saved;
      const notesChanged = draft !== null && draft.trim() !== saved.trim();
      const moves = nextStatuses(workOrder.status);

      return (
        <ScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              {workOrder.title}
            </Text>
            <StatusChip status={workOrder.status} />
          </View>

          <View style={styles.details}>
            <DetailRow label="Customer" value={workOrder.customerName} />
            <DetailRow label="Technician" value={workOrder.technicianName ?? 'Unassigned'} />
            <DetailRow label="Scheduled" value={formatScheduledDate(workOrder.scheduledFor)} />
            {workOrder.description !== null ? <DetailRow label="Description" value={workOrder.description} /> : null}
          </View>

          <View style={styles.section}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
              Progress
            </Text>
            {moves.length === 0 ? (
              <Text style={{ color: colors.textMuted }}>This job is completed. Completed jobs are final.</Text>
            ) : (
              moves.map((to) => (
                <Button
                  key={to}
                  title={transitionLabel(workOrder.status, to)}
                  variant={buttonVariant(to)}
                  disabled={busy !== null}
                  loading={busy === 'status'}
                  onPress={() => run('status', () => changeStatus(workOrder, to, notesText))}
                />
              ))
            )}
          </View>

          <View style={styles.section}>
            <Input
              label="Completion notes"
              value={notesText}
              onChangeText={setDraft}
              placeholder="What was done? Findings, parts used, advice for the customer."
              multiline
              textAlignVertical="top"
              style={styles.notes}
              editable={busy === null}
            />
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Optional. These notes are what the job summary is written from.
            </Text>
            <Button
              title="Save notes"
              variant="secondary"
              disabled={!notesChanged || busy !== null}
              loading={busy === 'notes'}
              onPress={() => run('notes', () => saveNotes(workOrder, notesText))}
            />
          </View>

          {actionError !== null ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
              {actionError}
            </Text>
          ) : null}

          <Button
            title="Edit job"
            variant="secondary"
            disabled={busy !== null}
            onPress={() => router.push({ pathname: '/work-orders/[id]/edit', params: { id: workOrder.id } })}
          />
        </ScrollView>
      );
    }
  }
}

// Moving forward is the main action, cancelling is destructive-looking, anything else is quiet.
function buttonVariant(to: WorkOrderStatus) {
  if (to === 'in_progress' || to === 'completed') return 'primary';
  if (to === 'cancelled') return 'danger';
  return 'secondary';
}

function DetailRow({ label, value }: { label: string; value: WorkOrder['description'] }) {
  const colors = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
  },
  details: {
    gap: spacing.md,
  },
  detailRow: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  detailValue: {
    ...typography.body,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
  },
  notes: {
    minHeight: 140,
    paddingTop: spacing.md,
  },
  hint: {
    ...typography.caption,
  },
  error: {
    ...typography.body,
  },
});
