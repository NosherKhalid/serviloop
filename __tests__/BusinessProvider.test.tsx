import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { AuthState } from '@/providers/AuthProvider';
import type { Business, DemoDataSummary } from '@/repositories/businessRepository';

let mockAuthState: AuthState = { status: 'signedOut' };
const mockGetMyBusiness = jest.fn<Promise<Business | null>, []>();
const mockCreate = jest.fn<Promise<Business>, [string]>();
const mockDemo = jest.fn<Promise<{ business: Business; summary: DemoDataSummary }>, []>();

jest.mock('@/providers/AuthProvider', () => ({ useAuth: () => ({ state: mockAuthState }) }));
jest.mock('@/repositories/businessRepository', () => ({
  getMyBusiness: () => mockGetMyBusiness(),
  createBusiness: (name: string) => mockCreate(name),
  loadDemoData: () => mockDemo(),
}));

import { BusinessProvider, useBusiness } from '@/providers/BusinessProvider';

const riverside: Business = { id: 'b1', name: 'Riverside Plumbing Co' };
const demo: Business = { id: 'b2', name: 'Demo Plumbing Co.' };
const signedIn = (id: string): AuthState => ({ status: 'signedIn', user: { id, email: `${id}@example.com` } });

let actions: ReturnType<typeof useBusiness>;
function Probe() {
  actions = useBusiness();
  const { state } = actions;
  const label = state.status === 'ready' || state.status === 'demoLoaded' ? `${state.status}:${state.business.name}` : state.status;
  return <Text testID="state">{label}</Text>;
}
const shown = () => screen.getByTestId('state').props.children;
const tree = () => (
  <BusinessProvider>
    <Probe />
  </BusinessProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState = { status: 'signedOut' };
});

describe('<BusinessProvider />', () => {
  it('is idle (and asks for nothing) while nobody is signed in', async () => {
    await render(tree());
    expect(shown()).toBe('idle');
    expect(mockGetMyBusiness).not.toHaveBeenCalled();
  });

  it('shows onboarding state when the signed-in owner has no business', async () => {
    mockAuthState = signedIn('u1');
    mockGetMyBusiness.mockResolvedValue(null);
    await render(tree());
    expect(await screen.findByText('none')).toBeTruthy();
  });

  it('is loading first, then ready with the owner\'s business', async () => {
    mockAuthState = signedIn('u1');
    let resolve: (b: Business | null) => void = () => undefined;
    mockGetMyBusiness.mockReturnValue(new Promise((r) => (resolve = r)));
    await render(tree());
    expect(shown()).toBe('loading');

    await act(async () => resolve(riverside));
    expect(shown()).toBe('ready:Riverside Plumbing Co');
  });

  it('shows an error state when the lookup fails, and recovers on retry', async () => {
    mockAuthState = signedIn('u1');
    mockGetMyBusiness.mockRejectedValueOnce(new Error('offline'));
    await render(tree());
    expect(await screen.findByText('error')).toBeTruthy();

    mockGetMyBusiness.mockResolvedValue(riverside);
    await act(async () => actions.reload());
    expect(await screen.findByText('ready:Riverside Plumbing Co')).toBeTruthy();
  });

  it('never shows one account\'s business to the next account on the same phone', async () => {
    mockAuthState = signedIn('u1');
    mockGetMyBusiness.mockResolvedValue(riverside);
    const view = await render(tree());
    await screen.findByText('ready:Riverside Plumbing Co');

    // u1 signs out, u2 signs in. u2's lookup is still pending: u1's business must not appear.
    let resolveSecond: (b: Business | null) => void = () => undefined;
    mockGetMyBusiness.mockReturnValue(new Promise((r) => (resolveSecond = r)));
    mockAuthState = signedIn('u2');
    await view.rerender(tree());
    expect(shown()).toBe('loading');

    await act(async () => resolveSecond(null));
    expect(shown()).toBe('none');
  });

  it('goes back to idle when the owner signs out', async () => {
    mockAuthState = signedIn('u1');
    mockGetMyBusiness.mockResolvedValue(riverside);
    const view = await render(tree());
    await screen.findByText('ready:Riverside Plumbing Co');

    mockAuthState = { status: 'signedOut' };
    await view.rerender(tree());
    expect(shown()).toBe('idle');
  });

  it('creates a business and becomes ready', async () => {
    mockAuthState = signedIn('u1');
    mockGetMyBusiness.mockResolvedValue(null);
    mockCreate.mockResolvedValue(riverside);
    await render(tree());
    await screen.findByText('none');

    await act(async () => actions.createBusiness('Riverside Plumbing Co'));

    expect(mockCreate).toHaveBeenCalledWith('Riverside Plumbing Co');
    expect(shown()).toBe('ready:Riverside Plumbing Co');
  });

  it('passes a failed creation on to the screen without changing state', async () => {
    mockAuthState = signedIn('u1');
    mockGetMyBusiness.mockResolvedValue(null);
    mockCreate.mockRejectedValue({ code: '42501' });
    await render(tree());
    await screen.findByText('none');

    await act(async () => {
      await expect(actions.createBusiness('Riverside')).rejects.toEqual({ code: '42501' });
    });
    expect(shown()).toBe('none');
  });

  it('picks up an existing business when creation hits the one-business-per-owner rule', async () => {
    mockAuthState = signedIn('u1');
    mockGetMyBusiness.mockResolvedValueOnce(null);
    mockCreate.mockRejectedValue({ code: '23505' });
    await render(tree());
    await screen.findByText('none');

    mockGetMyBusiness.mockResolvedValue(riverside); // it exists after all (e.g. created on another device)
    await act(async () => {
      await expect(actions.createBusiness('Riverside')).rejects.toBeTruthy();
    });

    expect(await screen.findByText('ready:Riverside Plumbing Co')).toBeTruthy();
  });

  it('shows what demo data loaded, then continues into the app', async () => {
    mockAuthState = signedIn('u1');
    mockGetMyBusiness.mockResolvedValue(null);
    mockDemo.mockResolvedValue({ business: demo, summary: { customers: 6, technicians: 3, jobs: 6 } });
    await render(tree());
    await screen.findByText('none');

    await act(async () => actions.loadDemoData());
    expect(shown()).toBe('demoLoaded:Demo Plumbing Co.');

    await act(async () => actions.continueAfterDemo());
    expect(shown()).toBe('ready:Demo Plumbing Co.');
  });
});
