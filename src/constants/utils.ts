import { GAME_DATA } from "@/data";

export function getRandomGameData() {
  const randomCatIndex = Math.floor(Math.random() * GAME_DATA.length);
  const category = GAME_DATA[randomCatIndex];

  return {
    word: category.word.toUpperCase(),
    hint: category.hint,
  };
}

export const MAX_ERRORS = 6;
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
