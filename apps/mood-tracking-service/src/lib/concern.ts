export function shouldPublishMoodConcern(recentScores: number[]): boolean {
  if (recentScores.length < 5) {
    return false;
  }
  const lowCount = recentScores.filter((score) => score <= 3).length;
  return lowCount >= 3;
}

export function averageScore(scores: number[]): number {
  if (scores.length === 0) {
    return 0;
  }
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}
