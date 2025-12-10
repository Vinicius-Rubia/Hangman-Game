import type { GameStatus } from "@/types";
import { AnimatePresence, motion } from "framer-motion";

interface GuessedWordProps {
  word: string;
  guessedLetters: string[];
  status: GameStatus;
}

export function GuessedWord({
  word,
  guessedLetters,
  status,
}: GuessedWordProps) {
  return (
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8">
      {word.split(" ").map((w, wIndex) => (
        <div key={wIndex} className="flex gap-2">
          {w.split("").map((letter, letterIndex) => (
            <div
              key={`${wIndex}-${letterIndex}`}
              className="w-10 h-12 sm:w-12 sm:h-14 border-b-4 border-slate-800 flex items-center justify-center text-3xl font-bold uppercase"
            >
              <AnimatePresence>
                {(guessedLetters.includes(letter) || status !== "playing") && (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={
                      !guessedLetters.includes(letter) && status === "lost"
                        ? "text-red-500"
                        : guessedLetters.includes(letter) && status === "won"
                        ? "text-green-500"
                        : "text-slate-900"
                    }
                  >
                    {letter}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
