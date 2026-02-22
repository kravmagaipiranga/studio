
'use client';

import { PublicWomensMonthForm } from "@/components/womens-month/public-registration-form";
import Image from "next/image";

export default function WomensMonthPublicPage() {
  return (
    <div className="min-h-screen bg-[#fff5f7] flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-pink-900 uppercase tracking-tighter mb-1">Centro de Treinamento</h1>
            <h2 className="text-4xl font-black text-pink-600 uppercase tracking-tight">Krav Magá Ipiranga</h2>
        </div>
        
        <PublicWomensMonthForm />
        
        <div className="mt-8 text-center text-pink-900/60 text-sm">
            <p>© 2025 CT Krav Magá Ipiranga. Todos os direitos reservados.</p>
            <p className="mt-1">Rua Tabor, 482 - Ipiranga - São Paulo - SP</p>
        </div>
      </div>
    </div>
  );
}
