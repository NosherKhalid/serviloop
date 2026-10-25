import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { spacing, useTheme } from '@/theme';

import { useWorkOrders } from '../hooks/useWorkOrders';
import { WorkOrderRow } from './WorkOrderRow';

export function WorkOrderListScreen() {
  const colors = useTheme();
  const router = useRouter();
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
            <EmptyState
              title="No jobs yet"
              message="Jobs you create will appear here."
              actionLabel="Add job"
              onAction={() => router.push('/work-orders/new')}
            />
          </Screen>
        );
      }
      return (
        <Screen style={styles.listScreen}>
          <FlatList
            data={state.workOrders}
            keyExtractor={(workOrder) => workOrder.id}
            renderItem={({ item }) => (
              <WorkOrderRow
                workOrder={item}
                onPress={() => router.push({ pathname: '/work-orders/[id]', params: { id: item.id } })}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            style={styles.list}
          />
          {/* Primary action at the bottom, within thumb reach (D-013). */}
          <View style={styles.footer}>
            <Button title="Add job" onPress={() => router.push('/work-orders/new')} />
          </View>
        </Screen>
      );
  }
}

const styles = StyleSheet.create({
  listScreen: {
    padding: 0,
  },
  list: {
    flex: 1,
  },
  footer: {
    padding: spacing.lg,
  },
  listContent: {
    padding: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
});
