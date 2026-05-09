import { Platform } from 'react-native';

export function readJson<T>(key: string): T | null {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function writeJson<T>(key: string, value: T) {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence should never block gameplay.
  }
}
