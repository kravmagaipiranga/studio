
"use client";

import { StudentForm } from "@/components/auth/registration-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewStudentPage() {
  return (
    <>
        <div className="flex items-center justify-between mb-4">
             <Link href="/alunos">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Alunos
                </Button>
            </Link>
        </div>
        <div className="w-full max-w-2xl mx-auto">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Adicionar Novo Aluno</CardTitle>
                    <CardDescription>
                        Preencha os dados abaixo para adicionar um novo aluno ao sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StudentForm />
                </CardContent>
            </Card>
        </div>
    </>
  );
}
