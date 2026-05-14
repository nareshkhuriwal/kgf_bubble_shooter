import { useState, useCallback, useEffect, useRef } from 'react';
import { PlayerProgress } from '../types';
import { COINS_PER_STAR, TOTAL_LEVELS } from '../constants/gameConfig';
import { readProgress, writeProgress } from '../systems/storage';
import { achievementsFor, claimDailyReward } from '../systems/rewards';

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
  const [progress, setProgress] = useState<PlayerProgress>(makeInitialProgress);
  const [loaded, setLoaded] = useState(false);

  // Ref always mirrors the latest progress — lets callbacks read current
  // state synchronously without being listed as effect deps.
  const progressRef = useRef<PlayerProgress>(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Load persisted progress once on mount
  useEffect(() => {
    let cancelled = false;
    readProgress().then(saved => {
      if (cancelled) return;
      if (saved) {
        const levelStars = Array(TOTAL_LEVELS).fill(0).map(
          (_, i) => saved.levelStars?.[i] ?? 0,
        );
        setProgress({ ...makeInitialProgress(), ...saved, levelStars });
      }
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Persist on every change (after initial load to avoid overwriting with empty state)
  useEffect(() => {
    if (!loaded) return;
    writeProgress(progress);
  }, [progress, loaded]);

  // Call when a level finishes — saves best stars & updates unlock
  const saveLevel = useCallback((level: number, stars: number, score: number) => {
    setProgress(prev => {
      const newStars = [...prev.levelStars];
      const idx = level - 1;
      newStars[idx] = Math.max(newStars[idx], stars);
      const totalStars = newStars.reduce((a, b) => a + b, 0);
      const highScore = Math.max(prev.highScore, score);
      const starDelta = newStars[idx] - (prev.levelStars[idx] ?? 0);
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

  // Compute the result synchronously from the ref — avoids the stale-closure
  // trap of reading `result` before the setState updater has run.
  const claimDaily = useCallback((): { reward: number; claimed: boolean } => {
    const claim = claimDailyReward(progressRef.current);
    if (claim.claimed) {
      setProgress(claim.progress);
    }
    return { reward: claim.reward, claimed: claim.claimed };
  }, []);

  return { progress, loaded, saveLevel, resetProgress, claimDaily };
}
