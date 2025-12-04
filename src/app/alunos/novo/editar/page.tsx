'use client';

import { StudentForm } from "@/components/students/student-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewStudentPage() {
  return (
    <>
        <div className="flex items-center justify-between mb-4">
            <Link href="/alunos">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Lista de Alunos
                </Button>
            </Link>
        </div>
        <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
                <CardTitle>Adicionar Novo Aluno</CardTitle>
                <CardDescription>
                    Preencha as informações do novo aluno
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-6">
                <StudentForm 
                    isEditing={false}
                />
            </CardContent>
        </Card>
    </>
  );
}
