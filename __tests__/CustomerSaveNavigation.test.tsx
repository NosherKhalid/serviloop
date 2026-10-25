import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { EditCustomerScreen } from '@/features/customers/components/EditCustomerScreen';
import { NewCustomerScreen } from '@/features/customers/components/NewCustomerScreen';

const mockDismissTo = jest.fn();
const mockBack = jest.fn();
const mockCreate = jest.fn().mockResolvedValue(undefined);
const mockUpdate = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  useRouter: () => ({ dismissTo: mockDismissTo, back: mockBack }),
}));
jest.mock('@/features/customers/hooks/useCustomerActions', () => ({
  useCreateCustomer: () => mockCreate,
  useUpdateCustomer: () => mockUpdate,
}));
jest.mock('@/features/customers/hooks/useCustomer', () => ({
  useCustomer: () => ({
    state: { status: 'ready', customer: { id: 'c1', name: 'Jane Doe', phone: null, address: null } },
    reload: jest.fn(),
  }),
}));

beforeEach(() => jest.clearAllMocks());

// Regression: opened from the Jobs tab ("Add a customer first"), the form can be the only screen in the
// Customers stack. `router.back()` then fell out to the first tab and the owner never saw the list.
describe('after saving a customer', () => {
  it('a new customer takes the owner to the Customers list', async () => {
    await render(<NewCustomerScreen />);

    await fireEvent.changeText(screen.getByLabelText('Name'), 'John T');
    await fireEvent.press(screen.getByRole('button', { name: 'Add customer' }));

    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/customers'));
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('an edited customer takes the owner to the Customers list', async () => {
    await render(<EditCustomerScreen id="c1" />);

    await fireEvent.changeText(screen.getByLabelText('Name'), 'Jane D');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/customers'));
    expect(mockBack).not.toHaveBeenCalled();
  });
});
