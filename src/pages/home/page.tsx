import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50">
      <h1 className="text-4xl font-extrabold text-slate-900">
        Jogo da Forca Multiplayer
      </h1>
      <div className="flex gap-4">
        <Link to="/tv">
          <Button size="lg" className="h-24 w-48 text-xl">
            📺 Criar Sala (TV)
          </Button>
        </Link>
        {/* O botão de entrar pelo celular geralmente não é necessário pois eles usam o QR Code, 
            mas pode deixar para testes */}
      </div>
    </div>
  );
}
