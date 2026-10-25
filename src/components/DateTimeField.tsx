import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { formatScheduledDate } from '@/features/workOrders/format';
import { minTouchSize, radius, spacing, typography, useTheme } from '@/theme';

type DateTimeFieldProps = {
  label: string;
  // A UTC ISO timestamp, or null when no date is set.
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  disabled?: boolean;
};

// The next full hour from now: a sensible starting point when the person first sets a date.
function nextFullHour(): Date {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
}

// A date AND time field using the phone's own native controls (the spec's "platform-specific
// controls render sensibly"):
//   iOS     compact date and time buttons that open the standard iOS pickers;
//   Android the standard date dialog followed by the standard time dialog.
// The time shown and chosen is the phone's own time zone; it is stored as a UTC timestamp.
export function DateTimeField({ label, value, onChange, error, disabled = false }: DateTimeFieldProps) {
  const colors = useTheme();
  const isDark = useColorScheme() === 'dark';
  const date = value === null ? null : new Date(value);

  // Two standard Android dialogs in a row: pick the day, then the time. Cancelling either one
  // (`onDismiss`) leaves the value unchanged.
  function openAndroidDialogs() {
    const start = date ?? nextFullHour();
    DateTimePickerAndroid.open({
      value: start,
      mode: 'date',
      onValueChange: (_event, pickedDate) => {
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          onValueChange: (_timeEvent, pickedTime) => onChange(pickedTime.toISOString()),
        });
      },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

      <View style={[styles.field, { borderColor: error ? colors.danger : colors.border }, disabled && styles.disabled]}>
        {Platform.OS === 'ios' && date !== null ? (
          <DateTimePicker
            accessibilityLabel={label}
            value={date}
            mode="datetime"
            display="compact"
            themeVariant={isDark ? 'dark' : 'light'}
            disabled={disabled}
            onValueChange={(_event, picked) => onChange(picked.toISOString())}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${value === null ? 'not scheduled' : formatScheduledDate(value)}`}
            accessibilityHint="Opens the date and time chooser"
            disabled={disabled}
            onPress={() => (Platform.OS === 'ios' ? onChange(nextFullHour().toISOString()) : openAndroidDialogs())}
            style={styles.valueButton}>
            <Text style={[styles.valueText, { color: value === null ? colors.textMuted : colors.text }]}>
              {value === null ? (Platform.OS === 'ios' ? 'Set date and time' : 'Not scheduled') : formatScheduledDate(value)}
            </Text>
          </Pressable>
        )}

        {value !== null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            disabled={disabled}
            onPress={() => onChange(null)}
            style={styles.clearButton}>
            <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  field: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  disabled: {
    opacity: 0.5,
  },
  valueButton: {
    flex: 1,
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  valueText: {
    ...typography.body,
    textAlign: 'left',
  },
  clearButton: {
    minHeight: minTouchSize,
    minWidth: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    ...typography.body,
    fontWeight: '600',
  },
  error: {
    ...typography.caption,
  },
});
