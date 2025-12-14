import LogoGoogle from "@/assets/images/google-icon.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VirtualKeyboard } from "@/components/virtual-keyboard";
import { auth, db, provider } from "@/firebase/config";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { AlertTriangle, Loader2, LogOut, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export function MobilePage() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);

  const [setupWord, setSetupWord] = useState("");
  const [setupHint, setSetupHint] = useState("");
  const [kickInput, setKickInput] = useState("");

  // Função para limpar o texto (Apenas letras A-Z, sem acentos)
  const sanitizeInput = (text: string) => {
    return text
      .normalize("NFD") // Separa acentos das letras
      .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
      .replace(/[^a-zA-Z\s]/g, "") // Remove tudo que não for letra ou espaço
      .toUpperCase();
  };

  // 1. Auth e Join
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && roomId) {
        setUser(currentUser);

        // Garante perfil global
        await setDoc(
          doc(db, "users", currentUser.uid),
          {
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          },
          { merge: true }
        );

        // Entra na sala (Inicializa wins como 0 se não existir)
        await setDoc(
          doc(db, "rooms", roomId, "players", currentUser.uid),
          {
            name: currentUser.displayName || "Jogador",
            isOnline: true,
          },
          { merge: true }
        );

        // Verifica Host Inicial (Se não tiver ninguém como host, eu assumo)
        const roomDoc = await getDoc(doc(db, "rooms", roomId));
        if (roomDoc.exists()) {
          const data = roomDoc.data();
          if (!data.gameData.roundHostId) {
            await updateDoc(doc(db, "rooms", roomId), {
              "gameData.roundHostId": currentUser.uid,
            });
          }
        }

        onSnapshot(doc(db, "rooms", roomId), (doc) => setGameState(doc.data()));
        onSnapshot(collection(db, `rooms/${roomId}/players`), (snap) => {
          setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
      }
    });
    return () => unsubAuth();
  }, [roomId]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveRoom = async () => {
    if (!user || !roomId) return;

    try {
      const updates: any = {};

      // 1. Se eu for o LÍDER saindo no Lobby ou Setup, passar a liderança
      if (
        gameState.gameData.roundHostId === user.uid &&
        (gameState.gameData.phase === "LOBBY" ||
          gameState.gameData.phase === "SETUP")
      ) {
        // Pega outro jogador qualquer
        const otherPlayer = players.find((p) => p.id !== user.uid);
        updates["gameData.roundHostId"] = otherPlayer ? otherPlayer.id : null;

        // Se estiver no setup e o líder sair, volta pro lobby para evitar bug
        if (gameState.gameData.phase === "SETUP") {
          updates["gameData.phase"] = "LOBBY";
        }
      }

      // 2. Se for MINHA VEZ de jogar (PLAYING), passar a vez antes de sair
      if (
        gameState.gameData.phase === "PLAYING" &&
        gameState.gameData.turnPlayerId === user.uid
      ) {
        const guessers = players.filter(
          (p) => p.id !== gameState.gameData.roundHostId && p.id !== user.uid
        );
        // Se houver outro jogador para chutar, passa a vez
        if (guessers.length > 0) {
          updates["gameData.turnPlayerId"] = guessers[0].id;
        } else {
          // Se não sobrou ninguém pra chutar, encerra o jogo
          updates["gameData.phase"] = "FINISHED";
        }
      }

      // Se eu estava chutando, libera o jogo
      if (
        gameState.gameData.isGuessing &&
        gameState.gameData.guesserId === user.uid
      ) {
        updates["gameData.isGuessing"] = false;
        updates["gameData.guesserId"] = null;
      }

      // Aplica atualizações se necessário
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "rooms", roomId), updates);
      }

      // Remove meu documento da sala
      await deleteDoc(doc(db, "rooms", roomId, "players", user.uid));

      // Redireciona para home (ou recarrega sem parametros)
      navigate("/");
      toast.info("Você saiu da sala.");
    } catch (error) {
      console.error("Erro ao sair:", error);
      toast.error("Erro ao sair da sala.");
    }
  };

  // --- LÓGICA DE CHUTAR A PALAVRA (NOVA) ---

  const handleStartKick = async () => {
    // Trava o jogo para os outros
    await updateDoc(doc(db, "rooms", roomId!), {
      "gameData.isGuessing": true,
      "gameData.guesserId": user.uid,
    });
    setKickInput("");
  };

  const handleSubmitKick = async () => {
    const cleanKick = sanitizeInput(kickInput).trim();
    const correctWord = gameState.gameData.word;

    if (!cleanKick) return;

    if (cleanKick === correctWord) {
      // ACERTOU: Vitória instantânea
      toast.success("NA MOSCA! Você venceu!");
      await setDoc(
        doc(db, "users", user.uid),
        { stats: { wins: increment(1) } },
        { merge: true }
      );
      await setDoc(
        doc(db, "rooms", roomId!, "players", user.uid),
        { wins: increment(1) },
        { merge: true }
      );

      await updateDoc(doc(db, "rooms", roomId!), {
        "gameData.maskedWord": correctWord.split(""), // Revela tudo
        "gameData.phase": "FINISHED",
        "gameData.winnerId": user.uid,
        "gameData.isGuessing": false,
        "gameData.guesserId": null,
      });
    } else {
      // ERROU: Penalidades
      const isMyTurn = gameState.gameData.turnPlayerId === user.uid;

      // 1. Verificar pontuação atual antes de decrementar (Para não ficar negativo)
      const userDocRef = doc(db, "users", user.uid);
      const roomPlayerRef = doc(db, "rooms", roomId!, "players", user.uid);

      const userSnap = await getDoc(userDocRef);
      const roomPlayerSnap = await getDoc(roomPlayerRef);

      const currentGlobalWins = userSnap.data()?.stats?.wins || 0;
      const currentRoomWins = roomPlayerSnap.data()?.wins || 0;

      // Só decrementa se for maior que 0
      if (currentGlobalWins > 0) {
        await updateDoc(userDocRef, { "stats.wins": increment(-1) });
      }
      if (currentRoomWins > 0) {
        await updateDoc(roomPlayerRef, { wins: increment(-1) });
      }

      // 2. Definir atualizações da sala
      const updates: any = {
        "gameData.isGuessing": false,
        "gameData.guesserId": null,
      };

      // Se ERA minha vez -> Perco a vez
      if (isMyTurn) {
        const guessers = players.filter(
          (p) => p.id !== gameState.gameData.roundHostId
        );
        const currentIndex = guessers.findIndex((p) => p.id === user.uid);
        const nextIndex = (currentIndex + 1) % guessers.length;
        updates["gameData.turnPlayerId"] = guessers[nextIndex].id;
        toast.error("Errou! Perdeu 1 Troféu Global e na Sala e passou a vez.");
      } else {
        // Se NÃO era minha vez -> Só perde pontos, vez continua com quem estava
        toast.error("Errou! Perdeu 1 Troféu Global e na Sala.");
      }

      await updateDoc(doc(db, "rooms", roomId!), updates);
    }
  };

  // 2. Setup (Input da Palavra)
  const submitSetup = async () => {
    if (!setupWord.trim() || !setupHint.trim()) return;

    const cleanWord = sanitizeInput(setupWord).trim();
    const masked = cleanWord.split("").map((l) => (l === " " ? " " : "_"));

    // Validação extra antes de enviar
    if (cleanWord.length < 2) {
      toast.error("Palavra muito curta!");
      return;
    }

    const guessers = players.filter((p) => p.id !== user.uid);
    const firstPlayer = guessers.length > 0 ? guessers[0].id : null;

    await updateDoc(doc(db, "rooms", roomId!), {
      "gameData.word": cleanWord,
      "gameData.hint": setupHint,
      "gameData.maskedWord": masked,
      "gameData.phase": "PLAYING",
      "gameData.turnPlayerId": firstPlayer,
      "gameData.usedLetters": [],
      "gameData.mistakes": 0,
      "gameData.nextRoundHostId": null,
      "gameData.winnerId": null, // Resetar vencedor
      "gameData.isGuessing": false,
      "gameData.guesserId": null,
    });
  };

  // 3. Chutar Letra
  const handleLetterClick = async (letter: string) => {
    if (gameState.gameData.isGuessing) return;

    const currentWord = gameState.gameData.word as string;
    const isCorrect = currentWord.includes(letter);
    const newUsedLetters = [...gameState.gameData.usedLetters, letter];

    const updates: any = { "gameData.usedLetters": newUsedLetters };
    let roundEnded = false;

    if (isCorrect) {
      const newMasked = gameState.gameData.maskedWord.map(
        (char: string, index: number) =>
          currentWord[index] === letter ? letter : char
      );
      updates["gameData.maskedWord"] = newMasked;

      if (!newMasked.includes("_")) {
        updates["gameData.phase"] = "FINISHED";
        updates["gameData.winnerId"] = user.uid; // SALVA QUEM GANHOU
        roundEnded = true;
        toast.success("Você venceu a rodada!");

        // Incrementa VITÓRIAS Globais e na Sala
        await setDoc(
          doc(db, "users", user.uid),
          { stats: { wins: increment(1) } },
          { merge: true }
        );

        // Na sala usamos o campo 'wins' agora
        await setDoc(
          doc(db, "rooms", roomId!, "players", user.uid),
          {
            wins: increment(1),
          },
          { merge: true }
        );
      } else {
        toast.success("Boa! Acertou a letra.");
      }
    } else {
      updates["gameData.mistakes"] = increment(1);
      toast.error("Errou a letra!");
      if (gameState.gameData.mistakes + 1 >= 6) {
        updates["gameData.phase"] = "FINISHED";
        updates["gameData.winnerId"] = null; // Ninguém ganhou
        roundEnded = true;
      }
    }

    if (!roundEnded) {
      const guessers = players.filter(
        (p) => p.id !== gameState.gameData.roundHostId
      );
      const currentIndex = guessers.findIndex((p) => p.id === user.uid);
      const nextIndex = (currentIndex + 1) % guessers.length;
      updates["gameData.turnPlayerId"] = guessers[nextIndex].id;
    }

    await updateDoc(doc(db, "rooms", roomId!), updates);
  };

  // 4. Iniciar Próxima Rodada
  const startNextRound = async () => {
    await updateDoc(doc(db, "rooms", roomId!), {
      "gameData.phase": "SETUP",
      "gameData.roundHostId": user.uid,
      "gameData.nextRoundHostId": null,
      "gameData.word": "",
      "gameData.hint": "",
      "gameData.maskedWord": [],
      "gameData.mistakes": 0,
      "gameData.usedLetters": [],
      "gameData.turnPlayerId": null,
      "gameData.winnerId": null,
      "gameData.isGuessing": false,
      "gameData.guesserId": null,
    });
    setSetupWord("");
    setSetupHint("");
  };

  // --- RENDER ---
  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background/80 p-4">
        <Button
          onClick={handleLogin}
          variant="outline"
          className="w-full max-w-sm h-16 bg-card/50 text-card-foreground border-border text-lg gap-3"
        >
          <img src={LogoGoogle} alt="Google" className="size-6" />
          Entrar com Google
        </Button>
      </div>
    );
  if (!gameState)
    return (
      <div className="min-h-screen flex flex-col gap-2 items-center justify-center bg-background/80">
        <Loader2 className="animate-spin size-10 text-primary" />
        <p className="animate-pulse text-muted-foreground">
          Carregando jogo...
        </p>
      </div>
    );

  return (
    <div className="relative min-h-screen bg-background/80">
      {/* --- BOTÃO DE SAIR DA SALA (FIXO NO TOPO DIREITO) --- */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="destructive"
          size="icon"
          className="rounded-full shadow-lg"
          onClick={handleLeaveRoom}
          title="Sair da sala"
        >
          <LogOut className="size-5" />
        </Button>
      </div>

      {/* --- MODO: ALGUÉM ESTÁ CHUTANDO A PALAVRA --- */}
      {gameState.gameData.isGuessing &&
        gameState.gameData.phase === "PLAYING" && (
          <div className="fixed inset-0 z-60 bg-background/80 backdrop-blur-md flex items-center justify-center p-6">
            {gameState.gameData.guesserId === user.uid ? (
              // TELA DO JOGADOR QUE ESTÁ CHUTANDO
              <div className="bg-card/50 border border-border p-6 rounded-xl w-full max-w-sm shadow-2xl animate-in zoom-in">
                <h2 className="text-2xl font-bold text-primary mb-4 text-center">
                  Tudo ou Nada!
                </h2>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Se acertar, você ganha o jogo. Se errar,{" "}
                  <b>perde 1 ponto global e da sala.</b>
                </p>

                <Input
                  autoFocus
                  placeholder="DIGITE A PALAVRA"
                  className="text-center text-2xl uppercase font-bold tracking-widest h-14 mb-4"
                  value={kickInput}
                  onChange={(e) => setKickInput(sanitizeInput(e.target.value))}
                />

                <Button
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold w-full"
                  onClick={handleSubmitKick}
                >
                  CHUTAR
                </Button>
              </div>
            ) : (
              // TELA DOS OUTROS JOGADORES (BLOQUEADA)
              <div className="text-center flex flex-col items-center animate-pulse">
                <AlertTriangle className="size-16 text-yellow-500 mb-4" />
                <h2 className="text-3xl font-black text-foreground">
                  ATENÇÃO!
                </h2>
                <p className="text-xl mt-2 text-muted-foreground">
                  <span className="font-bold text-primary">
                    {
                      players.find((p) => p.id === gameState.gameData.guesserId)
                        ?.name
                    }
                  </span>
                  <br />
                  está chutando a palavra!
                </p>
              </div>
            )}
          </div>
        )}

      {/* LOBBY */}
      {gameState.gameData.phase === "LOBBY" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-card/50 border border-border p-6 rounded-xl w-full max-w-sm space-y-6 shadow-lg">
            <h2 className="text-3xl font-bold text-primary uppercase tracking-widest">
              Lobby
            </h2>
            <p className="text-muted-foreground">
              Sala:{" "}
              <span className="font-mono font-bold text-foreground">
                {roomId?.slice(0, 4)}
              </span>
            </p>

            <div className="py-4 border-y border-border">
              <p className="text-sm text-muted-foreground mb-2">Você é:</p>
              <p className="text-xl font-bold">{user.displayName}</p>
              {gameState.gameData.roundHostId === user.uid && (
                <p className="text-xs text-yellow-500 font-bold mt-1">
                  👑 LÍDER DA SALA
                </p>
              )}
            </div>

            {/* --- LÓGICA DE INICIAR JOGO E MÍNIMO DE JOGADORES --- */}
            {gameState.gameData.roundHostId === user.uid ? (
              <div className="space-y-2">
                {players.length >= 3 ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Todos prontos! Pode iniciar.
                    </p>
                    <Button
                      onClick={() =>
                        updateDoc(doc(db, "rooms", roomId!), {
                          "gameData.phase": "SETUP",
                        })
                      }
                      className="w-full h-12 text-lg font-bold"
                    >
                      INICIAR JOGO
                    </Button>
                  </>
                ) : (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-bold text-muted-foreground">
                      Aguardando jogadores...
                    </p>
                    <p className="text-xs mt-1">
                      Mínimo de 3 jogadores necessários ({players.length}/3)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-lg animate-pulse">
                <p className="text-sm">Aguardando o líder iniciar o jogo...</p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Jogadores na sala: {players.length}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SETUP */}
      {gameState.gameData.phase === "SETUP" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          {gameState.gameData.roundHostId === user.uid ? (
            <div className="bg-card/50 border border-border p-6 rounded-xl w-full max-w-sm space-y-4 shadow-lg">
              <h2 className="text-2xl font-bold text-center text-primary">
                Escolha a Palavra
              </h2>
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground">
                  Palavra Secreta
                </label>
                <Input
                  className="text-center uppercase tracking-widest font-bold"
                  placeholder="EX: BANANA"
                  value={setupWord}
                  onChange={(e) => setSetupWord(sanitizeInput(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground">
                  Dica para eles
                </label>
                <Input
                  className="text-center uppercase tracking-widest font-bold"
                  placeholder="EX: FRUTA AMARELA"
                  value={setupHint}
                  onChange={(e) => setSetupHint(e.target.value)}
                />
              </div>
              <Button
                onClick={submitSetup}
                className="w-full mt-4 font-bold h-12"
              >
                QUE COMECEM OS JOGOS
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Loader2 className="size-12 animate-spin text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-bold animate-pulse">
                Aguardando Palavra...
              </h3>
              <p className="text-muted-foreground">
                O líder está escolhendo a palavra secreta.
              </p>
            </div>
          )}
        </div>
      )}

      {/* FINISHED */}
      {gameState.gameData.phase === "FINISHED" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-card/50 border border-border p-8 rounded-xl w-full max-w-sm shadow-xl space-y-6">
            {gameState.gameData.winnerId ? (
              <h2 className="text-3xl font-black text-yellow-500">
                ACERTARAM!
              </h2>
            ) : (
              <h2 className="text-3xl font-black text-destructive">
                NINGUÉM ACERTOU
              </h2>
            )}

            {gameState.gameData.nextRoundHostId === user.uid ? (
              <div className="animate-in zoom-in duration-300">
                <p className="text-sm font-bold text-primary mb-2">
                  VOCÊ É O PRÓXIMO LÍDER!
                </p>
                <Button
                  onClick={startNextRound}
                  className="w-full h-14 text-lg font-bold"
                >
                  <RotateCcw className="mr-2 size-5" />
                  PRÓXIMA RODADA
                </Button>
              </div>
            ) : (
              <div className="opacity-70">
                <p className="text-sm">Aguardando o próximo líder iniciar...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PLAYING */}
      {gameState.gameData.phase === "PLAYING" && (
        <div className="flex flex-col min-h-screen">
          <div className="p-4 bg-card/50 border-b border-border sticky top-0 z-10 shadow-sm">
            <p className="text-xs text-center font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Dica
            </p>
            <p className="text-lg text-center font-bold text-primary uppercase truncate">
              {gameState.gameData.hint}
            </p>
            <div className="flex justify-center gap-1 mt-3 font-mono text-xl">
              {gameState.gameData.maskedWord.map((l: string, i: number) => (
                <span
                  key={i}
                  className={`border-b-2 w-6 text-center ${
                    l !== "_"
                      ? "border-primary text-foreground"
                      : "border-muted-foreground text-transparent"
                  }`}
                >
                  {l === " " ? "\u00A0" : l}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            {gameState.gameData.turnPlayerId === user.uid ? (
              <div className="w-full max-w-md animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="text-center mb-4">
                  <span className="inline-block bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold animate-bounce">
                    SUA VEZ!
                  </span>
                </div>
                <VirtualKeyboard
                  gameState={gameState}
                  onLetterClick={handleLetterClick}
                />
              </div>
            ) : (
              <div className="text-center opacity-60 flex flex-col items-center">
                <div className="bg-muted size-24 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold">Aguarde sua vez</h3>
                <p className="text-muted-foreground">
                  Vez de:{" "}
                  <span className="text-foreground font-bold">
                    {
                      players.find(
                        (p) => p.id === gameState.gameData.turnPlayerId
                      )?.name
                    }
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* BOTÃO FLUTUANTE DE CHUTAR (Aparece para todos que não são o host) */}
          {gameState.gameData.roundHostId !== user.uid && (
            <div className="p-4 bg-background/80 backdrop-blur border-t border-border">
              <Button
                className="w-full h-12 text-lg font-bold bg-destructive hover:bg-destructive/90 text-white animate-pulse shadow-lg shadow-destructive/20"
                onClick={handleStartKick}
              >
                <AlertTriangle className="mr-2 size-5" />
                CHUTAR PALAVRA
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
