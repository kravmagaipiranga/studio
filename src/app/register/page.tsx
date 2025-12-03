import { StudentForm } from "@/components/auth/registration-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-lg mx-auto">
            <div className="mb-8 flex flex-col items-center gap-2 text-primary">
                <h1 className="text-3xl font-bold">Krav Magá IPIRANGA</h1>
            </div>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Cadastro de Aluno</CardTitle>
                    <CardDescription>
                        Preencha o formulário para iniciar sua jornada.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StudentForm />
                </CardContent>
            </Card>
            <div className="mt-6 text-center text-sm text-muted-foreground">
                Já é parte da equipe? {" "}
                <Link href="/dashboard" className="underline underline-offset-4 hover:text-primary">
                    Voltar ao Painel
                </Link>
            </div>
        </div>
    </div>
  );
}
