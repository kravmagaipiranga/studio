import Link from "next/link";
import { FistIcon } from "@/components/icons";
import { RegistrationForm } from "@/components/auth/registration-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-2 text-primary">
          <FistIcon className="h-8 w-8" />
          <h1 className="text-2xl font-bold font-headline">Krav Magá IPIRANGA</h1>
      </div>
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Cadastro de Aluno</CardTitle>
          <CardDescription>
            Preencha o formulário abaixo para iniciar sua jornada de treinamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm />
          <div className="mt-4 text-center text-sm">
            Já possui uma conta?{" "}
            <Link href="/" className="underline">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
       <div className="mt-8 text-center text-sm text-muted-foreground">
        Voltar para o {" "}
        <Link href="/" className="underline underline-offset-4 hover:text-primary">
          Painel
        </Link>
      </div>
    </div>
  );
}
