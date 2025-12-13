import { motion } from "framer-motion";

interface BodyPartsProps {
  mistakes: number;
}
export function BodyParts({ mistakes }: BodyPartsProps) {
  return (
    <>
      {mistakes >= 1 && ( // Cabeça
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-16 right-12 w-10 h-10 rounded-full border-8 border-yellow-400"
        />
      )}
      {mistakes >= 2 && ( // Tronco
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 46 }}
          className="absolute top-26 right-16 w-2 bg-yellow-400"
        />
      )}
      {mistakes >= 3 && ( // Braço Esq
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 32 }}
          className="absolute top-28 right-17 w-8 h-2 bg-yellow-400 -rotate-45 origin-right"
        />
      )}
      {mistakes >= 4 && ( // Braço Dir
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 32 }}
          className="absolute top-28 right-9 w-8 h-2 bg-yellow-400 rotate-45 origin-left"
        />
      )}
      {mistakes >= 5 && ( // Perna Esq
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 32 }}
          className="absolute top-36 right-17 w-8 h-2 bg-yellow-400 rotate-[-60deg] origin-right"
        />
      )}
      {mistakes >= 6 && ( // Perna Dir
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 32 }}
          className="absolute top-36 right-9 w-8 h-2 bg-yellow-400 rotate-60 origin-left"
        />
      )}
    </>
  );
}
