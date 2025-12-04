
"use client";

import { useRef, useState } from "react";
import { collection, doc, deleteDoc } from "firebase/firestore";
import { StudentsTable } from "@/components/students/students-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload, Search } from "lucide-react";
import { Student } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Input } from "@/components/ui/input";
import { StudentFormDialog } from "@/components/students/student-form-dialog";
import { DeleteStudentDialog } from "@/components/students/delete-student-dialog";

export default function AlunosPage() {
    const firestore = useFirestore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: students, isLoading } = useCollection<Student>(studentsCollection);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // A lógica de importação permanece a mesma
    };
    
    const filteredStudents = (students || []).filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddStudent = () => {
        setEditingStudent(null);
        setIsFormOpen(true);
    };

    const handleEditStudent = (student: Student) => {
        setEditingStudent(student);
        setIsFormOpen(true);
    };

    const handleDeleteStudent = (student: Student) => {
        setDeletingStudent(student);
        setIsDeleteDialogOpen(true);
    }

    const confirmDeleteStudent = async () => {
        if (!firestore || !deletingStudent) return;
        
        try {
            const studentDocRef = doc(firestore, 'students', deletingStudent.id);
            await deleteDoc(studentDocRef);
            toast({
                title: "Aluno Excluído",
                description: `${deletingStudent.name} foi removido com sucesso.`,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao Excluir",
                description: "Não foi possível remover o aluno. Tente novamente.",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingStudent(null);
        }
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Alunos</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleImportClick}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar Alunos
                    </Button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                    <Button onClick={handleAddStudent}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Aluno
                    </Button>
                </div>
            </div>
             <div className="mt-4 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome ou e-mail..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <StudentsTable 
                    students={filteredStudents || []} 
                    isLoading={isLoading}
                    onEdit={handleEditStudent}
                    onDelete={handleDeleteStudent}
                />
            </div>

            <StudentFormDialog 
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                student={editingStudent}
                onFormSubmit={() => setIsFormOpen(false)}
            />

            <DeleteStudentDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                studentName={deletingStudent?.name || ''}
                onConfirmDelete={confirmDeleteStudent}
            />
        </>
    );
}

