import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { BusinessState } from '@/providers/BusinessProvider';
import type { Technician } from '@/types/technician';

let mockBusinessState: BusinessState = { status: 'ready', business: { id: 'b1', name: 'Riverside' } };
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockSetActive = jest.fn();

jest.mock('@/providers/BusinessProvider', () => ({ useBusiness: () => ({ state: mockBusinessState }) }));
jest.mock('@/repositories/technicianRepository', () => ({
  createTechnician: (...args: unknown[]) => mockCreate(...args),
  updateTechnician: (...args: unknown[]) => mockUpdate(...args),
  setTechnicianActive: (...args: unknown[]) => mockSetActive(...args),
}));

import { useCreateTechnician, useSetTechnicianActive, useUpdateTechnician } from '@/features/technicians/hooks/useTechnicianActions';

const input = { name: 'Sam Rivera', specialty: null };
let create: ReturnType<typeof useCreateTechnician>;
let update: ReturnType<typeof useUpdateTechnician>;
let setActive: ReturnType<typeof useSetTechnicianActive>;

function Probe() {
  create = useCreateTechnician();
  update = useUpdateTechnician();
  setActive = useSetTechnicianActive();
  return <Text>probe</Text>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockBusinessState = { status: 'ready', business: { id: 'b1', name: 'Riverside' } };
});

describe('technician actions', () => {
  it('creates technicians in the signed-in owner\'s business', async () => {
    mockCreate.mockResolvedValue(undefined);
    await render(<Probe />);
    await act(async () => create(input));
    expect(mockCreate).toHaveBeenCalledWith('b1', input);
  });

  it('refuses to create one when no business is loaded', async () => {
    mockBusinessState = { status: 'none' };
    await render(<Probe />);
    await screen.findByText('probe');
    await act(async () => {
      await expect(create(input)).rejects.toThrow('No business loaded');
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('updates a technician and switches active on and off', async () => {
    mockUpdate.mockResolvedValue(undefined);
    mockSetActive.mockResolvedValue({ id: 't1', name: 'Sam Rivera', specialty: null, active: false });
    await render(<Probe />);

    await act(async () => update('t1', input));
    let result: Technician | undefined;
    await act(async () => {
      result = await setActive('t1', false);
    });

    expect(mockUpdate).toHaveBeenCalledWith('t1', input);
    expect(mockSetActive).toHaveBeenCalledWith('t1', false);
    expect(result).toEqual({ id: 't1', name: 'Sam Rivera', specialty: null, active: false }); // the updated technician comes back
  });
});
