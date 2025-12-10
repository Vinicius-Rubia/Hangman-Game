import type { GameStatus, Player } from "@/types";
import { Trophy } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface FinishRoundModalProps {
  status: GameStatus;
  player: Player;
  correctWord: string;
  onStartNewRound: () => void;
}

export function FinishRoundModal({
  status,
  player,
  correctWord,
  onStartNewRound,
}: FinishRoundModalProps) {
  return (
    <Dialog open={status !== "playing"}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-3xl flex flex-col items-center gap-2">
            {status === "won" ? (
              <>
                <Trophy className="w-12 h-12 text-yellow-500" />
                <span className="text-green-600">Parabéns!</span>
              </>
            ) : (
              <>
                <div className="text-5xl">💀</div>
                <span className="text-red-600">Game Over</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-lg text-slate-600 mb-2">
            {status === "won"
              ? `${player.name} acertou a palavra e ganhou 1 ponto!`
              : "Ninguém acertou desta vez."}
          </p>
          <p className="text-xl font-bold bg-slate-100 p-2 rounded">
            A palavra era: {correctWord}
          </p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button
            onClick={onStartNewRound}
            size="lg"
            className="w-full sm:w-auto"
          >
            Próxima Rodada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
