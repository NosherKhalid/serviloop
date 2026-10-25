import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { spacing, useTheme } from '@/theme';

import { useTechnicians } from '../hooks/useTechnicians';
import { TechnicianRow } from './TechnicianRow';

export function TechnicianListScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { state, reload } = useTechnicians();

  switch (state.status) {
    case 'loading':
      return (
        <Screen centered>
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading technicians" />
        </Screen>
      );

    case 'error':
      return (
        <Screen centered>
          <EmptyState title="Something went wrong" message={state.message} actionLabel="Try again" onAction={reload} />
        </Screen>
      );

    case 'ready':
      if (state.technicians.length === 0) {
        return (
          <Screen centered>
            <EmptyState
              title="No technicians yet"
              message="Add the people who do the work, then assign them to jobs."
              actionLabel="Add technician"
              onAction={() => router.push('/settings/technicians/new')}
            />
          </Screen>
        );
      }
      return (
        <Screen style={styles.listScreen}>
          <FlatList
            data={state.technicians}
            keyExtractor={(technician) => technician.id}
            renderItem={({ item }) => (
              <TechnicianRow
                technician={item}
                onPress={() => router.push({ pathname: '/settings/technicians/[id]', params: { id: item.id } })}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            style={styles.list}
          />
          <View style={styles.footer}>
            <Button title="Add technician" onPress={() => router.push('/settings/technicians/new')} />
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
  listContent: {
    padding: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    padding: spacing.lg,
  },
});
