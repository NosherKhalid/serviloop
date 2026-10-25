import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { minTouchSize, radius, spacing, typography, useTheme } from '@/theme';

import { Button } from './Button';

export type Option = { id: string; label: string; detail?: string };

type OptionPickerProps = {
  label: string;
  options: readonly Option[];
  // The chosen option's id, or '' when nothing is chosen.
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  // When set, a first row with this text lets the person clear the choice (e.g. "Unassigned").
  noneLabel?: string;
  error?: string;
  disabled?: boolean;
};

// A form field that looks like the text inputs, but opens a list to choose from.
// iOS: like a Picker with the `.menu` or sheet presentation. Written by hand because the stack
// has no UI kit and this needs to work the same on iOS and Android.
export function OptionPicker({ label, options, value, onChange, placeholder = 'Choose', noneLabel, error, disabled = false }: OptionPickerProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);

  const selected = options.find((option) => option.id === value);
  const shownText = selected?.label ?? (value === '' && noneLabel !== undefined ? noneLabel : placeholder);
  const isPlaceholder = selected === undefined && !(value === '' && noneLabel !== undefined);

  function choose(id: string) {
    onChange(id);
    setIsOpen(false);
  }

  const rows: Option[] = noneLabel !== undefined ? [{ id: '', label: noneLabel }, ...options] : [...options];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${shownText}`}
        accessibilityHint="Opens a list to choose from"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setIsOpen(true)}
        style={[styles.field, { borderColor: error ? colors.danger : colors.border }, disabled && styles.disabled]}>
        <Text style={[styles.fieldText, { color: isPlaceholder ? colors.textMuted : colors.text }]} numberOfLines={1}>
          {shownText}
        </Text>
        <Text style={{ color: colors.textMuted }}>▾</Text>
      </Pressable>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        {/* The dimmed area above the sheet closes it when tapped. */}
        <Pressable accessibilityLabel="Close" accessibilityRole="button" style={styles.backdrop} onPress={() => setIsOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{label}</Text>
          <FlatList
            data={rows}
            keyExtractor={(option) => option.id || 'none'}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = item.id === value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityLabel={item.detail ? `${item.label}, ${item.detail}` : item.label}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => choose(item.id)}
                  style={({ pressed }) => [styles.row, { backgroundColor: isSelected || pressed ? colors.surface : 'transparent' }]}>
                  <View style={styles.rowTexts}>
                    <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
                    {item.detail ? <Text style={{ color: colors.textMuted }}>{item.detail}</Text> : null}
                  </View>
                  {/* A tick, not only a colour, shows what is chosen. */}
                  {isSelected ? <Text style={[styles.tick, { color: colors.primary }]}>✓</Text> : null}
                </Pressable>
              );
            }}
          />
          <Button title="Cancel" variant="secondary" onPress={() => setIsOpen(false)} />
        </View>
      </Modal>
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
    ...typography.body,
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  fieldText: {
    ...typography.body,
    flex: 1,
    textAlign: 'left',
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    ...typography.caption,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    maxHeight: '70%',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  sheetTitle: {
    ...typography.heading,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  rowTexts: {
    flex: 1,
    gap: spacing.xs,
  },
  rowLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  tick: {
    ...typography.heading,
  },
});
