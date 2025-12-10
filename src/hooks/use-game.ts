import { getRandomGameData, MAX_ERRORS } from "@/constants/utils";
import { PLAYERS } from "@/data/players";
import type { GameStatus, Player } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function useGame() {
  const [players, setPlayers] = useState<Player[]>(PLAYERS);

  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [roundData, setRoundData] = useState(() => getRandomGameData());

  const [isGuessModalOpen, setIsGuessModalOpen] = useState(false);
  const [guessInput, setGuessInput] = useState("");

  const currentWord = roundData.word;
  const currentHint = roundData.hint;

  const currentPlayer = players[currentTurnIndex];

  const startNewRound = () => {
    const newData = getRandomGameData();

    if (status === "lost") nextTurn();

    setRoundData(newData);
    setGuessedLetters([]);
    setMistakes(0);
    setStatus("playing");
    setGuessInput("");
  };

  const nextTurn = useCallback(() => {
    setCurrentTurnIndex((prev) => (prev + 1) % players.length);
  }, [players.length]);

  const handleWin = useCallback(() => {
    setStatus("won");
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === currentPlayer.id ? { ...p, score: p.score + 1 } : p
      )
    );
    toast(`Parabéns ${currentPlayer.name}! 🏆 Você ganhou mais um ponto`, {
      description: "Os adversários são muito ruins 😂",
      position: "top-center",
    });
  }, [currentPlayer]);

  const handleLetterClick = useCallback(
    (letter: string) => {
      if (status !== "playing" || guessedLetters.includes(letter)) return;

      const isCorrect = currentWord.includes(letter);
      setGuessedLetters((prev) => [...prev, letter]);

      if (!isCorrect) {
        const newMistakes = mistakes + 1;
        setMistakes(newMistakes);

        if (newMistakes === MAX_ERRORS) {
          setStatus("lost");
          toast(`Vocês TODOS são muito ruins! 😒`, {
            description: "O objetivo é não perder tá? 😤",
            position: "top-center",
          });
        } else {
          nextTurn();
        }
      } else {
        const allLettersGuessed = currentWord
          .split("")
          .every(
            (l) => guessedLetters.includes(l) || l === letter || l === " "
          );

        if (allLettersGuessed) {
          handleWin();
        } else {
          nextTurn();
        }
      }
    },
    [status, guessedLetters, currentWord, mistakes, nextTurn, handleWin]
  );

  const handleFullWordGuess = () => {
    if (guessInput.trim().length === 0) return;

    if (guessInput.toUpperCase() === currentWord) {
      handleWin();
      setGuessedLetters(currentWord.split(""));
    } else {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === currentPlayer.id
            ? { ...p, score: Math.max(p.score - 1, 0) }
            : p
        )
      );
      toast(`Presta atenção ${currentPlayer.name}! 💢`, {
        description: "Nada ver isso que você pensou 😤",
        position: "top-center",
      });
      nextTurn();
    }

    setGuessInput("");
    setIsGuessModalOpen(false);
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (isGuessModalOpen) return;

      if (status !== "playing") return;

      const key = e.key.toUpperCase();

      if (/^[A-Z]$/.test(key)) {
        handleLetterClick(key);
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [handleLetterClick, isGuessModalOpen, status]);

  return {
    players,
    currentPlayer,
    handleFullWordGuess,
    currentTurnIndex,
    currentHint,
    currentWord,
    mistakes,
    guessedLetters,
    guessInput,
    startNewRound,
    status,
    setGuessInput,
    setIsGuessModalOpen,
    handleLetterClick,
    isGuessModalOpen,
  };
}
