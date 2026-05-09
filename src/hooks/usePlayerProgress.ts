import { useState, useCallback, useEffect } from 'react';
import { PlayerProgress } from '../types';
import { COINS_PER_STAR, TOTAL_LEVELS } from '../constants/gameConfig';
import { readJson, writeJson } from '../systems/storage';
import { achievementsFor, claimDailyReward } from '../systems/rewards';

const SAVE_KEY = 'bubble-shooter-progress-v2';

function makeInitialProgress(): PlayerProgress {
  return {
    levelStars: Array(TOTAL_LEVELS).fill(0),
    totalStars: 0,
    highScore: 0,
    unlockedUpTo: 1,
    coins: 0,
    achievements: [],
    dailyStreak: 0,
    claimedDays: 0,
  };
}

export function usePlayerProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    const saved = readJson<PlayerProgress>(SAVE_KEY);
    if (!saved) return makeInitialProgress();
    const levelStars = Array(TOTAL_LEVELS).fill(0).map((_, i) => saved.levelStars?.[i] ?? 0);
    return { ...makeInitialProgress(), ...saved, levelStars };
  });

  useEffect(() => {
    writeJson(SAVE_KEY, progress);
  }, [progress]);

  // Call when a level finishes — saves best stars & updates unlock
  const saveLevel = useCallback((level: number, stars: number, score: number) => {
    setProgress(prev => {
      const newStars = [...prev.levelStars];
      const idx = level - 1;
      // Only upgrade, never downgrade
      newStars[idx] = Math.max(newStars[idx], stars);
      const totalStars = newStars.reduce((a, b) => a + b, 0);
      const highScore = Math.max(prev.highScore, score);
      const starDelta = newStars[idx] - (prev.levelStars[idx] ?? 0);
      // Unlock the next level when current is completed with ≥1 star
      const unlockedUpTo = stars >= 1
        ? Math.min(TOTAL_LEVELS, Math.max(prev.unlockedUpTo, level + 1))
        : prev.unlockedUpTo;
      const coins = prev.coins + Math.max(0, starDelta) * COINS_PER_STAR + Math.floor(score / 1500);
      const next = { ...prev, levelStars: newStars, totalStars, highScore, unlockedUpTo, coins };
      return { ...next, achievements: achievementsFor(next) };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(makeInitialProgress());
  }, []);

  const claimDaily = useCallback(() => {
    let result = { reward: 0, claimed: false };
    setProgress(prev => {
      const claim = claimDailyReward(prev);
      result = { reward: claim.reward, claimed: claim.claimed };
      return claim.progress;
    });
    return result;
  }, []);

  return { progress, saveLevel, resetProgress, claimDaily };
}
