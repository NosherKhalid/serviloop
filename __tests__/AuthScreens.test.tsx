import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';

const mockSignIn = jest.fn<Promise<void>, [string, string]>();
const mockSignUp = jest.fn<Promise<{ needsEmailConfirmation: boolean }>, [string, string]>();

jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ state: { status: 'signedOut' }, signIn: mockSignIn, signUp: mockSignUp, signOut: jest.fn() }),
}));
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: string }) => <MockText>{children}</MockText>,
}));

import { SignInScreen } from '@/features/auth/components/SignInScreen';
import { SignUpScreen } from '@/features/auth/components/SignUpScreen';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('<SignInScreen />', () => {
  it('shows field errors and does not call the service for empty input', async () => {
    await render(<SignInScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    expect(screen.getByText('Enter your password')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('signs in with the cleaned-up email', async () => {
    mockSignIn.mockResolvedValue(undefined);
    await render(<SignInScreen />);

    await fireEvent.changeText(screen.getByLabelText('Email'), '  Jane@Example.com ');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'secret-pass');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('jane@example.com', 'secret-pass'));
  });

  it('shows a friendly message for a wrong password, not the raw error', async () => {
    mockSignIn.mockRejectedValue({ code: 'invalid_credentials', message: 'Invalid login credentials' });
    await render(<SignInScreen />);

    await fireEvent.changeText(screen.getByLabelText('Email'), 'jane@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong-pass');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email or password is incorrect.')).toBeTruthy();
    expect(screen.queryByText(/Invalid login credentials/)).toBeNull();
  });

  it('clears the error as soon as the user edits a field', async () => {
    mockSignIn.mockRejectedValue({ code: 'invalid_credentials' });
    await render(<SignInScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'jane@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong-pass');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText('Email or password is incorrect.');

    await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong-pass2');

    expect(screen.queryByText('Email or password is incorrect.')).toBeNull();
  });

  it('ignores a second tap while the first request is still running', async () => {
    let finish: () => void = () => undefined;
    mockSignIn.mockReturnValue(new Promise<void>((r) => (finish = r)));
    await render(<SignInScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'jane@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'secret-pass');

    // Start the first request but do not wait for it: it stays "in flight" until we call finish().
    const firstTap = fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1));

    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' })); // second tap while busy

    expect(mockSignIn).toHaveBeenCalledTimes(1);
    finish();
    await firstTap;
  });
});

describe('<SignUpScreen />', () => {
  it('rejects a short password before calling the service', async () => {
    await render(<SignUpScreen />);

    await fireEvent.changeText(screen.getByLabelText('Email'), 'jane@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password (at least 8 characters)'), '1234567');
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Use at least 8 characters')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('creates the account with valid input', async () => {
    mockSignUp.mockResolvedValue({ needsEmailConfirmation: false });
    await render(<SignUpScreen />);

    await fireEvent.changeText(screen.getByLabelText('Email'), 'New.Owner@Example.com');
    await fireEvent.changeText(screen.getByLabelText('Password (at least 8 characters)'), 'long-enough-pass');
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith('new.owner@example.com', 'long-enough-pass'));
  });

  it('tells the person to check their email when confirmation is required', async () => {
    mockSignUp.mockResolvedValue({ needsEmailConfirmation: true });
    await render(<SignUpScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'jane@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password (at least 8 characters)'), 'long-enough-pass');

    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Check your email to confirm your account, then sign in.')).toBeTruthy();
  });

  it('explains when the email is already registered', async () => {
    mockSignUp.mockRejectedValue({ code: 'user_already_exists' });
    await render(<SignUpScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'jane@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password (at least 8 characters)'), 'long-enough-pass');

    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText(/already exists/)).toBeTruthy();
  });
});
