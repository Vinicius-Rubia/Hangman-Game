import type { Player } from "@/types";
import { Trophy, User } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface PlayersScoreProps {
  players: Player[];
  turnIndex: number;
}

export function PlayersScore({ players, turnIndex }: PlayersScoreProps) {
  return (
    <div className="absolute bottom-10 right-10 grid gap-4 w-xs">
      {players.map((p, index) => (
        <Card
          key={p.id}
          className={`transition-all duration-300 border-2 ${
            turnIndex === index
              ? "border-yellow-400 shadow-lg scale-105"
              : "border-transparent"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User
                className={
                  turnIndex === index ? "text-blue-600" : "text-slate-400"
                }
              />
              <span className="font-bold text-lg">{p.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-500 w-4 h-4" />
              <span className="text-xl font-bold">{p.score}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
