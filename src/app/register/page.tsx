'use client';

import { PublicRegistrationForm } from '@/components/students/public-registration-form';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-muted/40 p-4 sm:p-8">
        <div className="w-full max-w-2xl mx-auto">
            <div className="mb-8 flex flex-col items-center gap-2 text-primary">
              <h1 className="text-3xl font-bold text-center">Krav Magá IPIRANGA</h1>
              <p className="text-muted-foreground text-center">Ficha de Cadastro de Novo Aluno</p>
            </div>
            <PublicRegistrationForm />
        </div>
    </div>
  );
}
