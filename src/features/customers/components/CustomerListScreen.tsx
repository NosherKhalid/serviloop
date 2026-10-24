import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { spacing, useTheme } from '@/theme';

import { useCustomers } from '../hooks/useCustomers';
import { CustomerRow } from './CustomerRow';

export function CustomerListScreen() {
  const colors = useTheme();
  const { state, reload } = useCustomers();

  // One `switch` per state. Inside each case TypeScript knows exactly which fields exist.
  switch (state.status) {
    case 'loading':
      return (
        <Screen centered>
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading customers" />
        </Screen>
      );

    case 'error':
      return (
        <Screen centered>
          <EmptyState title="Something went wrong" message={state.message} actionLabel="Try again" onAction={reload} />
        </Screen>
      );

    case 'ready':
      if (state.customers.length === 0) {
        return (
          <Screen centered>
            <EmptyState title="No customers yet" message="Customers you add will appear here." />
          </Screen>
        );
      }
      return (
        <Screen style={styles.listScreen}>
          {/* iOS: FlatList ≈ List. Only rows near the screen are created (virtualized), unlike
              `ScrollView` + `.map`, which would build every row. `keyExtractor` ≈ `Identifiable.id`:
              a stable id (never the array index) lets React keep each row's identity when data changes. */}
          <FlatList
            data={state.customers}
            keyExtractor={(customer) => customer.id}
            renderItem={({ item }) => <CustomerRow customer={item} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        </Screen>
      );
  }
}

const styles = StyleSheet.create({
  listScreen: {
    padding: 0, // the list draws its own padding so rows can scroll under the header edge
  },
  listContent: {
    padding: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
});
