export type GameStatus = "playing" | "won" | "lost";

export type Player = {
  id: string;
  name: string;
  score: number;
};
