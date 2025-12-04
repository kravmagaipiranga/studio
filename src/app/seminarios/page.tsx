
"use client";

import { useState, useEffect } from "react";
import { SeminarsTable } from "@/components/seminars/seminars-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Seminar, Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

export default function SeminariosPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [seminars, setSeminars] = useState<Seminar[]>([]);

    const seminarsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'seminars');
    }, [firestore]);
    
    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: initialSeminars, isLoading: isLoadingSeminars } = useCollection<Seminar>(seminarsCollection);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

    useEffect(() => {
        if (initialSeminars) {
            setSeminars(initialSeminars);
        }
    }, [initialSeminars]);

    const handleAddNewSeminar = () => {
       if (!firestore) return;

       const newSeminar: Seminar = {
         id: `new_${uuidv4()}`,
         topic: "",
         studentId: "",
         studentName: "",
         studentBelt: "",
         studentCpf: "",
         studentAge: 0,
         paymentStatus: "Pendente",
         paymentAmount: 100,
         paymentMethod: "Pendente",
         isNew: true,
       };
       setSeminars(prev => [newSeminar, ...prev]);
    };

    const filteredSeminars = (seminars || []).filter(seminar =>
        seminar.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seminar.topic.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isLoading = isLoadingSeminars || isLoadingStudents;

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Seminários e Cursos</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddNewSeminar}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Inscrição
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
                        placeholder="Buscar por aluno ou tema..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DatePickerWithRange />
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <SeminarsTable 
                    seminars={filteredSeminars}
                    setSeminars={setSeminars}
                    allStudents={students || []}
                    isLoading={isLoading}
                />
            </div>
        </>
    );
}
