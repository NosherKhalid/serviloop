import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockCounts = jest.fn<Promise<Record<WorkOrderStatus, number>>, []>();
const mockRecent = jest.fn<Promise<WorkOrder[]>, [number]>();
const mockFocusEffects: Array<() => void | (() => void)> = [];

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    useRouter: () => ({ push: mockPush, navigate: mockNavigate }),
    // Runs the screen's focus effect on mount and remembers it, so a test can simulate coming back to the tab.
    useFocusEffect: (effect: () => void | (() => void)) =>
      useEffect(() => {
        mockFocusEffects.push(effect);
        return effect();
      }, [effect]),
  };
});
// The dashboard imports the jobs feature through its index, which (indirectly) imports the real client; keep it inert.
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/providers/BusinessProvider', () => ({
  useBusiness: () => ({ state: { status: 'ready', business: { id: 'b1', name: 'Riverside Plumbing Co' } } }),
}));
jest.mock('@/repositories/workOrderRepository', () => ({
  countWorkOrdersByStatus: () => mockCounts(),
  listRecentWorkOrders: (limit: number) => mockRecent(limit),
}));

import { DashboardScreen } from '@/features/dashboard/components/DashboardScreen';

function job(id: string, title: string, status: WorkOrderStatus): WorkOrder {
  return {
    id,
    title,
    description: null,
    status,
    customerId: 'c1',
    customerName: 'Maple Street Bakery',
    technicianId: null,
    technicianName: null,
    scheduledFor: null,
    completionNotes: null,
  };
}

const counts = { open: 2, in_progress: 1, completed: 2, cancelled: 1 };

beforeEach(() => {
  jest.clearAllMocks();
  mockFocusEffects.length = 0;
  mockCounts.mockResolvedValue(counts);
  mockRecent.mockResolvedValue([job('w1', 'Replace kitchen faucet', 'in_progress'), job('w2', 'Annual boiler service', 'open')]);
});

describe('<DashboardScreen />', () => {
  it('shows the counts from the database and the business name', async () => {
    await render(<DashboardScreen />);

    expect(await screen.findByText('Riverside Plumbing Co')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open: 2 jobs' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'In progress: 1 job' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Completed: 2 jobs' })).toBeTruthy();
    expect(screen.getByText('Cancelled: 1 · 6 jobs in total')).toBeTruthy();
  });

  it('lists the recent jobs asked for from the database, each opening its detail', async () => {
    await render(<DashboardScreen />);

    await fireEvent.press(await screen.findByLabelText(/^Replace kitchen faucet, Maple Street Bakery/));

    expect(mockRecent).toHaveBeenCalledWith(5);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/work-orders/[id]', params: { id: 'w1' } });
    expect(screen.getByText('Annual boiler service')).toBeTruthy();
  });

  it('opens the Jobs tab from a count card and from "See all jobs"', async () => {
    await render(<DashboardScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Open: 2 jobs' }));
    await fireEvent.press(screen.getByRole('button', { name: 'See all jobs' }));

    expect(mockNavigate).toHaveBeenCalledTimes(2);
    expect(mockNavigate).toHaveBeenCalledWith('/work-orders');
  });

  it('shows zero for a status nobody has, and says "1 job" in the singular', async () => {
    mockCounts.mockResolvedValue({ open: 1, in_progress: 0, completed: 0, cancelled: 0 });
    await render(<DashboardScreen />);

    expect(await screen.findByRole('button', { name: 'In progress: 0 jobs' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open: 1 job' })).toBeTruthy();
    expect(screen.getByText('Cancelled: 0 · 1 job in total')).toBeTruthy();
  });

  it('invites the owner to add a first job when there are none', async () => {
    mockCounts.mockResolvedValue({ open: 0, in_progress: 0, completed: 0, cancelled: 0 });
    mockRecent.mockResolvedValue([]);
    await render(<DashboardScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Add job' }));

    expect(screen.getByText('No jobs yet')).toBeTruthy();
    expect(mockPush).toHaveBeenCalledWith('/work-orders/new');
  });

  it('shows a retryable error when the numbers cannot be loaded', async () => {
    mockCounts.mockRejectedValueOnce(new TypeError('Network request failed'));
    await render(<DashboardScreen />);

    expect(await screen.findByText("We couldn't load your dashboard. Check your connection and try again.")).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: 'Open: 2 jobs' })).toBeTruthy();
  });

  it('refreshes the numbers when the owner comes back, without a spinner', async () => {
    await render(<DashboardScreen />);
    await screen.findByRole('button', { name: 'Open: 2 jobs' });

    // A job was started on the Jobs tab: one fewer open, one more in progress.
    mockCounts.mockResolvedValue({ open: 1, in_progress: 2, completed: 2, cancelled: 1 });
    await act(async () => {
      mockFocusEffects[mockFocusEffects.length - 1]();
    });

    expect(await screen.findByRole('button', { name: 'Open: 1 job' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'In progress: 2 jobs' })).toBeTruthy();
    expect(screen.queryByLabelText('Loading dashboard')).toBeNull();
  });

  it('keeps the last numbers when a refresh on return fails', async () => {
    await render(<DashboardScreen />);
    await screen.findByRole('button', { name: 'Open: 2 jobs' });

    mockCounts.mockRejectedValue(new TypeError('Network request failed'));
    await act(async () => {
      mockFocusEffects[mockFocusEffects.length - 1]();
    });

    expect(screen.getByRole('button', { name: 'Open: 2 jobs' })).toBeTruthy();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });
});
