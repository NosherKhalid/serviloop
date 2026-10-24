import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { spacing, useTheme } from '@/theme';

import { useWorkOrders } from '../hooks/useWorkOrders';
import { WorkOrderRow } from './WorkOrderRow';

export function WorkOrderListScreen() {
  const colors = useTheme();
  const { state, reload } = useWorkOrders();

  switch (state.status) {
    case 'loading':
      return (
        <Screen centered>
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading jobs" />
        </Screen>
      );

    case 'error':
      return (
        <Screen centered>
          <EmptyState title="Something went wrong" message={state.message} actionLabel="Try again" onAction={reload} />
        </Screen>
      );

    case 'ready':
      if (state.workOrders.length === 0) {
        return (
          <Screen centered>
            <EmptyState title="No jobs yet" message="Jobs you create will appear here." />
          </Screen>
        );
      }
      return (
        <Screen style={styles.listScreen}>
          <FlatList
            data={state.workOrders}
            keyExtractor={(workOrder) => workOrder.id}
            renderItem={({ item }) => <WorkOrderRow workOrder={item} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        </Screen>
      );
  }
}

const styles = StyleSheet.create({
  listScreen: {
    padding: 0,
  },
  listContent: {
    padding: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
});
