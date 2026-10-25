import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { BusinessState } from '@/providers/BusinessProvider';

let mockBusinessState: BusinessState = { status: 'ready', business: { id: 'b1', name: 'Riverside' } };
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/providers/BusinessProvider', () => ({ useBusiness: () => ({ state: mockBusinessState }) }));
jest.mock('@/repositories/customerRepository', () => ({
  createCustomer: (...args: unknown[]) => mockCreate(...args),
  updateCustomer: (...args: unknown[]) => mockUpdate(...args),
}));

import { useCreateCustomer, useUpdateCustomer } from '@/features/customers/hooks/useCustomerActions';

const input = { name: 'Jane Doe', phone: null, address: null };
let create: ReturnType<typeof useCreateCustomer>;
let update: ReturnType<typeof useUpdateCustomer>;

function Probe() {
  create = useCreateCustomer();
  update = useUpdateCustomer();
  return <Text>probe</Text>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockBusinessState = { status: 'ready', business: { id: 'b1', name: 'Riverside' } };
});

describe('customer actions', () => {
  it('creates customers in the signed-in owner\'s business', async () => {
    mockCreate.mockResolvedValue(undefined);
    await render(<Probe />);

    await act(async () => create(input));

    expect(mockCreate).toHaveBeenCalledWith('b1', input);
  });

  it('refuses to create a customer when no business is loaded', async () => {
    mockBusinessState = { status: 'none' };
    await render(<Probe />);
    await screen.findByText('probe');

    await act(async () => {
      await expect(create(input)).rejects.toThrow('No business loaded');
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('updates a customer by id', async () => {
    mockUpdate.mockResolvedValue(undefined);
    await render(<Probe />);

    await act(async () => update('c1', input));

    expect(mockUpdate).toHaveBeenCalledWith('c1', input);
  });
});
