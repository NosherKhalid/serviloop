import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { BusinessState } from '@/providers/BusinessProvider';

let mockState: BusinessState = { status: 'none' };
const mockCreateBusiness = jest.fn<Promise<void>, [string]>();
const mockLoadDemoData = jest.fn<Promise<void>, []>();
const mockContinue = jest.fn();

jest.mock('@/providers/BusinessProvider', () => ({
  useBusiness: () => ({
    state: mockState,
    createBusiness: mockCreateBusiness,
    loadDemoData: mockLoadDemoData,
    continueAfterDemo: mockContinue,
    reload: jest.fn(),
  }),
}));

import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';

beforeEach(() => {
  jest.clearAllMocks();
  mockState = { status: 'none' };
});

describe('<OnboardingScreen />', () => {
  it('asks for a name and does not create anything when it is too short', async () => {
    await render(<OnboardingScreen />);

    await fireEvent.changeText(screen.getByLabelText('Business name'), 'R');
    await fireEvent.press(screen.getByRole('button', { name: 'Create my business' }));

    expect(await screen.findByText('Enter at least 2 characters')).toBeTruthy();
    expect(mockCreateBusiness).not.toHaveBeenCalled();
  });

  it('creates the business with the trimmed name', async () => {
    mockCreateBusiness.mockResolvedValue(undefined);
    await render(<OnboardingScreen />);

    await fireEvent.changeText(screen.getByLabelText('Business name'), '  Riverside Plumbing Co ');
    await fireEvent.press(screen.getByRole('button', { name: 'Create my business' }));

    await waitFor(() => expect(mockCreateBusiness).toHaveBeenCalledWith('Riverside Plumbing Co'));
  });

  it('shows a friendly message when creating fails, never the raw error', async () => {
    mockCreateBusiness.mockRejectedValue(new TypeError('Network request failed'));
    await render(<OnboardingScreen />);
    await fireEvent.changeText(screen.getByLabelText('Business name'), 'Riverside');

    await fireEvent.press(screen.getByRole('button', { name: 'Create my business' }));

    expect(await screen.findByText("We can't reach the server. Check your connection and try again.")).toBeTruthy();
    expect(screen.queryByText(/Network request failed/)).toBeNull();
  });

  it('starts with demo data', async () => {
    mockLoadDemoData.mockResolvedValue(undefined);
    await render(<OnboardingScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Start with demo data' }));

    await waitFor(() => expect(mockLoadDemoData).toHaveBeenCalledTimes(1));
    expect(mockCreateBusiness).not.toHaveBeenCalled();
  });

  it('explains when demo data cannot be loaded', async () => {
    mockLoadDemoData.mockRejectedValue({ code: 'P0001', message: 'This business already has data. Demo data can only be loaded into an empty business.' });
    await render(<OnboardingScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Start with demo data' }));

    expect(await screen.findByText("This business already has data, so demo data can't be loaded.")).toBeTruthy();
  });

  it('shows what was loaded after demo data and continues on tap', async () => {
    mockState = {
      status: 'demoLoaded',
      business: { id: 'b2', name: 'Demo Plumbing Co.' },
      summary: { customers: 6, technicians: 3, jobs: 6 },
    };
    await render(<OnboardingScreen />);

    expect(screen.getByText('Demo Plumbing Co.')).toBeTruthy();
    expect(screen.getByText('Loaded 6 customers, 3 technicians and 6 jobs.')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(mockContinue).toHaveBeenCalledTimes(1);
  });
});
