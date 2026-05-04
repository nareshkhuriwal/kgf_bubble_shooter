import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export function useHaptics() {
  const pop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, []);

  const shoot = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const combo = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const levelComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const gameOver = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, []);

  return { pop, shoot, combo, levelComplete, gameOver };
}
