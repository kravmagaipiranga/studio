
'use client';

import { StudentForm } from "@/components/students/student-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Adicionar Novo Aluno</CardTitle>
                    <CardDescription>Crie um novo cadastro.</CardDescription>
                </CardHeader>
                <CardContent>
                    <StudentForm isEditing={false} />
                </CardContent>
            </Card>
        </>
    );
}
