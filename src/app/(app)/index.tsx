import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

// Placeholder: real job counts arrive in M4.
export default function DashboardRoute() {
  return (
    <Screen centered>
      <EmptyState title="Dashboard" message="Open, in-progress and completed job counts will appear here." />
    </Screen>
  );
}
