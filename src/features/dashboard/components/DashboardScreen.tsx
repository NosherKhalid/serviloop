import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { WorkOrderRow } from '@/features/workOrders';
import { useBusiness } from '@/providers/BusinessProvider';
import { spacing, typography, useTheme } from '@/theme';

import { useDashboard } from '../hooks/useDashboard';
import { CountCard } from './CountCard';

export function DashboardScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { state: business } = useBusiness();
  const { state, reload } = useDashboard();

  switch (state.status) {
    case 'loading':
      return (
        <Screen centered>
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading dashboard" />
        </Screen>
      );

    case 'error':
      return (
        <Screen centered>
          <EmptyState title="Something went wrong" message={state.message} actionLabel="Try again" onAction={reload} />
        </Screen>
      );

    case 'ready': {
      const { counts, recent } = state.data;
      const total = counts.open + counts.in_progress + counts.completed + counts.cancelled;

      if (total === 0) {
        return (
          <Screen centered>
            <EmptyState
              title="No jobs yet"
              message="Create your first job and its status will be counted here."
              actionLabel="Add job"
              onAction={() => router.push('/work-orders/new')}
            />
          </Screen>
        );
      }

      const openJobs = () => router.navigate('/work-orders');

      return (
        <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
          {business.status === 'ready' ? (
            <Text accessibilityRole="header" style={[styles.businessName, { color: colors.text }]}>
              {business.business.name}
            </Text>
          ) : null}

          <View style={styles.cards}>
            <CountCard label="Open" count={counts.open} onPress={openJobs} />
            <CountCard label="In progress" count={counts.in_progress} onPress={openJobs} />
            <CountCard label="Completed" count={counts.completed} onPress={openJobs} />
          </View>
          <Text style={[styles.cancelled, { color: colors.textMuted }]}>
            Cancelled: {counts.cancelled} · {total} {total === 1 ? 'job' : 'jobs'} in total
          </Text>

          <View style={styles.section}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
              Recent jobs
            </Text>
            {recent.map((workOrder) => (
              <WorkOrderRow
                key={workOrder.id}
                workOrder={workOrder}
                onPress={() => router.push({ pathname: '/work-orders/[id]', params: { id: workOrder.id } })}
              />
            ))}
          </View>

          <Button title="See all jobs" variant="secondary" onPress={openJobs} />
        </ScrollView>
      );
    }
  }
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  businessName: {
    ...typography.heading,
  },
  cards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelled: {
    ...typography.caption,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
  },
});
