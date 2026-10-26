import { render, screen } from '@testing-library/react-native';

let mockTabOptions: Record<string, unknown> = {};
jest.mock('expo-router', () => ({
  Tabs: Object.assign(
    ({ screenOptions }: { screenOptions: Record<string, unknown> }) => {
      mockTabOptions = screenOptions;
      return null;
    },
    { Screen: () => null },
  ),
}));

import AppLayout from '@/app/(app)/_layout';
import { CountCard } from '@/features/dashboard/components/CountCard';

// Found in the M6 appearance audit with the phone's text size at 150%: "Completed" broke in the middle of the word
// ("Complete / d") and the bottom tab names were cut off ("Dashb…").
describe('large text sizes', () => {
  it('a dashboard count label shrinks to fit instead of breaking in the middle of a word', async () => {
    await render(<CountCard label="Completed" count={2} onPress={() => undefined} />);

    const label = screen.getByText('Completed');

    expect(label.props.adjustsFontSizeToFit).toBe(true);
    expect(label.props.numberOfLines).toBe(2);
  });

  it('the bottom tab names keep their size so all four stay readable (like an iOS tab bar)', async () => {
    await render(<AppLayout />);

    expect(mockTabOptions.tabBarAllowFontScaling).toBe(false);
  });
});
