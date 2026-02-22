"use client";

import { PublicWomensMonthForm } from "@/components/womens-month/public-registration-form";
import { Shield, Heart, Star, MapPin } from "lucide-react";

export default function WomensMonthPublicPage() {
  return (
    <div className="min-h-screen bg-pink-50/30">
      <header className="bg-pink-600 text-white py-12 px-4 text-center shadow-md">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-block p-2 bg-white/20 rounded-full mb-2">
            <Star className="h-8 w-8 fill-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">MÊS DAS MULHERES</h1>
          <p className="text-xl md:text-2xl text-pink-100 font-medium">
            Um mês de aulas gratuitas de Krav Magá para você descobrir sua força.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
              <h2 className="text-2xl font-bold text-pink-900 mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-pink-600" /> Por que participar?
              </h2>
              <ul className="space-y-4 text-pink-800">
                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                  <p>Aprenda técnicas reais de defesa pessoal para o dia a dia.</p>
                </li>
                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                  <p>Aumente sua autoconfiança e controle emocional.</p>
                </li>
                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                  <p>Treine em um ambiente seguro, respeitoso e acolhedor.</p>
                </li>
              </ul>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
              <h2 className="text-2xl font-bold text-pink-900 mb-4 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-pink-600" /> Onde Treinar?
              </h2>
              <div className="text-pink-800 space-y-2">
                <p className="font-bold">Centro de Treinamento Krav Magá Ipiranga</p>
                <p>Rua Tabor, 482 - Ipiranga - São Paulo - SP</p>
                <p className="text-sm italic">Referência: Próximo ao Museu do Ipiranga.</p>
              </div>
            </section>

            <div className="p-6 bg-pink-600 rounded-2xl text-white shadow-lg">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Heart className="h-5 w-5 fill-white" /> Traga uma amiga!
              </h3>
              <p className="text-pink-100">
                O treino fica ainda melhor quando compartilhado. Você pode trazer acompanhantes e elas também ganham o mês gratuito!
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-8">
            <PublicWomensMonthForm />
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-pink-100 text-center text-pink-400 text-sm">
        <p>© 2025 Centro de Treinamento Krav Magá Ipiranga</p>
        <p>Segurança e Empoderamento Feminino</p>
      </footer>
    </div>
  );
}
