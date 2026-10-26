import { fireEvent, render, screen } from '@testing-library/react-native';

const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ dismissTo: mockDismissTo }) }));

import { backToListOptions } from '@/components/HeaderBackToList';

// Regression for a bug found on a real device (M4): a screen opened from another tab ("Add job" on the Dashboard,
// "Add customer" from the job form) sits alone in its section's stack, so the header had no back arrow at all.
// React Navigation's stack state tells us how many screens the section holds.
function navigationWith(screenCount: number) {
  return { navigation: { getState: () => ({ routes: Array.from({ length: screenCount }, () => ({})) }) } };
}

describe('backToListOptions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('leaves the normal back arrow alone when the list is underneath', () => {
    const options = backToListOptions('New job', 'Jobs', '/work-orders')(navigationWith(2));

    expect(options.headerLeft).toBeUndefined();
    expect(options.title).toBe('New job');
  });

  it('shows a labelled button that goes to the list when the screen is alone in its stack', async () => {
    const options = backToListOptions('New job', 'Jobs', '/work-orders')(navigationWith(1));

    const headerLeft = options.headerLeft;
    if (headerLeft === undefined) {
      throw new Error('expected a custom back button');
    }
    await render(headerLeft());
    await fireEvent.press(screen.getByRole('button', { name: 'Back to Jobs' }));

    expect(mockDismissTo).toHaveBeenCalledWith('/work-orders');
  });

  it('names the right section', async () => {
    const headerLeft = backToListOptions('Edit customer', 'Customers', '/customers')(navigationWith(1)).headerLeft;
    if (headerLeft === undefined) {
      throw new Error('expected a custom back button');
    }
    await render(headerLeft());

    expect(screen.getByRole('button', { name: 'Back to Customers' })).toBeTruthy();
    expect(screen.getByText('‹ Customers')).toBeTruthy();
  });
});
