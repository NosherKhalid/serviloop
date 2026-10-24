import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { CustomerForm } from '@/features/customers/components/CustomerForm';
import { emptyCustomerForm } from '@/features/customers/validation';

function setup(onSave: jest.Mock) {
  return render(<CustomerForm initialValues={emptyCustomerForm} submitLabel="Add customer" onSave={onSave} />);
}

describe('<CustomerForm />', () => {
  it('shows an error and does not save when the name is empty', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    await setup(onSave);

    await fireEvent.press(screen.getByRole('button', { name: 'Add customer' }));

    expect(await screen.findByText('Enter at least 2 characters')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves the cleaned-up values when the form is valid', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    await setup(onSave);

    await fireEvent.changeText(screen.getByLabelText('Name'), '  Jane Doe ');
    await fireEvent.changeText(screen.getByLabelText('Phone (optional)'), '555-0100');
    await fireEvent.press(screen.getByRole('button', { name: 'Add customer' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({ name: 'Jane Doe', phone: '555-0100', address: null });
  });

  it('clears the error once the user starts fixing the field', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    await setup(onSave);

    await fireEvent.press(screen.getByRole('button', { name: 'Add customer' }));
    expect(await screen.findByText('Enter at least 2 characters')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Name'), 'Jo');

    expect(screen.queryByText('Enter at least 2 characters')).toBeNull();
  });

  it('shows a friendly message when saving fails', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('network down'));
    await setup(onSave);

    await fireEvent.changeText(screen.getByLabelText('Name'), 'Jane Doe');
    await fireEvent.press(screen.getByRole('button', { name: 'Add customer' }));

    expect(await screen.findByText("We couldn't save this customer. Check your connection and try again.")).toBeTruthy();
    expect(screen.queryByText(/network down/)).toBeNull(); // raw error text is never shown
  });
});
