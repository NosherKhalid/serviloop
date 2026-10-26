import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { radius, spacing, typography, useTheme } from '@/theme';
import type { WorkOrder } from '@/types/workOrder';

import { useJobSummary } from '../hooks/useJobSummary';

type JobSummarySectionProps = {
  workOrder: WorkOrder;
  // True while the notes box holds text that is not saved yet: the summary is written from the SAVED notes.
  notesUnsaved: boolean;
  onWorkOrderChanged: (workOrder: WorkOrder) => void;
  // Called when the summary box gets focus, with its distance from the top of this section, so the screen can
  // scroll it above the keyboard.
  onSummaryFocus?: (offsetInSection: number) => void;
};

// Customer-friendly summary: generate a draft from the saved notes, edit it, save it, share it.
export function JobSummarySection({ workOrder, notesUnsaved, onWorkOrderChanged, onSummaryFocus }: JobSummarySectionProps) {
  const colors = useTheme();
  const summary = useJobSummary(workOrder, onWorkOrderChanged);
  const summaryBoxTop = useRef(0);

  const hasSavedNotes = (workOrder.completionNotes ?? '').trim() !== '';
  const hasText = summary.text.trim() !== '';
  const isBusy = summary.busy !== null;
  const canGenerate = hasSavedNotes && !notesUnsaved && !isBusy;

  let notice: string | null = null;
  if (!hasSavedNotes) {
    notice = 'Add completion notes above and save them, then you can generate a customer-friendly summary.';
  } else if (notesUnsaved) {
    notice = 'Save your notes first: the summary is written from the saved notes.';
  }

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        Customer summary
      </Text>

      {notice !== null ? <Text style={[styles.hint, { color: colors.textMuted }]}>{notice}</Text> : null}

      <Button
        title={hasText ? 'Regenerate summary' : 'Generate summary'}
        variant={hasText ? 'secondary' : 'primary'}
        disabled={!canGenerate}
        loading={summary.busy === 'generating'}
        onPress={summary.generate}
      />

      {summary.hasDraft && summary.source === 'mock' ? (
        // Never let a template pass as live AI.
        <View accessible accessibilityLabel="Demo summary: no AI key is configured, so this only repeats your notes" style={[styles.badge, { borderColor: colors.warning }]}>
          <Text style={{ color: colors.warning, fontWeight: '600' }}>Demo summary</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>No AI key is configured, so this only repeats your notes.</Text>
        </View>
      ) : null}
      {summary.hasDraft && summary.source === 'ai' ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Draft written by AI from your notes. Check it before saving.</Text>
      ) : null}

      {hasText || summary.hasDraft ? (
        <>
          <View onLayout={(event) => (summaryBoxTop.current = event.nativeEvent.layout.y)}>
          <Input
            label="Summary"
            value={summary.text}
            onChangeText={summary.setText}
            multiline
            textAlignVertical="top"
            style={styles.summaryBox}
            editable={!isBusy}
            onFocus={() => onSummaryFocus?.(summaryBoxTop.current)}
          />
          </View>
          <View style={styles.actions}>
            <Button title="Save summary" disabled={!summary.changed || isBusy} loading={summary.busy === 'saving'} onPress={summary.save} />
            <Button title="Share summary" variant="secondary" disabled={!hasText || isBusy} onPress={summary.share} />
            {summary.hasDraft ? <Button title="Discard draft" variant="secondary" disabled={isBusy} onPress={summary.discard} /> : null}
          </View>
        </>
      ) : null}

      {summary.error !== null ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {summary.error}
        </Text>
      ) : null}

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Check the summary is accurate before sharing. Do not put phone numbers or addresses in the notes: the notes are sent to an AI service.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  title: {
    ...typography.heading,
  },
  hint: {
    ...typography.caption,
  },
  badge: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  summaryBox: {
    minHeight: 140,
    paddingTop: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  error: {
    ...typography.body,
  },
});
