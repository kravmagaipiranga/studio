
"use client";

import { PublicWomensMonthForm } from "@/components/womens-month/public-registration-form";
import { Star, MapPin, Shield } from "lucide-react";

export default function WomensMonthPublicPage() {
  return (
    <div className="min-h-screen bg-pink-50/30 flex flex-col items-center">
      {/* Header Minimalista */}
      <header className="w-full bg-pink-600 text-white py-10 px-4 text-center shadow-sm">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="inline-block p-2 bg-white/20 rounded-full mb-2">
            <Star className="h-6 w-6 fill-white text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Mês das Mulheres</h1>
          <p className="text-lg md:text-xl text-pink-100 font-medium">
            Sua jornada de força e segurança começa aqui.
          </p>
        </div>
      </header>

      <main className="w-full max-w-xl px-4 py-8 md:py-12">
        <div className="space-y-8">
          {/* Card de Inscrição */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PublicWomensMonthForm />
          </section>

          {/* Info Rápida de Apoio */}
          <div className="grid grid-cols-1 gap-4 text-center">
            <div className="p-4 rounded-xl bg-white border border-pink-100 shadow-sm flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-pink-600 font-bold uppercase text-xs tracking-widest">
                <MapPin className="h-4 w-4" /> Localização
              </div>
              <p className="text-pink-900 font-medium text-sm">
                Rua Tabor, 482 - Ipiranga, São Paulo - SP
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-white border border-pink-100 shadow-sm flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-pink-600 font-bold uppercase text-xs tracking-widest">
                <Shield className="h-4 w-4" /> Benefício
              </div>
              <p className="text-pink-900 font-medium text-sm">
                1 Mês de aulas gratuitas (Início imediato em Março)
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-8 text-center text-pink-400 text-xs border-t border-pink-100 mt-auto">
        <p className="font-bold">CT KRAV MAGÁ IPIRANGA</p>
        <p>© 2025 - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
