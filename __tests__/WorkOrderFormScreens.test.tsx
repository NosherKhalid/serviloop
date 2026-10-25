import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import type { Customer } from '@/types/customer';
import type { Technician } from '@/types/technician';
import type { WorkOrder } from '@/types/workOrder';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockDismissTo = jest.fn();
const mockDelete = jest.fn();
const mockListCustomers = jest.fn<Promise<Customer[]>, []>();
const mockListTechnicians = jest.fn<Promise<Technician[]>, []>();
const mockGetWorkOrder = jest.fn<Promise<WorkOrder | null>, [string]>();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));
// Each screen's "came back into view" effect is remembered so a test can simulate coming back to it.
const mockFocusEffects: Array<() => void | (() => void)> = [];
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    useRouter: () => ({ push: mockPush, back: mockBack, dismissTo: mockDismissTo }),
    useFocusEffect: (effect: () => void | (() => void)) =>
      useEffect(() => {
        mockFocusEffects.push(effect);
        return effect();
      }, [effect]),
  };
});
jest.mock('@/providers/BusinessProvider', () => ({
  useBusiness: () => ({ state: { status: 'ready', business: { id: 'b1', name: 'Riverside' } } }),
}));
jest.mock('@/repositories/customerRepository', () => ({ listCustomers: () => mockListCustomers() }));
jest.mock('@/repositories/technicianRepository', () => ({ listTechnicians: () => mockListTechnicians() }));
jest.mock('@/repositories/workOrderRepository', () => ({
  getWorkOrder: (id: string) => mockGetWorkOrder(id),
  createWorkOrder: (...args: unknown[]) => mockCreate(...args),
  updateWorkOrder: (...args: unknown[]) => mockUpdate(...args),
  deleteWorkOrder: (...args: unknown[]) => mockDelete(...args),
}));

import { EditWorkOrderScreen } from '@/features/workOrders/components/EditWorkOrderScreen';
import { NewWorkOrderScreen } from '@/features/workOrders/components/NewWorkOrderScreen';

const maple: Customer = { id: 'c1', name: 'Maple Street Bakery', phone: null, address: '12 Maple Street', createdAt: '2026-09-01T09:00:00Z' };
const priya: Customer = { id: 'c2', name: 'Priya Natarajan', phone: null, address: null, createdAt: '2026-09-02T09:00:00Z' };
const sam: Technician = { id: 't1', name: 'Sam Rivera', specialty: 'Plumbing', active: true };
const dana: Technician = { id: 't2', name: 'Dana Okafor', specialty: null, active: false };

const existing: WorkOrder = {
  id: 'w1',
  title: 'Replace kitchen faucet',
  description: 'Dripping tap',
  status: 'open',
  customerId: 'c1',
  customerName: 'Maple Street Bakery',
  technicianId: null,
  technicianName: null,
  scheduledFor: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFocusEffects.length = 0;
  mockListCustomers.mockResolvedValue([maple, priya]);
  mockListTechnicians.mockResolvedValue([sam, dana]);
});

async function choose(field: string, option: string) {
  await fireEvent.press(await screen.findByRole('button', { name: new RegExp(`^${field},`) }));
  await fireEvent.press(await screen.findByRole('radio', { name: new RegExp(`^${option}`) }));
}

