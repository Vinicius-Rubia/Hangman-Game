export type WordCategory = {
  dica: string;
  palavras: string[];
};

export const wordDatabase: WordCategory[] = [
  {
    dica: "Frutas Tropicais",
    palavras: ["BANANA", "ABACAXI", "MANGA", "MARACUJA", "ACEROLA"],
  },
  {
    dica: "Países da Europa",
    palavras: ["ALEMANHA", "FRANCA", "ITALIA", "ESPANHA", "PORTUGAL"],
  },
  {
    dica: "Linguagens de Programação",
    palavras: ["TYPESCRIPT", "PYTHON", "JAVA", "RUST", "GOLANG"],
  },
  {
    dica: "Partes do Computador",
    palavras: ["TECLADO", "MONITOR", "MOUSE", "PROCESSADOR", "MEMORIA"],
  },
];

export type GameRound = {
  hint: string;
  word: string;
};

export const GAME_DATA: GameRound[] = [
  { hint: "Coisas da praia", word: "GUARDA SOL" },
];
