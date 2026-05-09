import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

export type GameSound = 'shoot' | 'pop' | 'combo' | 'explosion' | 'button' | 'victory' | 'gameOver';

const WEB_TONES: Record<GameSound, [number, number]> = {
  shoot: [520, 0.06],
  pop: [760, 0.08],
  combo: [960, 0.12],
  explosion: [140, 0.18],
  button: [440, 0.05],
  victory: [880, 0.22],
  gameOver: [180, 0.25],
};

function playWebTone(sound: GameSound, volume: number) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) return;
  const context = new AudioContextCtor();
  const [frequency, duration] = WEB_TONES[sound];
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = sound === 'explosion' || sound === 'gameOver' ? 'sawtooth' : 'sine';
  gain.gain.value = volume * 0.08;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

export function useGameAudio() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [volume, setVolume] = useState(0.8);

  const play = useCallback((sound: GameSound) => {
    if (!soundEnabled) return;
    try {
      playWebTone(sound, volume);
    } catch {
      // Audio should be best-effort and never interrupt play.
    }
  }, [soundEnabled, volume]);

  return {
    play,
    soundEnabled,
    musicEnabled,
    volume,
    toggleSound: () => setSoundEnabled(v => !v),
    toggleMusic: () => setMusicEnabled(v => !v),
    setVolume,
  };
}
