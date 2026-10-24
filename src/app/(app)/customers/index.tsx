import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

// Placeholder: the mock customer list is built in slice 5.
export default function CustomersRoute() {
  return (
    <Screen centered>
      <EmptyState title="Customers" message="Your customer list will appear here." />
    </Screen>
  );
}
