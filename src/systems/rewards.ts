import { PlayerProgress } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function dayStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function claimDailyReward(progress: PlayerProgress): { progress: PlayerProgress; reward: number; claimed: boolean } {
  const today = dayStamp();
  if (progress.lastDailyRewardAt === today) {
    return { progress, reward: 0, claimed: false };
  }

  const last = progress.lastDailyRewardAt ? new Date(progress.lastDailyRewardAt).getTime() : 0;
  const yesterdayish = Date.now() - last < MS_PER_DAY * 2;
  const dailyStreak = yesterdayish ? progress.dailyStreak + 1 : 1;
  const reward = 50 + Math.min(6, dailyStreak - 1) * 15;

  return {
    claimed: true,
    reward,
    progress: {
      ...progress,
      coins: progress.coins + reward,
      dailyStreak,
      claimedDays: progress.claimedDays + 1,
      lastDailyRewardAt: today,
    },
  };
}

export function achievementsFor(progress: PlayerProgress): string[] {
  const achievements = new Set(progress.achievements);
  if (progress.totalStars >= 3) achievements.add('first_stars');
  if (progress.totalStars >= 30) achievements.add('star_collector');
  if (progress.unlockedUpTo >= 16) achievements.add('world_two');
  if (progress.unlockedUpTo >= 32) achievements.add('expert_ready');
  if (progress.coins >= 1000) achievements.add('coin_bank');
  return Array.from(achievements);
}
