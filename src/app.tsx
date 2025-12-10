import { DrawingOfTheGallows } from "./components/drawing-of-the-gallows";
import { GuessedWord } from "./components/guessed-word";
import { KickWordModal } from "./components/kick-word-modal";
import { PlayersScore } from "./components/players-score";
import { StatusBar } from "./components/status-bar";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Toaster } from "./components/ui/sonner";
import { VirtualKeyboard } from "./components/virtual-keyboard";
import { useGame } from "./hooks/use-game";

export function App() {
  const {
    handleFullWordGuess,
    players,
    currentTurnIndex,
    currentHint,
    currentWord,
    mistakes,
    guessInput,
    guessedLetters,
    startNewRound,
    status,
    setGuessInput,
    setIsGuessModalOpen,
    handleLetterClick,
    isGuessModalOpen,
  } = useGame();

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center font-sans text-slate-900">
      <PlayersScore players={players} turnIndex={currentTurnIndex} />
      <Card className="w-full max-w-4xl mb-6">
        <CardHeader className="text-center pb-2">
          <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold">
            Dica
          </p>
          <CardTitle className="text-2xl text-blue-600">
            {currentHint}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center">
          <DrawingOfTheGallows mistakes={mistakes} />
          <GuessedWord
            word={currentWord}
            guessedLetters={guessedLetters}
            status={status}
          />

          <StatusBar
            word={currentWord}
            totalGuessedLetters={guessedLetters.length}
            totalMistakes={mistakes}
            status={status}
            onKickWord={() => setIsGuessModalOpen(true)}
            onStartNewRound={startNewRound}
          />
        </CardContent>
      </Card>

      <VirtualKeyboard
        word={currentWord}
        guessedLetters={guessedLetters}
        status={status}
        onLetterClick={handleLetterClick}
      />

      <KickWordModal
        open={isGuessModalOpen}
        setOpen={setIsGuessModalOpen}
        inputValue={guessInput}
        setInputValue={setGuessInput}
        onFullWordGuess={handleFullWordGuess}
      />

      <Toaster richColors />
    </div>
  );
}
