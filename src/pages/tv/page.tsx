import { DrawingOfTheGallows } from "@/components/drawing-of-the-gallows";
import { db } from "@/firebase/config";
import type { Player } from "@/types";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import {
  AlertTriangle,
  Crown,
  Loader2,
  Skull,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function TVPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  const [isMuted, setIsMuted] = useState(true);
  const hasPlayedResultRef = useRef(false);

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const victoryRef = useRef<HTMLAudioElement | null>(null);
  const gameoverRef = useRef<HTMLAudioElement | null>(null);

  // 0. Inicializar Áudios
  useEffect(() => {
    bgmRef.current = new Audio("/sounds/background.mp3");
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.3;

    victoryRef.current = new Audio("/sounds/victory.mp3");
    victoryRef.current.volume = 0.8;

    gameoverRef.current = new Audio("/sounds/game-over.mp3");
    gameoverRef.current.volume = 0.8;

    const startBgm = async () => {
      try {
        await bgmRef.current?.play();
        setIsMuted(false);
      } catch (error) {
        console.log("Autoplay bloqueado. Aguardando clique.");
        setIsMuted(true);
      }
    };
    startBgm();
  }, []);

  // 1. Criar Sala
  useEffect(() => {
    const createRoom = async () => {
      const roomRef = await addDoc(collection(db, "rooms"), {
        status: "WAITING",
        createdAt: new Date(),
        gameData: {
          word: "",
          hint: "",
          maskedWord: [],
          mistakes: 0,
          usedLetters: [],
          phase: "LOBBY",
          turnPlayerId: null,
          roundHostId: null,
          pastHosts: [],
          nextRoundHostId: null,
          winnerId: null, // Novo campo
        },
      });
      setRoomId(roomRef.id);
      onSnapshot(roomRef, (doc) => setGameState(doc.data()));
      onSnapshot(collection(db, `rooms/${roomRef.id}/players`), (snapshot) => {
        // Ordena por Vitórias (wins)
        const playersList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Player[];
        setPlayers(
          playersList.sort((a: any, b: any) => (b.wins || 0) - (a.wins || 0))
        );
      });
    };
    createRoom();
  }, []);

  // 2. Calcular Próximo Host
  // 2. Calcular Próximo Host e Resetar Flag de Som
  useEffect(() => {
    if (!roomId || !gameState) return;

    // --- RESETAR SOM DE RESULTADO SE SAIR DO FIM DE JOGO ---
    if (gameState.gameData.phase !== "FINISHED") {
      // MUDANÇA AQUI: Atualiza o valor do Ref sem causar re-render
      hasPlayedResultRef.current = false;

      victoryRef.current?.pause();
      if (victoryRef.current) victoryRef.current.currentTime = 0;
      gameoverRef.current?.pause();
      if (gameoverRef.current) gameoverRef.current.currentTime = 0;
    }

    if (gameState.gameData.phase !== "FINISHED") return;
    if (gameState.gameData.nextRoundHostId) return;

    const calculateNextHost = async () => {
      const currentHostId = gameState.gameData.roundHostId;
      const newPastHosts = [...(gameState.gameData.pastHosts || [])];
      if (currentHostId && !newPastHosts.includes(currentHostId))
        newPastHosts.push(currentHostId);

      let candidates = players.filter((p) => !newPastHosts.includes(p.id));
      if (candidates.length === 0) candidates = players;

      const nextHost = candidates[0];
      if (nextHost) {
        await updateDoc(doc(db, "rooms", roomId), {
          "gameData.nextRoundHostId": nextHost.id,
          "gameData.pastHosts":
            newPastHosts.length === players.length ? [] : newPastHosts,
        });
      }
    };
    calculateNextHost();
  }, [gameState?.gameData?.phase, players.length]);

  // --- 3. LÓGICA DE TOCAR OS SONS ---
  useEffect(() => {
    if (isMuted || !gameState) {
      bgmRef.current?.pause();
      victoryRef.current?.pause();
      gameoverRef.current?.pause();
      return;
    }

    // REGRA 1: BGM toca SEMPRE se não estiver mutado
    if (bgmRef.current?.paused) {
      bgmRef.current.play().catch(() => {});
    }

    // REGRA 2: Sons de Resultado
    if (gameState.gameData.phase === "FINISHED") {
      // MUDANÇA AQUI: Verifica o current do Ref
      if (!hasPlayedResultRef.current) {
        if (gameState.gameData.winnerId) {
          victoryRef.current?.play().catch(() => {});
        } else {
          gameoverRef.current?.play().catch(() => {});
        }
        // MUDANÇA AQUI: Atualiza o Ref (não dispara re-render)
        hasPlayedResultRef.current = true;
      }
    }
  }, [gameState?.gameData?.phase, gameState?.gameData?.winnerId, isMuted]); // Removi hasPlayedResult das dependências

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);

    if (!newState) {
      bgmRef.current?.play().catch(() => {});
    } else {
      bgmRef.current?.pause();
      victoryRef.current?.pause();
      gameoverRef.current?.pause();
    }
  };

  if (!roomId || !gameState)
    return (
      <div className="min-h-screen flex flex-col gap-2 items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 className="animate-spin size-14 text-primary" />
        <p className="text-2xl animate-pulse text-foreground">
          Criando sala...
        </p>
      </div>
    );

  // LOBBY
  if (gameState.gameData.phase === "LOBBY") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background/80 text-foreground">
        <button
          onClick={toggleMute}
          className="absolute top-8 right-8 p-3 bg-card border border-border rounded-full hover:bg-muted transition-colors z-50"
        >
          {isMuted ? (
            <VolumeX className="text-destructive size-8 animate-pulse" />
          ) : (
            <Volume2 className="text-green-500 size-8" />
          )}
        </button>
        <div className="flex flex-col items-center justify-center gap-8 border border-border p-8 rounded-2xl bg-card/50 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-4 rounded-xl shadow-lg shadow-primary/20">
            {/* Ajuste a URL base conforme necessário */}
            <QRCodeSVG
              value={`${window.location.origin}/play?room=${roomId}`}
              size={256}
            />
          </div>
          <p className="text-2xl font-light text-muted-foreground">
            Escaneie para entrar
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 justify-center max-w-4xl px-4">
          {players.length === 0 && (
            <p className="animate-pulse text-2xl text-muted-foreground">
              Aguardando jogadores...
            </p>
          )}
          {players.map((p) => (
            <div
              key={p.id}
              className="bg-card px-6 py-3 rounded-full flex items-center gap-3 border border-border shadow-sm animate-in slide-in-from-bottom-4"
            >
              <div
                className={`w-3 h-3 rounded-full shadow-[0_0_10px] ${
                  p.id === gameState.gameData.roundHostId
                    ? "bg-yellow-500 shadow-yellow-500"
                    : "bg-green-500 shadow-green-500"
                }`}
              />
              <span className="font-bold text-lg text-card-foreground">
                {p.name} {p.id === gameState.gameData.roundHostId && "👑"}
              </span>
            </div>
          ))}
        </div>

        {/* Mensagem informativa na TV */}
        {players.length >= 2 && (
          <p className="mt-8 text-lg animate-pulse text-primary font-semibold">
            Aguardando o líder iniciar a partida pelo celular...
          </p>
        )}
      </div>
    );
  }

  // SETUP
  if (gameState.gameData.phase === "SETUP") {
    const host = players.find((p) => p.id === gameState.gameData.roundHostId);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background/80 text-foreground">
        <button
          onClick={toggleMute}
          className="absolute top-8 right-8 p-3 bg-card border border-border rounded-full z-50"
        >
          {isMuted ? (
            <VolumeX className="text-destructive size-6 animate-pulse" />
          ) : (
            <Volume2 className="text-green-500 size-6" />
          )}
        </button>
        <div className="animate-bounce mb-4 text-6xl">🤫</div>
        <h1 className="text-4xl font-bold text-center px-4">
          Aguardando <span className="text-primary">{host?.name}</span> escolher
          a palavra...
        </h1>
        <p className="text-muted-foreground mt-4">
          Olhe para o seu celular se você for o escolhido!
        </p>
      </div>
    );
  }

  // JOGO - LAYOUT OTIMIZADO
  const currentPlayer = players.find(
    (p) => p.id === gameState.gameData.turnPlayerId
  );
  const winner = players.find((p) => p.id === gameState.gameData.winnerId);

  return (
    <div className="h-screen w-screen bg-background/80 overflow-hidden flex flex-col">
      <button
        onClick={toggleMute}
        className="absolute top-6 right-6 p-2 bg-card/80 border border-border rounded-full z-50 hover:bg-card transition-all"
      >
        {isMuted ? (
          <VolumeX className="text-destructive size-6 animate-pulse" />
        ) : (
          <Volume2 className="text-green-500 size-6" />
        )}
      </button>

      {/* 1. TOPO: Informações Rápidas */}
      <div className="h-[15vh] flex items-center justify-between px-12 border-b border-border bg-card/50">
        <div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Dica da Rodada
          </p>
          <h2 className="text-4xl font-black text-primary uppercase">
            {gameState.gameData.hint}
          </h2>
        </div>
        {gameState.gameData.phase === "PLAYING" && (
          <div className="flex items-center gap-4 bg-muted/50 px-6 py-3 rounded-full border border-border">
            <span className="text-muted-foreground font-semibold uppercase">
              Jogando:
            </span>
            <span className="text-3xl font-bold text-yellow-400 animate-pulse">
              {currentPlayer?.name}
            </span>
          </div>
        )}
      </div>

      {/* 2. CENTRO: A Forca (Gigante) e a Palavra */}
      <div className="flex-1 flex items-center relative p-10 gap-16">
        {/* Forca Esquerda */}
        <div className="shrink-0 transform scale-150 origin-center">
          <DrawingOfTheGallows mistakes={gameState.gameData.mistakes} />
        </div>

        {/* Palavra Direita */}
        <div className="flex flex-col gap-8 items-center flex-1">
          <div className="flex flex-wrap justify-center gap-4">
            {gameState.gameData.maskedWord.map((l: string, i: number) => {
              const isRevealed = l !== "_" && l !== " ";
              return (
                <div
                  key={i}
                  className={`
                            w-20 h-24 flex items-center justify-center text-6xl font-black rounded-xl border-b-8 transition-all duration-300
                            ${
                              l === " "
                                ? "border-transparent"
                                : "bg-card border-border shadow-lg"
                            }
                            ${
                              isRevealed
                                ? "bg-primary text-primary-foreground border-primary-foreground/30"
                                : "text-foreground"
                            }
                        `}
                >
                  {l}
                </div>
              );
            })}
          </div>

          {/* Teclado Visual Mini */}
          <div className="flex flex-wrap justify-center gap-2 max-w-xl mt-8">
            {ALPHABET.map((letter) => {
              const status = gameState.gameData.usedLetters.includes(letter)
                ? gameState.gameData.word.includes(letter)
                  ? "bg-green-900 text-white border-green-600"
                  : "bg-red-950 text-white border-destructive/50"
                : "bg-muted text-muted-foreground border-transparent";
              return (
                <div
                  key={letter}
                  className={`size-9 text-sm font-bold flex items-center justify-center rounded border ${status}`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. RODAPÉ: Ranking Horizontal (Só Vitórias) */}
      <div className="h-[15vh] bg-card/50 border-t border-border flex items-center px-8 gap-6 overflow-x-auto">
        <div className="flex items-center gap-2 mr-4 border-r border-border pr-6">
          <Trophy className="size-8 text-yellow-500" />
          <span className="font-black text-xl text-foreground uppercase tracking-widest">
            Ranking
          </span>
        </div>
        {players.map((p: any) => (
          <div
            key={p.id}
            className="flex flex-col items-center min-w-[100px] p-2 rounded-lg bg-muted/30 border border-border/50"
          >
            <span
              className={`font-bold text-lg truncate w-full text-center ${
                p.id === gameState.gameData.roundHostId
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              {p.name}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Crown className="size-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xl font-black">{p.wins || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* OVERLAY: ALGUÉM ESTÁ CHUTANDO */}
      {gameState.gameData.isGuessing &&
        gameState.gameData.phase === "PLAYING" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center gap-6 max-w-4xl p-10">
              <div className="relative">
                <AlertTriangle className="size-48 text-yellow-500 animate-bounce" />
                <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 rounded-full"></div>
              </div>
              <div>
                <h2 className="text-7xl font-black text-yellow-500 tracking-tighter mb-2">
                  Atenção!
                </h2>
                <p className="text-4xl text-foreground font-light">
                  <span className="font-bold text-primary">
                    {
                      players.find((p) => p.id === gameState.gameData.guesserId)
                        ?.name
                    }
                  </span>{" "}
                  está chutando a palavra!
                </p>
              </div>
            </div>
          </div>
        )}

      {/* OVERLAY FIM DE JOGO */}
      {gameState.gameData.phase === "FINISHED" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center text-center gap-6 max-w-4xl p-10">
            {gameState.gameData.winnerId ? (
              <>
                <div className="relative">
                  <Trophy className="size-48 text-yellow-500 animate-bounce" />
                  <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 rounded-full"></div>
                </div>
                <div>
                  <h2 className="text-7xl font-black text-yellow-500 tracking-tighter mb-2">
                    VENCEDOR!
                  </h2>
                  <p className="text-4xl text-foreground font-light">
                    Parabéns,{" "}
                    <span className="font-bold text-primary">
                      {winner?.name}
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <Skull className="size-48 text-destructive animate-pulse" />
                <h2 className="text-7xl font-black text-destructive tracking-tighter">
                  GAME OVER
                </h2>
                <p className="text-3xl text-muted-foreground">
                  A forca venceu desta vez.
                </p>
              </>
            )}

            <div className="bg-card/50 border border-border px-12 py-6 rounded-2xl shadow-2xl mt-8">
              <p className="text-sm uppercase text-muted-foreground font-bold tracking-[0.5em] mb-2">
                A palavra era
              </p>
              <p className="text-6xl font-black text-foreground">
                {gameState.gameData.word}
              </p>
            </div>

            <p className="mt-8 text-xl animate-pulse text-primary">
              Próximo Líder:{" "}
              <span className="font-bold">
                {
                  players.find(
                    (p) => p.id === gameState.gameData.nextRoundHostId
                  )?.name
                }
              </span>{" "}
              (Aguardando no celular...)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
