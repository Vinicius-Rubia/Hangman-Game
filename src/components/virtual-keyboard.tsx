import { ALPHABET } from "@/constants/utils";
import { motion } from "framer-motion";

interface VirtualKeyboardProps {
  gameState: any;
  onLetterClick: (letter: string) => void;
}
export function VirtualKeyboard({
  onLetterClick,
  gameState,
}: VirtualKeyboardProps) {
  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-wrap justify-center gap-2">
        {ALPHABET.split("").map((letter) => {
          const status = gameState.gameData.usedLetters.includes(letter)
            ? gameState.gameData.word.includes(letter)
              ? "bg-green-900 text-white border-green-600 opacity-80"
              : "bg-red-950 text-white border-destructive/50 opacity-80"
            : "bg-muted text-primary border-transparent";
          return (
            <motion.button
              key={letter}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              disabled={gameState.gameData.usedLetters.includes(letter)}
              onClick={() => onLetterClick(letter)}
              className={`size-12 text-lg uppercase font-bold flex items-center justify-center rounded border ${status}`}
            >
              {letter}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
