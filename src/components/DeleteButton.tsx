import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { spacing, typography, useTheme } from '@/theme';
import { dataErrorMessage } from '@/utils/dataErrors';

import { Button } from './Button';

type DeleteButtonProps = {
  title: string; // the button, e.g. "Delete job"
  confirmTitle: string; // the question, e.g. "Delete this job?"
  confirmMessage: string; // what is lost, in one sentence
  onDelete: () => Promise<void>;
  onDeleted: () => void; // called once the record is gone (usually: go back to the list)
  // Shown when the database refuses because something still depends on this record (error 23503).
  blockedMessage: string;
  failureMessage: string;
};

// A permanent delete behind a confirmation. iOS: like a destructive `UIAlertAction` / `confirmationDialog`;
// `Alert.alert` is the native alert on both platforms. It cannot be undone, so the first tap only asks.
export function DeleteButton({
  title,
  confirmTitle,
  confirmMessage,
  onDelete,
  onDeleted,
  blockedMessage,
  failureMessage,
}: DeleteButtonProps) {
  const colors = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (caught) {
      const code = typeof caught === 'object' && caught !== null ? (caught as { code?: unknown }).code : undefined;
      setError(code === '23503' ? blockedMessage : dataErrorMessage(caught, failureMessage));
      setIsDeleting(false);
      return;
    }
    onDeleted(); // the screen is about to close, so there is no state to reset
  }

  function confirm() {
    Alert.alert(confirmTitle, confirmMessage, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  }

  return (
    <>
      {error !== null ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
      <Button title={title} variant="danger" onPress={confirm} loading={isDeleting} />
    </>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.body,
    marginTop: spacing.sm,
  },
});
