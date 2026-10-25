import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

import { OptionPicker } from '@/components/OptionPicker';

const options = [
  { id: 'c1', label: 'Maple Street Bakery', detail: '12 Maple Street' },
  { id: 'c2', label: 'Priya Natarajan' },
];

describe('<OptionPicker />', () => {
  it('shows the placeholder, then the chosen option', async () => {
    const view = await render(<OptionPicker label="Customer" placeholder="Choose a customer" options={options} value="" onChange={() => undefined} />);
    expect(screen.getByText('Choose a customer')).toBeTruthy();

    await view.rerender(<OptionPicker label="Customer" placeholder="Choose a customer" options={options} value="c2" onChange={() => undefined} />);
    expect(screen.getByText('Priya Natarajan')).toBeTruthy();
  });

  it('opens a list and reports the option the person taps', async () => {
    const onChange = jest.fn();
    await render(<OptionPicker label="Customer" options={options} value="" onChange={onChange} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Customer, Choose' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Maple Street Bakery, 12 Maple Street' }));

    expect(onChange).toHaveBeenCalledWith('c1');
  });

  it('marks the current choice as selected, with a tick as well as state', async () => {
    await render(<OptionPicker label="Customer" options={options} value="c2" onChange={() => undefined} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Customer, Priya Natarajan' }));

    expect(screen.getByRole('radio', { name: 'Priya Natarajan', selected: true })).toBeTruthy();
    expect(screen.getByText('✓')).toBeTruthy();
  });

  it('offers a "none" choice when asked to, and shows it when nothing is chosen', async () => {
    const onChange = jest.fn();
    await render(<OptionPicker label="Technician" noneLabel="Unassigned" options={options} value="c1" onChange={onChange} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Technician, Maple Street Bakery' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Unassigned' }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('shows "none" text in the field when nothing is chosen', async () => {
    await render(<OptionPicker label="Technician" noneLabel="Unassigned" options={options} value="" onChange={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Technician, Unassigned' })).toBeTruthy();
  });

  it('does nothing when disabled and shows an error message', async () => {
    await render(<OptionPicker label="Customer" options={options} value="" onChange={() => undefined} disabled error="Choose a customer" />);
    expect(screen.getByText('Choose a customer')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Customer, Choose' }).props.accessibilityState.disabled).toBe(true);
  });
});
