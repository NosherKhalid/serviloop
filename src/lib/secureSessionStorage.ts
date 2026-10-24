// Encrypted storage for the Supabase login session.
//
// Why this exists: the phone's secure storage (iOS Keychain / Android Keystore, via expo-secure-store)
// refuses values over 2 KB, and a login session is larger. So, following Supabase's documented
// "LargeSecureStore" pattern:
//   * the session text is encrypted with a random AES-256 key and kept in AsyncStorage;
//   * only that small key is kept in secure storage.
// Anyone who copies the app's files (e.g. from a device backup) gets ciphertext without the key.
//
// This is deliberately close to Supabase's published example. Do not change the crypto casually.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import * as SecureStore from 'expo-secure-store';
// Side-effect import: provides `crypto.getRandomValues` on React Native.
import 'react-native-get-random-values';

// The shape supabase-js expects from a custom storage.
export type SessionStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

// Key stays on this device only (not restored from backups to another phone: the user just signs in again).
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function toBytes(hex: string): Uint8Array {
  return aesjs.utils.hex.toBytes(hex);
}

async function encrypt(key: string, value: string): Promise<string> {
  // A fresh random key for every write, so no key is ever reused for different data.
  const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
  const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
  const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

  await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey), SECURE_OPTIONS);
  return aesjs.utils.hex.fromBytes(encryptedBytes);
}

async function decrypt(key: string, encryptedHex: string): Promise<string | null> {
  const keyHex = await SecureStore.getItemAsync(key, SECURE_OPTIONS);
  if (keyHex === null) {
    return null; // the key is gone (e.g. app reinstalled): the saved session is unreadable
  }
  const cipher = new aesjs.ModeOfOperation.ctr(toBytes(keyHex), new aesjs.Counter(1));
  return aesjs.utils.utf8.fromBytes(cipher.decrypt(toBytes(encryptedHex)));
}

async function removeBoth(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
  await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
}

export const secureSessionStorage: SessionStorage = {
  async getItem(key) {
    const encrypted = await AsyncStorage.getItem(key);
    if (encrypted === null) {
      return null;
    }
    try {
      const value = await decrypt(key, encrypted);
      if (value === null) {
        await removeBoth(key); // unreadable leftovers: clean up so the user simply signs in again
      }
      return value;
    } catch {
      // Corrupt data must never crash the app or loop forever: treat it as "not signed in".
      await removeBoth(key);
      return null;
    }
  },

  async setItem(key, value) {
    const encrypted = await encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  },

  async removeItem(key) {
    await removeBoth(key);
  },
};
