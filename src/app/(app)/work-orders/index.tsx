import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

// Placeholder: the mock job list is built in slice 7.
export default function WorkOrdersRoute() {
  return (
    <Screen centered>
      <EmptyState title="Jobs" message="Your work orders will appear here." />
    </Screen>
  );
}