describe('<NewWorkOrderScreen />', () => {
  it('asks to add a customer first when there are none', async () => {
    mockListCustomers.mockResolvedValue([]);
    await render(<NewWorkOrderScreen />);

    expect(await screen.findByText('Add a customer first')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Add customer' }));
    expect(mockPush).toHaveBeenCalledWith('/customers/new');
  });

  it('shows a friendly error with a working retry when the choices cannot load', async () => {
    mockListCustomers.mockRejectedValueOnce(new Error('offline'));
    await render(<NewWorkOrderScreen />);
    expect(await screen.findByText("We couldn't load your customers and technicians. Check your connection and try again.")).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByLabelText('Title')).toBeTruthy();
  });

  it('shows the validation messages and saves nothing for an empty form', async () => {
    await render(<NewWorkOrderScreen />);
    await screen.findByLabelText('Title');

    await fireEvent.press(screen.getByRole('button', { name: 'Add job' }));

    expect(await screen.findByText('Enter at least 2 characters')).toBeTruthy();
    expect(screen.getByText('Choose a customer for this job')).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates a job for a customer with an optional technician, then goes back', async () => {
    mockCreate.mockResolvedValue(undefined);
    await render(<NewWorkOrderScreen />);
    await screen.findByLabelText('Title');

    await fireEvent.changeText(screen.getByLabelText('Title'), '  Fix leaking pipe ');
    await choose('Customer', 'Priya Natarajan');
    await choose('Technician \\(optional\\)', 'Sam Rivera');
    await fireEvent.press(screen.getByRole('button', { name: 'Add job' }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    expect(mockCreate).toHaveBeenCalledWith('b1', {
      title: 'Fix leaking pipe',
      description: null,
      customerId: 'c2',
      technicianId: 't1',
      scheduledFor: null,
      status: 'open',
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('does not offer a deactivated technician for a new job', async () => {
    await render(<NewWorkOrderScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: /^Technician \(optional\),/ }));

    expect(screen.getByRole('radio', { name: 'Unassigned' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /^Sam Rivera/ })).toBeTruthy();
    expect(screen.queryByRole('radio', { name: /Dana Okafor/ })).toBeNull();
  });

  it('has no status choice: a new job always starts Open', async () => {
    await render(<NewWorkOrderScreen />);
    await screen.findByLabelText('Title');
    expect(screen.queryByRole('button', { name: /^Status,/ })).toBeNull();
  });

  it('shows a friendly message when saving fails, never the raw error', async () => {
    mockCreate.mockRejectedValue({ code: '23503', message: 'violates foreign key constraint "work_orders_customer_same_business"' });
    await render(<NewWorkOrderScreen />);
    await screen.findByLabelText('Title');
    await fireEvent.changeText(screen.getByLabelText('Title'), 'Fix leaking pipe');
    await choose('Customer', 'Priya Natarajan');

    await fireEvent.press(screen.getByRole('button', { name: 'Add job' }));

    expect(await screen.findByText("We couldn't save this job. Please try again.")).toBeTruthy();
    expect(screen.queryByText(/foreign key/)).toBeNull();
  });
});

describe('<EditWorkOrderScreen />', () => {
  it('shows "not found" for a missing id', async () => {
    await render(<EditWorkOrderScreen id={undefined} />);
    expect(await screen.findByText('Job not found')).toBeTruthy();
    expect(mockGetWorkOrder).not.toHaveBeenCalled();
  });

  it('is pre-filled with the job and saves changes, then goes back', async () => {
    mockGetWorkOrder.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue(undefined);
    await render(<EditWorkOrderScreen id="w1" />);
    await screen.findByDisplayValue('Replace kitchen faucet');
    expect(screen.getByDisplayValue('Dripping tap')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Customer, Maple Street Bakery' })).toBeTruthy();

    await choose('Technician \\(optional\\)', 'Sam Rivera');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(mockUpdate).toHaveBeenCalledWith('w1', {
      title: 'Replace kitchen faucet',
      description: 'Dripping tap',
      customerId: 'c1',
      technicianId: 't1',
      scheduledFor: null,
      status: 'open',
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('offers only the current status and the allowed moves', async () => {
    mockGetWorkOrder.mockResolvedValue(existing); // open
    await render(<EditWorkOrderScreen id="w1" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Status, Open' }));

    expect(screen.getByRole('radio', { name: 'Open' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'In progress' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Cancelled' })).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Completed' })).toBeNull(); // open cannot jump to completed
  });

  it('saves a status change to an allowed status', async () => {
    mockGetWorkOrder.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue(undefined);
    await render(<EditWorkOrderScreen id="w1" />);
    await screen.findByDisplayValue('Replace kitchen faucet');

    await choose('Status', 'In progress');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
    expect(mockUpdate.mock.calls[0][1]).toMatchObject({ status: 'in_progress' });
  });

  it('keeps showing a technician who was deactivated after being assigned', async () => {
    mockGetWorkOrder.mockResolvedValue({ ...existing, technicianId: 't2', technicianName: 'Dana Okafor' });
    await render(<EditWorkOrderScreen id="w1" />);

    expect(await screen.findByRole('button', { name: 'Technician (optional), Dana Okafor (inactive)' })).toBeTruthy();
  });

  it('treats a finished job\'s status as final', async () => {
    mockGetWorkOrder.mockResolvedValue({ ...existing, status: 'completed' });
    await render(<EditWorkOrderScreen id="w1" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Status, Completed' }));

    expect(screen.getAllByRole('radio')).toHaveLength(1);
  });
});

// The scenario found by the owner: the first job needs a first customer, which is added elsewhere
// while the job form stays open; coming back must show the new customer.
describe('job form choices stay current when the owner returns to it', () => {
  async function comeBack() {
    await act(async () => {
      mockFocusEffects.forEach((effect) => effect());
    });
  }

  it('replaces "Add a customer first" with the form once a customer exists', async () => {
    mockListCustomers.mockResolvedValue([]);
    await render(<NewWorkOrderScreen />);
    expect(await screen.findByText('Add a customer first')).toBeTruthy();

    mockListCustomers.mockResolvedValue([maple]); // the owner added a customer on the Customers tab
    await comeBack();

    expect(await screen.findByLabelText('Title')).toBeTruthy();
    expect(screen.queryByText('Add a customer first')).toBeNull();
  });

  it('offers a newly added customer and technician without losing what was typed', async () => {
    await render(<NewWorkOrderScreen />);
    await fireEvent.changeText(await screen.findByLabelText('Title'), 'Fix leaking pipe');

    mockListCustomers.mockResolvedValue([maple, priya, { ...priya, id: 'c3', name: 'Zed New Customer' }]);
    mockListTechnicians.mockResolvedValue([sam, { id: 't3', name: 'Nina Newhire', specialty: null, active: true }]);
    await comeBack();

    await fireEvent.press(await screen.findByRole('button', { name: /^Customer,/ }));
    expect(await screen.findByRole('radio', { name: /^Zed New Customer/ })).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: /^Zed New Customer/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Technician \(optional\),/ }));
    expect(screen.getByRole('radio', { name: /^Nina Newhire/ })).toBeTruthy();
    expect(screen.getByDisplayValue('Fix leaking pipe')).toBeTruthy(); // typing survived the refresh
  });

  it('no longer offers a technician who was deactivated in the meantime', async () => {
    mockListTechnicians.mockResolvedValue([sam]);
    await render(<NewWorkOrderScreen />);
    await screen.findByLabelText('Title');

    mockListTechnicians.mockResolvedValue([{ ...sam, active: false }]);
    await comeBack();

    await fireEvent.press(await screen.findByRole('button', { name: /^Technician \(optional\),/ }));
    expect(screen.queryByRole('radio', { name: /Sam Rivera/ })).toBeNull();
  });

  it('keeps the form on screen if the refresh fails (no error screen over the owner\'s typing)', async () => {
    await render(<NewWorkOrderScreen />);
    await fireEvent.changeText(await screen.findByLabelText('Title'), 'Fix leaking pipe');

    mockListCustomers.mockRejectedValue(new Error('offline'));
    await comeBack();

    expect(screen.getByDisplayValue('Fix leaking pipe')).toBeTruthy();
    expect(screen.queryByText(/We couldn't load your customers and technicians/)).toBeNull();
  });
});

describe('deleting a job', () => {
  function confirmDelete() {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    return () =>
      act(async () => {
        (alertSpy.mock.calls[0][2] as AlertButton[]).find((button) => button.text === 'Delete')?.onPress?.();
      });
  }

  beforeEach(() => mockGetWorkOrder.mockResolvedValue(existing));

  it('asks first, then deletes that job and returns to the Jobs list', async () => {
    const tapDelete = confirmDelete();
    mockDelete.mockResolvedValue(undefined);
    await render(<EditWorkOrderScreen id="w1" />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Delete job' }));
    expect(mockDelete).not.toHaveBeenCalled();
    await tapDelete();

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('w1'));
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/work-orders'));
  });

  it('keeps the job and shows a friendly message when the delete fails', async () => {
    const tapDelete = confirmDelete();
    mockDelete.mockRejectedValue({ code: 'XX000', message: 'relation "work_orders" exploded' });
    await render(<EditWorkOrderScreen id="w1" />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Delete job' }));
    await tapDelete();

    expect(await screen.findByText("We couldn't delete this job. Please try again.")).toBeTruthy();
    expect(screen.queryByText(/exploded/)).toBeNull();
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it('offers no delete on the new job form', async () => {
    await render(<NewWorkOrderScreen />);

    await screen.findByText('Title');
    expect(screen.queryByRole('button', { name: 'Delete job' })).toBeNull();
  });
});
