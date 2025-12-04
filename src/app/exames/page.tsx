
"use client";

import { useState, useMemo, useEffect } from "react";
import { ExamsTable } from "@/components/exams/exams-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, Award } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Exam, Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const beltOrder: Record<string, number> = {
    'Amarela': 1,
    'Laranja': 2,
    'Verde': 3,
    'Azul': 4,
    'Marrom': 5,
    'Preta': 6,
};

const beltInfo: Record<string, { emoji: string; colorClass: string }> = {
    'Amarela': { emoji: '🟡', colorClass: 'bg-yellow-400 text-black' },
    'Laranja': { emoji: '🟠', colorClass: 'bg-orange-500 text-white' },
    'Verde':   { emoji: '🟢', colorClass: 'bg-green-500 text-white' },
    'Azul':    { emoji: '🔵', colorClass: 'bg-blue-500 text-white' },
    'Marrom':  { emoji: '🟤', colorClass: 'bg-amber-800 text-white' },
    'Preta':   { emoji: '⚫', colorClass: 'bg-gray-800 text-white' },
};


export default function ExamesPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [exams, setExams] = useState<Exam[]>([]);
    
    const examsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'exams');
    }, [firestore]);

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: initialExams, isLoading: isLoadingExams } = useCollection<Exam>(examsCollection);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

    useEffect(() => {
        if (initialExams) {
            setExams(initialExams);
        }
    }, [initialExams]);

    const examCountsByBelt = useMemo(() => {
        const counts: Record<string, number> = {};
        if (!exams) return counts;

        for (const belt of Object.keys(beltInfo)) {
            counts[belt] = 0;
        }

        exams.forEach(exam => {
            if (exam.targetBelt && counts.hasOwnProperty(exam.targetBelt)) {
                counts[exam.targetBelt]++;
            }
        });
        return counts;
    }, [exams]);


    const filteredAndSortedExams = useMemo(() => {
        if (!exams) return [];
        
        let filtered = exams.filter(exam =>
            exam.studentName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return filtered.sort((a, b) => {
            const orderA = beltOrder[a.targetBelt] || 99;
            const orderB = beltOrder[b.targetBelt] || 99;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            return a.studentName.localeCompare(b.studentName);
        });

    }, [exams, searchQuery]);


    const handleAddNewExam = () => {
       if (!firestore) return;

       const newExam: Exam = {
         id: `new_${uuidv4()}`, // Temporary ID
         studentId: "",
         studentName: "",
         studentCpf: "",
         studentAge: 0,
         examDate: new Date().toISOString().split('T')[0],
         targetBelt: "",
         paymentStatus: "Pendente",
         paymentDate: "",
         paymentAmount: 200,
         paymentMethod: "Pendente",
         isNew: true, // Flag to identify new unsaved rows
       };
       setExams(prevExams => [newExam, ...prevExams]);
    };
    
    const isLoading = isLoadingExams || isLoadingStudents;

    return (
        <>
            <div className="grid gap-2 grid-cols-6 mb-4">
                 {Object.entries(beltInfo).map(([belt, { emoji, colorClass }]) => (
                    <Card key={belt} className={cn("flex flex-col justify-center items-center w-10 h-10", colorClass)}>
                        <CardContent className="p-0 flex items-center justify-center">
                            <div className="text-lg font-bold">
                                {isLoading ? <Skeleton className="h-6 w-6 bg-white/30"/> : examCountsByBelt[belt] ?? 0}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Inscrições de Exame</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddNewExam}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agendar Exame
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
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
                    exams={filteredAndSortedExams}
                    setExams={setExams}
                    allStudents={students || []}
                    isLoading={isLoading}
                />
            </div>
        </>
    );
}
