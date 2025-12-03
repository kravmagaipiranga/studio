
"use client";

import { useState } from "react";
import { ExamsTable } from "@/components/exams/exams-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Exam } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export default function ExamesPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");

    const examsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        // This should query a subcollection, e.g., /students/{studentId}/exams
        // For simplicity, we assume a top-level 'exams' collection for now.
        // A better structure would be to get all students, then query their exams subcollections.
        return collection(firestore, 'exams');
    }, [firestore]);

    const { data: exams, isLoading } = useCollection<Exam>(examsCollection);

    const filteredExams = (exams || []).filter(exam =>
        exam.studentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Exames de Faixa</h1>
                <div className="flex items-center gap-2">
                     <Button>
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
                    isLoading={isLoading}
                />
            </div>
        </>
    );
}
