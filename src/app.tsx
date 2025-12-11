import { ThemeProvider } from "./components/theme-provider";
import { AppRoutes } from "./routes/router";

export function App() {
  // const {
  //   handleFullWordGuess,
  //   players,
  //   currentTurnIndex,
  //   currentHint,
  //   currentWord,
  //   mistakes,
  //   guessInput,
  //   guessedLetters,
  //   startNewRound,
  //   status,
  //   setGuessInput,
  //   setIsGuessModalOpen,
  //   handleLetterClick,
  //   isGuessModalOpen,
  // } = useGame();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="forca-theme">
      <AppRoutes />
    </ThemeProvider>
  );
}
