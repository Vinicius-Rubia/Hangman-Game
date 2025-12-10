import { ALPHABET } from "@/constants/utils";
import type { GameStatus } from "@/types";
import { motion } from "framer-motion";

interface VirtualKeyboardProps {
  word: string;
  guessedLetters: string[];
  onLetterClick: (letter: string) => void;
  status: GameStatus;
}
export function VirtualKeyboard({
  word,
  guessedLetters,
  status,
  onLetterClick,
}: VirtualKeyboardProps) {
  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-wrap justify-center gap-2">
        {ALPHABET.split("").map((letter) => {
          const isUsed = guessedLetters.includes(letter);
          const isCorrect = word.includes(letter);

          let btnStyle =
            "bg-white hover:bg-slate-100 text-slate-700 border-slate-200";

          if (isUsed && isCorrect)
            btnStyle = "bg-green-100 text-green-700 border-green-300";
          if (isUsed && !isCorrect)
            btnStyle = "bg-red-100 text-red-400 border-red-300";

          return (
            <motion.button
              key={letter}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              disabled={isUsed || status !== "playing"}
              onClick={() => onLetterClick(letter)}
              className={`w-10 h-12 sm:w-12 sm:h-14 rounded-md border-2 font-bold text-lg shadow-sm transition-colors ${btnStyle}`}
            >
              {letter}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
