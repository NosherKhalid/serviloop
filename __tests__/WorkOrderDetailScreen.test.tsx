import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { WorkOrder } from '@/types/workOrder';

const mockPush = jest.fn();
const mockDismissTo = jest.fn();
const mockGet = jest.fn<Promise<WorkOrder | null>, [string]>();
const mockProgress = jest.fn<Promise<WorkOrder>, [string, unknown]>();
const mockFocusEffects: Array<() => void | (() => void)> = [];

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    useRouter: () => ({ push: mockPush, dismissTo: mockDismissTo }),
    // Runs the screen's focus effect on mount and remembers it, so a test can simulate coming back to the screen.
    useFocusEffect: (effect: () => void | (() => void)) =>
      useEffect(() => {
        mockFocusEffects.push(effect);
        return effect();
      }, [effect]),
  };
});
jest.mock('@/repositories/workOrderRepository', () => ({
  getWorkOrder: (id: string) => mockGet(id),
  updateWorkOrderProgress: (id: string, progress: unknown) => mockProgress(id, progress),
}));

import { WorkOrderDetailScreen } from '@/features/workOrders/components/WorkOrderDetailScreen';

const open: WorkOrder = {
  id: 'w1',
  title: 'Replace kitchen faucet',
  description: 'Dripping mixer tap',
  status: 'open',
  customerId: 'c1',
  customerName: 'Maple Street Bakery',
  technicianId: 't1',
  technicianName: 'Sam Rivera',
  scheduledFor: null,
  completionNotes: null,
};
const inProgress: WorkOrder = { ...open, status: 'in_progress' };

beforeEach(() => {
  jest.clearAllMocks();
  mockFocusEffects.length = 0;
  mockGet.mockResolvedValue(open);
});

