
"use client";

import { useState } from "react";
import { ExamsTable } from "@/components/exams/exams-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Exam, Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { ExamFormDialog } from "@/components/exams/exam-form-dialog";

export default function ExamesPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const examsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'exams');
    }, [firestore]);

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: exams, isLoading: isLoadingExams } = useCollection<Exam>(examsCollection);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);


    const filteredExams = (exams || []).filter(exam =>
        exam.studentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Exames de Faixa</h1>
                <div className="flex items-center gap-2">
                     <Button onClick={() => setIsDialogOpen(true)}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Agendar Exame
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Gerar Relatório
                    </Button>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome de aluno..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DatePickerWithRange />
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <ExamsTable 
                    exams={filteredExams}
                    isLoading={isLoadingExams}
                    allStudents={students || []}
                />
            </div>
            <ExamFormDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                allStudents={students || []}
            />
        </>
    );
}

    