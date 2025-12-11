import { DrawingOfTheGallows } from "@/components/drawing-of-the-gallows";
import { GuessedWord } from "@/components/guessed-word";
import { PlayersScore } from "@/components/players-score";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/firebase/config";
import type { Player } from "@/types";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

// type RoomStatusType = "WAITING" | "FINISHED";
// type GameDataPhaseStatus = "LOBBY" | "SETUP" | "PLAYING" | "FINISHED";

export function TVPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  // 1. Criar Sala ao carregar
  useEffect(() => {
    const createRoom = async () => {
      const roomRef = await addDoc(collection(db, "rooms"), {
        status: "WAITING",
        createdAt: new Date(),
        gameData: {
          word: "", // palavra
          hint: "", // dica
          maskedWord: [], // máscara da palavra
          mistakes: 0, // erros
          usedLetters: [], // Letras usadas
          phase: "LOBBY", // LOBBY, SETUP, PLAYING, FINISHED
          turnPlayerId: null, // Vez do jogador
        },
      });
      setRoomId(roomRef.id);

      // Ouvir atualizações da sala
      onSnapshot(roomRef, (doc) => {
        setGameState(doc.data());
      });

      // Ouvir jogadores entrando
      onSnapshot(collection(db, `rooms/${roomRef.id}/players`), (snapshot) => {
        const playersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Player[];
        setPlayers(playersList);
      });
    };

    createRoom();
  }, []);

  if (!roomId || !gameState)
    return (
      <div className="min-h-screen flex flex-col gap-2 items-center justify-center bg-black/40">
        <Loader2 className="animate-spin size-14" />
        <p className="text-2xl animate-pulse">Criando sala...</p>
      </div>
    );

  // Renderização do Lobby (QR Code)
  if (gameState.gameData.phase === "LOBBY") {
    return (
      <div className="flex flex-col items-center justify-center gap-8 bg-black/40 min-h-screen">
        <h1 className="text-4xl font-bold">Entre no Jogo!</h1>
        <div className="bg-white p-4 rounded-xl">
          <QRCodeSVG
            value={`https://5wp3vtmp-5173.brs.devtunnels.ms/play?room=${roomId}`}
            size={256}
          />
        </div>
        <p className="text-xl">Escaneie com seu celular para entrar</p>

        <div className="grid grid-cols-3 gap-4 mt-8">
          {players.map((p) => (
            <div
              key={p.id}
              className={buttonVariants({
                size: "lg",
              })}
            >
              <span className="font-bold">{p.name}</span>
            </div>
          ))}
        </div>

        {players.length >= 2 && (
          <button
            onClick={() =>
              updateDoc(doc(db, "rooms", roomId), {
                "gameData.phase": "SETUP",
                "gameData.roundHostId": players[0].id,
              })
            }
            className="bg-green-500 text-black px-8 py-4 rounded-xl text-2xl font-bold hover:bg-green-400"
          >
            Iniciar Jogo
          </button>
        )}
      </div>
    );
  }

  // Renderização do Modo "Escolhendo Palavra"
  if (gameState.gameData.phase === "SETUP") {
    const host = players.find((p) => p.id === gameState.gameData.roundHostId);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <h1 className="text-3xl font-bold animate-pulse">
          Aguardando {host?.name} escolher a palavra secreta...
        </h1>
      </div>
    );
  }

  // Renderização do Jogo (Reaproveitando seus componentes)
  const currentPlayerIndex = players.findIndex(
    (p) => p.id === gameState.gameData.turnPlayerId
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
      <PlayersScore players={players} turnIndex={currentPlayerIndex} />

      <Card className="w-full max-w-4xl mb-6 transform scale-125 origin-top">
        <CardHeader className="text-center pb-2">
          <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold">
            Dica
          </p>
          <CardTitle className="text-2xl text-blue-600">
            {gameState.gameData.hint}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <DrawingOfTheGallows mistakes={gameState.gameData.mistakes} />
          {/* GuessedWord precisa aceitar string[] agora, adapte se necessário */}
          <GuessedWord
            word={gameState.gameData.word} // Na TV pode mostrar a palavra se quiser, ou manter masked
            guessedLetters={gameState.gameData.usedLetters}
            status={gameState.status === "FINISHED" ? "won" : "playing"}
          />
          {/* Customizar GuessedWord para usar o maskedWord vindo do firebase se quiser esconder na DOM */}
          <div className="flex gap-4 text-4xl font-bold uppercase mt-4">
            {gameState.gameData.maskedWord.map((l: string, i: number) => (
              <span
                key={i}
                className="border-b-4 border-black w-12 text-center"
              >
                {l}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
