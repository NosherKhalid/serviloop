import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import { DeleteButton } from '@/components/DeleteButton';

const onDelete = jest.fn();
const onDeleted = jest.fn();
let alertSpy: jest.SpyInstance;

// The confirmation is a native alert; tests "tap" one of its buttons by calling its handler.
async function tapAlertButton(text: string, callIndex = 0) {
  const buttons = alertSpy.mock.calls[callIndex][2] as AlertButton[];
  await act(async () => {
    buttons.find((button) => button.text === text)?.onPress?.();
  });
}

function setup() {
  return render(
    <DeleteButton
      title="Delete job"
      confirmTitle="Delete this job?"
      confirmMessage="It will be removed permanently."
      onDelete={onDelete}
      onDeleted={onDeleted}
      blockedMessage="Still in use."
      failureMessage="We couldn't delete this. Please try again."
    />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  onDelete.mockResolvedValue(undefined);
});

describe('<DeleteButton />', () => {
  it('only asks on the first tap and deletes nothing', async () => {
    await setup();

    await fireEvent.press(screen.getByRole('button', { name: 'Delete job' }));

    expect(alertSpy).toHaveBeenCalledWith('Delete this job?', 'It will be removed permanently.', expect.any(Array));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('deletes nothing when the owner cancels', async () => {
    await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete job' }));

    await tapAlertButton('Cancel');

    expect(onDelete).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('marks the confirm button destructive and deletes once confirmed', async () => {
    await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete job' }));
    const buttons = alertSpy.mock.calls[0][2] as AlertButton[];
    expect(buttons.find((button) => button.text === 'Delete')?.style).toBe('destructive');

    await tapAlertButton('Delete');

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('explains when something still depends on the record, and stays on the screen', async () => {
    onDelete.mockRejectedValue({ code: '23503', message: 'violates foreign key constraint "work_orders_customer_same_business"' });
    await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete job' }));

    await tapAlertButton('Delete');

    expect(await screen.findByText('Still in use.')).toBeTruthy();
    expect(screen.queryByText(/foreign key/)).toBeNull();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('shows a friendly message, never raw database text, for any other failure', async () => {
    onDelete.mockRejectedValue({ code: 'XX000', message: 'relation "customers" exploded' });
    await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete job' }));

    await tapAlertButton('Delete');

    expect(await screen.findByText("We couldn't delete this. Please try again.")).toBeTruthy();
    expect(screen.queryByText(/exploded/)).toBeNull();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('says so when the connection is down', async () => {
    onDelete.mockRejectedValue(new TypeError('Network request failed'));
    await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete job' }));

    await tapAlertButton('Delete');

    expect(await screen.findByText("We can't reach the server. Check your connection and try again.")).toBeTruthy();
  });

  it('can be retried after a failure', async () => {
    onDelete.mockRejectedValueOnce({ code: 'XX000' }).mockResolvedValueOnce(undefined);
    await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete job' }));
    await tapAlertButton('Delete');
    await screen.findByText("We couldn't delete this. Please try again.");

    await fireEvent.press(screen.getByRole('button', { name: 'Delete job' }));
    await tapAlertButton('Delete', 1);

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("We couldn't delete this. Please try again.")).toBeNull();
  });
});
