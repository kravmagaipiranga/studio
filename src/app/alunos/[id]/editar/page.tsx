
'use client';

import { deleteDoc, doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Student } from "@/lib/types";
import { StudentForm } from "@/components/students/student-form";
import { notFound, useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function EditStudentPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleDeleteStudent = async () => {
    if (!firestore || !id) return;
    
    try {
        const studentDocRef = doc(firestore, 'students', id);
        // We need student name for the toast, this is a bit tricky without fetching data here
        // For now, we will show a generic message or assume the form has the data.
        // A better approach might be to pass student name to this function.
        await deleteDoc(studentDocRef);
        toast({
            title: "Aluno Excluído",
            description: `O cadastro foi removido com sucesso.`,
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

  if (!id) {
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
                        Modifique os dados do aluno
                    </CardDescription>
                </div>
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
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o cadastro do aluno.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteStudent}>Confirmar Exclusão</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-6">
                <StudentForm 
                    studentId={id} 
                    isEditing={true}
                />
            </CardContent>
        </Card>
    </>
  );
}
