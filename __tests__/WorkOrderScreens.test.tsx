import { fireEvent, render, screen } from '@testing-library/react-native';

import type { WorkOrder } from '@/types/workOrder';

const mockList = jest.fn<Promise<WorkOrder[]>, []>();

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]),
  };
});
jest.mock('@/repositories/workOrderRepository', () => ({ listWorkOrders: () => mockList() }));

import { WorkOrderListScreen } from '@/features/workOrders/components/WorkOrderListScreen';

function job(overrides: Partial<WorkOrder>): WorkOrder {
  return {
    id: 'w1',
    title: 'Replace kitchen faucet',
    description: null,
    status: 'open',
    customerId: 'c1',
    customerName: 'Maple Street Bakery',
    technicianId: null,
    technicianName: null,
    scheduledFor: null,
    completionNotes: null,
    aiSummary: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('<WorkOrderListScreen />', () => {
  it('shows each job with customer, technician (or "Unassigned") and status in words', async () => {
    mockList.mockResolvedValue([
      job({ id: 'w1', title: 'Replace kitchen faucet', status: 'in_progress', technicianId: 't1', technicianName: 'Sam Rivera' }),
      job({ id: 'w2', title: 'Install outdoor lighting', customerName: 'Tomás Rivera', status: 'open' }),
    ]);
    await render(<WorkOrderListScreen />);

    expect(await screen.findByText('Replace kitchen faucet')).toBeTruthy();
    expect(screen.getByText('Maple Street Bakery')).toBeTruthy();
    expect(screen.getByText('Assigned to Sam Rivera')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(screen.getByText('Install outdoor lighting')).toBeTruthy();
    expect(screen.getByText('Unassigned')).toBeTruthy();
    expect(screen.getAllByText('Not scheduled')).toHaveLength(2);
  });

  it('lists jobs that still need doing before finished ones', async () => {
    mockList.mockResolvedValue([
      job({ id: 'w1', title: 'Finished job', status: 'completed', scheduledFor: '2026-10-01T09:00:00Z' }),
      job({ id: 'w2', title: 'Upcoming job', status: 'open', scheduledFor: '2026-10-30T09:00:00Z' }),
    ]);
    await render(<WorkOrderListScreen />);
    await screen.findByText('Upcoming job');

    const titles = screen.getAllByText(/^(Upcoming|Finished) job$/).map((node) => node.props.children);
    expect(titles).toEqual(['Upcoming job', 'Finished job']);
  });

  it('shows a useful empty state', async () => {
    mockList.mockResolvedValue([]);
    await render(<WorkOrderListScreen />);
    expect(await screen.findByText('No jobs yet')).toBeTruthy();
  });

  it('shows a friendly error with a retry that works', async () => {
    mockList.mockRejectedValueOnce(new Error('offline'));
    await render(<WorkOrderListScreen />);
    expect(await screen.findByText("We couldn't load your jobs. Check your connection and try again.")).toBeTruthy();

    mockList.mockResolvedValue([job({})]);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Replace kitchen faucet')).toBeTruthy();
  });
});
