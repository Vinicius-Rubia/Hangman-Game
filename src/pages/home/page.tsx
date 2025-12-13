import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/firebase/config";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { Crown, Loader2, Medal, Trophy, Tv } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface UserRank {
  id: string;
  displayName: string;
  photoURL?: string;
  stats: {
    wins: number;
    score: number; // mantendo caso queira usar para desempate
  };
}

export function HomePage() {
  const [ranking, setRanking] = useState<UserRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca os top 50 jogadores ordenados por vitórias
    const q = query(
      collection(db, "users"),
      orderBy("stats.wins", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserRank[];
      setRanking(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Função auxiliar para ícones de rank
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return (
          <Crown className="size-6 text-yellow-500 fill-yellow-500 animate-bounce" />
        );
      case 1:
        return <Medal className="size-6 text-slate-300" />;
      case 2:
        return <Medal className="size-6 text-amber-700" />;
      default:
        return (
          <span className="font-bold text-muted-foreground w-6 text-center">
            #{index + 1}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* --- CABEÇALHO --- */}
      <header className="p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Trophy className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">FORCA</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              Multiplayer
            </p>
          </div>
        </div>

        {/* Botão no Canto Superior Direito */}
        <Link to="/tv">
          <Button
            size="lg"
            className="font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            <Tv className="mr-2 size-5" />
            CRIAR SALA (TV)
          </Button>
        </Link>
      </header>

      {/* --- CONTEÚDO PRINCIPAL (RANKING) --- */}
      <main className="flex-1 flex flex-col items-center p-6 z-10 max-w-4xl mx-auto w-full">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            Ranking Global
          </h2>
          <p className="text-muted-foreground">
            Os maiores mestres das palavras
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground animate-pulse">
              Carregando lendas...
            </p>
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-20 bg-card/50 rounded-xl border border-border w-full">
            <p className="text-xl text-muted-foreground">
              Nenhum jogador registrado ainda.
            </p>
            <p className="text-sm">Seja o primeiro a vencer!</p>
          </div>
        ) : (
          <div className="w-full grid gap-4">
            {ranking.map((user, index) => (
              <Card
                key={user.id}
                className={`
                            border-border transition-all hover:scale-[1.01] hover:bg-muted/50
                            ${
                              index === 0
                                ? "bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]"
                                : "bg-card/50"
                            }
                        `}
              >
                <CardContent className="flex items-center justify-between p-4 md:p-6">
                  <div className="flex items-center gap-4 md:gap-6">
                    {/* Posição / Ícone */}
                    <div className="shrink-0 flex items-center justify-center w-10 md:w-12">
                      {getRankIcon(index)}
                    </div>

                    {/* Avatar e Nome */}
                    <div className="flex items-center gap-3 md:gap-4">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="size-10 md:size-12 rounded-full border-2 border-border"
                        />
                      ) : (
                        <div className="size-10 md:size-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg border-2 border-border">
                          {user.displayName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span
                          className={`font-bold text-lg md:text-xl ${
                            index === 0 ? "text-yellow-500" : "text-foreground"
                          }`}
                        >
                          {user.displayName}
                        </span>
                        {index === 0 && (
                          <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">
                            Campeão Atual
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score / Vitórias */}
                  <div className="flex items-center gap-2 md:gap-3 bg-background/50 px-4 py-2 rounded-full border border-border">
                    <Trophy
                      className={`size-4 md:size-5 ${
                        index === 0
                          ? "text-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="font-black text-xl md:text-2xl">
                      {user.stats?.wins || 0}
                    </span>
                    <span className="text-xs md:text-sm text-muted-foreground uppercase font-bold hidden md:inline-block">
                      Vitórias
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* --- BACKGROUND DECORATIVO --- */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-yellow-500 rounded-full blur-[150px]" />
      </div>
    </div>
  );
}
