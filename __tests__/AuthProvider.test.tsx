import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { AuthUser } from '@/repositories/authRepository';

// The real repository talks to Supabase; replace it with controllable stand-ins.
const mockGetCurrentUser = jest.fn<Promise<AuthUser | null>, []>();
const mockSignOut = jest.fn<Promise<void>, []>();
let mockEmitAuthChange: (user: AuthUser | null) => void = () => undefined;
const mockUnsubscribe = jest.fn();

jest.mock('@/repositories/authRepository', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
  signInWithPassword: jest.fn(),
  signUpWithPassword: jest.fn(),
  signOutOfThisDevice: () => mockSignOut(),
  subscribeToAuthChanges: (callback: (user: AuthUser | null) => void) => {
    mockEmitAuthChange = callback;
    return mockUnsubscribe;
  },
}));

import { AuthProvider, useAuth } from '@/providers/AuthProvider';

function Probe() {
  const { state, signOut } = useAuth();
  return (
    <>
      <Text testID="status">{state.status}</Text>
      {state.status === 'signedIn' ? <Text testID="email">{state.user.email}</Text> : null}
      <Text testID="signOut" onPress={() => void signOut()}>
        sign out
      </Text>
    </>
  );
}

const jane: AuthUser = { id: 'u1', email: 'jane@example.com' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('<AuthProvider />', () => {
  it('starts in "loading" until the saved session has been looked up', async () => {
    let resolve: (user: AuthUser | null) => void = () => undefined;
    mockGetCurrentUser.mockReturnValue(new Promise((r) => (resolve = r)));

    await render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByTestId('status').props.children).toBe('loading');

    await act(async () => resolve(null));
    expect(screen.getByTestId('status').props.children).toBe('signedOut');
  });

  it('restores a saved session as signed in', async () => {
    mockGetCurrentUser.mockResolvedValue(jane);

    await render(<AuthProvider><Probe /></AuthProvider>);

    expect(await screen.findByText('jane@example.com')).toBeTruthy();
    expect(screen.getByTestId('status').props.children).toBe('signedIn');
  });

  it('treats an unreadable saved session as signed out instead of crashing', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('storage unavailable'));

    await render(<AuthProvider><Probe /></AuthProvider>);

    expect(await screen.findByText('signedOut')).toBeTruthy();
  });

  it('follows sign-in and sign-out events from the auth service', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    await render(<AuthProvider><Probe /></AuthProvider>);
    expect(await screen.findByText('signedOut')).toBeTruthy();

    await act(async () => mockEmitAuthChange(jane));
    expect(screen.getByTestId('status').props.children).toBe('signedIn');

    await act(async () => mockEmitAuthChange(null));
    expect(screen.getByTestId('status').props.children).toBe('signedOut');
  });

  it('only exposes who is signed in, never the session tokens', async () => {
    mockGetCurrentUser.mockResolvedValue(jane);
    await render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText('jane@example.com');
    // The state shape only has `user: { id, email }`; there is nowhere for a token to live.
    expect(Object.keys(jane).sort()).toEqual(['email', 'id']);
  });

  it('stops listening when the provider goes away', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const view = await render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText('signedOut');

    await view.unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('asks the auth service to sign out', async () => {
    mockGetCurrentUser.mockResolvedValue(jane);
    mockSignOut.mockResolvedValue(undefined);
    await render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText('jane@example.com');

    await act(async () => screen.getByTestId('signOut').props.onPress());

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
