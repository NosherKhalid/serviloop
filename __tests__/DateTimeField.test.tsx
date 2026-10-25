import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform, Text } from 'react-native';

const mockOpen = jest.fn();
let mockOnPickerChange: ((event: unknown, date: Date) => void) | undefined;

jest.mock('@react-native-community/datetimepicker', () => {
  const { Text: MockText } = jest.requireActual('react-native');
  const Picker = (props: { value: Date; onValueChange: (event: unknown, date: Date) => void }) => {
    mockOnPickerChange = props.onValueChange;
    return <MockText testID="ios-picker">{props.value.toISOString()}</MockText>;
  };
  return { __esModule: true, default: Picker, DateTimePickerAndroid: { open: (options: unknown) => mockOpen(options) } };
});

import { DateTimeField } from '@/components/DateTimeField';

afterEach(() => {
  jest.restoreAllMocks();
  mockOpen.mockReset();
});

describe('<DateTimeField /> on iOS', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'ios');
  });

  it('offers to set a date when there is none, and starts at a future full hour', async () => {
    const onChange = jest.fn();
    await render(<DateTimeField label="Scheduled for" value={null} onChange={onChange} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Scheduled for, not scheduled' }));

    const iso = onChange.mock.calls[0][0] as string;
    const picked = new Date(iso);
    expect(picked.getTime()).toBeGreaterThan(Date.now());
    expect(picked.getMinutes()).toBe(0);
  });

  it('shows the native control for an existing date and reports a new pick', async () => {
    const onChange = jest.fn();
    await render(<DateTimeField label="Scheduled for" value="2026-10-26T09:00:00.000Z" onChange={onChange} />);

    expect(screen.getByTestId('ios-picker').props.children).toBe('2026-10-26T09:00:00.000Z');
    mockOnPickerChange?.({}, new Date('2026-10-27T10:30:00.000Z'));

    expect(onChange).toHaveBeenCalledWith('2026-10-27T10:30:00.000Z');
  });

  it('can clear the date', async () => {
    const onChange = jest.fn();
    await render(<DateTimeField label="Scheduled for" value="2026-10-26T09:00:00.000Z" onChange={onChange} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Clear Scheduled for' }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe('<DateTimeField /> on Android', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
  });

  it('shows "Not scheduled" and opens the date dialog, then the time dialog', async () => {
    const onChange = jest.fn();
    await render(<DateTimeField label="Scheduled for" value={null} onChange={onChange} />);
    expect(screen.getByText('Not scheduled')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Scheduled for, not scheduled' }));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen.mock.calls[0][0].mode).toBe('date');

    // The person picks a day: the time dialog follows.
    mockOpen.mock.calls[0][0].onValueChange({}, new Date('2026-10-26T00:00:00.000Z'));
    expect(mockOpen).toHaveBeenCalledTimes(2);
    expect(mockOpen.mock.calls[1][0].mode).toBe('time');

    // The person picks a time: only now is the value reported.
    expect(onChange).not.toHaveBeenCalled();
    mockOpen.mock.calls[1][0].onValueChange({}, new Date('2026-10-26T09:30:00.000Z'));
    expect(onChange).toHaveBeenCalledWith('2026-10-26T09:30:00.000Z');
  });

  it('changes nothing when the person cancels, and never opens the time dialog after a cancelled date', async () => {
    const onChange = jest.fn();
    await render(<DateTimeField label="Scheduled for" value={null} onChange={onChange} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Scheduled for, not scheduled' }));
    // Cancelling is reported through `onDismiss`, which this field deliberately does not handle.
    expect(mockOpen.mock.calls[0][0].onDismiss).toBeUndefined();
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not use the deprecated catch-all onChange', async () => {
    await render(<DateTimeField label="Scheduled for" value={null} onChange={() => undefined} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Scheduled for, not scheduled' }));
    expect(mockOpen.mock.calls[0][0].onChange).toBeUndefined();
    expect(typeof mockOpen.mock.calls[0][0].onValueChange).toBe('function');
  });

  it('shows an existing date in words and can clear it', async () => {
    const onChange = jest.fn();
    await render(<DateTimeField label="Scheduled for" value="2026-10-26T09:00:00.000Z" onChange={onChange} />);

    expect(screen.queryByText('Not scheduled')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Clear Scheduled for' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows an error message', async () => {
    await render(<DateTimeField label="Scheduled for" value={null} onChange={() => undefined} error="Choose a valid date and time" />);
    expect(screen.getByText('Choose a valid date and time')).toBeTruthy();
    expect(Text).toBeTruthy();
  });
});
