import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerProgress } from '../types';

const SAVE_KEY = 'bubble-kingdom-progress-v1';

// ── Web: synchronous localStorage ────────────────────────────────────────────
function webRead<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function webWrite<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* never block gameplay */ }
}

// ── Unified async API used by hooks ──────────────────────────────────────────
export async function readProgress(): Promise<PlayerProgress | null> {
  try {
    if (Platform.OS === 'web') {
      return webRead<PlayerProgress>(SAVE_KEY);
    }
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as PlayerProgress) : null;
  } catch {
    return null;
  }
}

export async function writeProgress(value: PlayerProgress): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      webWrite(SAVE_KEY, value);
      return;
    }
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(value));
  } catch { /* never block gameplay */ }
}
