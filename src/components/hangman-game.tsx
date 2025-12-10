import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { wordDatabase } from "@/data";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Trophy, User } from "lucide-react";
import { useCallback, useState } from "react";

// --- Tipos ---
type Player = {
  id: number;
  name: string;
  score: number;
};

type GameStatus = "playing" | "won" | "lost";

// --- Configuração Inicial ---
const MAX_ERRORS = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function getRandomGameData() {
  const randomCatIndex = Math.floor(Math.random() * wordDatabase.length);
  const category = wordDatabase[randomCatIndex];
  const randomWordIndex = Math.floor(Math.random() * category.palavras.length);

  return {
    word: category.palavras[randomWordIndex].toUpperCase(),
    hint: category.dica,
  };
}

const HangmanGame = () => {
  // --- Estados do Jogo ---
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: "Jogador 1", score: 0 },
    { id: 2, name: "Jogador 2", score: 0 },
  ]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [roundData, setRoundData] = useState(() => getRandomGameData());

  const currentWord = roundData.word;
  const currentHint = roundData.hint;

  // Estado para o Modal de Chutar Palavra
  const [isGuessModalOpen, setIsGuessModalOpen] = useState(false);
  const [guessInput, setGuessInput] = useState("");

  // --- Lógica de Inicialização ---
  const startNewRound = useCallback(() => {
    // Agora apenas chamamos a função auxiliar
    const newData = getRandomGameData();

    setRoundData(newData); // Atualiza palavra e dica de uma vez
    setGuessedLetters([]);
    setMistakes(0);
    setStatus("playing");
    setGuessInput("");
  }, []);

  // --- Lógica Principal ---

  const currentPlayer = players[currentTurnIndex];

  const handleLetterClick = (letter: string) => {
    if (status !== "playing" || guessedLetters.includes(letter)) return;

    const isCorrect = currentWord.includes(letter);
    setGuessedLetters((prev) => [...prev, letter]);

    if (!isCorrect) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);

      // Passa a vez se errar
      if (newMistakes < MAX_ERRORS) {
        nextTurn();
      } else {
        setStatus("lost");
      }
    } else {
      // Se acertou, verifica se completou a palavra
      const allLettersGuessed = currentWord
        .split("")
        .every((l) => guessedLetters.includes(l) || l === letter);
      if (allLettersGuessed) {
        handleWin();
      }
      // Se acertou, mantém a vez (regra comum) ou passa a vez (depende da sua regra).
      // Aqui vou manter a vez se acertar.
    }
  };

  const nextTurn = () => {
    setCurrentTurnIndex((prev) => (prev + 1) % players.length);
  };

  const handleWin = () => {
    setStatus("won");
    // Adiciona ponto ao jogador atual
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === currentPlayer.id ? { ...p, score: p.score + 1 } : p
      )
    );
  };

  const handleFullWordGuess = () => {
    if (guessInput.toUpperCase() === currentWord) {
      handleWin();
      setIsGuessModalOpen(false);
    } else {
      // Penalidade por errar o chute: perde a vez e conta como um erro na forca?
      // Vamos fazer simples: passa a vez e adiciona um erro no boneco
      setMistakes((prev) => prev + 1);
      setIsGuessModalOpen(false);
      setGuessInput("");

      if (mistakes + 1 >= MAX_ERRORS) {
        setStatus("lost");
      } else {
        nextTurn();
      }
    }
  };

  // --- Renderização ---

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center font-sans text-slate-900">
      {/* Placar */}
      <div className="w-full max-w-4xl grid grid-cols-2 gap-4 mb-8">
        {players.map((p, idx) => (
          <Card
            key={p.id}
            className={`transition-all duration-300 border-2 ${
              currentTurnIndex === idx
                ? "border-blue-500 shadow-lg scale-105 bg-blue-50"
                : "border-transparent"
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User
                  className={
                    currentTurnIndex === idx
                      ? "text-blue-600"
                      : "text-slate-400"
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

      {/* Área do Jogo */}
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
          {/* Desenho da Forca (Simplificado com SVG/Motion) */}
          <div className="relative w-64 h-64 mb-8 bg-slate-100 rounded-lg flex justify-center items-center border border-slate-200">
            {/* Base */}
            <div className="absolute bottom-4 w-32 h-2 bg-slate-800 rounded" />
            <div className="absolute bottom-4 left-1/2 -translate-x-12 w-2 h-56 bg-slate-800 rounded" />
            <div className="absolute top-8 left-1/2 -translate-x-12 w-32 h-2 bg-slate-800 rounded" />
            <div className="absolute top-8 right-16 w-2 h-8 bg-slate-800 rounded" />

            {/* Partes do corpo (condicional baseada em mistakes) */}
            {mistakes >= 1 && ( // Cabeça
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-16 right-13 w-10 h-10 rounded-full border-4 border-slate-800"
              />
            )}
            {mistakes >= 2 && ( // Tronco
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 64 }}
                className="absolute top-26 right-17 w-2 bg-slate-800"
              />
            )}
            {mistakes >= 3 && ( // Braço Esq
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 32 }}
                className="absolute top-30 right-18 w-8 h-2 bg-slate-800 -rotate-45 origin-right"
              />
            )}
            {mistakes >= 4 && ( // Braço Dir
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 32 }}
                className="absolute top-30 right-2 w-8 h-2 bg-slate-800 rotate-45 origin-left"
              />
            )}
            {mistakes >= 5 && ( // Perna Esq
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 32 }}
                className="absolute top-42 right-18 w-8 h-2 bg-slate-800 rotate-[-60deg] origin-right"
              />
            )}
            {mistakes >= 6 && ( // Perna Dir
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 32 }}
                className="absolute top-42 right-2 w-8 h-2 bg-slate-800 rotate-60 origin-left"
              />
            )}
          </div>

          {/* Palavra Oculta */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {currentWord.split("").map((letter, index) => (
              <div
                key={index}
                className="w-10 h-12 sm:w-12 sm:h-14 border-b-4 border-slate-800 flex items-center justify-center text-3xl font-bold uppercase"
              >
                <AnimatePresence>
                  {(guessedLetters.includes(letter) ||
                    status !== "playing") && (
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={
                        !guessedLetters.includes(letter) && status === "lost"
                          ? "text-red-500"
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

          {/* Status Bar */}
          <div className="flex w-full justify-between items-center px-4 mb-4">
            <span className="text-slate-500 font-medium">
              Erros: <span className="text-red-500">{mistakes}</span> /{" "}
              {MAX_ERRORS}
            </span>
            <Button
              variant="outline"
              onClick={() => setIsGuessModalOpen(true)}
              disabled={status !== "playing"}
              className="border-blue-200 hover:bg-blue-50 text-blue-700"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Chutar Palavra
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teclado Virtual */}
      <div className="w-full max-w-4xl">
        <div className="flex flex-wrap justify-center gap-2">
          {ALPHABET.map((letter) => {
            const isUsed = guessedLetters.includes(letter);
            const isCorrect = currentWord.includes(letter);

            let btnStyle =
              "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"; // Padrão
            if (isUsed && isCorrect)
              btnStyle =
                "bg-green-100 text-green-700 border-green-300 opacity-50";
            if (isUsed && !isCorrect)
              btnStyle =
                "bg-slate-100 text-slate-300 border-slate-100 opacity-50";

            return (
              <motion.button
                key={letter}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                disabled={isUsed || status !== "playing"}
                onClick={() => handleLetterClick(letter)}
                className={`w-10 h-12 sm:w-12 sm:h-14 rounded-md border-2 font-bold text-lg shadow-sm transition-colors ${btnStyle}`}
              >
                {letter}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Modal de Game Over / Vitória */}
      <Dialog open={status !== "playing"} onOpenChange={() => {}}>
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
                ? `${currentPlayer.name} acertou a palavra e ganhou 1 ponto!`
                : "Ninguém acertou desta vez."}
            </p>
            <p className="text-xl font-bold bg-slate-100 p-2 rounded">
              A palavra era: {currentWord}
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={startNewRound}
              size="lg"
              className="w-full sm:w-auto"
            >
              Próxima Rodada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Chutar Palavra */}
      <Dialog open={isGuessModalOpen} onOpenChange={setIsGuessModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tentar acertar a palavra</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm text-slate-500">
              Se você errar, perderá a vez e contará como um erro na forca.
            </p>
            <Input
              placeholder="Digite a palavra completa..."
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFullWordGuess()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGuessModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleFullWordGuess}>Chutar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HangmanGame;
