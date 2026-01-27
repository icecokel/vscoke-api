export interface GameHistory {
  id: string;
  score: number;
  playTime?: number;
  createdAt: Date;
  userId: string;
}
