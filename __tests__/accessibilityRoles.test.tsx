import { render, screen } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';

import type { BusinessState } from '@/providers/BusinessProvider';

let mockBusiness: BusinessState = { status: 'none' };
jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ state: { status: 'signedOut' }, signIn: jest.fn(), signUp: jest.fn(), signOut: jest.fn() }),
}));
jest.mock('@/providers/BusinessProvider', () => ({
  useBusiness: () => ({
    state: mockBusiness,
    createBusiness: jest.fn(),
    loadDemoData: jest.fn(),
    continueAfterDemo: jest.fn(),
    reload: jest.fn(),
  }),
}));
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: string }) => <MockText>{children}</MockText>,
}));

import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { SignInScreen } from '@/features/auth/components/SignInScreen';
import { SignUpScreen } from '@/features/auth/components/SignUpScreen';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';

// Screen-reader structure: headings let VoiceOver and TalkBack users jump between sections, and an "alert" is
// announced when it appears (a validation message must not be silent). Found missing in the M6 accessibility audit.
describe('screen-reader roles', () => {
  beforeEach(() => {
    mockBusiness = { status: 'none' };
  });

  it('a field validation error is announced as an alert', async () => {
    await render(<Input label="Email" value="" onChangeText={() => undefined} error="Enter a valid email address" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address');
  });

  it('a field without an error has no alert', async () => {
    await render(<Input label="Email" value="" onChangeText={() => undefined} />);

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('the title of an empty or error screen is a heading', async () => {
    await render(<EmptyState title="No jobs yet" message="Jobs you create will appear here." />);

    expect(screen.getByRole('header', { name: 'No jobs yet' })).toBeTruthy();
  });

  it('the sign-in title is a heading', async () => {
    await render(<SignInScreen />);

    expect(screen.getByRole('header', { name: 'Welcome back' })).toBeTruthy();
  });

  it('the sign-up title is a heading', async () => {
    await render(<SignUpScreen />);

    expect(screen.getByRole('header', { name: 'Create your account' })).toBeTruthy();
  });

  it('the onboarding title and the demo-data section are headings', async () => {
    await render(<OnboardingScreen />);

    expect(screen.getByRole('header', { name: 'Set up your business' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Explore with demo data' })).toBeTruthy();
  });
});
