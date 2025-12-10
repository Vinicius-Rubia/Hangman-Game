import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface KickWordModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  onFullWordGuess: () => void;
}

export function KickWordModal({
  open,
  setOpen,
  inputValue,
  setInputValue,
  onFullWordGuess,
}: KickWordModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tentar acertar a palavra</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="py-4 space-y-2">
          <p className="text-sm text-slate-500">
            Se você errar, perderá a vez e 1 ponto de vitória.
          </p>
          <Input
            placeholder="Digite a palavra completa..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onFullWordGuess()}
            autoFocus
          />
        </div>
        <AlertDialogFooter>
          <Button onClick={onFullWordGuess} className="w-full">
            Chutar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
