import LogoGoogle from "@/assets/images/google-icon.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VirtualKeyboard } from "@/components/virtual-keyboard";
import { auth, db, provider } from "@/firebase/config";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import {
  collection,
  doc,
  increment,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export function MobilePage() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");

  const [user, setUser] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);

  // Inputs da fase de SETUP
  const [setupWord, setSetupWord] = useState("");
  const [setupHint, setSetupHint] = useState("");

  // 1. Autenticação e Entrada na Sala
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Entrar na sala no Firestore
        if (roomId) {
          const playerRef = doc(
            db,
            "rooms",
            roomId,
            "players",
            currentUser.uid
          );
          await setDoc(
            playerRef,
            {
              name: currentUser.displayName || "Jogador",
              score: 0,
            },
            { merge: true }
          );

          // Ouvir estado do jogo
          onSnapshot(doc(db, "rooms", roomId), (doc) =>
            setGameState(doc.data())
          );
          onSnapshot(collection(db, `rooms/${roomId}/players`), (snap) => {
            setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          });
        }
      }
    });
    return () => unsubAuth();
  }, [roomId]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);

      // Salvar perfil global
      // await setDoc(
      //   doc(db, "users", user.uid),
      //   {
      //     displayName: nameInput,
      //     stats: { score: 0, matches: 0 },
      //   },
      //   { merge: true }
      // );
    } catch (error: unknown) {
      console.log(error);
    }
  };

  // Funções de Ação do Jogo
  const submitSetup = async () => {
    if (!setupWord || !setupHint) return;
    const masked = setupWord.split("").map((l) => (l === " " ? " " : "_"));

    // Definir o primeiro jogador (que não seja o host)
    const guessers = players.filter((p) => p.id !== user.uid);
    const firstPlayer = guessers[0]?.id;

    await updateDoc(doc(db, "rooms", roomId!), {
      "gameData.word": setupWord.toUpperCase(),
      "gameData.hint": setupHint,
      "gameData.maskedWord": masked,
      "gameData.phase": "PLAYING",
      "gameData.turnPlayerId": firstPlayer,
      "gameData.usedLetters": [],
      "gameData.mistakes": 0,
    });
  };

  const handleLetterClick = async (letter: string) => {
    // Lógica de validar letra
    const currentWord = gameState.gameData.word as string;
    const isCorrect = currentWord.includes(letter);
    const newUsedLetters = [...gameState.gameData.usedLetters, letter];

    const updates: any = {
      "gameData.usedLetters": newUsedLetters,
    };

    if (isCorrect) {
      // Atualizar máscara
      const newMasked = gameState.gameData.maskedWord.map(
        (char: string, index: number) => {
          return currentWord[index] === letter ? letter : char;
        }
      );
      updates["gameData.maskedWord"] = newMasked;

      // Verificar vitória
      if (!newMasked.includes("_")) {
        updates["gameData.phase"] = "FINISHED";
        updates["status"] = "FINISHED";
        toast.success("Você acertou!");
        // Atualizar Ranking Global
        await updateDoc(doc(db, "users", user.uid), {
          "stats.score": increment(10),
          "stats.wins": increment(1),
        });
        await updateDoc(doc(db, "rooms", roomId!, "players", user.uid), {
          score: increment(10),
        });
      } else {
        toast.success("Boa! Continue jogando.");
        // Opcional: Se acertar, joga de novo? Se não, passa a vez:
        // passTurn();
      }
    } else {
      updates["gameData.mistakes"] = increment(1);
      toast.error("Errou!");
      // Passar a vez
      passTurn(updates);
      return; // passTurn já faz o update
    }

    await updateDoc(doc(db, "rooms", roomId!), updates);
  };

  const passTurn = async (extraUpdates = {}) => {
    // Achar próximo jogador
    const guessers = players.filter(
      (p) => p.id !== gameState.gameData.roundHostId
    );
    const currentIndex = guessers.findIndex((p) => p.id === user.uid);
    const nextIndex = (currentIndex + 1) % guessers.length;

    await updateDoc(doc(db, "rooms", roomId!), {
      ...extraUpdates,
      "gameData.turnPlayerId": guessers[nextIndex].id,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/40">
        <Button
          onClick={handleLogin}
          variant="secondary"
          className="w-[300px] h-16 bg-neutral-950 border mx-4"
        >
          <img src={LogoGoogle} alt="Google" className="size-6" />
          Login Google
        </Button>
      </div>
    );
  }

  if (!gameState)
    return (
      <div className="min-h-screen flex flex-col gap-2 items-center justify-center bg-black/40">
        <Loader2 className="animate-spin size-14" />
        <p className="text-2xl animate-pulse">Carregando jogo...</p>
      </div>
    );

  if (
    gameState.gameData.phase === "LOBBY" &&
    gameState.gameData.roundHostId === user.uid
  ) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl">Você está no Lobby!</h2>
        <p>Aguarde mais jogadores para poder iniciar o jogo.</p>
        <div className="mt-4 text-slate-500">
          Jogadores: {players.map((p) => p.name).join(", ")}
        </div>

        {players.length >= 2 && <Button>Iniciar jogo</Button>}
      </div>
    );
  }

  // Tela de Espera do Lobby
  if (gameState.gameData.phase === "LOBBY") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/40">
        <div className="h-screen mx-5 flex items-center justify-center">
          <span className="absolute top-4 left-0 right-0 md:left-4 text-sm text-center md:text-left text-muted-foreground">
            ID da sala: {roomId}
          </span>
          <div className="bg-neutral-950 border p-6 rounded-md text-center space-y-4">
            <h2 className="text-4xl font-bold uppercase">Lobby</h2>
            <p>Olhe para a TV e espere o jogo começar.</p>
            <span>Jogador: {user.displayName}</span>
          </div>
        </div>
      </div>
    );
  }

  // Se eu sou o HOST e estamos na fase SETUP
  if (
    gameState.gameData.phase === "SETUP" &&
    gameState.gameData.roundHostId === user.uid
  ) {
    return (
      <div className="min-h-screen flex flex-col gap-2 items-center justify-center bg-black/40 px-4">
        <div className="bg-neutral-950 border p-6 rounded-md flex flex-col gap-4 w-full max-w-md">
          <h2 className="text-2xl font-bold text-center">
            Sua vez de escolher!
          </h2>
          <Input
            placeholder="Palavra Secreta"
            value={setupWord}
            onChange={(e) => setSetupWord(e.target.value)}
          />
          <Input
            placeholder="Dica"
            value={setupHint}
            onChange={(e) => setSetupHint(e.target.value)}
          />
          <Button onClick={submitSetup}>Iniciar Rodada</Button>
        </div>
      </div>
    );
  } else if (gameState.gameData.phase === "SETUP") {
    return (
      <div className="min-h-screen flex flex-col gap-2 items-center justify-center bg-black/40">
        <Loader2 className="animate-spin size-14" />
        <p className="text-2xl animate-pulse text-center">
          Aguardando o líder da rodada escolher a palavra...
        </p>
      </div>
    );
  }

  // FASE DO JOGO (PLAYING)
  const isMyTurn = gameState.gameData.turnPlayerId === user.uid;

  return (
    <div className="relative min-h-screen flex flex-col gap-2 items-center justify-center bg-black/40 px-4">
      <div className="absolute top-4 left-4 right-4 bg-neutral-950 border p-6 rounded-md max-w-md mx-auto">
        <p className="text-sm text-center font-bold uppercase">
          {gameState.gameData.hint}
        </p>
        <div className="flex justify-center gap-2 mt-2 font-mono text-xl">
          {gameState.gameData.maskedWord.join(" ")}
        </div>
      </div>

      {isMyTurn ? (
        <div className="max-w-md mx-auto text-center">
          <div className="font-bold mb-2 animate-bounce">SUA VEZ!</div>
          <VirtualKeyboard
            word="" // Não precisamos passar a palavra real aqui para evitar cheats fáceis no front
            guessedLetters={gameState.gameData.usedLetters}
            status="playing"
            onLetterClick={handleLetterClick}
          />
          <Button className="mt-8 w-full">Chutar Palavra</Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 opacity-50">
          <p className="text-xl font-bold">
            Vez de{" "}
            {
              players.find((p) => p.id === gameState.gameData.turnPlayerId)
                ?.name
            }
          </p>
          <div className="text-4xl mt-4">🔒</div>
        </div>
      )}
    </div>
  );
}
