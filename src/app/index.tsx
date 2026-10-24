import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { WelcomeCard } from '@/components/WelcomeCard';
import { spacing, useTheme } from '@/theme';

// Temporary component gallery. Slice 4 replaces this screen with real navigation.
// iOS: a route file's default export is the screen, like the root view of a NavigationStack destination.
export default function HomeScreen() {
  const colors = useTheme();

  // iOS: like `@State private var count = 0`. `count` is the current value; `setCount` asks
  // React to re-run this function with a new value. Difference: never mutate `count` directly.
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  // Derived during render, not stored in state: it can never get out of sync with `name`.
  const nameError = name.length > 0 && name.trim().length < 2 ? 'Enter at least 2 characters' : undefined;

  return (
    // keyboardShouldPersistTaps lets a button tap work while the keyboard is open.
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled">
      <WelcomeCard
        title="Welcome to Serviloop"
        subtitle="Customers, jobs and AI summaries for small service businesses."
        count={count}
        onIncrement={() => setCount(count + 1)}
      />

      <Input label="Customer name" value={name} onChangeText={setName} error={nameError} placeholder="Jane Doe" />

      <Button title="Reset" variant="secondary" onPress={() => setName('')} disabled={name.length === 0} />

      <EmptyState
        title="No customers yet"
        message="Add your first customer to start creating jobs."
        actionLabel="Add customer"
        onAction={() => setCount(0)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
});
