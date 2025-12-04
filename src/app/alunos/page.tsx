
"use client";

import { useState } from "react";
import { collection, doc, deleteDoc } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/types";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function AlunosPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [selectedStudent, setSelectedStudent] = useState<Student | 'new' | null>(null);

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: students, isLoading } = useCollection<Student>(studentsCollection);

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
    };

    const handleAddNew = () => {
        setSelectedStudent('new');
    };

    const handleFormSubmit = () => {
        setSelectedStudent(null);
    }
    
    const handleDeleteStudent = async () => {
        if (!firestore || !selectedStudent || selectedStudent === 'new') return;
        
        try {
            const studentDocRef = doc(firestore, 'students', selectedStudent.id);
            await deleteDoc(studentDocRef);
            toast({
                title: "Aluno Excluído",
                description: `${selectedStudent.name} foi removido com sucesso.`,
            });
            setSelectedStudent(null);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao Excluir",
                description: "Não foi possível remover o aluno. Tente novamente.",
            });
        }
    }

    const studentToEdit = selectedStudent && selectedStudent !== 'new' ? selectedStudent : null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-100px)]">
            {/* Coluna da Lista de Alunos */}
            <Card className="md:col-span-1 lg:col-span-1 h-full flex flex-col">
                <CardHeader className="border-b">
                    <CardTitle>Alunos Cadastrados</CardTitle>
                    <CardDescription>Selecione um aluno para editar</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-grow">
                    <Button onClick={handleAddNew} className="w-[calc(100%-1rem)] m-2">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Novo Aluno
                    </Button>
                    <ScrollArea className="h-[calc(100%-80px)]">
                        <div className="p-2 space-y-1">
                            {isLoading && Array.from({ length: 7 }).map((_, index) => (
                                <Skeleton key={index} className="h-10 w-full" />
                            ))}
                            {!isLoading && students?.map((student) => (
                                <button
                                    key={student.id}
                                    onClick={() => handleSelectStudent(student)}
                                    className={cn(
                                        "w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        studentToEdit?.id === student.id
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <User className="h-4 w-4" />
                                    {student.name}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Coluna do Formulário/Detalhes */}
            <div className="md:col-span-2 lg:col-span-3 h-full">
                {selectedStudent ? (
                    <Card className="h-full flex flex-col">
                        <CardHeader className="flex flex-row justify-between items-center border-b">
                            <div>
                                <CardTitle>{studentToEdit ? "Editar Aluno" : "Adicionar Novo Aluno"}</CardTitle>
                                <CardDescription>
                                    {studentToEdit ? `Modifique os dados de ${studentToEdit.name}` : "Preencha as informações do novo aluno"}
                                </CardDescription>
                            </div>
                            {studentToEdit && (
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
                                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o cadastro de <strong>{studentToEdit.name}</strong>.
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
                                student={studentToEdit} 
                                onFormSubmit={handleFormSubmit} 
                                isEditing={!!studentToEdit}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="h-full flex items-center justify-center bg-muted/20 border-dashed">
                        <div className="text-center text-muted-foreground">
                            <User className="mx-auto h-12 w-12" />
                            <p className="mt-4">Selecione um aluno na lista para ver os detalhes</p>
                            <p>ou</p>
                            <Button variant="link" className="p-0 h-auto" onClick={handleAddNew}>adicione um novo aluno</Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
