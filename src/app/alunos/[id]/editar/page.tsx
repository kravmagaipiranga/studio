

'use client';

import { doc } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { StudentForm } from "@/components/auth/registration-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function EditStudentSkeleton() {
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-10 w-44" />
            </div>
            <Card className="w-full max-w-3xl mx-auto">
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

export default function EditStudentPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const firestore = useFirestore();
  const isCreating = id === 'novo';

  const studentRef = useMemoFirebase(() => {
    if (isCreating || !firestore || !id) return null;
    return doc(firestore, 'students', id);
  }, [firestore, id, isCreating]);

  const { data: student, isLoading } = useDoc<Student>(studentRef);

  if (isLoading && !isCreating) {
    return <EditStudentSkeleton />;
  }

  if (!isLoading && !student && !isCreating) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-10">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Erro 404</CardTitle>
                    <CardDescription>Aluno não encontrado</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">O aluno que você está tentando editar não foi encontrado. Ele pode ter sido excluído.</p>
                     <Link href="/alunos">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para a Lista de Alunos
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
  }

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
        <div className="w-full max-w-3xl mx-auto">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{isCreating ? "Adicionar Novo Aluno" : "Editar Cadastro do Aluno"}</CardTitle>
                    <CardDescription>
                        {isCreating ? "Preencha a ficha cadastral completa do novo aluno." : `Altere as informações de ${student?.name}.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StudentForm student={student} isEditing={!isCreating} />
                </CardContent>
            </Card>
        </div>
    </>
  );
}
