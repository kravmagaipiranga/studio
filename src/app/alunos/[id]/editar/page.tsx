'use client';

import { doc, deleteDoc } from "firebase/firestore";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { StudentForm } from "@/components/students/student-form";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

function EditStudentSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-44" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}

export default function EditStudentPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const studentRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'students', id);
  }, [firestore, id]);

  const { data: student, isLoading } = useDoc<Student>(studentRef);

  const handleDeleteStudent = async () => {
    if (!firestore || !student) return;
    
    try {
        const studentDocRef = doc(firestore, 'students', student.id);
        await deleteDoc(studentDocRef);
        toast({
            title: "Aluno Excluído",
            description: `${student.name} foi removido com sucesso.`,
        });
        router.push('/alunos');
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao Excluir",
            description: "Não foi possível remover o aluno. Tente novamente.",
        });
    }
  }

  if (isLoading) {
    return <EditStudentSkeleton />;
  }

  if (!isLoading && !student) {
    notFound();
  }

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
            <CardHeader className="flex flex-row justify-between items-center border-b">
                <div>
                    <CardTitle>Editar Aluno</CardTitle>
                    <CardDescription>
                        Modifique os dados de {student?.name}
                    </CardDescription>
                </div>
                {student && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir Aluno
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o cadastro de <strong>{student.name}</strong>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteStudent}>Confirmar Exclusão</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-6">
                <StudentForm 
                    student={student} 
                    isEditing={true}
                />
            </CardContent>
        </Card>
    </>
  );
}
