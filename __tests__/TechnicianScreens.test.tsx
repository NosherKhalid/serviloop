import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { Technician } from '@/types/technician';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockList = jest.fn<Promise<Technician[]>, []>();
const mockGet = jest.fn<Promise<Technician | null>, [string]>();
const mockUpdate = jest.fn();
const mockSetActive = jest.fn<Promise<Technician>, [string, boolean]>();

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    useRouter: () => ({ push: mockPush, back: mockBack }),
    // Runs the screen's focus effect once on mount, like a screen coming into view.
    useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]),
  };
});
jest.mock('@/providers/BusinessProvider', () => ({
  useBusiness: () => ({ state: { status: 'ready', business: { id: 'b1', name: 'Riverside' } } }),
}));
jest.mock('@/repositories/technicianRepository', () => ({
  listTechnicians: () => mockList(),
  getTechnician: (id: string) => mockGet(id),
  createTechnician: jest.fn(),
  updateTechnician: (...args: unknown[]) => mockUpdate(...args),
  setTechnicianActive: (id: string, active: boolean) => mockSetActive(id, active),
}));

import { EditTechnicianScreen } from '@/features/technicians/components/EditTechnicianScreen';
import { TechnicianListScreen } from '@/features/technicians/components/TechnicianListScreen';

const sam: Technician = { id: 't1', name: 'Sam Rivera', specialty: 'Plumbing', active: true };
const dana: Technician = { id: 't2', name: 'Dana Okafor', specialty: null, active: false };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('<TechnicianListScreen />', () => {
  it('shows technicians, with inactive ones marked in words', async () => {
    mockList.mockResolvedValue([sam, dana]);
    await render(<TechnicianListScreen />);

    expect(await screen.findByText('Sam Rivera')).toBeTruthy();
    expect(screen.getByText('Plumbing')).toBeTruthy();
    expect(screen.getByText('Dana Okafor')).toBeTruthy();
    expect(screen.getAllByText('Inactive')).toHaveLength(1);
  });

  it('shows a useful empty state with a way to add the first technician', async () => {
    mockList.mockResolvedValue([]);
    await render(<TechnicianListScreen />);

    expect(await screen.findByText('No technicians yet')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Add technician' }));
    expect(mockPush).toHaveBeenCalledWith('/settings/technicians/new');
  });

  it('shows a friendly error with a retry that works', async () => {
    mockList.mockRejectedValueOnce(new Error('offline'));
    await render(<TechnicianListScreen />);
    expect(await screen.findByText("We couldn't load your technicians. Check your connection and try again.")).toBeTruthy();

    mockList.mockResolvedValue([sam]);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Sam Rivera')).toBeTruthy();
  });

  it('opens the edit screen for the tapped technician', async () => {
    mockList.mockResolvedValue([sam]);
    await render(<TechnicianListScreen />);
    await screen.findByText('Sam Rivera');

    await fireEvent.press(screen.getByRole('button', { name: 'Edit Sam Rivera, Plumbing' }));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/settings/technicians/[id]', params: { id: 't1' } });
  });
});

describe('<EditTechnicianScreen />', () => {
  it('shows "not found" for a missing or malformed id', async () => {
    await render(<EditTechnicianScreen id={undefined} />);
    expect(await screen.findByText('Technician not found')).toBeTruthy();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('saves changes and goes back', async () => {
    mockGet.mockResolvedValue(sam);
    mockUpdate.mockResolvedValue(undefined);
    await render(<EditTechnicianScreen id="t1" />);
    await screen.findByDisplayValue('Sam Rivera');

    await fireEvent.changeText(screen.getByLabelText('Specialty (optional)'), 'Heating');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith('t1', { name: 'Sam Rivera', specialty: 'Heating' }));
    expect(mockBack).toHaveBeenCalled();
  });

  it('deactivates an active technician and then offers to reactivate', async () => {
    mockGet.mockResolvedValue(sam);
    mockSetActive.mockResolvedValue({ ...sam, active: false });
    await render(<EditTechnicianScreen id="t1" />);
    await screen.findByDisplayValue('Sam Rivera');

    await fireEvent.press(screen.getByRole('button', { name: 'Deactivate technician' }));

    expect(await screen.findByRole('button', { name: 'Reactivate technician' })).toBeTruthy();
    expect(screen.getByText(/cannot be chosen for new ones/)).toBeTruthy();
    expect(mockSetActive).toHaveBeenCalledWith('t1', false);
  });

  it('explains a failed deactivation without raw error text', async () => {
    mockGet.mockResolvedValue(sam);
    mockSetActive.mockRejectedValue(new TypeError('Network request failed'));
    await render(<EditTechnicianScreen id="t1" />);
    await screen.findByDisplayValue('Sam Rivera');

    await fireEvent.press(screen.getByRole('button', { name: 'Deactivate technician' }));

    expect(await screen.findByText("We can't reach the server. Check your connection and try again.")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Deactivate technician' })).toBeTruthy(); // still active
  });
});
