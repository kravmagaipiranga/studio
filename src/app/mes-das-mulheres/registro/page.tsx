
"use client";

import { PublicWomensMonthForm } from "@/components/womens-month/public-registration-form";
import { Shield, MapPin } from "lucide-react";
import Image from "next/image";

export default function WomensMonthPublicPage() {
  return (
    <div className="min-h-screen bg-pink-50/20 pb-12">
      {/* Header Minimalista */}
      <header className="bg-white border-b border-pink-100 py-8 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex justify-center mb-2">
            <Image 
              src="https://yata-apix-c1ca31d6-cb5d-4e4c-94a2-7c6a7dc7c677.s3-object.locaweb.com.br/c6d53faa65104a2184f1b46b987eaa23.png"
              alt="Logo Krav Magá Ipiranga"
              width={200}
              height={80}
              className="h-auto w-auto max-h-20 object-contain"
              priority
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-pink-900 tracking-tight uppercase">
              Mês das Mulheres
            </h1>
            <p className="text-lg text-pink-700 font-medium">
              Garanta sua vaga para um mês de aulas gratuitas de Krav Magá.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto py-10 px-4">
        {/* Resumo de Informações */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-sm">
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-pink-100 shadow-sm">
            <Shield className="h-5 w-5 text-pink-600 shrink-0" />
            <span className="text-pink-900 font-medium">Treinamento de Defesa Pessoal</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-pink-100 shadow-sm">
            <MapPin className="h-5 w-5 text-pink-600 shrink-0" />
            <span className="text-pink-900 font-medium">Rua Tabor, 482 - Ipiranga</span>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
          <div className="bg-pink-600 p-4 text-white text-center">
            <p className="text-sm font-bold uppercase tracking-widest">Ficha de Inscrição</p>
          </div>
          <div className="p-6 md:p-8">
            <PublicWomensMonthForm />
          </div>
        </div>

        {/* Footer Simples */}
        <footer className="mt-12 text-center space-y-4">
          <p className="text-pink-400 text-xs font-bold uppercase tracking-widest">
            Centro de Treinamento Krav Magá Ipiranga
          </p>
          <div className="h-px w-12 bg-pink-200 mx-auto"></div>
          <p className="text-pink-300 text-[10px]">© 2025 - Segurança e Empoderamento Feminino</p>
        </footer>
      </main>
    </div>
  );
}
