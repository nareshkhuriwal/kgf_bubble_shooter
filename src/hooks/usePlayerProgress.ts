import { useState, useCallback } from 'react';
import { PlayerProgress } from '../types';
import { TOTAL_LEVELS } from '../constants/gameConfig';

function makeInitialProgress(): PlayerProgress {
  return {
    levelStars: Array(TOTAL_LEVELS).fill(0),
    totalStars: 0,
    highScore: 0,
    unlockedUpTo: 1,
  };
}

export function usePlayerProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(makeInitialProgress);

  // Call when a level finishes — saves best stars & updates unlock
  const saveLevel = useCallback((level: number, stars: number, score: number) => {
    setProgress(prev => {
      const newStars = [...prev.levelStars];
      const idx = level - 1;
      // Only upgrade, never downgrade
      newStars[idx] = Math.max(newStars[idx], stars);
      const totalStars = newStars.reduce((a, b) => a + b, 0);
      const highScore = Math.max(prev.highScore, score);
      // Unlock the next level when current is completed with ≥1 star
      const unlockedUpTo = stars >= 1
        ? Math.min(TOTAL_LEVELS, Math.max(prev.unlockedUpTo, level + 1))
        : prev.unlockedUpTo;
      return { levelStars: newStars, totalStars, highScore, unlockedUpTo };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(makeInitialProgress());
  }, []);

  return { progress, saveLevel, resetProgress };
}
