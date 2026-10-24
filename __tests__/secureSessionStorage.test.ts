// In-memory stand-ins for the two stores; the real ones are native modules.
// (Variables used inside jest.mock factories must start with "mock".)
const mockAsyncStore = new Map<string, string>();
const mockSecureStore = new Map<string, string>();
const mockSecureOptionsSeen: unknown[] = [];
let mockSecureReadShouldFail = false;

jest.mock('react-native-get-random-values', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockAsyncStore.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => void mockAsyncStore.set(key, value)),
    removeItem: jest.fn(async (key: string) => void mockAsyncStore.delete(key)),
  },
}));
jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  setItemAsync: jest.fn(async (key: string, value: string, options: unknown) => {
    mockSecureOptionsSeen.push(options);
    mockSecureStore.set(key, value);
  }),
  getItemAsync: jest.fn(async (key: string) => {
    if (mockSecureReadShouldFail) throw new Error('keychain unavailable');
    return mockSecureStore.get(key) ?? null;
  }),
  deleteItemAsync: jest.fn(async (key: string) => void mockSecureStore.delete(key)),
}));

import { secureSessionStorage } from '@/lib/secureSessionStorage';

beforeAll(() => {
  // The app gets crypto.getRandomValues from react-native-get-random-values. If the test environment
  // has none, use a simple stand-in (fine here: these tests check behaviour, not randomness quality).
  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    const fakeCrypto = {
      getRandomValues<T extends ArrayBufferView>(array: T): T {
        const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
        for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
        return array;
      },
    };
    Object.defineProperty(globalThis, 'crypto', { value: fakeCrypto, configurable: true });
  }
});

beforeEach(() => {
  mockAsyncStore.clear();
  mockSecureStore.clear();
  mockSecureOptionsSeen.length = 0;
  mockSecureReadShouldFail = false;
});

const KEY = 'sb-test-auth-token';
const session = JSON.stringify({ access_token: 'a'.repeat(900), refresh_token: 'r'.repeat(40), user: { id: 'u1' } });

describe('secureSessionStorage', () => {
  it('stores and returns a session (round trip)', async () => {
    await secureSessionStorage.setItem(KEY, session);
    expect(await secureSessionStorage.getItem(KEY)).toBe(session);
  });

  it('handles values far larger than secure storage\'s 2 KB limit', async () => {
    const big = JSON.stringify({ blob: 'x'.repeat(10_000) });
    await secureSessionStorage.setItem(KEY, big);
    expect(await secureSessionStorage.getItem(KEY)).toBe(big);
    expect(mockSecureStore.get(KEY)?.length).toBe(64); // only the 32-byte key lives in secure storage
  });

  it('never writes the session in readable form', async () => {
    await secureSessionStorage.setItem(KEY, session);
    const atRest = mockAsyncStore.get(KEY) ?? '';
    expect(atRest).not.toContain('access_token');
    expect(atRest).not.toContain('aaaaaaaa');
  });

  it('uses a fresh encryption key for every write', async () => {
    await secureSessionStorage.setItem(KEY, session);
    const firstKey = mockSecureStore.get(KEY);
    await secureSessionStorage.setItem(KEY, session);
    expect(mockSecureStore.get(KEY)).not.toBe(firstKey);
    expect(await secureSessionStorage.getItem(KEY)).toBe(session);
  });

  it('keeps the key on this device only', async () => {
    await secureSessionStorage.setItem(KEY, session);
    expect(mockSecureOptionsSeen[0]).toEqual({ keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' });
  });

  it('returns null when nothing is saved', async () => {
    expect(await secureSessionStorage.getItem(KEY)).toBeNull();
  });

  it('signs the user out cleanly when the key has been lost', async () => {
    await secureSessionStorage.setItem(KEY, session);
    mockSecureStore.delete(KEY); // e.g. app reinstalled: ciphertext survives, key does not
    expect(await secureSessionStorage.getItem(KEY)).toBeNull();
    expect(mockAsyncStore.has(KEY)).toBe(false); // unreadable leftovers are cleaned up
  });

  it('does not crash when secure storage fails to read', async () => {
    await secureSessionStorage.setItem(KEY, session);
    mockSecureReadShouldFail = true;
    expect(await secureSessionStorage.getItem(KEY)).toBeNull();
    expect(mockAsyncStore.has(KEY)).toBe(false);
  });

  it('removes both the ciphertext and the key', async () => {
    await secureSessionStorage.setItem(KEY, session);
    await secureSessionStorage.removeItem(KEY);
    expect(mockAsyncStore.has(KEY)).toBe(false);
    expect(mockSecureStore.has(KEY)).toBe(false);
    expect(await secureSessionStorage.getItem(KEY)).toBeNull();
  });
});