describe('<WorkOrderDetailScreen />', () => {
  it('shows what the job is about', async () => {
    await render(<WorkOrderDetailScreen id="w1" />);

    expect(await screen.findByText('Replace kitchen faucet')).toBeTruthy();
    expect(screen.getByText('Maple Street Bakery')).toBeTruthy();
    expect(screen.getByText('Sam Rivera')).toBeTruthy();
    expect(screen.getByText('Dripping mixer tap')).toBeTruthy();
    expect(screen.getByText('Not scheduled')).toBeTruthy();
    expect(mockGet).toHaveBeenCalledWith('w1');
  });

  it('says "Unassigned" when there is no technician', async () => {
    mockGet.mockResolvedValue({ ...open, technicianId: null, technicianName: null });
    await render(<WorkOrderDetailScreen id="w1" />);

    expect(await screen.findByText('Unassigned')).toBeTruthy();
  });

  it('shows a spinner first, then a retryable error when loading fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('network'));
    await render(<WorkOrderDetailScreen id="w1" />);

    expect(await screen.findByText("We couldn't load this job. Check your connection and try again.")).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Replace kitchen faucet')).toBeTruthy();
  });

  it('says so when the job does not exist, and offers the Jobs list', async () => {
    mockGet.mockResolvedValue(null);
    await render(<WorkOrderDetailScreen id="gone" />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Back to jobs' }));
    expect(mockDismissTo).toHaveBeenCalledWith('/work-orders');
  });

  it('treats a missing or malformed id as "not found" without asking the database', async () => {
    await render(<WorkOrderDetailScreen id={undefined} />);
    expect(await screen.findByText('Job not found')).toBeTruthy();
    expect(mockGet).not.toHaveBeenCalled();
  });

  describe('moving the job along', () => {
    it('offers exactly the allowed moves for an open job', async () => {
      await render(<WorkOrderDetailScreen id="w1" />);

      expect(await screen.findByRole('button', { name: 'Start job' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Cancel job' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Mark completed' })).toBeNull();
    });

    it('starts the job: saves the new status and shows the next moves', async () => {
      mockProgress.mockResolvedValue(inProgress);
      await render(<WorkOrderDetailScreen id="w1" />);

      await fireEvent.press(await screen.findByRole('button', { name: 'Start job' }));

      await waitFor(() => expect(mockProgress).toHaveBeenCalledWith('w1', { status: 'in_progress', completionNotes: null }));
      expect(await screen.findByRole('button', { name: 'Mark completed' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Start job' })).toBeNull();
    });

    it('saves the notes typed so far together with the status change', async () => {
      mockGet.mockResolvedValue(inProgress);
      mockProgress.mockResolvedValue({ ...inProgress, status: 'completed', completionNotes: 'Replaced the washer.' });
      await render(<WorkOrderDetailScreen id="w1" />);

      await fireEvent.changeText(await screen.findByLabelText('Completion notes'), '  Replaced the washer.  ');
      await fireEvent.press(screen.getByRole('button', { name: 'Mark completed' }));

      await waitFor(() =>
        expect(mockProgress).toHaveBeenCalledWith('w1', { status: 'completed', completionNotes: 'Replaced the washer.' }),
      );
      expect(await screen.findByText('This job is completed. Completed jobs are final.')).toBeTruthy();
      expect(screen.getByDisplayValue('Replaced the washer.')).toBeTruthy();
    });

    it('lets a completed job be finished without notes (notes are optional)', async () => {
      mockGet.mockResolvedValue(inProgress);
      mockProgress.mockResolvedValue({ ...inProgress, status: 'completed' });
      await render(<WorkOrderDetailScreen id="w1" />);

      await fireEvent.press(await screen.findByRole('button', { name: 'Mark completed' }));

      await waitFor(() => expect(mockProgress).toHaveBeenCalledWith('w1', { status: 'completed', completionNotes: null }));
    });

    it('offers no moves for a completed job', async () => {
      mockGet.mockResolvedValue({ ...open, status: 'completed' });
      await render(<WorkOrderDetailScreen id="w1" />);

      expect(await screen.findByText('This job is completed. Completed jobs are final.')).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Start job' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Reopen job' })).toBeNull();
    });

    it('offers only "Reopen job" for a cancelled job', async () => {
      mockGet.mockResolvedValue({ ...open, status: 'cancelled' });
      await render(<WorkOrderDetailScreen id="w1" />);

      expect(await screen.findByRole('button', { name: 'Reopen job' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Start job' })).toBeNull();
    });

    it('keeps the job as it was and explains when saving fails', async () => {
      mockProgress.mockRejectedValue({ code: 'XX000', message: 'relation "work_orders" exploded' });
      await render(<WorkOrderDetailScreen id="w1" />);

      await fireEvent.press(await screen.findByRole('button', { name: 'Start job' }));

      expect(await screen.findByText("We couldn't save this. Please try again.")).toBeTruthy();
      expect(screen.queryByText(/exploded/)).toBeNull();
      expect(screen.getByRole('button', { name: 'Start job' })).toBeTruthy(); // still open, can retry
    });

    it('says the connection is down when the request cannot be sent', async () => {
      mockProgress.mockRejectedValue(new TypeError('Network request failed'));
      await render(<WorkOrderDetailScreen id="w1" />);

      await fireEvent.press(await screen.findByRole('button', { name: 'Start job' }));

      expect(await screen.findByText("We can't reach the server. Check your connection and try again.")).toBeTruthy();
    });
  });

  describe('completion notes', () => {
    it('shows the saved notes and keeps "Save notes" off until something changes', async () => {
      mockGet.mockResolvedValue({ ...open, completionNotes: 'Replaced the washer.' });
      await render(<WorkOrderDetailScreen id="w1" />);

      expect(await screen.findByDisplayValue('Replaced the washer.')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Save notes' }).props.accessibilityState.disabled).toBe(true);
    });

    it('saves only the notes, without changing the status', async () => {
      mockProgress.mockResolvedValue({ ...open, completionNotes: 'Called the customer.' });
      await render(<WorkOrderDetailScreen id="w1" />);

      await fireEvent.changeText(await screen.findByLabelText('Completion notes'), 'Called the customer.');
      await fireEvent.press(screen.getByRole('button', { name: 'Save notes' }));

      await waitFor(() => expect(mockProgress).toHaveBeenCalledWith('w1', { completionNotes: 'Called the customer.' }));
      expect(screen.getByRole('button', { name: 'Start job' })).toBeTruthy(); // still open
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save notes' }).props.accessibilityState.disabled).toBe(true));
    });

    it('lets notes be fixed on a completed job', async () => {
      mockGet.mockResolvedValue({ ...open, status: 'completed', completionNotes: 'Replaced the washr.' });
      mockProgress.mockResolvedValue({ ...open, status: 'completed', completionNotes: 'Replaced the washer.' });
      await render(<WorkOrderDetailScreen id="w1" />);

      await fireEvent.changeText(await screen.findByLabelText('Completion notes'), 'Replaced the washer.');
      await fireEvent.press(screen.getByRole('button', { name: 'Save notes' }));

      await waitFor(() => expect(mockProgress).toHaveBeenCalledWith('w1', { completionNotes: 'Replaced the washer.' }));
    });

    it('clearing the notes saves "no notes" (null)', async () => {
      mockGet.mockResolvedValue({ ...open, completionNotes: 'Old notes' });
      mockProgress.mockResolvedValue(open);
      await render(<WorkOrderDetailScreen id="w1" />);

      await fireEvent.changeText(await screen.findByLabelText('Completion notes'), '   ');
      await fireEvent.press(screen.getByRole('button', { name: 'Save notes' }));

      await waitFor(() => expect(mockProgress).toHaveBeenCalledWith('w1', { completionNotes: null }));
    });

    it('refuses notes that are too long without sending anything', async () => {
      await render(<WorkOrderDetailScreen id="w1" />);

      await fireEvent.changeText(await screen.findByLabelText('Completion notes'), 'a'.repeat(4001));
      await fireEvent.press(screen.getByRole('button', { name: 'Save notes' }));

      expect(await screen.findByText('Keep the notes under 4000 characters')).toBeTruthy();
      expect(mockProgress).not.toHaveBeenCalled();
    });

    it('keeps what was typed when saving fails', async () => {
      mockProgress.mockRejectedValue({ code: 'XX000' });
      await render(<WorkOrderDetailScreen id="w1" />);

      await fireEvent.changeText(await screen.findByLabelText('Completion notes'), 'Important details');
      await fireEvent.press(screen.getByRole('button', { name: 'Save notes' }));

      expect(await screen.findByText("We couldn't save this. Please try again.")).toBeTruthy();
      expect(screen.getByDisplayValue('Important details')).toBeTruthy();
    });
  });

  it('opens the edit form for this job', async () => {
    await render(<WorkOrderDetailScreen id="w1" />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Edit job' }));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/work-orders/[id]/edit', params: { id: 'w1' } });
  });

  it('shows changes made on the edit screen when the owner comes back, without losing typed notes', async () => {
    await render(<WorkOrderDetailScreen id="w1" />);
    await fireEvent.changeText(await screen.findByLabelText('Completion notes'), 'Half-written note');

    mockGet.mockResolvedValue({ ...open, title: 'Replace bathroom faucet' });
    await act(async () => {
      mockFocusEffects[mockFocusEffects.length - 1]();
    });

    expect(await screen.findByText('Replace bathroom faucet')).toBeTruthy();
    expect(screen.getByDisplayValue('Half-written note')).toBeTruthy();
  });

  it('keeps showing the job when a refresh on return fails', async () => {
    await render(<WorkOrderDetailScreen id="w1" />);
    await screen.findByText('Replace kitchen faucet');

    mockGet.mockRejectedValue(new Error('network'));
    await act(async () => {
      mockFocusEffects[mockFocusEffects.length - 1]();
    });

    expect(screen.getByText('Replace kitchen faucet')).toBeTruthy();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });
});
