import { Toaster } from "@/components/ui/sonner";
import { HomePage } from "@/pages/home/page";
import { MobilePage } from "@/pages/mobile/page";
import { TVPage } from "@/pages/tv/page";
import { BrowserRouter, Route, Routes } from "react-router-dom";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tv" element={<TVPage />} />
        <Route path="/play" element={<MobilePage />} />
      </Routes>
      <Toaster richColors />
    </BrowserRouter>
  );
}
