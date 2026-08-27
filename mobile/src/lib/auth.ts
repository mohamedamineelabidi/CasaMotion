import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Role } from './types';

const TOKEN_KEY = 'casamotion.jwt';
const ROLE_KEY = 'casamotion.role';
const USER_KEY = 'casamotion.user';

// expo-secure-store is unavailable on web; fall back to localStorage there.
const webStore = {
  async getItemAsync(key: string) {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  async setItemAsync(key: string, value: string) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  },
  async deleteItemAsync(key: string) {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  },
};

const store = Platform.OS === 'web' ? webStore : SecureStore;

export async function saveSession(token: string, role: Role, username: string) {
  await store.setItemAsync(TOKEN_KEY, token);
  await store.setItemAsync(ROLE_KEY, role);
  await store.setItemAsync(USER_KEY, username);
}

export async function getToken(): Promise<string | null> {
  return store.getItemAsync(TOKEN_KEY);
}

export async function getRole(): Promise<Role | null> {
  return (await store.getItemAsync(ROLE_KEY)) as Role | null;
}

export async function getUsername(): Promise<string | null> {
  return store.getItemAsync(USER_KEY);
}

export async function clearSession() {
  await store.deleteItemAsync(TOKEN_KEY);
  await store.deleteItemAsync(ROLE_KEY);
  await store.deleteItemAsync(USER_KEY);
}
