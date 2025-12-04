
"use client";

import { useState, useEffect } from "react";
import { PrivateClassesTable } from "@/components/private-classes/private-classes-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { PrivateClass, Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

export default function AulasPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [privateClasses, setPrivateClasses] = useState<PrivateClass[]>([]);

    const privateClassesCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'privateClasses');
    }, [firestore]);

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: initialPrivateClasses, isLoading: isLoadingClasses } = useCollection<PrivateClass>(privateClassesCollection);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

    useEffect(() => {
        if (initialPrivateClasses) {
            setPrivateClasses(initialPrivateClasses);
        }
    }, [initialPrivateClasses]);
    
    const handleAddNewPrivateClass = () => {
       if (!firestore) return;

       const newClass: PrivateClass = {
         id: `new_${uuidv4()}`,
         studentId: "",
         studentName: "",
         studentBelt: "",
         classDate: new Date().toISOString().split('T')[0],
         paymentAmount: 150,
         paymentStatus: "Pendente",
         paymentMethod: "Pendente",
         isNew: true,
       };
       setPrivateClasses(prev => [newClass, ...prev]);
    };
    
    const filteredClasses = (privateClasses || []).filter(pc =>
        pc.studentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isLoading = isLoadingClasses || isLoadingStudents;

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Aulas Particulares</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddNewPrivateClass}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agendar Aula
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
                        placeholder="Buscar por aluno..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DatePickerWithRange />
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <PrivateClassesTable 
                    privateClasses={filteredClasses}
                    setPrivateClasses={setPrivateClasses}
                    allStudents={students || []}
                    isLoading={isLoading}
                />
            </div>
        </>
    );
}
