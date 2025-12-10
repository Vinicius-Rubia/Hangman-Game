import { MAX_ERRORS } from "@/constants/utils";
import type { GameStatus } from "@/types";
import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface StatusBarProps {
  totalMistakes: number;
  status: GameStatus;
  totalGuessedLetters: number;
  word: string;
  onKickWord: () => void;
  onStartNewRound: () => void;
}

export function StatusBar({
  totalMistakes,
  onKickWord,
  totalGuessedLetters,
  word,
  status,
  onStartNewRound,
}: StatusBarProps) {
  return (
    <div className="relative flex w-full justify-between items-center px-4 mb-4">
      <div className="grid">
        <span className="text-slate-500 font-medium">
          Erros: <span className="text-red-500">{totalMistakes}</span> /{" "}
          {MAX_ERRORS}
        </span>
        <span className="text-slate-500 font-medium">
          Acertos: <span className="text-green-500">{totalGuessedLetters}</span>{" "}
          / {word.replace(/\s+/g, "").length}
        </span>
      </div>
      {status !== "playing" && (
        <Button
          className="absolute left-0 right-0 mx-auto w-fit"
          onClick={onStartNewRound}
        >
          Próxima Rodada
        </Button>
      )}
      <Button
        variant="outline"
        onClick={onKickWord}
        disabled={status !== "playing"}
        className="border-blue-200 hover:bg-blue-50 text-blue-700"
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        Chutar Palavra
      </Button>
    </div>
  );
}
