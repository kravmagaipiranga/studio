'use client';

import { doc } from "firebase/firestore";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { StudentForm } from "@/components/auth/registration-form";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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


export default function EditStudentPage({ params: { id } }: { params: { id: string } }) {
  const firestore = useFirestore();

  const studentRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'students', id);
  }, [firestore, id]);

  const { data: student, isLoading } = useDoc<Student>(studentRef);

  if (isLoading) {
    return <EditStudentSkeleton />;
  }

  // Apenas chame notFound DEPOIS que o carregamento estiver concluído e o aluno ainda não existir.
  if (!isLoading && !student) {
    notFound();
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
                    <CardTitle className="text-2xl">Editar Cadastro do Aluno</CardTitle>
                    <CardDescription>
                        Altere as informações de {student?.name}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StudentForm student={student!} />
                </CardContent>
            </Card>
        </div>
    </>
  );
}
